import { GlobeLayout } from '@/components/layout/globe-layout';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

export default function ContactPage() {
  const { t } = useI18n();
  return (
    <GlobeLayout>
      <div className="container mx-auto px-4 md:px-6 py-24 md:py-32 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl md:text-6xl font-bold font-serif mb-8">{t.contactTitle}</h1>
          <p className="text-xl text-muted-foreground mb-12">{t.contactBody}</p>
          
          <div className="p-8 rounded-2xl bg-muted border border-border flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
              <Mail className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">{t.emailUs}</h3>
              <a href={`mailto:${t.contactEmail}`} className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                {t.contactEmail}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </GlobeLayout>
  );
}
