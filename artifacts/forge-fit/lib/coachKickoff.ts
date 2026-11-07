import type { Language } from './i18n';

/** Stored when a purchase finishes; the coach reads it once and posts the kickoff message. */
export const COACH_KICKOFF_KEY = 'gainmode-coach-kickoff-pending';

export type KickoffWorkout = { name: string; minutes: number; exercises: number } | null;

const copy: Record<Language, { ready: string; train: (w: NonNullable<KickoffWorkout>) => string; rest: string }> = {
  tr: { ready: 'planın hazır!', train: (w) => `Bugün ${w.name} günün: ${w.minutes} dakika, ${w.exercises} hareket. İlk adımı birlikte atalım.`, rest: 'Bugün dinlenme günün. İlk öğününü tarayarak başlayabilirsin.' },
  en: { ready: 'your plan is ready!', train: (w) => `Today is ${w.name}: ${w.minutes} min, ${w.exercises} exercises. Let’s take the first step together.`, rest: 'Today is a rest day, so start by scanning your first meal.' },
  de: { ready: 'dein Plan ist fertig!', train: (w) => `Heute ist ${w.name} dran: ${w.minutes} Min., ${w.exercises} Übungen. Lass uns den ersten Schritt gemeinsam machen.`, rest: 'Heute ist Ruhetag. Fang damit an, deine erste Mahlzeit zu scannen.' },
  fr: { ready: 'ton plan est prêt !', train: (w) => `Aujourd’hui c’est ${w.name} : ${w.minutes} min, ${w.exercises} exercices. Faisons le premier pas ensemble.`, rest: 'Aujourd’hui c’est repos. Commence par scanner ton premier repas.' },
  es: { ready: '¡tu plan está listo!', train: (w) => `Hoy toca ${w.name}: ${w.minutes} min, ${w.exercises} ejercicios. Demos juntos el primer paso.`, rest: 'Hoy es día de descanso. Empieza escaneando tu primera comida.' },
};

const capitalize = (text: string, language: Language) => text.charAt(0).toLocaleUpperCase(language) + text.slice(1);

/** FitBud's first message after a purchase: the name, then today's workout or a rest-day nudge. */
export function coachKickoffText(language: Language, name: string | null | undefined, workout: KickoffWorkout) {
  const c = copy[language] ?? copy.en;
  const trimmed = name?.trim();
  const opener = trimmed ? `${trimmed}, ${c.ready}` : capitalize(c.ready, language);
  return `${opener} ${workout ? c.train(workout) : c.rest}`;
}
