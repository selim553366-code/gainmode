import { type FormEvent, type ReactNode, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronDown, Dumbbell, Flame, HeartPulse, Languages, Menu, Play, Sparkles, Target, TrendingUp, X, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import wordmark from '@/assets/forge-fit/gainmode-wordmark.png';
import coachTab from '@/assets/forge-fit/coach-tab.jpg';
import coachBackground from '@/assets/forge-fit/coach-background.jpeg';
import aiCoach from '@/assets/forge-fit/forge-fit-feature-aiCoach.jpg';
import liveForm from '@/assets/forge-fit/forge-fit-feature-liveForm.jpg';
import foodPhoto from '@/assets/forge-fit/forge-fit-feature-foodPhoto.jpg';
import workoutPlan from '@/assets/forge-fit/forge-fit-feature-workoutPlan.jpg';
import nutritionTargets from '@/assets/forge-fit/forge-fit-feature-nutritionTargets.jpg';
import weeklyAi from '@/assets/forge-fit/forge-fit-feature-weeklyAi.jpg';
import profileChanges from '@/assets/forge-fit/forge-fit-feature-profileChanges.jpg';
import { useI18n } from '@/lib/i18n';

const translations = {
  en: {
    nav: ['The method', 'Inside GainMode', 'FitBud AI', 'FAQ'],
    navCta: 'Start your rhythm',
    heroKicker: 'Your training, with a smarter rhythm',
    heroTitle: 'Train with intent.\\nGrow with proof.',
    heroBody: 'GainMode turns scattered effort into a clear practice — adaptive workouts, honest nutrition, and an AI coach that learns how you move.',
    heroPrimary: 'See how it works',
    heroSecondary: 'Meet FitBud',
    heroNote: 'Built for the days you show up — and the days you need a nudge.',
    scroll: 'Explore the method',
    signal: 'A calmer way to get stronger',
    signalBody: 'No noisy dashboards. No guesswork disguised as confidence. Just the right next step, informed by your real life.',
    methodKicker: 'The GainMode method',
    methodTitle: 'Consistency is not a personality trait.\\nIt is a system.',
    methodBody: 'Your plan adapts when life happens, so progress never depends on a perfect week.',
    methodItems: [
      ['01', 'Start where you are', 'Set a goal, tell us your context, and get a plan that respects both.'],
      ['02', 'Make every rep count', 'Live form cues keep technique clear when your attention is elsewhere.'],
      ['03', 'Learn from the week', 'See what worked, what changed, and what deserves your energy next.'],
    ],
    insideKicker: 'Inside GainMode',
    insideTitle: 'One intelligent loop for the whole you.',
    insideBody: 'Training, food, recovery, and momentum are not separate tabs in your life. GainMode keeps them in conversation.',
    featureTitles: ['A coach with context', 'Form, without the fuss', 'Nutrition you can actually keep', 'Plans that move with you', 'Targets made practical', 'Your week, made legible', 'A profile that keeps evolving'],
    featureBodies: [
      'FitBud remembers your goals, your patterns, and the small details that make advice feel made for you.',
      'Use your camera for real-time guidance on key movements. Less second-guessing, more control.',
      'Snap a meal and get a useful estimate. Make a better next choice without turning dinner into homework.',
      'Your plan adjusts to your schedule, energy, and equipment — not the other way around.',
      'Clear calorie and macro targets that flex with your training and help you make decisions fast.',
      'A weekly readout connects your sessions, habits, and progress so you know what to repeat.',
      'Tune the experience around your body, preferences, and the version of strong you are building.',
    ],
    howKicker: 'From first tap to next level',
    howTitle: 'Less planning.\\nMore showing up.',
    howBody: 'GainMode turns the invisible work of staying consistent into a simple, satisfying daily ritual.',
    howSteps: ['Tell us what matters', 'Follow your adaptive session', 'Review the signal, then keep going'],
    howStepBodies: ['A few honest answers create a starting point that feels like yours.', 'Your coach meets you in the moment with the right session and a clear cue.', 'Small evidence compounds. See your progress, then make one smart adjustment.'],
    quote: 'I stopped restarting every Monday. GainMode gives me a plan I can actually live with.',
    quoteBy: 'Maya, strength training · 4 months in',
    proofTitle: 'A stronger routine starts with one clear next step.',
    proofBody: 'The app is being shaped with people who care about progress that lasts. Join the early list and we will let you know when GainMode is ready for your rhythm.',
    emailPlaceholder: 'Your email address',
    join: 'Join the early list',
    joined: 'You are on the list.',
    privacy: 'No noise. Only a note when GainMode is ready.',
    footerLine: 'Build a practice you can trust.',
    footerLinks: ['The method', 'Inside GainMode', 'FitBud AI'],
    footerLegal: '© 2025 GainMode. Made for real life.',
    languages: { en: 'English', tr: 'Türkçe', de: 'Deutsch', fr: 'Français', es: 'Español' },
    langLabel: 'Language',
    menu: 'Menu',
    close: 'Close',
    watch: 'Watch the approach',
    faq: 'Questions, answered',
    faqItems: [
      ['Is GainMode a workout library?', 'It is more personal than that. GainMode combines adaptive planning, live form guidance, nutrition context, and weekly insight around your goals.'],
      ['Do I need gym equipment?', 'No. Tell GainMode what you have available and your plan can meet you at home, in a gym, or wherever you train.'],
      ['What does FitBud remember?', 'Your goals, preferences, schedule patterns, and the feedback you give it — so each recommendation gets more useful over time.'],
    ],
  },
  tr: {
    nav: ['Yöntem', 'GainMode’un içi', 'FitBud AI', 'SSS'], navCta: 'Ritmini başlat', heroKicker: 'Daha akıllı bir ritimle antrenman yap', heroTitle: 'Niyetle antrenman yap.\\nKanıtla geliş.', heroBody: 'GainMode dağınık çabayı net bir pratiğe dönüştürür — uyarlanabilir antrenmanlar, gerçekçi beslenme ve nasıl hareket ettiğini öğrenen bir AI koç.', heroPrimary: 'Nasıl çalıştığını gör', heroSecondary: 'FitBud ile tanış', heroNote: 'Geldiğin günler ve küçük bir dürtüye ihtiyaç duyduğun günler için.', scroll: 'Yöntemi keşfet', signal: 'Güçlenmenin daha sakin yolu', signalBody: 'Gürültülü panolar yok. Güven gibi görünen tahminler yok. Sadece gerçek hayatından öğrenen doğru sonraki adım.', methodKicker: 'GainMode yöntemi', methodTitle: 'Tutarlılık bir kişilik özelliği değil.\\nBir sistemdir.', methodBody: 'Planın hayat olduğunda uyum sağlar; ilerleme artık kusursuz haftalara bağlı değildir.', methodItems: [['01', 'Olduğun yerden başla', 'Hedefini ve koşullarını anlat, ikisine de saygı duyan bir plan al.'], ['02', 'Her tekrarı anlamlı kıl', 'Canlı form ipuçları, dikkatin dağıldığında tekniğini net tutar.'], ['03', 'Haftadan öğren', 'Ne işe yaradığını, neyin değiştiğini ve sırada neye enerji vermen gerektiğini gör.']], insideKicker: 'GainMode’un içi', insideTitle: 'Bütün sen için tek akıllı döngü.', insideBody: 'Antrenman, yemek, toparlanma ve motivasyon hayatında ayrı sekmeler değil. GainMode onları konuşur hâle getirir.', featureTitles: ['Bağlamı olan bir koç', 'Zahmetsiz form', 'Sürdürülebilir beslenme', 'Seninle hareket eden planlar', 'Pratik hedefler', 'Anlaşılır haftan', 'Sürekli gelişen profil'], featureBodies: ['FitBud hedeflerini, kalıplarını ve tavsiyeyi sana özel yapan küçük detayları hatırlar.', 'Kameranla temel hareketlerde gerçek zamanlı yönlendirme al. Daha az şüphe, daha çok kontrol.', 'Bir öğünün fotoğrafını çek, işe yarar bir tahmin al. Akşam yemeğini ödeve çevirmeden daha iyi seçim yap.', 'Planın programına, enerjine ve ekipmanına uyum sağlar.', 'Antrenmanına göre esneyen, hızlı karar vermeni sağlayan net kalori ve makro hedefleri.', 'Haftalık özet seanslarını, alışkanlıklarını ve ilerlemeni bağlar.', 'Deneyimi bedenine ve tercihlerinle kurduğun güçlü hâle göre ayarla.'], howKicker: 'İlk dokunuştan sonraki seviyeye', howTitle: 'Daha az planla.\\nDaha çok devam et.', howBody: 'GainMode, tutarlı kalmanın görünmeyen işini basit ve tatmin edici bir günlük ritüele dönüştürür.', howSteps: ['Senin için önemli olanı anlat', 'Uyarlanabilir seansını takip et', 'Sinyali değerlendir ve devam et'], howStepBodies: ['Birkaç dürüst cevap, sana ait hissettiren bir başlangıç oluşturur.'], quote: 'Her pazartesi yeniden başlamayı bıraktım. GainMode gerçekten yaşayabileceğim bir plan veriyor.', quoteBy: 'Maya, kuvvet antrenmanı · 4 ay', proofTitle: 'Daha güçlü bir rutin, net bir sonraki adımla başlar.', proofBody: 'GainMode kalıcı ilerlemeyi önemseyen insanlarla şekilleniyor. Erken listeye katıl, ritmin için hazır olduğunda haber verelim.', emailPlaceholder: 'E-posta adresin', join: 'Erken listeye katıl', joined: 'Listedesisin.', privacy: 'Gürültü yok. Sadece GainMode hazır olduğunda bir not.', footerLine: 'Güvenebileceğin bir pratik kur.', footerLinks: ['Yöntem', 'GainMode’un içi', 'FitBud AI'], footerLegal: '© 2025 GainMode. Gerçek hayat için.', languages: { en: 'English', tr: 'Türkçe', de: 'Deutsch', fr: 'Français', es: 'Español' }, langLabel: 'Dil', menu: 'Menü', close: 'Kapat', watch: 'Yaklaşımı izle', faq: 'Sorular, yanıtlar', faqItems: [['GainMode bir antrenman kütüphanesi mi?', 'Daha kişisel bir şey. GainMode planlama, canlı form, beslenme bağlamı ve haftalık içgörüyü hedeflerin etrafında birleştirir.'], ['Ekipmana ihtiyacım var mı?', 'Hayır. Elindekileri söyle; GainMode evde, salonda veya antrenman yaptığın her yerde sana uyum sağlar.'], ['FitBud neyi hatırlar?', 'Hedeflerini, tercihlerini, programını ve verdiğin geri bildirimi. Böylece öneriler zamanla daha faydalı olur.']],
  },
  de: {
    nav: ['Die Methode', 'GainMode entdecken', 'FitBud AI', 'FAQ'], navCta: 'Rhythmus starten', heroKicker: 'Trainiere in deinem besseren Rhythmus', heroTitle: 'Trainiere mit Absicht.\\nWachse mit Beweisen.', heroBody: 'GainMode macht aus verstreuter Anstrengung eine klare Praxis — adaptive Workouts, ehrliche Ernährung und ein KI-Coach, der lernt, wie du dich bewegst.', heroPrimary: 'So funktioniert es', heroSecondary: 'FitBud kennenlernen', heroNote: 'Für die Tage, an denen du da bist — und die Tage, an denen du einen Schubs brauchst.', scroll: 'Methode entdecken', signal: 'Der ruhigere Weg zu mehr Kraft', signalBody: 'Keine lauten Dashboards. Kein Rätselraten. Nur der richtige nächste Schritt, aus deinem echten Leben gelernt.', methodKicker: 'Die GainMode-Methode', methodTitle: 'Konstanz ist kein Charakterzug.\\nSie ist ein System.', methodBody: 'Dein Plan passt sich an, wenn das Leben passiert — Fortschritt braucht keine perfekte Woche.', methodItems: [['01', 'Beginne, wo du bist', 'Setze ein Ziel, teile deinen Kontext und erhalte einen Plan, der beides respektiert.'], ['02', 'Jede Wiederholung zählt', 'Live-Formhinweise geben dir Klarheit, wenn deine Aufmerksamkeit woanders ist.'], ['03', 'Lerne aus der Woche', 'Sieh, was funktioniert hat und was als Nächstes deine Energie verdient.']], insideKicker: 'GainMode entdecken', insideTitle: 'Ein intelligenter Kreislauf für dich.', insideBody: 'Training, Essen, Erholung und Schwung sind in deinem Leben keine getrennten Tabs. GainMode bringt sie ins Gespräch.', featureTitles: ['Ein Coach mit Kontext', 'Form ohne Umstände', 'Ernährung, die bleibt', 'Pläne, die mitgehen', 'Praktische Ziele', 'Deine Woche verständlich', 'Ein Profil, das sich entwickelt'], featureBodies: ['FitBud kennt deine Ziele, Muster und die Details, die Ratschläge persönlich machen.', 'Nutze deine Kamera für Echtzeit-Hinweise bei wichtigen Bewegungen.', 'Fotografiere eine Mahlzeit und erhalte eine nützliche Schätzung — ohne Hausaufgaben beim Abendessen.', 'Dein Plan passt sich Zeit, Energie und Equipment an.', 'Klare Kalorien- und Makroziele, die mit deinem Training mitgehen.', 'Der Wochenblick verbindet Sessions, Gewohnheiten und Fortschritt.', 'Stimme die Erfahrung auf deinen Körper und deine Vorlieben ab.'], howKicker: 'Vom ersten Tap zum nächsten Level', howTitle: 'Weniger planen.\\nMehr erscheinen.', howBody: 'GainMode macht die unsichtbare Arbeit der Konstanz zu einem einfachen täglichen Ritual.', howSteps: ['Sag, was zählt', 'Folge deiner Session', 'Lies das Signal und geh weiter'], howStepBodies: ['Ein paar ehrliche Antworten schaffen einen Startpunkt, der sich nach dir anfühlt.'], quote: 'Ich habe aufgehört, jeden Montag neu anzufangen. GainMode gibt mir einen Plan, der in mein Leben passt.', quoteBy: 'Maya, Krafttraining · seit 4 Monaten', proofTitle: 'Eine stärkere Routine beginnt mit einem klaren nächsten Schritt.', proofBody: 'GainMode entsteht mit Menschen, denen nachhaltiger Fortschritt wichtig ist. Trag dich ein und wir melden uns, wenn es für deinen Rhythmus bereit ist.', emailPlaceholder: 'Deine E-Mail-Adresse', join: 'Auf die frühe Liste', joined: 'Du bist dabei.', privacy: 'Kein Lärm. Nur eine Nachricht, wenn GainMode bereit ist.', footerLine: 'Baue eine Praxis, der du vertraust.', footerLinks: ['Die Methode', 'GainMode entdecken', 'FitBud AI'], footerLegal: '© 2025 GainMode. Für das echte Leben.', languages: { en: 'English', tr: 'Türkçe', de: 'Deutsch', fr: 'Français', es: 'Español' }, langLabel: 'Sprache', menu: 'Menü', close: 'Schließen', watch: 'Ansatz ansehen', faq: 'Fragen, beantwortet', faqItems: [['Ist GainMode eine Workout-Bibliothek?', 'Es ist persönlicher: adaptive Planung, Formhilfe, Ernährungskontext und Wochen-Insights für deine Ziele.'], ['Brauche ich Equipment?', 'Nein. Dein Plan passt sich dem an, was du zu Hause, im Studio oder unterwegs hast.'], ['Was merkt sich FitBud?', 'Ziele, Vorlieben, Zeitmuster und dein Feedback — damit jede Empfehlung nützlicher wird.']],
  },
  fr: {
    nav: ['La méthode', 'Dans GainMode', 'FitBud AI', 'FAQ'], navCta: 'Commencer mon rythme', heroKicker: 'S’entraîner avec un rythme plus intelligent', heroTitle: 'Entraîne-toi avec intention.\\nProgresse avec des preuves.', heroBody: 'GainMode transforme les efforts dispersés en une pratique claire : séances adaptatives, nutrition réaliste et coach IA qui apprend ta façon de bouger.', heroPrimary: 'Voir comment ça marche', heroSecondary: 'Rencontrer FitBud', heroNote: 'Pour les jours où tu es là — et ceux où tu as besoin d’un petit élan.', scroll: 'Découvrir la méthode', signal: 'La façon plus calme de devenir plus fort', signalBody: 'Pas de tableaux bruyants. Pas de devinettes. Juste la prochaine étape, guidée par ta vraie vie.', methodKicker: 'La méthode GainMode', methodTitle: 'La régularité n’est pas un trait de caractère.\\nC’est un système.', methodBody: 'Ton plan s’adapte quand la vie bouge : le progrès ne dépend plus d’une semaine parfaite.', methodItems: [['01', 'Commence où tu es', 'Fixe un objectif, donne ton contexte et reçois un plan qui respecte les deux.'], ['02', 'Chaque répétition compte', 'Les repères de forme en direct gardent ta technique claire.'], ['03', 'Apprends de ta semaine', 'Vois ce qui a fonctionné et ce qui mérite ton énergie ensuite.']], insideKicker: 'Dans GainMode', insideTitle: 'Une boucle intelligente pour tout ton quotidien.', insideBody: 'Entraînement, alimentation et récupération ne sont pas des onglets séparés. GainMode les relie.', featureTitles: ['Un coach qui connaît le contexte', 'La forme, sans prise de tête', 'Une nutrition qui tient', 'Des plans qui évoluent', 'Des objectifs pratiques', 'Ta semaine en clair', 'Un profil qui évolue'], featureBodies: ['FitBud se souvient de tes objectifs et des détails qui rendent ses conseils personnels.', 'Utilise ta caméra pour des conseils en direct sur les mouvements clés.', 'Photographie ton repas et reçois une estimation utile, sans transformer le dîner en devoir.', 'Ton plan s’adapte à ton agenda, ton énergie et ton équipement.', 'Des objectifs calories et macros clairs qui suivent ton entraînement.', 'Un bilan hebdomadaire relie séances, habitudes et progrès.', 'Personnalise l’expérience autour de ton corps et de tes préférences.'], howKicker: 'Du premier geste au niveau suivant', howTitle: 'Moins planifier.\\nPlus avancer.', howBody: 'GainMode transforme le travail invisible de la régularité en un rituel quotidien simple.', howSteps: ['Dis ce qui compte', 'Suis ta séance adaptative', 'Lis le signal, puis continue'], howStepBodies: ['Quelques réponses honnêtes créent un point de départ qui te ressemble.'], quote: 'J’ai arrêté de recommencer chaque lundi. GainMode me donne un plan qui tient dans ma vie.', quoteBy: 'Maya, musculation · depuis 4 mois', proofTitle: 'Une routine plus forte commence par une prochaine étape claire.', proofBody: 'GainMode se construit avec des personnes qui veulent un progrès durable. Rejoins la liste et nous te préviendrons quand il sera prêt pour ton rythme.', emailPlaceholder: 'Ton adresse e-mail', join: 'Rejoindre la liste', joined: 'Tu es sur la liste.', privacy: 'Pas de bruit. Juste un message quand GainMode sera prêt.', footerLine: 'Construis une pratique en laquelle tu peux croire.', footerLinks: ['La méthode', 'Dans GainMode', 'FitBud AI'], footerLegal: '© 2025 GainMode. Pour la vraie vie.', languages: { en: 'English', tr: 'Türkçe', de: 'Deutsch', fr: 'Français', es: 'Español' }, langLabel: 'Langue', menu: 'Menu', close: 'Fermer', watch: 'Voir l’approche', faq: 'Les questions, simplement', faqItems: [['GainMode est-il une bibliothèque de séances ?', 'C’est plus personnel : planification adaptative, conseils de forme, contexte nutritionnel et bilan hebdomadaire autour de tes objectifs.'], ['Faut-il du matériel ?', 'Non. Dis ce que tu as et le plan s’adapte à la maison, en salle ou ailleurs.'], ['Que retient FitBud ?', 'Tes objectifs, préférences, habitudes de planning et retours — pour rendre chaque conseil plus utile.']],
  },
  es: {
    nav: ['El método', 'Dentro de GainMode', 'FitBud AI', 'FAQ'], navCta: 'Empieza tu ritmo', heroKicker: 'Entrena con un ritmo más inteligente', heroTitle: 'Entrena con intención.\\nCrece con pruebas.', heroBody: 'GainMode convierte el esfuerzo disperso en una práctica clara: entrenamientos adaptativos, nutrición realista y un coach IA que aprende cómo te mueves.', heroPrimary: 'Ver cómo funciona', heroSecondary: 'Conoce a FitBud', heroNote: 'Para los días en que apareces y para los días en que necesitas un pequeño empujón.', scroll: 'Descubre el método', signal: 'La forma más tranquila de hacerte más fuerte', signalBody: 'Sin paneles ruidosos. Sin adivinanzas. Solo el siguiente paso correcto, guiado por tu vida real.', methodKicker: 'El método GainMode', methodTitle: 'La constancia no es un rasgo.\\nEs un sistema.', methodBody: 'Tu plan se adapta cuando la vida cambia, así que el progreso no depende de una semana perfecta.', methodItems: [['01', 'Empieza donde estás', 'Define un objetivo, cuéntanos tu contexto y recibe un plan que respeta ambos.'], ['02', 'Haz que cada repetición cuente', 'Las indicaciones de técnica en directo mantienen el movimiento claro.'], ['03', 'Aprende de la semana', 'Mira qué funcionó y qué merece tu energía después.']], insideKicker: 'Dentro de GainMode', insideTitle: 'Un ciclo inteligente para toda tu vida.', insideBody: 'Entrenamiento, comida y recuperación no son pestañas separadas. GainMode las conecta.', featureTitles: ['Un coach con contexto', 'Técnica sin complicaciones', 'Nutrición que se mantiene', 'Planes que se adaptan', 'Objetivos prácticos', 'Tu semana, clara', 'Un perfil que evoluciona'], featureBodies: ['FitBud recuerda tus objetivos, patrones y los detalles que hacen personal cada consejo.', 'Usa tu cámara para recibir guía en directo en movimientos clave.', 'Fotografía una comida y obtén una estimación útil sin convertir la cena en tarea.', 'Tu plan se adapta a tu horario, energía y equipo.', 'Objetivos claros de calorías y macros que siguen tu entrenamiento.', 'Un resumen semanal conecta sesiones, hábitos y progreso.', 'Ajusta la experiencia a tu cuerpo, preferencias y versión fuerte.'], howKicker: 'Del primer toque al siguiente nivel', howTitle: 'Menos planear.\\nMás aparecer.', howBody: 'GainMode convierte el trabajo invisible de ser constante en un ritual diario sencillo.', howSteps: ['Cuéntanos lo que importa', 'Sigue tu sesión adaptativa', 'Lee la señal y continúa'], howStepBodies: ['Unas respuestas honestas crean un punto de partida que se siente tuyo.'], quote: 'Dejé de empezar de nuevo cada lunes. GainMode me da un plan que cabe en mi vida.', quoteBy: 'Maya, fuerza · 4 meses', proofTitle: 'Una rutina más fuerte empieza con un siguiente paso claro.', proofBody: 'GainMode se está creando con personas que buscan un progreso duradero. Únete a la lista y te avisaremos cuando esté listo para tu ritmo.', emailPlaceholder: 'Tu correo electrónico', join: 'Unirme a la lista', joined: 'Ya estás en la lista.', privacy: 'Sin ruido. Solo un aviso cuando GainMode esté listo.', footerLine: 'Construye una práctica en la que confíes.', footerLinks: ['El método', 'Dentro de GainMode', 'FitBud AI'], footerLegal: '© 2025 GainMode. Para la vida real.', languages: { en: 'English', tr: 'Türkçe', de: 'Deutsch', fr: 'Français', es: 'Español' }, langLabel: 'Idioma', menu: 'Menú', close: 'Cerrar', watch: 'Ver el enfoque', faq: 'Preguntas, respondidas', faqItems: [['¿GainMode es una biblioteca de entrenamientos?', 'Es más personal: planificación adaptativa, técnica en directo, contexto nutricional e información semanal alrededor de tus objetivos.'], ['¿Necesito equipamiento?', 'No. Cuéntanos con qué cuentas y tu plan se adaptará a casa, gimnasio o cualquier lugar.'], ['¿Qué recuerda FitBud?', 'Tus objetivos, preferencias, horarios y comentarios para que cada recomendación sea más útil.']],
  },
} as const;

type Lang = keyof typeof translations;
type Copy = (typeof translations)[Lang];
const featureImages = [aiCoach, liveForm, foodPhoto, workoutPlan, nutritionTargets, weeklyAi, profileChanges];
const featureIconComponents = [Sparkles, HeartPulse, Flame, Dumbbell, Target, TrendingUp, Zap];
const displayCopy = (value: string) => value.replace(/\\n/g, '\n');
const joinErrorCopy: Record<Lang, string> = {
  en: 'We could not save your email right now. Please try again.',
  tr: 'E-postanı şu anda kaydedemedik. Lütfen tekrar dene.',
  de: 'Deine E-Mail konnte gerade nicht gespeichert werden. Bitte versuche es erneut.',
  fr: 'Nous ne pouvons pas enregistrer ton e-mail pour le moment. Réessaie.',
  es: 'No hemos podido guardar tu correo ahora. Inténtalo de nuevo.',
};
const microcopy = {
  en: { form: 'Live form check', squat: 'Squat · 86% aligned', fitbud: 'Ready for one strong set? I am with you.', methodNote: 'Designed around the next useful action', weekly: 'Weekly signal', strength: 'strength trend', rhythm: 'session rhythm', chart: 'A week you can read', faqTitle: ['Clear answers.', 'No fine print.'] },
  tr: { form: 'Canlı form kontrolü', squat: 'Squat · %86 uyumlu', fitbud: 'Bir güçlü set için hazır mısın? Yanındayım.', methodNote: 'Bir sonraki faydalı adıma göre tasarlandı', weekly: 'Haftalık sinyal', strength: 'güç trendi', rhythm: 'seans ritmi', chart: 'Okuyabileceğin bir hafta', faqTitle: ['Net yanıtlar.', 'Gizli koşul yok.'] },
  de: { form: 'Live-Formcheck', squat: 'Kniebeuge · 86 % ausgerichtet', fitbud: 'Bereit für einen starken Satz? Ich bin bei dir.', methodNote: 'Für den nächsten nützlichen Schritt', weekly: 'Wochen-Signal', strength: 'Krafttrend', rhythm: 'Session-Rhythmus', chart: 'Eine lesbare Woche', faqTitle: ['Klare Antworten.', 'Kein Kleingedrucktes.'] },
  fr: { form: 'Contrôle de forme en direct', squat: 'Squat · 86 % aligné', fitbud: 'Prêt pour une série solide ? Je suis avec toi.', methodNote: 'Pensé autour de la prochaine action utile', weekly: 'Signal de la semaine', strength: 'tendance de force', rhythm: 'rythme des séances', chart: 'Une semaine lisible', faqTitle: ['Des réponses claires.', 'Aucune petite ligne.'] },
  es: { form: 'Control de técnica en directo', squat: 'Sentadilla · 86 % alineada', fitbud: '¿Listo para una serie fuerte? Estoy contigo.', methodNote: 'Diseñado alrededor del siguiente paso útil', weekly: 'Señal semanal', strength: 'tendencia de fuerza', rhythm: 'ritmo de sesiones', chart: 'Una semana que puedes leer', faqTitle: ['Respuestas claras.', 'Sin letra pequeña.'] },
} as const;

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-70px' }} transition={{ duration: .7, delay, ease: [.22, .8, .24, 1] }} className={className}>{children}</motion.div>;
}

