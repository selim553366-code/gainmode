import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate, type TranslationKey } from '@/lib/i18n';
import { apiUrl } from '@/lib/api';
import { isDesignPreview } from '@/lib/designPreview';
import { Ionicons } from '@/components/AppIcon';
import { PressableScale as Pressable, Reveal } from '@/components/Motion';
import { FeedbackSent } from '@/components/FeedbackSent';

type FeedbackCategory = 'bug' | 'suggestion' | 'subscription' | 'payment' | 'notifications' | 'other';

const feedbackCategories = [
  { value: 'bug', label: 'feedbackBug', icon: 'alert-circle' },
  { value: 'suggestion', label: 'feedbackSuggestion', icon: 'bulb-outline' },
  { value: 'subscription', label: 'feedbackSubscription', icon: 'trophy-outline' },
  { value: 'payment', label: 'feedbackPayment', icon: 'ticket-outline' },
  { value: 'notifications', label: 'feedbackNotifications', icon: 'notifications-outline' },
  { value: 'other', label: 'feedbackOther', icon: 'ellipsis-horizontal' },
] as const;

/** Feedback form in its own sheet, so Settings stays a short list instead of growing a long form. */
export function FeedbackSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useFit();
  const t = (key: TranslationKey) => translate(language, key);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('suggestion');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'message' | null>(null);
  // Shown inline: alert dialogs do not appear on the web, so a failed send must explain itself in the form.
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const feedbackReady = Boolean(feedbackText.trim() && feedbackEmail.trim()) && !feedbackSending;

  const close = () => {
    onClose();
    setFeedbackSent(false);
    setFeedbackError(null);
  };

  const submitFeedback = async () => {
    const message = feedbackText.trim();
    const replyTo = feedbackEmail.trim().toLowerCase();
    if (!message || !replyTo || feedbackSending) return;
    setFeedbackError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
      setFeedbackError(t('feedbackEmailInvalid'));
      return;
    }
    setFeedbackSending(true);
    try {
      // The web design preview has no reachable server, so it simulates a successful send.
      if (isDesignPreview()) {
        await new Promise((resolve) => setTimeout(resolve, 900));
      } else {
        const response = await fetch(apiUrl('/api/feedback'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, category: feedbackCategory, language, screen: 'settings', replyTo }),
        });
        if (!response.ok) throw new Error('feedback request failed');
      }
      setFeedbackText('');
      setFeedbackEmail('');
      setFeedbackSent(true);
    } catch {
      setFeedbackError(t('feedbackErrorBody'));
    } finally {
      setFeedbackSending(false);
    }
  };

  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
    <View style={[styles.sheet, { backgroundColor: colors.background }]}>
      <View style={styles.sheetHeader}>
        <View style={styles.sheetTitleCopy}>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{t('feedbackTitle')}</Text>
          <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>{t('feedbackDescription')}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('close')} onPress={close} hitSlop={10} style={[styles.close, { backgroundColor: colors.secondary }]}>
          <Ionicons name="close" size={18} color={colors.foreground} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
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
                  onChangeText={(value) => { setFeedbackEmail(value); setFeedbackError(null); }}
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
                  onChangeText={(value) => { setFeedbackText(value); setFeedbackError(null); }}
                  onFocus={() => setFocusedField('message')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t('feedbackPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  textAlignVertical="top"
                  style={[styles.feedbackInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: focusedField === 'message' ? colors.foreground : colors.border }]}
                />
                <Text style={[styles.feedbackCount, { color: colors.mutedForeground }]}>{feedbackText.trim().length}</Text>
                {feedbackError ? <View accessibilityRole="alert" style={[styles.feedbackError, { backgroundColor: `${colors.destructive}12`, borderColor: `${colors.destructive}40` }]}>
                  <Ionicons name="alert-circle" size={16} color={colors.destructive} />
                  <Text style={[styles.feedbackErrorText, { color: colors.destructive }]}>{feedbackError}</Text>
                </View> : null}
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
      </ScrollView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 8 },
  sheetTitleCopy: { flex: 1 },
  sheetTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.7 },
  sheetSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 6 },
  close: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  sheetContent: { paddingHorizontal: 20, paddingTop: 18 },
  feedbackLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1, marginBottom: 10 },
  feedbackTypeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  feedbackFieldLabel: { marginTop: 20 },
  feedbackType: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 6 },
  feedbackTypeText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  feedbackEmailInput: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 15 },
  feedbackHint: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 8 },
  feedbackInput: { minHeight: 132, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 21 },
  feedbackCount: { fontFamily: 'Inter_500Medium', fontSize: 11, textAlign: 'right', marginTop: 6, fontVariant: ['tabular-nums'] },
  feedbackError: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginTop: 14 },
  feedbackErrorText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18 },
  feedbackButton: { minHeight: 54, borderRadius: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, marginTop: 16 },
  feedbackButtonText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
});
