import React, { useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useFit, type FitnessGoal } from '@/context/FitContext';
import { useTheme, type ThemePreference } from '@/context/ThemeContext';
import { useColors } from '@/hooks/useColors';
import { languageLabels, translate, type TranslationKey } from '@/lib/i18n';
import { legalDocumentUrl, type LegalDocument } from '@/lib/legalDocuments';
import { useSubscription } from '@/lib/revenuecat';
import { PREMIUM_ENTITLEMENT_IDENTIFIER, hasActivePremiumEntitlement } from '@/lib/premiumAccess';
import { getCurrentStreak } from '@/lib/streak';
import { countEnabledNotifications } from '@/lib/notificationPreferences';
import { Header, Screen } from '@/components/FitUI';
import { Ionicons } from '@/components/AppIcon';
import { PressableScale as Pressable } from '@/components/Motion';
import { openWidgetOffer } from '@/components/WidgetOffer';
import { FeedbackSheet } from '@/components/FeedbackSheet';
import { ConfirmSheet, SegmentedControl, SettingsGroup, SettingsRow } from '@/components/SettingsControls';

const goalLabels: Record<FitnessGoal, TranslationKey> = {
  muscle: 'goalMuscle',
  weightGain: 'goalWeightGain',
  weightLoss: 'goalWeightLoss',
  fatLoss: 'goalFatLoss',
  maintain: 'goalMaintain',
};

// Where each store lets people manage a subscription when RevenueCat has no management link.
const storeSubscriptionsUrl = Platform.OS === 'ios'
  ? 'https://apps.apple.com/account/subscriptions'
  : 'https://play.google.com/store/account/subscriptions';

