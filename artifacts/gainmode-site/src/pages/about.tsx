import { GlobeLayout } from '@/components/layout/globe-layout';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';

export default function AboutPage() {
  const { t } = useI18n();
  return (
    <GlobeLayout>
      <div className="container mx-auto px-4 md:px-6 py-24 md:py-32 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl md:text-6xl font-bold font-serif mb-8">{t.navAbout}</h1>
          <div className="prose prose-lg dark:prose-invert">
            <p className="text-2xl font-medium leading-snug mb-8">{t.aboutTitle}</p>
            <p className="text-muted-foreground">{t.aboutBody}</p>
          </div>
        </motion.div>
      </div>
    </GlobeLayout>
  );
}
