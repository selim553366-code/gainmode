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
    privacyUpdated: 'Last updated: October 28, 2026',
    privacySections: [
      { title: 'Information in GainMode', body: 'GainMode stores your profile, meals, weight logs, workout progress, app language and usage counters on your device by default. The app does not create a user account or send these local records to GainMode servers to create a profile. You can remove local records in the app settings or by clearing the app data or uninstalling the app.' },
      { title: 'Location and weather features', body: 'GainMode requests foreground location access only when you choose to use weather-based chat backgrounds and approve the system permission prompt. Your current coordinates are sent directly from your device to Open-Meteo to retrieve current weather conditions for that location. GainMode does not use location for background tracking and does not store coordinates on its servers. You can revoke location access in your device settings or turn off the weather feature in the coach chat. Open-Meteo’s privacy terms apply to its processing of the weather request.' },
      { title: 'Camera, AI and search', body: 'Live exercise pose analysis runs on your device; camera video is not sent to GainMode servers, recorded or shared. Messages sent to the FitBud coach and the context needed to personalize a response may be sent through the GainMode server to an AI provider. A meal photo you submit for analysis may also be sent to an AI provider to estimate nutrition. Food search text may be sent to third-party nutrition data services. Do not submit sensitive personal information. These providers may apply their own processing and retention terms.' },
      { title: 'Subscriptions, choices and contact', body: 'RevenueCat and Apple App Store or Google Play may process subscription status and technical purchase information to provide Premium access. Payments are handled by the store; GainMode does not receive your payment card details. Hosting infrastructure may process limited technical logs for operation, security and troubleshooting. You can revoke camera or location permission in device settings, stop using AI and food-search features, and delete local app data in Settings. GainMode does not sell this data or use it to build advertising profiles. For privacy questions, contact globestudiosdev@gmail.com.' },
    ],
    termsTitle: 'Terms of Service',
    termsBody: 'By using our products you agree to use them responsibly. Our software is provided as designed to help you; app-specific terms are shown inside each app.',
    termsUpdated: 'Last updated: October 28, 2026',
    termsSections: [
      { title: 'Using GainMode', body: 'GainMode provides fitness planning, workout tracking, nutrition logging and general wellness information. Estimates for goals, calories and progress are approximate, vary by person and do not guarantee a particular result. AI-generated content can be inaccurate or incomplete; review it before relying on it.' },
      { title: 'Health and safety', body: 'GainMode is not a medical device and does not diagnose, treat, cure or prevent disease. App content is not a substitute for medical advice, diagnosis or treatment. Ask a qualified healthcare professional about health concerns, symptoms or dietary changes. Stop exercising if you experience pain, dizziness or unusual symptoms; contact local emergency services in an emergency.' },
      { title: 'Subscriptions and purchases', body: 'Premium purchases are processed by Apple App Store or Google Play and charged to your store account. The store displays the price, billing period, any trial duration and post-trial price before purchase confirmation. Subscriptions renew automatically unless cancelled under the store’s terms. Manage or cancel them in your store account settings before renewal. Deleting the app does not cancel a subscription. Use GainMode’s restore-purchases option to recognize eligible purchases again.' },
      { title: 'Data and responsibility', body: 'Profile and progress records are stored on your device by default. When you use AI, weather or food-search features, information described in the Privacy Policy may be sent to the relevant service providers. You are responsible for using GainMode safely and in a way that is appropriate for your circumstances. For questions about these terms, contact globestudiosdev@gmail.com.' },
    ],
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
    privacyUpdated: 'Son güncelleme: 28 Ekim 2026',
    privacySections: [
      { title: 'GainMode’da işlenen bilgiler', body: 'GainMode; profilini, öğünlerini, kilo kayıtlarını, antrenman ilerlemeni, uygulama dilini ve kullanım sayaçlarını varsayılan olarak cihazında saklar. Uygulama kullanıcı hesabı oluşturmaz ve bu yerel kayıtları profil oluşturmak amacıyla GainMode sunucularına göndermez. Yerel kayıtlarını uygulama ayarlarından, uygulama verilerini temizleyerek veya uygulamayı kaldırarak silebilirsin.' },
      { title: 'Konum ve hava durumu özellikleri', body: 'GainMode, yalnızca hava durumuna göre değişen sohbet arka planlarını kullanmayı seçtiğinde ve sistem izin penceresini onayladığında, uygulama kullanımdayken konum izni ister. Mevcut koordinatların, o konumdaki güncel hava durumunu almak için cihazından doğrudan Open-Meteo’ya gönderilir. GainMode konumu arka planda takip etmez ve koordinatları sunucularında saklamaz. Konum iznini cihaz ayarlarından kaldırabilir veya koç sohbetindeki hava durumu özelliğini kapatabilirsin. Open-Meteo’nun hava durumu isteğini işlemesi kendi gizlilik koşullarına tabidir.' },
      { title: 'Kamera, yapay zekâ ve arama', body: 'Canlı egzersiz poz analizi cihazında çalışır; kamera videosu GainMode sunucularına gönderilmez, kaydedilmez veya paylaşılmaz. FitBud koçuna gönderdiğin mesajlar ve yanıtı kişiselleştirmek için gereken bağlam, GainMode sunucusu üzerinden bir yapay zekâ sağlayıcısına iletilebilir. Analiz için gönderdiğin yemek fotoğrafı da besin tahmini oluşturmak üzere yapay zekâ sağlayıcısına gönderilebilir. Yemek araması metni üçüncü taraf beslenme verisi hizmetlerine iletilebilir. Hassas kişisel bilgiler gönderme. Bu sağlayıcıların kendi işleme ve saklama koşulları geçerli olabilir.' },
      { title: 'Abonelikler, seçeneklerin ve iletişim', body: 'Premium erişimi sağlamak için RevenueCat ile Apple App Store veya Google Play abonelik durumunu ve satın alımla ilgili teknik bilgileri işleyebilir. Ödemeler mağaza tarafından alınır; GainMode ödeme kartı bilgilerini almaz. Uygulamayı barındıran altyapı, çalıştırma, güvenlik ve hata ayıklama için sınırlı teknik kayıtları işleyebilir. Kamera veya konum iznini cihaz ayarlarından kaldırabilir, yapay zekâ ve yemek arama özelliklerini kullanmayabilir, uygulama ayarlarından cihazındaki verileri silebilirsin. GainMode bu verileri satmaz veya reklam profili oluşturmak için kullanmaz. Gizlilik soruları için globestudiosdev@gmail.com adresine yazabilirsin.' },
    ],
    termsTitle: 'Kullanım Şartları',
    termsBody: 'Ürünlerimizi kullanarak onları sorumlu bir şekilde kullanmayı kabul edersin. Yazılımlarımız sana yardımcı olmak için tasarlandığı haliyle sunulur; uygulamaya özel şartlar her uygulamanın içinde gösterilir.',
    termsUpdated: 'Son güncelleme: 28 Ekim 2026',
    termsSections: [
      { title: 'GainMode’un kullanımı', body: 'GainMode fitness planlama, antrenman takibi, beslenme kaydı ve genel sağlık bilgileri sunar. Hedef, kalori ve ilerleme tahminleri yaklaşık değerlerdir; kişiye göre değişir ve belirli bir sonucu garanti etmez. Yapay zekâ tarafından oluşturulan içerikler hatalı veya eksik olabilir; bunlara güvenmeden önce kontrol et.' },
      { title: 'Sağlık ve güvenlik', body: 'GainMode tıbbi cihaz değildir; hastalıkları teşhis etmez, tedavi etmez, iyileştirmez veya önlemez. Uygulama içeriği tıbbi tavsiye, tanı ya da tedavinin yerine geçmez. Sağlığın, belirtilerin veya beslenme değişiklikleri hakkında yetkili bir sağlık uzmanına danış. Egzersiz sırasında ağrı, baş dönmesi veya olağan dışı belirtiler hissedersen dur; acil durumda yerel acil yardım hizmetlerine başvur.' },
      { title: 'Abonelikler ve satın almalar', body: 'Premium satın alımları Apple App Store veya Google Play tarafından işlenir ve mağaza hesabına ücretlendirilir. Satın alma onayından önce mağaza fiyatı, faturalandırma dönemi, varsa deneme süresi ve deneme sonrası fiyatı gösterir. Abonelikler mağaza koşullarına göre iptal edilmedikçe otomatik yenilenir. Yenileme öncesinde mağaza hesabının ayarlarından yönetebilir veya iptal edebilirsin. Uygulamayı silmek aboneliği iptal etmez. Uygulamadaki satın alımları geri yükleme seçeneği uygun satın alımları yeniden tanır.' },
      { title: 'Veriler ve sorumluluk', body: 'Profil ve ilerleme kayıtları varsayılan olarak cihazında tutulur. Yapay zekâ, hava durumu veya yemek arama özelliklerini kullandığında Gizlilik Politikası’nda açıklanan bilgiler ilgili hizmet sağlayıcılarına iletilebilir. GainMode’u kendi koşullarına uygun ve güvenli biçimde kullanmak senin sorumluluğundadır. Bu şartlarla ilgili sorular için globestudiosdev@gmail.com adresine yazabilirsin.' },
    ],
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
  if (typeof window !== 'undefined') {
    const requested = new URLSearchParams(window.location.search).get('lang');
    if (requested) return requested === 'tr' ? 'tr' : 'en';
  }
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
