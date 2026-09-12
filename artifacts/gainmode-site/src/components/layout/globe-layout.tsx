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
    <div className="min-h-[100dvh] flex flex-col bg-[#080d20] text-white selection:bg-cyan-300 selection:text-[#071022] font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#070b18]/75 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
               <Globe className="w-5 h-5 text-cyan-300 transition-transform group-hover:rotate-12" />
               <span className="font-semibold tracking-tight text-white">{t.studioName}</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.slice(1).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-foreground ${
                    location === link.href ? 'text-white' : 'text-slate-400'
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
                className="flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
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
                    className="absolute right-0 top-11 z-20 w-36 rounded-lg border border-white/10 bg-[#0d1429] p-1 shadow-2xl"
                  >
                    {languages.map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium ${
                          key === lang ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
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
              className="md:hidden flex items-center justify-center w-9 h-9 text-white"
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
            className="md:hidden overflow-hidden bg-[#080d20] border-b border-white/10"
          >
            <nav className="flex flex-col p-4 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`text-sm font-medium p-2 rounded-md ${
                    location === link.href ? 'bg-white/10 text-white' : 'text-slate-400'
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

      <footer className="border-t border-white/10 bg-[#070b18] mt-auto">
        <div className="container mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <Globe className="w-4 h-4 text-cyan-300" />
             <span className="text-xs font-semibold text-slate-500">{t.footerLegal}</span>
          </div>
          <nav className="flex gap-6">
             <Link href="/privacy" className="text-xs font-medium text-slate-500 hover:text-white transition-colors">{t.navPrivacy}</Link>
             <Link href="/terms" className="text-xs font-medium text-slate-500 hover:text-white transition-colors">{t.navTerms}</Link>
             <Link href="/support" className="text-xs font-medium text-slate-500 hover:text-white transition-colors">{t.navSupport}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
