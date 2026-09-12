import { GlobeLayout } from '@/components/layout/globe-layout';
import { useI18n } from '@/lib/i18n';

export default function PrivacyPage() {
  const { t } = useI18n();
  return (
    <GlobeLayout>
      <div className="container mx-auto px-4 md:px-6 py-24 max-w-3xl">
        <h1 className="text-4xl font-bold font-serif mb-8">{t.privacyTitle}</h1>
        <div className="prose prose-lg dark:prose-invert text-muted-foreground">
          <p>{t.privacyBody}</p>
        </div>
      </div>
    </GlobeLayout>
  );
}
