type BaselineProfile = {
  goal: string;
  experience?: string;
  equipment: string;
  equipmentDetails?: string;
  gymLevel?: string;
  trainingDays?: number;
  sessionDuration?: number;
  preferredDays?: string[];
};

type BaselineWorkout = {
  day: string;
  name: string;
  duration: number;
  completed: boolean;
};

type BaselineInput = {
  message: string;
  conversation?: { role: 'coach' | 'user'; content: string }[];
  username: string | null;
  profile: BaselineProfile | null;
  workouts: BaselineWorkout[];
};

export function getCoachIntent(message: string) {
  const normalized = message.trim().toLocaleLowerCase();
  if (/^(merhaba|selam|selamlar|hey|hello|hi|hallo|guten tag|bonjour|salut|hola|buenas)(?:\s|[!,.?]|$)/i.test(normalized)) return 'greeting';
  if (/ekle|çıkar|sil|değiştir|güncelle|taşı|kaldır|add|remove|delete|change|update|move|ersetze|lösche|ajoute|supprime|modifie|cambia|elimina/i.test(normalized)) return 'change_request';
  if (/kalori|protein|karbonhidrat|yağ|öğün|yemek|beslen|makro|calorie|carb|fat|meal|food|nutrition|macro|kalorien|eiweiß|kohlenhydrate|fett|mahlzeit|ernährung|calories|repas|aliment|calorías|comida|alimento|nutrición/i.test(normalized)) return 'nutrition';
  if (/antrenman|egzersiz|hareket|set|tekrar|squat|şınav|lunge|çalış|workout|exercise|sets|reps|training|push.?up|entraînement|exercice|entrenamiento|ejercicio/i.test(normalized)) return 'workout';
  if (/kilo|ağırlık|gelişim|ilerleme|hafta|sonuç|weight|progress|result|week|poids|progrès|semaine|gewicht|fortschritt|woche|peso|progreso|semana/i.test(normalized)) return 'progress';
  if (/boy|yaş|hedef|cinsiyet|ekipman|aktivite|diyet|profil|height|age|goal|equipment|activity|diet|profile|taille|âge|objectif|équipement|activité|profil|größe|alter|ziel|ausrüstung|aktivität|profil|altura|edad|objetivo|equipo|actividad|perfil/i.test(normalized)) return 'profile';
  return 'general';
}

export function buildCoachBaseline(input: BaselineInput): Record<string, unknown> {
  const context: Record<string, unknown> = {
    request: { intent: getCoachIntent(input.message) },
    userSummary: input.profile ? {
      preferredName: input.username,
      goal: input.profile.goal,
      experience: input.profile.experience,
      equipment: input.profile.equipment,
      equipmentDetails: input.profile.equipmentDetails,
      gymLevel: input.profile.gymLevel,
      trainingDays: input.profile.trainingDays,
      sessionDuration: input.profile.sessionDuration,
      preferredDays: input.profile.preferredDays,
    } : {
      preferredName: input.username,
      profileAvailable: false,
    },
    planOverview: {
      hasWorkoutPlan: input.workouts.length > 0,
      schedule: input.workouts.slice(0, 7).map((workout) => ({
        day: workout.day,
        name: workout.name,
        duration: workout.duration,
        completed: workout.completed,
      })),
    },
  };

  const recentConversation = (input.conversation ?? [])
    .filter((item) => item.content.trim())
    .slice(-6)
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 500) }));
  if (recentConversation.length > 0) context.recentConversation = recentConversation;

  return context;
}