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
