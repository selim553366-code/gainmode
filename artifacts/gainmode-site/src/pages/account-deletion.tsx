import { useEffect } from 'react';
import { Link } from 'wouter';
import { Kicker, Reveal } from '@/components/site/motion';
import { accountDeletionCopy, accountDeletionLanguages, type AccountDeletionLanguage } from '@/lib/account-deletion-copy';
import { useI18n } from '@/lib/i18n';

function resolveLanguage(requested: string | null, fallback: string): AccountDeletionLanguage {
  if (requested && (accountDeletionLanguages as readonly string[]).includes(requested)) {
    return requested as AccountDeletionLanguage;
  }
  return fallback === 'tr' ? 'tr' : 'en';
}

export default function AccountDeletionPage() {
  const { lang } = useI18n();
  const language = resolveLanguage(
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('lang'),
    lang,
  );
  const copy = accountDeletionCopy[language];
  const siteLanguage = language === 'tr' ? 'tr' : 'en';

  useEffect(() => {
    const title = `${copy.title} · Globe Studios`;
    document.title = title;
    document.documentElement.lang = language;
    const description = copy.lead;
    for (const [selector, attribute, key, value] of [
      ['meta[name="description"]', 'name', 'description', description],
      ['meta[property="og:title"]', 'property', 'og:title', title],
      ['meta[property="og:description"]', 'property', 'og:description', description],
      ['meta[property="og:url"]', 'property', 'og:url', `${window.location.origin}/delete-account`],
    ] as const) {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = value;
    }
  }, [copy, language]);

  return (
    <section className="mx-auto max-w-3xl px-5 pb-24 pt-32 md:pt-40">
      <Kicker>GainMode · Globe Studios</Kicker>
      <h1 className="mt-5 max-w-3xl font-display text-[30px] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] md:text-6xl">
        {copy.title}
      </h1>
      <Reveal>
        <p className="mt-8 text-lg leading-relaxed text-white/70">{copy.lead}</p>
      </Reveal>

      <nav aria-label="Language" className="mt-7 flex flex-wrap gap-2">
        {accountDeletionLanguages.map((code) => (
          <a
            key={code}
            href={`/delete-account?lang=${code}`}
            lang={code}
            aria-current={language === code ? 'page' : undefined}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-200 ${
              language === code
                ? 'border-royal-200/60 bg-royal-200/10 text-white'
                : 'border-white/10 text-white/55 hover:border-white/25 hover:text-white'
            }`}
          >
            {code.toUpperCase()}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-8">
        {copy.sections.map((section, index) => (
          <Reveal key={section.title} delay={index * 0.04}>
            <article className="border-t border-white/10 pt-6">
              <h2 className="font-display text-lg font-bold tracking-tight text-white md:text-xl">{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-base leading-7 text-white/65">{paragraph}</p>
              ))}
              {section.steps?.length ? (
                <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-7 text-white/65">
                  {section.steps.map((step) => <li key={step} className="pl-1">{step}</li>)}
                </ol>
              ) : null}
            </article>
          </Reveal>
        ))}
      </div>

      <div className="mt-10 border-t border-white/10 pt-6">
        <p className="text-sm leading-relaxed text-white/50">{copy.footer}</p>
        <a
          href="mailto:globestudiosdev@gmail.com"
          className="mt-4 inline-block font-semibold text-royal-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-royal-200"
        >
          globestudiosdev@gmail.com
        </a>
        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/55">
          <Link href={`/privacy?lang=${siteLanguage}`} className="hover:text-white">{copy.privacyLink}</Link>
          <Link href={`/terms?lang=${siteLanguage}`} className="hover:text-white">{copy.termsLink}</Link>
        </div>
      </div>
    </section>
  );
}
