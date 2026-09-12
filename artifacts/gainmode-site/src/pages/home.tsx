import { GlobeLayout } from '@/components/layout/globe-layout';
import { useI18n } from '@/lib/i18n';
import { products } from '@/lib/data';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  const { t } = useI18n();

  return (
    <GlobeLayout>
      <section className="relative py-32 md:py-48 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs font-semibold mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.studioName}</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 font-serif leading-[1.05]">
              {t.studioTagline}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed mb-12">
              {t.studioDescription}
            </p>
            <Link 
              href="/apps"
              className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-4 rounded-full font-semibold hover:-translate-y-0.5 transition-transform"
            >
              {t.ourWork}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="flex flex-col md:flex-row gap-12 items-start justify-between">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold font-serif mb-6">{t.aboutTitle}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">{t.aboutBody}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
              {products.map(product => (
                <Link key={product.id} href={product.href} className="group block p-6 rounded-2xl bg-card border border-border hover:border-foreground/20 transition-colors">
                  <div className="h-8 mb-6">
                    <img src={product.logo} alt={product.name} className="h-full object-contain brightness-0 dark:invert opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="font-semibold mb-2">{product.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium group-hover:text-foreground transition-colors">
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
