import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import ReAnimated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { EASE_OUT, PressableScale as Pressable, Reveal } from '@/components/Motion';
import { Ionicons } from '@/components/AppIcon';
import { router } from 'expo-router';
import { useFit } from '@/context/FitContext';
import { languageLabels, Language, translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, Header, Screen, SectionTitle } from '@/components/FitUI';
import { openWidgetOffer } from '@/components/WidgetOffer';
import { LanguageList, SegmentedControl } from '@/components/SettingsControls';
import { FeedbackSent } from '@/components/FeedbackSent';
import { useTheme, type ThemePreference } from '@/context/ThemeContext';
import { apiUrl } from '@/lib/api';
import { legalDocumentUrl, type LegalDocument } from '@/lib/legalDocuments';

type LegalSection = 'privacy' | 'terms' | null;
type FeedbackCategory = 'bug' | 'suggestion' | 'subscription' | 'payment' | 'notifications' | 'other';

const feedbackCategories = [
  { value: 'bug', label: 'feedbackBug', icon: 'alert-circle' },
  { value: 'suggestion', label: 'feedbackSuggestion', icon: 'bulb-outline' },
  { value: 'subscription', label: 'feedbackSubscription', icon: 'trophy-outline' },
  { value: 'payment', label: 'feedbackPayment', icon: 'ticket-outline' },
  { value: 'notifications', label: 'feedbackNotifications', icon: 'notifications-outline' },
  { value: 'other', label: 'feedbackOther', icon: 'ellipsis-horizontal' },
] as const;

