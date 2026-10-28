import React from 'react';
import { Animated, Easing, Image, PanResponder, Platform, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import ReAnimated, { Easing as ReEasing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle as SvgCircle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ProgressRing } from '@/components/NutritionVisuals';
import { PressableScale as Pressable } from '@/components/Motion';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@/components/AppIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityLevel,
  BiologicalSex,
  DietPreference,
  Equipment,
  ExperienceLevel,
  FitnessGoal,
  GoalRate,
  GymLevel,
  Profile,
  ProteinPreference,
  recommendTargetWeight,
  useFit,
} from '@/context/FitContext';
import { languageLabels, Language, translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { ForgeFitMark, GainModeWordmark, PremiumSuccessCelebration, Screen, triggerHaptic } from '@/components/FitUI';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { SUBSCRIPTION_PURCHASE_ENABLED, useSubscription } from '@/lib/revenuecat';
import { getProfileEditStepIds, parseProfileEditFields, type ProfileEditField } from '@/lib/profileEdit';
import { getEntryRoute } from '@/lib/entryFlow';
import { offerWidgetAfterFirstPurchase } from '@/components/WidgetOffer';
import { Paywall } from '@/components/Paywall';
import { hasActivePremiumEntitlement } from '@/lib/premiumAccess';
import { calculateAnnualSavingsPercent, formatAnnualMonthlyPrice } from '@/lib/subscriptionPricing';
import type { AiPlan } from '@/lib/aiPlan';
import { requestAiPlan } from '@/lib/aiPlanRequest';
import { isDesignPreview } from '@/lib/designPreview';

type CoachMotionVariant = 'wave' | 'write' | 'done';
type MeasurementUnit = 'metric' | 'imperial';
type TargetWeightUnit = 'kg' | 'lb';
type OnboardingMode = 'quick' | 'detailed';
type OnboardingStepId = number | 'mode';

const languageFlagImages = {
  tr: require('@/assets/images/flags/tr.png'),
  en: require('@/assets/images/flags/gb.png'),
  de: require('@/assets/images/flags/de.png'),
  fr: require('@/assets/images/flags/fr.png'),
  es: require('@/assets/images/flags/es.png'),
} as const;

function MiniFlag({ language }: { language: Language }) {
  return <Image source={languageFlagImages[language]} resizeMode="cover" style={styles.languageFlagImage} />;
}

function LanguageSelector({ language, onSelect }: { language: Language; onSelect: (language: Language) => void }) {
  const colors = useColors();
  return <View style={styles.languageRow}>
    {(Object.keys(languageLabels) as Language[]).map((item) => (
      <Pressable key={item} onPress={() => onSelect(item)} style={styles.languageOption}>
        <Text style={[styles.language, { color: language === item ? colors.primary : colors.mutedForeground }]}>{item.toUpperCase()}</Text>
        <MiniFlag language={item} />
      </Pressable>
    ))}
  </View>;
}

const QUICK_ONBOARDING_STEP_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 14] as const;

const KG_PER_POUND = 1 / 2.20462;
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

function formatImperialHeight(heightCm: number) {
  const totalInches = Math.round(heightCm / 2.54);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

function formatImperialHeightLabel(heightCm: number) {
  const { feet, inches } = formatImperialHeight(heightCm);
  return `${feet}' ${inches}"`;
}

function CoachMotion({ variant, large = false, onboarding = false }: { variant: CoachMotionVariant; large?: boolean; onboarding?: boolean }) {
  const source = onboarding
    ? variant === 'done'
      ? require('@/assets/images/coach-thumbs-up-no-bg.png')
      : require('@/assets/images/coach-wave-transparent.png')
    : variant === 'wave'
      ? require('@/assets/images/coach-wave-direct.jpg')
      : variant === 'write'
        ? require('@/assets/images/coach-writing-no-bg.png')
        : require('@/assets/images/coach-thumbs-up-no-bg.png');
  return <Image source={source} resizeMode="contain" style={[large ? styles.coachLarge : onboarding ? styles.coachOnboarding : styles.coachSmall, !large && variant === 'wave' ? styles.coachWaveQuestion : null]} />;
}

const savedCopy: Record<string, string> = { tr: 'Cevabın kaydedildi', en: 'Answer saved', de: 'Antwort gespeichert', fr: 'Réponse enregistrée', es: 'Respuesta guardada' };

/** One bar of the coach's listening wave, offset in phase from its neighbours. */
function PulseBar({ clock, phase, color }: { clock: SharedValue<number>; phase: number; color: string }) {
  const style = useAnimatedStyle(() => ({ height: 4 + 12 * Math.abs(Math.sin((clock.get() + phase) * Math.PI * 2)) }));
  return <ReAnimated.View style={[ui.pulseBar, { backgroundColor: color }, style]} />;
}

/**
 * The coach listening in, docked above the main button: the avatar sits in a turning arc and a
 * small wave plays beside the text. Each new question first flashes a saved check for the
 * previous answer, then goes back to listening.
 */
function CoachPulse({ step }: { step: number }) {
  const colors = useColors();
  const { language } = useFit();
  const reduced = useReducedMotion();
  const clock = useSharedValue(0);
  const spin = useSharedValue(0);
  const flash = useSharedValue(0);
  const [saved, setSaved] = React.useState(false);
  const first = React.useRef(true);

  React.useEffect(() => {
    if (reduced) return;
    clock.set(withRepeat(withTiming(1, { duration: 1400, easing: ReEasing.linear }), -1));
    spin.set(withRepeat(withTiming(1, { duration: 2400, easing: ReEasing.linear }), -1));
  }, [clock, reduced, spin]);

  React.useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    setSaved(true);
    flash.set(0);
    flash.set(withSequence(withTiming(1, { duration: 220 }), withDelay(900, withTiming(0, { duration: 260 }))));
    const timer = setTimeout(() => setSaved(false), 1300);
    return () => clearTimeout(timer);
  }, [flash, step]);

  const arcStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.get() * 360}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: flash.get() }));
  const tone = saved ? colors.success : colors.accent;
  return <View style={ui.pulseDock}>
    <View style={[ui.pulse, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ReAnimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, ui.pulseFlash, { backgroundColor: `${colors.success}22`, borderColor: `${colors.success}66` }, glowStyle]} />
      <View style={ui.pulseAvatar}>
        <ReAnimated.View style={[StyleSheet.absoluteFill, arcStyle]}>
          <Svg width={34} height={34}><SvgCircle cx={17} cy={17} r={15.5} stroke={tone} strokeWidth={2} strokeLinecap="round" strokeDasharray="28 70" fill="none" /></Svg>
        </ReAnimated.View>
        <View style={[ui.pulseFace, { backgroundColor: colors.secondary }]}><Image source={require('@/assets/images/coach-writing-no-bg.png')} resizeMode="contain" style={ui.pulseFaceImage} /></View>
      </View>
      <Text numberOfLines={1} style={[ui.pulseText, { color: colors.foreground }]}>{saved ? savedCopy[language] ?? savedCopy.en : translate(language, 'analyzingAnswers')}</Text>
      {saved ? <Ionicons name="checkmark-circle" size={18} color={colors.success} /> : <View style={ui.pulseWave}>{[0, 0.15, 0.3, 0.45].map((phase) => <PulseBar key={phase} clock={clock} phase={phase} color={colors.accent} />)}</View>}
    </View>
  </View>;
}

