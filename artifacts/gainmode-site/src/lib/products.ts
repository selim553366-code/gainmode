import type { Lang } from '@/lib/i18n';
import gainmodeIcon from '@/assets/gainmode/app-icon.webp';
import gainmodeWordmark from '@/assets/gainmode/wordmark.png';
import gainmodeHome from '@/assets/gainmode/home.webp';
import gainmodeNutrition from '@/assets/gainmode/nutrition.webp';
import gainmodeLive from '@/assets/gainmode/live.webp';

/**
 * Every product the studio shows. Add a new entry here (and a page under /work if it has one)
 * to list another app; store links stay null until the product launches, and the site then
 * shows "Coming soon" instead of the store buttons.
 */
export type Product = {
  slug: string;
  name: string;
  icon: string;
  wordmark?: string;
  /** Screens shown on the work cards, front first. */
  screens: string[];
  accent: string;
  status: 'soon' | 'live';
  year: number;
  category: Record<Lang, string>;
  summary: Record<Lang, string>;
  links: { appStore: string | null; playStore: string | null; web: string | null };
};

export const products: Product[] = [
  {
    slug: 'gainmode',
    name: 'GainMode',
    icon: gainmodeIcon,
    wordmark: gainmodeWordmark,
    screens: [gainmodeHome, gainmodeNutrition, gainmodeLive],
    accent: '#2F5BFF',
    status: 'soon',
    year: 2026,
    category: { en: 'Fitness · AI · iOS & Android', tr: 'Fitness · Yapay zekâ · iOS ve Android' },
    summary: {
      en: 'An AI fitness coach that writes your plan, counts your reps with the camera and reads your meals from a photo.',
      tr: 'Planını yazan, tekrarlarını kamerayla sayan ve öğününü fotoğraftan okuyan bir yapay zekâ fitness koçu.',
    },
    links: { appStore: null, playStore: null, web: null },
  },
];

export const CONTACT_EMAIL = 'globestudiosdev@gmail.com';
