export type ProfileEditField =
  | 'name'
  | 'equipment'
  | 'body'
  | 'personal'
  | 'goal'
  | 'activity'
  | 'training'
  | 'nutrition';

export const PROFILE_EDIT_FIELDS: ProfileEditField[] = [
  'name',
  'equipment',
  'body',
  'personal',
  'goal',
  'activity',
  'training',
  'nutrition',
];

export function getCurrentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function isProfileEditAvailable(lastUsedMonth: string | null | undefined, date = new Date()) {
  return lastUsedMonth !== getCurrentMonthKey(date);
}

export function parseProfileEditFields(value: string | string[] | undefined): ProfileEditField[] {
  const raw = Array.isArray(value) ? value.join(',') : value ?? '';
  return [...new Set(raw.split(',').filter((field): field is ProfileEditField => PROFILE_EDIT_FIELDS.includes(field as ProfileEditField)))];
}

export function getProfileEditStepIds(selectedFields: ProfileEditField[], hasTargetWeightStep: boolean) {
  const steps = new Set<number>();
  if (selectedFields.includes('name')) steps.add(0);
  if (selectedFields.includes('equipment')) steps.add(1);
  if (selectedFields.includes('body')) {
    steps.add(2);
    steps.add(3);
  }
  if (selectedFields.includes('personal')) {
    steps.add(4);
    steps.add(6);
  }
  if (selectedFields.includes('goal')) {
    steps.add(5);
    if (hasTargetWeightStep) steps.add(15);
  }
  if (selectedFields.includes('activity')) steps.add(7);
  if (selectedFields.includes('training')) {
    steps.add(8);
    steps.add(9);
    steps.add(10);
    steps.add(13);
    steps.add(14);
  }
  if (selectedFields.includes('nutrition')) {
    steps.add(11);
    steps.add(12);
  }
  return [...steps].sort((a, b) => a - b);
}