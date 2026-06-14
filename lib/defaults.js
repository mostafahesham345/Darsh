export const defaults = {
  meta: {
    fields: {
      title: 'Darsh — Software, embedded & automation studio',
      description:
        'Darsh is a software studio building web apps, embedded systems, and automation for ambitious teams — from the first prototype to production and beyond.',
      year: String(new Date().getFullYear()),
    },
    images: {
      favicon: { url: '/images/Logo.png', path: null },
    },
  },

  nav: {
    fields: {
      portalLabel: 'Client Portal',
    },
    images: {
      logo: { url: '/images/LogoNav.png', path: null },
    },
    links: [
      { label: 'Services', href: '#services' },
      { label: 'Process', href: '#process' },
      { label: 'Why Darsh', href: '#why' },
      { label: 'Work', href: '#work' },
      { label: 'Contact', href: '#contact' },
    ],
  },

  hero: {
    fields: {
      badge: 'Software dev for businesses',
      titleLine1: 'Software, built',
      titleLine2: 'to',
      titleAccent: 'last',
      titleSuffix: '.',
      sub: 'Darsh is a software studio building web apps, embedded systems, and automation for businesses that need things to actually work — from the first prototype to production and beyond.',
    },
    links: {
      primaryCta: { label: 'Start a project', href: '#contact' },
      secondaryCta: { label: 'See our work', href: '#work' },
    },
    kpis: [
      { value: 5, label: 'Products shipped', suffix: '+' },
      { value: 1, label: 'Avg. reply time', suffix: ' day' },
      { value: 100, label: 'Built to hand over', suffix: '%' },
    ],
  },

  ticker: {
    items: [
      'Web Apps', 'Next.js', 'React', 'Node.js', 'Embedded C / C++', 'Firmware',
      'IoT', 'Automation', 'Python', 'APIs & Integrations', 'eCommerce', 'CI / CD',
    ],
  },

  services: {
    fields: {
      eyebrow: 'What we do',
      title: 'From the screen to the silicon.',
      lede: 'We build software across the whole stack — the app your customers see, the firmware running on the device, and the automation quietly doing the work in between.',
    },
    cards: [
      {
        title: 'Websites & web apps',
        description:
          'Fast, beautiful web products — from marketing sites and online stores to full platforms, with a CMS you can run yourself.',
        bullets: ['Websites & web apps', 'eCommerce & CMS', 'Bilingual / RTL'],
        featured: true,
        tag: 'Most booked',
        image: { url: '', path: null },
      },
      {
        title: 'Embedded & IoT',
        description:
          'Firmware and device software for real hardware — sensors, controllers, and connected products that have to work reliably in the field.',
        bullets: ['Firmware (C / C++)', 'Sensors & controllers', 'Connected / IoT'],
        featured: false,
        tag: null,
        image: { url: '', path: null },
      },
      {
        title: 'Automation & integrations',
        description:
          'We replace manual, repetitive work with automation — connecting your tools, moving your data, and building the workflows that run your business.',
        bullets: ['Workflow automation', 'API & system integration', 'Data pipelines & scripts'],
        featured: false,
        tag: null,
        image: { url: '', path: null },
      },
    ],
  },

  process: {
    fields: {
      eyebrow: 'How we work',
      title: 'Four steps. No surprises.',
      lede: 'A simple, transparent process that keeps you in the loop the whole way — clear scope, working increments, and something you own at the end.',
      ctaLabel: 'Book a discovery call',
      ctaHref: '#contact',
    },
    steps: [
      { num: '01', title: 'Discover', description: 'A working session to understand the problem, the constraints, and what success actually looks like.' },
      { num: '02', title: 'Design', description: 'We prototype the real thing early — screens, schematics, or a proof of concept — so you can see it, not imagine it.' },
      { num: '03', title: 'Build', description: 'We build in tight iterations, with working increments you can try along the way.' },
      { num: '04', title: 'Launch', description: 'We ship to production, hand over the docs and source, and make sure your team can own it.' },
    ],
  },

  why: {
    fields: {
      eyebrow: 'Why Darsh',
      title: 'One team. Direct. Built to hand over.',
      lede: 'You work with the engineers who actually build your project — no account managers, no middlemen. Boutique craftsmanship at the speed of a small, focused team.',
    },
    points: [
      { title: 'You work with the makers', description: 'The people you talk to are the people building your software.' },
      { title: 'Clear pricing & timelines', description: 'Scope and cost agreed up front. You always know where things stand.' },
      { title: 'You own what we build', description: 'Clean code, real documentation, and source you keep — no lock-in.' },
    ],
  },

  work: {
    fields: {
      eyebrow: 'Selected work',
      title: "A few of the things we've shipped.",
      lede: 'Live products in production, still run by the teams we built them for.',
    },
    cards: [
      {
        url: 'https://bigbirdzhotchicken.com',
        title: 'Big Birdz Hot Chicken',
        description:
          'Marketing site and online-ordering experience for a Nashville-style hot chicken spot — responsive and fast, with a CMS the owners actually use.',
        tags: ['Web', 'Online Ordering', 'Restaurant'],
        image: { url: '', path: null },
      },
      {
        url: 'https://najah7.com',
        title: 'Najah7',
        description:
          'Bilingual (Arabic/English) platform with RTL-first layouts, performance-tuned media, and a content workflow that lets non-technical editors ship in minutes.',
        tags: ['Next.js', 'Bilingual', 'RTL'],
        image: { url: '', path: null },
      },
      {
        url: 'https://yafagoldencoffeeusa.com',
        title: 'Yafa Golden Coffee USA',
        description:
          'eCommerce storefront for a specialty Yemeni coffee brand — product catalog, checkout, and a story-driven landing experience designed to convert.',
        tags: ['eCommerce', 'Branding', 'Web'],
        image: { url: '', path: null },
      },
      {
        url: 'https://infinitecomfortllc.com',
        title: 'Infinite Comfort LLC',
        description:
          'A clean, trust-building website for a home-comfort services company — clear services, easy quote requests, and fast performance on every device.',
        tags: ['Web', 'Home Services', 'Lead-gen'],
        image: { url: '', path: null },
      },
      {
        url: 'https://yasin-studios.com',
        title: 'Yasin Studio',
        description:
          'A clean, visual-first website for a creative studio — a portfolio that showcases the work and turns visitors into enquiries.',
        tags: ['Web', 'Portfolio', 'Branding'],
        image: { url: '', path: null },
      },
    ],
  },

  contact: {
    fields: {
      eyebrow: 'Start a project',
      title: "Tell us what you're building.",
      lede: 'We reply within one business day — usually faster. No intake forms that go to nowhere.',
      submitLabel: 'Send message',
    },
  },

  footer: {
    fields: {
      brandName: 'Darsh',
      brandTagline: 'Software, built to last.',
      copyright: 'Darsh Studio · All rights reserved',
    },
    images: {
      logo: { url: '/images/Logo.png', path: null },
    },
    links: [
      { label: 'Services', href: '#services' },
      { label: 'Process', href: '#process' },
      { label: 'Work', href: '#work' },
      { label: 'Contact', href: '#contact' },
      { label: 'Client Portal', href: '/portal/login' },
    ],
  },
};
