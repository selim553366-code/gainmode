import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@/components/AppIcon';
import { router } from 'expo-router';
import { useFit } from '@/context/FitContext';
import { languageLabels, Language, translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, Header, Screen, SectionTitle } from '@/components/FitUI';
import { isProfileEditAvailable } from '@/lib/profileEdit';
import { useTheme, type ThemePreference } from '@/context/ThemeContext';
import { apiUrl } from '@/lib/api';

type LegalSection = 'privacy' | 'terms' | null;
type FeedbackCategory = 'bug' | 'suggestion' | 'other';

const feedbackCategories = [
  { value: 'bug', label: 'feedbackBug' },
  { value: 'suggestion', label: 'feedbackSuggestion' },
  { value: 'other', label: 'feedbackOther' },
] as const;

export default function SettingsScreen() {
  const colors = useColors();
  const { preference: themePreference, setPreference: setThemePreference } = useTheme();
  const {
    language,
    setLanguage,
    restartOnboarding,
    profileEditUsedMonth,
  } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const profileEditAvailable = isProfileEditAvailable(profileEditUsedMonth);
  const [expanded, setExpanded] = useState<LegalSection>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('suggestion');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const languages = Object.keys(languageLabels) as Language[];

  const submitFeedback = async () => {
    const message = feedbackText.trim();
    if (!message || feedbackSending) return;
    setFeedbackSending(true);
    try {
      const response = await fetch(apiUrl('/api/feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, category: feedbackCategory, language, screen: 'settings' }),
      });
      if (!response.ok) throw new Error('feedback request failed');
      setFeedbackText('');
      setFeedbackOpen(false);
      Alert.alert(t('feedbackSentTitle'), t('feedbackSentBody'));
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

      <SectionTitle title={t('appearance')} />
      <Card>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: `${colors.plum}20` }]}>
            <Ionicons name="sunny-outline" size={21} color={colors.plum} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t('appearance')}</Text>
            <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{t('appearanceDescription')}</Text>
          </View>
        </View>
        <View style={styles.themeGrid}>
          {([
            { value: 'system', label: 'themeSystem', icon: 'phone-portrait-outline' },
            { value: 'light', label: 'themeLight', icon: 'sunny-outline' },
            { value: 'dark', label: 'themeDark', icon: 'moon-outline' },
          ] as const).map((option) => {
            const active = themePreference === option.value;
            return <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={() => setThemePreference(option.value as ThemePreference)} style={({ pressed }) => [styles.themeOption, { backgroundColor: active ? colors.primary : colors.secondary, borderColor: active ? colors.primary : colors.border, opacity: pressed ? 0.72 : 1 }]}>
              <Ionicons name={option.icon} size={18} color={active ? colors.primaryForeground : colors.foreground} />
              <Text style={[styles.themeLabel, { color: active ? colors.primaryForeground : colors.foreground }]}>{t(option.label)}</Text>
            </Pressable>;
          })}
        </View>
      </Card>

      <SectionTitle title={t('editPreferences')} />
      <Card>
        <Pressable
          accessibilityRole="button"
          disabled={!profileEditAvailable}
          onPress={() => router.push('/update-preferences')}
          style={({ pressed }) => [styles.restartRow, { opacity: !profileEditAvailable ? 0.5 : pressed ? 0.7 : 1 }]}
        >
          <View style={[styles.iconBox, { backgroundColor: `${colors.blue}20` }]}>
            <Ionicons name="options-outline" size={21} color={colors.blue} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t('editPreferences')}</Text>
            <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
              {!profileEditAvailable ? t('editPreferencesLimitUsed') : t('editPreferencesDescription')}
            </Text>
          </View>
          {profileEditAvailable ? <Ionicons name="chevron-forward" size={19} color={colors.mutedForeground} /> : null}
        </Pressable>
      </Card>

      <SectionTitle title={t('onboarding')} />
      <Card>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            restartOnboarding();
            setTimeout(() => router.replace('/'), 0);
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

      <SectionTitle title={t('feedbackTitle')} />
      <Card>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: feedbackOpen }}
          onPress={() => setFeedbackOpen((current) => !current)}
          style={({ pressed }) => [styles.restartRow, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={[styles.iconBox, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={21} color={colors.primary} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t('feedbackTitle')}</Text>
            <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{t('feedbackDescription')}</Text>
          </View>
          <Ionicons name={feedbackOpen ? 'chevron-up' : 'chevron-forward'} size={19} color={colors.mutedForeground} />
        </Pressable>
        {feedbackOpen ? (
          <View style={[styles.feedbackDetails, { borderTopColor: colors.border }]}>
            <Text style={[styles.feedbackLabel, { color: colors.foreground }]}>{t('feedbackType')}</Text>
            <View style={styles.feedbackTypeRow}>
              {feedbackCategories.map((item) => {
                const selected = feedbackCategory === item.value;
                return (
                  <Pressable
                    key={item.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setFeedbackCategory(item.value)}
                    style={({ pressed }) => [styles.feedbackType, { backgroundColor: selected ? colors.primary : colors.secondary, borderColor: selected ? colors.primary : colors.border, opacity: pressed ? 0.72 : 1 }]}
                  >
                    <Text style={[styles.feedbackTypeText, { color: selected ? colors.primaryForeground : colors.foreground }]}>{t(item.label)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              multiline
              numberOfLines={5}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder={t('feedbackPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              textAlignVertical="top"
              style={[styles.feedbackInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!feedbackText.trim() || feedbackSending}
              onPress={submitFeedback}
              style={({ pressed }) => [styles.feedbackButton, { backgroundColor: colors.primary, opacity: !feedbackText.trim() || feedbackSending ? 0.45 : pressed ? 0.75 : 1 }]}
            >
              <Text style={[styles.feedbackButtonText, { color: colors.primaryForeground }]}>{feedbackSending ? t('feedbackSending') : t('feedbackSend')}</Text>
            </Pressable>
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
  themeGrid: { flexDirection: 'row', gap: 8, marginTop: 18 },
  themeOption: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 8 },
  themeLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  legalCard: { padding: 15 },
  legalHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  legalDetails: { borderTopWidth: 1, marginTop: 15, paddingTop: 14, gap: 12 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pointText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  feedbackDetails: { borderTopWidth: 1, marginTop: 15, paddingTop: 14, gap: 12 },
  feedbackLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  feedbackTypeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  feedbackType: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 9 },
  feedbackTypeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  feedbackInput: { minHeight: 112, borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  feedbackButton: { minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  feedbackButtonText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
});