function OnboardingScrollHint({ visible }: { visible: boolean }) {
  const colors = useColors();
  const handTranslateY = React.useRef(new Animated.Value(0)).current;
  const hintOpacity = React.useRef(new Animated.Value(0.6)).current;

  React.useEffect(() => {
    if (!visible) {
      handTranslateY.stopAnimation();
      hintOpacity.stopAnimation();
      handTranslateY.setValue(0);
      hintOpacity.setValue(0);
      return;
    }

    const loop = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(handTranslateY, { toValue: 10, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(hintOpacity, { toValue: 1, duration: 360, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(handTranslateY, { toValue: 0, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(hintOpacity, { toValue: 0.6, duration: 360, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    ]));
    loop.start();
    return () => loop.stop();
  }, [handTranslateY, hintOpacity, visible]);

  if (!visible) return null;
  return <Animated.View pointerEvents="none" style={[styles.questionScrollHint, { opacity: hintOpacity }]}>
    <Animated.View style={{ transform: [{ translateY: handTranslateY }] }}>
      <Ionicons name="hand-pointer" size={24} color={colors.primary} />
    </Animated.View>
    <Ionicons name="chevron-down" size={16} color={colors.primary} />
  </Animated.View>;
}

function RulerPicker({ value, min, max, onChange, valueLabel, minLabel, maxLabel }: { value: number; min: number; max: number; onChange: (value: number) => void; valueLabel: string; minLabel: string; maxLabel: string }) {
  const colors = useColors();
  const [trackWidth, setTrackWidth] = React.useState(308);
  const updateFromX = (x: number) => onChange(Math.round(min + Math.max(0, Math.min(1, x / trackWidth)) * (max - min)));
  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => updateFromX(event.nativeEvent.locationX),
    onPanResponderMove: (event) => updateFromX(event.nativeEvent.locationX),
  }), [min, max, onChange, trackWidth]);
  const progress = (value - min) / (max - min);
  return <View style={[styles.rulerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.rulerValue}><Text style={[styles.rulerNumber, { color: colors.foreground }]}>{valueLabel}</Text></View>
    <View {...panResponder.panHandlers} onLayout={({ nativeEvent }) => setTrackWidth(nativeEvent.layout.width)} style={styles.rulerTrack}>
      <View pointerEvents="none" style={[styles.rulerLine, { backgroundColor: colors.border }]} />
      <View pointerEvents="none" style={[styles.rulerProgress, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
      <View pointerEvents="none" style={styles.rulerTicks}>{Array.from({ length: 16 }, (_, index) => <View key={index} style={[styles.rulerTick, { height: index % 5 === 0 ? 27 : 15, backgroundColor: index % 5 === 0 ? colors.primary : colors.mutedForeground }]} />)}</View>
      <View pointerEvents="none" style={[styles.rulerThumb, { left: `${progress * 100}%`, backgroundColor: colors.primary, borderColor: colors.background }]} />
    </View>
    <View style={styles.rulerLabels}><Text style={[styles.rulerLabel, { color: colors.mutedForeground }]}>{minLabel}</Text><Text style={[styles.rulerLabel, { color: colors.mutedForeground }]}>{maxLabel}</Text></View>
  </View>;
}

function UnitToggle({ unit, onChange, metricLabel, imperialLabel }: { unit: MeasurementUnit; onChange: (unit: MeasurementUnit) => void; metricLabel: string; imperialLabel: string }) {
  const colors = useColors();
  return <View style={[styles.unitToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
    {(['metric', 'imperial'] as const).map((option) => {
      const selected = unit === option;
      return <Pressable key={option} onPress={() => { triggerHaptic(); onChange(option); }} style={[styles.unitOption, selected ? { backgroundColor: colors.primary } : null]}>
        <Text style={[styles.unitOptionText, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>{option === 'metric' ? metricLabel : imperialLabel}</Text>
      </Pressable>;
    })}
  </View>;
}

function WeightPicker({ value, unit, inputValue, onInputChange, onChange }: { value: number; unit: MeasurementUnit; inputValue: string; onInputChange: (value: string) => void; onChange: (value: number) => void }) {
  const colors = useColors();
  const change = (amount: number) => {
    const next = unit === 'metric' ? value + amount : value + amount * KG_PER_POUND;
    onChange(Math.round(Math.max(35, Math.min(200, next)) * 10) / 10);
  };
  return <View style={[styles.weightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Pressable onPress={() => change(unit === 'metric' ? -0.5 : -1)} style={[styles.stepButton, { backgroundColor: colors.secondary }]}><Ionicons name="remove" size={22} color={colors.foreground} /></Pressable>
    <View style={styles.weightValue}><TextInput value={inputValue} onChangeText={onInputChange} keyboardType="decimal-pad" selectTextOnFocus style={[styles.weightNumberInput, { color: colors.foreground }]} /><Text style={[styles.rulerUnit, { color: colors.primary }]}>{unit === 'metric' ? 'kg' : 'lb'}</Text></View>
    <Pressable onPress={() => change(unit === 'metric' ? 0.5 : 1)} style={[styles.stepButton, { backgroundColor: colors.accent }]}><Ionicons name="add" size={22} color="#FFFFFF" /></Pressable>
  </View>;
}

function GoalWeightPicker({ valueKg, recommendedKg, unit, inputValue, recommendedLabel, onInputChange, onChange, onUnitChange }: { valueKg: number; recommendedKg: number; unit: TargetWeightUnit; inputValue: string; recommendedLabel: string; onInputChange: (value: string) => void; onChange: (valueKg: number) => void; onUnitChange: (unit: TargetWeightUnit) => void }) {
  const colors = useColors();
  const displayRecommended = unit === 'kg' ? recommendedKg : recommendedKg / KG_PER_POUND;
  const change = (amount: number) => onChange(Math.round(Math.max(35, Math.min(200, valueKg + amount * (unit === 'kg' ? 1 : KG_PER_POUND))) * 10) / 10);
  return <View style={styles.targetWeightSection}>
    <View style={[styles.targetUnitToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {(['kg', 'lb'] as const).map((option) => <Pressable key={option} onPress={() => { triggerHaptic(); onUnitChange(option); }} style={[styles.targetUnitOption, unit === option ? { backgroundColor: colors.primary } : null]}><Text style={[styles.unitOptionText, { color: unit === option ? colors.primaryForeground : colors.mutedForeground }]}>{option}</Text></Pressable>)}
    </View>
    <View style={[styles.weightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable onPress={() => change(-1)} style={[styles.stepButton, { backgroundColor: colors.secondary }]}><Ionicons name="remove" size={22} color={colors.foreground} /></Pressable>
      <View style={styles.weightValue}><TextInput value={inputValue} onChangeText={onInputChange} keyboardType="decimal-pad" selectTextOnFocus style={[styles.weightNumberInput, { color: colors.foreground }]} /><Text style={[styles.rulerUnit, { color: colors.primary }]}>{unit}</Text></View>
      <Pressable onPress={() => change(1)} style={[styles.stepButton, { backgroundColor: colors.accent }]}><Ionicons name="add" size={22} color="#FFFFFF" /></Pressable>
    </View>
    <View style={[styles.recommendedTarget, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}35` }]}>
      <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
      <Text style={[styles.recommendedTargetText, { color: colors.foreground }]}>{recommendedLabel}</Text>
      <Text style={[styles.recommendedTargetValue, { color: colors.primary }]}>{displayRecommended.toFixed(1)} {unit}</Text>
    </View>
  </View>;
}

function AgePicker({ value, inputValue, yearsLabel, onInputChange, onChange }: { value: number; inputValue: string; yearsLabel: string; onInputChange: (value: string) => void; onChange: (value: number) => void }) {
  const colors = useColors();
  const adjust = (amount: number) => onChange(Math.max(13, Math.min(90, value + amount)));
  return <View style={[styles.weightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Pressable onPress={() => adjust(-1)} style={[styles.stepButton, { backgroundColor: colors.secondary }]}><Ionicons name="remove" size={22} color={colors.foreground} /></Pressable>
    <View style={styles.weightValue}><TextInput value={inputValue} onChangeText={onInputChange} keyboardType="number-pad" maxLength={2} selectTextOnFocus style={[styles.weightNumberInput, { color: colors.foreground }]} /><Text style={[styles.rulerUnit, { color: colors.primary }]}>{yearsLabel}</Text></View>
    <Pressable onPress={() => adjust(1)} style={[styles.stepButton, { backgroundColor: colors.accent }]}><Ionicons name="add" size={22} color="#FFFFFF" /></Pressable>
  </View>;
}

const PREVIEW_PAYWALL_KEY = 'gm-preview-paywall-done';
function readPreviewFlag() {
  try { return globalThis.localStorage?.getItem(PREVIEW_PAYWALL_KEY) === '1'; } catch { return false; }
}
function writePreviewFlag() {
  try { globalThis.localStorage?.setItem(PREVIEW_PAYWALL_KEY, '1'); } catch { /* preview only */ }
}

export default function EntryScreen() {
  const colors = useColors();
  const { onboardingComplete, introSeen, isPremium, coachIntroPending, setIntroSeen } = useFit();
  const params = useLocalSearchParams<{ edit?: string; fields?: string; preview?: string }>();
  const editMode = params.edit === '1';
  const previewHome = Platform.OS === 'web' && params.preview === 'home';
  const selectedFields = React.useMemo(() => parseProfileEditFields(params.fields), [params.fields]);
  const entryRoute = getEntryRoute({ onboardingComplete, introSeen, isPremium, subscriptionPurchaseEnabled: SUBSCRIPTION_PURCHASE_ENABLED, coachIntroPending });
  const [premiumCelebrationVisible, setPremiumCelebrationVisible] = React.useState(false);
  const purchasedRef = React.useRef(false);
  // The web preview counts as subscribed, so show the plan picker once after onboarding there too.
  const [previewPaywallDone, setPreviewPaywallDone] = React.useState(() => !isDesignPreview() || readPreviewFlag());
  const previewPaywall = !editMode && !previewPaywallDone && onboardingComplete && introSeen;
  const finishPreviewPaywall = () => {
    writePreviewFlag();
    setPreviewPaywallDone(true);
  };
  React.useEffect(() => {
    if (previewHome) {
      router.replace('/(tabs)');
      return;
    }
    if (!editMode && !previewPaywall && !premiumCelebrationVisible && (entryRoute === 'tabs' || entryRoute === 'coach')) {
      router.replace(entryRoute === 'coach' ? '/(tabs)/coach' : '/(tabs)');
    }
  }, [editMode, entryRoute, premiumCelebrationVisible, previewHome, previewPaywall]);
  if (previewHome) return <View style={[styles.entryRedirecting, { backgroundColor: colors.background }]} />;
  if (editMode) return <OnboardingQuestions editMode selectedFields={selectedFields} />;
  if (entryRoute === 'onboarding') return <OnboardingQuestions />;
  if (entryRoute === 'intro') return <IntroScreen onDone={setIntroSeen} />;
  if (premiumCelebrationVisible) {
    return <PremiumSuccessCelebration
      visible
      modal={false}
      onDone={() => {
        setPremiumCelebrationVisible(false);
        router.replace('/(tabs)/coach');
        if (purchasedRef.current) void offerWidgetAfterFirstPurchase();
      }}
    />;
  }
  if (previewPaywall) {
    return <Paywall
      previewMode
      onUnlock={finishPreviewPaywall}
      onPurchaseSuccess={() => {
        setPremiumCelebrationVisible(true);
        finishPreviewPaywall();
      }}
    />;
  }
  if (entryRoute === 'premium') {
    return <PremiumWelcomeOfferScreen
      onUnlock={() => router.replace('/(tabs)/coach')}
      onPurchaseSuccess={(kind) => {
        purchasedRef.current = kind === 'purchase';
        setPremiumCelebrationVisible(true);
      }}
    />;
  }
  return <View style={[styles.entryRedirecting, { backgroundColor: colors.background }]} />;
}

function OnboardingQuestions({ editMode = false, selectedFields = [] }: { editMode?: boolean; selectedFields?: ProfileEditField[] }) {
  const colors = useColors();
  const { language, setLanguage, completeOnboarding, setIntroSeen, profile: savedProfile, username: savedUsername } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [started, setStarted] = React.useState(editMode);
  const [growthSeen, setGrowthSeen] = React.useState(editMode);
  const [step, setStep] = React.useState(0);
  const [equipment, setEquipment] = React.useState<Equipment>('bodyweight');
  const [equipmentDetails, setEquipmentDetails] = React.useState('');
  const [gymLevel, setGymLevel] = React.useState<GymLevel>('full');
  const [goal, setGoal] = React.useState<FitnessGoal>('maintain');
  const [measurementUnit, setMeasurementUnit] = React.useState<MeasurementUnit>('metric');
  const [height, setHeight] = React.useState(170);
  const [weight, setWeight] = React.useState(70);
  const [heightText, setHeightText] = React.useState('170');
  const [heightFeetText, setHeightFeetText] = React.useState('5');
  const [heightInchesText, setHeightInchesText] = React.useState('7');
  const [weightText, setWeightText] = React.useState('70.0');
  const [age, setAge] = React.useState(25);
  const [ageText, setAgeText] = React.useState('25');
  const [username, setUsername] = React.useState('');
  const [sex, setSex] = React.useState<BiologicalSex>('preferNot');
  const [activity, setActivity] = React.useState<ActivityLevel>('light');
  const [trainingDays, setTrainingDays] = React.useState(3);
  const [sessionDuration, setSessionDuration] = React.useState(45);
  const [goalRate, setGoalRate] = React.useState<GoalRate>('balanced');
  const [diet, setDiet] = React.useState<DietPreference>('everything');
  const [proteinPreference, setProteinPreference] = React.useState<ProteinPreference>('balanced');
  const [experience, setExperience] = React.useState<ExperienceLevel>('beginner');
  const [preferredDays, setPreferredDays] = React.useState<string[]>([]);
  const [targetWeightUnit, setTargetWeightUnit] = React.useState<TargetWeightUnit>('kg');
  const [targetWeight, setTargetWeight] = React.useState<number | null>(editMode ? savedProfile?.targetWeight ?? null : null);
  const [targetWeightText, setTargetWeightText] = React.useState('');
  const [buildingPlan, setBuildingPlan] = React.useState(false);
  const [overloadSeen, setOverloadSeen] = React.useState(false);
  const [onboardingMode, setOnboardingMode] = React.useState<OnboardingMode | null>(editMode ? 'detailed' : null);
  const [error, setError] = React.useState('');
    const [questionViewportHeight, setQuestionViewportHeight] = React.useState(0);
    const [questionAnswerBottom, setQuestionAnswerBottom] = React.useState(0);
    const [questionScrollOffset, setQuestionScrollOffset] = React.useState(0);
  const slide = React.useRef(new Animated.Value(1)).current;
  const targetStep = 15;
  const hasTargetWeightStep = goal === 'weightGain' || goal === 'weightLoss';
   const selectedStepIds = React.useMemo<OnboardingStepId[]>(() => {
     if (editMode) return getProfileEditStepIds(selectedFields, hasTargetWeightStep);
     if (onboardingMode === 'quick') return [...QUICK_ONBOARDING_STEP_IDS];
     const detailedSteps = Array.from({ length: hasTargetWeightStep ? 16 : 15 }, (_, index) => index);
     return onboardingMode === null ? [detailedSteps[0], 'mode', ...detailedSteps.slice(1)] : detailedSteps;
   }, [editMode, onboardingMode, selectedFields, hasTargetWeightStep]);
  const total = selectedStepIds.length;
  const activeStep = selectedStepIds[step] ?? step;
   const scrollHintEligible = activeStep === 1 || activeStep === 5 || activeStep === 7 || activeStep === 8 || activeStep === 11 || activeStep === 14;
  const recommendedTargetWeight = React.useMemo(() => recommendTargetWeight({ height, weight, age, goal, sex, activity, goalRate }), [height, weight, age, goal, sex, activity, goalRate]);

  React.useEffect(() => {
    if (!editMode || !savedProfile) return;
    setEquipment(savedProfile.equipment);
    setEquipmentDetails(savedProfile.equipmentDetails ?? '');
    setGymLevel(savedProfile.gymLevel ?? 'full');
    setGoal(savedProfile.goal);
    setHeight(savedProfile.height);
    setWeight(savedProfile.weight);
    setHeightText(String(savedProfile.height));
    setWeightText(savedProfile.weight.toFixed(1));
    setUsername(savedUsername ?? '');
    setSex(savedProfile.sex ?? 'preferNot');
    setActivity(savedProfile.activity ?? 'light');
    setTrainingDays(savedProfile.trainingDays ?? 3);
    setSessionDuration(savedProfile.sessionDuration ?? 45);
    setGoalRate(savedProfile.goalRate ?? 'balanced');
    setDiet(savedProfile.diet ?? 'everything');
    setProteinPreference(savedProfile.proteinPreference ?? 'balanced');
    setExperience(savedProfile.experience ?? 'beginner');
    setPreferredDays(savedProfile.preferredDays ?? []);
    setAge(savedProfile.age);
    setAgeText(String(savedProfile.age));
    if (savedProfile.targetWeight) {
      setTargetWeight(savedProfile.targetWeight);
      setTargetWeightText(savedProfile.targetWeight.toFixed(1));
    }
  // The edit route is mounted with the current saved profile.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, savedProfile, savedUsername]);

  React.useEffect(() => {
    setPreferredDays((current) => current.length > trainingDays ? current.slice(0, trainingDays) : current);
  }, [trainingDays]);

  React.useEffect(() => {
    if (!hasTargetWeightStep || activeStep !== targetStep || targetWeight !== null) return;
    setTargetWeight(recommendedTargetWeight);
    setTargetWeightText(targetWeightUnit === 'kg' ? recommendedTargetWeight.toFixed(1) : (recommendedTargetWeight / KG_PER_POUND).toFixed(1));
  }, [hasTargetWeightStep, activeStep, targetWeight, recommendedTargetWeight, targetWeightUnit]);

  const updateHeightFromCm = (value: number) => {
    const next = Math.round(Math.max(130, Math.min(220, value)));
    setHeight(next);
    const imperial = formatImperialHeight(next);
    setHeightText(String(next));
    setHeightFeetText(String(imperial.feet));
    setHeightInchesText(String(imperial.inches));
  };
  const updateWeightFromKg = (value: number) => {
    const next = Math.round(Math.max(35, Math.min(200, value)) * 10) / 10;
    setWeight(next);
    setWeightText(measurementUnit === 'metric' ? next.toFixed(1) : (next / KG_PER_POUND).toFixed(1));
  };
  const changeMeasurementUnit = (next: MeasurementUnit) => {
    setMeasurementUnit(next);
    const imperial = formatImperialHeight(height);
    setHeightText(String(height));
    setHeightFeetText(String(imperial.feet));
    setHeightInchesText(String(imperial.inches));
    setWeightText(next === 'metric' ? weight.toFixed(1) : (weight / KG_PER_POUND).toFixed(1));
  };
  const updateMetricHeightText = (text: string) => {
    setHeightText(text);
    const parsed = Number(text.replace(',', '.'));
    if (Number.isFinite(parsed) && parsed >= 130 && parsed <= 220) updateHeightFromCm(parsed);
  };
  const updateImperialHeightText = (field: 'feet' | 'inches', text: string) => {
    if (field === 'feet') setHeightFeetText(text);
    else setHeightInchesText(text);
    const feet = field === 'feet' ? Number(text) : Number(heightFeetText);
    const inches = field === 'inches' ? Number(text) : Number(heightInchesText);
    if (text.trim() && (field === 'feet' ? heightInchesText.trim() : heightFeetText.trim()) && Number.isFinite(feet) && Number.isFinite(inches) && inches >= 0 && inches <= 11) updateHeightFromCm((feet * 12 + inches) * 2.54);
  };
  const updateWeightText = (text: string) => {
    setWeightText(text);
    const parsed = Number(text.replace(',', '.'));
    const next = measurementUnit === 'metric' ? parsed : parsed * KG_PER_POUND;
    if (Number.isFinite(parsed) && next >= 35 && next <= 200) updateWeightFromKg(next);
  };
  const updateTargetWeightFromKg = (valueKg: number) => {
    const next = Math.round(Math.max(35, Math.min(200, valueKg)) * 10) / 10;
    setTargetWeight(next);
    setTargetWeightText(targetWeightUnit === 'kg' ? next.toFixed(1) : (next / KG_PER_POUND).toFixed(1));
  };
  const changeTargetWeightUnit = (nextUnit: TargetWeightUnit) => {
    setTargetWeightUnit(nextUnit);
    const valueKg = targetWeight ?? recommendedTargetWeight;
    setTargetWeightText(nextUnit === 'kg' ? valueKg.toFixed(1) : (valueKg / KG_PER_POUND).toFixed(1));
  };
  const updateTargetWeightText = (text: string) => {
    setTargetWeightText(text);
    const parsed = Number(text.replace(',', '.'));
    const valueKg = targetWeightUnit === 'kg' ? parsed : parsed * KG_PER_POUND;
    if (Number.isFinite(parsed) && valueKg >= 35 && valueKg <= 200) setTargetWeight(Math.round(valueKg * 10) / 10);
  };
  const updateAge = (value: number) => {
    const next = Math.max(13, Math.min(90, Math.round(value)));
    setAge(next);
    setAgeText(String(next));
  };
  const updateAgeText = (text: string) => {
    setAgeText(text);
    const parsed = Number(text);
    if (Number.isInteger(parsed) && parsed >= 13 && parsed <= 90) setAge(parsed);
  };
  const advance = () => {
    Animated.sequence([Animated.timing(slide, { toValue: 0, duration: 120, useNativeDriver: true }), Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true })]).start();
    setStep((current) => current + 1);
  };
  const buildProfile = (): Profile => ({
      equipment,
      equipmentDetails: equipment === 'home' ? equipmentDetails.trim() : undefined,
      gymLevel: equipment === 'gym' ? gymLevel : undefined,
      // Keep the legacy profile value for existing users, but no longer ask
      // for it during onboarding. New values are entered per exercise.
      dumbbellWeightKg: editMode ? savedProfile?.dumbbellWeightKg : undefined,
      height,
      weight,
      age,
      goal,
      sex,
      activity,
      trainingDays,
      sessionDuration,
      goalRate,
      diet,
      proteinPreference,
      experience,
      preferredDays,
      targetWeight: hasTargetWeightStep ? (targetWeight ?? recommendedTargetWeight) : recommendTargetWeight({ height, weight, age, goal, sex, activity, goalRate }),
  });
  const finish = (ai: AiPlan | null) => {
    const cleanUsername = username.trim().replace(/\s+/g, '').toLowerCase();
    completeOnboarding(buildProfile(), cleanUsername, { profileEdit: editMode, ai });
    if (editMode) {
      router.replace('/(tabs)');
      return;
    }
    setIntroSeen();
  };
  const next = () => {
    setError('');
    if (activeStep === 0) {
      const clean = username.trim().replace(/\s+/g, '').toLowerCase();
      if (!clean) return setError(t('usernameRequired'));
      if (!editMode && !onboardingMode) {
        return advance();
      }
    }
    if (activeStep === 'mode') return;
    if (activeStep === 1 && equipment === 'gym' && !gymLevel) return setError(t('gymLevelQuestion'));
    if (activeStep === 2) {
      if (measurementUnit === 'metric') {
        const parsed = Number(heightText.replace(',', '.'));
        if (!Number.isFinite(parsed) || parsed < 130 || parsed > 220) return setError(t('heightRangeError'));
        updateHeightFromCm(parsed);
      } else {
        const feet = Number(heightFeetText);
        const inches = Number(heightInchesText);
        const totalInches = feet * 12 + inches;
        const cm = totalInches * 2.54;
        if (!Number.isInteger(feet) || !Number.isInteger(inches) || feet < 4 || feet > 7 || inches < 0 || inches > 11 || cm < 130 || cm > 220) return setError(t('heightRangeError'));
        updateHeightFromCm(cm);
      }
    }
    if (activeStep === 3) {
      const parsed = Number(weightText.replace(',', '.'));
      const kg = measurementUnit === 'metric' ? parsed : parsed * KG_PER_POUND;
      if (!Number.isFinite(parsed) || kg < 35 || kg > 200) return setError(t('weightRangeError'));
      updateWeightFromKg(kg);
    }
    if (activeStep === 4) {
      const parsed = Number(ageText);
      if (!Number.isInteger(parsed) || parsed < 13 || parsed > 90) return setError(t('ageRangeError'));
      updateAge(parsed);
    }
    if (activeStep === targetStep && hasTargetWeightStep) {
      const parsed = Number(targetWeightText.replace(',', '.'));
      const valueKg = targetWeightUnit === 'kg' ? parsed : parsed * KG_PER_POUND;
      if (!Number.isFinite(parsed) || valueKg < 35 || valueKg > 200) return setError(t('weightRangeError'));
      if ((goal === 'weightGain' && valueKg <= weight) || (goal === 'weightLoss' && valueKg >= weight)) return setError(t('targetWeightDirectionError'));
      updateTargetWeightFromKg(valueKg);
    }
    if (activeStep === 14 && preferredDays.length !== trainingDays) return setError(t('preferredDaysCountError'));
    if (step === total - 1) return advance();
    advance();
  };
  const goBack = () => {
    if (activeStep === 'mode') {
      setOnboardingMode(null);
      setStep(0);
      return;
    }
    if (step === 0) {
      return;
    }
    Animated.sequence([Animated.timing(slide, { toValue: 0, duration: 120, useNativeDriver: true }), Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true })]).start();
    setStep((current) => Math.max(0, current - 1));
  };
  const swipeResponder = React.useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
    onPanResponderRelease: (_, gesture) => {
      if (typeof activeStep !== 'number' || (activeStep >= 2 && activeStep <= 4) || activeStep === targetStep) return;
      if (gesture.dx < -55) next();
      if (gesture.dx > 55) goBack();
    },
  }), [language, step, activeStep, username, equipment, gymLevel, age, measurementUnit, heightText, heightFeetText, heightInchesText, weightText, ageText, targetWeightText, targetWeightUnit, hasTargetWeightStep, goal]);
   React.useEffect(() => {
     setQuestionScrollOffset(0);
     setQuestionAnswerBottom(0);
     setQuestionViewportHeight(0);
   }, [activeStep]);
  const titleKeys = ['nameFirstQuestion', 'equipmentQuestion', 'heightQuestion', 'weightQuestion', 'ageQuestion', 'goalQuestion', 'sexQuestion', 'activityQuestion', 'trainingDaysQuestion', 'durationQuestion', 'speedQuestion', 'dietQuestion', 'proteinQuestion', 'experienceQuestion', 'preferredDaysQuestion'] as const;
  const selectedDays = (day: string) => { setError(''); setPreferredDays((current) => {
    if (current.includes(day)) return current.filter((item) => item !== day);
    if (current.length >= trainingDays) return current;
    return [...current, day];
  }); };
  const renderBody = () => {
    if (activeStep === 0) return <><Text style={[styles.questionHint, { color: colors.mutedForeground }]}>{t('nameFirstHint')}</Text><TextInput autoFocus autoCapitalize="none" value={username} onChangeText={setUsername} placeholder={t('usernamePlaceholder')} placeholderTextColor={colors.mutedForeground} style={[styles.textInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /></>;
       if (activeStep === 1) return <><View style={styles.choiceList}><ChoiceButton label={t('bodyweight')} selected={equipment === 'bodyweight'} onPress={() => setEquipment('bodyweight')} icon="body-outline" /><ChoiceButton label={t('homeEquipment')} selected={equipment === 'home'} onPress={() => setEquipment('home')} icon="home-outline" /><ChoiceButton label={t('gymEquipment')} selected={equipment === 'gym'} onPress={() => setEquipment('gym')} icon="barbell-outline" /></View>{equipment === 'home' ? <View style={styles.homeEquipmentDetails}><Text style={[styles.subLabel, { color: colors.mutedForeground }]}>{t('homeEquipmentDetailsHint')}</Text><TextInput value={equipmentDetails} onChangeText={setEquipmentDetails} multiline numberOfLines={3} placeholder={t('homeEquipmentDetailsPlaceholder')} placeholderTextColor={colors.mutedForeground} style={[styles.equipmentDetailsInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /></View> : null}{equipment === 'gym' ? <View style={styles.gymLevels}><Text style={[styles.subLabel, { color: colors.mutedForeground }]}>{t('gymLevelQuestion')}</Text><View style={styles.choiceList}><ChoiceButton label={t('gymBasic')} selected={gymLevel === 'basic'} onPress={() => setGymLevel('basic')} /><ChoiceButton label={t('gymIntermediate')} selected={gymLevel === 'intermediate'} onPress={() => setGymLevel('intermediate')} /><ChoiceButton label={t('gymFull')} selected={gymLevel === 'full'} onPress={() => setGymLevel('full')} /></View></View> : null}</>;
      if (activeStep === 2) return <View style={styles.measurementSection}>
       <UnitToggle unit={measurementUnit} onChange={changeMeasurementUnit} metricLabel={t('measurementMetric')} imperialLabel={t('measurementImperial')} />
       <RulerPicker value={height} min={130} max={220} onChange={updateHeightFromCm} valueLabel={measurementUnit === 'metric' ? `${height} cm` : formatImperialHeightLabel(height)} minLabel={measurementUnit === 'metric' ? '130 cm' : formatImperialHeightLabel(130)} maxLabel={measurementUnit === 'metric' ? '220 cm' : formatImperialHeightLabel(220)} />
       {measurementUnit === 'metric' ? <View style={styles.measurementInputRow}><TextInput value={heightText} onChangeText={updateMetricHeightText} keyboardType="number-pad" selectTextOnFocus style={[styles.measurementInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /><Text style={[styles.measurementInputUnit, { color: colors.primary }]}>cm</Text></View> : <View style={styles.measurementInputRow}><TextInput value={heightFeetText} onChangeText={(text) => updateImperialHeightText('feet', text)} keyboardType="number-pad" selectTextOnFocus style={[styles.measurementInput, styles.measurementSmallInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /><Text style={[styles.measurementInputUnit, { color: colors.primary }]}>{t('heightFeet')}</Text><TextInput value={heightInchesText} onChangeText={(text) => updateImperialHeightText('inches', text)} keyboardType="number-pad" selectTextOnFocus style={[styles.measurementInput, styles.measurementSmallInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /><Text style={[styles.measurementInputUnit, { color: colors.primary }]}>{t('heightInches')}</Text></View>}
       <Text style={[styles.centerHint, { color: colors.mutedForeground }]}>{t('heightRulerHint')}</Text>
     </View>;
      if (activeStep === 3) return <View style={styles.measurementSection}><UnitToggle unit={measurementUnit} onChange={changeMeasurementUnit} metricLabel={t('measurementMetric')} imperialLabel={t('measurementImperial')} /><WeightPicker value={weight} unit={measurementUnit} inputValue={weightText} onInputChange={updateWeightText} onChange={updateWeightFromKg} /><Text style={[styles.centerHint, { color: colors.mutedForeground }]}>{t('weightInputHint')}</Text></View>;
       if (activeStep === 4) return <><AgePicker value={age} inputValue={ageText} yearsLabel={t('ageYears')} onInputChange={updateAgeText} onChange={updateAge} /><Text style={[styles.centerHint, { color: colors.mutedForeground }]}>{age} {t('ageYears')}</Text></>;
      if (activeStep === 5) return <View style={styles.choiceList}><ChoiceButton label={t('goalMuscle')} selected={goal === 'muscle'} onPress={() => { setGoal('muscle'); setTargetWeight(null); }} icon="trending-up-outline" /><ChoiceButton label={t('goalWeightGain')} selected={goal === 'weightGain'} onPress={() => { setGoal('weightGain'); setTargetWeight(null); }} icon="trending-up-outline" /><ChoiceButton label={t('goalWeightLoss')} selected={goal === 'weightLoss'} onPress={() => { setGoal('weightLoss'); setTargetWeight(null); }} icon="scale-outline" /><ChoiceButton label={t('goalFatLoss')} selected={goal === 'fatLoss'} onPress={() => { setGoal('fatLoss'); setTargetWeight(null); }} icon="flame-outline" /><ChoiceButton label={t('goalMaintain')} selected={goal === 'maintain'} onPress={() => { setGoal('maintain'); setTargetWeight(null); }} icon="pause-outline" /></View>;
     if (activeStep === 6) return <View style={styles.choiceList}><ChoiceButton label={t('sexFemale')} selected={sex === 'female'} onPress={() => setSex('female')} /><ChoiceButton label={t('sexMale')} selected={sex === 'male'} onPress={() => setSex('male')} /><ChoiceButton label={t('sexPreferNot')} selected={sex === 'preferNot'} onPress={() => setSex('preferNot')} /></View>;
     if (activeStep === 7) return <View style={styles.choiceList}><ChoiceButton label={t('activitySedentary')} selected={activity === 'sedentary'} onPress={() => setActivity('sedentary')} /><ChoiceButton label={t('activityLight')} selected={activity === 'light'} onPress={() => setActivity('light')} /><ChoiceButton label={t('activityModerate')} selected={activity === 'moderate'} onPress={() => setActivity('moderate')} /><ChoiceButton label={t('activityHigh')} selected={activity === 'high'} onPress={() => setActivity('high')} /></View>;
     if (activeStep === 8) return <View style={styles.choiceList}>{[2, 3, 4, 5, 6].map((days) => <ChoiceButton key={days} label={`${days} ${t('dayUnit')}`} selected={trainingDays === days} onPress={() => setTrainingDays(days)} />)}</View>;
     if (activeStep === 9) return <View style={styles.choiceList}><ChoiceButton label={t('durationShort')} selected={sessionDuration === 25} onPress={() => setSessionDuration(25)} /><ChoiceButton label={t('durationMedium')} selected={sessionDuration === 45} onPress={() => setSessionDuration(45)} /><ChoiceButton label={t('durationLong')} selected={sessionDuration === 60} onPress={() => setSessionDuration(60)} /></View>;
     if (activeStep === 10) return <View style={styles.choiceList}><ChoiceButton label={t('speedSlow')} selected={goalRate === 'slow'} onPress={() => setGoalRate('slow')} /><ChoiceButton label={t('speedBalanced')} selected={goalRate === 'balanced'} onPress={() => setGoalRate('balanced')} /><ChoiceButton label={t('speedFast')} selected={goalRate === 'fast'} onPress={() => setGoalRate('fast')} /></View>;
     if (activeStep === 11) return <View style={styles.choiceList}><ChoiceButton label={t('dietEverything')} selected={diet === 'everything'} onPress={() => setDiet('everything')} /><ChoiceButton label={t('dietVegetarian')} selected={diet === 'vegetarian'} onPress={() => setDiet('vegetarian')} /><ChoiceButton label={t('dietVegan')} selected={diet === 'vegan'} onPress={() => setDiet('vegan')} /><ChoiceButton label={t('dietHalal')} selected={diet === 'halal'} onPress={() => setDiet('halal')} /></View>;
     if (activeStep === 12) return <View style={styles.choiceList}><ChoiceButton label={t('proteinBalanced')} selected={proteinPreference === 'balanced'} onPress={() => setProteinPreference('balanced')} /><ChoiceButton label={t('proteinHigh')} selected={proteinPreference === 'high'} onPress={() => setProteinPreference('high')} /><ChoiceButton label={t('proteinLower')} selected={proteinPreference === 'lower'} onPress={() => setProteinPreference('lower')} /></View>;
     if (activeStep === 13) return <View style={styles.choiceList}><ChoiceButton label={t('experienceBeginner')} selected={experience === 'beginner'} onPress={() => setExperience('beginner')} /><ChoiceButton label={t('experienceIntermediate')} selected={experience === 'intermediate'} onPress={() => setExperience('intermediate')} /><ChoiceButton label={t('experienceAdvanced')} selected={experience === 'advanced'} onPress={() => setExperience('advanced')} /></View>;
      if (activeStep === targetStep && hasTargetWeightStep) return <><GoalWeightPicker valueKg={targetWeight ?? recommendedTargetWeight} recommendedKg={recommendedTargetWeight} unit={targetWeightUnit} inputValue={targetWeightText} recommendedLabel={t('recommendedTarget')} onInputChange={updateTargetWeightText} onChange={updateTargetWeightFromKg} onUnitChange={changeTargetWeightUnit} /><Text style={[styles.centerHint, { color: colors.mutedForeground }]}>{t('targetWeightHint')}</Text></>;
    return <><View style={styles.dayGrid}>{['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => <Pressable key={day} onPress={() => selectedDays(day)} style={[styles.dayButton, { backgroundColor: preferredDays.includes(day) ? colors.accent : colors.card, borderColor: preferredDays.includes(day) ? colors.accent : colors.border, opacity: !preferredDays.includes(day) && preferredDays.length >= trainingDays ? 0.45 : 1 }]}><Text style={[styles.dayText, { color: preferredDays.includes(day) ? '#FFFFFF' : colors.foreground }]}>{dayShort(day, language)}</Text></Pressable>)}</View><Text style={[styles.centerHint, { color: colors.mutedForeground }]}>{preferredDays.length}/{trainingDays} · {t('preferredDaysQuestion')}</Text></>;
  };

  const chooseMode = (mode: OnboardingMode) => {
    triggerHaptic();
    setOnboardingMode(mode);
    setStep(mode === 'quick' ? 0 : 1);
    slide.setValue(1);
  };

     if (!started) return <View style={styles.onboardingShell}><WelcomeScreen onStart={() => { slide.setValue(1); setStarted(true); }} /></View>;
     if (!growthSeen) return <View style={styles.onboardingShell}><GrowthComparisonScreen onContinue={() => setGrowthSeen(true)} /></View>;
    if (!editMode && activeStep === 'mode') return <OnboardingModeChoice onSelect={chooseMode} onBack={() => { setOnboardingMode(null); setStep(0); }} />;
    if (buildingPlan) return <View style={styles.onboardingShell}><PlanBuildingScreen request={() => requestAiPlan(buildProfile(), language)} onComplete={finish} /></View>;
    if (step === total && equipment === 'gym' && !overloadSeen) return <View style={styles.onboardingShell}><ProgressiveOverloadScreen onContinue={() => setOverloadSeen(true)} /></View>;
   if (step === total) return <View style={styles.onboardingShell}><CompletionScreen onContinue={() => setBuildingPlan(true)} /></View>;
    const numericStep = typeof activeStep === 'number' ? activeStep : 0;
    const optional = onboardingMode !== 'quick' && numericStep >= 6 && !hasTargetWeightStep;
    const isTargetStep = numericStep === targetStep && hasTargetWeightStep;
    const titleKey: Parameters<typeof translate>[1] = isTargetStep ? 'targetWeightQuestion' : titleKeys[numericStep] ?? 'preferredDaysQuestion';
    return <View style={ui.page}>
      <OnboardingBackdrop />
      <OnboardingTopBar onBack={step > 0 ? goBack : undefined} step={step} total={total} />
      <Animated.View {...swipeResponder.panHandlers} onLayout={({ nativeEvent }) => setQuestionViewportHeight(nativeEvent.layout.height)} style={[ui.questionBody, { opacity: slide, transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}>
        <KeyboardAwareScrollViewCompat
          contentContainerStyle={ui.questionScroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
          bottomOffset={72}
          onScroll={({ nativeEvent }) => setQuestionScrollOffset(nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
        >
          {editMode ? <View style={[styles.profileEditInfoBar, { backgroundColor: `${colors.blue}16`, borderColor: `${colors.blue}55` }]}><Ionicons name="information-circle-outline" size={18} color={colors.blue} /><Text style={[styles.profileEditInfoText, { color: colors.foreground }]}>{t('profileEditLimitBar')}</Text></View> : null}
          <View onLayout={({ nativeEvent }) => setQuestionAnswerBottom(nativeEvent.layout.y + nativeEvent.layout.height)}>
            <View style={ui.stepHeader}>
              <Text style={[ui.stepNumber, { color: colors.accent }]}>{String(step + 1).padStart(2, '0')}</Text>
              <Text style={[ui.stepTotal, { color: colors.mutedForeground }]}>/ {String(total).padStart(2, '0')}</Text>
              {optional ? <View style={[ui.optionalTag, { borderColor: colors.border }]}><Text style={[ui.optionalText, { color: colors.mutedForeground }]}>{t('optionalLabel')}</Text></View> : null}
            </View>
            <Text style={[ui.questionTitle, { color: colors.foreground }]}>{t(titleKey)}</Text>
            {renderBody()}
            {error ? <View style={[ui.errorBox, { backgroundColor: `${colors.destructive}14` }]}><Ionicons name="alert-circle" size={16} color={colors.destructive} /><Text style={[ui.errorText, { color: colors.destructive }]}>{error}</Text></View> : null}
          </View>
        </KeyboardAwareScrollViewCompat>
        <OnboardingScrollHint visible={scrollHintEligible && questionAnswerBottom > questionViewportHeight + 18 && questionScrollOffset < Math.max(0, questionAnswerBottom - questionViewportHeight - 18)} />
      </Animated.View>
      <CoachPulse step={step} />
      <OnboardingCTA testID="onboarding-next" label={step === total - 1 ? t('continueToPlan') : t('continue')} onPress={next} />
    </View>;
}

// The minimal identity keeps the ground calm; the mascot and type carry the screen.
function OnboardingAtmosphere() {
  return null;
}

function WelcomeLanguageSelector({ language, onSelect }: { language: Language; onSelect: (language: Language) => void }) {
  const colors = useColors();
  return <View style={[styles.welcomeLanguagePill, { backgroundColor: colors.card, borderColor: colors.border }]}>
    {(Object.keys(languageLabels) as Language[]).map((item) => (
      <Pressable key={item} onPress={() => { triggerHaptic(); onSelect(item); }} style={[styles.welcomeLanguageOption, language === item ? [styles.welcomeLanguageSelected, { backgroundColor: colors.secondary }] : null]}>
        <MiniFlag language={item} />
      </Pressable>
    ))}
  </View>;
}

function CompletionCheckmark() {
  const colors = useColors();
  const appear = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.delay(180),
      Animated.spring(appear, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
    ]).start();
  }, [appear]);

  return <Animated.View style={[styles.completionCheckmark, { backgroundColor: `${colors.success}20`, borderColor: `${colors.success}90`, opacity: appear, transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }, { translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}>
    <Ionicons name="checkmark" size={25} color={colors.success} />
  </Animated.View>;
}

/**
 * Onboarding backdrop: the page colour with two slow-drifting colour fields, so every step shares
 * the same calm, living ground.
 */
function OnboardingBackdrop() {
  const colors = useColors();
  const reduced = useReducedMotion();
  const drift = useSharedValue(0);
  React.useEffect(() => {
    if (reduced) return;
    drift.set(withRepeat(withTiming(1, { duration: 9000, easing: ReEasing.inOut(ReEasing.sin) }), -1, true));
  }, [drift, reduced]);
  const blobA = useAnimatedStyle(() => ({ transform: [{ translateX: -30 + drift.get() * 60 }, { translateY: drift.get() * 40 }] }));
  const blobB = useAnimatedStyle(() => ({ transform: [{ translateX: 30 - drift.get() * 50 }, { translateY: -drift.get() * 30 }] }));
  const dark = colors.colorScheme === 'dark';
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
    <ReAnimated.View style={[ui.blob, { top: -140, right: -160 }, blobA]}>
      <Svg width={420} height={420}><Defs><RadialGradient id="obA" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor={colors.accent} stopOpacity={dark ? 0.32 : 0.2} /><Stop offset="1" stopColor={colors.accent} stopOpacity={0} /></RadialGradient></Defs><SvgCircle cx={210} cy={210} r={210} fill="url(#obA)" /></Svg>
    </ReAnimated.View>
    <ReAnimated.View style={[ui.blob, { bottom: -180, left: -180 }, blobB]}>
      <Svg width={440} height={440}><Defs><RadialGradient id="obB" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#8B5CF6" stopOpacity={dark ? 0.22 : 0.12} /><Stop offset="1" stopColor="#8B5CF6" stopOpacity={0} /></RadialGradient></Defs><SvgCircle cx={220} cy={220} r={220} fill="url(#obB)" /></Svg>
    </ReAnimated.View>
  </View>;
}

/** Top row shared by every onboarding page: optional back, the wordmark, and the language flags. */
function OnboardingTopBar({ onBack, step, total }: { onBack?: () => void; step?: number; total?: number }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useFit();
  const progress = step !== undefined && total ? (step + 1) / total : null;
  const fill = useSharedValue(progress ?? 0);
  React.useEffect(() => {
    if (progress !== null) fill.set(withTiming(progress, { duration: 420, easing: ReEasing.out(ReEasing.cubic) }));
  }, [fill, progress]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.get() * 100}%` }));
  return <View style={[ui.topBar, { paddingTop: insets.top + 10 }]}>
    <View style={ui.topRow}>
      {onBack ? <Pressable testID="onboarding-back" accessibilityRole="button" onPress={onBack} style={[ui.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="arrow-back" size={18} color={colors.foreground} />
      </Pressable> : <GainModeWordmark color={colors.foreground} width={118} height={17} />}
      <WelcomeLanguageSelector language={language} onSelect={setLanguage} />
    </View>
    {progress !== null ? <View style={[ui.progressTrack, { backgroundColor: `${colors.foreground}14` }]}>
      <ReAnimated.View style={[ui.progressFill, { backgroundColor: colors.foreground }, fillStyle]} />
    </View> : null}
  </View>;
}

/** Primary onboarding action: a full-width pill with its arrow in a contrasting circle. */
function OnboardingCTA({ label, onPress, disabled = false, testID }: { label: string; onPress: () => void; disabled?: boolean; testID?: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const shine = useSharedValue(0);
  const nudge = useSharedValue(0);
  React.useEffect(() => {
    if (reduced) return;
    shine.set(withRepeat(withSequence(withTiming(1, { duration: 1300, easing: ReEasing.inOut(ReEasing.cubic) }), withDelay(1600, withTiming(0, { duration: 0 }))), -1));
    nudge.set(withRepeat(withSequence(withTiming(1, { duration: 520, easing: ReEasing.out(ReEasing.cubic) }), withTiming(0, { duration: 520, easing: ReEasing.in(ReEasing.cubic) })), -1));
  }, [nudge, reduced, shine]);
  const shineStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -140 + shine.get() * 560 }, { skewX: '-20deg' }] }));
  const arrowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: nudge.get() * 5 }] }));
  return <View style={[ui.ctaWrap, { paddingBottom: insets.bottom + 16 }]}>
    <Pressable testID={testID} accessibilityRole="button" disabled={disabled} onPress={() => { triggerHaptic(); onPress(); }} scaleTo={0.97} style={[ui.cta, { opacity: disabled ? 0.6 : 1, shadowColor: colors.accent }]}>
      <LinearGradient colors={['#7FA6FF', colors.accent, '#2F5BD8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <ReAnimated.View pointerEvents="none" style={[ui.ctaShine, shineStyle]}>
        <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      </ReAnimated.View>
      <Text style={ui.ctaText}>{label}</Text>
      <ReAnimated.View style={[ui.ctaArrow, arrowStyle]}><Ionicons name="arrow-forward" size={18} color="#FFFFFF" /></ReAnimated.View>
    </Pressable>
  </View>;
}

/**
 * A stage for the mascot or an icon: two dashed orbits turning in opposite directions around a
 * soft glow that breathes. Used on the welcome, completion and plan pages.
 */
function GlowStage({ size, children, tint }: { size: number; children: React.ReactNode; tint?: string }) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const spin = useSharedValue(0);
  const breathe = useSharedValue(0);
  const color = tint ?? colors.accent;
  React.useEffect(() => {
    if (reduced) return;
    spin.set(withRepeat(withTiming(1, { duration: 26000, easing: ReEasing.linear }), -1));
    breathe.set(withRepeat(withTiming(1, { duration: 2600, easing: ReEasing.inOut(ReEasing.sin) }), -1, true));
  }, [breathe, reduced, spin]);
  const outer = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.get() * 360}deg` }] }));
  const inner = useAnimatedStyle(() => ({ transform: [{ rotate: `${-spin.get() * 520}deg` }] }));
  const glow = useAnimatedStyle(() => ({ opacity: 0.55 + breathe.get() * 0.35, transform: [{ scale: 0.92 + breathe.get() * 0.1 }] }));
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <ReAnimated.View style={[StyleSheet.absoluteFill, glow]}>
      <Svg width={size} height={size}><Defs><RadialGradient id="stageGlow" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor={color} stopOpacity={0.4} /><Stop offset="0.6" stopColor={color} stopOpacity={0.1} /><Stop offset="1" stopColor={color} stopOpacity={0} /></RadialGradient></Defs><SvgCircle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#stageGlow)" /></Svg>
    </ReAnimated.View>
    <ReAnimated.View style={[StyleSheet.absoluteFill, outer]}>
      <Svg width={size} height={size}><SvgCircle cx={size / 2} cy={size / 2} r={size / 2 - 6} stroke={colors.foreground} strokeOpacity={0.14} strokeWidth={1.5} strokeDasharray="2 10" fill="none" /><SvgCircle cx={size / 2} cy={6} r={4} fill={color} /></Svg>
    </ReAnimated.View>
    <ReAnimated.View style={[StyleSheet.absoluteFill, inner]}>
      <Svg width={size} height={size}><SvgCircle cx={size / 2} cy={size / 2} r={size * 0.36} stroke={colors.foreground} strokeOpacity={0.1} strokeWidth={1} fill="none" /><SvgCircle cx={size / 2 + size * 0.36} cy={size / 2} r={3} fill={colors.foreground} fillOpacity={0.5} /></Svg>
    </ReAnimated.View>
    {children}
  </View>;
}

/** Fades and lifts its children in after `delay` ms. */
function Rise({ delay = 0, children, style }: { delay?: number; children: React.ReactNode; style?: object }) {
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);
  React.useEffect(() => {
    if (!reduced) p.set(withDelay(delay, withTiming(1, { duration: 520, easing: ReEasing.out(ReEasing.cubic) })));
  }, [delay, p, reduced]);
  const animated = useAnimatedStyle(() => ({ opacity: p.get(), transform: [{ translateY: (1 - p.get()) * 18 }] }));
  return <ReAnimated.View style={[style, animated]}>{children}</ReAnimated.View>;
}

/**
 * An answer tile. Tiles sit two to a row and a lone last tile stretches across. Picking one fills
 * it with the accent gradient, pops it slightly and springs a check into the corner badge.
 */
function ChoiceButton({ label, selected, onPress, icon }: { label: string; selected: boolean; onPress: () => void; icon?: React.ComponentProps<typeof Ionicons>['name'] }) {
  const colors = useColors();
  const pick = useSharedValue(selected ? 1 : 0);
  const pop = useSharedValue(1);
  React.useEffect(() => {
    pick.set(withSpring(selected ? 1 : 0, { damping: 16, stiffness: 240 }));
    if (selected) pop.set(withSequence(withTiming(1.035, { duration: 110 }), withSpring(1, { damping: 12, stiffness: 260 })));
  }, [pick, pop, selected]);
  const fillStyle = useAnimatedStyle(() => ({ opacity: pick.get() }));
  const tileStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: pick.get(), transform: [{ scale: 0.4 + pick.get() * 0.6 }, { rotate: `${(1 - pick.get()) * -40}deg` }] }));
  const ink = selected ? '#FFFFFF' : colors.foreground;
  return <ReAnimated.View style={[ui.choiceSlot, tileStyle]}>
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => { triggerHaptic(); onPress(); }} scaleTo={0.96} style={[ui.choice, icon ? ui.choiceTall : null, { backgroundColor: colors.card, borderColor: selected ? colors.accent : colors.border }]}>
      <ReAnimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, fillStyle]}>
        <LinearGradient colors={['#7FA6FF', colors.accent, '#2F5BD8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </ReAnimated.View>
      {icon ? <View style={[ui.choiceIcon, { backgroundColor: selected ? 'rgba(255,255,255,0.2)' : colors.secondary }]}><Ionicons name={icon} size={20} color={ink} /></View> : null}
      <Text style={[ui.choiceText, { color: ink }]}>{label}</Text>
      <View style={[ui.choiceBadge, { borderColor: selected ? 'transparent' : colors.border }]}>
        <ReAnimated.View style={[ui.choiceBadgeFill, checkStyle]}><Ionicons name="checkmark" size={13} color={colors.accent} /></ReAnimated.View>
      </View>
    </Pressable>
  </ReAnimated.View>;
}

function OnboardingModeChoice({ onSelect, onBack }: { onSelect: (mode: OnboardingMode) => void; onBack: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  return <View style={ui.page}>
    <OnboardingBackdrop />
    <OnboardingTopBar onBack={onBack} />
    <View style={ui.modeBody}>
      <Rise><Text style={[ui.eyebrow, { color: colors.mutedForeground }]}>{t('onboardingModeEyebrow')}</Text></Rise>
      <Rise delay={60}><Text style={[ui.title, { color: colors.foreground }]}>{t('onboardingModeTitle')}</Text></Rise>
      <Rise delay={120}><Text style={[ui.subtitle, { color: colors.mutedForeground }]}>{t('onboardingModeSubtitle')}</Text></Rise>
      <Rise delay={200} style={{ marginTop: 26 }}>
        <Pressable testID="mode-quick" accessibilityRole="button" onPress={() => onSelect('quick')} scaleTo={0.98}>
          <LinearGradient colors={[colors.inkCardStart, colors.inkCardEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ui.modeHero}>
            <View style={ui.modeHeroTop}>
              <View style={[ui.modeHeroIcon, { backgroundColor: `${colors.inkCardForeground}1A` }]}><Ionicons name="flash-outline" size={24} color="#FCD34D" /></View>
              <View style={[ui.modeTag, { backgroundColor: '#FCD34D' }]}><Text style={ui.modeTagText}>{t('onboardingQuickCount')}</Text></View>
            </View>
            <Text style={[ui.modeHeroTitle, { color: colors.inkCardForeground }]}>{t('onboardingQuickTitle')}</Text>
            <Text style={[ui.modeHeroBody, { color: `${colors.inkCardForeground}B3` }]}>{t('onboardingQuickDescription')}</Text>
            <View style={ui.modeSpeed}>{[0, 1, 2, 3, 4].map((index) => <View key={index} style={[ui.modeSpeedBar, { backgroundColor: index < 2 ? '#FCD34D' : `${colors.inkCardForeground}22`, height: 6 + index * 3 }]} />)}</View>
          </LinearGradient>
        </Pressable>
      </Rise>
      <Rise delay={280} style={{ marginTop: 12 }}>
        <Pressable testID="mode-detailed" accessibilityRole="button" onPress={() => onSelect('detailed')} scaleTo={0.98} style={[ui.modeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[ui.modeHeroIcon, { backgroundColor: colors.secondary }]}><Ionicons name="analytics-outline" size={22} color={colors.foreground} /></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[ui.modeCardTitle, { color: colors.foreground }]}>{t('onboardingDetailedTitle')}</Text>
            <Text style={[ui.modeCardBody, { color: colors.mutedForeground }]}>{t('onboardingDetailedDescription')}</Text>
            <Text style={[ui.modeCardCount, { color: colors.accent }]}>{t('onboardingDetailedCount')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>
      </Rise>
    </View>
  </View>;
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const float = useSharedValue(0);
  const leave = useSharedValue(0);
  const [leaving, setLeaving] = React.useState(false);
  React.useEffect(() => {
    if (!reduced) float.set(withRepeat(withTiming(1, { duration: 2200, easing: ReEasing.inOut(ReEasing.sin) }), -1, true));
  }, [float, reduced]);
  const mascotStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -10 * float.get() }, { rotate: `${-2 + float.get() * 4}deg` }] }));
  const pageStyle = useAnimatedStyle(() => ({ opacity: 1 - leave.get() * 0.4, transform: [{ translateX: -leave.get() * width * 0.35 }, { scale: 1 - leave.get() * 0.04 }] }));
  const start = () => {
    if (leaving) return;
    setLeaving(true);
    leave.set(withTiming(1, { duration: 380, easing: ReEasing.in(ReEasing.cubic) }));
    setTimeout(onStart, reduced ? 0 : 360);
  };
  const stage = Math.min(width - 24, 360);
  const words = t('welcomeHeroTitle').split('. ').map((part, index, all) => (index < all.length - 1 ? `${part}.` : part));

  return <View style={ui.page}>
    <OnboardingBackdrop />
    <ReAnimated.View style={[{ flex: 1 }, pageStyle]}>
      <OnboardingTopBar />
      <View style={ui.welcomeBody}>
        <Rise style={ui.welcomeStage}><View style={{ width: stage, height: stage }}>
          <GlowStage size={stage}>
            <ReAnimated.View style={mascotStyle}>
              <Image source={require('@/assets/images/coach-wave-transparent.png')} resizeMode="contain" style={{ width: stage * 0.78, height: stage * 0.78 }} />
            </ReAnimated.View>
          </GlowStage>
          <View style={[ui.floatChip, { left: 6, top: stage * 0.2, backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="camera-outline" size={14} color={colors.foreground} /><Text style={[ui.floatChipText, { color: colors.foreground }]}>AI</Text></View>
          <View style={[ui.floatChip, { right: 6, top: stage * 0.55, backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="barbell-outline" size={14} color={colors.foreground} /><Ionicons name="flame" size={14} color={colors.orange} /></View>
        </View></Rise>
        <View>
          {words.map((line, index) => <Rise key={line} delay={160 + index * 90}><Text style={[ui.welcomeTitle, { color: index === words.length - 1 ? colors.accent : colors.foreground }]}>{line}</Text></Rise>)}
          <Rise delay={360}><Text style={[ui.subtitle, { color: colors.mutedForeground }]}>{t('welcomeHeroSubtitle')}</Text></Rise>
        </View>
      </View>
      <Rise delay={460}><OnboardingCTA testID="onboarding-start" label={t('welcomeHeroStart')} onPress={start} disabled={leaving} /></Rise>
    </ReAnimated.View>
  </View>;
}

const WORDMARK_RATIO = 2558 / 264;

/** A card title where the brand name is drawn with the GainMode wordmark instead of plain text. */
function BrandTitle({ text, color }: { text: string; color: string }) {
  const parts = text.split('GainMode');
  return <View style={ui.brandTitle}>
    {parts.map((part, index) => <React.Fragment key={index}>
      {part.trim() ? <Text style={[ui.growthCardTitleText, { color }]}>{part.trim()}</Text> : null}
      {index < parts.length - 1 ? <Image accessibilityLabel="GainMode" source={require('@/assets/images/gainmode-wordmark.png')} resizeMode="contain" style={{ width: 11 * WORDMARK_RATIO, height: 11, tintColor: color }} /> : null}
    </React.Fragment>)}
  </View>;
}

function GrowthComparisonScreen({ onContinue }: { onContinue: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [leaving, setLeaving] = React.useState(false);
  const leftFill = React.useRef(new Animated.Value(0)).current;
  const rightFill = React.useRef(new Animated.Value(0)).current;
  const contentOpacity = React.useRef(new Animated.Value(0)).current;
  const contentTranslateY = React.useRef(new Animated.Value(18)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentTranslateY, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(240),
        Animated.timing(leftFill, { toValue: 1, duration: 850, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      ]),
      Animated.sequence([
        Animated.delay(430),
        Animated.timing(rightFill, { toValue: 1, duration: 1050, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      ]),
    ]).start();
  }, [contentOpacity, contentTranslateY, leftFill, rightFill]);

  const leaveScreen = () => {
    if (leaving) return;
    setLeaving(true);
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(contentTranslateY, { toValue: -12, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onContinue();
    });
  };

  const leftHeight = leftFill.interpolate({ inputRange: [0, 1], outputRange: [0, 52] });
  const rightHeight = rightFill.interpolate({ inputRange: [0, 1], outputRange: [0, 238] });

  return <View style={ui.page}>
    <OnboardingBackdrop />
    <OnboardingTopBar />
    <Animated.View style={[ui.growthBody, { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }]}>
      <Text style={[ui.eyebrow, { color: colors.mutedForeground }]}>{t('growthEyebrow')}</Text>
      <Text style={[ui.title, { color: colors.foreground }]}>{t('growthTitle')}</Text>
      <Text style={[ui.subtitle, { color: colors.mutedForeground }]}>{t('growthBody')}</Text>
      <View style={ui.growthRow}>
        <View style={[ui.growthCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[ui.growthTrack, { backgroundColor: `${colors.foreground}0D` }]}>
            <Animated.View style={[ui.growthFill, { height: leftHeight, backgroundColor: `${colors.mutedForeground}66` }]}>
              <Text style={[ui.growthRate, { color: colors.foreground }]}>{t('growthSlowRate')}</Text>
            </Animated.View>
          </View>
          <Text style={[ui.growthCardTitle, { color: colors.foreground }]}>{t('growthUnplannedTitle')}</Text>
          <Text style={[ui.growthCardBody, { color: colors.mutedForeground }]}>{t('growthUnplannedBody')}</Text>
        </View>
        <LinearGradient colors={[colors.inkCardStart, colors.inkCardEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[ui.growthCard, ui.growthCardHero]}>
          <View style={[ui.growthTrack, { backgroundColor: `${colors.inkCardForeground}12` }]}>
            <Animated.View style={[ui.growthFill, { height: rightHeight, overflow: 'hidden' }]}>
              <LinearGradient colors={['#7FA6FF', colors.accent]} style={StyleSheet.absoluteFill} />
              <Text style={[ui.growthRate, { color: '#FFFFFF' }]}>{t('growthFastRate')}</Text>
            </Animated.View>
          </View>
          <BrandTitle text={t('growthGainModeTitle')} color={colors.inkCardForeground} />
          <Text style={[ui.growthCardBody, { color: `${colors.inkCardForeground}B3` }]}>{t('growthGainModeBody')}</Text>
        </LinearGradient>
      </View>
      <View style={ui.growthFeatures}>
        {(['growthFeaturePhotoCalories', 'growthFeatureCalorieGoal', 'growthFeatureWorkoutPlan', 'growthFeatureAiCoach'] as const).map((key) => <View key={key} style={[ui.growthFeature, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
          <Text numberOfLines={1} style={[ui.growthFeatureText, { color: colors.foreground }]}>{t(key)}</Text>
        </View>)}
      </View>
    </Animated.View>
    <OnboardingCTA testID="growth-continue" label={t('growthContinue')} onPress={leaveScreen} disabled={leaving} />
  </View>;
}

function CompletionScreen({ onContinue }: { onContinue: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const pop = useSharedValue(0);
  React.useEffect(() => {
    pop.set(withDelay(350, withSpring(1, { damping: 10, stiffness: 180 })));
  }, [pop]);
  const badge = useAnimatedStyle(() => ({ opacity: pop.get(), transform: [{ scale: 0.4 + pop.get() * 0.6 }, { rotate: `${(1 - pop.get()) * -40}deg` }] }));
  return <View style={ui.page}>
    <OnboardingBackdrop />
    <OnboardingTopBar />
    <View style={ui.centerBody}>
      <Rise>
        <GlowStage size={300} tint={colors.success}>
          <Image source={require('@/assets/images/coach-thumbs-up-no-bg.png')} resizeMode="contain" style={{ width: 230, height: 230 }} />
          <ReAnimated.View style={[ui.doneBadge, { backgroundColor: colors.success }, badge]}><Ionicons name="checkmark" size={26} color="#FFFFFF" /></ReAnimated.View>
        </GlowStage>
      </Rise>
      <Rise delay={200}><Text style={[ui.title, ui.centerText, { color: colors.foreground }]}>{t('finishQuestionsTitle')}</Text></Rise>
      <Rise delay={280}><Text style={[ui.subtitle, ui.centerText, { color: colors.mutedForeground }]}>{t('finishQuestionsBody')}</Text></Rise>
    </View>
    <OnboardingCTA testID="completion-continue" label={t('continueToPlan')} onPress={onContinue} />
  </View>;
}

function ProgressiveOverloadScreen({ onContinue }: { onContinue: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const reduced = useReducedMotion();
  const climb = useSharedValue(0);
  React.useEffect(() => {
    if (!reduced) climb.set(withRepeat(withTiming(1, { duration: 2400, easing: ReEasing.inOut(ReEasing.cubic) }), -1, true));
  }, [climb, reduced]);
  const steps = [0.35, 0.5, 0.65, 0.8, 1];
  return <View style={ui.page}>
    <OnboardingBackdrop />
    <OnboardingTopBar />
    <ScrollView contentContainerStyle={ui.scrollBody} showsVerticalScrollIndicator={false}>
      <Rise><View style={[ui.pill, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="barbell-outline" size={13} color={colors.foreground} /><Text style={[ui.pillText, { color: colors.foreground }]}>{t('overloadEyebrow')}</Text></View></Rise>
      <Rise delay={80}><Text style={[ui.title, { color: colors.foreground }]}>{t('overloadTitle')}</Text></Rise>
      <Rise delay={140}><Text style={[ui.subtitle, { color: colors.mutedForeground }]}>{t('overloadBody')}</Text></Rise>
      <Rise delay={220} style={{ marginTop: 22 }}>
        <LinearGradient colors={[colors.inkCardStart, colors.inkCardEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ui.overloadCard}>
          <View style={ui.stairs}>{steps.map((height, index) => <StairBar key={index} index={index} height={height} climb={climb} accent={colors.accent} track={`${colors.inkCardForeground}14`} />)}</View>
          <View style={ui.overloadRuleRow}>
            <Text style={[ui.overloadNumber, { color: colors.inkCardForeground }]}>12+</Text>
            <View style={{ flex: 1 }}>
              <Text style={[ui.overloadRuleTitle, { color: colors.inkCardForeground }]}>{t('overloadRuleTitle')}</Text>
              <Text style={[ui.overloadRuleText, { color: `${colors.inkCardForeground}B3` }]}>{t('overloadRule')}</Text>
            </View>
          </View>
        </LinearGradient>
      </Rise>
      <Rise delay={300} style={{ marginTop: 12 }}>
        <View style={[ui.tip, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="trending-up-outline" size={18} color={colors.success} /><Text style={[ui.tipText, { color: colors.foreground }]}>{t('overloadTip')}</Text></View>
      </Rise>
    </ScrollView>
    <OnboardingCTA testID="overload-continue" label={t('overloadContinue')} onPress={onContinue} />
  </View>;
}

/** One step of the overload staircase; the highlight climbs from the first bar to the last. */
function StairBar({ index, height, climb, accent, track }: { index: number; height: number; climb: ReturnType<typeof useSharedValue<number>>; accent: string; track: string }) {
  const style = useAnimatedStyle(() => {
    const lit = climb.get() * 5 > index;
    return { backgroundColor: lit ? accent : track };
  });
  return <ReAnimated.View style={[ui.stair, { height: `${height * 100}%` }, style]} />;
}

const planAiCopy: Record<string, { writing: string; ready: string; local: string; note: string }> = {
  tr: { writing: 'Yapay zekâ planını cevaplarına göre yazıyor…', ready: 'Planın yapay zekâ ile hazırlandı', local: 'Planın cevaplarına göre hesaplandı', note: 'Koçunun notu' },
  en: { writing: 'AI is writing your plan from your answers…', ready: 'Your plan was built with AI', local: 'Your plan was calculated from your answers', note: 'Note from your coach' },
  de: { writing: 'Die KI schreibt deinen Plan aus deinen Antworten…', ready: 'Dein Plan wurde mit KI erstellt', local: 'Dein Plan wurde aus deinen Antworten berechnet', note: 'Notiz deines Coaches' },
  fr: { writing: 'L’IA rédige ton plan à partir de tes réponses…', ready: 'Ton plan a été créé avec l’IA', local: 'Ton plan a été calculé à partir de tes réponses', note: 'Le mot de ton coach' },
  es: { writing: 'La IA está escribiendo tu plan según tus respuestas…', ready: 'Tu plan se creó con IA', local: 'Tu plan se calculó según tus respuestas', note: 'Nota de tu coach' },
};
const PLAN_MIN_MS = 4500;
const PLAN_NOTE_MS = 2600;

/**
 * Sends the answers to the AI planner and keeps the build animation running until it answers.
 * The ring climbs quickly at first, then creeps toward 92% while waiting, and only fills to 100%
 * once the plan is back (and at least a few seconds have passed so the steps can be read). An AI
 * note is shown briefly before moving on; without the AI the locally calculated plan is used.
 */
function PlanBuildingScreen({ request, onComplete }: { request: () => Promise<AiPlan | null>; onComplete: (ai: AiPlan | null) => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const copy = planAiCopy[language] ?? planAiCopy.en;
  const [percent, setPercent] = React.useState(0);
  const [result, setResult] = React.useState<{ plan: AiPlan | null } | null>(null);
  const [finished, setFinished] = React.useState(false);
  const phaseKeys = ['planBuildingStep1', 'planBuildingStep2', 'planBuildingStep3', 'planBuildingStep4'] as const;
  const requestRef = React.useRef(request);
  const completeRef = React.useRef(onComplete);
  completeRef.current = onComplete;

  React.useEffect(() => {
    let alive = true;
    const started = Date.now();
    let answer: { plan: AiPlan | null } | null = null;
    let landedAt = 0;
    requestRef.current().then((plan) => { answer = { plan }; }, () => { answer = { plan: null }; });
    const ticker = setInterval(() => {
      if (!alive) return;
      const elapsed = Date.now() - started;
      if (!answer || elapsed < PLAN_MIN_MS) {
        const quick = Math.min(30, (elapsed / 1600) * 30);
        const creep = elapsed > 1600 ? 62 * (1 - Math.exp(-(elapsed - 1600) / 9000)) : 0;
        setPercent(Math.round(Math.min(92, quick + creep)));
        return;
      }
      if (!landedAt) { landedAt = Date.now(); setResult(answer); }
      const fill = Math.min(1, (Date.now() - landedAt) / 700);
      setPercent((current) => Math.max(current, Math.round(current + (100 - current) * fill)));
      if (fill >= 1) {
        clearInterval(ticker);
        setFinished(true);
        const done = answer;
        setTimeout(() => { if (alive) completeRef.current(done.plan); }, done.plan?.note ? PLAN_NOTE_MS : 700);
      }
    }, 60);
    return () => { alive = false; clearInterval(ticker); };
  }, []);
  const phase = Math.min(3, Math.floor(percent / 25));
  const status = !result ? copy.writing : result.plan ? copy.ready : copy.local;

  return <View style={ui.page}>
    <OnboardingBackdrop />
    <OnboardingTopBar />
    <View style={ui.centerBody}>
      <GlowStage size={260}>
        <ProgressRing value={percent / 100} size={196} stroke={10} color="#7FA6FF" gradientTo={colors.accent} track={`${colors.foreground}12`}>
          <Text style={[ui.buildPercent, { color: colors.foreground }]}>{percent}<Text style={ui.buildPercentSign}>%</Text></Text>
        </ProgressRing>
      </GlowStage>
      <Text style={[ui.title, ui.centerText, { color: colors.foreground }]}>{t('planBuildingTitle')}</Text>
      <View style={[ui.aiStatus, { backgroundColor: `${result?.plan ? colors.success : colors.accent}16` }]}>
        {result ? <Ionicons name={result.plan ? 'flash-outline' : 'checkmark-circle'} size={14} color={result.plan ? colors.success : colors.accent} /> : <AiTypingDots color={colors.accent} />}
        <Text style={[ui.aiStatusText, { color: result?.plan ? colors.success : colors.accent }]}>{status}</Text>
      </View>
      {finished && result?.plan?.note ? <Rise style={{ alignSelf: 'stretch' }}><View style={[ui.aiNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[ui.aiNoteLabel, { color: colors.mutedForeground }]}>{copy.note}</Text>
        <Text style={[ui.aiNoteText, { color: colors.foreground }]}>{result.plan.note}</Text>
      </View></Rise> : <View style={[ui.checklist, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {phaseKeys.map((key, index) => {
          const done = index < phase || percent >= 100;
          const active = index === phase && percent < 100;
          return <View key={key} style={ui.checkRow}>
            <View style={[ui.checkDot, { backgroundColor: done ? colors.success : 'transparent', borderColor: done ? colors.success : active ? colors.foreground : colors.border }]}>
              {done ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : active ? <View style={[ui.checkPulse, { backgroundColor: colors.foreground }]} /> : null}
            </View>
            <Text style={[ui.checkText, { color: done || active ? colors.foreground : colors.mutedForeground }]}>{t(key)}</Text>
          </View>;
        })}
      </View>}
    </View>
  </View>;
}

/** Three dots that bounce in turn while the AI is working. */
function AiTypingDots({ color }: { color: string }) {
  const reduced = useReducedMotion();
  const clock = useSharedValue(0);
  React.useEffect(() => {
    if (!reduced) clock.set(withRepeat(withTiming(1, { duration: 900, easing: ReEasing.linear }), -1));
  }, [clock, reduced]);
  return <View style={ui.aiDots}>{[0, 0.2, 0.4].map((phase) => <TypingDot key={phase} clock={clock} phase={phase} color={color} />)}</View>;
}

function TypingDot({ clock, phase, color }: { clock: SharedValue<number>; phase: number; color: string }) {
  const style = useAnimatedStyle(() => {
    const wave = Math.max(0, Math.sin((clock.get() - phase) * Math.PI * 2));
    return { opacity: 0.35 + wave * 0.65, transform: [{ translateY: -wave * 3 }] };
  });
  return <ReAnimated.View style={[ui.aiDot, { backgroundColor: color }, style]} />;
}

function IntroScreen({ onDone }: { onDone: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  return <View style={ui.page}>
    <OnboardingBackdrop />
    <OnboardingTopBar />
    <ScrollView contentContainerStyle={[ui.scrollBody, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
      <Rise><GlowStage size={240}><Image source={require('@/assets/images/coach-app-icon-final.png')} style={ui.introIcon} /></GlowStage></Rise>
      <Rise delay={140}><Text style={[ui.title, ui.centerText, { color: colors.foreground }]}>{t('onboardingTitle')}</Text></Rise>
      <Rise delay={200}><Text style={[ui.subtitle, ui.centerText, { color: colors.mutedForeground }]}>{t('onboardingIntro')}</Text></Rise>
      <Rise delay={280} style={{ alignSelf: 'stretch', marginTop: 22 }}>
        <View style={[ui.tip, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} /><Text style={[ui.tipText, { color: colors.mutedForeground }]}>{t('healthDisclaimerBody')}</Text></View>
      </Rise>
    </ScrollView>
    <OnboardingCTA testID="intro-continue" label={t('continue')} onPress={onDone} />
  </View>;
}

const DAY_INDEX: Record<string, number> = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 7 };
/** Short weekday name in the app language; 2024-01-01 was a Monday. */
function dayShort(day: string, language: string) {
  try { return new Intl.DateTimeFormat(language, { weekday: 'short' }).format(new Date(2024, 0, DAY_INDEX[day] ?? 1)).replace('.', '').toLocaleUpperCase(language); } catch { return day; }
}

type ExploreDemoKind = 'home' | 'coach' | 'nutrition' | 'workout' | 'form' | 'weekly';

const accessExploreSlides = [
  { kind: 'home' as const, icon: 'home-outline' as const, title: 'featuresHomeTitle' as const, summary: 'featuresHomeSummary' as const, detail: 'featuresHomeDetail' as const },
  { kind: 'coach' as const, icon: 'chatbubble-ellipses-outline' as const, title: 'featuresAiCoachTitle' as const, summary: 'featuresAiCoachSummary' as const, detail: 'featuresAiCoachDetail' as const },
  { kind: 'nutrition' as const, icon: 'restaurant-outline' as const, title: 'featuresFoodPhotoTitle' as const, summary: 'featuresFoodPhotoSummary' as const, detail: 'featuresFoodPhotoDetail' as const },
  { kind: 'workout' as const, icon: 'barbell-outline' as const, title: 'featuresWorkoutTitle' as const, summary: 'featuresWorkoutSummary' as const, detail: 'featuresWorkoutDetail' as const },
  { kind: 'form' as const, icon: 'body-outline' as const, title: 'featuresLiveFormTitle' as const, summary: 'featuresLiveFormSummary' as const, detail: 'featuresLiveFormDetail' as const },
  { kind: 'weekly' as const, icon: 'analytics-outline' as const, title: 'featuresWeeklyTitle' as const, summary: 'featuresWeeklySummary' as const, detail: 'featuresWeeklyDetail' as const },
] as const;

function DemoPreviewFrame({ kind, lockedLabel, t }: { kind: ExploreDemoKind; lockedLabel: string; t: (key: Parameters<typeof translate>[1]) => string }) {
  const colors = useColors();
  const miniIcon = (name: React.ComponentProps<typeof Ionicons>['name'], active = false) => <Ionicons name={name} size={14} color={active ? colors.primary : colors.mutedForeground} />;
  const lockedChip = <View style={[styles.demoLockedChip, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}42` }]}><Ionicons name="badge-lock" size={11} color={colors.primary} /><Text style={[styles.demoLockedText, { color: colors.primary }]}>{lockedLabel}</Text></View>;
  const miniHeader = (title: string, icon: React.ComponentProps<typeof Ionicons>['name'] = 'coach-outline') => (
    <View style={styles.demoMiniHeader}>
      <View style={[styles.demoMiniBrand, { backgroundColor: colors.primary }]}><ForgeFitMark size={17} /></View>
      <Text numberOfLines={1} style={[styles.demoMiniHeaderTitle, { color: colors.foreground }]}>{title}</Text>
      <Ionicons name={icon} size={15} color={colors.mutedForeground} />
    </View>
  );

  if (kind === 'home') return <View style={[styles.demoFrame, { backgroundColor: colors.background, borderColor: colors.border }]}>
    {miniHeader(t('today'), 'notifications-outline')}
    <Text style={[styles.demoGreeting, { color: colors.foreground }]}>{t('goodMorning')}</Text>
    <Text style={[styles.demoMuted, { color: colors.mutedForeground }]}>{t('ready')}</Text>
    <View style={[styles.demoMetricCard, { backgroundColor: `${colors.primary}16`, borderColor: `${colors.primary}42` }]}>
      <View><Text style={[styles.demoMetricLabel, { color: colors.mutedForeground }]}>{t('calories')}</Text><Text style={[styles.demoMetricValue, { color: colors.foreground }]}>1,840</Text></View>
      <View style={styles.demoRing}><Text style={[styles.demoRingValue, { color: colors.primary }]}>72%</Text></View>
    </View>
    <View style={[styles.demoWorkoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.demoWorkoutCopy}><Text style={[styles.demoMetricLabel, { color: colors.primary }]}>{t('todayWorkout')}</Text><Text style={[styles.demoWorkoutTitle, { color: colors.foreground }]}>{t('planTitle')}</Text></View>
      <Ionicons name="arrow-forward" size={20} color={colors.primary} />
    </View>
    <View style={[styles.demoBottomNav, { borderTopColor: colors.border }]}>{[miniIcon('home', true), miniIcon('barbell-outline'), miniIcon('restaurant-outline'), miniIcon('settings-outline')].map((item, index) => <View key={index} style={styles.demoNavItem}>{item}</View>)}</View>
  </View>;

  if (kind === 'coach') return <View style={[styles.demoFrame, { backgroundColor: colors.background, borderColor: colors.border }]}>
    {miniHeader(t('coachTitle'), 'coach-outline')}
    <Text style={[styles.demoMuted, { color: colors.mutedForeground }]}>{t('coachSubtitle')}</Text>
    <View style={[styles.demoCoachBubble, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}32` }]}><Ionicons name="chat-more" size={14} color={colors.primary} /><Text style={[styles.demoBubbleText, { color: colors.foreground }]}>{t('coachWelcome')}</Text></View>
    <View style={[styles.demoUserBubble, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.demoBubbleText, { color: colors.foreground }]}>{t('coachExample')}</Text></View>
    <View style={[styles.demoCoachBubble, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}32` }]}><Ionicons name="chat-more" size={14} color={colors.primary} /><Text style={[styles.demoBubbleText, { color: colors.foreground }]}>{t('coachAiCapabilities')}</Text></View>
  </View>;

  if (kind === 'nutrition') return <View style={[styles.demoFrame, { backgroundColor: colors.background, borderColor: colors.border }]}>
    {miniHeader(t('nutrition'), 'restaurant-outline')}
    <View style={[styles.demoPhotoPlaceholder, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}55` }]}>
      <Ionicons name="restaurant-outline" size={29} color={colors.primary} />
      <Text style={[styles.demoPlaceholderTitle, { color: colors.foreground }]}>{t('analyzeMealPhoto')}</Text>
      <Text style={[styles.demoMuted, { color: colors.mutedForeground }]}>{t('mealCaptureHint')}</Text>
    </View>
    {lockedChip}
    <View style={[styles.demoNutritionRow, { backgroundColor: colors.card, borderColor: colors.border }]}>{[['flame-outline', t('calories')], ['barbell-outline', t('protein')], ['analytics-outline', t('carbs')]].map(([icon, label]) => <View key={label} style={styles.demoNutritionMetric}><Ionicons name={icon as React.ComponentProps<typeof Ionicons>['name']} size={14} color={colors.primary} /><Text style={[styles.demoMetricLabel, { color: colors.mutedForeground }]}>{label}</Text><Text style={[styles.demoMiniValue, { color: colors.foreground }]}>—</Text></View>)}</View>
  </View>;

  if (kind === 'workout') return <View style={[styles.demoFrame, { backgroundColor: colors.background, borderColor: colors.border }]}>
    {miniHeader(t('planTitle'), 'barbell-outline')}
    <Text style={[styles.demoMuted, { color: colors.mutedForeground }]}>{t('thisWeek')}</Text>
    <View style={styles.demoDayRow}>{['MON', 'WED', 'FRI'].map((day, index) => <View key={day} style={[styles.demoDayPill, { backgroundColor: index === 1 ? `${colors.primary}20` : colors.card, borderColor: index === 1 ? colors.primary : colors.border }]}><Text style={[styles.demoDayText, { color: index === 1 ? colors.primary : colors.mutedForeground }]}>{day}</Text></View>)}</View>
    {[t('exerciseSquat'), t('exercisePushup'), t('exerciseLunge')].map((exercise, index) => <View key={exercise} style={[styles.demoExerciseRow, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.demoExerciseIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name={index === 0 ? 'barbell-outline' : 'body-outline'} size={15} color={colors.primary} /></View><Text style={[styles.demoExerciseText, { color: colors.foreground }]}>{exercise}</Text><Text style={[styles.demoSets, { color: colors.mutedForeground }]}>{index + 2} {t('sets')}</Text></View>)}
    {lockedChip}
  </View>;

  if (kind === 'form') return <View style={[styles.demoFrame, { backgroundColor: colors.background, borderColor: colors.border }]}>
    {miniHeader(t('featuresLiveFormTitle'), 'body-outline')}
    <View style={[styles.demoFormStage, { backgroundColor: `${colors.blue}14`, borderColor: `${colors.blue}42` }]}>
      <View style={[styles.demoBodyFigure, { borderColor: colors.blue }]}><View style={[styles.demoHead, { backgroundColor: colors.blue }]} /><View style={[styles.demoBodyLine, { backgroundColor: colors.blue }]} /><View style={[styles.demoArmLine, { backgroundColor: colors.blue, transform: [{ rotate: '-35deg' }] }]} /><View style={[styles.demoArmLine, { backgroundColor: colors.blue, transform: [{ rotate: '35deg' }] }]} /><View style={[styles.demoLegLine, { backgroundColor: colors.blue, transform: [{ rotate: '-25deg' }] }]} /><View style={[styles.demoLegLine, { backgroundColor: colors.blue, transform: [{ rotate: '25deg' }] }]} /></View>
      <Text style={[styles.demoPlaceholderTitle, { color: colors.foreground }]}>{t('exerciseSquat')}</Text>
    </View>
    {lockedChip}
    <View style={[styles.demoFormStats, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.demoMetricLabel, { color: colors.mutedForeground }]}>{t('completed')}</Text><Text style={[styles.demoMetricValue, { color: colors.foreground }]}>—</Text><Text style={[styles.demoMetricLabel, { color: colors.mutedForeground }]}>{t('premiumLocked')}</Text></View>
  </View>;

  return <View style={[styles.demoFrame, { backgroundColor: colors.background, borderColor: colors.border }]}>
    {miniHeader(t('weeklyAiTitle'), 'analytics-outline')}
    <Text style={[styles.demoMuted, { color: colors.mutedForeground }]}>{t('weeklyAiSubtitle')}</Text>
    <View style={[styles.demoChartCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.demoMetricLabel, { color: colors.primary }]}>{t('weeklyAiLastSeven')}</Text><View style={styles.demoBars}>{[38, 62, 48, 78, 54, 88, 70].map((height, index) => <View key={index} style={[styles.demoBar, { height, backgroundColor: index === 6 ? colors.primary : `${colors.primary}45` }]} />)}</View></View>
    <View style={[styles.demoInsightCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}38` }]}><Ionicons name="analytics-outline" size={17} color={colors.primary} /><Text style={[styles.demoBubbleText, { color: colors.foreground }]}>{t('weeklyAiCardSubtitle')}</Text></View>
    {lockedChip}
  </View>;
}

