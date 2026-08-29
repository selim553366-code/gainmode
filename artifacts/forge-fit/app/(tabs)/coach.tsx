import React, { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, Header, Pill, Screen } from '@/components/FitUI';

type Message = { id: string; text: string; from: 'coach' | 'user' };

export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ id: 'welcome', text: t('coachWelcome'), from: 'coach' }]);
  const inputRef = useRef<TextInput>(null);
  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, { id: `${Date.now()}`, text: trimmed, from: 'user' }, { id: `${Date.now()}-reply`, text: t('coachWelcome'), from: 'coach' }]);
    setText('');
    inputRef.current?.focus();
  };
  return <Screen scroll={false}>
    <Header eyebrow="Intelligence / 05" title={t('coachTitle')} subtitle={t('coachSubtitle')} action="sparkles-outline" onAction={() => undefined} />
    <Card style={styles.coachCard}><View style={[styles.coachOrb, { backgroundColor: colors.primary }]}><Ionicons name="sparkles" size={22} color={colors.primaryForeground} /></View><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{t('coachTitle')}</Text><Text style={[styles.caption, { color: colors.success }]}>{t('online')}</Text></View><View style={styles.limit}><Text style={[styles.limitNumber, { color: colors.foreground }]}>05</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>/ 05</Text></View></Card>
    <View style={styles.suggestions}><Pill label={t('coachExample')} onPress={() => setText(t('coachExample'))} /><Pill label={t('protein')} onPress={() => setText(t('protein'))} /></View>
    <KeyboardAvoidingView style={styles.chatWrap} behavior="padding" keyboardVerticalOffset={0}>
      <FlatList data={messages} keyExtractor={(item) => item.id} renderItem={({ item }) => <View style={[styles.bubble, item.from === 'user' ? [styles.userBubble, { backgroundColor: colors.primary }] : [styles.coachBubble, { backgroundColor: colors.card, borderColor: colors.border }]]}><Text style={[styles.bubbleText, { color: item.from === 'user' ? colors.primaryForeground : colors.foreground }]}>{item.text}</Text></View>} contentContainerStyle={styles.messageList} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" />
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8, backgroundColor: colors.background }]}>
        <TextInput ref={inputRef} value={text} onChangeText={setText} onSubmitEditing={send} returnKeyType="send" placeholder={t('askCoach')} placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
        <Pressable testID="send-coach-message" onPress={send} style={({ pressed }) => [styles.send, { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="arrow-up" size={19} color={colors.primaryForeground} /></Pressable>
      </View>
    </KeyboardAvoidingView>
  </Screen>;
}

const styles = StyleSheet.create({
  coachCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
  coachOrb: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  limit: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  limitNumber: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  suggestions: { flexDirection: 'row', marginBottom: 8, overflow: 'hidden' },
  chatWrap: { flex: 1, minHeight: 350 },
  messageList: { paddingVertical: 12, gap: 10 },
  bubble: { maxWidth: '84%', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 18 },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  coachBubble: { alignSelf: 'flex-start', borderWidth: 1, borderBottomLeftRadius: 6 },
  bubbleText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 9 },
  input: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 17, paddingHorizontal: 15, fontFamily: 'Inter_400Regular', fontSize: 13 },
  send: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});