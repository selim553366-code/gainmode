export type CoachRatingMessage = {
  id: string;
  text: string;
  from: 'coach' | 'user';
  media?: string;
  variant?: string;
};

export function getFirstCoachReply(messages: CoachRatingMessage[]) {
  const firstUserIndex = messages.findIndex((item) => (
    item.from === 'user'
    && Boolean(item.text)
    && !item.media
    && !item.variant
  ));
  if (firstUserIndex < 0) return null;

  return messages.slice(firstUserIndex + 1).find((item) => (
    item.from === 'coach'
    && Boolean(item.text)
    && !item.media
    && !item.variant
  )) ?? null;
}