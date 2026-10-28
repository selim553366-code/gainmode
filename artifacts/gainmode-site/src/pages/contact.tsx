import { motion } from 'framer-motion';
import { ArrowUpRight, LifeBuoy, Mail } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { CONTACT_EMAIL } from '@/lib/products';
import { Kicker, Reveal, SplitTitle } from '@/components/site/motion';

export default function ContactPage() {
  const { t } = useI18n();
  return (
    <section className="relative mx-auto max-w-[1240px] px-5 pb-24 pt-32 md:px-8 md:pt-40">
      <div className="aurora -left-24 top-16 h-[420px] w-[420px] bg-royal-600/25" />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Kicker>{t.contact.kicker}</Kicker></motion.div>
      <SplitTitle lines={[t.contact.title]} className="relative mt-5 max-w-4xl font-display text-[25px] min-[400px]:text-[30px] font-extrabold uppercase leading-[0.95] tracking-[-0.035em] sm:text-5xl md:text-7xl" />
      <Reveal delay={0.2}><p className="mt-6 max-w-xl text-lg text-white/60">{t.contact.body}</p></Reveal>
      <div className="mt-14 grid gap-4 md:grid-cols-2">
        <Reveal delay={0.25}>
          <a href={`mailto:${CONTACT_EMAIL}`} className="group relative flex h-full flex-col overflow-hidden rounded-[32px] bg-royal-500 p-8 md:p-10">
            <div className="aurora -right-16 -top-16 h-64 w-64 bg-white/30" />
            <Mail size={28} className="relative" />
            <p className="relative mt-12 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">{t.contact.emailLabel}</p>
            <p className="relative mt-3 break-all text-2xl font-semibold md:text-3xl">{CONTACT_EMAIL}</p>
            <ArrowUpRight size={28} className="absolute right-8 top-8 transition duration-500 group-hover:rotate-45" />
          </a>
        </Reveal>
        <Reveal delay={0.35}>
          <a href={`mailto:${CONTACT_EMAIL}?subject=Support`} className="group relative flex h-full flex-col rounded-[32px] border border-white/10 bg-white/[0.03] p-8 md:p-10">
            <LifeBuoy size={28} className="text-royal-300" />
            <p className="mt-12 text-sm font-semibold uppercase tracking-[0.2em] text-white/50">{t.contact.supportLabel}</p>
            <p className="mt-3 text-lg leading-relaxed text-white/70">{t.contact.supportBody}</p>
            <ArrowUpRight size={28} className="absolute right-8 top-8 text-white/60 transition duration-500 group-hover:rotate-45" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
