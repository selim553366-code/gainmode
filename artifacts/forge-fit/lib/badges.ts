import type { Language } from '@/lib/i18n';

export type BadgeCategory = 'training' | 'consistency' | 'nutrition' | 'progress';
export type BadgeMetric = 'workouts' | 'minutes' | 'exercises' | 'streak' | 'activeDays' | 'meals' | 'weightLogs' | 'onTargetDays';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';

/** Tiers in order of rarity; harder targets earn rarer metals. */
export const BADGE_TIERS: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum', 'legendary'];

type LocalizedText = Record<Language, string>;

export type BadgeDefinition = {
  id: string;
  category: BadgeCategory;
  metric: BadgeMetric;
  target: number;
  tier: BadgeTier;
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
  all: text('Tümü', 'All', 'Alle', 'Tous', 'Todas'),
  bronze: text('Bronz', 'Bronze', 'Bronze', 'Bronze', 'Bronce'),
  silver: text('Gümüş', 'Silver', 'Silber', 'Argent', 'Plata'),
  gold: text('Altın', 'Gold', 'Gold', 'Or', 'Oro'),
  platinum: text('Platin', 'Platinum', 'Platin', 'Platine', 'Platino'),
  legendary: text('Efsanevi', 'Legendary', 'Legendär', 'Légendaire', 'Legendaria'),
  next: text('SIRADAKİ ROZETİN', 'YOUR NEXT BADGE', 'DEIN NÄCHSTES ABZEICHEN', 'TON PROCHAIN BADGE', 'TU PRÓXIMA INSIGNIA'),
  remaining: text('{count} kaldı', '{count} to go', 'Noch {count}', 'Encore {count}', 'Faltan {count}'),
  wall: text('Rozetlerim', 'My Badges', 'Meine Abzeichen', 'Mes Badges', 'Mis Insignias'),
  wallSubtitle: text('Kazandığın her rozet duvarında asılı.', 'Every badge you earn hangs on your wall.', 'Jedes verdiente Abzeichen hängt an deiner Wand.', 'Chaque badge gagné est accroché à ton mur.', 'Cada insignia que ganas cuelga en tu muro.'),
  wallEmpty: text('İlk rozetini kazan, duvarına asılsın.', 'Earn your first badge to hang it here.', 'Verdiene dein erstes Abzeichen, um es hier aufzuhängen.', 'Gagne ton premier badge pour l’accrocher ici.', 'Gana tu primera insignia para colgarla aquí.'),
  hangIt: text('Duvarıma as', 'Hang it on my wall', 'An meine Wand hängen', 'L’accrocher au mur', 'Colgarla en mi muro'),
  great: text('Harika', 'Awesome', 'Super', 'Génial', 'Genial'),
  earnedOn: text('{date} tarihinde kazanıldı', 'Earned on {date}', 'Verdient am {date}', 'Obtenu le {date}', 'Conseguida el {date}'),
  rarity: text('Nadirlik', 'Rarity', 'Seltenheit', 'Rareté', 'Rareza'),
  progressLabel: text('İlerleme', 'Progress', 'Fortschritt', 'Progression', 'Progreso'),
  close: text('Kapat', 'Close', 'Schließen', 'Fermer', 'Cerrar'),
  completed: text('Tüm rozetleri topladın. Efsanesin.', 'You collected every badge. Legendary.', 'Du hast alle Abzeichen gesammelt. Legendär.', 'Tu as tous les badges. Légendaire.', 'Tienes todas las insignias. Legendario.'),
} as const;

