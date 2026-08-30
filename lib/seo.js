/* =============================================================================
   SEO — structured data (JSON-LD) for the public site.

   Everything here is a pure function: it takes already-resolved values (CMS
   content, approved reviews, an absolute base URL) and returns plain objects.
   No I/O, no env reads, no HTML. The view's only job is to hand over the data
   and serialise the result, which keeps the schema readable and reviewable in
   one place instead of being a wall of scriptlet in views/index.ejs.

   Two rules this module holds to, deliberately:

     1. NOTHING IS INVENTED. Every property is derived from real data. If the
        data isn't there, the property (or the whole node) is omitted. An
        omitted field costs nothing; a fabricated one is a Google manual-action
        risk and, for ratings specifically, an outright policy violation.

     2. MARKUP MATCHES VISIBLE CONTENT. Ratings and reviews are only emitted
        for reviews the page actually renders (views/index.ejs #reviews), and
        the page shows the aggregate figure in text next to the carousel.

   ---------------------------------------------------------------------------
   Types we emit, and why:

     Organization  The business entity, ALSO typed ProfessionalService (a
     + Professional  LocalBusiness subtype). This used to be Organization only,
       Service       on the grounds that a LocalBusiness subtype is dishonest
                   without a real address or a declared service area. That
                   changed: Darsh now has a verified Google Business Profile
                   declaring a northern-Indiana service area, so the geography
                   below is corroborated by a source outside this repo rather
                   than invented to win a rich result. See LOCAL below.

                   Still NO streetAddress. Darsh is a service-area business and
                   Google hides the address for those; publishing one here
                   would contradict the Business Profile, and mismatched NAP
                   data across sources actively hurts local ranking.
     WebSite       Names the site as an entity and ties it to the publisher.
                   No SearchAction — see buildWebSite().

   Types we deliberately do NOT emit from the homepage:

     FAQPage       The homepage has no Q&A content. The "why" points and
                   "process" steps are statements, not questions, and inventing
                   questions to farm an FAQ rich result is exactly the sort of
                   markup/content mismatch Google acts on manually.
     BreadcrumbList  A single-crumb trail on the site root says nothing. The
                   builder is exported for the /services pages, which have a
                   real Home > Services > <service> trail.
   ============================================================================= */

import { services as SERVICES } from './services-data.js';

/**
 * Service slugs that have a real page at /services/<slug>.
 *
 * DERIVED, not hand-listed. `routes/public.js` generates a route and a sitemap
 * entry for every entry in `services`, so a hardcoded subset here goes stale the
 * moment a service is added or removed — and it already had: this was pinned to
 * six slugs while all twelve shipped pages, which silently withheld an internal
 * link and an offer-catalog `url` from half the site.
 *
 * Deriving it means the offer catalog, the homepage link row and the routes can
 * never disagree. If a service ever needs to exist WITHOUT a page, give it an
 * explicit flag in `services-data.js` and filter on that here — do not go back to
 * a parallel list.
 */
export const SERVICE_PAGE_SLUGS = SERVICES.map((service) => service.slug);

/** Where the services index lives. */
export const SERVICES_INDEX_PATH = '/services';

/**
 * Cap on how many Review nodes go into the payload. `reviewCount` on the
 * aggregate still reports the true total, so nothing is misstated — this only
 * keeps the <head> from growing without bound as reviews accumulate.
 */
const MAX_REVIEW_NODES = 20;

/* ----------------------------------- URLs ---------------------------------- */

/** Strip trailing slashes so `base + '/path'` never doubles up. */
export function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || '').trim().replace(/\/+$/, '');
}

/**
 * Absolute URL for a possibly-relative path. Returns '' for empty input and
 * passes through anything already absolute, so callers can feed it CMS values
 * (which may be either) without checking first.
 */
