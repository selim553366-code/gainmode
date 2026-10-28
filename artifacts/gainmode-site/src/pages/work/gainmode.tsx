import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { AnimatePresence, motion, useInView, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { products } from '@/lib/products';
import { LogoMark } from '@/components/site/brand';
import { EASE, Reveal } from '@/components/site/motion';
import { Phone } from '@/components/site/phone';
import home from '@/assets/gainmode/home.webp';
import onboarding from '@/assets/gainmode/onboarding.webp';
import aiPlan from '@/assets/gainmode/ai-plan.webp';
import scan from '@/assets/gainmode/scan.webp';
import barcode from '@/assets/gainmode/barcode.webp';
import live from '@/assets/gainmode/live.webp';
import nutrition from '@/assets/gainmode/nutrition.webp';
import plan from '@/assets/gainmode/plan.webp';
import charts from '@/assets/gainmode/charts.webp';
import streak from '@/assets/gainmode/streak.webp';
import badges from '@/assets/gainmode/badges.webp';
import mascot from '@/assets/gainmode/mascot.webp';

const product = products.find((item) => item.slug === 'gainmode')!;
/** Screens for each feature in `gm.features`, main screen first. */
const featureScreens = [[onboarding, aiPlan], [scan, barcode], [live], [nutrition], [plan], [charts], [streak, badges]];
const gallery = [home, onboarding, aiPlan, nutrition, scan, barcode, plan, live, charts, streak, badges];

function StoreButton({ store }: { store: 'appStore' | 'playStore' }) {
  const { t } = useI18n();
  const url = product.links[store];
  const label = store === 'appStore' ? t.gm.appStore : t.gm.playStore;
  const icon = store === 'appStore'
    ? <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.9-4.2zM13.9 5.3c.7-.9 1.2-2 1-3.2-1 .1-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z" /></svg>
    : <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true"><path fill="#00D7FE" d="M3.6 2.3 13.3 12l-9.7 9.7c-.4-.2-.6-.7-.6-1.2V3.5c0-.5.2-1 .6-1.2z" /><path fill="#FFCE00" d="m16.6 15.3-3.3-3.3 3.3-3.3 3.8 2.2c1 .6 1 1.6 0 2.2z" /><path fill="#FF3A44" d="M16.6 15.3 13.3 12l-9.7 9.7c.4.2.9.2 1.4-.1z" /><path fill="#00F076" d="M16.6 8.7 5 2.4c-.5-.3-1-.3-1.4-.1l9.7 9.7z" /></svg>;
  const body = <>{icon}<span className="text-left leading-tight"><span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-white/60">{url ? (store === 'appStore' ? 'Download on the' : 'Get it on') : t.gm.storeSoon}</span><span className="block text-base font-semibold">{label}</span></span></>;
  return url
    ? <a href={url} target="_blank" rel="noreferrer" className="flex h-14 items-center gap-3 rounded-2xl border border-white/20 bg-black px-5 transition hover:border-white/50">{body}</a>
    : <span aria-disabled="true" className="flex h-14 cursor-default items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-white/70">{body}</span>;
}

/** Email signup that posts to the API's early list; shows a check once saved. */
function NotifyForm({ center = false }: { center?: boolean }) {
  const { t, lang } = useI18n();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || state === 'sending' || state === 'done') return;
    setState('sending');
    try {
      const response = await fetch('/api/early-list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), language: lang }) });
      setState(response.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };
  return (
    <form onSubmit={submit} className={`w-full max-w-md ${center ? 'mx-auto' : ''}`}>
      <p className="mb-3 text-sm font-semibold text-white/80">{t.gm.notifyTitle}</p>
      <AnimatePresence mode="wait">
        {state === 'done' ? (
          <motion.p key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 rounded-2xl bg-emerald-400/10 px-5 py-4 text-sm font-medium text-emerald-300"><Check size={18} />{t.gm.notifyDone}</motion.p>
        ) : (
          <motion.div key="form" exit={{ opacity: 0 }} className="flex gap-2 rounded-2xl border border-white/15 bg-white/[0.04] p-1.5 focus-within:border-royal-400">
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t.gm.notifyPlaceholder} aria-label={t.gm.notifyPlaceholder} className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/40" />
            <button type="submit" disabled={state === 'sending'} className="shrink-0 rounded-xl bg-royal-500 px-5 py-3 text-sm font-semibold transition hover:bg-royal-400 disabled:opacity-60">{t.gm.notifyButton}</button>
          </motion.div>
        )}
      </AnimatePresence>
      {state === 'error' ? <p className="mt-2 text-sm text-red-300">{t.gm.notifyError}</p> : null}
    </form>
  );
}

/** One feature's copy; reports when it is the one in the middle of the screen. */
function FeatureText({ index, onActive }: { index: number; onActive: (index: number) => void }) {
  const { t } = useI18n();
  const feature = t.gm.features[index];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-45% 0px -45% 0px' });
  useEffect(() => { if (inView) onActive(index); }, [inView, index, onActive]);
  return (
    <div ref={ref} className="flex min-h-[70vh] flex-col justify-center py-10 lg:min-h-[86vh]">
      <div className="mb-8 flex justify-center gap-4 lg:hidden">
        {featureScreens[index].map((src) => <Phone key={src} src={src} alt="" width={featureScreens[index].length > 1 ? 160 : 220} />)}
      </div>
      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-royal-500/15 px-3 py-1.5 text-xs font-semibold text-royal-200">
        <span className="font-bold text-white/50">{String(index + 1).padStart(2, '0')}</span>{feature.tag}
      </span>
      <h3 className="mt-5 text-3xl font-bold leading-[1.1] tracking-[-0.03em] md:text-5xl">{feature.title}</h3>
      <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/65">{feature.body}</p>
    </div>
  );
}

/** Features scroll past on the right while a sticky phone on the left swaps to each one's screens. */
function Features() {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const screens = featureScreens[active];
  return (
    <section id="features" className="relative mx-auto max-w-[1240px] px-5 md:px-8">
      <Reveal className="pt-24 text-center md:pt-32">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-royal-300">{t.gm.featuresKicker}</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] md:text-6xl">{t.gm.featuresTitle}</h2>
      </Reveal>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="sticky top-0 hidden h-[100dvh] items-center justify-center self-start lg:flex">
          <div className="aurora h-[420px] w-[420px] bg-royal-500/35" />
          <div className="relative h-[620px] w-[420px]">
            <AnimatePresence mode="popLayout">
              <motion.div key={screens[0]} className="absolute left-1/2 top-0 z-10 -translate-x-1/2" initial={{ opacity: 0, y: 40, rotate: -4 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, y: -30, rotate: 3 }} transition={{ duration: 0.6, ease: EASE }}>
                <Phone src={screens[0]} alt={t.gm.features[active].title} width={280} />
              </motion.div>
              {screens[1] ? (
                <motion.div key={screens[1]} className="absolute right-[-30px] top-[140px] z-20" initial={{ opacity: 0, x: 40, rotate: 10 }} animate={{ opacity: 1, x: 0, rotate: 6 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.6, delay: 0.1, ease: EASE }}>
                  <Phone src={screens[1]} alt="" width={190} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-2">
            {t.gm.features.map((feature, index) => <span key={feature.tag} className={`h-1.5 rounded-full transition-all duration-500 ${index === active ? 'w-8 bg-royal-400' : 'w-1.5 bg-white/20'}`} />)}
          </div>
        </div>
        <div>{t.gm.features.map((feature, index) => <FeatureText key={feature.tag} index={index} onActive={setActive} />)}</div>
      </div>
    </section>
  );
}

/** FitBud: the mascot next to a chat that types its answer when it scrolls into view. */
function Coach() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-30%' });
  const [answered, setAnswered] = useState(false);
  useEffect(() => {
    if (!inView) return undefined;
    const timer = setTimeout(() => setAnswered(true), 1600);
    return () => clearTimeout(timer);
  }, [inView]);
  return (
    <section ref={ref} className="relative mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-32">
      <div className="grain relative grid items-center gap-10 overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-[#12205C] via-[#0B143D] to-[#070B22] p-8 md:grid-cols-[0.9fr_1.1fr] md:p-14">
        <div className="aurora -left-16 bottom-0 h-80 w-80 bg-royal-500/40" />
        <motion.img src={mascot} alt="FitBud" className="relative mx-auto w-[260px] md:w-[360px]" animate={{ y: [0, -14, 0], rotate: [-2, 2, -2] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="relative">
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-royal-100">{t.gm.coachTag}</span>
          <h2 className="mt-5 text-3xl font-bold leading-[1.1] tracking-[-0.03em] md:text-5xl">{t.gm.coachTitle}</h2>
          <p className="mt-5 text-lg leading-relaxed text-white/65">{t.gm.coachBody}</p>
          <div className="mt-8 space-y-3">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5 }} className="ml-auto w-fit max-w-[85%] rounded-3xl rounded-br-md bg-royal-500 px-5 py-3.5 text-sm">{t.gm.coachQuestion}</motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.5 }} className="flex w-fit max-w-[90%] items-end gap-3">
              <img src={mascot} alt="" className="h-9 w-9 rounded-full bg-white/10 object-cover" />
              <div className="rounded-3xl rounded-bl-md bg-white/10 px-5 py-3.5 text-sm leading-relaxed">
                {answered ? <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{t.gm.coachAnswer}</motion.span> : (
                  <span className="flex gap-1 py-1">{[0, 1, 2].map((dot) => <motion.span key={dot} className="h-2 w-2 rounded-full bg-white/60" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.15 }} />)}</span>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  const { t } = useI18n();
  const row = [...gallery, ...gallery];
  return (
    <section className="overflow-hidden py-24 md:py-32">
      <Reveal className="mx-auto max-w-[1240px] px-5 text-center md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-royal-300">{t.gm.galleryKicker}</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] md:text-6xl">{t.gm.galleryTitle}</h2>
      </Reveal>
      <div className="group mt-16 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <div className="marquee flex w-max gap-6 [animation-duration:70s] group-hover:[animation-play-state:paused]">
          {row.map((src, index) => <Phone key={`${src}-${index}`} src={src} alt="" width={220} eager className={index % 2 ? 'mt-10' : ''} />)}
        </div>
      </div>
    </section>
  );
}

