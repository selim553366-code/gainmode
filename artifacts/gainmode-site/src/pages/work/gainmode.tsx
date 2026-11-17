import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { AnimatePresence, motion, useInView, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Gift, Mail, Smartphone } from 'lucide-react';
import { countries, flag, guessCountry, toE164 } from '@/lib/countries';
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

const APPLE_PATH = 'M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.9-4.2zM13.9 5.3c.7-.9 1.2-2 1-3.2-1 .1-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z';

function StoreButton({ store, size = 'md', wide = false }: { store: 'appStore' | 'playStore'; size?: 'md' | 'lg'; wide?: boolean }) {
  const { t } = useI18n();
  const url = product.links[store];
  const label = store === 'appStore' ? t.gm.appStore : t.gm.playStore;
  const icon = store === 'appStore'
    ? <svg viewBox="0 0 24 24" className={size === 'lg' ? 'h-9 w-9 shrink-0' : 'h-6 w-6'} fill="currentColor" aria-hidden="true"><path d={APPLE_PATH} /></svg>
    : <svg viewBox="0 0 24 24" className={size === 'lg' ? 'h-9 w-9 shrink-0' : 'h-6 w-6'} aria-hidden="true"><path fill="#00D7FE" d="M3.6 2.3 13.3 12l-9.7 9.7c-.4-.2-.6-.7-.6-1.2V3.5c0-.5.2-1 .6-1.2z" /><path fill="#FFCE00" d="m16.6 15.3-3.3-3.3 3.3-3.3 3.8 2.2c1 .6 1 1.6 0 2.2z" /><path fill="#FF3A44" d="M16.6 15.3 13.3 12l-9.7 9.7c.4.2.9.2 1.4-.1z" /><path fill="#00F076" d="M16.6 8.7 5 2.4c-.5-.3-1-.3-1.4-.1l9.7 9.7z" /></svg>;
  const lg = size === 'lg';
  const kicker = url ? (store === 'appStore' ? 'Download on the' : t.gm.getOn) : t.gm.storeSoon;
  const body = <>{icon}<span className="text-left leading-tight"><span className={`block font-medium uppercase text-white/60 ${lg ? 'text-xs tracking-[0.16em]' : 'text-[10px] tracking-[0.14em]'}`}>{kicker}</span><span className={`block font-semibold ${lg ? 'text-2xl tracking-[-0.02em] sm:text-[28px]' : 'text-base'}`}>{label}</span></span></>;
  const shape = lg ? `h-20 w-full justify-center gap-4 rounded-2xl px-7 sm:h-[88px] ${wide ? '' : 'sm:w-[320px]'}` : 'h-14 gap-3 rounded-lg px-5';
  return url
    ? <a href={url} target="_blank" rel="noreferrer" className={`group relative flex items-center border border-white/25 bg-black transition-all hover:border-white/60 ${lg ? 'shadow-[0_18px_50px_-12px_rgba(47,91,255,.75)] hover:-translate-y-0.5' : ''} ${shape}`}>{body}</a>
    : <span aria-disabled="true" className={`relative flex cursor-default items-center border border-white/10 bg-white/[0.04] text-white/70 ${shape}`}>{body}</span>;
}

/** A ticket outline whose left edge is torn into teeth, like the receipt in the app. */
function ticketPath(w: number, h: number, teeth = 6) {
  const tooth = h / teeth;
  let d = `M ${w - 10} 0 Q ${w} 0 ${w} 10 V ${h - 10} Q ${w} ${h} ${w - 10} ${h} H 7`;
  for (let i = teeth; i > 0; i--) d += ` L 0 ${(i - 0.5) * tooth} L 7 ${(i - 1) * tooth}`;
  return `${d} Z`;
}

/**
 * The free trial as a green paper ticket pinned to the Google Play button, the same ticket the
 * app's paywall shows. It drops in and settles, then gives a small swing every few seconds.
 */
