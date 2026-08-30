import React, { useRef, useState } from 'react';
import { Animated, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, Header, Pill } from '@/components/FitUI';

type Message = { id: string; text: string; from: 'coach' | 'user' };

function TypingIndicator({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  const dots = React.useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  React.useEffect(() => {
    const animations = dots.map((dot, index) => Animated.loop(Animated.sequence([
      Animated.delay(index * 130),
      Animated.timing(dot, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.delay(500 - index * 130),
    ])));
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [dots]);
  return <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Text style={[styles.typingLabel, { color: colors.mutedForeground }]}>{label}</Text>
    <View style={styles.typingDots}>{dots.map((dot, index) => <Animated.View key={index} style={[styles.typingDot, { backgroundColor: colors.primary, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />)}</View>
  </View>;
}

export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, profile, username, meals, calorieGoal, proteinGoal, workouts, weight, coachMessagesUsed, incrementCoachUsage, setCoachThinking } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ id: 'welcome', text: t('coachWelcome'), from: 'coach' }]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const aura = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(aura, { toValue: 1, duration: 1800, useNativeDriver: true }), Animated.timing(aura, { toValue: 0, duration: 1800, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [aura]);
  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    if (coachMessagesUsed >= 5) {
      setMessages((current) => [...current, { id: `${Date.now()}-limit`, text: t('coachLimitReached'), from: 'coach' }]);
      return;
    }
    const userMessage = { id: `${Date.now()}`, text: trimmed, from: 'user' as const };
    setMessages((current) => [...current, userMessage]);
    setText('');
    setLoading(true);
    setCoachThinking(true);
    try {
      const context = JSON.stringify({ username, profile, weight, calorieGoal, proteinGoal, meals, workouts: workouts.map((item) => ({ name: item.name, completed: item.completed, exercises: item.exercises.length })) });
      const response = await fetch(`https://${process.env.EXPO_PUBLIC_DOMAIN}/api/ai/coach`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: trimmed, language, context }) });
      if (!response.ok) throw new Error('coach unavailable');
      const result = await response.json() as { content?: string };
      incrementCoachUsage();
      setMessages((current) => [...current, { id: `${Date.now()}-reply`, text: result.content ?? t('coachWelcome'), from: 'coach' }]);
    } catch {
      setMessages((current) => [...current, { id: `${Date.now()}-error`, text: t('coachSubtitle'), from: 'coach' }]);
    } finally {
      setLoading(false);
      setCoachThinking(false);
    }
  };
  return <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 104 }]}>
    <Header eyebrow="Intelligence / 05" title={t('coachTitle')} subtitle={t('coachSubtitle')} action="sparkles-outline" onAction={() => undefined} />
     <Card style={styles.coachCard}><Image source={require('@/assets/images/coach.png')} style={styles.coachAvatar} /><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{t('coachTitle')}</Text></View><View style={styles.limit}><Text style={[styles.limitNumber, { color: colors.foreground }]}>{String(5 - coachMessagesUsed).padStart(2, '0')}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>/ 05</Text></View></Card>
    <View style={styles.suggestions}><Pill label={t('coachExample')} onPress={() => setText(t('coachExample'))} /><Pill label={t('protein')} onPress={() => setText(t('protein'))} /></View>
    <KeyboardAvoidingView style={styles.chatWrap} behavior="padding" keyboardVerticalOffset={0}>
      <FlatList style={styles.messagesList} data={messages} keyExtractor={(item) => item.id} renderItem={({ item }) => <View style={[styles.bubble, item.from === 'user' ? [styles.userBubble, { backgroundColor: colors.primary }] : [styles.coachBubble, { backgroundColor: colors.card, borderColor: colors.border }]]}><Text style={[styles.bubbleText, { color: item.from === 'user' ? colors.primaryForeground : colors.foreground }]}>{item.text}</Text></View>} ListFooterComponent={loading ? <TypingIndicator label={t('coachTyping')} colors={colors} /> : null} contentContainerStyle={styles.messageList} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" />
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8, backgroundColor: colors.background }]}>
        <Animated.View style={[styles.auraInput, { borderColor: colors.primary, shadowColor: colors.primary, opacity: aura.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }) }]}><TextInput ref={inputRef} value={text} onChangeText={setText} onSubmitEditing={send} returnKeyType="send" placeholder={loading ? t('analyzing') : t('askCoach')} placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, color: colors.foreground }]} /></Animated.View>
        <Pressable testID="send-coach-message" onPress={send} style={({ pressed }) => [styles.send, { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="arrow-up" size={19} color={colors.primaryForeground} /></Pressable>
      </View>
    </KeyboardAvoidingView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  coachCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
  coachAvatar: { width: 48, height: 48, borderRadius: 17 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  limit: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  limitNumber: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  suggestions: { flexDirection: 'row', marginBottom: 8, overflow: 'hidden' },
  chatWrap: { flex: 1, minHeight: 0 },
  messagesList: { flex: 1, minHeight: 0 },
  messageList: { paddingVertical: 12, gap: 10 },
  bubble: { maxWidth: '84%', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 18 },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  coachBubble: { alignSelf: 'flex-start', borderWidth: 1, borderBottomLeftRadius: 6 },
  bubbleText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  typingBubble: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 18, borderBottomLeftRadius: 6, paddingHorizontal: 14, paddingVertical: 11 },
  typingLabel: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  typingDots: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 14 },
  typingDot: { width: 5, height: 5, borderRadius: 3 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 9 },
  input: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 17, paddingHorizontal: 15, fontFamily: 'Inter_400Regular', fontSize: 13 },
  auraInput: { flex: 1, borderWidth: 1.5, borderRadius: 19, shadowOpacity: 0.75, shadowRadius: 10, elevation: 3 },
  send: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});