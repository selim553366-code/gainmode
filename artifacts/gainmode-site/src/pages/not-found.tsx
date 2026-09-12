import { GlobeLayout } from '@/components/layout/globe-layout';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <GlobeLayout>
      <div className="flex-1 flex items-center justify-center py-32">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center px-4">
          <h1 className="text-6xl font-serif font-bold mb-4">{t.notFoundTitle}</h1>
          <p className="text-xl text-muted-foreground">{t.notFoundBody}</p>
        </motion.div>
      </div>
    </GlobeLayout>
  );
}
