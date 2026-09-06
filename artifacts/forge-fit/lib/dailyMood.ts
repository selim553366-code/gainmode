import type { Language } from '@/lib/i18n';

export const DAILY_MOOD_NOTIFICATION_HOUR = 19;
export const DAILY_MOOD_NOTIFICATION_MINUTE = 50;

type DailyQuoteParts = {
  subjects: string[];
  actions: string[];
  outcomes: string[];
};

const dailyQuoteParts: Record<Language, DailyQuoteParts> = {
  tr: {
    subjects: [
      'Bugün kendine verdiğin değer',
      'Attığın en küçük adım',
      'Bedenine ayırdığın bu an',
      'İçindeki sakin güç',
      'Kendine gösterdiğin anlayış',
    ],
    actions: [
      'yarının temelini kurar',
      'sandığından daha büyük bir fark yaratır',
      'gücünü sessizce büyütür',
      'yolculuğunu ileri taşır',
      'seni kendi ritmine yaklaştırır',
    ],
    outcomes: [
      'Çünkü gerçek gelişim, kendini dinlemekle başlar.',
      'Bugünün emeği yarının güvenine dönüşür.',
      'Kendine iyi davranmak da güçlü olmanın bir parçasıdır.',
      'İstikrar, mükemmellikten her zaman daha değerlidir.',
      'Her bilinçli seçim seni hedeflerine biraz daha yaklaştırır.',
      'Yavaşlamak bazen daha sağlam ilerlemenin yoludur.',
      'Enerjin değişebilir; yönünü belirleyen yine sensin.',
      'Bugünü olduğu gibi kabul etmek yarına alan açar.',
      'Küçük kazanımlar zamanla büyük dönüşümlere dönüşür.',
      'Bedenini dinlediğinde ilerlemenin doğru temposunu bulursun.',
      'Dinlenmek, vazgeçmek değil yeniden güç toplamaktır.',
      'Kendine ayırdığın her dakika geleceğine yaptığın yatırımdır.',
      'Zor günler de güçlü hikâyelerin bir parçasıdır.',
      'Bugünkü farkındalığın yarınki kararlarını güçlendirir.',
      'Kendi hızında ilerlemek hâlâ ilerlemektir.',
    ],
  },
  en: {
    subjects: [
      'The care you gave yourself today',
      'Even your smallest step',
      'This moment you gave your body',
      'The quiet strength within you',
      'The understanding you showed yourself',
    ],
    actions: [
      'builds the foundation for tomorrow',
      'makes a bigger difference than you think',
      'grows your strength quietly',
      'moves your journey forward',
      'brings you closer to your own rhythm',
    ],
    outcomes: [
      'Real progress begins when you listen to yourself.',
      'Today’s effort becomes tomorrow’s confidence.',
      'Being kind to yourself is part of being strong.',
      'Consistency will always matter more than perfection.',
      'Every mindful choice brings your goals a little closer.',
      'Slowing down can be the way to move forward with strength.',
      'Your energy may change, but you still choose the direction.',
      'Accepting today as it is creates space for tomorrow.',
      'Small wins grow into meaningful change over time.',
      'Listening to your body helps you find the right pace.',
      'Rest is not giving up; it is gathering strength again.',
      'Every minute you give yourself is an investment in your future.',
      'Hard days are part of strong stories too.',
      'Today’s awareness strengthens tomorrow’s decisions.',
      'Moving at your own pace is still moving forward.',
    ],
  },
  de: {
    subjects: [
      'Die Fürsorge, die du dir heute geschenkt hast',
      'Selbst dein kleinster Schritt',
      'Dieser Moment für deinen Körper',
      'Die stille Kraft in dir',
      'Das Verständnis, das du dir entgegengebracht hast',
    ],
    actions: [
      'legt das Fundament für morgen',
      'bewirkt mehr, als du denkst',
      'lässt deine Stärke leise wachsen',
      'bringt deinen Weg voran',
      'führt dich näher zu deinem eigenen Rhythmus',
    ],
    outcomes: [
      'Echter Fortschritt beginnt damit, dir selbst zuzuhören.',
      'Der Einsatz von heute wird zum Selbstvertrauen von morgen.',
      'Freundlich zu dir zu sein gehört zur Stärke dazu.',
      'Beständigkeit ist immer wertvoller als Perfektion.',
      'Jede bewusste Entscheidung bringt deine Ziele etwas näher.',
      'Langsamer zu werden kann der Weg zu stabilem Fortschritt sein.',
      'Deine Energie kann wechseln, doch du bestimmst weiterhin die Richtung.',
      'Den heutigen Tag anzunehmen schafft Raum für morgen.',
      'Kleine Erfolge wachsen mit der Zeit zu echter Veränderung.',
      'Wenn du auf deinen Körper hörst, findest du dein richtiges Tempo.',
      'Ruhe bedeutet nicht aufzugeben, sondern neue Kraft zu sammeln.',
      'Jede Minute für dich ist eine Investition in deine Zukunft.',
      'Auch schwere Tage gehören zu starken Geschichten.',
      'Die Achtsamkeit von heute stärkt deine Entscheidungen von morgen.',
      'In deinem eigenen Tempo voranzugehen ist weiterhin Fortschritt.',
    ],
  },
  fr: {
    subjects: [
      'L’attention que tu t’es accordée aujourd’hui',
      'Même ton plus petit pas',
      'Ce moment offert à ton corps',
      'La force tranquille qui est en toi',
      'La compréhension que tu t’es témoignée',
    ],
    actions: [
      'construit les bases de demain',
      'fait une plus grande différence que tu ne le penses',
      'fait grandir ta force en silence',
      'fait avancer ton parcours',
      'te rapproche de ton propre rythme',
    ],
    outcomes: [
      'Le vrai progrès commence lorsque tu t’écoutes.',
      'L’effort d’aujourd’hui devient la confiance de demain.',
      'Être bienveillant envers toi fait partie de ta force.',
      'La régularité aura toujours plus de valeur que la perfection.',
      'Chaque choix conscient rapproche un peu tes objectifs.',
      'Ralentir peut être la meilleure façon d’avancer solidement.',
      'Ton énergie peut changer, mais tu choisis toujours la direction.',
      'Accepter cette journée telle qu’elle est crée de la place pour demain.',
      'Les petites victoires deviennent de grands changements avec le temps.',
      'Écouter ton corps t’aide à trouver le bon rythme.',
      'Se reposer, ce n’est pas abandonner, mais retrouver de la force.',
      'Chaque minute pour toi est un investissement dans ton avenir.',
      'Les jours difficiles font aussi partie des belles histoires.',
      'La conscience d’aujourd’hui renforce les décisions de demain.',
      'Avancer à ton propre rythme, c’est toujours avancer.',
    ],
  },
  es: {
    subjects: [
      'El cuidado que te diste hoy',
      'Incluso tu paso más pequeño',
      'Este momento que dedicaste a tu cuerpo',
      'La fuerza tranquila que llevas dentro',
      'La comprensión que te mostraste',
    ],
    actions: [
      'construye la base de mañana',
      'marca una diferencia mayor de lo que imaginas',
      'hace crecer tu fuerza en silencio',
      'impulsa tu camino hacia delante',
      'te acerca a tu propio ritmo',
    ],
    outcomes: [
      'El progreso real comienza cuando te escuchas.',
      'El esfuerzo de hoy se convierte en la confianza de mañana.',
      'Tratarte con amabilidad también forma parte de ser fuerte.',
      'La constancia siempre vale más que la perfección.',
      'Cada elección consciente acerca un poco más tus objetivos.',
      'Bajar el ritmo puede ser la forma de avanzar con más firmeza.',
      'Tu energía puede cambiar, pero tú sigues eligiendo la dirección.',
      'Aceptar el día de hoy crea espacio para mañana.',
      'Las pequeñas victorias se convierten en grandes cambios con el tiempo.',
      'Escuchar a tu cuerpo te ayuda a encontrar el ritmo adecuado.',
      'Descansar no es rendirse, sino recuperar fuerzas.',
      'Cada minuto para ti es una inversión en tu futuro.',
      'Los días difíciles también forman parte de las historias fuertes.',
      'La conciencia de hoy fortalece las decisiones de mañana.',
      'Avanzar a tu propio ritmo sigue siendo avanzar.',
    ],
  },
};

export function dailyMoodQuoteIndex(date = new Date()) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const currentDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((currentDay.getTime() - startOfYear.getTime()) / 86_400_000) % 365;
}

export function getDailyMoodQuote(language: Language, date = new Date()) {
  const parts = dailyQuoteParts[language] ?? dailyQuoteParts.en;
  const index = dailyMoodQuoteIndex(date);
  const subjectIndex = index % parts.subjects.length;
  const actionIndex = Math.floor(index / parts.subjects.length) % parts.actions.length;
  const outcomeIndex = Math.floor(index / (parts.subjects.length * parts.actions.length)) % parts.outcomes.length;
  return `${parts.subjects[subjectIndex]} ${parts.actions[actionIndex]}. ${parts.outcomes[outcomeIndex]}`;
}

export function isDailyMoodDue(date = new Date()) {
  return date.getHours() > DAILY_MOOD_NOTIFICATION_HOUR
    || (date.getHours() === DAILY_MOOD_NOTIFICATION_HOUR && date.getMinutes() >= DAILY_MOOD_NOTIFICATION_MINUTE);
}