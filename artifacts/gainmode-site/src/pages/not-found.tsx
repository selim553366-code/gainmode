import { Link } from 'wouter';
import { useI18n } from '@/lib/i18n';
import { LogoMark } from '@/components/site/brand';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center px-5 pt-24 text-center">
      <LogoMark size={96} animate />
      <h1 className="mt-8 font-display text-5xl font-extrabold uppercase tracking-[-0.03em]">404</h1>
      <p className="mt-3 text-white/60">{t.notFound.body}</p>
      <Link href="/" className="mt-8 rounded-full bg-royal-500 px-6 py-3 text-sm font-semibold">{t.notFound.back}</Link>
    </section>
  );
}
