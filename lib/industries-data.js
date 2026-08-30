/* =============================================================================
   Industry pages — /industries and /industries/<vertical>
   -----------------------------------------------------------------------------
   WHY THIS EXISTS, AND WHY IT IS SMALL

   /services answers "what do you build". These pages answer "do you understand
   my trade", which is a different search and a different buyer. An HVAC owner
   searching "HVAC website design" is not going to click a page about "Online
   Booking & Scheduling", even though that is half of what they need.

   Three rules this file holds to, and they are the reason it has exactly one
   entry in it:

     1. HUBS ONLY — NO MATRIX. Twelve services x twenty-three showcase verticals
        is 276 pages of near-identical copy. That is the textbook definition of a
        doorway-page network, it is a site-wide quality risk rather than a
        per-page one, and Google has been explicit about it for a decade. One hub
        per vertical, linking out to the real service pages, is the whole design.

     2. NO VERTICAL WITHOUT EVIDENCE. HVAC has five finished demo designs in
        lib/showcase/registry.js, a live client in lib/defaults.js, and an
        explicit mention in lib/services-data.js ('contractor-software' →
        "Built for HVAC, plumbing, roofing, landscaping & cleaning"). Plumbing and
        roofing have the demos and nothing else. A page written from imagination
        for a trade we have never shipped in reads exactly like what it is, and
        it drags the pages that ARE real down with it. See `upcomingIndustries`
        at the bottom for what those need before they get a page.

     3. TARGET THE WINNABLE PHRASE. "HVAC booking software" is owned by
        ServiceTitan, Housecall Pro and Jobber — companies with a hundred times
        the domain authority and a decade of head start. "HVAC website design" is
        a local-agency phrase and is genuinely contestable. So the page leads with
        design and carries the software terms as secondary sections, rather than
        the other way round.

   -----------------------------------------------------------------------------
   ADDING A VERTICAL

   Append an entry to `industries`. The route, the page, the sitemap entry, the
   index card and the structured data all derive from it — nothing else needs
   editing. The shape:

     slug            URL segment. Must be unique; becomes /industries/<slug>.
     name            Plain trade name, no emoji. Used in crumbs and headings.
     seoTitle        <title> without the brand — views/industry.ejs appends
                     " — <BUSINESS_NAME>", same as views/service.ejs does.
     metaDescription ~150 chars, written as a claim someone would click.
     eyebrow         Small label above the h1.
     h1              The page heading. One per page, and this is it.
     heroLede        One paragraph under the h1.
     serviceType     schema.org Service.serviceType. The search phrase, verbatim.
     intro[]         Opening prose. Paragraphs.
     problems[]      { title, body } — the framing that is TRUE FOR THIS TRADE
                     AND WOULD BE FALSE FOR THE NEXT ONE. If a problem block
                     survives a find-and-replace of "HVAC" with "plumbing", it
                     is generic filler and does not belong on a vertical page.
     showcaseCategory  Category id in lib/showcase/registry.js.
     demoNotes       Keyed by design id in that category. One sentence of OUR
                     read on each direction — which kind of company it suits and
                     why. The registry's own `name`/`blurb`/`accent` are reused
                     rather than retyped, so this file only carries the part that
                     is first-party commentary.
     softwareIntro   Lead-in to the services section.
     serviceSlugs[]  Slugs in lib/services-data.js to link to. This internal
                     linking is a main reason the hub exists.
     serviceNotes    Keyed by slug — what that service means in this trade.
     caseStudy       See the Infinite Comfort entry and the honesty note on it.
     faqs[]          { q, a }. Real questions, answered without inventing
                     numbers, timelines or prices.

   TONE: matches lib/services-data.js and lib/defaults.js — direct, concrete, no
   hype, no invented statistics, no fake urgency.
   ============================================================================= */

import showcaseCategories from './showcase/registry.js';
import { services } from './services-data.js';

/** Where a showcase demo lives. Mirrors the routes in routes/showcase.js. */
const SHOWCASE_DESIGN_PATH = '/showcase/designs';

/** Where the services pages live. Mirrors routes/public.js. */
const SERVICES_PATH = '/services';

/* --------------------------------- Index ---------------------------------- */

export const industriesIndexMeta = {
  seoTitle: 'Industries we build software for',
  metaDescription:
    'Websites and custom software built for specific trades. HVAC is live, with five design directions you can click through and a real client site to look at.',
  eyebrow: 'Industries',
  title: 'Built for a trade, not for everyone.',
  lede:
    'A generic small-business website is a compromise nobody asked for. These pages are about the parts of a specific trade that a template cannot know.',
  intro: [
    'Most of what we build is the same underneath — a database, a booking flow, an admin screen, a site that loads fast on a phone. What changes between trades is which of those matters most, and what the person on the other end of the enquiry is actually worried about when they land on the page.',
    'We only publish a page here once there is something real behind it: finished design work we can show you, a client site we can point at, or both. That is why the list below is short and will grow slowly.',
  ],
};