function AccessExploreScreen({ page, onNext, onBack }: { page: number; onNext: () => void; onBack: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const slide = accessExploreSlides[page];
  const isLast = page === accessExploreSlides.length - 1;

  return <LinearGradient colors={[colors.background, colors.secondary, colors.background]} style={styles.offerGradient}>
    <View style={[styles.exploreHeader, { paddingTop: insets.top + 10 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('close')} onPress={onBack} style={({ pressed }) => [styles.exploreBackButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
        <Ionicons name="arrow-back" size={19} color={colors.foreground} />
      </Pressable>
      <View style={styles.exploreHeaderTitle}>
        <Text style={[styles.exploreEyebrow, { color: colors.primary }]}>{t('premiumShort')}</Text>
        <Text style={[styles.exploreCounter, { color: colors.mutedForeground }]}>{page + 1} / {accessExploreSlides.length}</Text>
      </View>
      <ForgeFitMark size={34} />
    </View>
    <ScrollView contentContainerStyle={[styles.exploreScrollContent, { paddingBottom: insets.bottom + 18 }]} showsVerticalScrollIndicator={false} bounces={false}>
       <View style={styles.exploreFrameLabel}><Ionicons name="badge-lock" size={12} color={colors.primary} /><Text style={[styles.exploreFrameLabelText, { color: colors.primary }]}>{t('premiumExploreDemoLabel')}</Text></View>
       <DemoPreviewFrame kind={slide.kind} lockedLabel={t('premiumExploreLocked')} t={t} />
      <Text style={[styles.exploreTitle, { color: colors.foreground }]}>{t(slide.title)}</Text>
      <Text style={[styles.exploreSummary, { color: colors.mutedForeground }]}>{t(slide.summary)}</Text>
      <View style={[styles.exploreValueCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}42` }]}>
        <View style={[styles.exploreValueIcon, { backgroundColor: `${colors.primary}22` }]}><Ionicons name="gem-outline" size={18} color={colors.primary} /></View>
        <View style={styles.exploreValueCopy}>
          <Text style={[styles.exploreValueLabel, { color: colors.primary }]}>{t('premiumExploreIncluded')}</Text>
          <Text style={[styles.exploreDetail, { color: colors.foreground }]}>{t(slide.detail)}</Text>
        </View>
      </View>
    </ScrollView>
    <View style={[styles.exploreFooter, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.exploreDots}>{accessExploreSlides.map((item, index) => <View key={item.title} style={[styles.exploreDot, { backgroundColor: index === page ? colors.primary : colors.border }]} />)}</View>
      <Pressable accessibilityRole="button" accessibilityLabel={t(isLast ? 'premiumExploreFinish' : 'premiumExploreNext')} onPress={onNext} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}>
         <Text style={[styles.nextText, { color: colors.primaryForeground }]}>{t(isLast ? 'premiumExploreFinish' : 'premiumExploreSkip')}</Text>
        <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
      </Pressable>
    </View>
  </LinearGradient>;
}

function PremiumWelcomeOfferScreen({ onUnlock, onPurchaseSuccess }: { onUnlock: () => void; onPurchaseSuccess: (kind: 'purchase' | 'restore') => void }) {
  return <Paywall onUnlock={onUnlock} onPurchaseSuccess={onPurchaseSuccess} />;
}

const styles = StyleSheet.create({
  full: { flex: 1, paddingHorizontal: 24, paddingTop: 58, paddingBottom: 30, justifyContent: 'space-between' },
  onboardingShell: { flex: 1 },
  entryRedirecting: { flex: 1 },
   questionTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 0, paddingLeft: 0, paddingRight: 0, zIndex: 3 },
  brandMark: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandWordmark: { flex: 1, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 2.5, marginHorizontal: 14 },
  trademark: { fontFamily: 'Inter_700Bold', fontSize: 8, lineHeight: 10, position: 'relative', top: -3 },
   languageRow: { flexDirection: 'row', gap: 8, transform: [{ translateX: -6 }, { translateY: -4 }] },
  languageOption: { width: 20, alignItems: 'center', gap: 2 },
  language: { fontFamily: 'Inter_700Bold', fontSize: 10, lineHeight: 12 },
  languageFlagImage: { width: 20, height: 12, borderRadius: 2, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.16)' },
   questionBody: { flex: 1, minHeight: 0, marginTop: -6 },
   questionScrollContent: { paddingTop: 0, paddingBottom: 12 },
   questionScrollHint: { position: 'absolute', left: 0, right: 0, bottom: 8, alignItems: 'center', justifyContent: 'center', gap: 1 },
   coachQuestionVisual: { width: '100%', height: 376, alignSelf: 'center', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 4 },
  answerAnalysisStatus: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 3, paddingHorizontal: 8 },
  answerAnalysisBox: { width: 42, height: 34, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  answerAnalysisPacket: { position: 'absolute', left: 5, width: 13, height: 3, borderRadius: 3 },
  answerAnalysisPacketTop: { top: 7 },
  answerAnalysisPacketMiddle: { top: 15 },
  answerAnalysisPacketBottom: { top: 23 },
  answerAnalysisLabel: { maxWidth: 220, flexShrink: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12.5, lineHeight: 17 },
  profileEditInfoBar: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 13, padding: 11, marginTop: 10 },
  profileEditInfoText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 17 },
   coachPhotoStage: { width: 350, height: 350, alignItems: 'center', justifyContent: 'center' },
  coachSmall: { width: 238, height: 238 },
    coachOnboarding: { width: 320, height: 320 },
  coachWaveQuestion: { transform: [{ translateX: 7 }] },
  coachLarge: { width: 220, height: 220 },
  homeEquipmentDetails: { gap: 8, marginTop: 16 },
  equipmentDetailsInput: { minHeight: 92, borderWidth: 1, borderRadius: 17, paddingHorizontal: 14, paddingVertical: 12, textAlignVertical: 'top', fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  dumbbellSection: { gap: 8, marginTop: 16 },
  dumbbellWeightFields: { gap: 8, marginTop: 4 },
  dumbbellWeightInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dumbbellWeightInput: { width: 128, height: 50, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, fontFamily: 'Inter_500Medium', fontSize: 15 },
  dumbbellWeightUnit: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5, marginBottom: 9 },
  optionalLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  questionTitle: { fontFamily: 'Inter_700Bold', fontSize: 29, lineHeight: 35, letterSpacing: -1, marginBottom: 20 },
  questionHint: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginBottom: 14, marginTop: -8 },
  modeChoiceContent: { flex: 1, justifyContent: 'center', paddingVertical: 24 },
  modeChoiceTitle: { fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 36, letterSpacing: -1, marginBottom: 10 },
  modeChoiceSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginBottom: 24 },
  modeChoiceList: { gap: 12 },
  modeChoiceCard: { minHeight: 112, borderWidth: 1, borderRadius: 21, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  modeChoiceIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  modeChoiceCopy: { flex: 1, minWidth: 0, gap: 3 },
  modeChoiceCardTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  modeChoiceCardDescription: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  modeChoiceCount: { fontFamily: 'Inter_700Bold', fontSize: 11, marginTop: 3 },
  modeChoiceBack: { minHeight: 38, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  modeChoiceBackText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  choiceList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choice: { minHeight: 59, padding: 10, borderWidth: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 11 },
  choiceIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  choiceText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  gymLevels: { gap: 8, marginTop: 16 },
  subLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginBottom: 1 },
  textInput: { height: 64, borderRadius: 20, borderWidth: 1, paddingHorizontal: 20, fontFamily: 'Inter_600SemiBold', fontSize: 20 },
  rulerCard: { borderRadius: 26, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 20 },
  rulerValue: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 7, marginBottom: 23 },
  rulerNumber: { fontFamily: 'Inter_700Bold', fontSize: 52, letterSpacing: -2, textAlign: 'center' },
  rulerUnit: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  rulerTrack: { width: '100%', height: 45, justifyContent: 'center' },
  rulerLine: { position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 3 },
  rulerProgress: { position: 'absolute', left: 0, height: 3, borderRadius: 3 },
  rulerTicks: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rulerTick: { width: 1, opacity: 0.75 },
  rulerThumb: { position: 'absolute', width: 22, height: 22, borderRadius: 11, borderWidth: 4, marginLeft: -11 },
  rulerLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rulerLabel: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  centerHint: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 13 },
  measurementSection: { gap: 12 },
  unitToggle: { flexDirection: 'row', borderRadius: 999, borderWidth: 1, padding: 4, alignSelf: 'center', marginBottom: 16 },
  unitOption: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 999 },
  unitOptionText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  measurementInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  measurementInput: { minWidth: 118, height: 48, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 18 },
  measurementSmallInput: { minWidth: 78 },
  measurementInputUnit: { fontFamily: 'Inter_700Bold', fontSize: 14, marginLeft: -3 },
  weightCard: { borderRadius: 26, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  targetWeightSection: { gap: 12 },
  targetUnitToggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 15, padding: 3, gap: 3 },
  targetUnitOption: { flex: 1, minHeight: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recommendedTarget: { borderRadius: 15, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  recommendedTargetText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12 },
  recommendedTargetValue: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  stepButton: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  weightValue: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 0 },
  weightNumberInput: { fontFamily: 'Inter_700Bold', fontSize: 48, letterSpacing: -2, textAlign: 'center', width: '100%', minWidth: 0, padding: 0 },
  birthCard: { width: '100%', alignSelf: 'center', borderRadius: 24, borderWidth: 1, paddingVertical: 17, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dateColumn: { width: 78, alignItems: 'center', gap: 5 },
  dateLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  dateValue: { width: 70, height: 48, borderRadius: 15, padding: 0, textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false },
  dateNumber: { fontFamily: 'Inter_700Bold', fontSize: 19, lineHeight: 24, textAlign: 'center' },
  dateSlash: { width: 18, fontFamily: 'Inter_700Bold', fontSize: 22, lineHeight: 26, textAlign: 'center' },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  dayButton: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  error: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 12 },
  buttonArea: { gap: 13 },
  nextButton: { width: '100%', minHeight: 60, borderRadius: 18, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5 },
  nextText: { flex: 1, minWidth: 0, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 13, lineHeight: 18 },
  welcomeAmbientGlow: { position: 'absolute', left: -60, right: -60, top: 140, height: 430, borderRadius: 220 },
  welcomeBackdropDecorations: { pointerEvents: 'none' },
   welcomeHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 0, paddingLeft: 0, paddingRight: 0, zIndex: 3 },
   welcomeLogoDock: { transform: [{ translateX: -8 }, { translateY: -6 }] },
   welcomeLanguageDock: { transform: [{ translateY: -12 }, { translateX: 8 }] },
  welcomeBrand: { fontFamily: 'Inter_700Bold', fontSize: 25, letterSpacing: -1.2 },
   welcomeLanguagePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  welcomeLanguageOption: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  welcomeLanguageSelected: {},
    welcomeReferenceCard: { flex: 1, marginHorizontal: 16, marginTop: 38, marginBottom: 12, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.82)', backgroundColor: 'rgba(255,255,255,0.39)', overflow: 'hidden', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 22, shadowColor: '#2558D9', shadowOpacity: 0.12, shadowRadius: 26, shadowOffset: { width: 0, height: 12 }, elevation: 6 },
  welcomeCardGlow: { position: 'absolute', width: 260, height: 260, top: 64, borderRadius: 130, alignSelf: 'center' },
   welcomeCharacterStage: { width: 260, height: 260, marginTop: 52, borderRadius: 130, overflow: 'visible', alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
    welcomeReferenceCharacter: { width: 300, height: 300 },
  welcomeReferenceCopy: { width: '100%', paddingHorizontal: 18, alignItems: 'center' },
  welcomeReferenceTitle: { fontFamily: 'Inter_700Bold', fontSize: 29, lineHeight: 34, letterSpacing: -1, textAlign: 'center' },
  welcomeReferenceSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 12, maxWidth: 270 },
   welcomeReferenceActions: { paddingHorizontal: 52, paddingBottom: 18, alignItems: 'center' },
   welcomeReferenceStart: { width: '100%', minHeight: 58, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#1D55DF', shadowOpacity: 0.28, shadowRadius: 13, shadowOffset: { width: 0, height: 7 }, elevation: 7 },
  welcomeReferenceStartText: { fontFamily: 'Inter_500Medium', fontSize: 22 },
  welcomeReferenceAccount: { fontFamily: 'Inter_400Regular', fontSize: 15 },
  welcomeContent: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  welcomeVisualStage: { width: 292, height: 292, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  welcomeHaloRing: { position: 'absolute', width: 286, height: 286, borderRadius: 143, borderWidth: 1.5 },
  welcomeHaloRingInner: { position: 'absolute', width: 268, height: 268, borderRadius: 134 },
  welcomeOrb: { width: 245, height: 245, borderRadius: 122, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  welcomeCoachImage: { width: 245, height: 245 },
  welcomeTitle: { textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 33, lineHeight: 38, letterSpacing: -1.2 },
  welcomeSubtitle: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 310 },
  welcomeActionPanel: { width: '100%', borderWidth: 1, borderRadius: 27, padding: 10, shadowOpacity: 0.17, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  welcomeActionHintRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 8, paddingBottom: 6 },
  welcomeActionHintDot: { width: 5, height: 5, borderRadius: 3 },
  welcomeActionHint: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16, textAlign: 'center' },
  welcomeStartButton: { minHeight: 58, borderRadius: 20 },
  growthContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  growthEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.7, marginBottom: 12, textAlign: 'center' },
  growthTitle: { fontFamily: 'Inter_700Bold', fontSize: 29, lineHeight: 35, letterSpacing: -0.9, textAlign: 'center', maxWidth: 330 },
  growthBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 320, marginTop: 12 },
  growthBars: { width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 28 },
  growthBarColumn: { flex: 1, alignItems: 'center', maxWidth: 145 },
  growthBarTrack: { width: 104, height: 270, borderRadius: 26, borderWidth: 1, overflow: 'hidden', justifyContent: 'flex-end', alignItems: 'center' },
  growthBarFill: { width: '100%', minHeight: 0, borderRadius: 24, alignItems: 'center', justifyContent: 'flex-start' },
  growthRate: { fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 30, letterSpacing: -0.6, marginTop: 10 },
  growthBarTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, lineHeight: 17, textAlign: 'center', marginTop: 13 },
  growthBarBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 4, maxWidth: 132 },
  growthFeatureList: { alignSelf: 'stretch', gap: 3, marginTop: 9, paddingHorizontal: 3 },
  growthFeatureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  growthFeatureDot: { width: 4, height: 4, borderRadius: 2, marginTop: 5 },
  growthFeatureText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 9.5, lineHeight: 13, textAlign: 'left' },
  completionContent: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  completionCoachStage: { alignItems: 'center', marginBottom: 22 },
  completionCheckmark: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: -6, zIndex: 2 },
  completionCoach: { width: 245, height: 245, borderRadius: 122, alignItems: 'center', justifyContent: 'center' },
  planBuildingContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  planBuildingOrb: { width: 154, height: 154, borderRadius: 77, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 34 },
  planBuildingOrbInner: { width: 104, height: 104, borderRadius: 52, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  planBuildingTitle: { fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -1, textAlign: 'center' },
  planBuildingBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, maxWidth: 315, textAlign: 'center', marginTop: 12 },
  planProgressTrack: { width: '82%', height: 7, borderRadius: 8, overflow: 'hidden', marginTop: 34 },
  planProgressFill: { height: '100%', borderRadius: 8 },
  planBuildingPhase: { fontFamily: 'Inter_700Bold', fontSize: 12, marginTop: 18 },
  planBuildingDots: { flexDirection: 'row', gap: 8, marginTop: 20 },
  planBuildingDot: { width: 8, height: 8, borderRadius: 4 },
  overloadTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overloadBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 7 },
  overloadBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.1 },
  overloadContent: { flex: 1, justifyContent: 'center' },
  overloadOrb: { width: 142, height: 142, borderRadius: 71, borderWidth: 1, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  overloadOrbInner: { width: 94, height: 94, borderRadius: 47, alignItems: 'center', justifyContent: 'center' },
  overloadTitle: { fontFamily: 'Inter_700Bold', fontSize: 31, lineHeight: 37, letterSpacing: -1, textAlign: 'center' },
  overloadBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 11 },
  overloadRule: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 20, padding: 14, marginTop: 24 },
  overloadRuleNumber: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  overloadRuleNumberText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  overloadRuleTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, marginBottom: 4 },
  overloadRuleText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  overloadTip: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 12 },
  overloadTipText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 16 },
  introVisual: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  auraLarge: { position: 'absolute', width: 220, height: 220, borderRadius: 110 },
  introIcon: { width: 150, height: 150, borderRadius: 50 },
  introTitle: { fontFamily: 'Inter_700Bold', fontSize: 34, lineHeight: 39, letterSpacing: -1.2 },
  introText: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 23, marginTop: 12 },
  healthNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderWidth: 1, borderRadius: 14, padding: 11, marginTop: 15 },
  healthNoticeText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  introBottom: { gap: 18 },
  dots: { flexDirection: 'row', gap: 7, justifyContent: 'center' },
  dot: { width: 28, height: 4, borderRadius: 5 },
  offerGradient: { flex: 1 },
  features: { gap: 17, paddingVertical: 20 },
  premiumRestoreButton: { width: '100%', alignItems: 'center', justifyContent: 'center', minHeight: 40, paddingHorizontal: 12 },
  premiumRestoreText: { flexShrink: 1, textAlign: 'center', fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 16 },
  exploreHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  exploreBackButton: { width: 38, height: 38, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  exploreHeaderTitle: { alignItems: 'center', gap: 2 },
  exploreEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.4 },
  exploreCounter: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  exploreScrollContent: { paddingHorizontal: 20, paddingTop: 5 },
  exploreImageFrame: { width: '100%', aspectRatio: 1.72, borderRadius: 24, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  exploreImage: { width: '100%', height: '100%' },
  exploreImageBadge: { position: 'absolute', left: 14, bottom: 14, width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  exploreFrameLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7, paddingHorizontal: 3 },
  exploreFrameLabelText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2 },
  demoFrame: { width: '100%', minHeight: 318, borderRadius: 24, borderWidth: 1, padding: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  demoMiniHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(128, 150, 180, 0.16)' },
  demoMiniBrand: { width: 25, height: 25, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  demoMiniHeaderTitle: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 12 },
  demoGreeting: { fontFamily: 'Inter_700Bold', fontSize: 20, marginTop: 16 },
  demoMuted: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, marginTop: 4 },
  demoMetricCard: { minHeight: 72, borderRadius: 16, borderWidth: 1, padding: 11, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  demoMetricLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 9 },
  demoMetricValue: { fontFamily: 'Inter_700Bold', fontSize: 21, marginTop: 3 },
  demoRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 5, borderColor: '#2C9FEA', alignItems: 'center', justifyContent: 'center' },
  demoRingValue: { fontFamily: 'Inter_700Bold', fontSize: 9 },
  demoWorkoutCard: { minHeight: 52, borderWidth: 1, borderRadius: 15, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 },
  demoWorkoutCopy: { gap: 3 },
  demoWorkoutTitle: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  demoBottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, marginTop: 'auto', paddingTop: 11 },
  demoNavItem: { width: 28, alignItems: 'center' },
  demoCoachBubble: { borderWidth: 1, borderRadius: 15, padding: 10, marginTop: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  demoUserBubble: { alignSelf: 'flex-end', maxWidth: '82%', borderWidth: 1, borderRadius: 15, padding: 10, marginTop: 9 },
  demoBubbleText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 15 },
  demoLockedChip: { alignSelf: 'flex-start', minHeight: 25, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 11 },
  demoLockedText: { fontFamily: 'Inter_700Bold', fontSize: 9 },
  demoDisabledComposer: { minHeight: 40, borderWidth: 1, borderRadius: 13, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9, opacity: 0.7 },
  demoComposerText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  demoPhotoPlaceholder: { minHeight: 150, borderWidth: 1, borderStyle: 'dashed', borderRadius: 17, alignItems: 'center', justifyContent: 'center', padding: 16, marginTop: 15 },
  demoPlaceholderTitle: { fontFamily: 'Inter_700Bold', fontSize: 12, textAlign: 'center', marginTop: 8 },
  demoNutritionRow: { minHeight: 64, borderWidth: 1, borderRadius: 15, padding: 9, flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  demoNutritionMetric: { flex: 1, alignItems: 'center', gap: 3 },
  demoMiniValue: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  demoDayRow: { flexDirection: 'row', gap: 7, marginTop: 12, marginBottom: 9 },
  demoDayPill: { minWidth: 53, minHeight: 28, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  demoDayText: { fontFamily: 'Inter_700Bold', fontSize: 9 },
  demoExerciseRow: { minHeight: 39, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 },
  demoExerciseIcon: { width: 25, height: 25, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  demoExerciseText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  demoSets: { fontFamily: 'Inter_500Medium', fontSize: 9 },
  demoFormStage: { minHeight: 176, borderWidth: 1, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  demoBodyFigure: { width: 76, height: 105, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  demoHead: { width: 22, height: 22, borderRadius: 11, position: 'absolute', top: 0 },
  demoBodyLine: { width: 7, height: 49, borderRadius: 5, position: 'absolute', top: 24 },
  demoArmLine: { width: 7, height: 42, borderRadius: 5, position: 'absolute', top: 28 },
  demoLegLine: { width: 7, height: 45, borderRadius: 5, position: 'absolute', top: 65 },
  demoFormStats: { minHeight: 45, borderWidth: 1, borderRadius: 13, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 },
  demoChartCard: { minHeight: 130, borderWidth: 1, borderRadius: 16, padding: 11, marginTop: 14 },
  demoBars: { height: 91, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', gap: 7, paddingTop: 13 },
  demoBar: { width: 16, borderRadius: 6 },
  demoInsightCard: { minHeight: 46, borderWidth: 1, borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  exploreTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34, letterSpacing: -0.8, marginTop: 22 },
  exploreSummary: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 8 },
  exploreValueCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 18, padding: 13, marginTop: 18 },
  exploreValueIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  exploreValueCopy: { flex: 1, gap: 5 },
  exploreValueLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, lineHeight: 16 },
  exploreDetail: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  exploreFooter: { paddingHorizontal: 20, gap: 12 },
  exploreDots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  exploreDot: { width: 22, height: 4, borderRadius: 4 },
  exploreCta: { width: '100%', minHeight: 62, borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  exploreCtaIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  exploreCtaCopy: { flex: 1, gap: 3 },
  exploreCtaTitle: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  exploreCtaSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14 },
});
const ui = StyleSheet.create({
  page: { flex: 1 },
  blob: { position: 'absolute' },
  topBar: { paddingHorizontal: 20, zIndex: 5 },
  topRow: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 14 },
  progressFill: { height: '100%', borderRadius: 2 },
  ctaWrap: { paddingHorizontal: 20, paddingTop: 10 },
  cta: { height: 60, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  ctaShine: { position: 'absolute', top: -10, bottom: -10, width: 90 },
  ctaText: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.2, color: '#FFFFFF' },
  ctaArrow: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.22)' },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 32, lineHeight: 38, letterSpacing: -1.1, marginTop: 10 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, marginTop: 10 },
  centerText: { textAlign: 'center' },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6 },
  pillText: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.6 },
  welcomeBody: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingBottom: 8 },
  welcomeStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle: { fontFamily: 'Inter_700Bold', fontSize: 38, lineHeight: 42, letterSpacing: -1.6 },
  floatChip: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  floatChipText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  modeBody: { flex: 1, paddingHorizontal: 24, paddingTop: 28 },
  modeHero: { borderRadius: 28, padding: 20 },
  modeHeroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modeHeroIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  modeTag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  modeTagText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#1A1300' },
  modeHeroTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.6, marginTop: 18 },
  modeHeroBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 6 },
  modeSpeed: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 16 },
  modeSpeedBar: { width: 8, borderRadius: 3 },
  modeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 24, borderWidth: 1, padding: 16 },
  modeCardTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.3 },
  modeCardBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 3 },
  modeCardCount: { fontFamily: 'Inter_700Bold', fontSize: 11, marginTop: 6 },
  growthBody: { flex: 1, paddingHorizontal: 24, paddingTop: 22 },
  growthRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  growthCard: { flex: 1, borderRadius: 24, borderWidth: 1, padding: 12 },
  growthCardHero: { borderWidth: 0 },
  growthTrack: { height: 250, borderRadius: 18, justifyContent: 'flex-end', overflow: 'hidden' },
  growthFill: { borderRadius: 16, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 10, minHeight: 0 },
  growthRate: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.6 },
  growthCardTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 12 },
  growthCardBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 15, marginTop: 3 },
  growthFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  growthFeature: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, maxWidth: '100%' },
  growthFeatureText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, flexShrink: 1 },
  centerBody: { flex: 1, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  doneBadge: { position: 'absolute', right: 52, top: 52, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF' },
  scrollBody: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  overloadCard: { borderRadius: 28, padding: 20 },
  stairs: { height: 120, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  stair: { flex: 1, borderRadius: 10 },
  overloadRuleRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20 },
  overloadNumber: { fontFamily: 'Inter_700Bold', fontSize: 40, letterSpacing: -1.5 },
  overloadRuleTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  overloadRuleText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 3 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, borderWidth: 1, padding: 16 },
  tipText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19 },
  buildPercent: { fontFamily: 'Inter_700Bold', fontSize: 48, letterSpacing: -2 },
  buildPercentSign: { fontSize: 22, letterSpacing: 0 },
  checklist: { alignSelf: 'stretch', borderRadius: 22, borderWidth: 1, padding: 16, gap: 12, marginTop: 22 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkPulse: { width: 8, height: 8, borderRadius: 4 },
  checkText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  introIcon: { width: 132, height: 132, borderRadius: 34 },
  questionBody: { flex: 1, minHeight: 0 },
  questionScroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18 },
  coachRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22 },
  coachAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  coachAvatarImage: { width: 64, height: 64, marginBottom: -8 },
  coachBubble: { flex: 1, borderRadius: 20, borderTopLeftRadius: 6, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 8 },
  questionTitle: { fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 36, letterSpacing: -1, marginTop: 8, marginBottom: 20 },
  choiceSlot: { flexGrow: 1, flexBasis: '46%' },
  choice: { minHeight: 74, borderRadius: 22, borderWidth: 1.5, padding: 14, paddingRight: 38, justifyContent: 'flex-end', overflow: 'hidden' },
  choiceTall: { minHeight: 112, justifyContent: 'space-between' },
  choiceBadge: { position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  choiceBadgeFill: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  stepHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  stepNumber: { fontFamily: 'Inter_700Bold', fontSize: 40, lineHeight: 44, letterSpacing: -2 },
  stepTotal: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  optionalTag: { marginLeft: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  optionalText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  pulseDock: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 6 },
  pulse: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 999, borderWidth: 1, paddingLeft: 5, paddingRight: 14, paddingVertical: 5, maxWidth: '100%', overflow: 'hidden' },
  pulseFlash: { borderRadius: 999, borderWidth: 1 },
  pulseAvatar: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  pulseFace: { width: 26, height: 26, borderRadius: 13, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
  pulseFaceImage: { width: 30, height: 30, marginBottom: -5 },
  pulseText: { flexShrink: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  pulseWave: { flexDirection: 'row', alignItems: 'center', gap: 2.5, height: 16 },
  pulseBar: { width: 3, borderRadius: 2 },
  aiStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginTop: 14, maxWidth: '100%' },
  aiStatusText: { flexShrink: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12.5 },
  aiDots: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 14 },
  aiDot: { width: 5, height: 5, borderRadius: 3 },
  aiNote: { borderRadius: 22, borderWidth: 1, padding: 18, marginTop: 20 },
  aiNoteLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  aiNoteText: { fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 22 },
  brandTitle: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 5, rowGap: 4, marginTop: 12 },
  growthCardTitleText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  choiceIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  choiceText: { fontFamily: 'Inter_700Bold', fontSize: 15, lineHeight: 20, letterSpacing: -0.2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginTop: 14 },
  errorText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});
