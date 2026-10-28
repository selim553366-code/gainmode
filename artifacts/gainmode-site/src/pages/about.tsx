import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { LogoMark } from '@/components/site/brand';
import { Kicker, Reveal, SplitTitle } from '@/components/site/motion';
import { CtaBand } from '@/pages/home';

export default function AboutPage() {
  const { t } = useI18n();
  return (
    <>
      <section className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-32 md:px-8 md:pt-40 lg:grid-cols-[1.3fr_1fr]">
        <div className="min-w-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Kicker>{t.about.kicker}</Kicker></motion.div>
          <SplitTitle lines={[t.about.title]} className="mt-5 font-display text-[25px] min-[400px]:text-[30px] font-extrabold uppercase leading-[0.95] tracking-[-0.035em] sm:text-5xl md:text-7xl" />
          {t.about.body.map((paragraph, index) => <Reveal key={paragraph} delay={0.2 + index * 0.1}><p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">{paragraph}</p></Reveal>)}
        </div>
        <motion.div className="relative mx-auto w-full max-w-[380px]" animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
          <div className="aurora inset-[10%] bg-royal-500/40" />
          <LogoMark size={1000} animate className="relative h-auto w-full" />
        </motion.div>
      </section>
      <section className="mx-auto max-w-[1240px] px-5 pb-24 md:px-8">
        <Reveal><Kicker>{t.about.valuesTitle}</Kicker></Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {t.principles.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.08}>
              <div className="h-full rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-8">
                <span className="font-display text-5xl font-extrabold text-royal-500/60">0{index + 1}</span>
                <h3 className="mt-6 text-2xl font-semibold">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-white/60">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