export function absoluteUrl(baseUrl, u) {
  const value = String(u || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const base = normalizeBaseUrl(baseUrl);
  return base + (value.charAt(0) === '/' ? value : '/' + value);
}

/* -------------------------------- Serialising ------------------------------- */

/**
 * JSON for a <script type="application/ld+json"> block.
 *
 * The `<` escape is XSS protection, not cosmetics: without it a CMS value
 * containing "</script>" would close the block early and the rest of the
 * string would be parsed as HTML. < is valid JSON and parses back to '<',
 * so consumers see the original text.
 */
export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/* --------------------------------- Helpers --------------------------------- */

/** Drop keys whose value is undefined, null, '' or an empty array. */
function compact(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}

/** ISO 8601 string for a stored timestamp, or null if it isn't a real date. */
function isoDate(value) {
  if (!value) return null;
  const when = new Date(value);
  return Number.isNaN(when.getTime()) ? null : when.toISOString();
}

/**
 * Absolute URLs found in the footer's links/social lists become `sameAs`.
 *
 * Internal links (#services, /portal/login) are skipped: sameAs is for *other*
 * profiles of the same entity, so pointing it back at this site adds nothing.
 * Today this yields an empty list, and the property is then omitted — it fills
 * in on its own the moment social profiles are added in the admin.
 */
export function collectSameAs(footer) {
  const source = []
    .concat(Array.isArray(footer && footer.social) ? footer.social : [])
    .concat(Array.isArray(footer && footer.links) ? footer.links : []);

  const seen = new Set();
  const out = [];
  for (const entry of source) {
    const href = typeof entry === 'string' ? entry : (entry && entry.href) || '';
    if (!/^https?:\/\//i.test(href) || seen.has(href)) continue;
    seen.add(href);
    out.push(href);
  }
  return out;
}

/* --------------------------------- Reviews --------------------------------- */

/**
 * Aggregate the approved reviews the page renders.
 *
 * Returns null when there is nothing real to report, and the caller then emits
 * no rating at all. There is no fallback value and no default here on purpose:
 * a hardcoded "5.0 from 27 reviews" is fabricated structured data, which
 * Google treats as spam and which the page could not back up visibly anyway.
 *
 * The input is whatever routes/public.js passed to the view — that is
 * listApprovedReviews() from lib/business.js, i.e. Firestore reviews with
 * status === 'approved', the same list the #reviews carousel renders.
 *
 * @param {Array<{name?:string,role?:string,rating?:number,text?:string,createdAt?:string,approvedAt?:string}>} reviews
 * @returns {{count:number, average:number, items:Array}|null}
 */
export function summarizeReviews(reviews) {
  const items = (Array.isArray(reviews) ? reviews : []).filter((r) => {
    const rating = Number(r && r.rating);
    return Number.isFinite(rating) && rating >= 1 && rating <= 5;
  });
  if (!items.length) return null;

  const total = items.reduce((sum, r) => sum + Number(r.rating), 0);
  return {
    count: items.length,
    // One decimal is what Google displays; more would imply a precision the
    // 1–5 integer ratings behind it don't have.
    average: Math.round((total / items.length) * 10) / 10,
    items,
  };
}

/** One Review node. Returns null if the review has no body to quote. */
function buildReview(review) {
  const body = String((review && review.text) || '').trim();
  const name = String((review && review.name) || '').trim();
  if (!body || !name) return null;

  return compact({
    '@type': 'Review',
    author: { '@type': 'Person', name },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: Number(review.rating),
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: body,
    // approvedAt is when it went live on the page; createdAt is when it was
    // written. Either is a genuine date — we never stamp "today".
    datePublished: isoDate(review.approvedAt) || isoDate(review.createdAt),
  });
}

/* ------------------------------- Organization ------------------------------ */

/**
 * The Organization node.
 *
 * WHY NOT ProfessionalService / LocalBusiness: those subtypes are what unlock
 * the local pack, but they are only truthful with a real `address` (a
 * PostalAddress with at least a locality and region) or a declared
 * `areaServed`. Darsh has no address in lib/defaults.js, none in the CMS
 * section schema, and no address-shaped env key — the closest thing is
 * BASE_URL. Inventing one to reach for a local result is a straightforward
 * fabrication and, if it named a real place, could earn a manual action.
 * Organization is the honest type for a remote software studio. If a real
 * business address or a genuine service area ever exists, switching is a
 * one-line change here: set '@type' to 'ProfessionalService' and add
 * `address` / `areaServed`.
 *
 * AGGREGATE RATING CAVEAT: Google's review-snippet guidelines call reviews
 * collected by the reviewed entity's own site "self-serving", and do not show
 * star snippets for self-serving reviews on Organization or LocalBusiness.
 * These reviews are first-party (submitted at /review, approved in the admin),
 * so stars in Google results are unlikely. The markup is still correct, still
 * backed by real approved reviews shown on the page, and is read by other
 * consumers (Bing, and the crawlers behind AI answers), so it is emitted — but
 * it is emitted as an accurate description of the page, not as a rich-result
 * trick. Third-party ratings, if Darsh ever collects them, are the thing that
 * would actually light up stars.
 */
/* ------------------------------- Local business ---------------------------- */

/**
 * Where the business actually is, for the local-search half of SEO.
 *
 * WHY THIS EXISTS AT ALL. Before this, the rendered homepage contained the
 * string "Indiana" zero times, no phone number, and no geography of any kind in
 * its structured data. The Business Profile claimed a northern-Indiana service
 * area and the website corroborated none of it, so the two strongest local
 * signals Google has were not reinforcing each other.
 *
 * EVERY VALUE IS OVERRIDABLE BY ENV so this file never becomes the only place a
 * business fact lives. Set any of them to an empty string to drop that field
 * entirely — `compact()` strips empties, so an unset value emits nothing rather
 * than an empty node.
 *
 * The defaults are the values on the live Google Business Profile. Keep them in
 * sync with it: Google cross-checks name/address/phone between a site and its
 * profile, and a disagreement is worse than silence on both.
 *
 * PROFILE_URL is derived from the profile's own CID (the review short-link
 * resolves to place data 0x...:0x9b2bb84cef349105, and 0x9b2bb84cef349105 is
 * 11181233140447613189 in decimal). Listing it in sameAs is what explicitly
 * ties this website to that profile.
 */
const LOCAL = {
  telephone: envOr('BUSINESS_PHONE', '+1-574-347-1217'),
  locality: envOr('BUSINESS_CITY', 'Fishers'),
  region: envOr('BUSINESS_REGION', 'IN'),
  country: envOr('BUSINESS_COUNTRY', 'US'),
  profileUrl: envOr('GOOGLE_MAPS_PROFILE_URL', 'https://maps.google.com/?cid=11181233140447613189'),
  /*
   * Semicolon-separated so one env var carries the whole list.
   *
   * These four are the EXACT cities on the Business Profile — Indianapolis
   * metro, not northern Indiana. No county entries: the profile does not
   * declare any, and inventing broader coverage here than the profile claims
   * is precisely the mismatch this file warns about above.
   *
   * Corroborated by the client work: Yafa is in Noblesville and Big Birdz is
   * on Allisonville Rd in Indianapolis.
   */
  areas: envOr(
    'BUSINESS_AREAS',
    'Fishers, IN; Indianapolis, IN; Carmel, IN; Noblesville, IN',
  ),
};

/** An env value if set (even to ''), otherwise the fallback. */
function envOr(key, fallback) {
  const raw = process.env[key];
  return raw === undefined ? fallback : raw.trim();
}

/**
 * areaServed as schema.org nodes.
 *
 * A bare string works, but City / AdministrativeArea is unambiguous — "Elkhart"
 * alone is both a city and a county here, and typing them apart stops Google
 * having to guess which one a name means.
 */
function buildAreaServed() {
  return LOCAL.areas
    .split(';')
    .map((a) => a.trim())
    .filter(Boolean)
    .map((name) => ({
      '@type': /count(y|ies)$/i.test(name.split(',')[0].trim()) ? 'AdministrativeArea' : 'City',
      name,
    }));
}

export function buildOrganization(ctx) {
  const {
    pageUrl,
    brandName,
    description,
    slogan,
    logoUrl,
    contactEmail,
    sameAs = [],
    services = [],
    reviewSummary = null,
    baseUrl,
    servicePageSlugs = SERVICE_PAGE_SLUGS,
  } = ctx;

  const areaServed = buildAreaServed();

  // The Business Profile URL belongs in sameAs — that link is what tells Google
  // this site and that profile are one entity. Deduped: collectSameAs() may
  // already have picked it up from a footer link.
  const allSameAs = [...sameAs];
  if (LOCAL.profileUrl && !allSameAs.includes(LOCAL.profileUrl)) allSameAs.push(LOCAL.profileUrl);

  const org = compact({
    // Dual-typed. Organization keeps everything that already relied on it;
    // ProfessionalService is the LocalBusiness subtype that makes the
    // geography below meaningful to Google.
    '@type': ['Organization', 'ProfessionalService'],
    '@id': pageUrl + '#organization',
    name: brandName,
    url: pageUrl,
    logo: logoUrl,
    image: logoUrl,
    description,
    slogan,
    telephone: LOCAL.telephone,
    // No streetAddress on purpose — see the header comment.
    address: LOCAL.locality
      ? compact({
          '@type': 'PostalAddress',
          addressLocality: LOCAL.locality,
          addressRegion: LOCAL.region,
          addressCountry: LOCAL.country,
        })
      : undefined,
    areaServed,
    sameAs: allSameAs,
  });

  if (contactEmail) {
    org.email = contactEmail;
    org.contactPoint = [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: contactEmail,
        url: pageUrl + '#contact',
      },
    ];
  }

  const catalog = buildOfferCatalog({ brandName, services, baseUrl, servicePageSlugs });
  if (catalog) org.hasOfferCatalog = catalog;

  if (reviewSummary) {
    org.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: reviewSummary.average,
      reviewCount: reviewSummary.count,
      bestRating: 5,
      worstRating: 1,
    };
    const nodes = reviewSummary.items.slice(0, MAX_REVIEW_NODES).map(buildReview).filter(Boolean);
    if (nodes.length) org.review = nodes;
  }

  return org;
}

