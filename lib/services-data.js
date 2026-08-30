/* =============================================================================
   Services showcase — edit copy here without touching any layout.
   Each service: { slug, icon, title, tagline, features: [] }
   `icon` maps to an SVG in views/partials/services-grid.ejs (ICONS map).
   Available icons: users, calendar, portal, dashboard, cpu, automation,
                    package, clipboard, award, star, bag, wrench
   ============================================================================= */

export const servicesMeta = {
  eyebrow: 'Software services',
  title: 'Software that runs your business.',
  lede:
    'From customer management to automation, we build the tools small businesses actually need — tailored to exactly how you work, not off-the-shelf compromises.',
};

export const services = [
  {
    slug: 'customer-management',
    icon: 'users',
    title: 'Customer Management',
    tagline: 'Know every customer and never drop a lead.',
    features: ['CRM / customer database', 'Lead tracking', 'Customer notes & history', 'Follow-up reminders', 'Sales pipelines'],
  },
  {
    slug: 'booking-scheduling',
    icon: 'calendar',
    title: 'Online Booking & Scheduling',
    tagline: 'Let customers book themselves — around the clock.',
    features: ['Appointment booking', 'Automated confirmations', 'SMS reminders', 'Staff scheduling', 'Calendar integrations'],
  },
  {
    slug: 'client-portals',
    icon: 'portal',
    title: 'Client Portals',
    tagline: 'A private home base for every client.',
    features: ['View invoices', 'Check project status', 'Upload files', 'Sign documents', 'Request support'],
  },
  {
    slug: 'admin-dashboards',
    icon: 'dashboard',
    title: 'Custom Admin Dashboards',
    tagline: 'Run the whole operation from one screen.',
    features: ['Manage products', 'Manage employees', 'Appointments & orders', 'Customer inquiries', 'Generate reports'],
  },
  {
    slug: 'ai-automation',
    icon: 'cpu',
    title: 'AI & Automation',
    tagline: 'Put the busywork on autopilot with AI.',
    features: ['AI chatbots & FAQ bots', 'Automated customer support', 'Lead qualification', 'AI appointment booking', 'AI email responses'],
  },
  {
    slug: 'process-automation',
    icon: 'automation',
    title: 'Business Process Automation',
    tagline: 'Connect your tools and let the work run itself.',
    features: ['Auto-send invoices', 'Generate contracts', 'Follow up with leads', 'Send review requests', 'Move data between systems'],
  },
  {
    slug: 'inventory-management',
    icon: 'package',
    title: 'Inventory Management',
    tagline: 'Always know what you have and what you need.',
    features: ['Product tracking', 'Low-stock alerts', 'Purchase orders', 'Warehouse management'],
  },
  {
    slug: 'internal-software',
    icon: 'clipboard',
    title: 'Internal Company Software',
    tagline: 'Retire the spreadsheets for good.',
    features: ['Employee management', 'Job tracking', 'Maintenance tracking', 'Inspection software', 'Safety tracking'],
  },
  {
    slug: 'loyalty-programs',
    icon: 'award',
    title: 'Customer Loyalty Programs',
    tagline: 'Turn one-time buyers into regulars.',
    features: ['Points systems', 'Rewards', 'Referral programs', 'Membership portals'],
  },
  {
    slug: 'reviews-reputation',
    icon: 'star',
    title: 'Review & Reputation Management',
    tagline: 'More 5-star reviews, on autopilot.',
    features: ['Google review requests', 'Automated follow-up emails', 'Review monitoring', 'Customer feedback systems'],
  },
  {
    slug: 'ecommerce',
    icon: 'bag',
    title: 'E-Commerce',
    tagline: 'Sell online, your way.',
    features: ['Online stores', 'Subscriptions', 'Wholesale portals', 'Customer ordering systems'],
  },
  {
    slug: 'contractor-software',
    icon: 'wrench',
    title: 'Contractor & Service Business Software',
    tagline: 'Built for HVAC, plumbing, roofing, landscaping & cleaning.',
    features: ['Estimates & invoices', 'Route planning', 'Job scheduling', 'Technician tracking'],
  },
];

