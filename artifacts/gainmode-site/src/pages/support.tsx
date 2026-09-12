import { GlobeLayout } from '@/components/layout/globe-layout';
import { useI18n } from '@/lib/i18n';
import { Mail } from 'lucide-react';

export default function SupportPage() {
  const { t } = useI18n();
  return (
    <GlobeLayout>
      <div className="container mx-auto px-4 md:px-6 py-24 max-w-3xl">
        <h1 className="text-4xl font-bold font-serif mb-8">{t.supportTitle}</h1>
        <div className="prose prose-lg dark:prose-invert text-muted-foreground mb-12">
          <p>{t.supportBody}</p>
        </div>
        
        <div className="p-8 rounded-2xl bg-muted border border-border flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
            <Mail className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">{t.supportEmailLabel}</h3>
            <a href={`mailto:${t.contactEmail}`} className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              {t.contactEmail}
            </a>
          </div>
        </div>
      </div>
    </GlobeLayout>
  );
}