function TrialTicket() {
  const { t } = useI18n();
  const W = 132;
  const H = 66;
  return (
    <motion.div
      aria-label={`${t.gm.trialTop} ${t.gm.trialBottom}`}
      // Pinned across the seam between the Google Play button and the App Store card, so the trial reads as covering both.
      className="pointer-events-none absolute right-[-8px] top-[57px] z-20 origin-right scale-[0.82] sm:right-[-30px] sm:top-[65px] sm:scale-100"
      style={{ width: W, height: H }}
      initial={{ opacity: 0, y: -40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1.1, delay: 0.4, ease: 'easeOut' }}
    >
      <motion.div className="relative h-full w-full drop-shadow-[0_14px_22px_rgba(6,95,70,.55)]" style={{ transformOrigin: '20% 50%' }} initial={{ rotate: -26 }} whileInView={{ rotate: [-26, 4, -12, -4, -7] }} viewport={{ once: true }} transition={{ duration: 1.1, delay: 0.4, ease: 'easeOut' }}>
        <motion.div className="relative h-full w-full" animate={{ rotate: [0, 6, -4, 2, 0] }} transition={{ duration: 0.9, delay: 3, repeat: Infinity, repeatDelay: 3.2 }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0" aria-hidden="true">
          <defs>
            <linearGradient id="trialTicket" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#34D399" /><stop offset="1" stopColor="#059669" /></linearGradient>
          </defs>
          <path d={ticketPath(W, H)} fill="url(#trialTicket)" />
          <path d={`M 30 9 V ${H - 9}`} stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeDasharray="4 4" />
        </svg>
        <Gift size={17} className="absolute left-[8px] top-1/2 -translate-y-1/2 text-white" aria-hidden="true" />
        <span className="absolute inset-y-0 left-[34px] right-2 flex flex-col items-center justify-center leading-none text-white">
          <span className="text-[22px] font-extrabold tracking-[-0.02em]">{t.gm.trialTop}</span>
          <span className="mt-1 text-[10px] font-extrabold tracking-[0.18em] text-white/90">{t.gm.trialBottom}</span>
        </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/**
 * The App Store button and the countdown list as one card: the top reads like the store button,
 * with a live "coming soon" badge, and a torn ticket line leads into the signup form below.
 */
function AppStoreCountdownCard() {
  const { t } = useI18n();
  return (
    <div className="relative w-full overflow-hidden rounded-[28px] border border-white/15 bg-black/45 text-left shadow-[0_24px_60px_-24px_rgba(47,91,255,.55)] backdrop-blur">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-royal-300/80 to-transparent" />
      <motion.div aria-hidden="true" className="absolute -top-px h-px w-1/3 bg-gradient-to-r from-transparent via-white to-transparent" animate={{ left: ['-35%', '105%'] }} transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 pt-6 sm:px-7">
        <svg viewBox="0 0 24 24" className="h-10 w-10 shrink-0 text-white" fill="currentColor" aria-hidden="true"><path d={APPLE_PATH} /></svg>
        <span className="leading-tight">
          <span className="block text-xs font-medium uppercase tracking-[0.16em] text-white/60">{t.gm.storeSoon}</span>
          <span className="block text-2xl font-semibold tracking-[-0.02em] sm:text-[28px]">{t.gm.appStore}</span>
        </span>
        <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-royal-300/30 bg-royal-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-royal-100">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-royal-300 opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-royal-300" /></span>
          {t.gm.countdownBadge}
        </span>
      </div>
      <div aria-hidden="true" className="mx-6 my-5 border-t-2 border-dashed border-white/12 sm:mx-7" />
      <div className="px-6 pb-6 sm:px-7"><CountdownForm embedded /></div>
    </div>
  );
}

/** The download block: the two store buttons, large and centred, with the App Store countdown list under them. */
function DownloadSection() {
  const { t } = useI18n();
  return (
    <section id="download" className="relative mx-auto max-w-[1240px] px-5 pb-20 pt-4 md:px-8 md:pb-28">
      <Reveal className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-5 py-12 text-center sm:px-10 md:py-16">
        {/* App screens drift behind the buttons: tilted phones at the sides on desktop, peeking from the top corners on mobile. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 top-10 hidden -rotate-[14deg] opacity-50 lg:block"><Phone src={nutrition} alt="" width={230} /></div>
          <div className="absolute left-36 top-56 hidden -rotate-[6deg] opacity-35 xl:block"><Phone src={live} alt="" width={190} /></div>
          <div className="absolute -right-10 top-10 hidden rotate-[14deg] opacity-50 lg:block"><Phone src={streak} alt="" width={230} /></div>
          <div className="absolute right-36 top-56 hidden rotate-[6deg] opacity-35 xl:block"><Phone src={plan} alt="" width={190} /></div>
          <div className="absolute -left-14 -top-6 -rotate-[16deg] opacity-55 lg:hidden"><Phone src={home} alt="" width={150} /></div>
          <div className="absolute -right-14 -top-6 rotate-[16deg] opacity-55 lg:hidden"><Phone src={charts} alt="" width={150} /></div>
          <div className="absolute -bottom-24 -left-16 rotate-[12deg] opacity-45 lg:hidden"><Phone src={badges} alt="" width={150} /></div>
          <div className="absolute -bottom-24 -right-16 -rotate-[12deg] opacity-45 lg:hidden"><Phone src={scan} alt="" width={150} /></div>
          {/* Darken the middle so the heading, buttons and form stay easy to read. */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(5,8,23,0.9)_0%,rgba(5,8,23,0.62)_42%,rgba(5,8,23,0.05)_80%)]" />
        </div>
        <div className="aurora left-1/2 top-0 h-72 w-[520px] -translate-x-1/2 bg-royal-500/30" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.22em] text-royal-200">{t.gm.downloadKicker}</p>
        <h2 className="relative mx-auto mt-4 max-w-2xl text-3xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-4xl md:text-5xl">{t.gm.downloadTitle}</h2>
        <p className="relative mx-auto mt-4 max-w-md text-base text-white/70 sm:text-lg">
          <span className="font-semibold text-emerald-300">{t.gm.trialLine}</span> {t.gm.trialFine}
        </p>
        <div className="relative mx-auto mt-12 flex max-w-[640px] flex-col gap-5">
          <StoreButton store="playStore" size="lg" wide />
          <AppStoreCountdownCard />
          <TrialTicket />
        </div>
      </Reveal>
    </section>
  );
}

/**
 * The App Store countdown list: an email, or a phone number with its country. It posts to the
 * API's early list, which stores the entry so everyone can be told the day the iPhone app lands.
 */
function CountdownForm({ center = false, embedded = false }: { center?: boolean; embedded?: boolean }) {
  const { t, lang } = useI18n();
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState(() => guessCountry());
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (state === 'sending' || state === 'done') return;
    const e164 = mode === 'phone' ? toE164(country.dial, phone) : null;
    if (mode === 'phone' && !e164) { setState('error'); return; }
    if (mode === 'email' && !email.trim()) return;
    setState('sending');
    try {
      const body = mode === 'email'
        ? { email: email.trim(), language: lang, platform: 'ios' }
        : { phone: e164, country: country.code, language: lang, platform: 'ios' };
      const response = await fetch('/api/early-list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setState(response.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };
  const tab = (value: 'email' | 'phone', label: string, Icon: typeof Mail) => (
    <button type="button" onClick={() => { setMode(value); if (state === 'error') setState('idle'); }} aria-pressed={mode === value}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${mode === value ? 'bg-white text-ink' : 'text-white/60 hover:text-white'}`}>
      <Icon size={14} />{label}
    </button>
  );
  return (
    <form onSubmit={submit} className={`w-full ${embedded ? '' : 'max-w-md'} ${center ? 'mx-auto text-left' : ''}`}>
      {embedded ? <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/65">{t.gm.countdownBody}</p>
        {state === 'done' ? null : <div className="flex rounded-full border border-white/15 bg-white/[0.04] p-1">{tab('email', t.gm.countdownEmail, Mail)}{tab('phone', t.gm.countdownPhone, Smartphone)}</div>}
      </div> : <><div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-royal-100">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-royal-300 opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-royal-300" /></span>
          {t.gm.countdownBadge}
        </span>
        {state === 'done' ? null : <div className="flex rounded-full border border-white/15 bg-white/[0.04] p-1">{tab('email', t.gm.countdownEmail, Mail)}{tab('phone', t.gm.countdownPhone, Smartphone)}</div>}
      </div>
      <p className="text-lg font-semibold leading-snug">{t.gm.countdownTitle}</p>
      <p className="mb-4 mt-1 text-sm text-white/60">{t.gm.countdownBody}</p></>}
      <AnimatePresence mode="wait">
        {state === 'done' ? (
          <motion.p key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 rounded-2xl bg-emerald-400/10 px-5 py-4 text-sm font-medium text-emerald-300"><Check size={18} className="mt-0.5 shrink-0" />{t.gm.countdownDone}</motion.p>
        ) : (
          <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2 rounded-2xl border border-white/15 bg-white/[0.04] p-1.5 focus-within:border-royal-400">
            {mode === 'email' ? (
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t.gm.notifyPlaceholder} aria-label={t.gm.notifyPlaceholder} autoComplete="email" className="w-0 min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/40" />
            ) : (
              <>
                <label className="relative flex shrink-0 items-center gap-1.5 rounded-xl bg-white/[0.06] pl-3 pr-2 text-sm">
                  <span aria-hidden="true">{flag(country.code)}</span>
                  <span className="font-semibold">{country.dial}</span>
                  <span aria-hidden="true" className="text-white/40">▾</span>
                  <select aria-label={t.gm.countdownCountry} value={country.code} onChange={(event) => setCountry(countries.find((c) => c.code === event.target.value) ?? countries[0])} className="absolute inset-0 cursor-pointer opacity-0">
                    {countries.map((c) => <option key={c.code} value={c.code}>{`${flag(c.code)} ${c.name} (${c.dial})`}</option>)}
                  </select>
                </label>
                <input type="tel" required inputMode="tel" autoComplete="tel-national" value={phone} onChange={(event) => { setPhone(event.target.value); if (state === 'error') setState('idle'); }} placeholder={t.gm.countdownPhonePlaceholder} aria-label={t.gm.countdownPhonePlaceholder} className="w-0 min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/40" />
              </>
            )}
            <button type="submit" disabled={state === 'sending'} className="shrink-0 rounded-md bg-royal-500 px-4 py-3 text-sm font-semibold transition-colors hover:bg-royal-400 disabled:opacity-60 sm:px-5">{t.gm.countdownButton}</button>
          </motion.div>
        )}
      </AnimatePresence>
      {state === 'error' ? <p className="mt-2 text-sm text-red-300">{t.gm.countdownError}</p> : null}
      {state !== 'done' ? <p className="mt-2 text-xs text-white/40">{t.gm.countdownConsent}</p> : null}
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

/**
 * The page opens straight on the store buttons. The layout scrolls to the top on every route change and the
 * images above can still be loading, so it re-aims a few times until the visitor scrolls on their own.
 */
function useOpenAtDownload() {
  useEffect(() => {
    let stopped = false;
    const stop = () => { stopped = true; };
    const aim = () => {
      if (stopped) return;
      const target = document.getElementById('download');
      if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 64, behavior: 'auto' });
    };
    const timers = [0, 80, 250, 600, 1200, 2000].map((delay) => window.setTimeout(aim, delay));
    window.addEventListener('load', aim);
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchmove', stop, { passive: true });
    window.addEventListener('keydown', stop);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('load', aim);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchmove', stop);
      window.removeEventListener('keydown', stop);
    };
  }, []);
}

export default function GainmodePage() {
  const { t } = useI18n();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const sideY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  useOpenAtDownload();
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
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: EASE }} className="mt-4 text-5xl font-bold leading-[1.02] tracking-[-0.045em] md:text-7xl"><span className="sr-only">GainMode: </span>{t.gm.title}</motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: EASE }} className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">{t.gm.body}</motion.p>
            <motion.a href="#download" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45, ease: EASE }} className="mt-8 inline-flex items-center gap-2 rounded-lg bg-royal-500 px-6 py-4 text-sm font-semibold transition-colors hover:bg-royal-400">{t.gm.downloadKicker}<ArrowRight size={16} className="rotate-90" /></motion.a>
          </div>
          <div className="relative flex h-[560px] items-center justify-center md:h-[680px]">
            <motion.div style={{ y: sideY }} className="absolute left-0 top-24 hidden -rotate-[9deg] sm:block" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.4, ease: EASE }}><Phone src={nutrition} alt="" width={210} className="opacity-75" /></motion.div>
            <motion.div style={{ y: sideY }} className="absolute right-0 top-24 hidden rotate-[9deg] sm:block" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.5, ease: EASE }}><Phone src={live} alt="" width={210} className="opacity-75" /></motion.div>
            <motion.div style={{ y: phoneY }} className="relative z-10" initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.2, ease: EASE }}><Phone src={home} alt="GainMode" width={270} eager /></motion.div>
            <motion.img src={mascot} alt="" className="absolute -bottom-2 right-[8%] z-20 w-36 md:w-44" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }} transition={{ opacity: { delay: 1 }, scale: { delay: 1, type: 'spring' }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }} />
          </div>
        </div>
      </section>

      <DownloadSection />

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
            <div className="relative mx-auto mt-9 flex max-w-[680px] flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center"><StoreButton store="playStore" size="lg" /><StoreButton store="appStore" size="lg" /></div>
            <div className="relative mx-auto mt-10 max-w-md rounded-[28px] border border-white/20 bg-black/20 p-6 backdrop-blur"><CountdownForm center /></div>
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