/* ------------------------------- Verticals -------------------------------- */

export const industries = [
  {
    slug: 'hvac',
    name: 'HVAC',
    showcaseCategory: 'hvac',

    seoTitle: 'HVAC Website Design & Contractor Software',
    metaDescription:
      'HVAC website design plus the software behind it — five HVAC site directions you can open and click through, a live client site, booking, dispatch and reviews.',

    eyebrow: 'HVAC',
    h1: 'HVAC websites and software, built for how HVAC companies actually work',
    heroLede:
      'Five HVAC design directions you can open and click through right now, a live client site we built and still maintain, and the booking, dispatch and review tooling that goes behind them.',
    serviceType: 'HVAC website design',

    cardTagline: 'Websites, booking and dispatch for heating and cooling companies.',
    cardPoints: ['5 design directions live', '1 client site shipped', 'Booking, dispatch, reviews'],

    intro: [
      'An HVAC website is judged on the worst day of the year. It is ninety-six degrees, the air handler has stopped, and someone is searching on a phone with fifteen percent battery. They want to know you cover their town, that you can come today, and that you will not be the third company to miss a window. Most HVAC sites are built as though that moment never happens.',
      'The other half of the year the same site has the opposite job. Nobody is in a hurry. Someone is comparing three quotes on a system replacement, half-understanding SEER ratings, working out whether they can afford it this year. That visitor needs financing terms, warranty language and enough detail to feel they decided rather than were sold to.',
      'We build for both on one site, then build the part behind it: booking that respects your dispatch reality, records that remember which unit is in which basement, and review requests that actually go out.',
    ],

    problemsIntro:
      'Five things that make an HVAC build different from any other trade. None are true in the same way for a plumber or a roofer, which is why a generic contractor template gets all five slightly wrong.',

    problems: [
      {
        title: 'Demand arrives in two spikes and then stops',
        body:
          'HVAC has a cooling season, a heating season, and two shoulder periods where the phone is quiet and the crews are underused. A site that only knows how to shout "call now" is wasted for half the year. The shoulder months are when maintenance plans get sold, when replacement quotes get considered without pressure, and when the content that ranks in July has to already be indexed. The site needs a job in April, not just in August.',
      },
      {
        title: 'Emergency and scheduled work are two different businesses',
        body:
          'A no-heat call at eleven at night and a spring tune-up share a trade and nothing else. One needs a phone number above the fold and an honest answer about tonight. The other can be self-booked three weeks out and should never reach a dispatcher. Most booking forms treat them identically, which either buries the emergency behind a form or lets a routine filter change tie up the on-call van.',
      },
      {
        title: 'Maintenance agreements are the asset, and they lapse quietly',
        body:
          'A maintenance plan is the closest thing an HVAC company has to recurring revenue, and it is usually lost to nothing worse than inattention. Nobody cancels — they just never get called for the fall tune-up, and by spring the relationship has gone cold. Renewal is a scheduling and reminder problem, which makes it solvable in software, and plan members are the customers who call you first when the system finally dies.',
      },
      {
        title: 'A system replacement is a financed purchase, not a service call',
        body:
          'Replacing a full system is one of the larger unplanned things a household buys, and the deciding factor is very often the monthly figure rather than the total. Financing buried in the footer asks a nervous buyer to do the arithmetic alone while two competitors show them a payment. Rebates and utility incentives are the same: complicated, changeable, and explaining them clearly is one of the few ways an HVAC site can be more useful than its competitors rather than just prettier.',
      },
      {
        title: 'Licensing and certification are the trust signal that actually converts',
        body:
          'A homeowner is letting a stranger into the house to work on something they cannot inspect afterwards. NATE certification, EPA refrigerant handling, the state licence number, insurance, dealer status — these are not badges to scatter in the footer. They answer the question the visitor is actually asking, so they belong where the decision is made. It is the most common failure we see on HVAC sites that otherwise look fine.',
      },
    ],

    demosIntro:
      'Finished, running demo sites, not screenshots — open any of them and click through. They exist so the conversation can start at "that one, but warmer" instead of a mood board. The note under each is our read on which kind of HVAC company it suits.',

    demoNotes: {
      design1:
        'The safe choice for a residential company whose year is split evenly between fall furnace work and summer AC — the warm-and-cool palette does that work for you, so one homepage reads correctly in January and in July.',
      design2:
        'Pick this if your pitch is the numbers — efficiency ratings, load calculations, rebates — because the magazine layout has room to actually explain a heat-pump upgrade rather than reduce it to a headline.',
      design3:
        'The emergency-first direction: dark, loud, organised around one phone number — what you want in front of someone whose heat died at two in the morning and who will not scroll.',
      design4:
        'For the premium installer selling whole-home replacements, where yours has to look like the considered quote of the three — the dark luxe treatment carries financing and warranty copy without reading as a discount ad.',
      design5:
        'The family-owned, plan-renewal direction — bright and unintimidating, and the easiest of the five to hang a maintenance-agreement signup off without it reading as an upsell.',
    },

    softwareIntro:
      'An HVAC company that has outgrown a shared calendar and a text thread usually needs three or four of these, and they work considerably better scoped together than bought separately.',

    serviceSlugs: ['booking-scheduling', 'contractor-software', 'customer-management', 'reviews-reputation'],

    serviceNotes: {
      'booking-scheduling':
        'Self-booked tune-ups and diagnostics, with emergency calls routed somewhere other than the routine queue — plus the confirmations and reminders that stop no-shows.',
      'contractor-software':
        'The dispatch board, the estimate written on site, and the invoice that follows the job instead of trailing two weeks behind it. Read this one if the schedule is still a whiteboard.',
      'customer-management':
        'One record per address, with the equipment installed there, its age, its warranty status and every visit you have made — so the technician arriving knows what they are walking into.',
      'reviews-reputation':
        'A review request sent automatically after a completed call, while the house is finally cool. HVAC decisions turn on review count and recency, and both are an automation problem.',
    },

    /* -------------------------------------------------------------------------
       CASE STUDY — HONESTY NOTE

       Everything below is either (a) in this repo, or (b) plainly visible on the
       client's own live site, which we built. What is deliberately NOT here:
       traffic figures, conversion rates, call volumes, revenue, or a client
       quote. We have not measured them and the client has not given us a
       testimonial, so there is nothing truthful to write. `resultsGap` renders
       as a visible placeholder saying exactly that, rather than the page
       implying a result it cannot support.

       WHEN REAL NUMBERS EXIST: replace `resultsGap` with a `results[]` array of
       { label, value, note } and update views/industry.ejs to render it. Do not
       fill it from an analytics dashboard nobody has agreed to publish.
       ------------------------------------------------------------------------- */
    caseStudy: {
      name: 'Infinite Comfort LLC',
      url: 'https://infinitecomfortllc.com',
      // Matched against the CMS work cards (lib/defaults.js → work.cards, or
      // whatever the admin has since edited), so the short description on this
      // page and the one on the homepage cannot drift apart.
      matchUrl: 'infinitecomfortllc.com',
      fallbackDescription:
        'A clean, trust-building website for a home-comfort services company — clear services, easy quote requests, and fast performance on every device.',
      tags: ['Web', 'Home Services', 'Lead-gen'],
      body: [
        'Infinite Comfort is a central-Indiana HVAC contractor, and the trades client this page is written from. The site covers the full range of what they do — AC repair and installation, heating, ductwork, indoor air quality, maintenance plans and commercial work — with the towns they serve named on the page rather than left for the visitor to guess at.',
        'The build put the five things above where they belong. Round-the-clock emergency service is stated up front rather than buried in a services list. The maintenance plan is its own offer, with what a member actually gets. Financing is treated as part of the replacement decision. And the licensing — licensed, insured, NATE-certified, EPA-certified — sits where the homeowner is deciding, because that is the question they are asking.',
      ],
      resultsGap:
        'Results: not published. We have not run a measured before-and-after on this site, and we will not print a number we did not measure. When the call and booking data is in hand and the client is happy for it to be public, the figures go here.',
    },

    faqs: [
      {
        q: 'What makes an HVAC website different from a generic small-business site?',
        a: 'Two visitors with nothing in common. One has no heat and wants a phone number, a service area and an answer about tonight. The other is three weeks into comparing replacement quotes and wants financing, efficiency detail and warranty terms. A generic template picks one and quietly fails the other.',
      },
      {
        q: 'Can I see the five HVAC designs before committing to anything?',
        a: 'Yes — they are on this page and they are live sites, not images. Open them on your phone and tell us which is closest. Starting from a real page you can criticise is much faster than starting from a blank brief.',
      },
      {
        q: 'Do I have to replace ServiceTitan, Housecall Pro or Jobber to work with you?',
        a: 'No, and usually you should not. If a field-service platform is already working for you, the sensible move is to keep it and have the website feed it rather than rebuild what you pay for. Whether that means a direct integration or a simpler handoff depends on the platform and your plan tier — it is one of the first things we check when scoping.',
      },
      {
        q: 'Can the booking form treat an emergency call differently from a scheduled tune-up?',
        a: 'It is usually the first thing we change. Routine work — tune-ups, filter changes, quoted diagnostics — is self-booked into real availability. Emergency work takes a separate path that reaches a person, because a no-heat call at midnight should not queue behind a tune-up request for a fortnight on Tuesday.',
      },
      {
        q: 'Can maintenance-agreement renewals be built into the site?',
        a: 'Yes. Signup on the site, the plan attached to the customer record, and seasonal-visit and renewal reminders scheduled rather than remembered. Most lapsed plans are not cancellations, they are calls nobody made — and that is the easy kind of problem to fix in software.',
      },
      {
        q: 'Have you actually built for an HVAC company before?',
        a: 'One, named on this page: Infinite Comfort LLC in central Indiana. We would rather point at one real site you can open and inspect than list a dozen logos. If you want to speak to them before speaking to us, ask and we will make the introduction.',
      },
    ],
  },
];