export default function GainmodePage() {
  const { lang, setLang, t: globalT } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [joinSending, setJoinSending] = useState(false);
  const [joinError, setJoinError] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const t: Copy = translations[lang as keyof typeof translations];
  const micro = microcopy[lang as keyof typeof microcopy];
  const setLanguage = (next: Lang) => { setLang(next as any); setLangOpen(false); setMenuOpen(false); };
  const submitEarlyList = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail || joined || joinSending) return;
    setJoinError(false);
    setJoinSending(true);
    try {
      const response = await fetch('/api/early-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, language: lang }),
      });
      if (!response.ok) throw new Error('early list request failed');
      setJoined(true);
    } catch {
      setJoinError(true);
    } finally {
      setJoinSending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#f1f5f9] text-[#17263c]">
      <header className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 sm:px-6">
        <div className="container-wide flex h-[68px] items-center justify-between rounded-2xl border border-white/70 bg-white/85 px-4 shadow-[0_12px_32px_rgba(24,43,73,.08)] backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-slate-800 transition-colors" aria-label={globalT.backToGlobe}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            <a href="#top" data-testid="link-logo" aria-label={globalT.gainmodeHome}><img src={wordmark} alt="GainMode" className="wordmark" width="142" height="22" /></a>
          </div>
          <nav className="hidden items-center gap-7 lg:flex" aria-label={globalT.navPrimary}>
            {t.nav.map((label, index) => <a key={label} href={['#method', '#inside', '#fitbud', '#faq'][index]} className="nav-link text-[13px] font-semibold text-slate-600 hover:text-slate-950" data-testid={`link-nav-${index}`}>{label}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button type="button" className="flex h-10 items-center gap-2 rounded-full px-3 text-xs font-bold text-slate-600 hover:bg-slate-100" onClick={() => setLangOpen(!langOpen)} data-testid="button-language" aria-label={t.langLabel}><Languages size={16} /><span>{lang.toUpperCase()}</span><ChevronDown size={14} /></button>
              {langOpen && <div className="absolute right-0 top-12 z-20 w-36 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl" data-testid="menu-languages">{(Object.keys(t.languages) as Lang[]).map((key) => <button key={key} type="button" className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold ${key === lang ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'}`} onClick={() => setLanguage(key)} data-testid={`button-language-${key}`}>{t.languages[key]}{key === lang && <Check size={14} />}</button>)}</div>}
            </div>
            <a href="#join" className="hidden rounded-full bg-[#17263c] px-4 py-2.5 text-xs font-bold text-white transition-transform hover:-translate-y-0.5 sm:block" data-testid="link-header-cta">{t.navCta}</a>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 lg:hidden" onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu" aria-label={menuOpen ? t.close : t.menu}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
          {menuOpen && <nav className="absolute left-3 right-3 top-[76px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl lg:hidden" aria-label={globalT.navMobile}>{t.nav.map((label, index) => <a key={label} href={['#method', '#inside', '#fitbud', '#faq'][index]} onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-sky-50" data-testid={`link-mobile-nav-${index}`}>{label}</a>)}<a href="#join" onClick={() => setMenuOpen(false)} className="mt-2 block rounded-xl bg-[#17263c] px-3 py-3 text-center text-sm font-bold text-white" data-testid="link-mobile-cta">{t.navCta}</a></nav>}
        </div>
      </header>

      <main id="top">
        <section className="relative min-h-[780px] overflow-hidden bg-[#d9effb] pt-32 sm:min-h-[850px] sm:pt-40">
          <div className="absolute inset-0 bg-cover bg-[center_top] opacity-80" style={{ backgroundImage: `url(${coachBackground})` }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_22%,rgba(255,255,255,.72),transparent_35%),linear-gradient(100deg,#d9effb_14%,rgba(217,239,251,.82)_45%,rgba(217,239,251,.1)_100%)]" />
          <div className="container-wide relative grid items-center gap-10 lg:grid-cols-[1fr_.86fr]">
            <div className="max-w-[630px]">
              <div className="reveal eyebrow mb-6 text-sky-700">{t.heroKicker}</div>
              <h1 className="reveal delay-1 display whitespace-pre-line text-[clamp(3.4rem,8vw,7.7rem)] font-extrabold leading-[.89] text-[#17263c]">{displayCopy(t.heroTitle)}</h1>
              <p className="reveal delay-2 mt-7 max-w-[510px] text-base leading-7 text-slate-600 sm:text-lg">{t.heroBody}</p>
              <div className="reveal delay-3 mt-8 flex flex-wrap items-center gap-3">
                <a href="#inside" className="group flex items-center gap-3 rounded-full bg-[#17263c] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition-transform hover:-translate-y-1" data-testid="link-hero-primary">{t.heroPrimary}<ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></a>
                <a href="#fitbud" className="flex items-center gap-2 rounded-full border border-slate-300 bg-white/65 px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-white" data-testid="link-hero-secondary"><Play size={15} fill="currentColor" />{t.heroSecondary}</a>
              </div>
              <div className="mt-11 flex items-center gap-3 text-xs font-semibold text-slate-500"><div className="flex -space-x-2">{['M', 'A', 'L'].map((letter) => <span key={letter} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#d9effb] bg-slate-800 text-[10px] text-white">{letter}</span>)}</div><span>{t.heroNote}</span></div>
            </div>
            <div className="relative hidden min-h-[525px] lg:block">
              <div className="float absolute right-0 top-4 h-[520px] w-[390px] overflow-hidden rounded-[42px] border-[10px] border-[#19283e] bg-slate-900 phone-shadow"><img src={coachTab} alt="FitBud coach visual" className="h-full w-full object-cover" width="1024" height="683" /><div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/25 bg-[#13243c]/80 p-4 text-white backdrop-blur"><div className="flex items-center gap-2 text-xs font-bold"><Sparkles size={14} className="text-cyan-300" /> FitBud AI</div><p className="mt-2 text-sm leading-5">“{micro.fitbud}”</p></div></div>
              <div className="absolute -left-4 top-24 rounded-2xl border border-white/80 bg-white/85 p-4 shadow-xl backdrop-blur"><div className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className="h-2 w-2 rounded-full bg-emerald-400" /> {micro.form}</div><div className="mt-3 h-1.5 w-28 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-4/5 rounded-full bg-cyan-500" /></div><div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{micro.squat}</div></div>
              <div className="absolute -bottom-2 -left-8 rounded-2xl bg-[#17263c] p-4 text-white shadow-xl"><div className="flex items-end gap-1.5"><div className="h-7 w-2 rounded-t bg-cyan-300" /><div className="h-10 w-2 rounded-t bg-cyan-300" /><div className="h-5 w-2 rounded-t bg-purple-300" /><div className="h-14 w-2 rounded-t bg-cyan-300" /><div className="h-11 w-2 rounded-t bg-purple-300" /></div><div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">{globalT.yourRhythm}</div></div>
            </div>
          </div>
          <a href="#method" className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500" data-testid="link-scroll-method">{t.scroll}<ArrowDownRight size={17} /></a>
        </section>

        <section className="border-y border-slate-200 bg-[#f6f9fc] py-8">
          <div className="container-wide flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center sm:justify-between"><span className="eyebrow text-slate-400">{t.signal}</span><div className="marquee-line hidden h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent sm:block" /><span className="flex items-center gap-2 text-sm font-bold text-slate-600"><Zap size={15} className="text-cyan-500" /> {t.signalBody}</span></div>
        </section>

        <section id="method" className="soft-grid bg-[#f1f5f9] py-24 sm:py-32">
          <div className="container-wide grid gap-14 lg:grid-cols-[.82fr_1.18fr] lg:gap-24">
            <Reveal><span className="eyebrow text-cyan-700">{t.methodKicker}</span><h2 className="display mt-5 whitespace-pre-line text-4xl font-extrabold leading-[.98] text-[#17263c] sm:text-6xl">{displayCopy(t.methodTitle)}</h2><p className="mt-7 max-w-md text-base leading-7 text-slate-600">{t.methodBody}</p><div className="mt-10 flex items-center gap-3 text-sm font-bold text-slate-700"><div className="h-10 w-10 rounded-full bg-cyan-100 p-2.5 text-cyan-700"><Target size={20} /></div>{micro.methodNote}</div></Reveal>
            <div className="space-y-4">{t.methodItems.map(([number, title, body], index) => <Reveal key={number} delay={index * .1}><article className="group grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(24,43,73,.04)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(24,43,73,.1)] sm:grid-cols-[60px_1fr_auto] sm:items-center sm:p-8"><span className="font-mono text-sm font-bold text-cyan-600">{number}</span><div><h3 className="display text-2xl font-bold text-[#17263c]">{title}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">{body}</p></div><ArrowUpRightIcon /></article></Reveal>)}</div>
          </div>
        </section>

        <section id="inside" className="bg-[#17263c] py-24 text-white sm:py-32">
          <div className="container-wide">
            <Reveal><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><span className="eyebrow text-cyan-300">{t.insideKicker}</span><h2 className="display mt-5 max-w-3xl text-5xl font-extrabold leading-[.95] sm:text-7xl">{t.insideTitle}</h2></div><p className="max-w-sm text-sm leading-6 text-slate-300">{t.insideBody}</p></div></Reveal>
            <div id="fitbud" className="mt-16 grid gap-4 md:grid-cols-12">
              {featureImages.map((image, index) => {
                const FeatureIcon = featureIconComponents[index] ?? Dumbbell;
                return <Reveal key={image} delay={(index % 3) * .08} className={`${index === 0 ? 'md:col-span-7' : index === 1 ? 'md:col-span-5' : index === 2 ? 'md:col-span-5' : index === 3 ? 'md:col-span-7' : index === 4 ? 'md:col-span-4' : index === 5 ? 'md:col-span-4' : 'md:col-span-4'}`}><article className={`feature-card group relative overflow-hidden rounded-[28px] ${index < 4 ? 'min-h-[350px]' : 'min-h-[300px]'} bg-slate-800`} data-testid={`card-feature-${index}`}><img src={image} alt={t.featureTitles[index]} loading="lazy" width="768" height="432" className="feature-image absolute inset-0 h-full w-full object-cover opacity-75" /><div className="absolute inset-0 bg-gradient-to-t from-[#101d30] via-[#101d30]/35 to-transparent" /><div className="relative flex h-full min-h-[inherit] flex-col justify-end p-6 sm:p-8"><div className="mb-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-cyan-200"><FeatureIcon size={17} /></div><p className="eyebrow text-cyan-200">0{index + 1}</p><h3 className="display mt-2 max-w-[330px] text-2xl font-bold leading-tight text-white">{t.featureTitles[index]}</h3><p className="mt-2 max-w-[390px] text-sm leading-5 text-slate-200">{t.featureBodies[index]}</p></div></article></Reveal>;
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#e8f6fb] py-24 sm:py-32">
          <div className="container-wide grid items-center gap-14 lg:grid-cols-[1fr_.9fr]">
            <Reveal><span className="eyebrow text-cyan-700">{t.howKicker}</span><h2 className="display mt-5 whitespace-pre-line text-5xl font-extrabold leading-[.94] text-[#17263c] sm:text-7xl">{displayCopy(t.howTitle)}</h2><p className="mt-7 max-w-md text-base leading-7 text-slate-600">{t.howBody}</p><a href="#join" className="group mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#17263c]" data-testid="link-how-cta">{t.navCta}<ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></a></Reveal>
            <div className="space-y-3">{t.howSteps.map((step, index) => <Reveal key={step} delay={index * .1}><div className="flex gap-5 rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#17263c] font-mono text-xs font-bold text-cyan-200">0{index + 1}</span><div><h3 className="font-bold text-[#17263c]">{step}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{t.howStepBodies[index] ?? t.howStepBodies[0]}</p></div></div></Reveal>)}</div>
          </div>
        </section>

        <section className="bg-[#17263c] py-24 sm:py-32"><div className="container-wide grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><Reveal><div className="flex items-center gap-2 text-cyan-300"><TrendingUp size={20} /><span className="eyebrow">{micro.weekly}</span></div><div className="mt-6 grid max-w-md grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-5"><div className="font-mono text-3xl font-bold text-white">+18<span className="text-cyan-300">%</span></div><div className="mt-1 text-xs text-slate-400">{micro.strength}</div></div><div className="rounded-2xl bg-white/10 p-5"><div className="font-mono text-3xl font-bold text-white">4.6<span className="text-cyan-300">/5</span></div><div className="mt-1 text-xs text-slate-400">{micro.rhythm}</div></div><div className="col-span-2 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-purple-400/20 p-5"><div className="flex items-end gap-2"><div className="h-8 flex-1 rounded-t bg-cyan-300/60" /><div className="h-12 flex-1 rounded-t bg-cyan-300/70" /><div className="h-10 flex-1 rounded-t bg-purple-300/70" /><div className="h-16 flex-1 rounded-t bg-cyan-300" /><div className="h-20 flex-1 rounded-t bg-purple-300" /><div className="h-24 flex-1 rounded-t bg-cyan-300" /></div><div className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-300">{micro.chart}</div></div></div></Reveal><Reveal delay={.15}><blockquote className="relative"><span className="absolute -left-5 -top-12 text-8xl font-serif text-cyan-300/30">“</span><p className="display relative text-4xl font-bold leading-[1.02] text-white sm:text-6xl">{t.quote}</p><footer className="mt-8 flex items-center gap-3 text-sm font-semibold text-slate-400"><span className="h-px w-8 bg-cyan-300" />{t.quoteBy}</footer></blockquote></Reveal></div></section>

        <section id="faq" className="bg-[#f1f5f9] py-24 sm:py-32"><div className="container-wide grid gap-12 lg:grid-cols-[.7fr_1.3fr]"><Reveal><span className="eyebrow text-cyan-700">{t.faq}</span><h2 className="display mt-5 text-5xl font-extrabold leading-[.95] text-[#17263c]">{micro.faqTitle[0]}<br />{micro.faqTitle[1]}</h2></Reveal><div>{t.faqItems.map(([question, answer], index) => <Reveal key={question} delay={index * .08}><div className="border-b border-slate-300"><button type="button" className="flex w-full items-center justify-between gap-5 py-6 text-left font-bold text-[#17263c]" onClick={() => setFaqOpen(faqOpen === index ? null : index)} data-testid={`button-faq-${index}`}><span>{question}</span><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white transition-transform ${faqOpen === index ? 'rotate-45' : ''}`}><span className="text-xl font-normal">+</span></span></button>{faqOpen === index && <p className="max-w-2xl pb-6 text-sm leading-6 text-slate-500">{answer}</p>}</div></Reveal>)}</div></div></section>

         <section id="join" className="relative overflow-hidden bg-[#cdeff7] py-24 sm:py-32"><div className="absolute -right-24 -top-40 h-[420px] w-[420px] rounded-full border-[70px] border-white/40" /><div className="container-wide relative grid items-end gap-10 lg:grid-cols-[1fr_.8fr]"><Reveal><span className="eyebrow text-cyan-800">GainMode / 01</span><h2 className="display mt-5 max-w-3xl text-5xl font-extrabold leading-[.94] text-[#17263c] sm:text-7xl">{t.proofTitle}</h2><p className="mt-6 max-w-xl text-base leading-7 text-slate-600">{t.proofBody}</p></Reveal><Reveal delay={.1}><form className="rounded-3xl border border-white/80 bg-white/70 p-3 shadow-xl backdrop-blur" onSubmit={submitEarlyList}><div className="flex flex-col gap-2 sm:flex-row"><input type="email" required value={email} onChange={(event) => { setEmail(event.target.value); setJoinError(false); }} placeholder={t.emailPlaceholder} className="min-h-[52px] flex-1 rounded-2xl bg-transparent px-4 text-sm font-semibold outline-none placeholder:text-slate-400" data-testid="input-email" /><button type="submit" disabled={joinSending || joined} aria-busy={joinSending} className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#17263c] px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70" data-testid="button-join">{joined ? <><Check size={17} />{t.joined}</> : <>{t.join}<ArrowRight size={17} /></>}</button></div><p className={`px-4 pb-1 pt-3 text-xs ${joinError ? 'text-red-600' : 'text-slate-500'}`} data-testid={joinError ? 'status-join-error' : 'text-join-privacy'}>{joinError ? joinErrorCopy[lang] : t.privacy}</p></form></Reveal></div></section>
      </main>
      <footer className="bg-[#17263c] py-10 text-white"><div className="container-wide flex flex-col justify-between gap-8 sm:flex-row sm:items-end"><div><a href="#top" data-testid="link-footer-logo"><img src={wordmark} alt="GainMode" className="wordmark wordmark-footer" width="142" height="22" /></a><p className="mt-5 text-sm font-semibold text-slate-300">{t.footerLine}</p></div><div className="flex flex-col gap-5 text-sm sm:items-end"><nav className="flex flex-wrap gap-5">{t.footerLinks.map((label, index) => <a key={label} href={['#method', '#inside', '#fitbud'][index]} className="text-slate-300 hover:text-cyan-300" data-testid={`link-footer-${index}`}>{label}</a>)}</nav><p className="text-xs text-slate-500">{t.footerLegal}</p></div></div></footer>
    </div>
  );
}

function ArrowUpRightIcon() { return <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all group-hover:bg-cyan-100 group-hover:text-cyan-700"><ArrowUpRight size={18} /></span>; }
