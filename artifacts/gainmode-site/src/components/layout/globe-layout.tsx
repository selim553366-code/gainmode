import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useI18n, languages, Lang } from '@/lib/i18n';
import { Menu, X, ChevronDown, Check, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function GlobeLayout({ children }: { children: ReactNode }) {
  const { lang, setLang, t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: '/', label: t.studioName },
    { href: '/apps', label: t.navApps },
    { href: '/about', label: t.navAbout },
    { href: '/contact', label: t.navContact },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-foreground selection:text-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <Globe className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span className="font-semibold tracking-tight">{t.studioName}</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.slice(1).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-foreground ${
                    location === link.href ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                className="flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                onClick={() => setLangOpen(!langOpen)}
                aria-label={t.gmLangLabel}
              >
                <span>{lang.toUpperCase()}</span>
                <ChevronDown size={14} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-11 z-20 w-36 rounded-lg border border-border bg-card p-1 shadow-lg"
                  >
                    {languages.map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium ${
                          key === lang ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                        onClick={() => { setLang(key); setLangOpen(false); }}
                      >
                        {t.gmLanguages[key]}
                        {key === lang && <Check size={14} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              className="md:hidden flex items-center justify-center w-9 h-9 text-foreground"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={t.toggleMenu}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-background border-b border-border"
          >
            <nav className="flex flex-col p-4 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`text-sm font-medium p-2 rounded-md ${
                    location === link.href ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">{t.footerLegal}</span>
          </div>
          <nav className="flex gap-6">
            <Link href="/privacy" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">{t.navPrivacy}</Link>
            <Link href="/terms" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">{t.navTerms}</Link>
            <Link href="/support" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">{t.navSupport}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