// Disclosure chevron: rotates a quarter turn toward the content it reveals (200ms ease-out).
function Chevron({ open, color }: { open: boolean; color: string }) {
  const turn = useSharedValue(open ? 1 : 0);
  React.useEffect(() => {
    turn.set(withTiming(open ? 1 : 0, { duration: 200, easing: EASE_OUT }));
  }, [open, turn]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get() * 90}deg` }] }));
  return <ReAnimated.View style={style}><Ionicons name="chevron-forward" size={19} color={color} /></ReAnimated.View>;
}

export default function SettingsScreen() {
  const colors = useColors();
  const { preference: themePreference, setPreference: setThemePreference } = useTheme();
  const {
    language,
    setLanguage,
    resetLocalUserData,
  } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [expanded, setExpanded] = useState<LegalSection>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('suggestion');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'message' | null>(null);
  const languages = Object.keys(languageLabels) as Language[];

  const openLegalDocument = async (document: LegalDocument) => {
    try {
      await Linking.openURL(legalDocumentUrl(document, language));
    } catch {
      Alert.alert(t('legalLinkErrorTitle'), t('legalLinkErrorBody'));
    }
  };

  const confirmLocalDataDeletion = () => {
    Alert.alert(t('deleteLocalDataConfirmTitle'), t('deleteLocalDataConfirmBody'), [
      { text: t('deleteLocalDataCancel'), style: 'cancel' },
      {
        text: t('deleteLocalDataConfirmAction'),
        style: 'destructive',
        onPress: () => {
          void resetLocalUserData().then(() => {
            Alert.alert(t('deleteLocalDataDoneTitle'), t('deleteLocalDataDoneBody'), [
              { text: t('deleteLocalDataOkay'), onPress: () => router.replace('/') },
            ]);
          }).catch(() => {
            Alert.alert(t('deleteLocalDataErrorTitle'), t('deleteLocalDataErrorBody'));
          });
        },
      },
    ]);
  };


  const feedbackReady = Boolean(feedbackText.trim() && feedbackEmail.trim()) && !feedbackSending;

  const submitFeedback = async () => {
    const message = feedbackText.trim();
    const replyTo = feedbackEmail.trim().toLowerCase();
    if (!message || !replyTo || feedbackSending) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
      Alert.alert(t('feedbackErrorTitle'), t('feedbackEmailInvalid'));
      return;
    }
    setFeedbackSending(true);
    try {
      const response = await fetch(apiUrl('/api/feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, category: feedbackCategory, language, screen: 'settings', replyTo }),
      });
      if (!response.ok) throw new Error('feedback request failed');
      setFeedbackText('');
      setFeedbackEmail('');
      setFeedbackSent(true);
    } catch {
      Alert.alert(t('feedbackErrorTitle'), t('feedbackErrorBody'));
    } finally {
      setFeedbackSending(false);
    }
  };

  return (
    <>
    <Screen>
      <Header eyebrow={t('settingsEyebrow')} title={t('settingsTitle')} subtitle={t('settingsSubtitle')} action="close-outline" onAction={() => router.back()} />

      <SectionTitle title={t('preferences')} />
      <Card>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
            <Ionicons name="language-outline" size={21} color={colors.foreground} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t('appLanguage')}</Text>
            <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{t('languageDescription')}</Text>
          </View>
        </View>
        <LanguageList value={language} onChange={setLanguage} />
      </Card>

      <SectionTitle title={t('appearance')} />
      <Card>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
            <Ionicons name="sunny-outline" size={21} color={colors.foreground} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t('appearance')}</Text>
            <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{t('appearanceDescription')}</Text>
          </View>
        </View>
        <SegmentedControl<ThemePreference>
          value={themePreference}
          onChange={setThemePreference}
          options={[
            { value: 'system', label: t('themeSystem'), icon: 'phone-portrait-outline' },
            { value: 'light', label: t('themeLight'), icon: 'sunny-outline' },
            { value: 'dark', label: t('themeDark'), icon: 'moon-outline' },
          ]}
        />
      </Card>

      <SectionTitle title={t('widgetSettingsTitle')} />
      <Card>
        <Pressable
          accessibilityRole="button"
          testID="settings-widget"
          onPress={openWidgetOffer}
          style={({ pressed }) => [styles.restartRow, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
            <Ionicons name="phone-portrait-outline" size={21} color={colors.foreground} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t('widgetSettingsTitle')}</Text>
            <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{t('widgetSettingsBody')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={colors.mutedForeground} />
        </Pressable>
      </Card>

      <SectionTitle title={t('coachProfileCorrectionTitle')} />
      <Card>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/coach')}
          style={({ pressed }) => [styles.restartRow, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={21} color={colors.foreground} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t('coachProfileCorrectionTitle')}</Text>
            <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{t('coachProfileCorrectionDescription')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={colors.mutedForeground} />
        </Pressable>
      </Card>

      <SectionTitle title={t('feedbackTitle')} />
      <Card>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: feedbackOpen }}
          onPress={() => setFeedbackOpen((current) => {
            if (current) setFeedbackSent(false);
            return !current;
          })}
          style={({ pressed }) => [styles.restartRow, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={21} color={colors.foreground} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t('feedbackTitle')}</Text>
            <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{t('feedbackDescription')}</Text>
          </View>
          <Chevron open={feedbackOpen} color={colors.mutedForeground} />
        </Pressable>
        {feedbackOpen ? (
          <View style={[styles.feedbackDetails, { borderTopColor: colors.border }]}>
            {feedbackSent ? (
              <FeedbackSent title={t('feedbackSentTitle')} body={t('feedbackSentBody')} />
            ) : (
              <Reveal>
                <Text style={[styles.feedbackLabel, { color: colors.mutedForeground }]}>{t('feedbackType').toUpperCase()}</Text>
                <View style={styles.feedbackTypeRow}>
                  {feedbackCategories.map((item) => {
                    const selected = feedbackCategory === item.value;
                    return (
                      <Pressable
                        key={item.value}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        onPress={() => setFeedbackCategory(item.value)}
                        style={[styles.feedbackType, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}
                      >
                        <Ionicons name={item.icon} size={14} color={selected ? colors.primaryForeground : colors.mutedForeground} />
                        <Text style={[styles.feedbackTypeText, { color: selected ? colors.primaryForeground : colors.foreground }]}>{t(item.label)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={[styles.feedbackLabel, styles.feedbackFieldLabel, { color: colors.mutedForeground }]}>{t('feedbackEmailLabel').toUpperCase()}</Text>
                <TextInput
                  value={feedbackEmail}
                  onChangeText={setFeedbackEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder={t('feedbackEmailPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.feedbackEmailInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: focusedField === 'email' ? colors.foreground : colors.border }]}
                />
                <Text style={[styles.feedbackHint, { color: colors.mutedForeground }]}>{t('feedbackEmailHint')}</Text>
                <Text style={[styles.feedbackLabel, styles.feedbackFieldLabel, { color: colors.mutedForeground }]}>{t('feedbackMessageLabel').toUpperCase()}</Text>
                <TextInput
                  multiline
                  numberOfLines={5}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  onFocus={() => setFocusedField('message')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t('feedbackPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  textAlignVertical="top"
                  style={[styles.feedbackInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: focusedField === 'message' ? colors.foreground : colors.border }]}
                />
                <Text style={[styles.feedbackCount, { color: colors.mutedForeground }]}>{feedbackText.trim().length}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !feedbackReady, busy: feedbackSending }}
                  disabled={!feedbackReady}
                  onPress={submitFeedback}
                  style={[styles.feedbackButton, { backgroundColor: feedbackReady || feedbackSending ? colors.primary : colors.secondary }]}
                >
                  {feedbackSending
                    ? <ActivityIndicator size="small" color={colors.primaryForeground} />
                    : <Ionicons name="arrow-up" size={17} color={feedbackReady ? colors.primaryForeground : colors.mutedForeground} />}
                  <Text style={[styles.feedbackButtonText, { color: feedbackReady || feedbackSending ? colors.primaryForeground : colors.mutedForeground }]}>{feedbackSending ? t('feedbackSending') : t('feedbackSend')}</Text>
                </Pressable>
              </Reveal>
            )}
          </View>
        ) : null}
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
        openFullLabel={t('openFullPrivacy')}
        onOpenFull={() => { void openLegalDocument('privacy-policy'); }}
      />
      <LegalCard
        icon="document-text-outline"
        title={t('termsOfService')}
        summary={t('termsSummary')}
        expanded={expanded === 'terms'}
        onPress={() => setExpanded(expanded === 'terms' ? null : 'terms')}
        body={t('termsBody')}
        points={[t('termsPoint1'), t('termsPoint2'), t('termsPoint3')]}
        openFullLabel={t('openFullTerms')}
        onOpenFull={() => { void openLegalDocument('terms-of-service'); }}
      />
      <SectionTitle title={t('localDataSectionTitle')} />
      <Card>
        <Pressable
          accessibilityRole="button"
          accessibilityHint={t('deleteLocalDataSummary')}
          testID="delete-local-data"
          onPress={confirmLocalDataDeletion}
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.72 : 1 }]}
        >
          <View style={[styles.iconBox, { backgroundColor: `${colors.destructive}18` }]}>
            <Ionicons name="trash-outline" size={21} color={colors.destructive} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t('deleteLocalData')}</Text>
            <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{t('deleteLocalDataSummary')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={colors.mutedForeground} />
        </Pressable>
      </Card>
      </Screen>
    </>
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
  openFullLabel,
  onOpenFull,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  summary: string;
  expanded: boolean;
  onPress: () => void;
  body: string;
  points: string[];
  openFullLabel: string;
  onOpenFull: () => void;
}) {
  const colors = useColors();
  return (
    <Card style={styles.legalCard}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={onPress} style={styles.legalHeader}>
        <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
          <Ionicons name={icon} size={21} color={colors.foreground} />
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
          <Pressable accessibilityRole="link" onPress={onOpenFull} style={styles.legalLink}>
            <Text style={[styles.legalLinkText, { color: colors.primary }]}>{openFullLabel}</Text>
            <Ionicons name="arrow-forward" size={15} color={colors.primary} />
          </Pressable>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  restartRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowCopy: { flex: 1 },
  iconBox: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  rowSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 4 },
  legalCard: { padding: 15 },
  legalHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  legalDetails: { borderTopWidth: 1, marginTop: 15, paddingTop: 14, gap: 12 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pointText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  legalLink: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 4 },
  legalLinkText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  feedbackDetails: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 16, paddingTop: 18 },
  feedbackLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1, marginBottom: 10 },
  feedbackTypeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  feedbackFieldLabel: { marginTop: 20 },
  feedbackType: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 6 },
  feedbackTypeText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  feedbackEmailInput: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 15 },
  feedbackHint: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 8 },
  feedbackInput: { minHeight: 132, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 21 },
  feedbackCount: { fontFamily: 'Inter_500Medium', fontSize: 11, textAlign: 'right', marginTop: 6, fontVariant: ['tabular-nums'] },
  feedbackButton: { minHeight: 54, borderRadius: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, marginTop: 16 },
  feedbackButtonText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
});