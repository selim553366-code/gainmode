import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'en' | 'tr';
export const languages: Lang[] = ['en', 'tr'];

const en = {
  nav: { work: 'Work', services: 'Services', about: 'About', contact: 'Contact', cta: 'Start a project', menu: 'Menu', close: 'Close', language: 'Language' },
  home: {
    eyebrow: 'App & web studio',
    title: ['We build apps', 'and websites', 'people love to use.'],
    body: 'Globe Studios designs and develops mobile apps and websites — from the first idea to the store listing, with care for every detail in between.',
    primary: 'See our work',
    secondary: 'Start a project',
    marquee: ['iOS apps', 'Android apps', 'Websites', 'Product design', 'AI features', 'Brand identity'],
    workKicker: 'Selected work',
    workTitle: 'Products we build and ship.',
    workAll: 'All work',
    nextTitle: 'Next product in the works',
    nextBody: 'We are already building what comes after GainMode. It will show up here first.',
    servicesKicker: 'What we do',
    servicesTitle: 'One team from idea to launch.',
    processKicker: 'How we work',
    processTitle: 'A clear path, step by step.',
    principlesKicker: 'What we care about',
    ctaTitle: 'Have a problem? Let’s solve it together.',
    ctaBody: 'Tell us what you want to make. We reply to every message.',
    ctaButton: 'Get in touch',
  },
  services: [
    { title: 'Mobile apps', body: 'Native-feeling iOS and Android apps with smooth motion, offline-friendly data and store-ready releases.' },
    { title: 'Websites', body: 'Fast, responsive websites and landing pages that explain your product clearly and look great on every screen.' },
    { title: 'Product design', body: 'Interfaces, flows and design systems shaped around how people actually use them.' },
    { title: 'AI features', body: 'Practical AI inside your product: coaching, photo analysis, personal plans and smart assistants.' },
  ],
  process: [
    { title: 'Discover', body: 'We learn the problem, the people and the goal before drawing a single screen.' },
    { title: 'Design', body: 'Flows, interfaces and motion, tested early on real devices.' },
    { title: 'Build', body: 'Clean, reliable code for mobile and web, delivered in small, visible steps.' },
    { title: 'Launch & grow', body: 'Store submission, analytics and the updates that come after launch day.' },
  ],
  principles: [
    { title: 'Craft over noise', body: 'Every screen, animation and word is there for a reason.' },
    { title: 'Built to last', body: 'Fast, stable software that keeps working after the launch buzz fades.' },
    { title: 'Global mindset', body: 'Products made for many languages and many places from day one.' },
  ],
  work: {
    kicker: 'Our work',
    title: 'Products by Globe Studios.',
    body: 'Apps and websites we design, build and launch. More are on the way.',
    view: 'View project',
    soon: 'Coming soon',
    live: 'Available now',
  },
  about: {
    kicker: 'About',
    title: 'A product studio for apps and the web.',
    body: [
      'Globe Studios is an independent studio that designs and develops mobile apps and websites. We build our own products and we partner with teams who want theirs made with the same care.',
      'We keep things focused: clear interfaces, motion that helps, code that holds up, and products that respect people’s time.',
    ],
    valuesTitle: 'How we think',
  },
  contact: {
    kicker: 'Contact',
    title: 'Let’s talk about your project.',
    body: 'Questions about our products, a new app or website, or a partnership — write to us and we will get back to you.',
    emailLabel: 'Email',
    supportLabel: 'Product support',
    supportBody: 'Need help with one of our apps? Include the app name and a short description of the issue.',
  },
  footer: { line: 'Apps and websites, made with care.', legal: 'All rights reserved.', privacy: 'Privacy', terms: 'Terms', support: 'Support' },
  legal: {
    privacyTitle: 'Privacy Policy',
    privacyBody: 'We only collect what our products need to work. We do not sell your data, and we protect it with industry-standard practices. Each app explains in its own privacy policy which data it uses and why.',
    termsTitle: 'Terms of Service',
    termsBody: 'By using our products you agree to use them responsibly. Our software is provided as designed to help you; app-specific terms are shown inside each app.',
    supportTitle: 'Support',
    supportBody: 'For help with any Globe Studios product, email us with the app name, your device and a short description of the issue.',
  },
  notFound: { title: 'Page not found', body: 'The page you are looking for does not exist.', back: 'Back to home' },
  gm: {
    back: 'All work',
    kicker: 'Fitness · AI · iOS & Android',
    title: 'Your AI fitness coach, in your pocket.',
    body: 'GainMode builds your training and nutrition plan with AI, counts your reps with the camera, reads your meals from a photo and keeps you going with streaks and badges.',
    soon: 'Coming soon',
    appStore: 'App Store',
    playStore: 'Google Play',
    storeSoon: 'Soon on',
    notifyTitle: 'Get notified at launch',
    notifyPlaceholder: 'Your email',
    notifyButton: 'Notify me',
    notifyDone: 'You are on the list. We will email you at launch.',
    notifyError: 'We could not save your email right now. Please try again.',
    featuresKicker: 'Inside GainMode',
    featuresTitle: 'Everything for a routine that lasts.',
    features: [
      { tag: 'AI plan', title: 'A plan written by AI, for you.', body: 'Answer a few questions about your goal, body, equipment and schedule. GainMode sends them to AI and builds your workouts and calorie targets while you watch.' },
      { tag: 'Food scan', title: 'Snap a meal, get the macros.', body: 'Point the camera at your plate or a barcode. GainMode estimates calories, protein, carbs and fat and adds them to your day.' },
      { tag: 'Live form', title: 'A coach that counts your reps.', body: 'Live form analysis tracks your skeleton through squats, push-ups and lunges, counts only clean reps and tells you what to fix.' },
      { tag: 'Nutrition', title: 'Your week of eating, at a glance.', body: 'Daily rings for calories and macros, a weekly view against your goal, and meals grouped the way you eat them.' },
      { tag: 'Training', title: 'Workouts that fit your week.', body: 'A weekly route of sessions built for your equipment and level, with exercises, sets and reps ready to go.' },
      { tag: 'Progress', title: 'See the change, not just feel it.', body: 'Charts for body weight, lifted weight, training time, calorie consistency and calories burned since day one.' },
      { tag: 'Motivation', title: 'Streaks and badges worth chasing.', body: 'A streak fire that grows at 10, 50 and 100 days, and 28 medals on a wooden wall — some of them very hard to earn.' },
    ],
    coachTag: 'FitBud',
    coachTitle: 'Meet FitBud, your AI training buddy.',
    coachBody: 'FitBud knows your plan, your goals and your progress. Ask anything — it answers in your language and can update your plan for you.',
    coachQuestion: 'When should I add weight to my squat?',
    coachAnswer: 'When you hit 12 clean reps on every set, add 2.5 kg next session. You are 2 reps away — nice work.',
    galleryKicker: 'Screens',
    galleryTitle: 'Designed down to the last pixel.',
    facts: [
      { value: '5', label: 'languages' },
      { value: '28', label: 'badges to earn' },
      { value: '3', label: 'exercises with live form analysis' },
      { value: 'iOS + Android', label: 'one experience' },
    ],
    ctaTitle: 'GainMode is almost here.',
    ctaBody: 'Leave your email and we will let you know the day it lands on the App Store and Google Play.',
    madeBy: 'Designed and built by Globe Studios',
  },
};

