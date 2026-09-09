import React, { useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Animated, Dimensions, Easing, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons } from '@/components/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { DAILY_COACH_MESSAGE_LIMIT } from '@/lib/usageLimits';
import { getWeeklySummary } from '@/lib/weeklyAnalysis';
import { validateCoachActions, type CoachAction } from '@/lib/coachActions';
import { apiUrl } from '@/lib/api';
import { localDateKey } from '@/lib/nutritionDates';

type Message = { id: string; text: string; from: 'coach' | 'user'; variant?: 'weeklyAnalysis'; media?: 'welcomeGif'; actions?: CoachAction[]; actionStatus?: 'pending' | 'applied' | 'rejected' };
type CoachApiResponse = { content?: string; actions?: unknown[] };
type CoachAtmosphere = 'morning' | 'night';

const COACH_STARS = [
  { x: 9, y: 13, size: 2, delay: 0 },
  { x: 21, y: 27, size: 3, delay: 850 },
  { x: 36, y: 11, size: 2, delay: 1400 },
  { x: 49, y: 20, size: 2, delay: 480 },
  { x: 64, y: 9, size: 3, delay: 1900 },
  { x: 79, y: 18, size: 2, delay: 1120 },
  { x: 91, y: 12, size: 2, delay: 2300 },
  { x: 14, y: 42, size: 2, delay: 1750 },
  { x: 30, y: 51, size: 3, delay: 620 },
  { x: 46, y: 39, size: 2, delay: 2650 },
  { x: 58, y: 56, size: 2, delay: 920 },
  { x: 73, y: 43, size: 3, delay: 2100 },
  { x: 87, y: 53, size: 2, delay: 320 },
  { x: 7, y: 68, size: 2, delay: 1280 },
  { x: 23, y: 79, size: 2, delay: 2380 },
  { x: 41, y: 72, size: 3, delay: 760 },
  { x: 56, y: 86, size: 2, delay: 1600 },
  { x: 69, y: 69, size: 2, delay: 2850 },
  { x: 84, y: 80, size: 3, delay: 1060 },
  { x: 96, y: 66, size: 2, delay: 1980 },
] as const;

function getCoachAtmosphere(date = new Date()): CoachAtmosphere {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes >= 21 * 60 || minutes < 6 * 60) return 'night';
  return 'morning';
}

function TwinklingStar({ star, color }: { star: (typeof COACH_STARS)[number]; color: string }) {
  const twinkle = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(star.delay),
      Animated.timing(twinkle, { toValue: 1, duration: 1050, useNativeDriver: true }),
      Animated.timing(twinkle, { toValue: 0, duration: 1450, useNativeDriver: true }),
      Animated.delay(1100 + star.delay / 2),
    ]));
    animation.start();
    return () => animation.stop();
  }, [star.delay, twinkle]);

  return <Animated.View style={[styles.coachStar, {
    left: `${star.x}%`,
    top: `${star.y}%`,
    width: star.size,
    height: star.size,
    borderRadius: star.size / 2,
    backgroundColor: color,
    opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.28, 1] }),
    transform: [{ scale: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1.65] }) }],
  }]} />;
}

