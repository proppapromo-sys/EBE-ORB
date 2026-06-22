/**
 * blueprints.ts — the Blueprint Library. The "accumulated structure knowledge" so ORB starts
 * every build from a proven skeleton instead of from zero. Add a blueprint = teach ORB a new
 * kind of thing it can construct fast. Same genome runs all of them.
 */
import type { Blueprint, BuildCategory } from './types.js';

export const BLUEPRINTS: Blueprint[] = [
  {
    id: 'marketing-site',
    category: 'marketing',
    name: 'Marketing / Landing Site',
    summary: 'A fast, conversion-focused business site: hero, offer, proof, call-to-action.',
    stack: ['Static HTML/CSS/JS or Next.js', 'Tailwind CSS', 'Deployed on Render/Cloudflare'],
    structure: [
      'index.html (or app/page.tsx)',
      'styles/ (design tokens, layout)',
      'sections/ (hero, features, proof, pricing, faq, cta, footer)',
      'assets/ (images, logo, og-image)',
      'forms/ (contact / lead capture)'
    ],
    components: ['Hero', 'Feature grid', 'Social proof / testimonials', 'Pricing', 'FAQ', 'Lead form', 'Footer'],
    designDefaults: { typography: 'one display + one body face', spacing: 'generous, 8pt grid', motion: 'subtle fade/slide on scroll', tone: 'clear, confident, benefit-led' },
    launchChecklist: ['Mobile responsive', 'Fast load (<2s)', 'SEO meta + OG tags', 'Working lead form', 'Analytics', 'Favicon + 404']
  },
  {
    id: 'webapp-dashboard',
    category: 'webapp',
    name: 'Web App / SaaS Dashboard',
    summary: 'An authenticated product: sign-in, dashboard, data tables, settings, billing.',
    stack: ['Next.js / React', 'Tailwind CSS', 'Supabase (auth + Postgres)', 'Stripe (billing)'],
    structure: [
      'app/ (routes: /login, /dashboard, /settings, /billing)',
      'components/ (nav, sidebar, table, card, modal, form)',
      'lib/ (auth, db client, api)',
      'db/ (schema, migrations)',
      'styles/ (design tokens)'
    ],
    components: ['Auth (sign-in/up)', 'App shell (nav + sidebar)', 'Dashboard cards', 'Data table', 'Detail/edit forms', 'Settings', 'Billing/subscription'],
    designDefaults: { typography: 'single clean UI face', spacing: 'compact, dense data', motion: 'fast, functional', tone: 'neutral, trustworthy, efficient' },
    launchChecklist: ['Auth + protected routes', 'Empty/loading/error states', 'Role permissions', 'Responsive tables', 'Billing wired', 'Account deletion']
  },
  {
    id: 'ecommerce-booking',
    category: 'ecommerce',
    name: 'E-commerce / Booking',
    summary: 'Sell products or take reservations: catalog/services, cart or calendar, checkout.',
    stack: ['Next.js / React', 'Tailwind CSS', 'Stripe Checkout', 'Supabase (orders/bookings)'],
    structure: [
      'app/ (routes: /shop or /services, /item/[id], /cart, /checkout, /confirm)',
      'components/ (product card, gallery, cart, calendar/slot picker, checkout form)',
      'lib/ (catalog, cart state, payments, availability)',
      'db/ (products/services, orders/bookings)',
      'styles/'
    ],
    components: ['Catalog / service list', 'Item detail', 'Cart or slot picker', 'Checkout (Stripe)', 'Order/booking confirmation', 'Receipt email'],
    designDefaults: { typography: 'product-forward, photo-friendly', spacing: 'card grid', motion: 'smooth add-to-cart feedback', tone: 'inviting, trustworthy, frictionless' },
    launchChecklist: ['Stripe live + test', 'Inventory or availability logic', 'Confirmation email', 'Mobile checkout', 'Tax/shipping or deposit rules', 'Refund/cancel path']
  },
  {
    id: 'mobile-app',
    category: 'mobile',
    name: 'Mobile App (iOS/Android)',
    summary: 'A cross-platform app via Expo: tabs, auth, core screens, push, store-ready.',
    stack: ['Expo / React Native', 'Expo Router', 'Supabase (auth + data)', 'EAS Build (App Store / Play)'],
    structure: [
      'app/ (expo-router: (auth)/, (tabs)/, screens)',
      'components/ (screen, list, card, button, sheet)',
      'lib/ (auth, api, storage, notifications)',
      'assets/ (icon, splash, images)',
      'app.json + eas.json (build config, bundle id)'
    ],
    components: ['Onboarding/auth', 'Tab navigation', 'List/feed screen', 'Detail screen', 'Profile/settings', 'Push notifications', 'Account deletion'],
    designDefaults: { typography: 'platform-native scale', spacing: 'thumb-reachable, safe areas', motion: 'native transitions', tone: 'focused, friendly, tactile' },
    launchChecklist: ['Runs on iOS + Android', 'App icon + splash', 'Bundle id set', 'Privacy + account deletion (Apple 5.1.1)', 'Native voice/permissions handled', 'EAS build passes']
  }
];

/** Keyword hints so ORB can infer the category from a plain-language brief. */
const CATEGORY_HINTS: Record<BuildCategory, RegExp> = {
  mobile: /\b(app|ios|android|mobile|expo|react native|play store|app store)\b/i,
  ecommerce: /\b(shop|store|sell|product|cart|checkout|booking|book|reserve|reservation|appointment|schedul)\b/i,
  webapp: /\b(dashboard|saas|login|sign[- ]?in|portal|admin|crm|web app|webapp|account|users|platform)\b/i,
  marketing: /\b(landing|marketing|website|home ?page|portfolio|brochure|business site|promo)\b/i
};

/** Infer the build category from the brief when not stated. Defaults to a marketing site. */
export function inferCategory(request: string): BuildCategory {
  // Order matters: most specific first so "booking app" reads as mobile, "online store" as ecommerce.
  for (const cat of ['mobile', 'ecommerce', 'webapp', 'marketing'] as BuildCategory[]) {
    if (CATEGORY_HINTS[cat].test(request)) return cat;
  }
  return 'marketing';
}

export function getBlueprint(category: BuildCategory): Blueprint {
  return BLUEPRINTS.find((b) => b.category === category) ?? BLUEPRINTS[0];
}
