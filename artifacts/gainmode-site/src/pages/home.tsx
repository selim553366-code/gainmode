import { GlobeLayout } from '@/components/layout/globe-layout';
import { useI18n, type Lang } from '@/lib/i18n';
import { products } from '@/lib/data';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, Dumbbell } from 'lucide-react';
import gainmodeWordmark from '../assets/forge-fit/gainmode-wordmark.png';

const latestWorkLabels: Record<Lang, string> = {
  en: 'Our latest work',
  tr: 'En yeni çalışmamız',
  de: 'Unser neuestes Projekt',
  fr: 'Notre dernière création',
  es: 'Nuestro trabajo más reciente',
};

export default function Home() {
  const { t, lang } = useI18n();

  return (
    <GlobeLayout>
      <section className="cosmic-hero relative min-h-[760px] overflow-hidden border-b border-white/10">
        <div className="cosmic-grid absolute inset-0 pointer-events-none" />
        <div className="cosmic-orb cosmic-orb-one" />
        <div className="cosmic-orb cosmic-orb-two" />
        <div className="container mx-auto grid min-h-[760px] max-w-7xl items-center gap-12 px-4 py-28 md:px-6 lg:grid-cols-[.9fr_1.1fr] lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <Link
              href="/apps/gainmode"
              className="group mb-8 inline-flex items-center gap-2.5 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3.5 py-1.5 text-xs font-semibold text-cyan-100 backdrop-blur transition-colors hover:border-cyan-300/45 hover:bg-cyan-300/10"
            >
              <span>{latestWorkLabels[lang]}</span>
              <span className="h-1 w-1 rounded-full bg-cyan-300" />
              <span className="text-white">GainMode</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <h1 className="mb-8 max-w-3xl font-serif text-5xl font-bold leading-[.98] tracking-[-.055em] text-white md:text-7xl xl:text-[6.2rem]">
              {t.studioTagline}
            </h1>
            <p className="mb-12 max-w-xl text-lg leading-relaxed text-slate-300 md:text-xl">
              {t.studioDescription}
            </p>
            <Link 
              href="/apps"
              className="group inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white px-7 py-3.5 font-semibold text-[#071022] shadow-[0_12px_50px_rgba(65,164,255,.2)] transition-all hover:-translate-y-1 hover:shadow-[0_16px_60px_rgba(111,87,255,.32)]"
            >
              {t.ourWork}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: .94, rotate: 1.5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.1, delay: .12, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 mx-auto w-full max-w-[680px]"
          >
            <div className="absolute inset-[12%] rounded-full bg-blue-500/20 blur-[90px]" />
            <Link
              href="/apps/gainmode"
              className="group relative block overflow-hidden rounded-[2rem] border border-white/15 bg-[#070b1d] p-2 shadow-[0_45px_100px_rgba(0,0,0,.55)] backdrop-blur-xl transition-transform duration-500 hover:-translate-y-2"
            >
              <div className="relative aspect-[16/11] overflow-hidden rounded-[1.55rem] bg-[linear-gradient(145deg,#0b1732_0%,#0a1026_48%,#11102c_100%)]">
                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(116,160,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(116,160,255,.1)_1px,transparent_1px)] [background-size:38px_38px]" />
                <div className="absolute -right-[12%] -top-[28%] h-[72%] w-[72%] rounded-full bg-[radial-gradient(circle_at_35%_65%,rgba(64,188,255,.75),rgba(66,67,230,.32)_42%,transparent_68%)] blur-[2px] transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute -bottom-[34%] -left-[16%] h-[62%] w-[62%] rounded-full bg-[radial-gradient(circle_at_64%_35%,rgba(251,146,91,.32),rgba(111,69,255,.26)_38%,transparent_70%)] blur-[1px]" />
                <div className="absolute right-[13%] top-[28%] h-[42%] w-[42%] rounded-full border border-cyan-200/25 shadow-[0_0_70px_rgba(73,132,255,.2)]">
                  <div className="absolute inset-[18%] rounded-full border border-violet-300/25" />
                  <div className="absolute left-[-18%] top-1/2 h-px w-[136%] -rotate-12 bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,26,.04),rgba(4,10,26,.12)_45%,rgba(4,10,26,.72)_100%)]" />
                <div className="absolute right-[22%] top-[36%] z-10 flex h-[23%] w-[23%] -rotate-12 items-center justify-center rounded-[28%] border border-cyan-100/30 bg-cyan-100/10 shadow-[0_0_40px_rgba(103,232,249,.24)] backdrop-blur-md transition-transform duration-700 group-hover:-rotate-6 group-hover:scale-105">
                  <Dumbbell
                    aria-hidden="true"
                    strokeWidth={1.6}
                    className="h-[62%] w-[62%] text-cyan-50 drop-shadow-[0_0_12px_rgba(103,232,249,.85)]"
                  />
                </div>
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-6 sm:p-8">
                  <img
                    src={gainmodeWordmark}
                    alt="GainMode"
                    className="h-auto w-36 brightness-0 invert sm:w-44"
                  />
                  <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-white backdrop-blur-md">
                    {latestWorkLabels[lang]}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-6 sm:p-8">
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-cyan-200">{t.gmHeroKicker}</p>
                    <h2 className="max-w-md text-2xl font-bold leading-tight text-white sm:text-4xl">{t.gmHeroTitle.split('\n')[0]}</h2>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#071022] shadow-xl transition-transform group-hover:translate-x-1">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#080d20] py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_35%,rgba(73,90,255,.13),transparent_30%)]" />
        <div className="container relative mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-12 items-start justify-between">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold font-serif mb-6">{t.aboutTitle}</h2>
              <p className="text-lg leading-relaxed text-slate-400">{t.aboutBody}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
              {products.map(product => (
                <Link key={product.id} href={product.href} className="group block min-w-[260px] rounded-3xl border border-white/10 bg-white/[.045] p-6 backdrop-blur transition-all hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[.07]">
                  <div className="h-8 mb-6">
                    <img src={product.logo} alt={product.name} className="h-full object-contain brightness-0 invert opacity-90 transition-opacity group-hover:opacity-100" />
                  </div>
                  <h3 className="font-semibold mb-2">{product.name}</h3>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors group-hover:text-cyan-200">
                    {t.viewProduct} <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </GlobeLayout>
  );
}
