export type ExerciseWeightHistoryEntry = {
  id: string;
  workoutId: string;
  exerciseId: string;
  exerciseName?: string;
  muscleGroup?: string;
  weightKg: number;
  date: string;
};

export type ExerciseWeightHistoryTarget = {
  workoutId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: string;
};

export function getExerciseWeightHistory(
  history: readonly ExerciseWeightHistoryEntry[],
  target: ExerciseWeightHistoryTarget,
) {
  return history
    .filter((entry) => {
      if (!Number.isFinite(entry.weightKg) || !Number.isFinite(Date.parse(entry.date))) return false;

      const historicalName = entry.exerciseName?.trim();
      if (historicalName) {
        return historicalName === target.exerciseName
          && (!entry.muscleGroup || !target.muscleGroup || entry.muscleGroup === target.muscleGroup);
      }

      // Older saved logs only have slot IDs. Keep those visible for the current slot.
      return entry.workoutId === target.workoutId && entry.exerciseId === target.exerciseId;
    })
    .slice()
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}