import { useRef } from 'react';
import { Link } from 'wouter';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Code2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { CONTACT_EMAIL, products } from '@/lib/products';
import { LogoMark } from '@/components/site/brand';
import { EASE, Kicker, Reveal, SplitTitle } from '@/components/site/motion';
import { Phone } from '@/components/site/phone';

/** The hero mark: the logo with two orbits and moons turning around it. */
function HeroGlobe() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      <div className="aurora left-[12%] top-[12%] h-[76%] w-[76%] bg-royal-500/40" />
      {[0, 1].map((ring) => (
        <motion.div
          key={ring}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, rotate: ring ? -360 : 360 }}
          transition={{ opacity: { duration: 1, delay: 0.6 + ring * 0.2 }, scale: { duration: 1.2, delay: 0.6, ease: EASE }, rotate: { duration: ring ? 46 : 32, repeat: Infinity, ease: 'linear' } }}
        >
          <svg viewBox="0 0 400 400" className="h-full w-full overflow-visible">
            <ellipse cx="200" cy="200" rx={ring ? 196 : 176} ry={ring ? 74 : 196} transform={`rotate(${ring ? -18 : 24} 200 200)`} fill="none" stroke="rgba(183,200,255,.22)" strokeWidth="1" strokeDasharray={ring ? '2 7' : undefined} />
            <circle cx={ring ? 380 : 200} cy={ring ? 160 : 6} r={ring ? 5 : 7} fill={ring ? '#FFFFFF' : '#5B83FF'} />
          </svg>
        </motion.div>
      ))}
      <motion.div className="absolute inset-[17%]" animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
        <LogoMark size={1000} animate className="h-full w-full drop-shadow-[0_30px_80px_rgba(47,91,255,.55)]" />
      </motion.div>
    </div>
  );
}

function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-white/[0.07] py-6 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <div className="marquee flex w-max items-center gap-10">
        {row.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-10 font-display text-3xl font-extrabold uppercase tracking-[-0.02em] text-white/80 md:text-5xl">
            {item}<LogoMark size={28} />
          </span>
        ))}
      </div>
    </div>
  );
}

/** The featured product, with its screens fanned out and drifting at different speeds on scroll. */
function FeaturedWork() {
  const { t, lang } = useI18n();
  const product = products[0];
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const back = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const front = useTransform(scrollYProgress, [0, 1], [120, -120]);
  return (
    <div ref={ref}><Link href={`/work/${product.slug}`} className="group relative block overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#0E1A4D] via-[#0A1238] to-[#060A22] p-7 md:p-12">
      <div className="aurora -right-20 -top-20 h-[420px] w-[420px] bg-royal-500/40" />
      <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="flex items-center gap-3">
            <img src={product.icon} alt="" className="h-12 w-12 rounded-[14px] shadow-lg" />
            <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-royal-100">{product.status === 'live' ? t.work.live : t.work.soon}</span>
          </div>
          {product.wordmark ? <img src={product.wordmark} alt={product.name} className="mt-8 h-7 w-auto brightness-0 invert md:h-9" /> : <h3 className="mt-8 text-4xl font-bold">{product.name}</h3>}
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-royal-200">{product.category[lang]}</p>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-white/70">{product.summary[lang]}</p>
          <span className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-ink transition group-hover:gap-3">{t.work.view}<ArrowRight size={16} /></span>
        </div>
        <div className="relative flex h-[420px] items-center justify-center md:h-[520px]">
          <motion.div style={{ y: back }} className="absolute left-[4%] top-[12%] hidden -rotate-[8deg] sm:block"><Phone src={product.screens[1]} alt="" width={200} className="opacity-80" /></motion.div>
          <motion.div style={{ y: back }} className="absolute right-[4%] top-[12%] hidden rotate-[8deg] sm:block"><Phone src={product.screens[2]} alt="" width={200} className="opacity-80" /></motion.div>
          <motion.div style={{ y: front }} className="relative z-10 transition-transform duration-700 group-hover:-translate-y-2"><Phone src={product.screens[0]} alt={product.name} width={230} /></motion.div>
        </div>
      </div>
    </Link></div>
  );
}

