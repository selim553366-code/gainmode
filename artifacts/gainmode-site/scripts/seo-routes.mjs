/** Search-engine copy for every public page. Used to write a static HTML file per route at build time. */
export const SITE_URL = 'https://globe-studios.com';
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.forgefit2.app';

const org = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Globe Studios',
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/apple-touch-icon.png`,
  email: 'globestudiosdev@gmail.com',
  description: 'Globe Studios is an app and web development studio and the maker of GainMode, the AI fitness coach app.',
};

const app = {
  '@type': 'MobileApplication',
  '@id': `${SITE_URL}/work/gainmode#app`,
  name: 'GainMode',
  alternateName: ['GainMode AI Fitness Coach', 'GainMode app'],
  url: `${SITE_URL}/work/gainmode`,
  operatingSystem: 'ANDROID',
  applicationCategory: 'HealthApplication',
  description: 'GainMode is an AI fitness coach app: personal workout and nutrition plans, rep counting and form check with the camera, calories from a meal photo, streaks and badges.',
  downloadUrl: PLAY_URL,
  installUrl: PLAY_URL,
  image: `${SITE_URL}/og-gainmode.png`,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free to download, GainMode Access subscription with a 3-day free trial.' },
  author: { '@id': `${SITE_URL}/#organization` },
  publisher: { '@id': `${SITE_URL}/#organization` },
};

export const ROUTES = [
  {
    path: '/',
    title: 'Globe Studios — App & Web Development Studio, Makers of GainMode',
    description: 'Globe Studios designs and develops mobile apps and websites, from the first idea to the store listing. Makers of GainMode, the AI fitness coach app.',
    image: 'og-globe.png',
    priority: '1.0',
    h1: 'Globe Studios — app & web development studio',
    body: ['We build apps and websites people love to use. Mobile apps, websites, product design and AI features.', 'Our product: GainMode, the AI fitness coach in your pocket.'],
    links: [['/work/gainmode', 'GainMode — AI fitness coach app'], ['/work', 'Our work'], ['/services', 'Services'], ['/about', 'About Globe Studios'], ['/contact', 'Contact']],
    schema: [org, { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: 'Globe Studios', url: `${SITE_URL}/`, publisher: { '@id': `${SITE_URL}/#organization` } }],
  },
  {
    path: '/work/gainmode',
    title: 'GainMode — AI Fitness Coach App | Workouts, Calorie Tracker & Form Check',
    description: 'GainMode is the AI fitness coach in your pocket: personal workout and nutrition plans, rep counting with the camera, calories from a meal photo, streaks and badges. Try it free for 3 days on Google Play.',
    image: 'og-gainmode.png',
    priority: '0.9',
    h1: 'GainMode — your AI fitness coach, in your pocket',
    body: ['GainMode builds your training and nutrition plan with AI, counts your reps with the camera, reads your meals from a photo and keeps you going with streaks and badges.', 'Download GainMode on Google Play and try every feature free for 3 days. Coming soon to the App Store.', 'GainMode is made by Globe Studios.'],
    links: [[PLAY_URL, 'Download GainMode on Google Play'], ['/', 'Globe Studios'], ['/privacy', 'GainMode privacy policy'], ['/support', 'GainMode support']],
    schema: [org, app, { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Globe Studios', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Work', item: `${SITE_URL}/work` },
      { '@type': 'ListItem', position: 3, name: 'GainMode', item: `${SITE_URL}/work/gainmode` },
    ] }],
  },
  {
    path: '/work', title: 'Our Work — Apps by Globe Studios | GainMode', priority: '0.8', image: 'og-globe.png',
    description: 'Products by Globe Studios, including GainMode, the AI fitness coach app for workouts, nutrition and form check.',
    h1: 'Products by Globe Studios', body: ['GainMode — the AI fitness coach app for workouts, nutrition and form check.'],
    links: [['/work/gainmode', 'GainMode — AI fitness coach app'], ['/', 'Globe Studios']], schema: [org],
  },
  {
    path: '/services', title: 'Services — Mobile Apps, Websites, Product Design & AI | Globe Studios', priority: '0.7', image: 'og-globe.png',
    description: 'Globe Studios builds native-feeling iOS and Android apps, fast websites, product design and practical AI features.',
    h1: 'Services by Globe Studios', body: ['Mobile apps, websites, product design and AI features — from the first idea to launch and growth.'],
    links: [['/contact', 'Start a project'], ['/work/gainmode', 'See GainMode']], schema: [org],
  },
  {
    path: '/about', title: 'About Globe Studios — A Product Studio for Apps and the Web', priority: '0.6', image: 'og-globe.png',
    description: 'Globe Studios is a product studio for apps and the web: craft over noise, built to last, made for many languages from day one.',
    h1: 'About Globe Studios', body: ['A product studio for apps and the web, and the maker of GainMode.'],
    links: [['/work/gainmode', 'GainMode'], ['/contact', 'Contact']], schema: [org],
  },
  {
    path: '/contact', title: 'Contact Globe Studios — Let’s Talk About Your Project', priority: '0.6', image: 'og-globe.png',
    description: 'Tell Globe Studios about your app or website idea. Write to globestudiosdev@gmail.com.',
    h1: 'Contact Globe Studios', body: ['Let’s talk about your project: globestudiosdev@gmail.com'],
    links: [['/', 'Globe Studios']], schema: [org],
  },
  { path: '/privacy', title: 'Privacy Policy — GainMode & Globe Studios', priority: '0.3', image: 'og-globe.png', description: 'How GainMode and Globe Studios handle your data.', h1: 'Privacy Policy', body: [], links: [['/', 'Globe Studios']], schema: [org] },
  { path: '/terms', title: 'Terms of Service — GainMode & Globe Studios', priority: '0.3', image: 'og-globe.png', description: 'Terms of service for GainMode and the Globe Studios website.', h1: 'Terms of Service', body: [], links: [['/', 'Globe Studios']], schema: [org] },
  { path: '/support', title: 'GainMode Support — Globe Studios', priority: '0.4', image: 'og-gainmode.png', description: 'Help with GainMode: subscriptions, restoring purchases, data and contact.', h1: 'GainMode Support', body: [], links: [['/work/gainmode', 'GainMode']], schema: [org] },
  { path: '/delete-account', title: 'Account and Data Deletion — GainMode', priority: '0.3', image: 'og-gainmode.png', description: 'Learn how to delete GainMode data stored on your device and manage your subscription.', h1: 'Account and data deletion — GainMode', body: [], links: [['/support', 'GainMode support']], schema: [org] },
];
