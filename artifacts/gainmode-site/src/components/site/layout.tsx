import { type ReactNode, useEffect, useId, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { languages, useI18n } from '@/lib/i18n';
import { CONTACT_EMAIL } from '@/lib/products';
import { Logo } from '@/components/site/brand';

function LanguageSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  const pillId = useId();
  return (
    <div role="group" aria-label={t.nav.language} className={`relative flex rounded-full border border-white/10 bg-white/[0.04] p-1 ${className}`}>
      {languages.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`relative z-10 h-7 w-10 rounded-full text-[11px] font-bold tracking-[0.12em] transition-colors ${lang === code ? 'text-[#06091A]' : 'text-white/55 hover:text-white'}`}
        >
          {lang === code ? <motion.span layoutId={pillId} className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: 'spring', stiffness: 500, damping: 34 }} /> : null}
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const links = [
    { href: '/work', label: t.nav.work },
    { href: '/services', label: t.nav.services },
    { href: '/about', label: t.nav.about },
    { href: '/contact', label: t.nav.contact },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [location]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; }, [open]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-clip bg-ink text-white">
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? 'border-b border-white/[0.07] bg-ink/70 backdrop-blur-xl' : 'border-b border-transparent'}`}>
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 md:px-8">
          <Link href="/" aria-label="Globe Studios" className="transition-opacity hover:opacity-80"><Logo /></Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active = location === link.href || location.startsWith(`${link.href}/`);
              return (
                <Link key={link.href} href={link.href} className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? 'text-white' : 'text-white/60 hover:text-white'}`}>
                  {active ? <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-white/[0.08]" transition={{ type: 'spring', stiffness: 400, damping: 34 }} /> : null}
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitch className="hidden sm:flex" />
            <button type="button" onClick={() => setOpen(true)} aria-label={t.nav.menu} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 md:hidden"><Menu size={18} /></button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-[60] flex flex-col bg-ink px-5 pb-10 pt-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} aria-label={t.nav.close} className="grid h-10 w-10 place-items-center rounded-full border border-white/10"><X size={18} /></button>
            </div>
            <nav className="mt-14 flex flex-col gap-2">
              {[{ href: '/', label: 'Globe Studios' }, ...links].map((link, index) => (
                <motion.div key={link.href} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * index, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                  <Link href={link.href} className="font-display text-[40px] font-extrabold uppercase leading-[1.05] tracking-[-0.03em] text-white">{link.label}</Link>
                </motion.div>
              ))}
            </nav>
            <div className="mt-auto flex items-center justify-between">
              <LanguageSwitch />
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-white/60">{CONTACT_EMAIL}</a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main className="flex-1">{children}</main>

      <footer className="relative border-t border-white/[0.07]">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
          <div>
            <Logo size={38} />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/50">{t.footer.line}</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-royal-200 hover:text-white">{CONTACT_EMAIL}<ArrowUpRight size={14} /></a>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            {links.map((link) => <Link key={link.href} href={link.href} className="text-white/60 hover:text-white">{link.label}</Link>)}
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <Link href="/privacy" className="text-white/60 hover:text-white">{t.footer.privacy}</Link>
            <Link href="/terms" className="text-white/60 hover:text-white">{t.footer.terms}</Link>
            <Link href="/support" className="text-white/60 hover:text-white">{t.footer.support}</Link>
            <LanguageSwitch className="mt-2 self-start" />
          </div>
        </div>
        <div className="mx-auto max-w-[1240px] px-5 pb-10 text-xs text-white/35 md:px-8">© {new Date().getFullYear()} Globe Studios. {t.footer.legal}</div>
        <div aria-hidden="true" className="pointer-events-none select-none overflow-hidden px-3 pb-2 whitespace-nowrap text-center font-display text-[12.5vw] font-extrabold uppercase leading-[0.8] tracking-[-0.04em] text-white/[0.035]">Globe Studios</div>
      </footer>
    </div>
  );
}