export default function Home() {
  const { t } = useI18n();
  return (
    <>
      <section className="grain relative overflow-hidden pt-28 md:pt-32">
        <div className="grid-fade absolute inset-0" />
        <div className="aurora -left-40 top-20 h-[460px] w-[460px] bg-royal-600/30" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 px-5 pb-20 md:px-8 lg:grid-cols-[1.4fr_1fr] lg:pb-28">
          <div className="min-w-0">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}><Kicker>{t.home.eyebrow}</Kicker></motion.div>
            <SplitTitle lines={t.home.title} delay={0.1} className="mt-6 font-display text-[24px] min-[400px]:text-[28px] font-extrabold uppercase leading-[0.98] tracking-[-0.035em] sm:text-5xl lg:text-[44px] xl:text-[50px]" />
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5, ease: EASE }} className="mt-7 max-w-xl text-lg leading-relaxed text-white/65">{t.home.body}</motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.65, ease: EASE }} className="mt-9 flex flex-wrap gap-3">
              <Link href="/work" className="inline-flex h-13 items-center gap-2 rounded-lg bg-royal-500 px-7 py-4 text-sm font-semibold transition-colors hover:bg-royal-400">{t.home.primary}<ArrowRight size={16} /></Link>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-7 py-4 text-sm font-semibold text-white/90 transition-colors hover:border-white/40">{t.home.secondary}</Link>
            </motion.div>
          </div>
          <HeroGlobe />
        </div>
      </section>

      <Marquee items={t.home.marquee} />

      <section className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-32">
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker>{t.home.workKicker}</Kicker>
            <h2 className="mt-4 max-w-2xl font-display text-[24px] font-extrabold uppercase leading-[0.98] tracking-[-0.03em] sm:text-4xl md:text-5xl">{t.home.workTitle}</h2>
          </div>
          <Link href="/work" className="inline-flex items-center gap-2 text-sm font-semibold text-royal-200 hover:text-white">{t.home.workAll}<ArrowUpRight size={16} /></Link>
        </Reveal>
        <Reveal className="min-w-0"><FeaturedWork /></Reveal>
        <Reveal delay={0.1} className="mt-5">
          <div className="flex flex-col items-start justify-between gap-4 rounded-[28px] border border-dashed border-white/15 p-7 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05]"><Code2 size={20} className="text-royal-300" /><span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-royal-400" /></span>
              <div><p className="font-semibold">{t.home.nextTitle}</p><p className="mt-1 text-sm text-white/55">{t.home.nextBody}</p></div>
            </div>
          </div>
        </Reveal>
      </section>

      <CtaBand fullBleed />

      <section className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-32">
        <Reveal><Kicker>{t.home.processKicker}</Kicker><h2 className="mt-4 font-display text-[24px] font-extrabold uppercase leading-[0.98] tracking-[-0.03em] sm:text-4xl md:text-5xl">{t.home.processTitle}</h2></Reveal>
        <div className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
          <motion.div className="absolute left-0 right-0 top-[22px] hidden h-px origin-left bg-gradient-to-r from-royal-500 via-royal-300 to-transparent md:block" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: '-120px' }} transition={{ duration: 1.6, ease: EASE }} />
          {t.process.map((step, index) => (
            <Reveal key={step.title} delay={0.15 + index * 0.15}>
              <span className="relative grid h-11 w-11 place-items-center rounded-full border border-royal-400/60 bg-ink font-display text-sm font-extrabold text-royal-200">0{index + 1}</span>
              <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pb-24 md:px-8">
        <Reveal><Kicker>{t.home.principlesKicker}</Kicker></Reveal>
        <div className="mt-8 divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {t.principles.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.08}>
              <div className="group grid items-baseline gap-3 py-8 md:grid-cols-[1fr_1fr]">
                <h3 className="font-display text-3xl font-extrabold uppercase tracking-[-0.02em] transition group-hover:translate-x-2 group-hover:text-royal-300 md:text-4xl">{item.title}</h3>
                <p className="text-white/60 md:text-lg">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

/** Closing call to action shared by the home, services and about pages. */
export function CtaBand({ fullBleed = false }: { fullBleed?: boolean }) {
  const { t } = useI18n();
  return (
    <section id={fullBleed ? 'home-contact-cta' : undefined} className={fullBleed
      ? 'relative overflow-hidden bg-[linear-gradient(115deg,#668cff_0%,#315bff_55%,#4269ff_100%)]'
      : 'mx-auto max-w-[1240px] px-5 pb-24 md:px-8'}>
      <Reveal>
        <div className={fullBleed
          ? 'grain relative overflow-hidden px-5 py-20 text-center md:py-24'
          : 'grain relative overflow-hidden rounded-[40px] bg-royal-500 px-7 py-16 text-center md:px-16 md:py-24'}>
          <div className="aurora -left-20 -top-24 h-[360px] w-[360px] bg-white/30" />
          <div className="aurora -bottom-32 -right-10 h-[360px] w-[360px] bg-royal-700" />
          <LogoMark size={64} light className="relative mx-auto" />
          <h2 className="relative mx-auto mt-8 max-w-3xl font-display text-[24px] font-extrabold uppercase leading-[0.98] tracking-[-0.03em] sm:text-4xl md:text-5xl">{t.home.ctaTitle}</h2>
          <p className="relative mx-auto mt-5 max-w-lg text-white/80">{t.home.ctaBody}</p>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-4 text-sm font-semibold text-royal-700 transition-colors hover:bg-white/90">{t.home.ctaButton}<ArrowRight size={16} /></Link>
            <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-7 py-4 text-sm font-semibold transition-colors hover:bg-white/10">{CONTACT_EMAIL}</a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

