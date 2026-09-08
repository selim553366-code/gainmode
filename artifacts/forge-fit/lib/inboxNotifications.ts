import AsyncStorage from '@react-native-async-storage/async-storage';

export type InboxNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

const STORAGE_KEY = 'forge-fit-inbox-notifications-v1';

export async function getInboxNotifications() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [] as InboxNotification[];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [] as InboxNotification[];
    return parsed.filter((item): item is InboxNotification => (
      typeof item === 'object'
      && item !== null
      && typeof (item as InboxNotification).id === 'string'
      && typeof (item as InboxNotification).title === 'string'
      && typeof (item as InboxNotification).body === 'string'
      && typeof (item as InboxNotification).createdAt === 'string'
      && typeof (item as InboxNotification).read === 'boolean'
    ));
  } catch {
    return [] as InboxNotification[];
  }
}

export async function addInboxNotification(notification: Omit<InboxNotification, 'id' | 'createdAt' | 'read'>) {
  const current = await getInboxNotifications();
  const next: InboxNotification[] = [
    {
      ...notification,
      id: `inbox-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    },
    ...current,
  ].slice(0, 50);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next[0];
}

export async function markInboxNotificationsRead() {
  const current = await getInboxNotifications();
  if (!current.some((item) => !item.read)) return current;
  const next = current.map((item) => ({ ...item, read: true }));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}