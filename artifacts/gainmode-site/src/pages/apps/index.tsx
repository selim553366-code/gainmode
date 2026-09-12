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
                className="group block relative overflow-hidden rounded-2xl border border-border bg-card hover:border-foreground/20 transition-colors"
              >
                <div className="aspect-[4/3] bg-muted relative p-8 flex flex-col items-start justify-between">
                  <div className="w-32 h-10 relative mb-8">
                    <img 
                      src={product.logo} 
                      alt={product.name}
                      className="object-contain w-full h-full brightness-0 dark:invert opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  
                  <div>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-foreground/5 text-foreground mb-4">
                      {product.status === 'live' ? 'Live' : 'Coming Soon'}
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{product.name}</h3>
                    <p className="text-muted-foreground line-clamp-2">{product.description}</p>
                  </div>
                  
                  <div className="absolute top-8 right-8 w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
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
