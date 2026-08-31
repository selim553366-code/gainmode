import React, { useState } from 'react';
import { Alert, AppState, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@/components/AppIcon';
import { router } from 'expo-router';
import { useFit } from '@/context/FitContext';
import { languageLabels, Language, translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, Header, Screen, SectionTitle } from '@/components/FitUI';
import { hasNotificationPermission, NotificationSettingKey, requestNotificationPermission } from '@/lib/notifications';

type LegalSection = 'privacy' | 'terms' | null;

export default function SettingsScreen() {
  const colors = useColors();
  const {
    language,
    setLanguage,
    restartOnboarding,
    notificationSettings,
    setNotificationSetting,
  } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [expanded, setExpanded] = useState<LegalSection>(null);
  const [permissionRetryKey, setPermissionRetryKey] = useState<NotificationSettingKey | null>(null);
  const languages = Object.keys(languageLabels) as Language[];
  const notificationRows: Array<{ key: NotificationSettingKey; icon: React.ComponentProps<typeof Ionicons>['name']; title: string; description: string }> = [
    { key: 'workoutReminder', icon: 'barbell-outline', title: t('workoutReminder'), description: t('workoutReminderDescription') },
    { key: 'waterReminder', icon: 'nutrition-outline', title: t('waterReminder'), description: t('waterReminderDescription') },
    { key: 'mealReminder', icon: 'restaurant-outline', title: t('mealReminder'), description: t('mealReminderDescription') },
    { key: 'coachCheckIn', icon: 'chatbubble-ellipses-outline', title: t('coachCheckIn'), description: t('coachCheckInDescription') },
    { key: 'weeklySummary', icon: 'analytics-outline', title: t('weeklySummary'), description: t('weeklySummaryDescription') },
  ];
  const handleNotificationToggle = async (key: NotificationSettingKey, enabled: boolean) => {
    if (enabled) {
      setPermissionRetryKey(key);
      const granted = await requestNotificationPermission().catch(() => false);
      if (!granted) {
        Alert.alert(t('notificationsPermissionTitle'), t('notificationsPermissionBody'), [
          { text: t('cancel'), style: 'cancel' },
          { text: t('openSettings'), onPress: () => Linking.openSettings().catch(() => undefined) },
        ]);
        return;
      }
    }
    setPermissionRetryKey(null);
    setNotificationSetting(key, enabled);
  };

  React.useEffect(() => {
    if (!permissionRetryKey) return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      void hasNotificationPermission().then((granted) => {
        if (!granted) return;
        setNotificationSetting(permissionRetryKey, true);
        setPermissionRetryKey(null);
      }).catch(() => undefined);
    });
    return () => subscription.remove();
  }, [permissionRetryKey, setNotificationSetting]);

  return (
    <Screen>
      <Header eyebrow={t('settingsEyebrow')} title={t('settingsTitle')} subtitle={t('settingsSubtitle')} action="close-outline" onAction={() => router.back()} />

      <SectionTitle title={t('preferences')} />
      <Card>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="language-outline" size={21} color={colors.primary} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t('appLanguage')}</Text>
            <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{t('languageDescription')}</Text>
          </View>
        </View>
        <Text style={[styles.selectedLabel, { color: colors.mutedForeground }]}>{t('currentLanguage')}</Text>
        <View style={styles.languageGrid}>
          {languages.map((item) => {
            const active = item === language;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={languageLabels[item]}
                onPress={() => setLanguage(item)}
                style={({ pressed }) => [
                  styles.languageOption,
                  { backgroundColor: active ? colors.primary : colors.secondary, borderColor: active ? colors.primary : colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.languageCode, { color: active ? colors.primaryForeground : colors.foreground }]}>{item.toUpperCase()}</Text>
                <Text style={[styles.languageName, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>{languageLabels[item]}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <SectionTitle title={t('notificationSettingsTitle')} />
      <Card style={styles.notificationCard}>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="notifications-outline" size={21} color={colors.primary} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t('notificationSettingsTitle')}</Text>
            <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{t('notificationSettingsDescription')}</Text>
          </View>
        </View>
        <View style={styles.notificationList}>
          {notificationRows.map((item, index) => (
            <View key={item.key} style={[styles.notificationRow, index > 0 ? { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth } : null]}>
              <View style={[styles.notificationIcon, { backgroundColor: `${colors.secondary}` }]}>
                <Ionicons name={item.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{item.description}</Text>
              </View>
              <Switch
                testID={`notification-toggle-${item.key}`}
                accessibilityLabel={item.title}
                value={notificationSettings[item.key]}
                onValueChange={(value) => { void handleNotificationToggle(item.key, value); }}
                trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                thumbColor={notificationSettings[item.key] ? colors.primary : colors.mutedForeground}
              />
            </View>
          ))}
        </View>
      </Card>

      <SectionTitle title={t('onboarding')} />
      <Card>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            restartOnboarding();
            router.replace('/');
          }}
          style={({ pressed }) => [styles.restartRow, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={[styles.iconBox, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="flash-outline" size={21} color={colors.primary} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t('restartOnboarding')}</Text>
            <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{t('restartOnboardingDescription')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={colors.mutedForeground} />
        </Pressable>
      </Card>

      <SectionTitle title={t('legal')} />
      <LegalCard
        icon="shield-checkmark-outline"
        title={t('privacyPolicy')}
        summary={t('privacyPolicySummary')}
        expanded={expanded === 'privacy'}
        onPress={() => setExpanded(expanded === 'privacy' ? null : 'privacy')}
        body={t('privacyPolicyBody')}
        points={[t('privacyPoint1'), t('privacyPoint2'), t('privacyPoint3')]}
      />
      <LegalCard
        icon="document-text-outline"
        title={t('termsOfService')}
        summary={t('termsSummary')}
        expanded={expanded === 'terms'}
        onPress={() => setExpanded(expanded === 'terms' ? null : 'terms')}
        body={t('termsBody')}
        points={[t('termsPoint1'), t('termsPoint2'), t('termsPoint3')]}
      />
    </Screen>
  );
}

function LegalCard({
  icon,
  title,
  summary,
  expanded,
  onPress,
  body,
  points,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  summary: string;
  expanded: boolean;
  onPress: () => void;
  body: string;
  points: string[];
}) {
  const colors = useColors();
  return (
    <Card style={styles.legalCard}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={onPress} style={styles.legalHeader}>
        <View style={[styles.iconBox, { backgroundColor: `${colors.blue}20` }]}>
          <Ionicons name={icon} size={21} color={colors.blue} />
        </View>
        <View style={styles.rowCopy}>
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{summary}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={19} color={colors.mutedForeground} />
      </Pressable>
      {expanded ? (
        <View style={[styles.legalDetails, { borderTopColor: colors.border }]}>
          <Text style={[styles.body, { color: colors.foreground }]}>{body}</Text>
          {points.map((point) => (
            <View key={point} style={styles.point}>
              <Ionicons name="checkmark-circle" size={17} color={colors.primary} />
              <Text style={[styles.pointText, { color: colors.mutedForeground }]}>{point}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notificationCard: { padding: 15 },
  notificationList: { marginTop: 12 },
  notificationRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  notificationIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  restartRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowCopy: { flex: 1 },
  iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  rowSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 4 },
  selectedLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 20, marginBottom: 9 },
  languageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  languageOption: { minWidth: '30%', flexGrow: 1, borderWidth: 1, borderRadius: 15, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
  languageCode: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 0.6 },
  languageName: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
  legalCard: { padding: 15 },
  legalHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  legalDetails: { borderTopWidth: 1, marginTop: 15, paddingTop: 14, gap: 12 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pointText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
});