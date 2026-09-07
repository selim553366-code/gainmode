import type { Language } from '@/lib/i18n';

export type BadgeCategory = 'training' | 'consistency' | 'nutrition' | 'progress';
export type BadgeMetric = 'workouts' | 'minutes' | 'exercises' | 'streak' | 'activeDays' | 'meals' | 'weightLogs';

type LocalizedText = Record<Language, string>;

export type BadgeDefinition = {
  id: string;
  category: BadgeCategory;
  metric: BadgeMetric;
  target: number;
  icon: string;
  color: string;
  title: LocalizedText;
  description: LocalizedText;
};

const text = (tr: string, en: string, de: string, fr: string, es: string): LocalizedText => ({ tr, en, de, fr, es });

export const badgeUi = {
  title: text('Rozetler', 'Badges', 'Abzeichen', 'Badges', 'Insignias'),
  eyebrow: text('KAZANIM KOLEKSİYONU', 'ACHIEVEMENT COLLECTION', 'ERFOLGSSAMMLUNG', 'COLLECTION DE SUCCÈS', 'COLECCIÓN DE LOGROS'),
  subtitle: text('İlerle, rozetleri aç ve koleksiyonunu büyüt.', 'Make progress, unlock badges, and grow your collection.', 'Mach Fortschritte, schalte Abzeichen frei und erweitere deine Sammlung.', 'Progresse, débloque des badges et agrandis ta collection.', 'Progresa, desbloquea insignias y amplía tu colección.'),
  earned: text('Kazanıldı', 'Earned', 'Verdient', 'Obtenu', 'Conseguida'),
  unlocked: text('Yeni rozet kazandın!', 'You unlocked a new badge!', 'Du hast ein neues Abzeichen!', 'Tu as débloqué un nouveau badge !', '¡Has desbloqueado una nueva insignia!'),
  locked: text('Kilitli', 'Locked', 'Gesperrt', 'Verrouillé', 'Bloqueada'),
  collection: text('Koleksiyon', 'Collection', 'Sammlung', 'Collection', 'Colección'),
  training: text('Antrenman', 'Training', 'Training', 'Entraînement', 'Entrenamiento'),
  consistency: text('İstikrar', 'Consistency', 'Konstanz', 'Régularité', 'Constancia'),
  nutrition: text('Beslenme', 'Nutrition', 'Ernährung', 'Nutrition', 'Nutrición'),
  progress: text('Gelişim', 'Progress', 'Fortschritt', 'Progression', 'Progreso'),
} as const;

