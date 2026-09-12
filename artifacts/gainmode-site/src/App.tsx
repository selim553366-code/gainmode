import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { I18nProvider, useI18n } from '@/lib/i18n';
import NotFound from '@/pages/not-found';

import Home from '@/pages/home';
import AppsPage from '@/pages/apps/index';
import GainmodePage from '@/pages/apps/gainmode';
import AboutPage from '@/pages/about';
import ContactPage from '@/pages/contact';
import PrivacyPage from '@/pages/privacy';
import TermsPage from '@/pages/terms';
import SupportPage from '@/pages/support';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/apps" component={AppsPage} />
        <Route path="/apps/gainmode" component={GainmodePage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/support" component={SupportPage} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function PageMetadata() {
  const [location] = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    const metadata = location === '/'
      ? { title: `${t.studioName} — ${t.studioTagline}`, description: t.studioDescription }
      : location === '/apps'
        ? { title: `${t.navApps} — ${t.studioName}`, description: t.studioDescription }
        : location === '/apps/gainmode'
          ? { title: `GainMode — ${t.studioName}`, description: t.gmHeroBody }
          : location === '/about'
            ? { title: `${t.navAbout} — ${t.studioName}`, description: t.aboutBody }
            : location === '/contact'
              ? { title: `${t.navContact} — ${t.studioName}`, description: t.contactBody }
              : location === '/privacy'
                ? { title: `${t.privacyTitle} — ${t.studioName}`, description: t.privacyBody }
                : location === '/terms'
                  ? { title: `${t.termsTitle} — ${t.studioName}`, description: t.termsBody }
                  : location === '/support'
                    ? { title: `${t.navSupport} — ${t.studioName}`, description: t.supportBody }
                    : { title: `${t.notFoundTitle} — ${t.studioName}`, description: t.notFoundBody };

    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    document.title = metadata.title;
    setMeta('meta[name="description"]', 'name', 'description', metadata.description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', metadata.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', metadata.description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMeta('meta[property="og:url"]', 'property', 'og:url', window.location.href.split(/[?#]/)[0]);
  }, [location, t]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <PageMetadata />
            <Router />
          </WouterRouter>
        </I18nProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