function CoachAtmosphereBackground({ colors, reveal, overrideAtmosphere }: { colors: ReturnType<typeof useColors>; reveal: Animated.Value; overrideAtmosphere: CoachAtmosphere | null }) {
  const initialAtmosphere = React.useMemo(() => getCoachAtmosphere(), []);
  const [atmosphere, setAtmosphere] = React.useState<CoachAtmosphere>(initialAtmosphere);
  const [previousAtmosphere, setPreviousAtmosphere] = React.useState<CoachAtmosphere>(initialAtmosphere);
  const transition = React.useRef(new Animated.Value(1)).current;
  const ambientMotion = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(ambientMotion, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(ambientMotion, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [ambientMotion]);

  React.useEffect(() => {
    const transitionTo = (nextAtmosphere: CoachAtmosphere) => {
      if (nextAtmosphere === atmosphere) return;
      setPreviousAtmosphere(atmosphere);
      setAtmosphere(nextAtmosphere);
      transition.setValue(0);
      Animated.timing(transition, {
        toValue: 1,
        duration: 90000,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setPreviousAtmosphere(nextAtmosphere);
      });
    };
    transitionTo(overrideAtmosphere ?? getCoachAtmosphere());
    if (overrideAtmosphere !== null) return undefined;
    const checkAtmosphere = () => transitionTo(getCoachAtmosphere());
    const interval = setInterval(checkAtmosphere, 60000);
    return () => clearInterval(interval);
  }, [atmosphere, overrideAtmosphere, transition]);

  const renderAtmosphere = (phase: CoachAtmosphere) => {
    if (phase === 'morning') {
      return <View style={styles.coachAtmosphereLayer}>
        <LinearGradient colors={[colors.coachMorningGlow, colors.white]} style={StyleSheet.absoluteFill} />
        <Animated.Image source={require('@/assets/images/coach-background.jpeg')} resizeMode="cover" style={[styles.coachBackground, { opacity: reveal.interpolate({ inputRange: [0, 0.38, 0.78, 1], outputRange: [0, 0.08, 0.72, 1] }) }]} />
      </View>;
    }
    return <Animated.View style={[styles.coachAtmosphereLayer, {
      opacity: reveal.interpolate({ inputRange: [0, 0.38, 0.78, 1], outputRange: [0, 0.08, 0.72, 1] }),
    }]}>
      <LinearGradient
        colors={[colors.coachNightPurple, colors.coachNightDeep, colors.coachNightBlack]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.coachNightGlow, {
        opacity: ambientMotion.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.3] }),
        transform: [{ translateX: ambientMotion.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] }) }, { translateY: ambientMotion.interpolate({ inputRange: [0, 1], outputRange: [12, -12] }) }],
      }]}>
        <LinearGradient colors={[`${colors.plum}70`, colors.coachTransparent]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View style={styles.coachStarField}>{COACH_STARS.map((star) => <TwinklingStar key={`${star.x}-${star.y}`} star={star} color={colors.coachStar} />)}</View>
    </Animated.View>;
  };

  const isTransitioning = previousAtmosphere !== atmosphere;
  return <View pointerEvents="none" style={styles.coachBackgroundLayer}>
    {isTransitioning ? <Animated.View style={[styles.coachAtmosphereLayer, { opacity: transition.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>{renderAtmosphere(previousAtmosphere)}</Animated.View> : null}
    <Animated.View style={[styles.coachAtmosphereLayer, { opacity: isTransitioning ? transition : 1 }]}>{renderAtmosphere(atmosphere)}</Animated.View>
  </View>;
}

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
  const [animatedPrompt, setAnimatedPrompt] = useState('');
  const [dailyRating, setDailyRating] = useState<number | null>(null);
  const [ratingLoaded, setRatingLoaded] = useState(false);
  const [ratingSending, setRatingSending] = useState<number | null>(null);
  const [ratedMessageId, setRatedMessageId] = useState<string | null>(null);
  const [previewAtmosphere, setPreviewAtmosphere] = useState<CoachAtmosphere | null>(null);
  const [chatOriginY, setChatOriginY] = React.useState(0);
  const [coachMessageOffsetY, setCoachMessageOffsetY] = React.useState(12);
  const inputRef = useRef<TextInput>(null);
  const coachReveal = useRef(new Animated.Value(0)).current;
  const weeklyCardReveal = useRef(new Animated.Value(0)).current;
  const lastAnalysisId = useRef<string | undefined>(undefined);
  const screenSize = Dimensions.get('window');
  const revealScale = Math.max(34, Math.ceil(Math.hypot(screenSize.width, screenSize.height) / 28));
  const flyingAvatarSize = 72;
  const targetAvatarSize = 30;
  const ratingDateKey = localDateKey();
  const ratingStorageKey = `forge-fit-coach-rating-${ratingDateKey}`;
  const tabBarBottomPadding = Math.max(insets.bottom, 10);
  const flyingStartX = screenSize.width / 2 - flyingAvatarSize / 2;
  const flyingStartY = screenSize.height - tabBarBottomPadding - 120;
  const flyingTargetX = 20;
  const flyingTargetY = chatOriginY + coachMessageOffsetY + 2;
  React.useEffect(() => {
    const prompts = [t('coachPromptWeight'), t('coachPromptCalories')];
    let phraseIndex = 0;
    let characterIndex = 0;
    let holdTicks = 0;
    let deleting = false;
    setAnimatedPrompt('');
    const interval = setInterval(() => {
      const phrase = prompts[phraseIndex] ?? '';
      if (!deleting) {
        if (characterIndex < phrase.length) {
          characterIndex += 1;
          setAnimatedPrompt(phrase.slice(0, characterIndex));
        } else {
          holdTicks += 1;
          if (holdTicks >= 16) {
            deleting = true;
            holdTicks = 0;
          }
        }
      } else if (characterIndex > 0) {
        characterIndex -= 1;
        setAnimatedPrompt(phrase.slice(0, characterIndex));
      } else {
        phraseIndex = (phraseIndex + 1) % prompts.length;
        deleting = false;
        holdTicks = 0;
      }
    }, 72);
    return () => clearInterval(interval);
  }, [language]);
  React.useEffect(() => {
    let cancelled = false;
    setRatingLoaded(false);
    void AsyncStorage.getItem(ratingStorageKey).then((value) => {
      if (cancelled) return;
      const parsed = Number(value);
      setDailyRating(Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null);
      setRatingLoaded(true);
    }).catch(() => {
      if (!cancelled) setRatingLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [ratingStorageKey]);
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setMessages((current) => current.some((item) => item.id === 'welcome-gif') ? current : [...current, { id: 'welcome-gif', text: '', from: 'coach', media: 'welcomeGif' }]);
    }, 1350);
    return () => clearTimeout(timeout);
  }, []);
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
  const ratingTarget = [...messages].reverse().find((item) => item.from === 'coach' && Boolean(item.text) && !item.media && !item.variant);
  const rateCoachMessage = async (message: Message, rating: number) => {
    if (ratingSending !== null || dailyRating !== null) return;
    setRatingSending(rating);
    try {
      const response = await fetch(apiUrl('/api/coach-rating'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, message: message.text, language, username: username ?? undefined, screen: 'coach' }),
      });
      if (!response.ok) throw new Error('coach rating request failed');
      await AsyncStorage.setItem(ratingStorageKey, String(rating));
      setDailyRating(rating);
      setRatedMessageId(message.id);
    } catch {
      Alert.alert(t('coachRatingErrorTitle'), t('coachRatingErrorBody'));
    } finally {
      setRatingSending(null);
    }
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
     <CoachAtmosphereBackground colors={colors} reveal={coachReveal} overrideAtmosphere={previewAtmosphere} />
    <Animated.View pointerEvents="none" style={[styles.coachReveal, { backgroundColor: colors.secondary, opacity: coachReveal.interpolate({ inputRange: [0, 0.55, 0.86, 1], outputRange: [0.96, 0.92, 0.28, 0] }), transform: [{ scale: coachReveal.interpolate({ inputRange: [0, 0.68, 1], outputRange: [1, revealScale * 0.88, revealScale] }) }] }]} />
    <View style={styles.referenceHeader}>
      <View style={styles.referenceHeaderText}>
        <Text style={[styles.referenceEyebrow, { color: colors.black }]}>{t('coachEyebrow').toUpperCase()}</Text>
        <Text style={[styles.referenceTitle, { color: colors.black }]}>{t('coachTitle')}</Text>
        <Text style={[styles.referenceSubtitle, { color: colors.black }]}>{t('coachSubtitle')}</Text>
        <View style={styles.atmospherePreview}>
          <Text style={[styles.atmospherePreviewLabel, { color: colors.mutedForeground }]}>{t('coachAtmospherePreview')}</Text>
          <View style={styles.atmospherePreviewButtons}>
            {([
              ['morning', 'coachAtmosphereNormal'],
              ['night', 'coachAtmosphereNight'],
            ] as const).map(([value, labelKey]) => (
              <Pressable
                key={value}
                testID={`coach-atmosphere-${value}`}
                accessibilityRole="button"
                accessibilityLabel={t(labelKey)}
                onPress={() => setPreviewAtmosphere(value)}
                style={({ pressed }) => [
                  styles.atmospherePreviewButton,
                  {
                    backgroundColor: previewAtmosphere === value ? colors.black : `${colors.white}B8`,
                    borderColor: previewAtmosphere === value ? colors.black : `${colors.black}20`,
                    opacity: pressed ? 0.68 : 1,
                  },
                ]}
              >
                <Text style={[styles.atmospherePreviewButtonText, { color: previewAtmosphere === value ? colors.white : colors.black }]}>{t(labelKey)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
      <Pressable testID="header-action" accessibilityRole="button" accessibilityLabel={t('coachTitle')} onPress={() => undefined} style={({ pressed }) => [styles.referenceHeaderAction, { backgroundColor: colors.black, opacity: pressed ? 0.72 : 1 }]}>
        <Ionicons name="chatbubble-ellipses-outline" size={25} color={colors.white} />
      </Pressable>
    </View>
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
               {item.variant === 'weeklyAnalysis' ? <View style={[styles.weeklyMessageCard, { backgroundColor: colors.white, borderColor: colors.border }]}><View style={[styles.weeklyMessageIcon, { backgroundColor: `${colors.primary}22` }]}><Ionicons name="analytics-outline" size={16} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.weeklyMessageLabel, { color: colors.primary }]}>{item.text}</Text><Text style={[styles.weeklyMessageHint, { color: colors.mutedForeground }]}>{t('weeklyAnalysisReading')}</Text></View><Ionicons name="checkmark-circle" size={17} color={colors.success} /></View> : item.media === 'welcomeGif' ? <View style={styles.welcomeGifCard}><Image source={require('@/assets/images/coach-welcome-animation.gif')} resizeMode="cover" style={styles.welcomeGif} accessibilityLabel={t('coachWelcomeGifLabel')} /></View> : <View style={[styles.bubble, item.from === 'user' ? [styles.userBubble, { backgroundColor: colors.black }] : [styles.coachBubble, { backgroundColor: colors.white }]]}>{item.text ? <Text style={[styles.bubbleText, { color: item.from === 'user' ? colors.white : colors.black }]}>{item.text}</Text> : null}</View>}
                {item.actions?.length ? <View style={[styles.actionCard, { backgroundColor: colors.white, borderColor: colors.border }]}><Text style={[styles.actionTitle, { color: colors.black }]}>{t('coachConfirmQuestion')}</Text>{item.actions.map((action, index) => <Text key={`${item.id}-action-${index}`} style={[styles.actionLine, { color: colors.black }]}>• {actionLabel(action)}</Text>)}{item.actionStatus === 'pending' ? <View style={styles.actionButtons}><Pressable onPress={() => applyActions(item.id, item.actions ?? [])} style={[styles.actionButton, { backgroundColor: colors.primary }]}><Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>{t('coachConfirm')}</Text></Pressable><Pressable onPress={() => rejectActions(item.id)} style={[styles.actionButton, { borderColor: colors.border, borderWidth: 1 }]}><Text style={[styles.actionButtonText, { color: colors.black }]}>{t('coachReject')}</Text></Pressable></View> : <View><Text style={[styles.actionStatus, { color: item.actionStatus === 'applied' ? colors.success : colors.mutedForeground }]}>{item.actionStatus === 'applied' ? t('coachChangeApplied') : t('coachChangeRejected')}</Text>{item.actionStatus === 'applied' ? <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)')} style={[styles.refreshButton, { backgroundColor: colors.success }]}><Ionicons name="arrow-forward" size={15} color={colors.primaryForeground} /><Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>{t('refreshPages')}</Text></Pressable> : null}</View>}</View> : null}
                {ratingLoaded && ratingTarget?.id === item.id && dailyRating === null ? <View style={[styles.ratingCard, { backgroundColor: colors.white, borderColor: colors.border }]}><Text style={[styles.ratingPrompt, { color: colors.black }]}>{t('coachRatingPrompt')}</Text><View style={styles.ratingStars}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} ${t('coachRatingStars')}`} disabled={ratingSending !== null} onPress={() => void rateCoachMessage(item, value)} style={({ pressed }) => [styles.ratingStar, { opacity: ratingSending !== null && ratingSending !== value ? 0.4 : pressed ? 0.65 : 1 }]}><Ionicons name="star" size={24} color={colors.orange} /></Pressable>)}</View>{ratingSending !== null ? <Text style={[styles.ratingStatus, { color: colors.mutedForeground }]}>{t('coachRatingSending')}</Text> : null}</View> : null}
                {ratedMessageId === item.id ? <Text style={[styles.ratingThanks, { color: colors.success }]}>{t('coachRatingThanks')}</Text> : null}
           </View>
        </View>}
        ListFooterComponent={loading ? <TypingIndicator label={t('coachTyping')} colors={colors} /> : null}
        contentContainerStyle={styles.messageList}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />
        <View style={[styles.inputRow, { paddingBottom: insets.bottom + 12, backgroundColor: 'transparent' }]}>
            <View style={[styles.auraInput, { backgroundColor: colors.white, borderColor: colors.black, shadowColor: colors.black }]}>
               <TextInput ref={inputRef} value={text} onChangeText={setText} onSubmitEditing={send} returnKeyType="send" underlineColorAndroid="transparent" placeholder={loading ? t('analyzing') : text ? '' : animatedPrompt} placeholderTextColor={`${colors.black}80`} style={[styles.input, { color: colors.black, backgroundColor: colors.white }]} />
             <Pressable testID="send-coach-message" onPress={send} style={({ pressed }) => [styles.send, { backgroundColor: colors.black, opacity: pressed ? 0.75 : 1 }]}><Ionicons name="arrow-up" size={19} color={colors.white} /></Pressable>
          </View>
      </View>
    </KeyboardAvoidingView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  coachBackgroundLayer: { ...StyleSheet.absoluteFill },
  coachAtmosphereLayer: { ...StyleSheet.absoluteFill },
  coachBackground: { ...StyleSheet.absoluteFill },
  coachAfternoonGlow: { position: 'absolute', width: '82%', height: '58%', top: '-10%', left: '-16%', borderRadius: 999, overflow: 'hidden' },
  coachNightGlow: { position: 'absolute', width: '110%', height: '62%', top: '-10%', left: '-24%', borderRadius: 999, overflow: 'hidden' },
  coachStarField: { ...StyleSheet.absoluteFill },
  coachStar: { position: 'absolute' },
  coachReveal: { position: 'absolute', width: 56, height: 56, borderRadius: 28, left: '50%', marginLeft: -28, bottom: 44, shadowColor: '#FFFFFF', shadowOpacity: 0.52, shadowRadius: 28, shadowOffset: { width: 0, height: 0 }, elevation: 14 },
  coachFlightLayer: { ...StyleSheet.absoluteFill, zIndex: 4 },
  analysisFlightLayer: { ...StyleSheet.absoluteFill, zIndex: 5 },
  analysisFlightCard: { position: 'absolute', left: '50%', top: '100%', width: 260, marginLeft: -130, minHeight: 52, borderRadius: 17, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  analysisFlightText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 11 },
  coachFlyingAvatar: { position: 'absolute', width: 72, height: 72, borderRadius: 36, shadowColor: '#FFFFFF', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
  referenceHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingTop: 4, paddingBottom: 6 },
  referenceHeaderText: { flex: 1, minWidth: 0 },
  referenceEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 2.4, lineHeight: 16 },
  referenceTitle: { fontFamily: 'Inter_700Bold', fontSize: 34, lineHeight: 40, marginTop: 8, letterSpacing: -1 },
  referenceSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 17, lineHeight: 23, marginTop: 2, maxWidth: 310 },
  atmospherePreview: { marginTop: 12, gap: 6 },
  atmospherePreviewLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.3 },
  atmospherePreviewButtons: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  atmospherePreviewButton: { minHeight: 28, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  atmospherePreviewButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  referenceHeaderAction: { width: 52, height: 52, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginTop: 0 },
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
  ratingCard: { marginTop: 10, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  ratingPrompt: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 18 },
  ratingStars: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  ratingStar: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  ratingStatus: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 5 },
  ratingThanks: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 8 },
  messageImage: { width: 190, height: 145, borderRadius: 12, marginBottom: 7 },
  welcomeGifCard: { width: 238, borderRadius: 19, overflow: 'hidden' },
  welcomeGif: { width: 238, height: 178, borderRadius: 19 },
  bubbleText: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  typingBubble: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 24, borderTopLeftRadius: 8, paddingHorizontal: 18, paddingVertical: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  typingLabel: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  typingDots: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 14 },
  typingDot: { width: 5, height: 5, borderRadius: 3 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 4, paddingTop: 16 },
  attach: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 72, maxHeight: 72, width: '100%', paddingHorizontal: 18, paddingRight: 72, paddingTop: 14, paddingBottom: 12, borderRadius: 21, borderWidth: 0, fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, outlineWidth: 0 },
  auraInput: { flex: 1, minHeight: 100, position: 'relative', flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden', borderWidth: 1.2, borderRadius: 25, padding: 8, shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  send: { position: 'absolute', right: 8, bottom: 8, width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  photoPreview: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9, padding: 8, borderRadius: 15, borderWidth: 1 },
  photoPreviewImage: { width: 46, height: 46, borderRadius: 10 },
  photoPreviewCopy: { flex: 1, minWidth: 0 },
  photoPreviewTitle: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  photoPreviewHint: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
});