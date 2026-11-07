import React, { useState } from 'react';
import { Alert, Image, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { badges, badgeText, badgeUi } from '@/lib/badges';
import { countEnabledNotifications } from '@/lib/notificationPreferences';
import { Header, Screen } from '@/components/FitUI';
import { Ionicons } from '@/components/AppIcon';
import { BadgeMedal } from '@/components/BadgeMedal';
import { PressableScale as Pressable } from '@/components/Motion';
import { openWidgetOffer } from '@/components/WidgetOffer';
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

/**
 * Profile hero at the top of Settings: a gradient monogram, the name, the goal, and the weight journey from
 * today's weight to the target drawn as a short track, plus the streak.
 */
function ProfileCard({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  const { language, username, profile, weight, goalWeight, streakDates } = useFit();
  const t = (key: TranslationKey) => translate(language, key);
  const name = username?.trim() || t('settingsProfileFallback');
  const streak = getCurrentStreak(streakDates);
  const goal = profile?.goal ? t(goalLabels[profile.goal]) : t('settingsProfileHint');
  const journey = weight && goalWeight && goalWeight !== weight;

  return <Pressable testID="settings-profile" accessibilityRole="button" accessibilityHint={t('settingsProfileHint')} onPress={onPress} scaleTo={0.985} style={[styles.profile, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.profileTop}>
      <LinearGradient colors={[colors.accent, '#123A8F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
        <Text style={styles.avatarText}>{name.slice(0, 1).toLocaleUpperCase(language)}</Text>
      </LinearGradient>
      <View style={styles.profileCopy}>
        <Text numberOfLines={1} style={[styles.profileName, { color: colors.foreground }]}>{name}</Text>
        <Text numberOfLines={1} style={[styles.profileSummary, { color: colors.mutedForeground }]}>{goal}</Text>
      </View>
      <View style={[styles.profileEdit, { backgroundColor: `${colors.foreground}0A` }]}><Ionicons name="chevron-forward" size={17} color={colors.foreground} /></View>
    </View>
    {journey || streak > 0 ? <View style={[styles.profileBottom, { borderTopColor: colors.border }]}>
      {journey ? <View style={styles.journey}>
        <Text style={[styles.journeyValue, { color: colors.foreground }]}>{weight}<Text style={[styles.journeyUnit, { color: colors.mutedForeground }]}> kg</Text></Text>
        <LinearGradient colors={[`${colors.accent}55`, colors.accent]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.journeyTrack}>
          <View style={[styles.journeyHead, { backgroundColor: colors.accent }]} />
        </LinearGradient>
        <Text style={[styles.journeyValue, { color: colors.accent }]}>{goalWeight}<Text style={[styles.journeyUnit, { color: colors.mutedForeground }]}> kg</Text></Text>
      </View> : <View style={{ flex: 1 }} />}
      {streak > 0 ? <View style={[styles.profileStreak, { backgroundColor: colors.orange }]}>
        <Ionicons name="flame" size={12} color="#FFFFFF" />
        <Text style={styles.profileStreakText}>{streak}</Text>
      </View> : null}
    </View> : null}
  </Pressable>;
}

/** Two showcase tiles under the profile: the badge collection with its latest 3D medal, and GainMode Access. */
function ShowcaseTiles({ isPremium, onBadges }: { isPremium: boolean; onBadges: () => void }) {
  const colors = useColors();
  const { language, unlockedBadgeIds } = useFit();
  const t = (key: TranslationKey) => translate(language, key);
  const latest = [...badges].reverse().find((badge) => unlockedBadgeIds.includes(badge.id)) ?? badges[0];
  return <View style={styles.tiles}>
    <Pressable testID="settings-badges" accessibilityRole="button" onPress={onBadges} scaleTo={0.97} style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <BadgeMedal badge={latest} size={52} locked={!unlockedBadgeIds.length} />
      <Text style={[styles.tileValue, { color: colors.foreground }]}>{unlockedBadgeIds.length}<Text style={[styles.tileTotal, { color: colors.mutedForeground }]}> / {badges.length}</Text></Text>
      <View style={styles.tileFoot}>
        <Text numberOfLines={1} style={[styles.tileLabel, { color: colors.mutedForeground }]}>{badgeText(badgeUi.wall, language)}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
      </View>
    </Pressable>
    {isPremium
      ? <LinearGradient colors={['#F5C542', '#E39A1F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.tile, styles.tileGold]}>
        <Image source={require('@/assets/images/medals/access.png')} resizeMode="contain" style={styles.tileMedal} />
        <Text style={[styles.tileValue, { color: '#3A2600' }]}>Access</Text>
        <View style={styles.tileFoot}>
          <View style={styles.activeDot} />
          <Text numberOfLines={1} style={[styles.tileLabel, { color: '#5A3D00' }]}>{t('settingsSubscriptionActive')}</Text>
        </View>
      </LinearGradient>
      : <View style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image source={require('@/assets/images/medals/access.png')} resizeMode="contain" style={[styles.tileMedal, { opacity: 0.45 }]} />
        <Text style={[styles.tileValue, { color: colors.foreground }]}>Access</Text>
        <Text numberOfLines={1} style={[styles.tileLabel, { color: colors.mutedForeground }]}>{t('settingsSubscriptionInactive')}</Text>
      </View>}
  </View>;
}

export default function SettingsScreen() {
  const colors = useColors();
  const { preference: themePreference, setPreference: setThemePreference } = useTheme();
  const { language, isPremium, notificationSettings, resetLocalUserData } = useFit();
  const { customerInfo, restore, isRestoring, isAvailable } = useSubscription();
  const t = (key: TranslationKey) => translate(language, key);
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
    <Screen sky>
      <Header title={t('settingsTitle')} action="close-outline" onAction={() => router.back()} />

      <ProfileCard onPress={() => router.push('/update-preferences')} />

      <ShowcaseTiles isPremium={isPremium} onBadges={() => router.push('/badge-wall')} />

      <SettingsGroup title={t('settingsGroupSubscription')}>
        <SettingsRow icon="trophy-outline" tone="#E39A1F" title={subscriptionTitle} detail={renewal} value={isPremium ? t('settingsSubscriptionActive') : undefined} />
        {isPremium && Platform.OS !== 'web' ? <SettingsRow testID="settings-manage-subscription" icon="ticket-outline" tone="#E39A1F" title={t('settingsManageSubscription')} onPress={() => openUrl(customerInfo?.managementURL ?? storeSubscriptionsUrl)} /> : null}
        <SettingsRow testID="settings-restore" icon="restore-outline" tone="#7C5CFF" title={isRestoring ? t('premiumLoading') : t('premiumRestore')} onPress={() => { void restorePurchases(); }} chevron={false} />
      </SettingsGroup>
      {notice ? <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: `${notice.tone === 'ok' ? colors.success : colors.destructive}12`, borderColor: `${notice.tone === 'ok' ? colors.success : colors.destructive}40` }]}>
        <Ionicons name={notice.tone === 'ok' ? 'checkmark-circle' : 'alert-circle'} size={16} color={notice.tone === 'ok' ? colors.success : colors.destructive} />
        <Text style={[styles.noticeText, { color: notice.tone === 'ok' ? colors.success : colors.destructive }]}>{notice.text}</Text>
      </View> : null}

      <SettingsGroup title={t('settingsGroupGeneral')}>
        <SettingsRow testID="settings-language" icon="language-outline" tone="#2563EB" title={t('appLanguage')} value={languageLabels[language]} onPress={() => router.push('/settings-language')} />
        <SettingsRow icon="sunny-outline" tone="#F59E0B" title={t('appearance')}>
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
          tone="#FF6A2B"
          title={t('notifications')}
          value={enabledReminders ? t('settingsNotificationsCount').replace('{count}', String(enabledReminders)) : t('settingsNotificationsNone')}
          onPress={() => router.push('/settings-notifications')}
        />
        {Platform.OS !== 'web' ? <SettingsRow testID="settings-widget" icon="phone-portrait-outline" tone="#16A34A" title={t('widgetSettingsTitle')} onPress={openWidgetOffer} /> : null}
      </SettingsGroup>

      <SettingsGroup title={t('settingsGroupAbout')}>
        <SettingsRow icon="shield-checkmark-outline" tone="#0EA5A4" title={t('privacyPolicy')} onPress={() => openLegal('privacy-policy')} />
        <SettingsRow icon="document-text-outline" tone="#64748B" title={t('termsOfService')} onPress={() => openLegal('terms-of-service')} />
        {version ? <SettingsRow icon="information-circle-outline" tone="#64748B" title={t('settingsVersion')} value={version} /> : null}
      </SettingsGroup>

      <SettingsGroup footer={t('deleteLocalDataSummary')}>
        <SettingsRow testID="delete-local-data" icon="trash-outline" title={t('deleteLocalData')} destructive chevron={false} onPress={() => setConfirmDelete(true)} />
      </SettingsGroup>
    </Screen>

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
  profile: { borderRadius: 30, borderWidth: 1, padding: 18, marginBottom: 12 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Inter_800ExtraBold', fontSize: 26, color: '#FFFFFF' },
  profileCopy: { flex: 1, minWidth: 0 },
  profileName: { fontFamily: 'Inter_800ExtraBold', fontSize: 23, letterSpacing: -0.8 },
  profileSummary: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 3 },
  profileEdit: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  profileBottom: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 16, paddingTop: 14 },
  journey: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  journeyValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 16, letterSpacing: -0.4 },
  journeyUnit: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0 },
  journeyTrack: { flex: 1, height: 6, borderRadius: 3, justifyContent: 'center' },
  journeyHead: { position: 'absolute', right: -2, width: 10, height: 10, borderRadius: 3, transform: [{ rotate: '45deg' }] },
  profileStreak: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  profileStreakText: { fontFamily: 'Inter_800ExtraBold', fontSize: 12, color: '#FFFFFF' },
  tiles: { flexDirection: 'row', gap: 12, marginBottom: 26 },
  tile: { flex: 1, borderRadius: 26, borderWidth: 1, padding: 16, minHeight: 150, justifyContent: 'space-between' },
  tileGold: { borderColor: 'transparent' },
  tileMedal: { width: 52, height: 52 },
  tileValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, letterSpacing: -0.9, marginTop: 10 },
  tileTotal: { fontSize: 15, letterSpacing: -0.3 },
  tileFoot: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  tileLabel: { flexShrink: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#1F9D55' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginTop: -12, marginBottom: 24 },
  noticeText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18 },
});
