import React, { useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Animated, Dimensions, Easing, FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons } from '@/components/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useFit } from '@/context/FitContext';
import { translate, type TranslationKey } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { HOURLY_COACH_MESSAGE_LIMIT } from '@/lib/usageLimits';
import { buildCoachContext } from '@/lib/coachContext';
import { getWeeklySummary } from '@/lib/weeklyAnalysis';
import { getAiAccessToken, getAiClientId } from '@/lib/aiUsage';
import { validateCoachActions, type CoachAction } from '@/lib/coachActions';
import { getFirstCoachReply } from '@/lib/coachRating';
import { COACH_MESSAGES_STORAGE_KEY, getCoachMessagesStorageKey, parseStoredCoachMessages, type CoachMessageRecord } from '@/lib/coachMessages';
import { isWeeklyAnalysisUnlocked } from '@/lib/weeklyEligibility';
import { apiUrl } from '@/lib/api';
import { localDateKey } from '@/lib/nutritionDates';

type Message = CoachMessageRecord;
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
  const hour = date.getHours();
  return hour >= 20 || hour < 6 ? 'night' : 'morning';
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

function CoachAtmosphereBackground({ colors, reveal, atmosphere }: { colors: ReturnType<typeof useColors>; reveal: Animated.Value; atmosphere: CoachAtmosphere }) {
  const ambientMotion = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(ambientMotion, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(ambientMotion, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [ambientMotion]);

  if (atmosphere === 'night') {
    return <View pointerEvents="none" style={styles.coachBackgroundLayer}>
      <Animated.View style={[styles.coachAtmosphereLayer, { opacity: reveal.interpolate({ inputRange: [0, 0.38, 0.78, 1], outputRange: [0, 0.08, 0.72, 1] }) }]}>
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
      </Animated.View>
    </View>;
  }

  return <View pointerEvents="none" style={styles.coachBackgroundLayer}>
    <View style={styles.coachAtmosphereLayer}>
      <LinearGradient colors={[colors.coachMorningGlow, colors.background]} style={StyleSheet.absoluteFill} />
      <Animated.Image
        source={require('@/assets/images/coach-background.jpeg')}
        resizeMode="cover"
        style={[styles.coachBackground, { opacity: reveal.interpolate({ inputRange: [0, 0.38, 0.78, 1], outputRange: [0, 0.08, 0.72, 1] }) }]}
      />
    </View>
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
  return <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Text style={[styles.typingLabel, { color: colors.foreground }]}>{label}</Text>
    <View style={styles.typingDots}>{dots.map((dot, index) => <Animated.View key={index} style={[styles.typingDot, { backgroundColor: colors.primary, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />)}</View>
  </View>;
}

const APP_TOUR_SLIDES: Array<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: TranslationKey;
  summary: TranslationKey;
  detail: TranslationKey;
}> = [
  { icon: 'home-outline', title: 'featuresHomeTitle', summary: 'featuresHomeSummary', detail: 'featuresHomeDetail' },
  { icon: 'restaurant-outline', title: 'featuresMacroTitle', summary: 'featuresMacroSummary', detail: 'featuresMacroDetail' },
  { icon: 'barbell-outline', title: 'featuresWorkoutTitle', summary: 'featuresWorkoutSummary', detail: 'featuresWorkoutDetail' },
  { icon: 'trending-up-outline', title: 'featuresRestTitle', summary: 'featuresRestSummary', detail: 'featuresRestDetail' },
  { icon: 'chatbubble-ellipses-outline', title: 'featuresAiCoachTitle', summary: 'featuresAiCoachSummary', detail: 'featuresAiCoachDetail' },
  { icon: 'body-outline', title: 'featuresLiveFormTitle', summary: 'featuresLiveFormSummary', detail: 'featuresLiveFormDetail' },
];

function AppTourModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useFit();
  const t = (key: TranslationKey) => translate(language, key);
  const [slideIndex, setSlideIndex] = React.useState(0);
  const slideReveal = React.useRef(new Animated.Value(1)).current;
  const slide = APP_TOUR_SLIDES[slideIndex];
  const isLastSlide = slideIndex === APP_TOUR_SLIDES.length - 1;

  React.useEffect(() => {
    if (visible) {
      setSlideIndex(0);
      slideReveal.setValue(1);
    }
  }, [slideReveal, visible]);

  const moveTo = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= APP_TOUR_SLIDES.length) return;
    Animated.timing(slideReveal, {
      toValue: 0,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setSlideIndex(nextIndex);
      Animated.timing(slideReveal, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.tourBackdrop, { backgroundColor: colors.background }]}>
        <LinearGradient colors={[`${colors.primary}20`, colors.background, `${colors.plum}12`]} style={StyleSheet.absoluteFill} />
        <View style={[styles.tourHeader, { paddingTop: insets.top + 10 }]}>
          <View style={[styles.tourBrandPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="sparkles" size={15} color={colors.primary} />
            <Text style={[styles.tourBrandText, { color: colors.foreground }]}>{t('appTourTitle')}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('appTourClose')}
            onPress={onClose}
            hitSlop={10}
            style={({ pressed }) => [styles.tourCloseButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}
          >
            <Ionicons name="close" size={20} color={colors.foreground} />
          </Pressable>
        </View>
        <Animated.View style={[styles.tourContent, { opacity: slideReveal, transform: [{ translateX: slideReveal.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
          <View style={styles.tourCounterRow}>
            <Text style={[styles.tourEyebrow, { color: colors.primary }]}>{`${slideIndex + 1} / ${APP_TOUR_SLIDES.length}`}</Text>
            <Text style={[styles.tourSubtitle, { color: colors.mutedForeground }]}>{t('appTourSubtitle')}</Text>
          </View>
          <View style={[styles.tourVisual, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}32` }]}>
            <View style={[styles.tourVisualGlow, { backgroundColor: `${colors.primary}24` }]} />
            <View style={[styles.tourIconCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name={slide.icon} size={42} color={colors.primaryForeground} />
            </View>
            <View style={[styles.tourVisualLine, { backgroundColor: `${colors.primary}40` }]} />
            <View style={[styles.tourVisualDot, { backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.tourSlideTitle, { color: colors.foreground }]}>{t(slide.title)}</Text>
          <Text style={[styles.tourSlideSummary, { color: colors.primary }]}>{t(slide.summary)}</Text>
          <Text style={[styles.tourSlideDetail, { color: colors.mutedForeground }]}>{t(slide.detail)}</Text>
        </Animated.View>
        <View style={[styles.tourFooter, { paddingBottom: insets.bottom + 14 }]}>
          <View style={styles.tourDots}>
            {APP_TOUR_SLIDES.map((item, index) => <View key={item.title} style={[styles.tourDot, { backgroundColor: index === slideIndex ? colors.primary : `${colors.primary}32`, width: index === slideIndex ? 24 : 7 }]} />)}
          </View>
          <View style={styles.tourActions}>
            {slideIndex > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => moveTo(slideIndex - 1)} style={({ pressed }) => [styles.tourBackButton, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
                <Ionicons name="arrow-back" size={17} color={colors.foreground} />
                <Text style={[styles.tourBackText, { color: colors.foreground }]}>{t('appTourBack')}</Text>
              </Pressable>
            ) : <View style={styles.tourBackPlaceholder} />}
            <Pressable accessibilityRole="button" onPress={() => isLastSlide ? onClose() : moveTo(slideIndex + 1)} style={({ pressed }) => [styles.tourNextButton, { backgroundColor: colors.primary, opacity: pressed ? 0.76 : 1 }]}>
              <Text style={[styles.tourNextText, { color: colors.primaryForeground }]}>{t(isLastSlide ? 'appTourDone' : 'appTourNext')}</Text>
              <Ionicons name={isLastSlide ? 'checkmark' : 'arrow-forward'} size={18} color={colors.primaryForeground} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { accountId, language, profile, username, meals, calorieGoal, proteinGoal, carbsGoal, fatGoal, workouts, weight, weightLogs, dumbbellWeightHistory, registeredAt, coachMessagesUsed, incrementCoachUsage, setCoachThinking, coachIntroPending, markCoachIntroSeen, addExercise, removeExercise, updateExercise, updateWorkout, updateProfile, updateNutritionGoals } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const { weeklyAnalysis, analysisId } = useLocalSearchParams<{ weeklyAnalysis?: string; analysisId?: string }>();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesHydrated, setMessagesHydrated] = useState(false);
  const [atmosphere, setAtmosphere] = useState<CoachAtmosphere>(() => getCoachAtmosphere());
  const [loading, setLoading] = useState(false);
  const [animatedPrompt, setAnimatedPrompt] = useState('');
  const [dailyRating, setDailyRating] = useState<number | null>(null);
  const [ratingLoaded, setRatingLoaded] = useState(false);
  const [ratingSending, setRatingSending] = useState<number | null>(null);
  const [ratedMessageId, setRatedMessageId] = useState<string | null>(null);
  const [appTourVisible, setAppTourVisible] = useState(false);
  const [chatOriginY, setChatOriginY] = React.useState(0);
  const inputRef = useRef<TextInput>(null);
  const coachReveal = useRef(new Animated.Value(0)).current;
  const weeklyCardReveal = useRef(new Animated.Value(0)).current;
  const lastAnalysisId = useRef<string | undefined>(undefined);
  const hydratedMessagesStorageKey = useRef<string | null>(null);
  const screenSize = Dimensions.get('window');
  const revealScale = Math.max(34, Math.ceil(Math.hypot(screenSize.width, screenSize.height) / 28));
  const ratingDateKey = localDateKey();
  const weeklyAnalysisUnlocked = isWeeklyAnalysisUnlocked(registeredAt);
  React.useEffect(() => {
    const updateAtmosphere = () => setAtmosphere(getCoachAtmosphere());
    updateAtmosphere();
    const interval = setInterval(updateAtmosphere, 60_000);
    return () => clearInterval(interval);
  }, []);
  // Keep the restored first-reply rating flow separate from the previous
  // latest-message flow, so an old rating cannot hide the restored prompt.
  const coachMessagesStorageKey = getCoachMessagesStorageKey(accountId);
  const ratingStorageKey = `forge-fit-coach-rating-v2-${accountId}-${ratingDateKey}`;
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
    let cancelled = false;
    hydratedMessagesStorageKey.current = null;
    setMessagesHydrated(false);
    void (async () => {
      try {
        let value = await AsyncStorage.getItem(coachMessagesStorageKey);
        // Migrate the pre-account storage only once, into this device's local
        // account. The account id is never sent to the coach or used as a name.
        if (!value && coachMessagesStorageKey !== COACH_MESSAGES_STORAGE_KEY) {
          const legacyValue = await AsyncStorage.getItem(COACH_MESSAGES_STORAGE_KEY);
          if (legacyValue) {
            value = legacyValue;
            await AsyncStorage.setItem(coachMessagesStorageKey, legacyValue);
            await AsyncStorage.removeItem(COACH_MESSAGES_STORAGE_KEY);
          }
        }
        const restoredMessages = parseStoredCoachMessages(value);
        if (!cancelled) {
          const initialMessages: Message[] = restoredMessages?.length ? restoredMessages : [{
            id: 'coach-welcome',
            text: t('coachWelcome'),
            from: 'coach',
            media: 'welcomeGif',
          }];
          const welcomeIndex = initialMessages.findIndex((message) => message.id === 'coach-welcome' || (message.from === 'coach' && !message.variant && !message.media));
          if (welcomeIndex >= 0 && !initialMessages.some((message) => message.media === 'welcomeGif')) {
            initialMessages[welcomeIndex] = { ...initialMessages[welcomeIndex], media: 'welcomeGif' };
          }
          setMessages(initialMessages);
        }
      } catch {
        if (!cancelled) setMessages([{ id: 'coach-welcome', text: t('coachWelcome'), from: 'coach', media: 'welcomeGif' }]);
      } finally {
        if (!cancelled) {
          hydratedMessagesStorageKey.current = coachMessagesStorageKey;
          setMessagesHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coachMessagesStorageKey, language]);
  React.useEffect(() => {
    if (!messagesHydrated || hydratedMessagesStorageKey.current !== coachMessagesStorageKey) return;
    void AsyncStorage.setItem(coachMessagesStorageKey, JSON.stringify(messages)).catch(() => undefined);
  }, [coachMessagesStorageKey, messages, messagesHydrated]);
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
    if (coachMessagesUsed >= HOURLY_COACH_MESSAGE_LIMIT) {
      setMessages((current) => [...current, { id: `${Date.now()}-limit`, text: t('coachLimitReached'), from: 'coach' }]);
      return;
    }
    const context = buildCoachContext({
      message: prompt,
      conversation: messages
        .filter((item) => Boolean(item.text) && !item.media && !item.variant)
        .slice(-6)
        .map((item) => ({ role: item.from, content: item.text })),
      username,
      profile,
      meals,
      workouts,
      weight,
      weightLogs,
      dumbbellWeightHistory,
      calorieGoal,
      proteinGoal,
      carbsGoal,
      fatGoal,
      language,
    });
    setMessages((current) => [...current, displayMessage]);
    setLoading(true);
    setCoachThinking(true);
    try {
      const clientId = await getAiClientId();
      const accessToken = await getAiAccessToken();
      const response = await fetch(apiUrl('/api/ai/coach'), { method: 'POST', headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, body: JSON.stringify({ message: prompt, language, context, clientId }) });
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
    if (coachMessagesUsed >= HOURLY_COACH_MESSAGE_LIMIT) {
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
  const ratingTarget = getFirstCoachReply(messages);
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
    if (weeklyAnalysis !== '1' || !analysisId || !weeklyAnalysisUnlocked || lastAnalysisId.current === analysisId) return undefined;
    lastAnalysisId.current = analysisId;
    weeklyCardReveal.setValue(0);
    const animation = Animated.timing(weeklyCardReveal, { toValue: 1, duration: 1050, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
      const summary = getWeeklySummary({ weight, weightLogs, meals, workouts, calorieGoal, goal: profile?.goal, profile: profile ?? undefined, dumbbellWeightHistory });
     const weeklyPrompt = `Create a concise written weekly fitness analysis from the user's real data. Do not merely repeat metric values: interpret what they mean, assess progress, identify one strength and one weakness or uncertainty, and give 1-2 actionable recommendations. If the data is insufficient or no change is needed, say that clearly and explain what to monitor next. Never invent missing data. This is a weekly review, not medical advice. If the user's goal is muscle building, focus on training volume, consistency, and strength progress; do not mention weight change or weight logs. Reply entirely in the user's selected language. Weekly summary: ${JSON.stringify(summary)}`;
    const timeout = setTimeout(() => {
     void requestCoach(weeklyPrompt, { id: `weekly-${analysisId}`, text: t('weeklyAnalysisCard'), from: 'user', variant: 'weeklyAnalysis' });
    }, 760);
    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, [analysisId, weeklyAnalysis, weeklyAnalysisUnlocked]);
  return <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 104 }]}>
     <CoachAtmosphereBackground colors={colors} reveal={coachReveal} atmosphere={atmosphere} />
    <Animated.View pointerEvents="none" style={[styles.coachReveal, { backgroundColor: colors.secondary, opacity: coachReveal.interpolate({ inputRange: [0, 0.55, 0.86, 1], outputRange: [0.96, 0.92, 0.28, 0] }), transform: [{ scale: coachReveal.interpolate({ inputRange: [0, 0.68, 1], outputRange: [1, revealScale * 0.88, revealScale] }) }] }]} />
    <View style={styles.referenceHeader}>
      <View style={styles.referenceHeaderText}>
       <Text style={[styles.referenceEyebrow, { color: colors.foreground }]}>{t('coachEyebrow').toUpperCase()}</Text>
         <Text style={[styles.referenceTitle, { color: colors.foreground }]}>{t('coachTitle')}</Text>
         <Text style={[styles.referenceSubtitle, { color: colors.mutedForeground }]}>{t('coachSubtitle')}</Text>
      </View>
    </View>
    <View pointerEvents="none" style={styles.analysisFlightLayer}>
      <Animated.View style={[styles.analysisFlightCard, { backgroundColor: colors.primaryForeground, opacity: weeklyCardReveal.interpolate({ inputRange: [0, 0.72, 1], outputRange: [1, 0.9, 0] }), transform: [{ translateX: weeklyCardReveal.interpolate({ inputRange: [0, 1], outputRange: [0, 20 - (screenSize.width / 2 - 130)] }) }, { translateY: weeklyCardReveal.interpolate({ inputRange: [0, 1], outputRange: [0, chatOriginY + 42 - (screenSize.height - 220)] }) }, { scale: weeklyCardReveal.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 0.84, 0.68] }) }] }]}><Ionicons name="sparkles" size={16} color={colors.primary} /><Text style={[styles.analysisFlightText, { color: colors.primary }]}>{t('weeklyAnalysisReading')}</Text></Animated.View>
    </View>
    <KeyboardAvoidingView onLayout={({ nativeEvent }) => setChatOriginY(nativeEvent.layout.y)} style={styles.chatWrap} behavior="padding" keyboardVerticalOffset={0}>
      <FlatList
        style={styles.messagesList}
        data={messages}
        keyExtractor={(item) => item.id}
         renderItem={({ item }) => <View
          style={[styles.messageRow, item.from === 'user' ? styles.userMessageRow : styles.coachMessageRow]}
         >
            {item.from === 'coach' ? <View style={styles.messageAvatarShell}><Image accessibilityLabel={t('coachTitle')} source={require('@/assets/images/coach-tab-custom.jpeg')} resizeMode="cover" style={styles.messageAvatar} /></View> : null}
           <View style={styles.messageContent}>
                  {item.variant === 'weeklyAnalysis' ? <View style={[styles.weeklyMessageCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.weeklyMessageIcon, { backgroundColor: `${colors.primary}22` }]}><Ionicons name="analytics-outline" size={16} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.weeklyMessageLabel, { color: colors.primary }]}>{item.text}</Text><Text style={[styles.weeklyMessageHint, { color: colors.mutedForeground }]}>{t('weeklyAnalysisReading')}</Text></View><Ionicons name="checkmark-circle" size={17} color={colors.success} /></View> : <><View style={[styles.bubble, item.from === 'user' ? [styles.userBubble, { backgroundColor: colors.primary }] : [styles.coachBubble, { backgroundColor: colors.card }]]}>{item.text ? <Text style={[styles.bubbleText, { color: item.from === 'user' ? colors.primaryForeground : colors.foreground }]}>{item.text}</Text> : null}</View>{item.id === 'coach-welcome' || item.media === 'welcomeGif' ? <Pressable accessibilityRole="button" onPress={() => setAppTourVisible(true)} style={({ pressed }) => [styles.appTourButton, { backgroundColor: `${colors.primary}14`, borderColor: `${colors.primary}48`, opacity: pressed ? 0.68 : 1 }]}><Ionicons name="sparkles-outline" size={16} color={colors.primary} /><Text style={[styles.appTourButtonText, { color: colors.primary }]}>{t('appTourButton')}</Text><Ionicons name="arrow-forward" size={15} color={colors.primary} /></Pressable> : null}{item.media === 'welcomeGif' ? <View style={[styles.welcomeGifCard, { backgroundColor: colors.card }]}><Image accessibilityLabel={t('coachWelcomeGifLabel')} source={require('@/assets/images/coach-welcome-animation.gif')} resizeMode="cover" style={styles.welcomeGif} /></View> : null}</>}
                 {item.actions?.length ? <View style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.actionTitle, { color: colors.foreground }]}>{t('coachConfirmQuestion')}</Text>{item.actions.map((action, index) => <Text key={`${item.id}-action-${index}`} style={[styles.actionLine, { color: colors.foreground }]}>• {actionLabel(action)}</Text>)}{item.actionStatus === 'pending' ? <View style={styles.actionButtons}><Pressable onPress={() => applyActions(item.id, item.actions ?? [])} style={[styles.actionButton, { backgroundColor: colors.primary }]}><Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>{t('coachConfirm')}</Text></Pressable><Pressable onPress={() => rejectActions(item.id)} style={[styles.actionButton, { borderColor: colors.border, borderWidth: 1 }]}><Text style={[styles.actionButtonText, { color: colors.foreground }]}>{t('coachReject')}</Text></Pressable></View> : <View><Text style={[styles.actionStatus, { color: item.actionStatus === 'applied' ? colors.success : colors.mutedForeground }]}>{item.actionStatus === 'applied' ? t('coachChangeApplied') : t('coachChangeRejected')}</Text>{item.actionStatus === 'applied' ? <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)')} style={[styles.refreshButton, { backgroundColor: colors.success }]}><Ionicons name="arrow-forward" size={15} color={colors.primaryForeground} /><Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>{t('refreshPages')}</Text></Pressable> : null}</View>}</View> : null}
                {ratingLoaded && ratingTarget?.id === item.id && dailyRating === null ? <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.ratingPrompt, { color: colors.foreground }]}>{t('coachRatingPrompt')}</Text><View style={styles.ratingStars}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} ${t('coachRatingStars')}`} disabled={ratingSending !== null} onPress={() => void rateCoachMessage(item, value)} style={({ pressed }) => [styles.ratingStar, { opacity: ratingSending !== null && ratingSending !== value ? 0.4 : pressed ? 0.65 : 1 }]}><Ionicons name="star" size={24} color={colors.orange} /></Pressable>)}</View>{ratingSending !== null ? <Text style={[styles.ratingStatus, { color: colors.mutedForeground }]}>{t('coachRatingSending')}</Text> : null}</View> : null}
                {ratedMessageId === item.id ? <Text style={[styles.ratingThanks, { color: colors.success }]}>{t('coachRatingThanks')}</Text> : null}
           </View>
        </View>}
        ListFooterComponent={loading ? <TypingIndicator label={t('coachTyping')} colors={colors} /> : null}
        contentContainerStyle={styles.messageList}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />
        <View style={[styles.inputRow, { paddingBottom: insets.bottom + 12, backgroundColor: 'transparent' }]}>
             <View style={[styles.auraInput, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.primary }]}>
                <TextInput ref={inputRef} value={text} onChangeText={setText} onSubmitEditing={send} returnKeyType="send" underlineColorAndroid="transparent" placeholder={loading ? t('analyzing') : text ? '' : animatedPrompt} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card }]} />
              <Pressable testID="send-coach-message" onPress={send} style={({ pressed }) => [styles.send, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}><Ionicons name="arrow-up" size={19} color={colors.primaryForeground} /></Pressable>
          </View>
      </View>
     </KeyboardAvoidingView>
     <AppTourModal visible={appTourVisible} onClose={() => setAppTourVisible(false)} />
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
  analysisFlightLayer: { ...StyleSheet.absoluteFill, zIndex: 5 },
  analysisFlightCard: { position: 'absolute', left: '50%', top: '100%', width: 260, marginLeft: -130, minHeight: 52, borderRadius: 17, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  analysisFlightText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 11 },
  referenceHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingTop: 4, paddingBottom: 6 },
  referenceHeaderText: { flex: 1, minWidth: 0 },
  referenceEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 2.4, lineHeight: 16 },
  referenceTitle: { fontFamily: 'Inter_700Bold', fontSize: 34, lineHeight: 40, marginTop: 8, letterSpacing: -1 },
  referenceSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 17, lineHeight: 23, marginTop: 2, maxWidth: 310 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  limit: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  limitNumber: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  chatWrap: { flex: 1, minHeight: 0 },
  messagesList: { flex: 1, minHeight: 0 },
  messageList: { paddingVertical: 20, gap: 16 },
   messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  coachMessageRow: { alignSelf: 'flex-start', maxWidth: '90%' },
  userMessageRow: { alignSelf: 'flex-end', maxWidth: '90%' },
   messageContent: { flex: 1, minWidth: 0, gap: 10 },
  weeklyMessageCard: { minWidth: 255, maxWidth: '100%', borderRadius: 24, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  weeklyMessageIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  weeklyMessageLabel: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  weeklyMessageHint: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 3 },
   messageAvatarShell: { width: 38, height: 38, flexShrink: 0, borderRadius: 19, marginTop: 2, padding: 2, backgroundColor: '#173A73', overflow: 'hidden' },
   messageAvatar: { width: '100%', height: '100%', borderRadius: 17 },
  bubble: { maxWidth: '92%', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 24 },
  userBubble: { borderBottomRightRadius: 8 },
  coachBubble: { borderTopLeftRadius: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  appTourButton: { minHeight: 42, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, marginTop: -2 },
  appTourButtonText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
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
   welcomeGifCard: { width: 238, borderRadius: 19, overflow: 'hidden', marginTop: 2 },
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
  tourBackdrop: { flex: 1, paddingHorizontal: 22 },
  tourHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  tourBrandPill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  tourBrandText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  tourCloseButton: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tourContent: { flex: 1, justifyContent: 'center', paddingBottom: 12 },
  tourCounterRow: { alignItems: 'center', gap: 8, marginBottom: 18 },
  tourEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 1.8 },
  tourSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  tourVisual: { width: '100%', height: 208, borderRadius: 30, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 26 },
  tourVisualGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 85 },
  tourIconCircle: { width: 94, height: 94, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#0A6CFF', shadowOpacity: 0.26, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 9 },
  tourVisualLine: { position: 'absolute', width: 104, height: 1, bottom: 44, left: '50%', marginLeft: -52 },
  tourVisualDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, bottom: 41 },
  tourSlideTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34, textAlign: 'center', letterSpacing: -0.5 },
  tourSlideSummary: { fontFamily: 'Inter_700Bold', fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 12 },
  tourSlideDetail: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 12, paddingHorizontal: 5 },
  tourFooter: { gap: 22 },
  tourDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, minHeight: 8 },
  tourDot: { height: 7, borderRadius: 4 },
  tourActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  tourBackPlaceholder: { width: 92 },
  tourBackButton: { minHeight: 52, minWidth: 92, borderWidth: 1, borderRadius: 17, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  tourBackText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  tourNextButton: { flex: 1, minHeight: 52, borderRadius: 17, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  tourNextText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});