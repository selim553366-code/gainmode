import type { Language } from '@/lib/i18n';

const dayLabel: Record<Language, string> = {
  tr: 'Gün',
  en: 'Day',
  de: 'Tag',
  fr: 'Jour',
  es: 'Día',
};

const noStreakPrompt: Record<Language, string> = {
  tr: 'Kamp ateşin hazır. Bugün ilk kıvılcımı yak.',
  en: 'Your campfire is ready. Light the first spark today.',
  de: 'Dein Lagerfeuer ist bereit. Entzünde heute den ersten Funken.',
  fr: 'Ton feu de camp est prêt. Allume la première étincelle aujourd’hui.',
  es: 'Tu fogata está lista. Enciende hoy la primera chispa.',
};

const phasePrompts: Record<Language, string[]> = {
  tr: [
    'İlk kıvılcımını koruyorsun.',
    'Ritmin güçlenmeye başladı.',
    'İstikrarın artık görünür.',
    'Küçük adımların büyük bir ateş yakıyor.',
    'Kendine verdiğin sözün arkasındasın.',
    'Bu alışkanlık artık gününün bir parçası.',
    'Gücün, tekrar ettiğin seçimlerde büyüyor.',
    'Ateşin çevrene de ilham veriyor.',
    'Disiplinin motivasyonundan daha güçlü.',
    'Buraya tesadüfen gelmedin.',
    'Bir yılın eşiğindesin; ateşin dimdik yanıyor.',
    '365 güne yaklaşırken kendi standardını yazıyorsun.',
  ],
  en: [
    'You are protecting the first spark.',
    'Your rhythm is getting stronger.',
    'Your consistency is now visible.',
    'Small steps are building a bigger fire.',
    'You are keeping the promise you made to yourself.',
    'This habit is becoming part of your day.',
    'Your strength grows through repeated choices.',
    'Your fire is inspiring the people around you.',
    'Your discipline is stronger than your motivation.',
    'You did not get here by accident.',
    'You are approaching a year, and your fire stands tall.',
    'As you approach 365 days, you are setting your own standard.',
  ],
  de: [
    'Du bewahrst den ersten Funken.',
    'Dein Rhythmus wird stärker.',
    'Deine Beständigkeit ist jetzt sichtbar.',
    'Kleine Schritte entfachen ein größeres Feuer.',
    'Du hältst dein Versprechen an dich selbst.',
    'Diese Gewohnheit wird Teil deines Tages.',
    'Deine Stärke wächst durch wiederholte Entscheidungen.',
    'Dein Feuer inspiriert auch die Menschen um dich herum.',
    'Deine Disziplin ist stärker als deine Motivation.',
    'Du bist nicht zufällig hier angekommen.',
    'Du näherst dich einem Jahr und dein Feuer brennt hell.',
    'Auf dem Weg zu 365 Tagen setzt du deinen eigenen Maßstab.',
  ],
  fr: [
    'Tu protèges la première étincelle.',
    'Ton rythme devient plus fort.',
    'Ta régularité est maintenant visible.',
    'Les petits pas construisent un feu plus grand.',
    'Tu tiens la promesse que tu t’es faite.',
    'Cette habitude devient une partie de ta journée.',
    'Ta force grandit grâce aux choix répétés.',
    'Ton feu inspire aussi les personnes autour de toi.',
    'Ta discipline est plus forte que ta motivation.',
    'Tu n’es pas arrivé ici par hasard.',
    'Tu approches d’une année et ton feu reste puissant.',
    'En approchant des 365 jours, tu écris ton propre standard.',
  ],
  es: [
    'Estás protegiendo la primera chispa.',
    'Tu ritmo se está haciendo más fuerte.',
    'Tu constancia ya se nota.',
    'Los pequeños pasos están creando un fuego mayor.',
    'Estás cumpliendo la promesa que te hiciste.',
    'Este hábito ya forma parte de tu día.',
    'Tu fuerza crece con cada elección repetida.',
    'Tu fuego también inspira a quienes te rodean.',
    'Tu disciplina es más fuerte que tu motivación.',
    'No has llegado hasta aquí por casualidad.',
    'Te acercas a un año y tu fuego sigue ardiendo.',
    'Al acercarte a 365 días, estás creando tu propio estándar.',
  ],
};

const dailyPrompts: Record<Language, string[]> = {
  tr: ['Bugün de kendin için bir seçim yap.', 'Ritmini koru ve bir adım daha at.', 'Ateşine yeni bir odun ekle.', 'Dünkü senden biraz daha güçlü ol.', 'Bugünkü emeğin yarının enerjisi.', 'Kendine ayırdığın bu zamanı sahiplen.', 'Devam et; ivmen seninle büyüyor.'],
  en: ['Make one more choice for yourself today.', 'Protect your rhythm and take one more step.', 'Add another log to your fire.', 'Be a little stronger than yesterday.', 'Today’s effort becomes tomorrow’s energy.', 'Own the time you give to yourself.', 'Keep going; your momentum is growing with you.'],
  de: ['Triff heute noch eine Entscheidung für dich.', 'Bewahre deinen Rhythmus und geh einen Schritt weiter.', 'Lege ein weiteres Holzscheit ins Feuer.', 'Sei ein wenig stärker als gestern.', 'Die Anstrengung von heute wird zur Energie von morgen.', 'Nimm dir diese Zeit für dich.', 'Mach weiter; dein Schwung wächst mit dir.'],
  fr: ['Fais encore un choix pour toi aujourd’hui.', 'Garde ton rythme et avance encore d’un pas.', 'Ajoute une bûche à ton feu.', 'Sois un peu plus fort qu’hier.', 'L’effort d’aujourd’hui devient l’énergie de demain.', 'Accorde de la valeur au temps que tu prends pour toi.', 'Continue, ton élan grandit avec toi.'],
  es: ['Haz hoy una elección más por ti.', 'Mantén tu ritmo y da un paso más.', 'Añade otro tronco a tu fuego.', 'Sé un poco más fuerte que ayer.', 'El esfuerzo de hoy se convierte en la energía de mañana.', 'Valora el tiempo que te dedicas.', 'Sigue; tu impulso crece contigo.'],
};

export const STREAK_PROMPT_COUNT = 365;

export function getStreakPrompt(language: Language, day: number) {
  if (day <= 0) return noStreakPrompt[language];
  const safeDay = Math.min(STREAK_PROMPT_COUNT, Math.floor(day));
  const phaseIndex = Math.min(phasePrompts[language].length - 1, Math.floor((safeDay - 1) / 31));
  const dailyIndex = (safeDay - 1) % dailyPrompts[language].length;
  return `${dayLabel[language]} ${safeDay}: ${phasePrompts[language][phaseIndex]} ${dailyPrompts[language][dailyIndex]}`;
}

export const streakPromptsByLanguage: Record<Language, string[]> = {
  tr: Array.from({ length: STREAK_PROMPT_COUNT }, (_, index) => getStreakPrompt('tr', index + 1)),
  en: Array.from({ length: STREAK_PROMPT_COUNT }, (_, index) => getStreakPrompt('en', index + 1)),
  de: Array.from({ length: STREAK_PROMPT_COUNT }, (_, index) => getStreakPrompt('de', index + 1)),
  fr: Array.from({ length: STREAK_PROMPT_COUNT }, (_, index) => getStreakPrompt('fr', index + 1)),
  es: Array.from({ length: STREAK_PROMPT_COUNT }, (_, index) => getStreakPrompt('es', index + 1)),
};