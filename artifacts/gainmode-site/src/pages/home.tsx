import { GlobeLayout } from '@/components/layout/globe-layout';
import { useI18n, type Lang } from '@/lib/i18n';
import { products } from '@/lib/data';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import studioLogo from '../../../../attached_assets/image_1789248722769.png';

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
            <div className="logo-frame relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#070b1d]/65 p-2 shadow-[0_45px_100px_rgba(0,0,0,.55)] backdrop-blur-xl">
              <img src={studioLogo} alt={t.studioName} className="aspect-[692/484] w-full rounded-[1.55rem] object-cover" />
            </div>
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