type Copy = typeof en;

const tr: Copy = {
  nav: { work: 'Çalışmalar', services: 'Hizmetler', about: 'Hakkımızda', contact: 'İletişim', cta: 'Proje başlat', menu: 'Menü', close: 'Kapat', language: 'Dil' },
  home: {
    eyebrow: 'Uygulama ve web stüdyosu',
    title: ['İnsanların', 'kullanmayı sevdiği', 'uygulamalar yapıyoruz.'],
    body: 'Globe Studios mobil uygulamalar ve web siteleri tasarlar ve geliştirir — ilk fikirden mağaza sayfasına kadar, aradaki her detaya özen göstererek.',
    primary: 'Çalışmalarımız',
    secondary: 'Proje başlat',
    marquee: ['iOS uygulamaları', 'Android uygulamaları', 'Web siteleri', 'Ürün tasarımı', 'Yapay zekâ özellikleri', 'Marka kimliği'],
    workKicker: 'Seçili işler',
    workTitle: 'Geliştirip yayınladığımız ürünler.',
    workAll: 'Tüm çalışmalar',
    nextTitle: 'Sıradaki ürün yolda',
    nextBody: 'GainMode’dan sonra gelecek ürün üzerinde çalışıyoruz. İlk burada görünecek.',
    servicesKicker: 'Ne yapıyoruz',
    servicesTitle: 'Fikirden yayına tek ekip.',
    processKicker: 'Nasıl çalışıyoruz',
    processTitle: 'Adım adım, net bir yol.',
    principlesKicker: 'Neyi önemsiyoruz',
    ctaTitle: 'Bir sorun mu var? Birlikte çözelim.',
    ctaBody: 'Ne yapmak istediğini anlat. Her mesaja dönüş yapıyoruz.',
    ctaButton: 'İletişime geç',
  },
  services: [
    { title: 'Mobil uygulamalar', body: 'Akıcı animasyonlu, çevrimdışı da çalışan, mağazaya hazır iOS ve Android uygulamaları.' },
    { title: 'Web siteleri', body: 'Ürününü net anlatan, her ekranda güzel görünen hızlı ve duyarlı web siteleri ve tanıtım sayfaları.' },
    { title: 'Ürün tasarımı', body: 'İnsanların gerçekte nasıl kullandığına göre şekillenen arayüzler, akışlar ve tasarım sistemleri.' },
    { title: 'Yapay zekâ özellikleri', body: 'Ürününün içinde işe yarayan yapay zekâ: koçluk, fotoğraf analizi, kişisel planlar ve akıllı asistanlar.' },
  ],
  process: [
    { title: 'Keşif', body: 'Tek bir ekran çizmeden önce sorunu, kullanıcıyı ve hedefi öğreniyoruz.' },
    { title: 'Tasarım', body: 'Akışlar, arayüzler ve animasyonlar; erkenden gerçek cihazlarda test ediliyor.' },
    { title: 'Geliştirme', body: 'Mobil ve web için temiz, güvenilir kod; küçük ve görünür adımlarla teslim.' },
    { title: 'Yayın ve büyüme', body: 'Mağaza başvurusu, analizler ve yayından sonra gelen güncellemeler.' },
  ],
  principles: [
    { title: 'Gürültü değil zanaat', body: 'Her ekran, her animasyon ve her kelime bir sebeple orada.' },
    { title: 'Kalıcı olsun diye', body: 'Yayın heyecanı geçtikten sonra da çalışmaya devam eden hızlı ve sağlam yazılım.' },
    { title: 'Küresel bakış', body: 'İlk günden birçok dil ve birçok ülke için yapılan ürünler.' },
  ],
  work: {
    kicker: 'Çalışmalarımız',
    title: 'Globe Studios ürünleri.',
    body: 'Tasarlayıp geliştirdiğimiz ve yayınladığımız uygulamalar ve web siteleri. Yenileri yolda.',
    view: 'Projeyi incele',
    soon: 'Yakında',
    live: 'Yayında',
  },
  about: {
    kicker: 'Hakkımızda',
    title: 'Uygulamalar ve web için bir ürün stüdyosu.',
    body: [
      'Globe Studios, mobil uygulamalar ve web siteleri tasarlayıp geliştiren bağımsız bir stüdyodur. Kendi ürünlerimizi geliştiriyor, kendi ürününün aynı özenle yapılmasını isteyen ekiplerle de çalışıyoruz.',
      'Odağımız net: anlaşılır arayüzler, işe yarayan animasyonlar, sağlam kod ve insanların zamanına saygı duyan ürünler.',
    ],
    valuesTitle: 'Nasıl düşünüyoruz',
  },
  contact: {
    kicker: 'İletişim',
    title: 'Projeni konuşalım.',
    body: 'Ürünlerimizle ilgili bir soru, yeni bir uygulama ya da web sitesi, veya bir iş birliği — bize yaz, sana dönüş yapalım.',
    emailLabel: 'E-posta',
    supportLabel: 'Ürün desteği',
    supportBody: 'Uygulamalarımızdan biriyle ilgili yardıma mı ihtiyacın var? Uygulamanın adını ve sorunu kısaca yaz.',
  },
  footer: { line: 'Özenle yapılan uygulamalar ve web siteleri.', legal: 'Tüm hakları saklıdır.', privacy: 'Gizlilik', terms: 'Şartlar', support: 'Destek' },
  legal: {
    privacyTitle: 'Gizlilik Politikası',
    privacyBody: 'Ürünlerimizin çalışması için yalnızca gereken bilgileri topluyoruz. Verilerini satmıyoruz ve sektör standartlarında koruyoruz. Her uygulama hangi verileri neden kullandığını kendi gizlilik politikasında açıklar.',
    termsTitle: 'Kullanım Şartları',
    termsBody: 'Ürünlerimizi kullanarak onları sorumlu bir şekilde kullanmayı kabul edersin. Yazılımlarımız sana yardımcı olmak için tasarlandığı haliyle sunulur; uygulamaya özel şartlar her uygulamanın içinde gösterilir.',
    supportTitle: 'Destek',
    supportBody: 'Globe Studios ürünlerinden herhangi biriyle ilgili yardım için uygulamanın adını, cihazını ve sorunun kısa bir açıklamasını bize e-postayla gönder.',
  },
  notFound: { title: 'Sayfa bulunamadı', body: 'Aradığın sayfa mevcut değil.', back: 'Ana sayfaya dön' },
  gm: {
    back: 'Tüm çalışmalar',
    kicker: 'Fitness · Yapay zekâ · iOS ve Android',
    title: 'Cebindeki yapay zekâ fitness koçu.',
    body: 'GainMode antrenman ve beslenme planını yapay zekâyla hazırlar, tekrarlarını kamerayla sayar, öğününü fotoğraftan okur ve seri ile rozetlerle seni motive tutar.',
    soon: 'Yakında',
    appStore: 'App Store',
    playStore: 'Google Play',
    storeSoon: 'Yakında',
    notifyTitle: 'Çıkınca haber verelim',
    notifyPlaceholder: 'E-posta adresin',
    notifyButton: 'Haber ver',
    notifyDone: 'Listedesin. Çıktığı gün e-posta göndereceğiz.',
    notifyError: 'E-postanı şu anda kaydedemedik. Lütfen tekrar dene.',
    featuresKicker: 'GainMode’un içi',
    featuresTitle: 'Kalıcı bir rutin için her şey.',
    features: [
      { tag: 'AI plan', title: 'Sana özel, yapay zekâyla yazılan plan.', body: 'Hedefin, vücudun, ekipmanın ve programınla ilgili birkaç soruyu cevapla. GainMode cevaplarını yapay zekâya gönderir; antrenmanların ve kalori hedeflerin gözünün önünde hazırlanır.' },
      { tag: 'Yemek tarama', title: 'Fotoğrafını çek, makroları gör.', body: 'Kamerayı tabağına ya da bir barkoda tut. GainMode kaloriyi, proteini, karbonhidratı ve yağı hesaplayıp gününe ekler.' },
      { tag: 'Canlı form', title: 'Tekrarlarını sayan bir koç.', body: 'Canlı form analizi squat, şınav ve lunge sırasında iskeletini takip eder, sadece doğru tekrarları sayar ve neyi düzeltmen gerektiğini söyler.' },
      { tag: 'Beslenme', title: 'Haftalık beslenmen tek bakışta.', body: 'Kalori ve makrolar için günlük halkalar, hedefine göre haftalık görünüm ve senin yediğin düzende gruplanan öğünler.' },
      { tag: 'Antrenman', title: 'Haftana uyan antrenmanlar.', body: 'Ekipmanına ve seviyene göre hazırlanmış haftalık bir rota; hareketler, setler ve tekrarlar hazır.' },
      { tag: 'Gelişim', title: 'Değişimi sadece hissetme, gör.', body: 'İlk günden beri vücut ağırlığı, kaldırdığın ağırlık, antrenman süresi, kalori tutarlılığı ve yakılan kalori grafikleri.' },
      { tag: 'Motivasyon', title: 'Peşinden koşmaya değer seriler ve rozetler.', body: '10, 50 ve 100. günlerde büyüyen bir seri ateşi ve ahşap bir duvarda 28 madalya — bazılarını kazanmak gerçekten zor.' },
    ],
    coachTag: 'FitBud',
    coachTitle: 'Antrenman arkadaşın FitBud ile tanış.',
    coachBody: 'FitBud planını, hedeflerini ve gelişimini bilir. Ne istersen sor — senin dilinde cevaplar ve planını senin için güncelleyebilir.',
    coachQuestion: 'Squat’ta ne zaman ağırlık artırmalıyım?',
    coachAnswer: 'Her sette 12 temiz tekrara ulaştığında bir sonraki antrenmanda 2,5 kg ekle. 2 tekrar kaldı — harika gidiyorsun.',
    galleryKicker: 'Ekranlar',
    galleryTitle: 'Son pikseline kadar tasarlandı.',
    facts: [
      { value: '5', label: 'dil' },
      { value: '28', label: 'kazanılacak rozet' },
      { value: '3', label: 'hareket için canlı form analizi' },
      { value: 'iOS + Android', label: 'tek deneyim' },
    ],
    ctaTitle: 'GainMode çok yakında.',
    ctaBody: 'E-postanı bırak, App Store ve Google Play’e çıktığı gün haber verelim.',
    madeBy: 'Globe Studios tarafından tasarlandı ve geliştirildi',
  },
};

const copies: Record<Lang, Copy> = { en, tr };
const STORAGE_KEY = 'globe-studios-lang';

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'tr') return stored;
  } catch {
    // Storage can be unavailable; fall back to the browser language.
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

const I18nContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void; t: Copy } | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* the choice still applies for this visit */ }
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const value = useMemo(() => ({ lang, setLang, t: copies[lang] }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
