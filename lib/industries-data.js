/* =============================================================================
   Industry pages — /industries and /industries/<vertical>
   -----------------------------------------------------------------------------
   WHY THIS EXISTS, AND WHY IT IS SMALL

   /services answers "what do you build". These pages answer "do you understand
   my trade", which is a different search and a different buyer. An HVAC owner
   searching "HVAC website design" is not going to click a page about "Online
   Booking & Scheduling", even though that is half of what they need.

   Three rules this file holds to, and they are the reason it has four entries
   in it rather than twenty-three:

     1. HUBS ONLY — NO MATRIX. Twelve services x twenty-three showcase verticals
        is 276 pages of near-identical copy. That is the textbook definition of a
        doorway-page network, it is a site-wide quality risk rather than a
        per-page one, and Google has been explicit about it for a decade. One hub
        per vertical, linking out to the real service pages, is the whole design.

     2. NO VERTICAL WITHOUT EVIDENCE. Every entry below has BOTH five finished
        demo designs in lib/showcase/registry.js AND a live client we can name
        and link to, sitting in the CMS work cards (lib/defaults.js → work,
        as edited in Firestore):

          hvac        → Infinite Comfort LLC
          coffee      → Yafa Golden Coffee USA
          fastfood    → Big Birdz Hot Chicken
          photography → Yasin Studios

        Plumbing and roofing have the demos and no client. Freelancer websites
        have neither — see the note on it in `upcomingIndustries`. A page
        written from imagination for a trade we have never shipped in reads
        exactly like what it is, and it drags the pages that ARE real down with
        it.

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

     article         OPTIONAL. 'a' or 'an', for views/industry.ejs writing
     plural          "<article> <name> site". Defaults to a first-letter vowel
     businessLabel   test, which is wrong for initialisms said aloud, so HVAC
                     sets 'an' explicitly.
                     `plural` is the trade as a plural noun ("coffee shops"),
                     for the two headings that talk about the trade rather than
                     about one business. Defaults to `name`.
                     `businessLabel` is what to call one of these businesses.
                     Defaults to "<name> company" — right for a contractor,
                     wrong for a cafe, a restaurant and a studio.
                     All three are optional; omitting them renders exactly what
                     the page rendered before they existed.
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
    'Websites and custom software built for specific trades — HVAC, coffee shops, fast food and photography. Five clickable design directions and a real client site behind each.',
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
    // "an HVAC site" — the template's default vowel test would say "a".
    article: 'an',
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

  {
    slug: 'coffee-shops',
    name: 'Coffee Shop',
    plural: 'coffee shops',
    businessLabel: 'coffee shop',
    showcaseCategory: 'coffee',

    seoTitle: 'Coffee Shop Website Design & Online Ordering',
    metaDescription:
      'Coffee shop website design plus the ordering, loyalty and wholesale tooling behind it — five cafe design directions you can open, and a live client cafe.',

    eyebrow: 'Coffee Shops',
    h1: 'Coffee shop websites built for the queue at seven in the morning',
    heroLede:
      'Five cafe design directions you can open and click through right now, a live client cafe we built, and the ordering, loyalty and wholesale tooling that sits behind the photographs.',
    serviceType: 'Coffee shop website design',

    cardTagline: 'Websites, ordering and loyalty for cafes and roasters.',
    cardPoints: ['5 design directions live', '1 client cafe shipped', 'Ordering, loyalty, wholesale'],

    intro: [
      'Almost nobody reads a coffee shop website. They check it. It is 7:12 in the morning, they are two minutes from the turn, and they want three facts: are you open, is the drive-thru open, and where does the car go. A site that hides the hours under a full-bleed hero has failed at the only job it had that morning.',
      'The visitors worth more per head are the ones in no hurry at all — somebody choosing where to spend a Saturday, an office manager ordering forty coffees, a grocery buyer who tasted your beans and wants a price list. The site has to be quick for the first person and generous for the rest, and then connect to the parts of the business that earn while the counter is shut.',
    ],

    problemsIntro:
      'Four things a cafe build has to get right that a restaurant build does not. Swap "coffee shop" for "bistro" in any of them and it stops being true, which is the test.',

    problems: [
      {
        title: 'Your hours are the most-read thing you will ever publish',
        body:
          'Opening hours out-read the menu, the story and the photographs put together, and they are the content most likely to be wrong. Cafes keep genuinely awkward schedules — early opens, late weekend closes, a kitchen that stops before the counter does, holiday hours nobody remembers to post. Within a month of launch the website, the map listing and the sign on the door disagree. Hours should be one record the site renders, and "open now" should be computed rather than typed.',
      },
      {
        title: 'The menu changes faster than anyone wants to file a ticket',
        body:
          'A seasonal drink lands on Tuesday, the pistachio syrup runs out on Thursday, the pastries are gone by ten most mornings. If changing any of that means emailing an agency, the menu becomes a historical document within a fortnight and the staff start telling customers to ignore it — which is worse than having no menu online. Editing has to be something a manager does on a phone, with items hidden rather than deleted, because next season they come back.',
      },
      {
        title: 'Ordering is a pickup problem, and pickup has a clock',
        body:
          'A latte does not travel. First-party cafe ordering is order-ahead for pickup, and it lives or dies on timing: how far ahead somebody can order, whether the drive-thru gets its own queue, what happens to a 6:55 order when you open at 7, and whether the flow closes itself when the counter does. Restaurant checkout patterns, built for delivery windows and table bookings, get all four wrong in ways the customer discovers while standing in your shop.',
      },
      {
        title: 'The bag business and the cafe business share a website and nothing else',
        body:
          'Retail bags, wholesale accounts and the cafe are three products with three buyers. Retail wants a grind option and a shipping cost. Wholesale wants a price list, a lead time and an account, and will not use a consumer cart. The cafe customer wants neither. Bolting a shop onto the menu page produces a checkout that is bad at both jobs — these should be separate paths from the navigation down.',
      },
    ],

    demosIntro:
      'Running demo sites, not screenshots — open any of them and click through on a phone, which is where the real thing gets used. The note under each is our read on the kind of cafe it suits.',

    demoNotes: {
      draft1:
        'The safe default for a neighbourhood cafe that also sells beans — the editorial layout gives the origin story a home without pushing the hours and the menu below the fold.',
      draft2:
        'For a third-wave shop whose customers already know what a washed Ethiopian is. It will filter out as many people as it attracts, which is sometimes exactly the point.',
      draft3:
        'Look here if the coffee has a country attached to it — Yemeni, Ethiopian, Turkish, Levantine. The palette carries origin without falling back on a flag or a map graphic.',
      draft4:
        'For a cafe that keeps late hours and behaves like a lounge after eight. The only one of the five that makes an eleven-at-night dessert menu look intentional rather than tacked on.',
      draft5:
        'Bright, hand-drawn and unintimidating, and the easiest of the five to hang a loyalty scheme and a menu for children off. Suits a suburban shop with pushchairs in the doorway.',
    },

    softwareIntro:
      'A cafe that has outgrown a paper punch card and a shared spreadsheet usually needs two or three of these, and they scope better together than bought separately.',

    serviceSlugs: ['ecommerce', 'loyalty-programs', 'booking-scheduling', 'reviews-reputation'],

    serviceNotes: {
      ecommerce:
        'Beans and merchandise with grind options and real shipping, kept apart from the cafe menu — plus the wholesale side, which needs accounts and a price list rather than a consumer cart.',
      'loyalty-programs':
        'The punch card, attached to a customer record instead of a piece of cardboard that lives in a wallet until it is lost. The tenth coffee is the cheapest marketing you will ever buy.',
      'booking-scheduling':
        'Catering and private hire taken as real requests with a date, a headcount and a lead time, instead of an email that says "hi, do you do catering".',
      'reviews-reputation':
        'A review request that goes out after a visit rather than never. Cafe choice is a map decision, and on a map you are a star rating and one photograph before you are anything else.',
    },

    /* Same honesty rule as the Infinite Comfort entry above: everything here is
       either in this repo or plainly visible on the client site we built. No
       traffic, no order volume, no testimonial — see `resultsGap`. */
    caseStudy: {
      name: 'Yafa Golden Coffee USA',
      url: 'https://yafagoldencoffeeusa.com',
      matchUrl: 'yafagoldencoffeeusa.com',
      fallbackDescription:
        'eCommerce storefront for a specialty Yemeni coffee brand — product catalog, checkout, and a story-driven landing experience designed to convert.',
      tags: ['eCommerce', 'Branding', 'Web'],
      body: [
        'Yafa Golden Coffee is a Yemeni coffee house in Noblesville, Indiana, and the cafe client this page is written from. The site carries the whole operation rather than a menu photograph: the drinks, from a pistachio cream latte to Aden chai, the pastry counter, and single-origin beans from Yafa itself, with the origin story told as the reason the coffee tastes the way it does.',
        'Four audiences share one site. The regular gets the Prairie Lakes address, hours that run to midnight on a weekday and one in the morning at the weekend, and order-ahead pickup with an in-store or drive-thru choice. Everyone else gets a path of their own — host and catering, a wholesale programme, and franchise enquiries. Those three are why the site is not just a menu, and they are exactly what a cafe template has no idea exists.',
      ],
      resultsGap:
        'Results: not published. We have not run a measured before-and-after on this site, and we will not print a number we did not measure. When the ordering and footfall data is in hand and the client is happy for it to be public, the figures go here.',
    },

    faqs: [
      {
        q: 'Do we need a website at all when everyone finds us on Google Maps?',
        a: 'The map listing wins the search; the website is what the listing links to, and it holds everything a map cannot — the full menu, beans you ship, catering, wholesale, hiring. It is also the only one of the two you own. Build the first screen to answer what Maps could not.',
      },
      {
        q: 'Can our staff update the menu and the hours themselves?',
        a: 'Yes, and if they cannot, the site will be wrong by next month. Items, prices, seasonal specials, sold-out flags and opening hours all belong in an editor a manager can use on a phone. A smaller site that stays accurate beats a larger one that quietly rots.',
      },
      {
        q: 'Should we take orders on our own site, or keep the ordering platform we already pay for?',
        a: 'Usually keep it. If a platform is working, the sensible build hands off to it cleanly rather than replacing a checkout you would then own forever. Where a first-party flow earns its place is loyalty and repeat custom — those are yours, and on a delivery or ordering platform they are not.',
      },
      {
        q: 'Have you actually built for a coffee shop before?',
        a: 'One, named on this page: Yafa Golden Coffee USA in Noblesville, Indiana — a cafe with a bean programme, catering and wholesale behind it. It is live and you can open it. We would rather point at one real site you can inspect than a wall of logos.',
      },
    ],
  },

  {
    slug: 'fast-food-restaurants',
    name: 'Fast Food',
    plural: 'fast food restaurants',
    businessLabel: 'restaurant',
    showcaseCategory: 'fastfood',

    seoTitle: 'Fast Food Restaurant Website Design & Online Ordering',
    metaDescription:
      'Fast food website design and the ordering behind it — five restaurant design directions you can click through, a live client site, and first-party pickup ordering.',

    eyebrow: 'Fast Food',
    h1: 'Fast food websites built around the order, not the brochure',
    heroLede:
      'Five restaurant design directions you can open and click through, a live client site we built, and the ordering, loyalty and review tooling that decides whether a repeat customer belongs to you or to a delivery app.',
    serviceType: 'Fast food restaurant website design',

    cardTagline: 'Websites and first-party ordering for quick-service restaurants.',
    cardPoints: ['5 design directions live', '1 client site shipped', 'Ordering, loyalty, reviews'],

    intro: [
      'A quick-service website has one measurable job and a great deal of decoration around it: turn somebody who is already hungry into an order, in under a minute, on a phone, usually one-handed. Everything that delays that — an intro animation, a paragraph about the founder, a menu that is a photograph of a menu — is costing orders that would otherwise have been placed.',
      'The second job is quieter and worth more across a year. Every order that goes through a delivery app costs a commission, and costs something larger than the commission: the customer record ends up with the app rather than with you. The website is the only place a repeat customer can belong to the restaurant, which is why the ordering flow, the loyalty scheme and the review requests belong on it rather than beside it.',
    ],

    problemsIntro:
      'Four things that make a quick-service build different from a restaurant build. A bistro site can get all four wrong and still work, which is why bistro templates keep being sold to fast food.',

    problems: [
      {
        title: 'Third-party delivery is rent, and the tenant keeps your customer',
        body:
          'Delivery platforms bring real volume and take a commission on every order, and the part that costs more than the percentage is the customer record: they have it and you do not. You cannot send a Tuesday offer, and you cannot notice that somebody has stopped coming. The apps are worth keeping for reach. But an order that could have been first-party pickup and was not is paid for twice — once in commission, once in a customer you never met.',
      },
      {
        title: 'The menu is a price list, and price lists move',
        body:
          'Combos, family packs, wings by the count, sides at fifty cents — a quick-service menu is dozens of priced rows and every one of them changes. A menu rendered as an image, or typed into a page a developer owns, is out of date the first time chicken gets more expensive, and the result is an argument at the counter. Prices belong in structured content the owner edits, rendered in one place, so that the site and the till agree.',
      },
      {
        title: 'The modifiers are the order',
        body:
          'Heat level, no pickles, sauce on the side, swap the fries. In quick service the customisation is not a garnish on the order, it is most of what distinguishes one order from the next, and it is where ordering flows break: options that do not price correctly, combinations the kitchen cannot make, a free-text notes field standing in for real modifiers. Get it wrong and the failure lands on a member of staff at the pass, not on the website.',
      },
      {
        title: 'Hours are not one row per day, and ordering has to respect them',
        body:
          'Quick service runs split shifts, prep gaps and different weekend closes. A site that stores one open and one close per day cannot describe a Friday that runs eleven to three and then half four to eleven. That matters more than it sounds, because an ordering flow that keeps taking orders while the kitchen is shut is worse than having no ordering at all: it produces a customer at a locked door holding a receipt.',
      },
    ],

    demosIntro:
      'Running demo sites rather than screenshots — open them on a phone, since that is where a hungry person actually meets one. The note under each is our read on the kind of operation it suits.',

    demoNotes: {
      design1:
        'The classic quick-service direction — loud, hungry and unsubtle. Best for burgers, wings and anything where an appetising photograph does more work than a paragraph ever will.',
      design2:
        'For the fast-casual end: bowls, salads, build-your-own. The calmer layout has room for the ingredient and nutrition detail that this particular customer genuinely reads before ordering.',
      design3:
        'The pickup-first direction, and the one to look at if you are trying to pull orders back off the delivery platforms — almost everything on the page points at a single order button.',
      design4:
        'Suits a single-cuisine counter with a strong identity, where the food has a place attached to it and the branding is doing as much of the selling as the menu is.',
      design5:
        'The most restrained of the five. For a small counter with a short menu, where the pitch is that you do one thing properly rather than forty things quickly.',
    },

    softwareIntro:
      'Most quick-service owners we speak to need the first two of these before anything else, and the other two shortly after a second location appears.',

    serviceSlugs: ['ecommerce', 'loyalty-programs', 'inventory-management', 'reviews-reputation'],

    serviceNotes: {
      ecommerce:
        'First-party ordering: the menu, modifiers that price correctly, pickup timing tied to real opening hours, and a checkout that keeps the customer record on your side of the fence.',
      'loyalty-programs':
        'The reason a first-party order beats an app order twice over — you know who ordered, so the second visit is something you can prompt rather than something you hope for.',
      'inventory-management':
        'Counts on the things that run out, tied to the menu, so a sold-out item comes off the site instead of being refunded after the order has already landed.',
      'reviews-reputation':
        'Review requests sent automatically after an order. Quick service is chosen from a map on a phone, and recency counts for as much there as the average score does.',
    },

    /* Same honesty rule as the entries above. Everything here is on the client
       live site, which we built. No order counts, no revenue, no testimonial. */
    caseStudy: {
      name: 'Big Birdz Hot Chicken',
      url: 'https://bigbirdzhotchicken.com',
      matchUrl: 'bigbirdzhotchicken.com',
      fallbackDescription:
        'Marketing site and online-ordering experience for a Nashville-style hot chicken spot — responsive and fast, with a CMS the owners actually use.',
      tags: ['Web', 'Online Ordering', 'Restaurant'],
      body: [
        'Big Birdz Hot Chicken is a Nashville-style hot chicken counter on Allisonville Road in Indianapolis, and the quick-service client this page is written from. The menu is the site: combos, family packs, wings by the count, catfish, sides and sauces, each one priced, with a heat level — no spice through extra spicy — chosen as part of the order rather than mentioned in a footnote.',
        'Pickup ordering runs through the ordering flow on their own site, with orders accepted in advance, while delivery is handed to DoorDash and Uber Eats. That split is deliberate rather than accidental: reach where the platforms are good at reach, and the customer kept where it matters. Catering has a page of its own, and the opening hours carry a real Friday break in the middle of the afternoon — the kind of detail a template quietly flattens.',
      ],
      resultsGap:
        'Results: not published. We have not run a measured before-and-after on this site, and we will not print a number we did not measure. When the ordering data is in hand and the client is happy for it to be public, the figures go here.',
    },

    faqs: [
      {
        q: 'Will our own website actually pull orders away from DoorDash and Uber Eats?',
        a: 'Some of them, not all, and the honest framing is that pickup is where you win. A customer who was always going to have it delivered will mostly stay on the app. A customer who drives over anyway has no reason to pay app pricing, and that is the order worth chasing — with loyalty attached so the second one is easier.',
      },
      {
        q: 'Can we keep the ordering system we already have?',
        a: 'Usually yes. If your ordering platform works, the sensible build is a site that hands off to it cleanly rather than a replacement checkout you would then own forever. We would rather spend the budget on the menu, the hours and the loyalty side, which is where the return is.',
      },
      {
        q: 'Who updates prices when they change?',
        a: 'You do, from an editor, without emailing anybody. Quick-service prices move too often for anything else, and a menu that disagrees with the till is an argument with a customer at the counter. If you would rather we did it, that is fine — but the site should not depend on it.',
      },
      {
        q: 'Have you actually built for a fast food restaurant before?',
        a: 'One, named on this page: Big Birdz Hot Chicken in Indianapolis — menu, heat levels, family packs, catering and first-party pickup ordering. It is live and you can order from it. That is the whole of our quick-service track record, stated plainly.',
      },
    ],
  },

  {
    slug: 'photography',
    name: 'Photography Studio',
    plural: 'photography studios',
    businessLabel: 'studio',
    showcaseCategory: 'photography',

    seoTitle: 'Photography Website Design & Studio Booking',
    metaDescription:
      'Photography website design plus the booking behind it — five studio design directions you can click through, a live client studio, and enquiry and delivery tooling.',

    eyebrow: 'Photography',
    h1: 'Photography websites that show the work and still take the booking',
    heroLede:
      'Five studio design directions you can open and click through, a live client studio we built, and the enquiry, delivery and review tooling that turns a portfolio into a booked date.',
    serviceType: 'Photography website design',

    cardTagline: 'Portfolio sites and booking systems for photographers and studios.',
    cardPoints: ['5 design directions live', '1 client studio shipped', 'Booking, galleries, portals'],

    intro: [
      'A photography website is an unusual thing to build, because the portfolio is both the entire sales pitch and the heaviest object on the page. Every instinct says show more, larger, full-bleed. Every measurement says a hero that takes four seconds on a phone loses the visitor before the first image has resolved. Most of the craft in one of these builds is making very large photographs arrive quickly, which is engineering rather than art direction.',
      'The other half is what happens once somebody is convinced. An enquiry is a date question before it is a price question, and a form that collects only a name and a message throws away a round trip. Then the work continues for weeks after the shoot — contracts, balances, galleries — usually spread across three tools and an email thread, when it could be one link.',
    ],

    problemsIntro:
      'Four things that make a photography build different from any other portfolio site. A designer or a copywriter can ignore all four; a studio cannot.',

    problems: [
      {
        title: 'The portfolio is the product and the performance problem at once',
        body:
          'Photographers are the one client group who are right to want enormous images, and also the group punished hardest for having them. A gallery is dozens of high-resolution files, and a phone on a weak connection abandons before the second one paints. It is solvable — modern formats, sized variants, real lazy loading, a deliberately light first screen — but it has to be designed in rather than patched afterwards. A slow portfolio reads as an unprofessional one, unfairly and immediately.',
      },
      {
        title: 'The first question is the date, not the price',
        body:
          'A wedding enquiry, a corporate shoot and a portrait session all begin with availability, and a contact form asking only for a name and a message guarantees an extra round trip to establish the one fact that decides everything else. Ask for the date, the location and the kind of work up front and a good share of enquiries answer themselves. It filters, too: somebody unwilling to type a date was never close to booking.',
      },
      {
        title: 'The job carries on for weeks after the shutter closes',
        body:
          'Booking is the middle of the process, not the end. There is a contract to sign, a deposit, a balance due before delivery, a gallery to hand over, print or licensing choices, and a client who wants to know where all of it is. Most studios run that across a signing tool, a transfer link, an invoice and a long email thread, and the chasing lands on the photographer. It is the part of the business most obviously suited to a client portal and the part least often built.',
      },
      {
        title: 'One studio is usually three businesses',
        body:
          'Weddings, commercial work and event coverage share a camera and very little else. Different buyers, different lead times, different price shapes, different proof: a couple wants a full day told as a story, a marketing manager wants three usable frames and a licence to publish them. A single portfolio that mixes them serves neither well, and the usual fix — one page called "Work" — is why enquiries keep arriving asking for the wrong thing.',
      },
    ],

    demosIntro:
      'Running demo sites, not screenshots — open them and scroll a gallery on a phone, because that is where the decision actually gets made. The note under each is our read on the kind of studio it suits.',

    demoNotes: {
      design1:
        'The wedding and couples default — warm, romantic, and built for the long scrolling story a full-day gallery needs. Start here if most of your enquiries come from engaged couples.',
      design2:
        'Quiet and restrained, and the one that gets out of the way of the photographs most completely. Suits natural-light portraiture and headshots, where the pitch is taste rather than volume.',
      design3:
        'The commercial direction: fast, bold and structured around deliverables rather than mood. What you want in front of a marketing manager comparing three studios on turnaround.',
      design4:
        'For a fine-art or print practice — a muted gallery feel, and the easiest of the five to hang print sizes, editions and licensing off without the page reading as a shop.',
      design5:
        'Dark, cinematic and the most opinionated of the set. For editorial and fashion work, where the site is expected to be a statement in its own right rather than a neutral frame.',
    },

    softwareIntro:
      'The website is usually the smaller half of what a studio needs. These are the parts that stop the admin eating the week after every shoot.',

    serviceSlugs: ['booking-scheduling', 'client-portals', 'customer-management', 'reviews-reputation'],

    serviceNotes: {
      'booking-scheduling':
        'Enquiries that collect the date, the location and the kind of shoot up front, checked against real availability, with confirmations and reminders that go out on their own.',
      'client-portals':
        'One private link per client for the contract, the invoice, the balance and the delivered gallery — instead of a signing tool, a transfer link and a thread nobody can find again.',
      'customer-management':
        'One record per client with the shoots, the licences granted and what was delivered, so a repeat booking two years later does not begin with a search through an inbox.',
      'reviews-reputation':
        'A review request sent after delivery, while the photographs are still new. Photography is bought on trust from strangers, and a recent review does more of that work than a portfolio can.',
    },

    /* Same honesty rule as the entries above. Everything here is on the client
       live site, which we built. No enquiry counts, no revenue, no testimonial. */
    caseStudy: {
      name: 'Yasin Studio',
      url: 'https://yasin-studios.com',
      matchUrl: 'yasin-studios.com',
      fallbackDescription:
        'A clean, visual-first website for a creative studio — a portfolio that showcases the work and turns visitors into enquiries.',
      tags: ['Web', 'Portfolio', 'Branding'],
      body: [
        'Yasin Studios is a photography and video studio working largely with nonprofits and community organisations, and the studio client this page is written from. The site is built around two offers rather than one undifferentiated portfolio: event coverage — corporate events, fundraisers, community gatherings and mosque events — and video production, meaning brand films, promotional reels and social content.',
        'The booking side is the part a portfolio template would have missed. Enquiries arrive through a booking form that asks for the preferred date and time, the location and the details of the shoot, and the client gets an emailed confirmation instead of silence. The work itself is presented as a mixed gallery of video and stills, which is the honest way to show a studio that sells both rather than picking one and hiding the other.',
      ],
      resultsGap:
        'Results: not published. We have not run a measured before-and-after on this site, and we will not print a number we did not measure. When the enquiry data is in hand and the client is happy for it to be public, the figures go here.',
    },

    faqs: [
      {
        q: 'Can I keep the gallery delivery tool I already use?',
        a: 'Yes, and often you should. Delivery tools are cheap and good, and replacing one is rarely the best use of a build budget. What is worth building is the layer around it: the enquiry that captures a date, the record of who booked what, and one link a client can return to. The gallery can stay where it is.',
      },
      {
        q: 'How do I show a large portfolio without the site being slow?',
        a: 'By deciding what loads first and letting everything else wait. Sized image variants, modern formats, a deliberately light first screen, real lazy loading below it. The constraint is genuine but it is not a trade against quality — a fast site can be full of very large photographs, it just does not send all of them at once.',
      },
      {
        q: 'Should prices be on the site?',
        a: 'Your call, and we do not have a rule about it. A starting figure filters out enquiries you would have declined anyway, which is worth more to a solo photographer than to a studio with a sales process. What we would avoid is a page that promises pricing and then offers only a form, because that costs trust at the exact moment it matters.',
      },
      {
        q: 'Have you actually built for a photographer before?',
        a: 'One, named on this page: Yasin Studios, a photography and video studio working with nonprofits and community organisations — portfolio, two service lines and a booking form that asks for the date. It is live and you can open it. That is the extent of our track record here, and we would rather say so.',
      },
    ],
  },
];

/* ------------------------------ Not yet built ------------------------------ */

/**
 * Verticals asked for, or half-evidenced, that do NOT get a page.
 *
 * Most of these have finished demo designs in lib/showcase/registry.js and no
 * client (plumbing, roofing). At least one has neither, and says so
 * (freelancer websites) — the list is "what we were asked for and cannot
 * honestly write yet", not "what we have drawn".
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
  {
    // No `showcaseCategory` on purpose — unlike the two above, there is not
    // even design work for this one. The template only reads name and note.
    name: 'Freelancer websites',
    note: 'Nothing yet, and not even demo designs. The nearest thing we have shipped is Ingenium, a two-sided marketplace where engineering freelancers find clients — a platform, not a website for one freelancer. Different product, different buyer, so the page would have to be invented.',
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
