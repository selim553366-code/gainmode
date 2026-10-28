import { Code2, Globe2, PenTool, Smartphone, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Kicker, Reveal, SplitTitle } from '@/components/site/motion';
import { CtaBand } from '@/pages/home';

const icons = [Smartphone, Globe2, PenTool, Sparkles];

export default function ServicesPage() {
  const { t } = useI18n();
  return (
    <>
      <section className="relative mx-auto max-w-[1240px] px-5 pb-20 pt-32 md:px-8 md:pt-40">
        <div className="aurora -right-32 top-10 h-[380px] w-[380px] bg-royal-600/25" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Kicker>{t.home.servicesKicker}</Kicker></motion.div>
        <SplitTitle lines={[t.home.servicesTitle]} className="relative mt-5 max-w-4xl font-display text-[25px] min-[400px]:text-[30px] font-extrabold uppercase leading-[0.95] tracking-[-0.035em] sm:text-5xl md:text-7xl" />
        <div className="mt-16 divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {t.services.map((service, index) => {
            const Icon = icons[index];
            return (
              <Reveal key={service.title} delay={index * 0.06}>
                <div className="group grid items-center gap-6 py-10 md:grid-cols-[80px_1fr_1.2fr]">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-royal-500/15 text-royal-200 transition duration-500 group-hover:rotate-[-8deg] group-hover:bg-royal-500 group-hover:text-white"><Icon size={24} /></span>
                  <h2 className="font-display text-2xl font-extrabold uppercase tracking-[-0.02em] md:text-4xl">{service.title}</h2>
                  <p className="text-lg leading-relaxed text-white/60">{service.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
      <section className="mx-auto max-w-[1240px] px-5 pb-24 md:px-8">
        <Reveal><Kicker>{t.home.processKicker}</Kicker><h2 className="mt-4 font-display text-[24px] font-extrabold uppercase leading-[0.98] tracking-[-0.03em] sm:text-4xl md:text-5xl">{t.home.processTitle}</h2></Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {t.process.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.08}>
              <div className="h-full rounded-[28px] border border-white/10 bg-white/[0.03] p-7">
                <span className="flex items-center gap-2 font-display text-sm font-extrabold text-royal-300"><Code2 size={16} />0{index + 1}</span>
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
