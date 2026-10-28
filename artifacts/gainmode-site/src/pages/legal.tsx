import { Link } from 'wouter';
import { useI18n } from '@/lib/i18n';
import { CONTACT_EMAIL } from '@/lib/products';
import { Kicker, Reveal } from '@/components/site/motion';

/** Short studio-level legal and support pages; each app also carries its own policy. */
export default function LegalPage({ kind }: { kind: 'privacy' | 'terms' | 'support' }) {
  const { t } = useI18n();
  const title = kind === 'privacy' ? t.legal.privacyTitle : kind === 'terms' ? t.legal.termsTitle : t.legal.supportTitle;
  const body = kind === 'privacy' ? t.legal.privacyBody : kind === 'terms' ? t.legal.termsBody : t.legal.supportBody;
  return (
    <section className="mx-auto max-w-3xl px-5 pb-24 pt-32 md:pt-40">
      <Kicker>Globe Studios</Kicker>
      <h1 className="mt-5 font-display text-[30px] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] md:text-6xl">{title}</h1>
      <Reveal><p className="mt-8 text-lg leading-relaxed text-white/70">{body}</p></Reveal>
      <Reveal delay={0.1}><a href={`mailto:${CONTACT_EMAIL}`} className="mt-8 inline-block font-semibold text-royal-200 hover:text-white">{CONTACT_EMAIL}</a></Reveal>
      <div className="mt-14 flex gap-5 text-sm text-white/50">
        {kind !== 'privacy' ? <Link href="/privacy" className="hover:text-white">{t.footer.privacy}</Link> : null}
        {kind !== 'terms' ? <Link href="/terms" className="hover:text-white">{t.footer.terms}</Link> : null}
        {kind !== 'support' ? <Link href="/support" className="hover:text-white">{t.footer.support}</Link> : null}
      </div>
    </section>
  );
}
