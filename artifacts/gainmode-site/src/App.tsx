import { type ReactNode, useEffect } from 'react';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { MotionConfig } from 'framer-motion';
import { ErrorBoundary } from '@/components/error-boundary';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { SiteLayout } from '@/components/site/layout';
import Home from '@/pages/home';
import WorkPage from '@/pages/work';
import GainmodePage from '@/pages/work/gainmode';
import ServicesPage from '@/pages/services';
import AboutPage from '@/pages/about';
import ContactPage from '@/pages/contact';
import LegalPage from '@/pages/legal';
import AccountDeletionPage from '@/pages/account-deletion';
import NotFound from '@/pages/not-found';

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/work" component={WorkPage} />
        <Route path="/work/gainmode" component={GainmodePage} />
        <Route path="/services" component={ServicesPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/privacy">{() => <LegalPage kind="privacy" />}</Route>
        <Route path="/terms">{() => <LegalPage kind="terms" />}</Route>
        <Route path="/support">{() => <LegalPage kind="support" />}</Route>
        <Route path="/delete-account" component={AccountDeletionPage} />
        {/* Addresses from the previous site keep working. */}
        <Route path="/apps"><Redirect to="/work" replace /></Route>
        <Route path="/apps/gainmode"><Redirect to="/work/gainmode" replace /></Route>
        <Route path="/gainmode"><Redirect to="/work/gainmode" replace /></Route>
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
    const pages: Record<string, [string, string]> = {
      '/': [`Globe Studios — ${t.home.eyebrow}`, t.home.body],
      '/work': [`${t.nav.work} — Globe Studios`, t.work.body],
      '/work/gainmode': [`GainMode — ${t.gm.title}`, t.gm.body],
      '/services': [`${t.nav.services} — Globe Studios`, t.home.servicesTitle],
      '/about': [`${t.nav.about} — Globe Studios`, t.about.body[0]],
      '/contact': [`${t.nav.contact} — Globe Studios`, t.contact.body],
      '/privacy': [`${t.legal.privacyTitle} — Globe Studios`, t.legal.privacyBody],
      '/terms': [`${t.legal.termsTitle} — Globe Studios`, t.legal.termsBody],
      '/support': [`${t.legal.supportTitle} — Globe Studios`, t.legal.supportBody],
      '/delete-account': ['Account and data deletion — GainMode', 'Learn how to delete GainMode data stored on your device and manage your subscription.'],
    };
    const [title, description] = pages[location] ?? [`${t.notFound.title} — Globe Studios`, t.notFound.body];
    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = content;
    };
    document.title = title;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', window.location.href.split(/[?#]/)[0]);
  }, [location, t]);
  return null;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <I18nProvider>
        <WouterRouter base={import.meta.env.BASE_URL.startsWith('.') ? '' : import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <PageMetadata />
          <SiteLayout><Router /></SiteLayout>
        </WouterRouter>
      </I18nProvider>
    </MotionConfig>
  );
}