/* =============================================================================
   Service detail pages — /services and /services/<slug>
   -----------------------------------------------------------------------------
   Everything below is ADDITIVE: `services` and `servicesMeta` above still drive
   the homepage grid and are untouched.

   `serviceDetails` is keyed by the same `slug` as the array above and carries
   the long-form copy each standalone page needs to be worth ranking:

     seoTitle        <title> for the page, WITHOUT the brand. views/service.ejs
                     appends " — <BUSINESS_NAME>" so the brand stays in one
                     place; kept short enough that the pair is not truncated in
                     search results (~60 chars including the suffix).
     metaDescription <meta name="description">, ~150 chars, written as a claim a
                     human would click — not a keyword list.
     intro[]         Paragraphs answering "what is this, in plain words".
     problem         The situation it fixes. { title, body }
     audience        Who it is for. { title, body }
     featureNotes    Keyed by the EXACT feature string in `services[].features`,
                     so each bullet on the page gets a sentence of substance.
                     A feature with no note still renders — it just shows the
                     bullet on its own, so adding a feature never breaks a page.
     outcomes[]      What the client ends up owning. { title, body }

   Every claim here has to be one the studio can stand behind: these describe
   what we build, not capabilities nobody has shipped. Tone matches
   lib/defaults.js — direct, concrete, no hype.

   A service listed in `services` above but missing here still gets a page (the
   route falls back to tagline + features), but it will be thin. Add an entry
   whenever you add a service.
   ============================================================================= */

export const servicesIndexMeta = {
  seoTitle: 'Software services for small businesses',
  metaDescription:
    'Custom software for small businesses: CRM, online booking, client portals, admin dashboards, AI and workflow automation, e-commerce and internal tools.',
  eyebrow: 'Software services',
  title: 'Software that runs your business.',
  lede:
    'Every service below is something we build from scratch and hand over to you — shaped around how your business already works, not around a template you have to bend yourself into.',
  intro: [
    'Most small businesses do not need more software. They need the right software: one system that matches how the work actually happens, instead of five subscriptions that each solve a quarter of the problem and none of which talk to each other.',
    'That is what we build. Pick the piece you need most — customer records, online booking, a portal for your clients, an admin screen for your team, or automation that quietly does the repetitive work — and we scope it, build it in working increments, and hand over the source and documentation at the end.',
  ],
};

