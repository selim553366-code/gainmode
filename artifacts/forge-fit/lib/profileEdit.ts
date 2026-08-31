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