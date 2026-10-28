import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowUpRight, Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { type Product, products } from '@/lib/products';
import { Kicker, Reveal, SplitTitle } from '@/components/site/motion';
import { Phone } from '@/components/site/phone';

/** A product tile for the work grid: icon, name, status and its first screens rising on hover. */
export function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useI18n();
  return (
    <Link href={`/work/${product.slug}`} className="group relative flex h-[560px] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-[#0E1A4D] to-[#070B22] p-8">
      <div className="aurora -right-24 -top-24 h-72 w-72 opacity-60" style={{ background: product.accent }} />
      <div className="relative flex items-start justify-between">
        <img src={product.icon} alt="" className="h-14 w-14 rounded-2xl shadow-lg" />
        <span className="grid h-11 w-11 place-items-center rounded-lg border border-white/15 transition duration-500 group-hover:rotate-45 group-hover:bg-white group-hover:text-ink"><ArrowUpRight size={18} /></span>
      </div>
      <div className="relative mt-6">
        {product.wordmark ? <img src={product.wordmark} alt={product.name} className="h-6 w-auto brightness-0 invert" /> : <h3 className="text-2xl font-bold">{product.name}</h3>}
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-royal-200">{product.category[lang]} · {product.year}</p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">{product.summary[lang]}</p>
      </div>
      <div className="relative mt-auto flex justify-center gap-3 translate-y-24 transition duration-700 ease-out group-hover:translate-y-16">
        <Phone src={product.screens[1]} alt="" width={150} className="mt-8 -rotate-6 opacity-70" />
        <Phone src={product.screens[0]} alt="" width={170} className="relative z-10" />
        <Phone src={product.screens[2]} alt="" width={150} className="mt-8 rotate-6 opacity-70" />
      </div>
      <span className="absolute bottom-6 left-8 rounded-full bg-ink/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">{product.status === 'live' ? t.work.live : t.work.soon}</span>
    </Link>
  );
}

export default function WorkPage() {
  const { t } = useI18n();
  return (
    <section className="relative mx-auto max-w-[1240px] px-5 pb-24 pt-32 md:px-8 md:pt-40">
      <div className="aurora -left-32 top-10 h-[380px] w-[380px] bg-royal-600/25" />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Kicker>{t.work.kicker}</Kicker></motion.div>
      <SplitTitle lines={[t.work.title]} className="relative mt-5 max-w-4xl font-display text-[25px] min-[400px]:text-[30px] font-extrabold uppercase leading-[0.95] tracking-[-0.035em] sm:text-5xl md:text-7xl" />
      <Reveal delay={0.2}><p className="mt-6 max-w-xl text-lg text-white/60">{t.work.body}</p></Reveal>
      <div className="mt-16 grid gap-5 md:grid-cols-2">
        {products.map((product, index) => <Reveal key={product.slug} delay={index * 0.1} className="min-w-0"><ProductCard product={product} /></Reveal>)}
        <Reveal delay={0.1} className="min-w-0">
          <div className="flex h-[560px] flex-col items-center justify-center rounded-[32px] border border-dashed border-white/15 p-8 text-center">
            <span className="relative grid h-16 w-16 place-items-center rounded-full border border-white/15"><Plus size={24} className="text-royal-300" /><span className="absolute inset-0 animate-ping rounded-full border border-royal-400/40" /></span>
            <p className="mt-6 font-display text-2xl font-extrabold uppercase tracking-[-0.02em]">{t.home.nextTitle}</p>
            <p className="mt-3 max-w-xs text-sm text-white/55">{t.home.nextBody}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