export const badges: BadgeDefinition[] = [
  { id: 'first-workout', category: 'training', metric: 'workouts', target: 1, icon: 'badge-spark', color: '#FF8A34', title: text('İlk Kıvılcım', 'First Spark', 'Erster Funke', 'Première Étincelle', 'Primera Chispa'), description: text('İlk antrenmanını tamamla.', 'Complete your first workout.', 'Schließe dein erstes Training ab.', 'Termine ton premier entraînement.', 'Completa tu primer entrenamiento.') },
  { id: 'workout-25', category: 'training', metric: 'workouts', target: 25, icon: 'badge-iron', color: '#E45F39', title: text('Demir İrade', 'Iron Will', 'Eiserner Wille', 'Volonté de Fer', 'Voluntad de Hierro'), description: text('25 antrenman tamamla.', 'Complete 25 workouts.', 'Schließe 25 Trainings ab.', 'Termine 25 entraînements.', 'Completa 25 entrenamientos.') },
  { id: 'workout-100', category: 'training', metric: 'workouts', target: 100, icon: 'badge-power', color: '#8B5CF6', title: text('Güç Makinesi', 'Power Machine', 'Kraftmaschine', 'Machine de Puissance', 'Máquina de Potencia'), description: text('100 antrenman tamamla.', 'Complete 100 workouts.', 'Schließe 100 Trainings ab.', 'Termine 100 entraînements.', 'Completa 100 entrenamientos.') },
  { id: 'workout-400', category: 'training', metric: 'workouts', target: 400, icon: 'badge-club', color: '#D49A20', title: text('400 Kulübü', 'The 400 Club', 'Der 400er-Club', 'Le Club des 400', 'El Club de los 400'), description: text('Toplam 400 antrenman tamamla.', 'Complete 400 workouts in total.', 'Schließe insgesamt 400 Trainings ab.', 'Termine 400 entraînements au total.', 'Completa 400 entrenamientos en total.') },
  { id: 'minutes-600', category: 'training', metric: 'minutes', target: 600, icon: 'badge-hours', color: '#3279D8', title: text('10 Saatlik Emek', 'Ten Hours In', 'Zehn Stunden Einsatz', 'Dix Heures d’Effort', 'Diez Horas de Esfuerzo'), description: text('Toplam 10 saat antrenman yap.', 'Train for 10 hours in total.', 'Trainiere insgesamt 10 Stunden.', 'Entraîne-toi pendant 10 heures au total.', 'Entrena durante 10 horas en total.') },
  { id: 'streak-3', category: 'consistency', metric: 'streak', target: 3, icon: 'badge-fire', color: '#FF6B2C', title: text('Ateşi Yak', 'Light the Fire', 'Entfache das Feuer', 'Allume le Feu', 'Enciende el Fuego'), description: text('3 günlük seri oluştur.', 'Build a 3-day streak.', 'Erreiche eine 3-Tage-Serie.', 'Crée une série de 3 jours.', 'Consigue una racha de 3 días.') },
  { id: 'streak-7', category: 'consistency', metric: 'streak', target: 7, icon: 'badge-week', color: '#EF4444', title: text('Kesintisiz Hafta', 'Unbroken Week', 'Lückenlose Woche', 'Semaine Sans Interruption', 'Semana Imparable'), description: text('7 günlük seri oluştur.', 'Build a 7-day streak.', 'Erreiche eine 7-Tage-Serie.', 'Crée une série de 7 jours.', 'Consigue una racha de 7 días.') },
  { id: 'streak-30', category: 'consistency', metric: 'streak', target: 30, icon: 'badge-unstoppable', color: '#7C3AED', title: text('Durdurulamaz', 'Unstoppable', 'Unaufhaltsam', 'Inarrêtable', 'Imparable'), description: text('30 günlük seri oluştur.', 'Build a 30-day streak.', 'Erreiche eine 30-Tage-Serie.', 'Crée une série de 30 jours.', 'Consigue una racha de 30 días.') },
  { id: 'active-100', category: 'consistency', metric: 'activeDays', target: 100, icon: 'badge-calendar', color: '#0F9F8F', title: text('Yüz Gün Güçlü', 'One Hundred Strong', 'Hundert Tage Stark', 'Cent Jours Fort', 'Cien Días Fuerte'), description: text('100 farklı gün aktif ol.', 'Be active on 100 different days.', 'Sei an 100 verschiedenen Tagen aktiv.', 'Sois actif pendant 100 jours différents.', 'Mantente activo durante 100 días distintos.') },
  { id: 'meal-1', category: 'nutrition', metric: 'meals', target: 1, icon: 'badge-meal', color: '#22A06B', title: text('İlk Öğün', 'First Meal', 'Erste Mahlzeit', 'Premier Repas', 'Primera Comida'), description: text('İlk öğününü kaydet.', 'Log your first meal.', 'Protokolliere deine erste Mahlzeit.', 'Enregistre ton premier repas.', 'Registra tu primera comida.') },
  { id: 'meal-50', category: 'nutrition', metric: 'meals', target: 50, icon: 'badge-rhythm', color: '#16A34A', title: text('Düzenli Beslenme', 'Nutrition Rhythm', 'Ernährungsrhythmus', 'Rythme Nutritionnel', 'Ritmo Nutricional'), description: text('50 öğün kaydet.', 'Log 50 meals.', 'Protokolliere 50 Mahlzeiten.', 'Enregistre 50 repas.', 'Registra 50 comidas.') },
  { id: 'meal-400', category: 'nutrition', metric: 'meals', target: 400, icon: 'badge-master', color: '#15803D', title: text('Beslenme Ustası', 'Nutrition Master', 'Ernährungsmeister', 'Maître de la Nutrition', 'Maestría Nutricional'), description: text('400 öğün kaydet.', 'Log 400 meals.', 'Protokolliere 400 Mahlzeiten.', 'Enregistre 400 repas.', 'Registra 400 comidas.') },
  { id: 'weight-1', category: 'progress', metric: 'weightLogs', target: 1, icon: 'badge-checkin', color: '#3B82F6', title: text('İlk Kontrol', 'First Check-in', 'Erster Check-in', 'Premier Bilan', 'Primer Control'), description: text('İlk kilo kaydını ekle.', 'Add your first weight log.', 'Füge deinen ersten Gewichtseintrag hinzu.', 'Ajoute ta première pesée.', 'Añade tu primer registro de peso.') },
  { id: 'weight-10', category: 'progress', metric: 'weightLogs', target: 10, icon: 'badge-change', color: '#2563EB', title: text('Gelişimi İzle', 'Track the Change', 'Fortschritt Verfolgen', 'Suivre le Changement', 'Sigue el Cambio'), description: text('10 kilo kaydı ekle.', 'Add 10 weight logs.', 'Füge 10 Gewichtseinträge hinzu.', 'Ajoute 10 pesées.', 'Añade 10 registros de peso.') },
  { id: 'exercise-50', category: 'progress', metric: 'exercises', target: 50, icon: 'badge-sets', color: '#A855F7', title: text('Set Ustası', 'Set Master', 'Satzmeister', 'Maître des Séries', 'Maestro de Series'), description: text('50 hareket tamamla.', 'Complete 50 exercises.', 'Schließe 50 Übungen ab.', 'Termine 50 exercices.', 'Completa 50 ejercicios.') },
];

export function badgeText(value: LocalizedText, language: Language) {
  return value[language] ?? value.en;
}