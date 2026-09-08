import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Easing, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons } from '@/components/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Header } from '@/components/FitUI';
import { DAILY_COACH_MESSAGE_LIMIT } from '@/lib/usageLimits';
import { getWeeklySummary } from '@/lib/weeklyAnalysis';
import { validateCoachActions, type CoachAction } from '@/lib/coachActions';
import { apiUrl } from '@/lib/api';

type Message = { id: string; text: string; from: 'coach' | 'user'; variant?: 'weeklyAnalysis'; media?: 'welcomeGif'; actions?: CoachAction[]; actionStatus?: 'pending' | 'applied' | 'rejected' };
type CoachApiResponse = { content?: string; actions?: unknown[] };

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
  return <View style={[styles.typingBubble, { backgroundColor: colors.white, borderColor: colors.border }]}>
    <Text style={[styles.typingLabel, { color: colors.black }]}>{label}</Text>
    <View style={styles.typingDots}>{dots.map((dot, index) => <Animated.View key={index} style={[styles.typingDot, { backgroundColor: colors.primary, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />)}</View>
  </View>;
}

export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, profile, username, meals, calorieGoal, proteinGoal, carbsGoal, fatGoal, workouts, weight, weightLogs, coachMessagesUsed, incrementCoachUsage, setCoachThinking, coachIntroPending, markCoachIntroSeen, addExercise, removeExercise, updateExercise, updateWorkout, updateProfile, updateNutritionGoals } = useFit();
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
    const timeout = setTimeout(() => {
      setMessages((current) => current.some((item) => item.id === 'welcome-gif') ? current : [...current, { id: 'welcome-gif', text: '', from: 'coach', media: 'welcomeGif' }]);
    }, 1350);
    return () => clearTimeout(timeout);
  }, []);
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
    const prompt = message.trim();
    if (!prompt || loading) return;
    if (coachMessagesUsed >= DAILY_COACH_MESSAGE_LIMIT) {
      setMessages((current) => [...current, { id: `${Date.now()}-limit`, text: t('coachLimitReached'), from: 'coach' }]);
      return;
    }
    const weeklySummary = getWeeklySummary({ weight, weightLogs, meals, workouts, calorieGoal, goal: profile?.goal });
    const isMuscleGoal = profile?.goal === 'muscle';
    const context = JSON.stringify({ username, profile, weight, weightLogs, calorieGoal, macroGoals: { protein: proteinGoal, carbs: carbsGoal, fat: fatGoal }, meals, workouts: workouts.map((item) => ({ id: item.id, day: item.day, name: item.name, completed: item.completed, duration: item.duration, exercises: item.exercises.map((exercise) => ({ id: exercise.id, name: translate(language, exercise.name as Parameters<typeof translate>[1]) || exercise.name, sets: exercise.sets, reps: exercise.reps, completed: exercise.completed })) })), weeklySummary });
    setMessages((current) => [...current, displayMessage]);
    setLoading(true);
    setCoachThinking(true);
    try {
      const response = await fetch(apiUrl('/api/ai/coach'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: prompt, language, context }) });
      if (!response.ok) throw new Error('coach unavailable');
       const result = await response.json() as CoachApiResponse;
      incrementCoachUsage();
       const actions = validateCoachActions(result.actions, workouts);
        setMessages((current) => [...current, { id: `${Date.now()}-reply`, text: result.content ?? t('coachWelcome'), from: 'coach', ...(actions.length > 0 ? { actions, actionStatus: 'pending' as const } : {}) }]);
    } catch {
      setMessages((current) => [...current, { id: `${Date.now()}-error`, text: t('weeklyAnalysisFailed'), from: 'coach' }]);
    } finally {
      setLoading(false);
      setCoachThinking(false);
    }
  };
  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    if (coachMessagesUsed >= DAILY_COACH_MESSAGE_LIMIT) {
      setMessages((current) => [...current, { id: `${Date.now()}-limit`, text: t('coachLimitReached'), from: 'coach' }]);
      return;
    }
    setText('');
    void requestCoach(trimmed, { id: `${Date.now()}`, text: trimmed, from: 'user' });
  };
  const actionLabel = (action: CoachAction) => {
    if (action.type === 'add_exercise') return `${t('coachChangeAdd')}: ${action.name}`;
    if (action.type === 'remove_exercise') return t('coachChangeRemove');
    if (action.type === 'update_exercise') return t('coachChangeUpdate');
    if (action.type === 'update_workout') return t('coachChangeWorkout');
    if (action.type === 'update_profile') return t('coachChangeProfile');
    return t('coachChangeNutrition');
  };
  const applyActions = (messageId: string, actions: CoachAction[]) => {
    actions.forEach((action) => {
      if (action.type === 'add_exercise') addExercise(action.workoutId, action.name, action.sets, action.reps);
      if (action.type === 'remove_exercise') removeExercise(action.workoutId, action.exerciseId);
      if (action.type === 'update_exercise') updateExercise(action.workoutId, action.exerciseId, { ...(action.name !== undefined ? { name: action.name } : {}), ...(action.sets !== undefined ? { sets: action.sets } : {}), ...(action.reps !== undefined ? { reps: action.reps } : {}) });
      if (action.type === 'update_workout') updateWorkout(action.workoutId, { ...(action.day !== undefined ? { day: action.day } : {}), ...(action.name !== undefined ? { name: action.name } : {}), ...(action.duration !== undefined ? { duration: action.duration } : {}) });
      if (action.type === 'update_profile') updateProfile(action.patch);
      if (action.type === 'update_nutrition') updateNutritionGoals(action);
    });
    setMessages((current) => current.map((item) => item.id === messageId ? { ...item, actionStatus: 'applied' } : item));
  };
  const rejectActions = (messageId: string) => {
    setMessages((current) => current.map((item) => item.id === messageId ? { ...item, actionStatus: 'rejected' } : item));
  };
  React.useEffect(() => {
    if (weeklyAnalysis !== '1' || !analysisId || lastAnalysisId.current === analysisId) return undefined;
    lastAnalysisId.current = analysisId;
    weeklyCardReveal.setValue(0);
    const animation = Animated.timing(weeklyCardReveal, { toValue: 1, duration: 1050, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    const summary = getWeeklySummary({ weight, weightLogs, meals, workouts, calorieGoal, goal: profile?.goal });
     const weeklyPrompt = `Create a concise written weekly fitness analysis from the user's real data. Do not merely repeat metric values: interpret what they mean, assess progress, identify one strength and one weakness or uncertainty, and give 1-2 actionable recommendations. If the data is insufficient or no change is needed, say that clearly and explain what to monitor next. Never invent missing data. This is a weekly review, not medical advice. If the user's goal is muscle building, focus on training volume, consistency, and strength progress; do not mention weight change or weight logs. Reply entirely in the user's selected language. Weekly summary: ${JSON.stringify(summary)}`;
    const timeout = setTimeout(() => {
     void requestCoach(weeklyPrompt, { id: `weekly-${analysisId}`, text: t('weeklyAnalysisCard'), from: 'user', variant: 'weeklyAnalysis' });
    }, 760);
    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, [analysisId, weeklyAnalysis]);
  return <View style={[styles.root, { backgroundColor: colors.white, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 104 }]}>
    <View pointerEvents="none" style={styles.coachBackgroundLayer}>
      <LinearGradient colors={[colors.secondary, colors.white]} style={StyleSheet.absoluteFillObject} />
      <Animated.Image source={require('@/assets/images/coach-background.jpeg')} resizeMode="cover" style={[styles.coachBackground, { opacity: coachReveal.interpolate({ inputRange: [0, 0.38, 0.78, 1], outputRange: [0, 0.08, 0.72, 1] }) }]} />
    </View>
    <Animated.View pointerEvents="none" style={[styles.coachReveal, { backgroundColor: colors.secondary, opacity: coachReveal.interpolate({ inputRange: [0, 0.55, 0.86, 1], outputRange: [0.96, 0.92, 0.28, 0] }), transform: [{ scale: coachReveal.interpolate({ inputRange: [0, 0.68, 1], outputRange: [1, revealScale * 0.88, revealScale] }) }] }]} />
    <Header eyebrow="Intelligence / 05" title={t('coachTitle')} subtitle={t('coachSubtitle')} action="chatbubble-ellipses-outline" onAction={() => undefined} />
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
           <View style={styles.messageContent}>
               {item.variant === 'weeklyAnalysis' ? <View style={[styles.weeklyMessageCard, { backgroundColor: colors.white, borderColor: colors.border }]}><View style={[styles.weeklyMessageIcon, { backgroundColor: `${colors.primary}22` }]}><Ionicons name="analytics-outline" size={16} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.weeklyMessageLabel, { color: colors.primary }]}>{item.text}</Text><Text style={[styles.weeklyMessageHint, { color: colors.mutedForeground }]}>{t('weeklyAnalysisReading')}</Text></View><Ionicons name="checkmark-circle" size={17} color={colors.success} /></View> : item.media === 'welcomeGif' ? <View style={[styles.welcomeGifCard, { backgroundColor: colors.white, borderColor: colors.border }]}><Image source={require('@/assets/images/coach-welcome-animation.gif')} resizeMode="cover" style={styles.welcomeGif} accessibilityLabel={t('coachWelcomeGifLabel')} /></View> : <View style={[styles.bubble, item.from === 'user' ? [styles.userBubble, { backgroundColor: colors.black }] : [styles.coachBubble, { backgroundColor: colors.white }]]}>{item.text ? <Text style={[styles.bubbleText, { color: item.from === 'user' ? colors.white : colors.black }]}>{item.text}</Text> : null}</View>}
               {item.actions?.length ? <View style={[styles.actionCard, { backgroundColor: colors.white, borderColor: colors.border }]}><Text style={[styles.actionTitle, { color: colors.black }]}>{t('coachConfirmQuestion')}</Text>{item.actions.map((action, index) => <Text key={`${item.id}-action-${index}`} style={[styles.actionLine, { color: colors.black }]}>• {actionLabel(action)}</Text>)}{item.actionStatus === 'pending' ? <View style={styles.actionButtons}><Pressable onPress={() => applyActions(item.id, item.actions ?? [])} style={[styles.actionButton, { backgroundColor: colors.primary }]}><Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>{t('coachConfirm')}</Text></Pressable><Pressable onPress={() => rejectActions(item.id)} style={[styles.actionButton, { borderColor: colors.border, borderWidth: 1 }]}><Text style={[styles.actionButtonText, { color: colors.black }]}>{t('coachReject')}</Text></Pressable></View> : <View><Text style={[styles.actionStatus, { color: item.actionStatus === 'applied' ? colors.success : colors.mutedForeground }]}>{item.actionStatus === 'applied' ? t('coachChangeApplied') : t('coachChangeRejected')}</Text>{item.actionStatus === 'applied' ? <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)')} style={[styles.refreshButton, { backgroundColor: colors.success }]}><Ionicons name="arrow-forward" size={15} color={colors.primaryForeground} /><Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>{t('refreshPages')}</Text></Pressable> : null}</View>}</View> : null}
           </View>
        </View>}
        ListFooterComponent={loading ? <TypingIndicator label={t('coachTyping')} colors={colors} /> : null}
        contentContainerStyle={styles.messageList}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />
       <View style={[styles.inputRow, { paddingBottom: insets.bottom + 12, backgroundColor: 'transparent' }]}>
         <Animated.View style={[styles.auraInput, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.primary, opacity: aura.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }]}>
            <TextInput ref={inputRef} value={text} onChangeText={setText} onSubmitEditing={send} returnKeyType="send" placeholder={loading ? t('analyzing') : t('askCoach')} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground }]} />
           <Pressable testID="send-coach-message" onPress={send} style={({ pressed }) => [styles.send, { backgroundColor: colors.foreground, opacity: pressed ? 0.75 : 1 }]}><Ionicons name="arrow-up" size={18} color={colors.background} /></Pressable>
         </Animated.View>
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
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  limit: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  limitNumber: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  chatWrap: { flex: 1, minHeight: 0 },
  messagesList: { flex: 1, minHeight: 0 },
  messageList: { paddingVertical: 20, gap: 16 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  coachMessageRow: { alignSelf: 'flex-start', maxWidth: '90%' },
  userMessageRow: { alignSelf: 'flex-end', maxWidth: '90%' },
  messageContent: { flex: 1, minWidth: 0 },
  weeklyMessageCard: { minWidth: 255, maxWidth: '100%', borderRadius: 24, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  weeklyMessageIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  weeklyMessageLabel: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  weeklyMessageHint: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 3 },
  messageAvatar: { width: 30, height: 30, borderRadius: 15, marginTop: 2 },
  bubble: { maxWidth: '92%', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 24 },
  userBubble: { borderBottomRightRadius: 8 },
  coachBubble: { borderTopLeftRadius: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  actionCard: { marginTop: 8, borderRadius: 20, borderWidth: 1, padding: 16, width: '100%' },
  actionTitle: { fontFamily: 'Inter_700Bold', fontSize: 12, marginBottom: 7 },
  actionLine: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, marginBottom: 3 },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionButton: { minHeight: 34, borderRadius: 11, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  actionStatus: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 7 },
  refreshButton: { minHeight: 36, alignSelf: 'flex-start', marginTop: 10, borderRadius: 11, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  messageImage: { width: 190, height: 145, borderRadius: 12, marginBottom: 7 },
  welcomeGifCard: { width: 250, borderWidth: 1, borderRadius: 24, borderTopLeftRadius: 8, padding: 6, overflow: 'hidden' },
  welcomeGif: { width: 238, height: 178, borderRadius: 19 },
  bubbleText: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  typingBubble: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 24, borderTopLeftRadius: 8, paddingHorizontal: 18, paddingVertical: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  typingLabel: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  typingDots: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 14 },
  typingDot: { width: 5, height: 5, borderRadius: 3 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 4, paddingTop: 12 },
  attach: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 64, maxHeight: 120, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  auraInput: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 32, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  photoPreview: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9, padding: 8, borderRadius: 15, borderWidth: 1 },
  photoPreviewImage: { width: 46, height: 46, borderRadius: 10 },
  photoPreviewCopy: { flex: 1, minWidth: 0 },
  photoPreviewTitle: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  photoPreviewHint: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
});