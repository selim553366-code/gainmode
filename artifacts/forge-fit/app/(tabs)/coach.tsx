import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Easing, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons } from '@/components/AppIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, Header, Pill } from '@/components/FitUI';
import { DAILY_COACH_MESSAGE_LIMIT } from '@/lib/usageLimits';
import { getWeeklySummary } from '@/lib/weeklyAnalysis';

type Message = { id: string; text: string; from: 'coach' | 'user'; variant?: 'weeklyAnalysis' };

function TypingIndicator({ label, colors, lightBackground = false }: { label: string; colors: ReturnType<typeof useColors>; lightBackground?: boolean }) {
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
  return <View style={[styles.typingBubble, { backgroundColor: lightBackground ? `${colors.foreground}C7` : colors.card, borderColor: lightBackground ? `${colors.primaryForeground}20` : colors.border }]}>
    <Text style={[styles.typingLabel, { color: lightBackground ? `${colors.primaryForeground}B3` : colors.mutedForeground }]}>{label}</Text>
    <View style={styles.typingDots}>{dots.map((dot, index) => <Animated.View key={index} style={[styles.typingDot, { backgroundColor: colors.primary, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />)}</View>
  </View>;
}

export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, profile, username, meals, calorieGoal, proteinGoal, workouts, weight, weightLogs, coachMessagesUsed, incrementCoachUsage, setCoachThinking, coachIntroPending, markCoachIntroSeen } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const { weeklyAnalysis, analysisId } = useLocalSearchParams<{ weeklyAnalysis?: string; analysisId?: string }>();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ id: 'welcome', text: t('coachWelcome'), from: 'coach' }]);
  const [loading, setLoading] = useState(false);
  const [chatOriginY, setChatOriginY] = React.useState(0);
  const [coachMessageOffsetY, setCoachMessageOffsetY] = React.useState(12);
  const inputRef = useRef<TextInput>(null);
  const aura = useRef(new Animated.Value(0)).current;
  const coachReveal = useRef(new Animated.Value(0)).current;
  const weeklyCardReveal = useRef(new Animated.Value(0)).current;
  const lastAnalysisId = useRef<string | undefined>(undefined);
  const screenSize = Dimensions.get('window');
  const revealScale = Math.max(34, Math.ceil(Math.hypot(screenSize.width, screenSize.height) / 28));
  const flyingAvatarSize = 72;
  const targetAvatarSize = 30;
  const tabBarBottomPadding = Math.max(insets.bottom, 10);
  const flyingStartX = screenSize.width / 2 - flyingAvatarSize / 2;
  const flyingStartY = screenSize.height - tabBarBottomPadding - 120;
  const flyingTargetX = 20;
  const flyingTargetY = chatOriginY + coachMessageOffsetY + 2;
  React.useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(aura, { toValue: 1, duration: 1800, useNativeDriver: true }), Animated.timing(aura, { toValue: 0, duration: 1800, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [aura]);
  useFocusEffect(React.useCallback(() => {
    if (coachIntroPending) markCoachIntroSeen();
    coachReveal.setValue(0);
    const animation = Animated.timing(coachReveal, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [coachIntroPending, coachReveal, markCoachIntroSeen]));
  const requestCoach = async (message: string, displayMessage: Message) => {
    if (!message.trim() || loading) return;
    if (coachMessagesUsed >= DAILY_COACH_MESSAGE_LIMIT) {
      setMessages((current) => [...current, { id: `${Date.now()}-limit`, text: t('coachLimitReached'), from: 'coach' }]);
      return;
    }
    setMessages((current) => [...current, displayMessage]);
    setLoading(true);
    setCoachThinking(true);
    try {
      const weeklySummary = getWeeklySummary({ weight, weightLogs, meals, workouts, calorieGoal, goal: profile?.goal });
      const context = JSON.stringify({ username, profile, equipmentDetails: profile?.equipmentDetails ?? '', weight, calorieGoal, proteinGoal, meals, workouts: workouts.map((item) => ({ name: item.name, completed: item.completed, duration: item.duration, sets: item.exercises.reduce((sum, exercise) => sum + exercise.sets, 0), exercises: item.exercises.length })), weeklySummary });
      const response = await fetch(`https://${process.env.EXPO_PUBLIC_DOMAIN}/api/ai/coach`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: message.trim(), language, context }) });
      if (!response.ok) throw new Error('coach unavailable');
      const result = await response.json() as { content?: string };
      incrementCoachUsage();
      setMessages((current) => [...current, { id: `${Date.now()}-reply`, text: result.content ?? t('coachWelcome'), from: 'coach' }]);
    } catch {
      setMessages((current) => [...current, { id: `${Date.now()}-error`, text: t('weeklyAnalysisFailed'), from: 'coach' }]);
    } finally {
      setLoading(false);
      setCoachThinking(false);
    }
  };
  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    void requestCoach(trimmed, { id: `${Date.now()}`, text: trimmed, from: 'user' });
  };
  React.useEffect(() => {
    if (weeklyAnalysis !== '1' || !analysisId || lastAnalysisId.current === analysisId) return undefined;
    lastAnalysisId.current = analysisId;
    weeklyCardReveal.setValue(0);
    const animation = Animated.timing(weeklyCardReveal, { toValue: 1, duration: 1050, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    const summary = getWeeklySummary({ weight, weightLogs, meals, workouts, calorieGoal, goal: profile?.goal });
    const weeklyPrompt = `Create a concise written weekly fitness analysis from the user's real data. Mention progress, training volume, calorie consistency, one clear next step, and end with warm motivation. Never invent missing data. This is a weekly review, not medical advice. Weekly summary: ${JSON.stringify(summary)}`;
    const timeout = setTimeout(() => {
      void requestCoach(weeklyPrompt, { id: `weekly-${analysisId}`, text: t('weeklyAnalysisCard'), from: 'user', variant: 'weeklyAnalysis' });
    }, 760);
    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, [analysisId, weeklyAnalysis]);
  return <View style={[styles.root, { backgroundColor: 'transparent', paddingTop: insets.top + 16, paddingBottom: insets.bottom + 104 }]}>
    <View pointerEvents="none" style={styles.coachBackgroundLayer}><Animated.Image source={require('@/assets/images/coach-background.jpeg')} resizeMode="cover" style={[styles.coachBackground, { opacity: coachReveal.interpolate({ inputRange: [0, 0.38, 0.78, 1], outputRange: [0, 0.08, 0.72, 1] }) }]} /></View>
    <Animated.View pointerEvents="none" style={[styles.coachReveal, { backgroundColor: colors.foreground, opacity: coachReveal.interpolate({ inputRange: [0, 0.55, 0.86, 1], outputRange: [0.96, 0.92, 0.28, 0] }), transform: [{ scale: coachReveal.interpolate({ inputRange: [0, 0.68, 1], outputRange: [1, revealScale * 0.88, revealScale] }) }] }]} />
    <Header eyebrow="Intelligence / 05" title={t('coachTitle')} subtitle={t('coachSubtitle')} action="sparkles-outline" actionLogo onAction={() => undefined} lightBackground />
    <Card style={[styles.coachCard, { backgroundColor: `${colors.foreground}B8`, borderColor: `${colors.foreground}99` }]}><View style={styles.coachCapabilityCopy}><Text style={[styles.coachCapabilityLabel, { color: `${colors.primaryForeground}99` }]}>{t('coachAiLabel').toUpperCase()}</Text><Text style={[styles.coachCapabilityText, { color: colors.primaryForeground }]}>{t('coachAiCapabilities')}</Text></View></Card>
    <View pointerEvents="none" style={styles.analysisFlightLayer}>
      <Animated.View style={[styles.analysisFlightCard, { backgroundColor: colors.primaryForeground, opacity: weeklyCardReveal.interpolate({ inputRange: [0, 0.72, 1], outputRange: [1, 0.9, 0] }), transform: [{ translateX: weeklyCardReveal.interpolate({ inputRange: [0, 1], outputRange: [0, 20 - (screenSize.width / 2 - 130)] }) }, { translateY: weeklyCardReveal.interpolate({ inputRange: [0, 1], outputRange: [0, chatOriginY + 42 - (screenSize.height - 220)] }) }, { scale: weeklyCardReveal.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 0.84, 0.68] }) }] }]}><Ionicons name="sparkles" size={16} color={colors.primary} /><Text style={[styles.analysisFlightText, { color: colors.primary }]}>{t('weeklyAnalysisReading')}</Text></Animated.View>
    </View>
    <View pointerEvents="none" style={styles.coachFlightLayer}>
      <Animated.Image
        source={require('@/assets/images/coach-tab-custom.jpeg')}
        resizeMode="cover"
        style={[styles.coachFlyingAvatar, {
          left: flyingStartX,
          top: flyingStartY,
           opacity: coachReveal.interpolate({ inputRange: [0, 0.78, 0.96, 1], outputRange: [1, 1, 0.98, 0] }),
          transform: [
            { translateX: coachReveal.interpolate({ inputRange: [0, 1], outputRange: [0, flyingTargetX - flyingStartX] }) },
            { translateY: coachReveal.interpolate({ inputRange: [0, 1], outputRange: [0, flyingTargetY - flyingStartY] }) },
             { scale: coachReveal.interpolate({ inputRange: [0, 0.84, 1], outputRange: [1, 0.56, targetAvatarSize / flyingAvatarSize] }) },
          ],
        }]}
      />
    </View>
    <View style={styles.suggestions}><Pill label={t('coachExample')} onPress={() => setText(t('coachExample'))} lightBackground /><Pill label={t('protein')} onPress={() => setText(t('protein'))} lightBackground /></View>
    <KeyboardAvoidingView onLayout={({ nativeEvent }) => setChatOriginY(nativeEvent.layout.y)} style={styles.chatWrap} behavior="padding" keyboardVerticalOffset={0}>
      <FlatList
        style={styles.messagesList}
        data={messages}
        keyExtractor={(item) => item.id}
         renderItem={({ item }) => <View
          onLayout={item.from === 'coach' && item.id === 'welcome' ? ({ nativeEvent }) => setCoachMessageOffsetY(nativeEvent.layout.y) : undefined}
          style={[styles.messageRow, item.from === 'user' ? styles.userMessageRow : styles.coachMessageRow]}
        >
          {item.from === 'coach' ? <Animated.Image source={require('@/assets/images/coach-tab-custom.jpeg')} resizeMode="cover" style={[styles.messageAvatar, { opacity: item.id === 'welcome' ? coachReveal.interpolate({ inputRange: [0, 0.84, 0.96, 1], outputRange: [0, 0, 0.42, 1] }) : 1 }]} /> : null}
           {item.variant === 'weeklyAnalysis' ? <View style={[styles.weeklyMessageCard, { backgroundColor: `${colors.primaryForeground}F2`, borderColor: `${colors.primaryForeground}45` }]}><View style={[styles.weeklyMessageIcon, { backgroundColor: `${colors.primary}22` }]}><Ionicons name="analytics-outline" size={16} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.weeklyMessageLabel, { color: colors.primary }]}>{item.text}</Text><Text style={[styles.weeklyMessageHint, { color: `${colors.foreground}8C` }]}>{t('weeklyAnalysisReading')}</Text></View><Ionicons name="checkmark-circle" size={17} color={colors.success} /></View> : <View style={[styles.bubble, item.from === 'user' ? [styles.userBubble, { backgroundColor: colors.primaryForeground }] : [styles.coachBubble, { backgroundColor: `${colors.foreground}C7`, borderColor: `${colors.primaryForeground}20` }]]}><Text style={[styles.bubbleText, { color: item.from === 'user' ? colors.foreground : colors.primaryForeground }]}>{item.text}</Text></View>}
        </View>}
        ListFooterComponent={loading ? <TypingIndicator label={t('coachTyping')} colors={colors} lightBackground /> : null}
        contentContainerStyle={styles.messageList}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8, backgroundColor: 'transparent' }]}>
        <Animated.View style={[styles.auraInput, { borderColor: colors.primaryForeground, shadowColor: colors.primary, opacity: aura.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }) }]}><TextInput ref={inputRef} value={text} onChangeText={setText} onSubmitEditing={send} returnKeyType="send" placeholder={loading ? t('analyzing') : t('askCoach')} placeholderTextColor={`${colors.primaryForeground}8C`} style={[styles.input, { backgroundColor: `${colors.foreground}C7`, color: colors.primaryForeground, borderColor: `${colors.primaryForeground}20` }]} /></Animated.View>
         <Pressable testID="send-coach-message" onPress={send} style={({ pressed }) => [styles.send, { backgroundColor: colors.primaryForeground, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="arrow-up" size={19} color={colors.foreground} /></Pressable>
      </View>
    </KeyboardAvoidingView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  coachBackgroundLayer: { ...StyleSheet.absoluteFillObject },
  coachBackground: { ...StyleSheet.absoluteFillObject },
  coachReveal: { position: 'absolute', width: 56, height: 56, borderRadius: 28, left: '50%', marginLeft: -28, bottom: 44, shadowColor: '#FFFFFF', shadowOpacity: 0.52, shadowRadius: 28, shadowOffset: { width: 0, height: 0 }, elevation: 14 },
  coachFlightLayer: { ...StyleSheet.absoluteFillObject, zIndex: 4 },
  analysisFlightLayer: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
  analysisFlightCard: { position: 'absolute', left: '50%', top: '100%', width: 260, marginLeft: -130, minHeight: 52, borderRadius: 17, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  analysisFlightText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 11 },
  coachFlyingAvatar: { position: 'absolute', width: 72, height: 72, borderRadius: 36, shadowColor: '#FFFFFF', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
  coachCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
  coachCapabilityCopy: { flex: 1, paddingRight: 4 },
  coachCapabilityLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.2 },
  coachCapabilityText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18, marginTop: 5 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  limit: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  limitNumber: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  suggestions: { flexDirection: 'row', marginBottom: 8, overflow: 'hidden' },
  chatWrap: { flex: 1, minHeight: 0 },
  messagesList: { flex: 1, minHeight: 0 },
  messageList: { paddingVertical: 12, gap: 10 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  coachMessageRow: { alignSelf: 'flex-start', maxWidth: '90%' },
  userMessageRow: { alignSelf: 'flex-end', maxWidth: '84%' },
  weeklyMessageCard: { minWidth: 255, maxWidth: '100%', borderRadius: 18, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  weeklyMessageIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  weeklyMessageLabel: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  weeklyMessageHint: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 3 },
  messageAvatar: { width: 30, height: 30, borderRadius: 15, marginTop: 2 },
  bubble: { maxWidth: '84%', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 18 },
  userBubble: { borderBottomRightRadius: 6 },
  coachBubble: { borderWidth: 1, borderBottomLeftRadius: 6 },
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