export const badges: BadgeDefinition[] = [
  // Training
  { id: 'first-workout', category: 'training', metric: 'workouts', target: 1, tier: 'bronze', icon: 'footprints', color: '#FF8A34', title: text('İlk Adım', 'First Step', 'Erster Schritt', 'Premier Pas', 'Primer Paso'), description: text('İlk antrenmanını tamamla.', 'Complete your first workout.', 'Schließe dein erstes Training ab.', 'Termine ton premier entraînement.', 'Completa tu primer entrenamiento.') },
  { id: 'workout-10', category: 'training', metric: 'workouts', target: 10, tier: 'bronze', icon: 'dumbbell', color: '#F59E0B', title: text('Ritmi Buldun', 'Found the Rhythm', 'Rhythmus Gefunden', 'Le Rythme Trouvé', 'Ritmo Encontrado'), description: text('10 antrenman tamamla.', 'Complete 10 workouts.', 'Schließe 10 Trainings ab.', 'Termine 10 entraînements.', 'Completa 10 entrenamientos.') },
  { id: 'workout-25', category: 'training', metric: 'workouts', target: 25, tier: 'silver', icon: 'anvil', color: '#E45F39', title: text('Demir İrade', 'Iron Will', 'Eiserner Wille', 'Volonté de Fer', 'Voluntad de Hierro'), description: text('25 antrenman tamamla.', 'Complete 25 workouts.', 'Schließe 25 Trainings ab.', 'Termine 25 entraînements.', 'Completa 25 entrenamientos.') },
  { id: 'workout-100', category: 'training', metric: 'workouts', target: 100, tier: 'gold', icon: 'biceps', color: '#8B5CF6', title: text('Güç Makinesi', 'Power Machine', 'Kraftmaschine', 'Machine de Puissance', 'Máquina de Potencia'), description: text('100 antrenman tamamla.', 'Complete 100 workouts.', 'Schließe 100 Trainings ab.', 'Termine 100 entraînements.', 'Completa 100 entrenamientos.') },
  { id: 'workout-250', category: 'training', metric: 'workouts', target: 250, tier: 'platinum', icon: 'shield', color: '#0EA5E9', title: text('Çelik Beden', 'Body of Steel', 'Körper aus Stahl', 'Corps d’Acier', 'Cuerpo de Acero'), description: text('250 antrenman tamamla.', 'Complete 250 workouts.', 'Schließe 250 Trainings ab.', 'Termine 250 entraînements.', 'Completa 250 entrenamientos.') },
  { id: 'workout-400', category: 'training', metric: 'workouts', target: 400, tier: 'legendary', icon: 'crown', color: '#EAB308', title: text('400 Kulübü', 'The 400 Club', 'Der 400er-Club', 'Le Club des 400', 'El Club de los 400'), description: text('Toplam 400 antrenman tamamla.', 'Complete 400 workouts in total.', 'Schließe insgesamt 400 Trainings ab.', 'Termine 400 entraînements au total.', 'Completa 400 entrenamientos en total.') },
  { id: 'minutes-600', category: 'training', metric: 'minutes', target: 600, tier: 'silver', icon: 'hourglass', color: '#3B82F6', title: text('10 Saatlik Emek', 'Ten Hours In', 'Zehn Stunden Einsatz', 'Dix Heures d’Effort', 'Diez Horas de Esfuerzo'), description: text('Toplam 10 saat antrenman yap.', 'Train for 10 hours in total.', 'Trainiere insgesamt 10 Stunden.', 'Entraîne-toi pendant 10 heures au total.', 'Entrena durante 10 horas en total.') },
  { id: 'minutes-3000', category: 'training', metric: 'minutes', target: 3000, tier: 'gold', icon: 'clock', color: '#06B6D4', title: text('50 Saat Ter', 'Fifty Hours Deep', 'Fünfzig Stunden Schweiß', 'Cinquante Heures de Sueur', 'Cincuenta Horas de Sudor'), description: text('Toplam 50 saat antrenman yap.', 'Train for 50 hours in total.', 'Trainiere insgesamt 50 Stunden.', 'Entraîne-toi pendant 50 heures au total.', 'Entrena durante 50 horas en total.') },
  { id: 'minutes-6000', category: 'training', metric: 'minutes', target: 6000, tier: 'legendary', icon: 'infinity', color: '#EC4899', title: text('100 Saat Efsanesi', 'Hundred-Hour Legend', 'Hundert-Stunden-Legende', 'Légende des Cent Heures', 'Leyenda de las Cien Horas'), description: text('Toplam 100 saat antrenman yap.', 'Train for 100 hours in total.', 'Trainiere insgesamt 100 Stunden.', 'Entraîne-toi pendant 100 heures au total.', 'Entrena durante 100 horas en total.') },
  // Consistency
  { id: 'streak-3', category: 'consistency', metric: 'streak', target: 3, tier: 'bronze', icon: 'flame', color: '#FF6B2C', title: text('Ateşi Yak', 'Light the Fire', 'Entfache das Feuer', 'Allume le Feu', 'Enciende el Fuego'), description: text('3 günlük seri oluştur.', 'Build a 3-day streak.', 'Erreiche eine 3-Tage-Serie.', 'Crée une série de 3 jours.', 'Consigue una racha de 3 días.') },
  { id: 'streak-7', category: 'consistency', metric: 'streak', target: 7, tier: 'silver', icon: 'calendar-check', color: '#EF4444', title: text('Kesintisiz Hafta', 'Unbroken Week', 'Lückenlose Woche', 'Semaine Sans Interruption', 'Semana Imparable'), description: text('7 günlük seri oluştur.', 'Build a 7-day streak.', 'Erreiche eine 7-Tage-Serie.', 'Crée une série de 7 jours.', 'Consigue una racha de 7 días.') },
  { id: 'streak-30', category: 'consistency', metric: 'streak', target: 30, tier: 'gold', icon: 'zap', color: '#7C3AED', title: text('Durdurulamaz', 'Unstoppable', 'Unaufhaltsam', 'Inarrêtable', 'Imparable'), description: text('30 günlük seri oluştur.', 'Build a 30-day streak.', 'Erreiche eine 30-Tage-Serie.', 'Crée une série de 30 jours.', 'Consigue una racha de 30 días.') },
  { id: 'streak-100', category: 'consistency', metric: 'streak', target: 100, tier: 'platinum', icon: 'star', color: '#2563EB', title: text('Yüz Günlük Alev', 'Hundred-Day Flame', 'Hundert-Tage-Flamme', 'Flamme de Cent Jours', 'Llama de Cien Días'), description: text('100 günlük seri oluştur.', 'Build a 100-day streak.', 'Erreiche eine 100-Tage-Serie.', 'Crée une série de 100 jours.', 'Consigue una racha de 100 días.') },
  { id: 'streak-365', category: 'consistency', metric: 'streak', target: 365, tier: 'legendary', icon: 'sun', color: '#DB2777', title: text('Bir Yıl Yanan', 'A Year Ablaze', 'Ein Jahr in Flammen', 'Une Année en Feu', 'Un Año en Llamas'), description: text('365 günlük seri oluştur. Sadece en kararlılar.', 'Build a 365-day streak. Only the most determined.', 'Erreiche eine 365-Tage-Serie. Nur für die Entschlossensten.', 'Crée une série de 365 jours. Réservé aux plus déterminés.', 'Consigue una racha de 365 días. Solo para los más decididos.') },
  { id: 'active-100', category: 'consistency', metric: 'activeDays', target: 100, tier: 'gold', icon: 'mountain', color: '#0F9F8F', title: text('Yüz Gün Güçlü', 'One Hundred Strong', 'Hundert Tage Stark', 'Cent Jours Fort', 'Cien Días Fuerte'), description: text('100 farklı gün aktif ol.', 'Be active on 100 different days.', 'Sei an 100 verschiedenen Tagen aktiv.', 'Sois actif pendant 100 jours différents.', 'Mantente activo durante 100 días distintos.') },
  { id: 'active-365', category: 'consistency', metric: 'activeDays', target: 365, tier: 'legendary', icon: 'mountain-snow', color: '#F97316', title: text('Zirvedeki Yıl', 'Summit Year', 'Gipfeljahr', 'L’Année du Sommet', 'El Año de la Cumbre'), description: text('365 farklı gün aktif ol.', 'Be active on 365 different days.', 'Sei an 365 verschiedenen Tagen aktiv.', 'Sois actif pendant 365 jours différents.', 'Mantente activo durante 365 días distintos.') },
  // Nutrition
  { id: 'meal-1', category: 'nutrition', metric: 'meals', target: 1, tier: 'bronze', icon: 'apple', color: '#22A06B', title: text('İlk Öğün', 'First Meal', 'Erste Mahlzeit', 'Premier Repas', 'Primera Comida'), description: text('İlk öğününü kaydet.', 'Log your first meal.', 'Protokolliere deine erste Mahlzeit.', 'Enregistre ton premier repas.', 'Registra tu primera comida.') },
  { id: 'meal-50', category: 'nutrition', metric: 'meals', target: 50, tier: 'silver', icon: 'salad', color: '#84CC16', title: text('Düzenli Beslenme', 'Nutrition Rhythm', 'Ernährungsrhythmus', 'Rythme Nutritionnel', 'Ritmo Nutricional'), description: text('50 öğün kaydet.', 'Log 50 meals.', 'Protokolliere 50 Mahlzeiten.', 'Enregistre 50 repas.', 'Registra 50 comidas.') },
  { id: 'target-7', category: 'nutrition', metric: 'onTargetDays', target: 7, tier: 'silver', icon: 'circle-check', color: '#10B981', title: text('Hedefte Bir Hafta', 'A Week on Target', 'Eine Woche im Ziel', 'Une Semaine dans la Cible', 'Una Semana en el Objetivo'), description: text('7 gün kalori hedefinin ±%20’sinde kal.', 'Stay within ±20% of your calorie goal on 7 days.', 'Bleibe an 7 Tagen innerhalb von ±20 % deines Kalorienziels.', 'Reste à ±20 % de ton objectif calorique pendant 7 jours.', 'Mantente dentro del ±20 % de tu objetivo calórico durante 7 días.') },
  { id: 'meal-400', category: 'nutrition', metric: 'meals', target: 400, tier: 'gold', icon: 'chef-hat', color: '#15803D', title: text('Beslenme Ustası', 'Nutrition Master', 'Ernährungsmeister', 'Maître de la Nutrition', 'Maestría Nutricional'), description: text('400 öğün kaydet.', 'Log 400 meals.', 'Protokolliere 400 Mahlzeiten.', 'Enregistre 400 repas.', 'Registra 400 comidas.') },
  { id: 'target-30', category: 'nutrition', metric: 'onTargetDays', target: 30, tier: 'platinum', icon: 'crosshair', color: '#14B8A6', title: text('Kalori Keskin Nişancısı', 'Calorie Sharpshooter', 'Kalorien-Scharfschütze', 'Tireur d’Élite Calorique', 'Francotirador de Calorías'), description: text('30 gün kalori hedefinin ±%20’sinde kal.', 'Stay within ±20% of your calorie goal on 30 days.', 'Bleibe an 30 Tagen innerhalb von ±20 % deines Kalorienziels.', 'Reste à ±20 % de ton objectif calorique pendant 30 jours.', 'Mantente dentro del ±20 % de tu objetivo calórico durante 30 días.') },
  { id: 'meal-1000', category: 'nutrition', metric: 'meals', target: 1000, tier: 'legendary', icon: 'trophy', color: '#F43F5E', title: text('Mutfak Efsanesi', 'Kitchen Legend', 'Küchenlegende', 'Légende de la Cuisine', 'Leyenda de la Cocina'), description: text('1000 öğün kaydet.', 'Log 1,000 meals.', 'Protokolliere 1.000 Mahlzeiten.', 'Enregistre 1 000 repas.', 'Registra 1.000 comidas.') },
  // Progress
  { id: 'weight-1', category: 'progress', metric: 'weightLogs', target: 1, tier: 'bronze', icon: 'scale', color: '#3B82F6', title: text('İlk Kontrol', 'First Check-in', 'Erster Check-in', 'Premier Bilan', 'Primer Control'), description: text('İlk kilo kaydını ekle.', 'Add your first weight log.', 'Füge deinen ersten Gewichtseintrag hinzu.', 'Ajoute ta première pesée.', 'Añade tu primer registro de peso.') },
  { id: 'weight-10', category: 'progress', metric: 'weightLogs', target: 10, tier: 'silver', icon: 'activity', color: '#6366F1', title: text('Gelişimi İzle', 'Track the Change', 'Fortschritt Verfolgen', 'Suivre le Changement', 'Sigue el Cambio'), description: text('10 kilo kaydı ekle.', 'Add 10 weight logs.', 'Füge 10 Gewichtseinträge hinzu.', 'Ajoute 10 pesées.', 'Añade 10 registros de peso.') },
  { id: 'weight-52', category: 'progress', metric: 'weightLogs', target: 52, tier: 'gold', icon: 'gem', color: '#0284C7', title: text('Kararlı Takip', 'Steady Tracker', 'Beständiger Tracker', 'Suivi Constant', 'Seguimiento Constante'), description: text('52 kilo kaydı ekle; bir yıl boyunca her hafta bir kez.', 'Add 52 weight logs, one a week for a year.', 'Füge 52 Gewichtseinträge hinzu, ein Jahr lang einen pro Woche.', 'Ajoute 52 pesées, une par semaine pendant un an.', 'Añade 52 registros de peso, uno por semana durante un año.') },
  { id: 'exercise-50', category: 'progress', metric: 'exercises', target: 50, tier: 'silver', icon: 'list-checks', color: '#A855F7', title: text('Set Ustası', 'Set Master', 'Satzmeister', 'Maître des Séries', 'Maestro de Series'), description: text('50 hareket tamamla.', 'Complete 50 exercises.', 'Schließe 50 Übungen ab.', 'Termine 50 exercices.', 'Completa 50 ejercicios.') },
  { id: 'exercise-500', category: 'progress', metric: 'exercises', target: 500, tier: 'platinum', icon: 'orbit', color: '#D946EF', title: text('Hareket Mimarı', 'Movement Architect', 'Bewegungsarchitekt', 'Architecte du Mouvement', 'Arquitecto del Movimiento'), description: text('500 hareket tamamla.', 'Complete 500 exercises.', 'Schließe 500 Übungen ab.', 'Termine 500 exercices.', 'Completa 500 ejercicios.') },
  { id: 'exercise-2000', category: 'progress', metric: 'exercises', target: 2000, tier: 'legendary', icon: 'swords', color: '#9333EA', title: text('Büyük Usta', 'Grand Master', 'Großmeister', 'Grand Maître', 'Gran Maestro'), description: text('2000 hareket tamamla.', 'Complete 2,000 exercises.', 'Schließe 2.000 Übungen ab.', 'Termine 2 000 exercices.', 'Completa 2.000 ejercicios.') },
];

