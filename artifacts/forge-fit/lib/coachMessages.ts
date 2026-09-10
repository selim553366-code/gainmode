import type { CoachAction } from '@/lib/coachActions';

export const COACH_MESSAGES_STORAGE_KEY = 'forge-fit-coach-messages-v1';

export function getCoachMessagesStorageKey(accountId: string | null | undefined) {
  return accountId ? `${COACH_MESSAGES_STORAGE_KEY}:${accountId}` : COACH_MESSAGES_STORAGE_KEY;
}

export type CoachMessageRecord = {
  id: string;
  text: string;
  from: 'coach' | 'user';
  variant?: 'weeklyAnalysis';
  media?: 'welcomeGif';
  actions?: CoachAction[];
  actionStatus?: 'pending' | 'applied' | 'rejected';
};

export function parseStoredCoachMessages(value: string | null): CoachMessageRecord[] | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    const messages = parsed.filter((item): item is CoachMessageRecord => (
      typeof item === 'object'
      && item !== null
      && typeof (item as { id?: unknown }).id === 'string'
      && typeof (item as { text?: unknown }).text === 'string'
      && ((item as { from?: unknown }).from === 'coach' || (item as { from?: unknown }).from === 'user')
    ));
    return messages;
  } catch {
    return null;
  }
}