export default function GainmodePage() {
  const { t } = useI18n();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const sideY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  return (
    <div className="font-body">
      <section ref={heroRef} className="grain relative overflow-hidden pt-28 md:pt-32">
        <div className="grid-fade absolute inset-0" />
        <div className="aurora right-[-10%] top-0 h-[520px] w-[520px] bg-royal-500/35" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-16 md:px-8 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Link href="/work" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"><ArrowLeft size={16} />{t.gm.back}</Link>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="mt-10 flex items-center gap-4">
              <img src={product.icon} alt="" className="h-16 w-16 rounded-[18px] shadow-[0_16px_40px_-10px_rgba(47,91,255,.7)]" />
              <img src={product.wordmark} alt="GainMode" className="h-6 w-auto max-w-full brightness-0 invert sm:h-8 md:h-10" />
            </motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-royal-200">{t.gm.kicker}</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: EASE }} className="mt-4 text-5xl font-bold leading-[1.02] tracking-[-0.045em] md:text-7xl">{t.gm.title}</motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: EASE }} className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">{t.gm.body}</motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45, ease: EASE }} className="mt-8 flex flex-wrap gap-3">
              <StoreButton store="appStore" />
              <StoreButton store="playStore" />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8"><NotifyForm /></motion.div>
          </div>
          <div className="relative flex h-[560px] items-center justify-center md:h-[680px]">
            <motion.div style={{ y: sideY }} className="absolute left-0 top-24 hidden -rotate-[9deg] sm:block" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.4, ease: EASE }}><Phone src={nutrition} alt="" width={210} className="opacity-75" /></motion.div>
            <motion.div style={{ y: sideY }} className="absolute right-0 top-24 hidden rotate-[9deg] sm:block" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.5, ease: EASE }}><Phone src={live} alt="" width={210} className="opacity-75" /></motion.div>
            <motion.div style={{ y: phoneY }} className="relative z-10" initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.2, ease: EASE }}><Phone src={home} alt="GainMode" width={270} eager /></motion.div>
            <motion.img src={mascot} alt="" className="absolute -bottom-2 right-[8%] z-20 w-36 md:w-44" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }} transition={{ opacity: { delay: 1 }, scale: { delay: 1, type: 'spring' }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }} />
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.07]">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-px px-5 md:grid-cols-4 md:px-8">
          {t.gm.facts.map((fact, index) => (
            <Reveal key={fact.label} delay={index * 0.08} className="py-10 text-center">
              <p className="text-3xl font-bold tracking-[-0.04em] md:text-5xl">{fact.value}</p>
              <p className="mt-2 text-sm text-white/55">{fact.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <Features />
      <Coach />
      <Gallery />

      <section className="mx-auto max-w-[1240px] px-5 pb-24 md:px-8">
        <Reveal>
          <div className="grain relative overflow-hidden rounded-[40px] bg-gradient-to-br from-royal-500 to-royal-700 px-7 py-16 text-center md:py-24">
            <div className="aurora -left-24 -top-24 h-96 w-96 bg-white/25" />
            <img src={product.icon} alt="" className="relative mx-auto h-20 w-20 rounded-[22px] shadow-2xl" />
            <h2 className="relative mx-auto mt-8 max-w-2xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] md:text-6xl">{t.gm.ctaTitle}</h2>
            <p className="relative mx-auto mt-5 max-w-lg text-white/80">{t.gm.ctaBody}</p>
            <div className="relative mt-9 flex justify-center"><NotifyForm center /></div>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3"><StoreButton store="appStore" /><StoreButton store="playStore" /></div>
          </div>
        </Reveal>
        <Reveal className="mt-10 flex flex-wrap items-center justify-between gap-4 text-sm text-white/50">
          <span className="flex items-center gap-2"><LogoMark size={22} />{t.gm.madeBy}</span>
          <Link href="/work" className="inline-flex items-center gap-2 font-semibold text-royal-200 hover:text-white">{t.gm.back}<ArrowRight size={16} /></Link>
        </Reveal>
      </section>
    </div>
  );
}