export function badgeText(value: LocalizedText, language: Language) {
  return value[language] ?? value.en;
}
export type BadgeMetrics = Record<BadgeMetric, number>;

/** How far along a badge is, 0–1. */
export function badgeProgress(badge: BadgeDefinition, metrics: BadgeMetrics) {
  return Math.max(0, Math.min(1, (metrics[badge.metric] ?? 0) / badge.target));
}

/** The locked badge that is closest to being earned (ties go to the easier tier). */
export function nextBadge(metrics: BadgeMetrics, unlockedIds: string[]) {
  return badges
    .filter((badge) => !unlockedIds.includes(badge.id))
    .sort((a, b) => badgeProgress(b, metrics) - badgeProgress(a, metrics) || BADGE_TIERS.indexOf(a.tier) - BADGE_TIERS.indexOf(b.tier))[0] ?? null;
}

/** Days whose logged meals add up to within ±20% of the calorie goal. */
export function countOnTargetDays(meals: { calories: number; date?: string }[], calorieGoal: number | null) {
  if (!calorieGoal) return 0;
  const totals = new Map<string, number>();
  meals.forEach((meal) => {
    if (!meal.date) return;
    const parsed = new Date(meal.date);
    const day = /^\d{4}-\d{2}-\d{2}$/.test(meal.date) || Number.isNaN(parsed.getTime())
      ? meal.date.slice(0, 10)
      : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    totals.set(day, (totals.get(day) ?? 0) + (Number.isFinite(meal.calories) ? meal.calories : 0));
  });
  return [...totals.values()].filter((total) => total >= calorieGoal * 0.8 && total <= calorieGoal * 1.2).length;
}