/**
 * The service list as an OfferCatalog.
 *
 * Names and taglines come straight from lib/services-data.js — the same copy
 * the visible cards render. Only the services with a published page get a
 * `url`; the rest are still listed (they are genuinely offered) but link
 * nowhere rather than to a 404.
 */
export function buildOfferCatalog({ brandName, services = [], baseUrl, servicePageSlugs = SERVICE_PAGE_SLUGS }) {
  const published = new Set(servicePageSlugs);
  const items = services
    .filter((s) => s && s.title)
    .map((s) =>
      compact({
        '@type': 'Offer',
        itemOffered: compact({
          '@type': 'Service',
          name: s.title,
          description: s.tagline,
          serviceType: s.title,
          provider: brandName ? { '@type': 'Organization', name: brandName } : undefined,
          url: published.has(s.slug) ? absoluteUrl(baseUrl, `${SERVICES_INDEX_PATH}/${s.slug}`) : undefined,
        }),
      })
    );

  if (!items.length) return null;
  return compact({
    '@type': 'OfferCatalog',
    name: brandName ? `${brandName} services` : 'Services',
    itemListElement: items,
  });
}

/* ---------------------------------- WebSite --------------------------------- */

/**
 * The WebSite node.
 *
 * NO SearchAction / sitelinks searchbox: that markup is a promise that a URL
 * template like /search?q={query} returns results, and this site has no search
 * endpoint at all (see routes/public.js). Declaring one would point Google at
 * a 404. Add `potentialAction` here on the day a real search route exists.
 */