/* ------------------------------ Not yet built ------------------------------ */

/**
 * Verticals with finished demo designs in lib/showcase/registry.js but NO page.
 *
 * Rendered on /industries as an honest "not yet", which is the whole point:
 * a visitor who came looking for plumbing gets a straight answer and a link to
 * the demos, instead of a page of copy we invented. Each of these becomes a
 * real entry in `industries` above once there is a client, or at minimum
 * first-hand knowledge of the trade, behind it — the demos alone are not
 * enough, because the demos are design work and a vertical page is a claim
 * about understanding the business.
 */
export const upcomingIndustries = [
  {
    name: 'Plumbing',
    showcaseCategory: 'plumbing',
    note: 'Five plumbing design directions are already built and live in the showcase. The page waits on a plumbing client we can write about truthfully.',
  },
  {
    name: 'Roofing',
    showcaseCategory: 'roofing',
    note: 'Five roofing design directions are built. Roofing turns on storm and insurance work, which we have not shipped for yet, so there is no page.',
  },
];

/* --------------------------------- Lookups -------------------------------- */

/** One industry by slug, or null. The route uses this for its 404 decision. */
export function getIndustry(slug) {
  return industries.find((i) => i.slug === slug) || null;
}

/**
 * The showcase demos for an industry, merged with our commentary.
 *
 * `name`, `blurb`, `accent` and `bg` come straight from the registry rather
 * than being copied into this file, so a design renamed there is renamed here
 * too. A design with no note still renders — it just shows the registry blurb,
 * so adding a sixth design never breaks a page.
 *
 * Returns [] for an industry with no `showcaseCategory`, or one whose category
 * has since been removed from the registry.
 */