/** Profile summary at the top of Settings: who you are, what you are working toward, your streak. */
function ProfileCard({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  const { language, username, profile, weight, goalWeight, streakDates } = useFit();
  const t = (key: TranslationKey) => translate(language, key);
  const name = username?.trim() || t('settingsProfileFallback');
  const streak = getCurrentStreak(streakDates);
  const goal = profile?.goal ? t(goalLabels[profile.goal]) : null;
  const weights = weight ? (goalWeight && goalWeight !== weight ? `${weight} kg → ${goalWeight} kg` : `${weight} kg`) : null;
  const summary = [goal, weights].filter(Boolean).join(' · ') || t('settingsProfileHint');

  return <Pressable testID="settings-profile" accessibilityRole="button" accessibilityHint={t('settingsProfileHint')} onPress={onPress} style={[styles.profile, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
      <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{name.slice(0, 1).toLocaleUpperCase(language)}</Text>
    </View>
    <View style={styles.profileCopy}>
      <Text numberOfLines={1} style={[styles.profileName, { color: colors.foreground }]}>{name}</Text>
      <Text numberOfLines={1} style={[styles.profileSummary, { color: colors.mutedForeground }]}>{summary}</Text>
      {streak > 0 ? <View style={[styles.profileStreak, { backgroundColor: `${colors.orange}14` }]}>
        <Ionicons name="flame" size={12} color={colors.orange} />
        <Text style={[styles.profileStreakText, { color: colors.orange }]}>{t('settingsStreakDays').replace('{count}', String(streak))}</Text>
      </View> : null}
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
  </Pressable>;
}

export default function SettingsScreen() {
  const colors = useColors();
  const { preference: themePreference, setPreference: setThemePreference } = useTheme();
  const { language, isPremium, notificationSettings, resetLocalUserData } = useFit();
  const { customerInfo, restore, isRestoring, isAvailable } = useSubscription();
  const t = (key: TranslationKey) => translate(language, key);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const entitlement = customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT_IDENTIFIER];
  const formatDate = (iso: string) => new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  const planName = entitlement?.productIdentifier
    ? t(/annual|year|yearly/i.test(entitlement.productIdentifier) ? 'premiumAnnualPlan' : 'premiumMonthlyPlan')
    : null;
  const renewal = entitlement?.expirationDate
    ? t(entitlement.willRenew ? 'settingsSubscriptionRenews' : 'settingsSubscriptionEnds').replace('{date}', formatDate(entitlement.expirationDate))
    : undefined;
  const subscriptionTitle = isPremium ? ['GainMode Access', planName].filter(Boolean).join(' · ') : t('settingsSubscriptionInactive');
  const enabledReminders = countEnabledNotifications(notificationSettings);
  const version = Constants.expoConfig?.version;

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert(t('legalLinkErrorTitle'), t('legalLinkErrorBody')));
  };
  const openLegal = (document: LegalDocument) => openUrl(legalDocumentUrl(document, language));

  const restorePurchases = async () => {
    setNotice(null);
    if (!isAvailable) {
      setNotice({ tone: 'error', text: t('premiumStoreUnavailable') });
      return;
    }
    try {
      const info = await restore();
      setNotice(hasActivePremiumEntitlement(info) ? { tone: 'ok', text: t('settingsRestoreDone') } : { tone: 'error', text: t('premiumRestoreNoPurchase') });
    } catch {
      setNotice({ tone: 'error', text: t('premiumRestoreError') });
    }
  };

  const deleteLocalData = async () => {
    setDeleting(true);
    try {
      await resetLocalUserData();
      setConfirmDelete(false);
      router.replace('/');
    } catch {
      setConfirmDelete(false);
      setNotice({ tone: 'error', text: t('deleteLocalDataErrorBody') });
    } finally {
      setDeleting(false);
    }
  };

  return <>
    <Screen>
      <Header title={t('settingsTitle')} action="close-outline" onAction={() => router.back()} />

      <ProfileCard onPress={() => router.push('/update-preferences')} />

      <SettingsGroup title={t('settingsGroupSubscription')}>
        <SettingsRow icon="trophy-outline" title={subscriptionTitle} detail={renewal} value={isPremium ? t('settingsSubscriptionActive') : undefined} />
        {isPremium && Platform.OS !== 'web' ? <SettingsRow testID="settings-manage-subscription" icon="ticket-outline" title={t('settingsManageSubscription')} onPress={() => openUrl(customerInfo?.managementURL ?? storeSubscriptionsUrl)} /> : null}
        <SettingsRow testID="settings-restore" icon="restore-outline" title={isRestoring ? t('premiumLoading') : t('premiumRestore')} onPress={() => { void restorePurchases(); }} chevron={false} />
      </SettingsGroup>
      {notice ? <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: `${notice.tone === 'ok' ? colors.success : colors.destructive}12`, borderColor: `${notice.tone === 'ok' ? colors.success : colors.destructive}40` }]}>
        <Ionicons name={notice.tone === 'ok' ? 'checkmark-circle' : 'alert-circle'} size={16} color={notice.tone === 'ok' ? colors.success : colors.destructive} />
        <Text style={[styles.noticeText, { color: notice.tone === 'ok' ? colors.success : colors.destructive }]}>{notice.text}</Text>
      </View> : null}

      <SettingsGroup title={t('settingsGroupGeneral')}>
        <SettingsRow testID="settings-language" icon="language-outline" title={t('appLanguage')} value={languageLabels[language]} onPress={() => router.push('/settings-language')} />
        <SettingsRow icon="sunny-outline" title={t('appearance')}>
          <SegmentedControl<ThemePreference>
            value={themePreference}
            onChange={setThemePreference}
            options={[
              { value: 'system', label: t('themeSystem'), icon: 'phone-portrait-outline' },
              { value: 'light', label: t('themeLight'), icon: 'sunny-outline' },
              { value: 'dark', label: t('themeDark'), icon: 'moon-outline' },
            ]}
          />
        </SettingsRow>
        <SettingsRow
          testID="settings-notifications"
          icon="notifications-outline"
          title={t('notifications')}
          value={enabledReminders ? t('settingsNotificationsCount').replace('{count}', String(enabledReminders)) : t('settingsNotificationsNone')}
          onPress={() => router.push('/settings-notifications')}
        />
        {Platform.OS !== 'web' ? <SettingsRow testID="settings-widget" icon="phone-portrait-outline" title={t('widgetSettingsTitle')} onPress={openWidgetOffer} /> : null}
      </SettingsGroup>

      <SettingsGroup title={t('settingsGroupHelp')}>
        <SettingsRow testID="settings-feedback" icon="chatbubble-ellipses-outline" title={t('feedbackTitle')} onPress={() => setFeedbackOpen(true)} />
        <SettingsRow icon="grid-outline" title={t('settingsWhatItDoes')} onPress={() => router.push('/features')} />
      </SettingsGroup>

      <SettingsGroup title={t('settingsGroupAbout')}>
        <SettingsRow icon="shield-checkmark-outline" title={t('privacyPolicy')} onPress={() => openLegal('privacy-policy')} />
        <SettingsRow icon="document-text-outline" title={t('termsOfService')} onPress={() => openLegal('terms-of-service')} />
        {version ? <SettingsRow icon="information-circle-outline" title={t('settingsVersion')} value={version} /> : null}
      </SettingsGroup>

      <SettingsGroup footer={t('deleteLocalDataSummary')}>
        <SettingsRow testID="delete-local-data" icon="trash-outline" title={t('deleteLocalData')} destructive chevron={false} onPress={() => setConfirmDelete(true)} />
      </SettingsGroup>
    </Screen>

    <FeedbackSheet visible={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    <ConfirmSheet
      visible={confirmDelete}
      busy={deleting}
      title={t('deleteLocalDataConfirmTitle')}
      body={t('deleteLocalDataConfirmBody')}
      confirmLabel={t('deleteLocalDataConfirmAction')}
      cancelLabel={t('deleteLocalDataCancel')}
      onConfirm={() => { void deleteLocalData(); }}
      onCancel={() => setConfirmDelete(false)}
    />
  </>;
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 26 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  profileCopy: { flex: 1, minWidth: 0 },
  profileName: { fontFamily: 'Inter_700Bold', fontSize: 19, letterSpacing: -0.4 },
  profileSummary: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 3 },
  profileStreak: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  profileStreakText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginTop: -12, marginBottom: 24 },
  noticeText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18 },
});
