import { GlobeLayout } from '@/components/layout/globe-layout';
import { useI18n } from '@/lib/i18n';
import { products } from '@/lib/data';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function AppsPage() {
  const { t } = useI18n();

  return (
    <GlobeLayout>
      <div className="container mx-auto px-4 md:px-6 py-24 md:py-32 max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-20"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 font-serif">
            {t.ourWork}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t.aboutTitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * (i + 1) }}
            >
              <Link 
                href={product.href}
                className="group relative block overflow-hidden rounded-2xl border border-white/15 bg-white transition-colors hover:border-cyan-300/40"
              >
                <div className="relative flex aspect-[4/3] flex-col items-start justify-between bg-slate-50 p-8 text-[#071022]">
                  <div className="w-32 h-10 relative mb-8">
                    <img 
                      src={product.logo} 
                      alt={product.name}
                      className="h-full w-full object-contain brightness-0 opacity-80 transition-opacity group-hover:opacity-100"
                    />
                  </div>
                  
                  <div>
                    <div className="mb-4 inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {product.status === 'live' ? t.statusLive : t.statusComingSoon}
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-[#071022]">{product.name}</h3>
                    <p className="line-clamp-2 text-slate-600">{product.description}</p>
                  </div>
                  
                  <div className="absolute right-8 top-8 flex h-10 w-10 -translate-y-2 items-center justify-center rounded-full bg-[#071022] text-white opacity-0 shadow-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </GlobeLayout>
  );
}