export const serviceDetails = {
  'customer-management': {
    seoTitle: 'Customer Management Software (Custom CRM)',
    metaDescription:
      'A custom CRM built around how you actually sell — one record per customer, a pipeline that matches your real stages, and follow-ups that never get forgotten.',
    intro: [
      'Customer management software is the one place your business keeps everyone it deals with: the enquiry that came in last night, the customer you have invoiced for six years, and every conversation in between. We build it to fit the way you already sell, rather than asking your team to rearrange their week around someone else’s product.',
      'In practice that means a customer database, a pipeline with your real stages on it, and reminders that fire when someone has gone quiet. Only the fields your team will actually fill in, and only the views they will actually open.',
    ],
    problem: {
      title: 'The problem it solves',
      body:
        'Customer information tends to scatter: a phone’s contact list, an inbox, a shared spreadsheet, and whatever one person happens to remember. Leads go cold because nobody was sure whose turn it was to call. History disappears when the person who owned the account is on holiday. Quotes get sent twice, or not at all. One system removes the guesswork — one record per customer, one owner, one clear next step.',
    },
    audience: {
      title: 'Who it’s for',
      body:
        'Businesses that sell to the same people more than once, or that take more enquiries than one person can hold in their head. Service companies quoting jobs, studios running retainers, suppliers with wholesale accounts, clinics with returning patients — anyone whose sales process currently lives in a spreadsheet only one person fully understands.',
    },
    featureNotes: {
      'CRM / customer database':
        'One searchable record per customer — contacts, addresses, tags, and what you have agreed — owned by the business rather than by whoever’s phone it was saved on.',
      'Lead tracking':
        'Every enquiry lands in the same queue with a source, an owner, and a status, so you can see at a glance what came in this week and what is still unanswered.',
      'Customer notes & history':
        'Calls, site visits, and decisions logged against the customer, so whoever picks the thread up next starts with the full story instead of an apology.',
      'Follow-up reminders':
        'Automatic nudges when a quote or a lead has been quiet too long. The follow-up nobody remembers to send is usually the one that would have closed.',
      'Sales pipelines':
        'Your stages, not a generic template — move a deal along and see what is genuinely in play this month, and what has quietly stalled.',
    },
    outcomes: [
      {
        title: 'A system shaped like your process',
        body:
          'We map how you sell before we build anything, so the stages, fields, and permissions match the way your team already works. Nobody has to be retrained into someone else’s workflow.',
      },
      {
        title: 'One honest view of the pipeline',
        body:
          'What came in, what was quoted, what is waiting on you, and what is waiting on the customer — visible without anyone assembling a report by hand.',
      },
      {
        title: 'Data you own outright',
        body:
          'A clean database schema, documentation, and the source code, handed over at launch. Your customer list is yours to export, migrate, or extend at any point.',
      },
    ],
  },

  'booking-scheduling': {
    seoTitle: 'Online Booking & Scheduling Software',
    metaDescription:
      'Online booking your customers can use at midnight: real-time availability, automatic confirmations, SMS reminders, and staff schedules that stay in sync.',
    intro: [
      'Online booking turns your calendar into something customers can use themselves. They see genuine availability, pick a slot, and get a confirmation — with no phone tag, no double bookings, and no one on your side retyping appointments into a second calendar.',
      'We build the booking flow around your real rules: how long each service takes, who is qualified to do it, how much buffer you need between jobs, and how far ahead people may book. Those rules are what make self-service booking safe to switch on.',
    ],
    problem: {
      title: 'The problem it solves',
      body:
        'Booking by phone caps your business at the hours someone can answer it. Enquiries that arrive in the evening go to a competitor who took the booking while you slept. Meanwhile no-shows quietly cost you the slot and the revenue, and every reschedule is three messages long. Self-service booking with automatic reminders fixes both ends of that: customers book when it suits them, and they turn up because they were reminded.',
    },
    audience: {
      title: 'Who it’s for',
      body:
        'Any business that sells time. Clinics, salons and barbers, trades running site visits, tutors and instructors, consultants, inspectors, studios and rental businesses — particularly ones with several staff, several service types, or availability that is genuinely more complicated than a nine-to-five grid.',
    },
    featureNotes: {
      'Appointment booking':
        'A booking page that shows only slots you can actually honour, with the duration, price, and prep questions attached to each service type.',
      'Automated confirmations':
        'The customer gets a confirmation immediately, with a calendar invite and the details they need — no one on your team has to send it.',
      'SMS reminders':
        'A text before the appointment, at a lead time you choose. Reminders are the cheapest thing you can do about no-shows.',
      'Staff scheduling':
        'Per-person hours, skills, time off, and buffers, so the system never books someone who is not available or not qualified for that job.',
      'Calendar integrations':
        'Two-way sync with the calendars your team already lives in, so a personal commitment blocks the slot before a customer can take it.',
    },
    outcomes: [
      {
        title: 'Bookings taken around the clock',
        body:
          'Your availability stops depending on someone being free to pick up the phone, and evening or weekend enquiries stop leaking away.',
      },
      {
        title: 'Fewer no-shows and fewer clashes',
        body:
          'Automatic confirmations and reminders, plus one authoritative calendar, so two customers can never be sold the same slot.',
      },
      {
        title: 'A schedule your team can run',
        body:
          'Staff see their own day, managers see the whole board, and changes propagate everywhere at once instead of being re-entered by hand.',
      },
    ],
  },

  'client-portals': {
    seoTitle: 'Client Portal Development',
    metaDescription:
      'A private, branded portal where each client can see invoices and project status, upload files, sign documents, and ask for help — without emailing you first.',
    intro: [
      'A client portal is a private, logged-in area where each of your clients finds their own things: invoices, project status, documents, files, and a way to reach you. Everything is scoped to that client, so they see all of their information and none of anyone else’s.',
      'It replaces the running email thread as your system of record. Rather than searching an inbox for the version you sent in March, both sides open the same page and look at the same current answer.',
    ],
    problem: {
      title: 'The problem it solves',
      body:
        '"Can you resend the invoice?" "Where are we on this?" "Did you get my file?" Individually these take two minutes; together they consume a working day a week and interrupt whoever is actually doing the work. Worse, the answers are scattered across inboxes, so the information a client needs depends on which employee they happen to ask. A portal makes the current state permanently visible, which turns most of those interruptions into a self-service look-up.',
    },
    audience: {
      title: 'Who it’s for',
      body:
        'Businesses with ongoing client relationships and paperwork attached to them: agencies and studios, contractors running multi-stage jobs, accountants and bookkeepers, law and consulting practices, and anyone who currently sends invoices, documents, and status updates by email one at a time.',
    },
    featureNotes: {
      'View invoices':
        'Every invoice a client has ever had, with its status, in one list they can open at 9pm without asking anyone.',
      'Check project status':
        'The current stage, what happened recently, and what you are waiting on from them — so the update is available before it is requested.',
      'Upload files':
        'Clients drop documents, photos, and assets straight onto the right job, instead of into an email that gets buried.',
      'Sign documents':
        'Contracts and approvals signed in the portal, with a record of who signed what and when.',
      'Request support':
        'A single front door for questions and change requests, tracked and assigned, rather than scattered across personal inboxes.',
    },
    outcomes: [
      {
        title: 'Fewer status emails',
        body:
          'The routine questions answer themselves, which frees your team for the work clients are actually paying for.',
      },
      {
        title: 'One place both sides trust',
        body:
          'Files, invoices, and signed documents live together, so nobody is reconstructing a project’s history out of an email chain.',
      },
      {
        title: 'A more professional handover',
        body:
          'A branded, secure portal is a visible signal of how you run projects — often the difference between looking like a supplier and looking like a partner.',
      },
    ],
  },

  'admin-dashboards': {
    seoTitle: 'Custom Admin Dashboards & Back Offices',
    metaDescription:
      'One custom admin screen to run the whole operation — products, staff, orders, appointments, and enquiries — plus the reports you actually need to make decisions.',
    intro: [
      'An admin dashboard is the back office of your business: the screen your team logs into to change prices, add staff, work through today’s orders, answer enquiries, and see how the month is going. Off-the-shelf tools each give you a dashboard for their slice of the business. A custom one gives you a single screen for the whole thing.',
      'We build it around the jobs your team does every day, so the actions they perform twenty times a day are one click, and the ones they perform twice a year are still findable. Roles and permissions decide who can see and change what.',
    ],
    problem: {
      title: 'The problem it solves',
      body:
        'Once a business runs on four or five separate tools, someone has to be the integration layer — copying numbers between systems, checking two screens to answer one question, and rebuilding the same report by hand every month. That work is invisible, expensive, and error-prone. Pulling the daily operations into one place removes the copying, and makes reporting a query rather than an afternoon.',
    },
    audience: {
      title: 'Who it’s for',
      body:
        'Owner-operators who want a single screen instead of a browser full of tabs, and small teams who have outgrown shared spreadsheets — especially where several people need different levels of access to the same data, or where an existing tool almost fits but forces an awkward workaround every single day.',
    },
    featureNotes: {
      'Manage products':
        'Add products, edit prices, upload images, and change what is visible — without a developer, and without touching a spreadsheet import.',
      'Manage employees':
        'Accounts, roles, and permissions, so the front desk, a technician, and the owner each see the parts of the system that belong to them.',
      'Appointments & orders':
        'The live queue of work: what is booked, what is paid, what is out for delivery, and what needs attention today.',
      'Customer inquiries':
        'Messages from the website and elsewhere land in one inbox, assigned and tracked, so nothing dies in a personal mailbox.',
      'Generate reports':
        'The numbers you actually run the business on — revenue, jobs, stock, staff activity — exportable, and current when you open the page.',
    },
    outcomes: [
      {
        title: 'One screen instead of five tabs',
        body:
          'The daily operating picture in one place, so answering a customer question does not mean cross-referencing three systems.',
      },
      {
        title: 'Changes without a developer',
        body:
          'Prices, products, staff, and content are yours to edit. We hand over the admin, not a dependency on us for every text change.',
      },
      {
        title: 'Reporting you can trust',
        body:
          'Figures generated from your live data rather than assembled by hand, so two people asking the same question get the same answer.',
      },
    ],
  },

  'ai-automation': {
    seoTitle: 'AI & Automation for Small Business',
    metaDescription:
      'AI that answers the repetitive questions, qualifies leads, books appointments, and drafts replies — with clear limits and a clean handover to a human.',
    intro: [
      'AI is most useful for the work that is high-volume, low-judgement, and endlessly repetitive: the same fifteen questions from customers, the first pass at sorting an enquiry, the draft of a reply that a person then approves. We build that layer into your existing systems, so it works with your real prices, hours, and availability rather than guessing.',
      'The design principle we hold to is that AI handles the routine and hands the rest to a person, visibly and quickly. A bot that confidently invents an answer is worse than no bot, so we scope what it is allowed to say, and give it a clear escalation path.',
    ],
    problem: {
      title: 'The problem it solves',
      body:
        'A large share of customer contact is repetitive: opening hours, price ranges, whether you cover an area, whether a slot is free, where an order is. Answering it manually is slow for the customer and expensive for you, and it always competes with the work that actually earns money. Meanwhile enquiries that arrive after hours wait until morning — which is often long enough for someone else to win the job.',
    },
    audience: {
      title: 'Who it’s for',
      body:
        'Businesses handling more enquiries than their team can answer promptly, especially where most questions have the same handful of answers. Also teams whose inbox is the bottleneck: where a reply that takes five minutes to write is taking a day to send, and speed of response is part of how you win work.',
    },
    featureNotes: {
      'AI chatbots & FAQ bots':
        'An assistant grounded in your actual policies, prices, and service area — answering instantly, and saying "let me get a person" rather than improvising when it does not know.',
      'Automated customer support':
        'First-line answers, order and job status look-ups, and routing to the right person, with the whole conversation logged for whoever picks it up.',
      'Lead qualification':
        'Incoming enquiries triaged and enriched — what they want, where they are, how urgent — so your team spends its time on the ones worth a call.',
      'AI appointment booking':
        'A conversation that ends in a real slot on the real calendar, checked against your live availability and booking rules.',
      'AI email responses':
        'Drafted replies in your tone, ready for a human to glance at and send — the slow part of an inbox is writing, not deciding.',
    },
    outcomes: [
      {
        title: 'Answers in seconds, at any hour',
        body:
          'Routine questions get handled the moment they are asked, including in the evenings and at weekends when enquiries are most likely to go elsewhere.',
      },
      {
        title: 'Your team on the work that needs judgement',
        body:
          'The repetitive tier is absorbed, so the people you pay for expertise spend their time on the conversations that need it.',
      },
      {
        title: 'Boundaries you set',
        body:
          'We define what the AI may answer, what it must escalate, and what it must never claim — then log every conversation so you can check it is behaving.',
      },
    ],
  },

  'process-automation': {
    seoTitle: 'Business Process Automation',
    metaDescription:
      'Connect the tools you already use and let routine work run itself: invoices, contracts, follow-ups, review requests, and data moving between systems.',
    intro: [
      'Business process automation is about the work that happens between your tools. A job is marked complete, so an invoice should go out, the customer should get a receipt, a review request should follow three days later, and the accounting system should know about all of it. Done by hand, that is five minutes and four chances to forget. Automated, it is instant and consistent.',
      'We start by mapping what actually happens today, step by step, including the parts that only live in someone’s head. Then we automate the steps that are genuinely mechanical and leave the judgement calls to people — with a record of every action, so you can always see what ran and what it did.',
    ],
    problem: {
      title: 'The problem it solves',
      body:
        'Manual handoffs are where small businesses lose money quietly. Invoices go out late because someone was busy. Follow-ups are skipped in a busy week. The same customer details get typed into three systems, slightly differently each time, and then nobody is sure which one is right. None of it is anyone’s fault — it is just work that depends on a human remembering, at a moment when they have twenty other things to do.',
    },
    audience: {
      title: 'Who it’s for',
      body:
        'Businesses whose day contains a lot of repeatable, rule-based steps: quoting, invoicing, onboarding, dispatch, renewals, reporting. If you can describe a task as "when X happens, we always do Y", it is a candidate — and if it is currently done by copying data from one screen to another, it is a strong one.',
    },
    featureNotes: {
      'Auto-send invoices':
        'Invoices raised and sent the moment the triggering event happens, with reminders for the ones that go unpaid.',
      'Generate contracts':
        'Agreements produced from your template with the right details filled in, ready to send for signature — no copy-paste, no last client’s name left in.',
      'Follow up with leads':
        'Timed, personal follow-up sequences that keep running when the week gets busy, and stop the moment a human replies.',
      'Send review requests':
        'A request that goes out automatically at the moment a customer is happiest — right after the work is finished, not weeks later.',
      'Move data between systems':
        'Integrations that keep your website, CRM, calendar, and accounting in agreement, so a change in one place is not a re-typing job in three others.',
    },
    outcomes: [
      {
        title: 'Hours back every week',
        body:
          'The mechanical steps stop consuming attention. What was a checklist someone works through becomes something that has already happened.',
      },
      {
        title: 'It happens every time',
        body:
          'Automated steps do not skip a busy Friday. Invoices, follow-ups, and requests go out on the same schedule whether or not anyone is watching.',
      },
      {
        title: 'A visible audit trail',
        body:
          'Every automated action is logged, so when something looks wrong you can see exactly what ran, when, and with what data.',
      },
    ],
  },

  'inventory-management': {
    seoTitle: 'Inventory Management Software',
    metaDescription:
      'Know what you have, what is moving, and what to reorder — product tracking, low-stock alerts, purchase orders, and warehouse locations in one system.',
    intro: [
      'Inventory software answers three questions continuously: what do we have, where is it, and what do we need to order. We build it around how your stock actually moves — by unit, by batch, by location, or by variant — and connect it to the places stock is consumed, so the count keeps itself current.',
      'The goal is not a perfect warehouse. It is a number you can trust enough to make decisions from without walking out to the shelf to check.',
    ],
    problem: {
      title: 'The problem it solves',
      body:
        'When the stock count lives in a spreadsheet updated after the fact, it is wrong within days. That shows up as selling something you cannot ship, paying for a rush order that a better count would have avoided, or tying up cash in stock that has not moved in a year. Every one of those is expensive, and none of them appear on a report until after the money is gone.',
    },
    audience: {
      title: 'Who it’s for',
      body:
        'Retailers, wholesalers, workshops, and service businesses that carry parts. Especially useful once stock sits in more than one place, or once more than one person can move it — that is the point at which an informal count stops being reliable.',
    },
    featureNotes: {
      'Product tracking':
        'Live quantities per product and variant, with the movement history behind each number so you can see how a discrepancy happened.',
      'Low-stock alerts':
        'Reorder thresholds per item, so you find out you are running low while there is still time to do something about it.',
      'Purchase orders':
        'Raise, send, and receive orders against suppliers, with incoming stock reflected the moment it is booked in.',
      'Warehouse management':
        'Multiple locations, bins, and transfers, so "we have four" also tells you which site they are at.',
    },
    outcomes: [
      {
        title: 'A count you can act on',
        body:
          'Stock levels that update as things happen, so ordering and selling decisions are made on the current picture rather than last month’s.',
      },
      {
        title: 'Less cash sitting on shelves',
        body:
          'Visibility into what actually moves lets you reorder the fast lines and stop repurchasing the slow ones.',
      },
      {
        title: 'Fewer disappointed customers',
        body:
          'Not selling what you cannot ship is the cheapest customer-service improvement most stock-carrying businesses can make.',
      },
    ],
  },

  'internal-software': {
    seoTitle: 'Custom Internal Company Software',
    metaDescription:
      'Custom internal software to replace the spreadsheets — employee records, job tracking, maintenance, inspections, and safety logs your team will actually use.',
    intro: [
      'Internal software is the set of tools your team uses to run the work itself: tracking jobs, recording inspections, logging maintenance, keeping employee records, and proving that safety procedures were followed. It is rarely something you can buy off the shelf, because it is the part of your business that is genuinely yours.',
      'Most companies do have this software already — it is just a folder of spreadsheets held together by one person’s conventions. We build the version that survives that person going on holiday.',
    ],
    problem: {
      title: 'The problem it solves',
      body:
        'Spreadsheets are excellent until several people need to use one at once. Then you get conflicting copies, a formula someone broke in March, no history of who changed what, and no way to stop the wrong person seeing the wrong tab. The failure is not dramatic — it is a slow loss of trust in the numbers, until people start keeping their own private copy and the shared file becomes fiction.',
    },
    audience: {
      title: 'Who it’s for',
      body:
        'Teams whose core operational process is specific to them — field service, manufacturing, facilities, logistics, inspection and compliance work — and businesses that have hit the ceiling of what a shared spreadsheet can safely do, particularly where records have to be defensible after the fact.',
    },
    featureNotes: {
      'Employee management':
        'Records, roles, certifications, and permissions in one place, with the right access for each person rather than one shared login.',
      'Job tracking':
        'Every job from creation to sign-off, with owners, status, and history — so the answer to "where is that at?" does not require a phone call.',
      'Maintenance tracking':
        'Scheduled and reactive maintenance logged against equipment, with what was done, by whom, and when the next one is due.',
      'Inspection software':
        'Structured checklists completed on a phone in the field, with photos and timestamps attached to the record.',
      'Safety tracking':
        'Incidents, checks, and sign-offs recorded as they happen, so compliance evidence exists as a by-product of doing the work properly.',
    },
    outcomes: [
      {
        title: 'One version of the truth',
        body:
          'Shared records with real permissions and a change history, instead of five copies of a file with slightly different numbers.',
      },
      {
        title: 'Records that hold up',
        body:
          'Timestamped, attributable entries with photos and sign-offs, so an audit or a dispute is a search rather than an archaeology project.',
      },
      {
        title: 'Software your team will use',
        body:
          'We design around the job as it is done — often on a phone, often outdoors, often in a hurry. Tools that fight the work get abandoned.',
      },
    ],
  },

  'loyalty-programs': {
    seoTitle: 'Customer Loyalty Program Software',
    metaDescription:
      'Points, rewards, referrals, and a membership portal built into your own systems — a loyalty program that fits your margins and actually brings customers back.',
    intro: [
      'A loyalty program is a structured reason to come back. Points, tiers, member pricing, or referral rewards — the mechanic matters less than whether it is easy to join, obvious what you have earned, and painless to redeem. We build it into your own systems so it works at the counter and online with the same balance.',
      'We model the economics with you before writing any of it. A program that is generous enough to change behaviour but priced into your margins is a design decision, not an afterthought.',
    ],
    problem: {
      title: 'The problem it solves',
      body:
        'Winning a new customer costs far more than keeping an existing one, yet most small businesses spend nearly all their marketing effort on acquisition and have no mechanism at all for repeat purchase. Meanwhile the customers most likely to recommend you are given no easy way to do it. Loyalty and referral mechanics turn goodwill you already have into revenue you are currently leaving on the table.',
    },
    audience: {
      title: 'Who it’s for',
      body:
        'Businesses built on repeat purchase — cafés, restaurants, salons, retail, and subscription or membership services — and any business with genuinely happy customers who would refer friends if there were an obvious way to do so.',
    },
    featureNotes: {
      'Points systems':
        'Earning rules that match how you actually sell, with a balance the customer can see and staff can check in a second.',
      'Rewards':
        'Redemption that works in person and online against the same balance, with the rules and limits you set.',
      'Referral programs':
        'Trackable referrals with a reward on both sides, so recommending you is easy and the credit lands with the right person.',
      'Membership portals':
        'A logged-in area for members — status, tier, history, and perks — that gives paid or premium membership something concrete to be.',
    },
    outcomes: [
      {
        title: 'More repeat visits',
        body:
          'A visible balance is a standing reason to choose you again, and it works hardest on the customers who were already close to loyal.',
      },
      {
        title: 'Referrals you can actually track',
        body:
          'Word of mouth stops being invisible: you can see who is sending people and reward them properly for it.',
      },
      {
        title: 'A customer list you own',
        body:
          'Sign-ups build a first-party list of people who have chosen to hear from you — an asset that keeps working long after the program launches.',
      },
    ],
  },

  'reviews-reputation': {
    seoTitle: 'Review & Reputation Management Software',
    metaDescription:
      'Ask every happy customer for a review at the right moment, follow up automatically, and see new reviews as they land — without chasing anyone by hand.',
    intro: [
      'Most businesses have far more happy customers than reviews. The gap is almost never sentiment — it is that nobody asked, or asked three weeks late, or asked in a way that took the customer six clicks to complete. We automate the asking, at the moment it works best, with a link that takes one tap.',
      'Alongside that, monitoring means you find out about a new review when it appears rather than when a customer mentions it, so a problem can be answered while it is still fresh.',
    ],
    problem: {
      title: 'The problem it solves',
      body:
        'Reviews are one of the first things a prospective customer looks at, and for local businesses they influence search visibility as well. Asking by hand is the part that fails: it is awkward, it is easy to forget, and it competes with real work. The predictable result is a page with a handful of reviews, some of them years old, and an occasional negative one sitting unanswered at the top.',
    },
    audience: {
      title: 'Who it’s for',
      body:
        'Local and service businesses where reviews drive enquiries — trades, clinics, restaurants, salons, contractors, agencies — particularly ones who know their service is good but whose public rating does not yet reflect the number of people who would say so.',
    },
    featureNotes: {
      'Google review requests':
        'A request sent right after the job, with a direct link straight to the review box — the fewer steps between intention and submission, the more reviews you get.',
      'Automated follow-up emails':
        'One polite reminder for people who meant to and forgot, which is most of them, and then it stops.',
      'Review monitoring':
        'New reviews surfaced as they land, so a complaint can be answered the same day rather than discovered a month later.',
      'Customer feedback systems':
        'A private feedback channel alongside the public ask, so unhappy customers tell you first and you get the chance to fix it.',
    },
    outcomes: [
      {
        title: 'A steady flow of reviews',
        body:
          'Asking becomes automatic and consistent instead of occasional, which is the entire difference between a stale page and a current one.',
      },
      {
        title: 'Problems caught early',
        body:
          'Monitoring plus a private feedback route means you usually hear about a bad experience before the internet does.',
      },
      {
        title: 'Proof where buyers look',
        body:
          'Recent, plentiful reviews are what a prospective customer checks before they call — and they are working for you at hours you are not.',
      },
    ],
  },

  ecommerce: {
    seoTitle: 'E-Commerce Development',
    metaDescription:
      'Online stores, subscriptions, wholesale portals, and customer ordering systems — built around your catalogue, your pricing rules, and your fulfilment.',
    intro: [
      'We build online selling that fits the way your business sells: a straightforward storefront, a subscription with real billing logic, a wholesale portal with per-customer pricing, or a reordering system for regulars who buy the same thing every week.',
      'The interesting work in e-commerce is rarely the product grid. It is pricing rules, stock, shipping, tax, and what happens after the order — the parts that decide whether the store saves you work or creates it.',
    ],
    problem: {
      title: 'The problem it solves',
      body:
        'Generic store templates handle the simple case well and then stop. Tiered trade pricing, minimum order quantities, deposits, mixed subscription and one-off carts, or an order that has to reach a production system — each of these turns into a plugin, then a workaround, then a manual step someone performs every day. Building the rules properly means the store handles your real orders instead of the easy ones.',
    },
    audience: {
      title: 'Who it’s for',
      body:
        'Brands selling direct, suppliers selling to trade accounts, businesses moving from phone-and-email orders to self-service, and anyone whose pricing, packaging, or fulfilment rules do not fit neatly into a standard checkout.',
    },
    featureNotes: {
      'Online stores':
        'A fast, mobile-first storefront with a checkout designed to be finished — the whole point of the build is the order, not the browsing.',
      'Subscriptions':
        'Recurring billing, plan changes, pauses, and failed-payment handling, so a subscription business does not depend on someone chasing cards manually.',
      'Wholesale portals':
        'Logged-in trade accounts with negotiated pricing, minimum quantities, and fast reordering from previous orders.',
      'Customer ordering systems':
        'Ordering built for regulars — saved lists, repeat orders, and account terms — which is a different job from a first-time consumer checkout.',
    },
    outcomes: [
      {
        title: 'Orders that arrive ready to fulfil',
        body:
          'Correct pricing, valid quantities, and the details you need captured up front, so an order does not need a phone call before it can be processed.',
      },
      {
        title: 'Selling without a phone call',
        body:
          'Regulars and trade accounts serve themselves, which removes order-taking from your team’s day and removes waiting from your customer’s.',
      },
      {
        title: 'A store connected to the rest',
        body:
          'Stock, customers, and orders shared with your other systems, so the website is part of the business rather than a separate island of data.',
      },
    ],
  },

  'contractor-software': {
    seoTitle: 'Software for Contractors & Service Businesses',
    metaDescription:
      'Software for HVAC, plumbing, roofing, landscaping, and cleaning teams — estimates, invoices, job scheduling, route planning, and technician tracking.',
    intro: [
      'Field service businesses run on a chain that has to hold together every day: the call comes in, someone quotes it, a technician is scheduled, the work gets done, and an invoice goes out. When each link lives in a different place — a notebook, a wall calendar, a phone, an accounting package — the chain breaks at the handoffs.',
      'We build the version where it is one system. The estimate becomes the job, the job becomes the schedule, and the completed job becomes the invoice, with the technician’s notes and photos attached to all of it.',
    ],
    problem: {
      title: 'The problem it solves',
      body:
        'The expensive failures in field service are mundane. A quote written on site never gets typed up. A job is invoiced a fortnight late, or not at all. Two technicians are sent across town past each other because nobody planned the route. A customer calls to ask where the engineer is and the office genuinely does not know. Each one costs a little money and a little trust, and they happen every week.',
    },
    audience: {
      title: 'Who it’s for',
      body:
        'HVAC, plumbing, electrical, roofing, landscaping, and cleaning businesses — particularly ones with several vans on the road, where the office needs to know what is happening in the field and the field needs the job details without phoning the office.',
    },
    featureNotes: {
      'Estimates & invoices':
        'Quotes produced on site from your price list, converted to an invoice when the job is signed off, so billing stops trailing weeks behind the work.',
      'Route planning':
        'Jobs sequenced sensibly across the day, because drive time between calls is the largest recoverable cost in most field businesses.',
      'Job scheduling':
        'A dispatch board showing who is where, what is unassigned, and where the space is for today’s emergency call.',
      'Technician tracking':
        'Job status from the field — on the way, on site, complete — with notes and photos attached, so the office can answer the customer without calling the van.',
    },
    outcomes: [
      {
        title: 'Quote to invoice in one chain',
        body:
          'Details entered once carry through the job, which removes the re-typing and the late invoices that come with it.',
      },
      {
        title: 'More jobs in the same day',
        body:
          'Better sequencing and fewer wasted trips turn drive time into billable time, without asking anyone to work longer.',
      },
      {
        title: 'An office that knows what is happening',
        body:
          'Live job status means a customer question gets an answer immediately, instead of a promise to call them back.',
      },
    ],
  },
};

/** One service by slug, or null. The route uses this for its 404 decision. */
export function getService(slug) {
  return services.find((s) => s.slug === slug) || null;
}

/**
 * Long-form copy for a service. Returns null when a service has no entry yet —
 * views/service.ejs falls back to the tagline and feature list.
 */
export function getServiceDetail(slug) {
  return serviceDetails[slug] || null;
}