export function buildWebSite(ctx) {
  const { pageUrl, brandName, description } = ctx;
  return compact({
    '@type': 'WebSite',
    '@id': pageUrl + '#website',
    url: pageUrl,
    name: brandName,
    description,
    inLanguage: 'en',
    publisher: { '@id': pageUrl + '#organization' },
  });
}

/* ------------------------------- BreadcrumbList ----------------------------- */

/**
 * A BreadcrumbList from a trail of { name, path } crumbs.
 *
 * Not used by the homepage: the site root is the first crumb, and a one-item
 * breadcrumb tells a crawler nothing it doesn't already know. It is exported
 * for the /services index and the /services/<slug> pages, where the trail is
 * real — e.g. buildBreadcrumbList({ baseUrl, trail: [
 *   { name: 'Home', path: '/' },
 *   { name: 'Services', path: '/services' },
 *   { name: 'Client Portals', path: '/services/client-portals' },
 * ] }).
 *
 * Returns null for a trail of fewer than two crumbs rather than emitting a
 * degenerate list.
 */
export function buildBreadcrumbList({ baseUrl, trail = [] }) {
  const crumbs = trail.filter((c) => c && c.name && c.path);
  if (crumbs.length < 2) return null;

  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(baseUrl, crumb.path),
    })),
  };
}

/* ---------------------------------- Graph ---------------------------------- */

/**
 * Everything the homepage emits, as one @graph.
 *
 * A single graph (rather than several separate <script> blocks) lets WebSite
 * point at the Organization by @id instead of repeating it, and gives crawlers
 * one object to reconcile instead of two that look like they might be
 * different entities.
 *
 * @param {object} ctx
 * @param {string} ctx.baseUrl      Site origin, no trailing slash (from BASE_URL).
 * @param {string} ctx.brandName
 * @param {string} ctx.description
 * @param {string} [ctx.slogan]
 * @param {string} ctx.logoUrl      Absolute.
 * @param {string} [ctx.contactEmail]
 * @param {string[]} [ctx.sameAs]
 * @param {Array} [ctx.services]    lib/services-data.js entries.
 * @param {Array} [ctx.reviews]     Approved reviews the page renders.
 */
export function buildHomepageGraph(ctx) {
  const baseUrl = normalizeBaseUrl(ctx.baseUrl);
  const pageUrl = baseUrl + '/';
  const reviewSummary = ctx.reviewSummary !== undefined ? ctx.reviewSummary : summarizeReviews(ctx.reviews);

  const shared = { ...ctx, baseUrl, pageUrl, reviewSummary };

  return {
    '@context': 'https://schema.org',
    '@graph': [buildOrganization(shared), buildWebSite(shared)],
  };
}
