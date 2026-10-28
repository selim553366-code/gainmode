import React from 'react';
import { AppState, Linking, StyleSheet, Switch, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useFit } from '@/context/FitContext';
import { useColors } from '@/hooks/useColors';
import { translate, type TranslationKey } from '@/lib/i18n';
import { hasNotificationPermission, notificationsSupported } from '@/lib/notifications';
import type { NotificationPreferenceKey } from '@/lib/notificationPreferences';
import { Header, Screen } from '@/components/FitUI';
import { Ionicons } from '@/components/AppIcon';
import { PressableScale as Pressable } from '@/components/Motion';
import { SettingsGroup, SettingsRow } from '@/components/SettingsControls';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const reminders: Array<{ key: NotificationPreferenceKey; icon: IconName; title: TranslationKey; hint: TranslationKey }> = [
  { key: 'workoutReminder', icon: 'barbell-outline', title: 'notifWorkout', hint: 'notifWorkoutHint' },
  { key: 'waterReminder', icon: 'nutrition-outline', title: 'notifWater', hint: 'notifWaterHint' },
  { key: 'mealReminder', icon: 'restaurant-outline', title: 'notifMeal', hint: 'notifMealHint' },
  { key: 'coachCheckIn', icon: 'coach-outline', title: 'notifCoach', hint: 'notifCoachHint' },
  { key: 'weeklySummary', icon: 'analytics-outline', title: 'notifWeekly', hint: 'notifWeeklyHint' },
];

/** One switch per reminder, each with the time it arrives. Warns when the phone has notifications off. */
export default function SettingsNotificationsScreen() {
  const colors = useColors();
  const { language, notificationSettings, setNotificationSetting } = useFit();
  const t = (key: TranslationKey) => translate(language, key);
  const [systemAllowed, setSystemAllowed] = React.useState(true);

  React.useEffect(() => {
    if (!notificationsSupported) return undefined;
    const check = () => { hasNotificationPermission().then(setSystemAllowed).catch(() => undefined); };
    check();
    // Re-check when the user comes back from the phone's settings.
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') check(); });
    return () => subscription.remove();
  }, []);

  return <Screen>
    <Header title={t('notifications')} subtitle={t('notifScreenSubtitle')} action="close-outline" onAction={() => router.back()} />
    {!systemAllowed ? <View accessibilityRole="alert" style={[styles.warning, { backgroundColor: `${colors.orange}12`, borderColor: `${colors.orange}40` }]}>
      <Ionicons name="notifications-outline" size={18} color={colors.orange} />
      <Text style={[styles.warningText, { color: colors.foreground }]}>{t('notifSystemOff')}</Text>
      <Pressable accessibilityRole="button" onPress={() => { Linking.openSettings().catch(() => undefined); }} style={[styles.warningButton, { backgroundColor: colors.primary }]}>
        <Text style={[styles.warningButtonText, { color: colors.primaryForeground }]}>{t('notifOpenSettings')}</Text>
      </Pressable>
    </View> : null}
    <SettingsGroup>
      {reminders.map((reminder) => <SettingsRow key={reminder.key} icon={reminder.icon} title={t(reminder.title)} detail={t(reminder.hint)} chevron={false} accessory={
          <Switch
            testID={`notification-${reminder.key}`}
            accessibilityLabel={t(reminder.title)}
            value={notificationSettings[reminder.key]}
            onValueChange={(value) => {
              Haptics.selectionAsync().catch(() => undefined);
              setNotificationSetting(reminder.key, value);
            }}
            trackColor={{ false: colors.secondary, true: colors.success }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.secondary}
          />
        } />)}
    </SettingsGroup>
  </Screen>;
}

const styles = StyleSheet.create({
  warning: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10, marginBottom: 20 },
  warningText: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19 },
  warningButton: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  warningButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});