export function getIndustryDemos(industry) {
  if (!industry || !industry.showcaseCategory) return [];
  const category = showcaseCategories.find((c) => c.id === industry.showcaseCategory);
  if (!category) return [];

  const notes = industry.demoNotes || {};
  return (category.designs || []).map((design) => ({
    id: design.id,
    name: design.name,
    blurb: design.blurb,
    accent: design.accent,
    bg: design.bg,
    url: `${SHOWCASE_DESIGN_PATH}/${category.id}/${design.id}`,
    note: notes[design.id] || '',
  }));
}

/**
 * The service pages an industry links to, in the order it lists them.
 *
 * Resolved against `services` in lib/services-data.js rather than hardcoded, so
 * a slug that no longer exists silently drops out of the list instead of
 * shipping an internal link to a 404.
 */
export function getIndustryServices(industry) {
  if (!industry) return [];
  const notes = industry.serviceNotes || {};
  return (industry.serviceSlugs || [])
    .map((slug) => {
      const service = services.find((s) => s.slug === slug);
      if (!service) return null;
      return { ...service, path: `${SERVICES_PATH}/${service.slug}`, note: notes[slug] || '' };
    })
    .filter(Boolean);
}

/**
 * The case study, with its short description taken from the CMS work card when
 * one matches — so the homepage and this page describe the client identically.
 * Falls back to the copy in this file when Firebase is unavailable or the card
 * has been removed. Returns null for an industry with no case study.
 *
 * @param {object} industry
 * @param {Array<{url?:string,title?:string,description?:string,tags?:string[]}>} workCards
 *        content.work.cards as handed to the view.
 */
export function resolveCaseStudy(industry, workCards) {
  const study = industry && industry.caseStudy;
  if (!study) return null;

  const needle = String(study.matchUrl || '').toLowerCase();
  const card = needle
    ? (Array.isArray(workCards) ? workCards : []).find((c) =>
        String((c && c.url) || '').toLowerCase().includes(needle)
      )
    : null;

  return {
    name: (card && card.title) || study.name,
    url: (card && card.url) || study.url,
    description: (card && card.description) || study.fallbackDescription,
    tags: (card && Array.isArray(card.tags) && card.tags.length ? card.tags : study.tags) || [],
    body: study.body || [],
    resultsGap: study.resultsGap || '',
  };
}
