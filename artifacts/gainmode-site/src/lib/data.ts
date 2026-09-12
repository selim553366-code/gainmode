import gainmodeLogo from '@/assets/forge-fit/gainmode-wordmark.png';

export type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  href: string;
  logo: string;
  status: 'live' | 'coming-soon';
};

export const products: Product[] = [
  {
    id: 'gainmode',
    name: 'GainMode',
    tagline: 'Your training, with a smarter rhythm.',
    description: 'GainMode turns scattered effort into a clear practice with adaptive workouts, honest nutrition, and an AI coach that learns how you move.',
    href: '/apps/gainmode',
    logo: gainmodeLogo,
    status: 'live',
  }
];
