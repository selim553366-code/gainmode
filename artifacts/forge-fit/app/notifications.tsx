import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, Header, Screen } from '@/components/FitUI';
import { Ionicons } from '@/components/AppIcon';
import { getInboxNotifications, markInboxNotificationsRead, type InboxNotification } from '@/lib/inboxNotifications';

export default function NotificationsScreen() {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [items, setItems] = useState<InboxNotification[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getInboxNotifications().then((stored) => {
      if (cancelled) return;
      setItems(stored);
      void markInboxNotificationsRead().then((readItems) => {
        if (!cancelled) setItems(readItems);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Screen>
      <Header
        eyebrow={t('notificationsEyebrow')}
        title={t('notificationsTitle')}
        subtitle={t('notificationsSubtitle')}
        action="close-outline"
        onAction={() => router.back()}
      />
      {items.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}18` }]}>
            <Ionicons name="notifications-outline" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('notificationsEmptyTitle')}</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{t('notificationsEmptyBody')}</Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <Card key={item.id} style={[styles.notificationCard, { borderColor: colors.border }]}>
              <View style={[styles.notificationIcon, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.notificationCopy}>
                <Text style={[styles.notificationTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.notificationBody, { color: colors.mutedForeground }]}>{item.body}</Text>
                <Text style={[styles.notificationDate, { color: colors.mutedForeground }]}>{new Date(item.createdAt).toLocaleDateString(language)}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyCard: { alignItems: 'center', padding: 26, marginTop: 8 },
  emptyIcon: { width: 62, height: 62, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'center' },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7, maxWidth: 290 },
  list: { gap: 12, marginTop: 8 },
  notificationCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  notificationIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notificationCopy: { flex: 1, minWidth: 0 },
  notificationTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  notificationBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 5 },
  notificationDate: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 8 },
});