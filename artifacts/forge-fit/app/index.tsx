import React from 'react';
import { Animated, Easing, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { hasActivePremiumEntitlement } from '@/lib/premiumAccess';
import { isValidTestPremiumPromoCode } from '@/lib/testPremiumPromo';
import { formatAnnualMonthlyPrice } from '@/lib/subscriptionPricing';

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
    ? require('@/assets/images/coach-onboarding.png')
    : variant === 'wave'
      ? require('@/assets/images/coach-wave-direct.jpg')
      : variant === 'write'
        ? require('@/assets/images/coach-writing-no-bg.png')
        : require('@/assets/images/coach-thumbs-up-no-bg.png');
  return <Image source={source} resizeMode="contain" style={[large ? styles.coachLarge : styles.coachSmall, !large && variant === 'wave' ? styles.coachWaveQuestion : null]} />;
}

function AnswerAnalysisStatus() {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.timing(progress, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(320),
    ]));
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const boxScale = progress.interpolate({ inputRange: [0, 0.12, 0.72, 0.87, 1], outputRange: [0.9, 1, 1, 0.84, 0.92] });
  const boxOpacity = progress.interpolate({ inputRange: [0, 0.1, 0.78, 0.9, 1], outputRange: [0.7, 1, 1, 0.55, 0.72] });
  const packetTranslate = progress.interpolate({ inputRange: [0, 0.12, 0.48, 0.7, 1], outputRange: [-12, -2, 5, 13, 13] });
  const packetOpacity = progress.interpolate({ inputRange: [0, 0.08, 0.5, 0.7, 1], outputRange: [0, 1, 1, 0, 0] });
  const packetScale = progress.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0.7, 1, 1, 0.8] });

  return <View style={styles.answerAnalysisStatus}>
    <Animated.View style={[styles.answerAnalysisBox, { borderColor: `${colors.primary}80`, backgroundColor: `${colors.primary}16`, opacity: boxOpacity, transform: [{ scale: boxScale }] }]}>
      <Animated.View style={[styles.answerAnalysisPacket, styles.answerAnalysisPacketTop, { backgroundColor: colors.primary, opacity: packetOpacity, transform: [{ translateX: packetTranslate }, { scale: packetScale }] }]} />
      <Animated.View style={[styles.answerAnalysisPacket, styles.answerAnalysisPacketMiddle, { backgroundColor: colors.primary, opacity: packetOpacity, transform: [{ translateX: packetTranslate }, { scale: packetScale }] }]} />
      <Animated.View style={[styles.answerAnalysisPacket, styles.answerAnalysisPacketBottom, { backgroundColor: colors.primary, opacity: packetOpacity, transform: [{ translateX: packetTranslate }, { scale: packetScale }] }]} />
      <Ionicons name="analytics-outline" size={17} color={colors.primary} />
    </Animated.View>
    <Text style={[styles.answerAnalysisLabel, { color: colors.mutedForeground }]}>{t('analyzingAnswers')}</Text>
  </View>;
}

function ChoiceButton({ label, selected, onPress, icon }: { label: string; selected: boolean; onPress: () => void; icon?: React.ComponentProps<typeof Ionicons>['name'] }) {
  const colors = useColors();
  return <Pressable onPress={() => { triggerHaptic(); onPress(); }} style={({ pressed }) => [styles.choice, { backgroundColor: selected ? `${colors.primary}20` : colors.card, borderColor: selected ? colors.primary : colors.border, opacity: pressed ? 0.78 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
    {icon ? <View style={[styles.choiceIcon, { backgroundColor: selected ? colors.primary : colors.secondary }]}><Ionicons name={icon} size={19} color={selected ? colors.primaryForeground : colors.foreground} /></View> : null}
    <Text style={[styles.choiceText, { color: colors.foreground }]}>{label}</Text>
    {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
  </Pressable>;
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
    <Pressable onPress={() => change(unit === 'metric' ? 0.5 : 1)} style={[styles.stepButton, { backgroundColor: colors.primary }]}><Ionicons name="add" size={22} color={colors.primaryForeground} /></Pressable>
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
      <Pressable onPress={() => change(1)} style={[styles.stepButton, { backgroundColor: colors.primary }]}><Ionicons name="add" size={22} color={colors.primaryForeground} /></Pressable>
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
    <Pressable onPress={() => adjust(1)} style={[styles.stepButton, { backgroundColor: colors.primary }]}><Ionicons name="add" size={22} color={colors.primaryForeground} /></Pressable>
  </View>;
}

export default function EntryScreen() {
  const colors = useColors();
  const { onboardingComplete, introSeen, isPremium, coachIntroPending, setIntroSeen, restartOnboarding } = useFit();
  const params = useLocalSearchParams<{ edit?: string; fields?: string }>();
  const editMode = params.edit === '1';
  const selectedFields = React.useMemo(() => parseProfileEditFields(params.fields), [params.fields]);
  const entryRoute = getEntryRoute({ onboardingComplete, introSeen, isPremium, subscriptionPurchaseEnabled: SUBSCRIPTION_PURCHASE_ENABLED, coachIntroPending });
  const [redirectFailed, setRedirectFailed] = React.useState(false);
  const [premiumCelebrationVisible, setPremiumCelebrationVisible] = React.useState(false);
  React.useEffect(() => {
      if (!editMode && !premiumCelebrationVisible && (entryRoute === 'tabs' || entryRoute === 'coach')) {
       setRedirectFailed(false);
       const timeout = setTimeout(() => setRedirectFailed(true), 900);
        router.replace(entryRoute === 'coach' ? '/(tabs)/coach' : '/(tabs)');
       return () => clearTimeout(timeout);
     }
     setRedirectFailed(false);
    }, [editMode, entryRoute, premiumCelebrationVisible]);
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
      }}
    />;
  }
  if (entryRoute === 'premium') {
    return <PremiumWelcomeOfferScreen
      onUnlock={() => router.replace('/(tabs)/coach')}
      onPurchaseSuccess={() => setPremiumCelebrationVisible(true)}
    />;
  }
  return redirectFailed ? <EntryRecoveryScreen onRestart={restartOnboarding} /> : <View style={[styles.entryRedirecting, { backgroundColor: colors.background }]} />;
}

function EntryRecoveryScreen({ onRestart }: { onRestart: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);

  return (
    <Screen>
      <View style={styles.entryRecovery}>
        <ForgeFitMark size={58} />
        <Text style={[styles.entryRecoveryTitle, { color: colors.foreground }]}>{t('restartOnboarding')}</Text>
        <Text style={[styles.entryRecoveryBody, { color: colors.mutedForeground }]}>{t('restartOnboardingDescription')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            triggerHaptic();
            onRestart();
          }}
          style={({ pressed }) => [styles.entryRecoveryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}
        >
          <Text style={[styles.entryRecoveryButtonText, { color: colors.primaryForeground }]}>{t('restartOnboarding')}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>
    </Screen>
  );
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
  const [dumbbellWeightKg, setDumbbellWeightKg] = React.useState<number | null>(null);
  const [dumbbellWeightText, setDumbbellWeightText] = React.useState('');
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
  const [taken, setTaken] = React.useState<string[]>([]);
  const [error, setError] = React.useState('');
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
  const recommendedTargetWeight = React.useMemo(() => recommendTargetWeight({ height, weight, age, goal, sex, activity, goalRate }), [height, weight, age, goal, sex, activity, goalRate]);

  React.useEffect(() => {
    if (!editMode || !savedProfile) return;
    setEquipment(savedProfile.equipment);
    setEquipmentDetails(savedProfile.equipmentDetails ?? '');
    setGymLevel(savedProfile.gymLevel ?? 'full');
    setDumbbellWeightKg(savedProfile.dumbbellWeightKg ?? null);
    setDumbbellWeightText(savedProfile.dumbbellWeightKg ? String(savedProfile.dumbbellWeightKg) : '');
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
  const updateDumbbellWeightText = (text: string) => {
    setDumbbellWeightText(text);
    const parsed = Number(text.replace(',', '.'));
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 100) setDumbbellWeightKg(Math.round(parsed * 10) / 10);
  };

  React.useEffect(() => {
    AsyncStorage.getItem('forge-fit-usernames').then((value) => setTaken(value ? JSON.parse(value) as string[] : [])).catch(() => undefined);
  }, []);

  const advance = () => {
    Animated.sequence([Animated.timing(slide, { toValue: 0, duration: 120, useNativeDriver: true }), Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true })]).start();
    setStep((current) => current + 1);
  };
  const finish = () => {
    const cleanUsername = username.trim().replace(/\s+/g, '').toLowerCase();
    const profile: Profile = {
      equipment,
      equipmentDetails: equipment === 'home' ? equipmentDetails.trim() : undefined,
      gymLevel: equipment === 'gym' ? gymLevel : undefined,
      dumbbellWeightKg: equipment !== 'bodyweight' && dumbbellWeightKg !== null ? dumbbellWeightKg : undefined,
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
    };
    completeOnboarding(profile, cleanUsername, { profileEdit: editMode });
    const previousUsername = savedUsername?.trim().replace(/\s+/g, '').toLowerCase();
    const nextTaken = Array.from(new Set([...taken.filter((item) => item !== previousUsername), cleanUsername]));
    AsyncStorage.setItem('forge-fit-usernames', JSON.stringify(nextTaken)).catch(() => undefined);
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
      const previousUsername = savedUsername?.trim().replace(/\s+/g, '').toLowerCase();
      if (taken.includes(clean) && clean !== previousUsername) return setError(t('usernameTaken'));
      if (!editMode && !onboardingMode) {
        return advance();
      }
    }
    if (activeStep === 'mode') return;
    if (activeStep === 1 && equipment === 'gym' && !gymLevel) return setError(t('gymLevelQuestion'));
    if (activeStep === 1 && equipment !== 'bodyweight' && dumbbellWeightKg !== null) {
      const parsed = Number(dumbbellWeightText.replace(',', '.'));
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) return setError(t('dumbbellWeightError'));
      setDumbbellWeightKg(Math.round(parsed * 10) / 10);
    }
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
  }), [language, step, activeStep, username, equipment, gymLevel, dumbbellWeightKg, dumbbellWeightText, age, taken, measurementUnit, heightText, heightFeetText, heightInchesText, weightText, ageText, targetWeightText, targetWeightUnit, hasTargetWeightStep, goal]);
  const titleKeys = ['nameFirstQuestion', 'equipmentQuestion', 'heightQuestion', 'weightQuestion', 'ageQuestion', 'goalQuestion', 'sexQuestion', 'activityQuestion', 'trainingDaysQuestion', 'durationQuestion', 'speedQuestion', 'dietQuestion', 'proteinQuestion', 'experienceQuestion', 'preferredDaysQuestion'] as const;
  const selectedDays = (day: string) => setPreferredDays((current) => {
    if (current.includes(day)) return current.filter((item) => item !== day);
    if (current.length >= trainingDays) return current;
    return [...current, day];
  });
  const renderBody = () => {
    if (activeStep === 0) return <><Text style={[styles.questionHint, { color: colors.mutedForeground }]}>{t('nameFirstHint')}</Text><TextInput autoFocus autoCapitalize="none" value={username} onChangeText={setUsername} placeholder={t('usernamePlaceholder')} placeholderTextColor={colors.mutedForeground} style={[styles.textInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /></>;
     if (activeStep === 1) return <><View style={styles.choiceList}><ChoiceButton label={t('bodyweight')} selected={equipment === 'bodyweight'} onPress={() => setEquipment('bodyweight')} icon="body-outline" /><ChoiceButton label={t('homeEquipment')} selected={equipment === 'home'} onPress={() => setEquipment('home')} icon="home-outline" /><ChoiceButton label={t('gymEquipment')} selected={equipment === 'gym'} onPress={() => setEquipment('gym')} icon="barbell-outline" /></View>{equipment === 'home' ? <View style={styles.homeEquipmentDetails}><Text style={[styles.subLabel, { color: colors.mutedForeground }]}>{t('homeEquipmentDetailsHint')}</Text><TextInput value={equipmentDetails} onChangeText={setEquipmentDetails} multiline numberOfLines={3} placeholder={t('homeEquipmentDetailsPlaceholder')} placeholderTextColor={colors.mutedForeground} style={[styles.equipmentDetailsInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /></View> : null}{equipment === 'gym' ? <View style={styles.gymLevels}><Text style={[styles.subLabel, { color: colors.mutedForeground }]}>{t('gymLevelQuestion')}</Text><ChoiceButton label={t('gymBasic')} selected={gymLevel === 'basic'} onPress={() => setGymLevel('basic')} /><ChoiceButton label={t('gymIntermediate')} selected={gymLevel === 'intermediate'} onPress={() => setGymLevel('intermediate')} /><ChoiceButton label={t('gymFull')} selected={gymLevel === 'full'} onPress={() => setGymLevel('full')} /></View> : null}{equipment !== 'bodyweight' ? <View style={styles.dumbbellSection}><ChoiceButton label={t('dumbbellOptionLabel')} selected={dumbbellWeightKg !== null} onPress={() => { if (dumbbellWeightKg === null) { setDumbbellWeightKg(10); setDumbbellWeightText('10'); } else { setDumbbellWeightKg(null); setDumbbellWeightText(''); } }} icon="barbell-outline" />{dumbbellWeightKg !== null ? <View style={styles.dumbbellWeightFields}><Text style={[styles.subLabel, { color: colors.mutedForeground }]}>{t('dumbbellWeightLabel')}</Text><View style={styles.dumbbellWeightInputRow}><TextInput value={dumbbellWeightText} onChangeText={updateDumbbellWeightText} keyboardType="decimal-pad" selectTextOnFocus style={[styles.dumbbellWeightInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} placeholder={t('dumbbellWeightPlaceholder')} placeholderTextColor={colors.mutedForeground} /><Text style={[styles.dumbbellWeightUnit, { color: colors.primary }]}>kg</Text></View><Text style={[styles.centerHint, { color: colors.mutedForeground }]}>{t('dumbbellWeightHint')}</Text></View> : null}</View> : null}</>;
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
    return <><View style={styles.dayGrid}>{['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => <Pressable key={day} onPress={() => selectedDays(day)} style={[styles.dayButton, { backgroundColor: preferredDays.includes(day) ? colors.primary : colors.card, borderColor: preferredDays.includes(day) ? colors.primary : colors.border, opacity: !preferredDays.includes(day) && preferredDays.length >= trainingDays ? 0.45 : 1 }]}><Text style={[styles.dayText, { color: preferredDays.includes(day) ? colors.primaryForeground : colors.foreground }]}>{day}</Text></Pressable>)}</View><Text style={[styles.centerHint, { color: colors.mutedForeground }]}>{preferredDays.length}/{trainingDays} · {t('preferredDaysQuestion')}</Text></>;
  };

  const chooseMode = (mode: OnboardingMode) => {
    triggerHaptic();
    setOnboardingMode(mode);
    setStep(mode === 'quick' ? 0 : 1);
    slide.setValue(1);
  };

     if (!started) return <View style={[styles.onboardingShell, { backgroundColor: colors.background }]}><WelcomeScreen onStart={() => { slide.setValue(1); setStarted(true); }} /></View>;
     if (!growthSeen) return <View style={[styles.onboardingShell, { backgroundColor: colors.background }]}><GrowthComparisonScreen onContinue={() => setGrowthSeen(true)} /></View>;
    if (!editMode && activeStep === 'mode') return <OnboardingModeChoice onSelect={chooseMode} onBack={() => { setOnboardingMode(null); setStep(0); }} />;
    if (buildingPlan) return <View style={[styles.onboardingShell, { backgroundColor: colors.background }]}><PlanBuildingScreen onComplete={finish} /></View>;
    if (step === total && equipment === 'gym' && !overloadSeen) return <View style={[styles.onboardingShell, { backgroundColor: colors.background }]}><ProgressiveOverloadScreen onContinue={() => setOverloadSeen(true)} /></View>;
   if (step === total) return <View style={[styles.onboardingShell, { backgroundColor: colors.background }]}><CompletionScreen onContinue={() => setBuildingPlan(true)} /></View>;
    const numericStep = typeof activeStep === 'number' ? activeStep : 0;
    const optional = onboardingMode !== 'quick' && numericStep >= 6 && !hasTargetWeightStep;
    const isTargetStep = numericStep === targetStep && hasTargetWeightStep;
    const titleKey: Parameters<typeof translate>[1] = isTargetStep ? 'targetWeightQuestion' : titleKeys[numericStep] ?? 'preferredDaysQuestion';
    return <LinearGradient colors={[colors.background, colors.secondary, colors.background]} style={styles.full}>
      <OnboardingAtmosphere />
     <View style={styles.questionTop}><GainModeWordmark color={colors.foreground} /><LanguageSelector language={language} onSelect={setLanguage} /></View>
    <Animated.View {...swipeResponder.panHandlers} style={[styles.questionBody, { opacity: slide, transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
       <KeyboardAwareScrollViewCompat contentContainerStyle={styles.questionScrollContent} showsVerticalScrollIndicator={false} bounces={false} bottomOffset={72}>
          <View style={styles.coachQuestionVisual}><AnswerAnalysisStatus /><View style={styles.coachPhotoStage}><CoachMotion onboarding variant="write" /></View></View>
          {editMode ? <View style={[styles.profileEditInfoBar, { backgroundColor: `${colors.blue}16`, borderColor: `${colors.blue}55` }]}><Ionicons name="information-circle-outline" size={18} color={colors.blue} /><Text style={[styles.profileEditInfoText, { color: colors.foreground }]}>{t('profileEditLimitBar')}</Text></View> : null}
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{step + 1} / {total}</Text>
        {optional ? <Text style={[styles.optionalLabel, { color: colors.primary }]}>{t('optionalLabel')}</Text> : null}
         <Text style={[styles.questionTitle, { color: colors.foreground }]}>{t(titleKey)}</Text>
        {renderBody()}
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
      </KeyboardAwareScrollViewCompat>
    </Animated.View>
       <View style={styles.buttonArea}><Pressable onPress={() => { triggerHaptic(); next(); }} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}><Text style={[styles.nextText, { color: colors.primaryForeground }]}>{step === total - 1 ? t('continueToPlan') : t('continue')}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable></View>
  </LinearGradient>;
}

function OnboardingModeChoice({ onSelect, onBack }: { onSelect: (mode: OnboardingMode) => void; onBack: () => void }) {
  const colors = useColors();
  const { language, setLanguage } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);

  return (
    <LinearGradient colors={[colors.background, colors.secondary, colors.background]} style={styles.full}>
       <OnboardingAtmosphere />
       <View style={styles.questionTop}>
         <GainModeWordmark color={colors.foreground} />
        <LanguageSelector language={language} onSelect={setLanguage} />
      </View>
      <View style={styles.modeChoiceContent}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{t('onboardingModeEyebrow')}</Text>
        <Text style={[styles.modeChoiceTitle, { color: colors.foreground }]}>{t('onboardingModeTitle')}</Text>
        <Text style={[styles.modeChoiceSubtitle, { color: colors.mutedForeground }]}>{t('onboardingModeSubtitle')}</Text>
        <View style={styles.modeChoiceList}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onSelect('quick')}
            style={({ pressed }) => [styles.modeChoiceCard, { backgroundColor: colors.card, borderColor: `${colors.primary}65`, opacity: pressed ? 0.76 : 1 }]}
          >
            <View style={[styles.modeChoiceIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="flash-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.modeChoiceCopy}>
              <Text style={[styles.modeChoiceCardTitle, { color: colors.foreground }]}>{t('onboardingQuickTitle')}</Text>
              <Text style={[styles.modeChoiceCardDescription, { color: colors.mutedForeground }]}>{t('onboardingQuickDescription')}</Text>
              <Text style={[styles.modeChoiceCount, { color: colors.primary }]}>{t('onboardingQuickCount')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onSelect('detailed')}
            style={({ pressed }) => [styles.modeChoiceCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.76 : 1 }]}
          >
            <View style={[styles.modeChoiceIcon, { backgroundColor: `${colors.blue}20` }]}>
              <Ionicons name="analytics-outline" size={22} color={colors.blue} />
            </View>
            <View style={styles.modeChoiceCopy}>
              <Text style={[styles.modeChoiceCardTitle, { color: colors.foreground }]}>{t('onboardingDetailedTitle')}</Text>
              <Text style={[styles.modeChoiceCardDescription, { color: colors.mutedForeground }]}>{t('onboardingDetailedDescription')}</Text>
              <Text style={[styles.modeChoiceCount, { color: colors.blue }]}>{t('onboardingDetailedCount')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.blue} />
          </Pressable>
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.modeChoiceBack, { opacity: pressed ? 0.65 : 1 }]}>
        <Ionicons name="arrow-back" size={16} color={colors.mutedForeground} />
        <Text style={[styles.modeChoiceBackText, { color: colors.mutedForeground }]}>{t('onboardingModeBack')}</Text>
      </Pressable>
    </LinearGradient>
  );
}

function OnboardingAtmosphere() {
  const colors = useColors();
  const motion = React.useRef(new Animated.Value(0)).current;
  const pulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const drift = Animated.loop(Animated.sequence([
      Animated.timing(motion, { toValue: 1, duration: 11500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(motion, { toValue: 0, duration: 11500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const breathe = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 5200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 5200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    drift.start();
    breathe.start();
    return () => {
      drift.stop();
      breathe.stop();
    };
  }, [motion, pulse]);

  const driftX = motion.interpolate({ inputRange: [0, 1], outputRange: [-22, 26] });
  const driftY = motion.interpolate({ inputRange: [0, 1], outputRange: [18, -26] });
  const blobScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.1] });
  const blobOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.4] });

  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Animated.View style={[styles.onboardingBlob, styles.onboardingBlobBlue, { backgroundColor: colors.primary, opacity: blobOpacity, transform: [{ translateX: driftX }, { translateY: driftY }, { scale: blobScale }] }]} />
    <Animated.View style={[styles.onboardingBlob, styles.onboardingBlobPurple, { backgroundColor: colors.blue, opacity: blobOpacity, transform: [{ translateX: driftY }, { translateY: driftX }, { scale: blobScale }] }]} />
    <Animated.View style={[styles.onboardingBlob, styles.onboardingBlobCyan, { backgroundColor: colors.secondary, opacity: blobOpacity, transform: [{ translateX: Animated.multiply(driftX, -0.7) }, { translateY: Animated.multiply(driftY, -0.55) }, { scale: blobScale }] }]} />
  </View>;
}

function WelcomeLanguageSelector({ language, onSelect }: { language: Language; onSelect: (language: Language) => void }) {
  return <View style={styles.welcomeLanguagePill}>
    {(Object.keys(languageLabels) as Language[]).map((item) => (
      <Pressable key={item} onPress={() => { triggerHaptic(); onSelect(item); }} style={[styles.welcomeLanguageOption, language === item ? styles.welcomeLanguageSelected : null]}>
        <MiniFlag language={item} />
      </Pressable>
    ))}
  </View>;
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const colors = useColors();
  const { language, setLanguage } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const { width } = useWindowDimensions();
  const [leaving, setLeaving] = React.useState(false);
  const orbScale = React.useRef(new Animated.Value(0.78)).current;
  const orbRotation = React.useRef(new Animated.Value(0)).current;
  const coachFloat = React.useRef(new Animated.Value(0)).current;
  const haloPulse = React.useRef(new Animated.Value(0)).current;
  const copyOpacity = React.useRef(new Animated.Value(0)).current;
  const copyTranslateY = React.useRef(new Animated.Value(22)).current;
  const buttonOpacity = React.useRef(new Animated.Value(0)).current;
  const buttonTranslateY = React.useRef(new Animated.Value(28)).current;
  const pageTranslateX = React.useRef(new Animated.Value(0)).current;
  const pageOpacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(orbScale, { toValue: 1, damping: 13, stiffness: 145, mass: 0.8, useNativeDriver: true }),
      Animated.timing(orbRotation, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(120),
        Animated.parallel([
          Animated.timing(copyOpacity, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(copyTranslateY, { toValue: 0, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(250),
        Animated.parallel([
          Animated.timing(buttonOpacity, { toValue: 1, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(buttonTranslateY, { toValue: 0, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, [buttonOpacity, buttonTranslateY, copyOpacity, copyTranslateY, orbRotation, orbScale]);

  React.useEffect(() => {
    const floatLoop = Animated.loop(Animated.sequence([
      Animated.timing(coachFloat, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(coachFloat, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const haloLoop = Animated.loop(Animated.sequence([
      Animated.timing(haloPulse, { toValue: 1, duration: 2300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(haloPulse, { toValue: 0, duration: 2300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    floatLoop.start();
    haloLoop.start();
    return () => {
      floatLoop.stop();
      haloLoop.stop();
    };
  }, [coachFloat, haloPulse]);

  const startAdventure = () => {
    if (leaving) return;
    triggerHaptic();
    setLeaving(true);
    Animated.parallel([
      Animated.timing(pageTranslateX, { toValue: -width, duration: 560, easing: Easing.bezier(0.22, 0.61, 0.36, 1), useNativeDriver: true }),
      Animated.timing(pageOpacity, { toValue: 0.96, duration: 440, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(orbScale, { toValue: 1.08, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onStart();
    });
  };

  const orbRotateValue = orbRotation.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '0deg'] });
  const coachTranslateY = coachFloat.interpolate({ inputRange: [0, 1], outputRange: [3, -7] });
  const haloScale = haloPulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.08] });
  const haloOpacity = haloPulse.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0.78] });

  return <AnimatedLinearGradient colors={[colors.background, colors.secondary, colors.background]} style={[styles.full, { opacity: pageOpacity, transform: [{ translateX: pageTranslateX }] }]}>
    <OnboardingAtmosphere />
    <View style={styles.welcomeHeader}>
       <View style={styles.welcomeLogoDock}>
         <GainModeWordmark color={colors.foreground} width={128} height={18} />
       </View>
       <View style={styles.welcomeLanguageDock}>
         <WelcomeLanguageSelector language={language} onSelect={setLanguage} />
       </View>
    </View>
    <View style={styles.welcomeReferenceCard}>
      <Animated.View style={[styles.welcomeCardGlow, { backgroundColor: colors.primary, opacity: haloOpacity, transform: [{ scale: haloScale }] }]} />
      <Animated.View style={[styles.welcomeCharacterStage, { transform: [{ translateY: coachTranslateY }, { scale: orbScale }, { rotate: orbRotateValue }] }]}>
        <Image source={require('@/assets/images/coach-wave-static-v4.png')} resizeMode="contain" style={styles.welcomeReferenceCharacter} />
      </Animated.View>
      <Animated.View style={[styles.welcomeReferenceCopy, { transform: [{ translateY: copyTranslateY }] }]}>
        <Text style={[styles.welcomeReferenceTitle, { color: colors.foreground }]}>{t('welcomeHeroTitle')}</Text>
        <Text style={[styles.welcomeReferenceSubtitle, { color: colors.foreground }]}>{t('welcomeHeroSubtitle')}</Text>
      </Animated.View>
    </View>
     <Animated.View style={[styles.welcomeReferenceActions, { transform: [{ translateY: buttonTranslateY }] }]}>
      <Pressable accessibilityRole="button" onPress={startAdventure} disabled={leaving} style={({ pressed }) => [styles.welcomeReferenceStart, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}>
        <Text style={[styles.welcomeReferenceStartText, { color: colors.primaryForeground }]}>{t('welcomeHeroStart')}</Text>
      </Pressable>
    </Animated.View>
  </AnimatedLinearGradient>;
}

function GrowthComparisonScreen({ onContinue }: { onContinue: () => void }) {
  const colors = useColors();
  const { language, setLanguage } = useFit();
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
    triggerHaptic();
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

  return <LinearGradient colors={[colors.background, colors.secondary, colors.background]} style={styles.full}>
    <OnboardingAtmosphere />
    <View style={styles.questionTop}>
       <GainModeWordmark color={colors.foreground} />
      <LanguageSelector language={language} onSelect={setLanguage} />
    </View>
    <Animated.View style={[styles.growthContent, { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }]}>
      <Text style={[styles.growthEyebrow, { color: colors.primary }]}>{t('growthEyebrow')}</Text>
      <Text style={[styles.growthTitle, { color: colors.foreground }]}>{t('growthTitle')}</Text>
      <Text style={[styles.growthBody, { color: colors.mutedForeground }]}>{t('growthBody')}</Text>
      <View style={styles.growthBars}>
        <View style={styles.growthBarColumn}>
          <View style={[styles.growthBarTrack, { backgroundColor: `${colors.mutedForeground}12`, borderColor: colors.border }]}>
            <Animated.View style={[styles.growthBarFill, { height: leftHeight, backgroundColor: `${colors.mutedForeground}70` }]}>
              <Text style={[styles.growthRate, { color: colors.foreground }]}>{t('growthSlowRate')}</Text>
            </Animated.View>
          </View>
          <Text style={[styles.growthBarTitle, { color: colors.foreground }]}>{t('growthUnplannedTitle')}</Text>
          <Text style={[styles.growthBarBody, { color: colors.mutedForeground }]}>{t('growthUnplannedBody')}</Text>
        </View>
        <View style={styles.growthBarColumn}>
          <View style={[styles.growthBarTrack, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}55` }]}>
            <Animated.View style={[styles.growthBarFill, { height: rightHeight, backgroundColor: colors.primary }]}>
              <Text style={[styles.growthRate, { color: colors.primaryForeground }]}>{t('growthFastRate')}</Text>
            </Animated.View>
          </View>
          <Text style={[styles.growthBarTitle, { color: colors.foreground }]}>{t('growthGainModeTitle')}</Text>
          <Text style={[styles.growthBarBody, { color: colors.mutedForeground }]}>{t('growthGainModeBody')}</Text>
          <View style={styles.growthFeatureList}>
            {(['growthFeaturePhotoCalories', 'growthFeatureCalorieGoal', 'growthFeatureWorkoutPlan', 'growthFeatureAiCoach'] as const).map((key) => (
              <View key={key} style={styles.growthFeatureRow}>
                <View style={[styles.growthFeatureDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.growthFeatureText, { color: colors.mutedForeground }]}>{t(key)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
    <Pressable accessibilityRole="button" onPress={leaveScreen} disabled={leaving} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, opacity: pressed || leaving ? 0.72 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <Text style={[styles.nextText, { color: colors.primaryForeground }]}>{t('growthContinue')}</Text>
      <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
    </Pressable>
  </LinearGradient>;
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

function ProgressiveOverloadScreen({ onContinue }: { onContinue: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const pulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return <LinearGradient colors={[colors.background, colors.secondary, colors.background]} style={styles.full}>
    <OnboardingAtmosphere />
    <View style={styles.overloadTop}><ForgeFitMark size={38} /><View style={[styles.overloadBadge, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}55` }]}><Ionicons name="barbell-outline" size={13} color={colors.primary} /><Text style={[styles.overloadBadgeText, { color: colors.primary }]}>{t('overloadEyebrow')}</Text></View></View>
    <View style={styles.overloadContent}>
      <Animated.View style={[styles.overloadOrb, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}55`, transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] }) }] }]}>
        <View style={[styles.overloadOrbInner, { backgroundColor: colors.primary }]}><Ionicons name="barbell-outline" size={48} color={colors.primaryForeground} /></View>
      </Animated.View>
      <Text style={[styles.overloadTitle, { color: colors.foreground }]}>{t('overloadTitle')}</Text>
      <Text style={[styles.overloadBody, { color: colors.mutedForeground }]}>{t('overloadBody')}</Text>
      <View style={[styles.overloadRule, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.overloadRuleNumber, { backgroundColor: `${colors.primary}18` }]}><Text style={[styles.overloadRuleNumberText, { color: colors.primary }]}>12+</Text></View>
        <View style={{ flex: 1 }}><Text style={[styles.overloadRuleTitle, { color: colors.foreground }]}>{t('overloadRuleTitle')}</Text><Text style={[styles.overloadRuleText, { color: colors.mutedForeground }]}>{t('overloadRule')}</Text></View>
      </View>
      <View style={[styles.overloadTip, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}40` }]}><Ionicons name="sparkles-outline" size={18} color={colors.success} /><Text style={[styles.overloadTipText, { color: colors.foreground }]}>{t('overloadTip')}</Text></View>
    </View>
    <Pressable onPress={() => { triggerHaptic(); onContinue(); }} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.98 : 1 }] }]}><Text style={[styles.nextText, { color: colors.primaryForeground }]}>{t('overloadContinue')}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable>
  </LinearGradient>;
}

function CompletionScreen({ onContinue }: { onContinue: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
    return <LinearGradient colors={[colors.background, colors.secondary, colors.background]} style={styles.full}><View style={styles.completionContent}><View style={styles.completionCoachStage}><CompletionCheckmark /><View style={[styles.completionCoach, { backgroundColor: `${colors.primary}18` }]}><CoachMotion variant="done" large /></View></View><Text style={[styles.welcomeTitle, { color: colors.foreground }]}>{t('finishQuestionsTitle')}</Text><Text style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}>{t('finishQuestionsBody')}</Text></View><Pressable onPress={() => { triggerHaptic(); onContinue(); }} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.98 : 1 }] }]}><Text style={[styles.nextText, { color: colors.primaryForeground }]}>{t('continueToPlan')}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable></LinearGradient>;
}

function PlanBuildingScreen({ onComplete }: { onComplete: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const progress = React.useRef(new Animated.Value(0)).current;
  const rotation = React.useRef(new Animated.Value(0)).current;
  const [phase, setPhase] = React.useState(0);

  React.useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 5600, useNativeDriver: false }).start();
    const spin = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 1800, useNativeDriver: true }));
    spin.start();
    const phaseTimer = setInterval(() => setPhase((current) => Math.min(current + 1, 3)), 1450);
    const completionTimer = setTimeout(onComplete, 6000);
    return () => {
      spin.stop();
      clearInterval(phaseTimer);
      clearTimeout(completionTimer);
    };
  }, [onComplete, progress, rotation]);

  const spinValue = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const widthValue = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const phaseKeys: Array<'planBuildingStep1' | 'planBuildingStep2' | 'planBuildingStep3' | 'planBuildingStep4'> = ['planBuildingStep1', 'planBuildingStep2', 'planBuildingStep3', 'planBuildingStep4'];
  return <LinearGradient colors={[colors.background, colors.secondary, colors.background]} style={styles.full}>
    <OnboardingAtmosphere />
    <View style={styles.planBuildingContent}>
      <Animated.View style={[styles.planBuildingOrb, { borderColor: `${colors.primary}50`, transform: [{ rotate: spinValue }] }]}>
        <View style={[styles.planBuildingOrbInner, { backgroundColor: `${colors.primary}18`, borderColor: colors.primary }]}>
           <ForgeFitMark size={62} />
        </View>
      </Animated.View>
      <Text style={[styles.planBuildingTitle, { color: colors.foreground }]}>{t('planBuildingTitle')}</Text>
      <Text style={[styles.planBuildingBody, { color: colors.mutedForeground }]}>{t('planBuildingBody')}</Text>
      <View style={[styles.planProgressTrack, { backgroundColor: colors.secondary }]}>
        <Animated.View style={[styles.planProgressFill, { width: widthValue, backgroundColor: colors.primary }]} />
      </View>
      <Text style={[styles.planBuildingPhase, { color: colors.primary }]}>{t(phaseKeys[phase])}</Text>
      <View style={styles.planBuildingDots}>{phaseKeys.map((key, index) => <View key={key} style={[styles.planBuildingDot, { backgroundColor: index <= phase ? colors.primary : colors.secondary }]} />)}</View>
    </View>
  </LinearGradient>;
}

function IntroScreen({ onDone }: { onDone: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const appear = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => { Animated.timing(appear, { toValue: 1, duration: 420, useNativeDriver: true }).start(); }, [appear]);
   return <LinearGradient colors={[colors.background, colors.secondary, colors.background]} style={styles.full}><View style={styles.introVisual}><View style={[styles.auraLarge, { backgroundColor: `${colors.primary}18` }]} /><Image source={require('@/assets/images/icon.png')} style={styles.introIcon} /></View><Animated.View style={{ opacity: appear, transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }}><Text style={[styles.eyebrow, { color: colors.primary }]}>1 / 1</Text><Text style={[styles.introTitle, { color: colors.foreground }]}>{t('onboardingTitle')}</Text><Text style={[styles.introText, { color: colors.mutedForeground }]}>{t('onboardingIntro')}</Text></Animated.View><View style={styles.introBottom}><Pressable onPress={() => { triggerHaptic(); onDone(); }} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.98 : 1 }] }]}><Text style={[styles.nextText, { color: colors.primaryForeground }]}>{t('continue')}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable></View></LinearGradient>;
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
  const miniHeader = (title: string, icon: React.ComponentProps<typeof Ionicons>['name'] = 'sparkles-outline') => (
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
    {miniHeader(t('coachTitle'), 'sparkles-outline')}
    <Text style={[styles.demoMuted, { color: colors.mutedForeground }]}>{t('coachSubtitle')}</Text>
    <View style={[styles.demoCoachBubble, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}32` }]}><Ionicons name="sparkles" size={14} color={colors.primary} /><Text style={[styles.demoBubbleText, { color: colors.foreground }]}>{t('coachWelcome')}</Text></View>
    <View style={[styles.demoUserBubble, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.demoBubbleText, { color: colors.foreground }]}>{t('coachExample')}</Text></View>
    <View style={[styles.demoCoachBubble, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}32` }]}><Ionicons name="sparkles" size={14} color={colors.primary} /><Text style={[styles.demoBubbleText, { color: colors.foreground }]}>{t('coachAiCapabilities')}</Text></View>
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
    <View style={[styles.demoInsightCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}38` }]}><Ionicons name="sparkles-outline" size={17} color={colors.primary} /><Text style={[styles.demoBubbleText, { color: colors.foreground }]}>{t('weeklyAiCardSubtitle')}</Text></View>
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
        <View style={[styles.exploreValueIcon, { backgroundColor: `${colors.primary}22` }]}><Ionicons name="sparkles-outline" size={18} color={colors.primary} /></View>
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

function PremiumWelcomeOfferScreen({ onUnlock, onPurchaseSuccess }: { onUnlock: () => void; onPurchaseSuccess: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
    const { language, enableTestPremium } = useFit();
     const { monthlyPackage, annualPackage, isAvailable, isLoading, isSubscribed, purchase, restore, isPurchasing, isRestoring } = useSubscription();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
   const [selectedPlan, setSelectedPlan] = React.useState<'monthly' | 'annual'>(() => annualPackage ? 'annual' : 'monthly');
   const canOfferAnnual = Boolean(annualPackage);
  const annualMonthlyPrice = formatAnnualMonthlyPrice(annualPackage?.product);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [promoOpen, setPromoOpen] = React.useState(false);
  const [promoCode, setPromoCode] = React.useState('');
  const [promoError, setPromoError] = React.useState<string | null>(null);
  const [promoCelebrationVisible, setPromoCelebrationVisible] = React.useState(false);
   const selectedPackage = selectedPlan === 'annual' ? annualPackage : monthlyPackage;
   const benefits: Array<{ icon?: React.ComponentProps<typeof Ionicons>['name']; logo?: boolean; key: 'premiumWelcomeBenefit1' | 'premiumWelcomeBenefit2' | 'premiumWelcomeBenefit3' | 'premiumFeature4' | 'premiumFeature5' }> = [
    { logo: true, key: 'premiumWelcomeBenefit1' },
    { icon: 'restaurant-outline', key: 'premiumWelcomeBenefit2' },
    { icon: 'chatbubble-ellipses-outline', key: 'premiumWelcomeBenefit3' },
     { icon: 'analytics-outline', key: 'premiumFeature4' },
     { icon: 'chatbubble-ellipses-outline', key: 'premiumFeature5' },
  ];
   React.useEffect(() => {
     if (!canOfferAnnual && selectedPlan === 'annual') setSelectedPlan('monthly');
   }, [canOfferAnnual, selectedPlan]);
    const handlePurchase = async () => {
     setActionError(null);
      if (isSubscribed) {
         onUnlock();
        return;
      }
       if (!isAvailable || !selectedPackage) {
        setActionError(t('premiumStoreUnavailable'));
        return;
      }
      try {
         const customerInfo = await purchase(selectedPackage);
        if (!hasActivePremiumEntitlement(customerInfo)) {
          setActionError(t('premiumPurchaseError'));
          return;
        }
        onPurchaseSuccess();
      } catch {
        setActionError(t('premiumPurchaseError'));
      }
   };
  const handleRestore = async () => {
    if (!isAvailable) {
      setActionError(t('premiumStoreUnavailable'));
      return;
    }
    setActionError(null);
    try {
      const customerInfo = await restore();
      if (!hasActivePremiumEntitlement(customerInfo)) {
        setActionError(t('premiumRestoreNoPurchase'));
        return;
      }
      onPurchaseSuccess();
    } catch {
      setActionError(t('premiumRestoreError'));
    }
  };
  const handleTestPromo = () => {
    if (!isValidTestPremiumPromoCode(promoCode)) {
      setPromoError(t('premiumPromoInvalid'));
      return;
    }
    setPromoError(null);
    setPromoCelebrationVisible(true);
  };
   return <>
   <LinearGradient colors={[colors.background, colors.secondary, colors.background]} style={styles.offerGradient}>
    <View style={[styles.offerHeader, { paddingTop: insets.top + 10 }]}>
      <ForgeFitMark size={38} />
      <View style={[styles.offerProPill, { backgroundColor: `${isSubscribed ? colors.success : colors.primary}18`, borderColor: `${isSubscribed ? colors.success : colors.primary}55` }]}>{isSubscribed ? <Ionicons name="checkmark-circle" size={12} color={colors.success} /> : <ForgeFitMark size={18} />}<Text style={[styles.offerProText, { color: isSubscribed ? colors.success : colors.primary }]}>{isSubscribed ? t('premiumOwned') : t('premiumShort')}</Text></View>
    </View>
    <ScrollView
      contentContainerStyle={[styles.offerScrollContent, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
      bounces={false}
      alwaysBounceVertical={false}
      keyboardShouldPersistTaps="handled"
    >
    <View style={styles.offerHero}>
        <View style={[styles.offerOrb, { backgroundColor: colors.primary }]}><ForgeFitMark size={74} /></View>
      <Text style={[styles.offerEyebrow, { color: colors.primary }]}>{t('premiumWelcomeEyebrow')}</Text>
      <Text style={[styles.offerTitle, { color: colors.foreground }]}>{t('premiumWelcomeTitle')}</Text>
      <Text style={[styles.offerBody, { color: colors.mutedForeground }]}>{t('premiumWelcomeBody')}</Text>
      </View>
    <View style={[styles.offerValueCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
      <Text style={[styles.offerReason, { color: colors.foreground }]}>{t('premiumWelcomeReason')}</Text>
        <View style={styles.offerBenefits}>{benefits.map((benefit) => <View key={benefit.key} style={styles.offerBenefit}><View style={[styles.offerBenefitIcon, { backgroundColor: `${colors.primary}18` }]}>{benefit.logo ? <ForgeFitMark size={25} /> : <Ionicons name={benefit.icon!} size={17} color={colors.primary} />}</View><Text style={[styles.offerBenefitText, { color: colors.foreground }]}>{t(benefit.key)}</Text></View>)}</View>
    </View>
      <View style={styles.offerPlanChoices}>
        <Pressable testID="welcome-monthly-plan" accessibilityRole="button" accessibilityState={{ selected: selectedPlan === 'monthly' }} onPress={() => setSelectedPlan('monthly')} style={[styles.offerPlanOption, { backgroundColor: selectedPlan === 'monthly' ? `${colors.primary}18` : colors.glass, borderColor: selectedPlan === 'monthly' ? colors.primary : colors.glassBorder }]}>
          <View style={styles.offerPlanHeader}>
            <Text style={[styles.offerPlanLabel, { color: colors.foreground }]}>{t('premiumMonthlyPlan')}</Text>
            <View style={[styles.offerTrialBadge, { backgroundColor: `${colors.success}18`, borderColor: `${colors.success}45` }]}>
              <View style={styles.offerTrialIcon} accessible={false}>
                <Ionicons name="gift-outline" size={14} color={colors.success} />
              </View>
              <Text style={[styles.offerTrialBadgeText, { color: colors.success }]}>{t('premiumTrialShort')}</Text>
            </View>
          </View>
          <Text style={[styles.offerPlanPrice, { color: colors.foreground }]}>{monthlyPackage?.product.priceString ?? '—'}</Text>
          <Text style={[styles.offerPlanUnit, { color: colors.mutedForeground }]}>{t('premiumPerMonth')}</Text>
        </Pressable>
        <Pressable disabled={!canOfferAnnual} testID="welcome-annual-plan" accessibilityRole="button" accessibilityState={{ selected: selectedPlan === 'annual', disabled: !canOfferAnnual }} onPress={() => { if (canOfferAnnual) setSelectedPlan('annual'); }} style={[styles.offerPlanOption, { backgroundColor: selectedPlan === 'annual' ? `${colors.primary}18` : colors.glass, borderColor: selectedPlan === 'annual' ? colors.primary : colors.glassBorder, opacity: canOfferAnnual ? 1 : 0.58 }]}>
          {canOfferAnnual ? <View style={[styles.offerRecommendedBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.offerRecommendedText, { color: colors.primaryForeground }]}>{t('premiumRecommended')}</Text>
          </View> : null}
          <View style={styles.offerPlanHeader}><Text style={[styles.offerPlanLabel, { color: colors.foreground }]}>{t('premiumAnnualPlan')}</Text>{canOfferAnnual ? <View style={[styles.offerSavingsBadge, { backgroundColor: `${colors.success}18` }]}><Text style={[styles.offerSavingsValue, { color: colors.success }]}>{t('premiumAnnualSavingsValue')}</Text><Text style={[styles.offerSavingsLabel, { color: colors.success }]}>{t('premiumAnnualSavingsLabel')}</Text></View> : null}</View>
          <Text style={[styles.offerPlanPrice, { color: colors.foreground }]}>{annualPackage?.product.priceString ?? '—'}</Text>
          <View style={styles.offerAnnualPriceFooter}>
            <Text style={[styles.offerPlanUnit, { color: colors.mutedForeground }]}>{t('premiumPerYear')}</Text>
            {annualMonthlyPrice !== null ? <Text testID="annual-monthly-equivalent" style={[styles.offerMonthlyEquivalent, { color: colors.primary }]}>{annualMonthlyPrice} {t('premiumPerMonth')}</Text> : null}
          </View>
        </Pressable>
      </View>
     {actionError ? <Text style={[styles.offerActionError, { color: colors.destructive }]}>{actionError}</Text> : null}
      <View style={styles.offerPromoSection}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: promoOpen }} onPress={() => { setPromoOpen((open) => !open); setPromoError(null); }} style={styles.offerPromoToggle}>
          <Ionicons name="ticket-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.offerPromoToggleText, { color: colors.mutedForeground }]}>{t('premiumPromo')}</Text>
          <Ionicons name={promoOpen ? 'chevron-up' : 'chevron-down'} size={14} color={colors.mutedForeground} />
        </Pressable>
        {promoOpen ? <View style={styles.offerPromoForm}>
          <TextInput
            value={promoCode}
            onChangeText={(value) => { setPromoCode(value); setPromoError(null); }}
            placeholder={t('premiumPromoPlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleTestPromo}
            style={[styles.offerPromoInput, { backgroundColor: `${colors.secondary}88`, borderColor: colors.border, color: colors.foreground }]}
          />
          <Pressable accessibilityRole="button" onPress={handleTestPromo} style={({ pressed }) => [styles.offerPromoApply, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}>
            <Text style={[styles.offerPromoApplyText, { color: colors.primaryForeground }]}>{t('premiumPromoApply')}</Text>
          </Pressable>
        </View> : null}
        {promoError ? <Text style={[styles.offerPromoError, { color: colors.destructive }]}>{promoError}</Text> : null}
      </View>
     <Pressable accessibilityRole="button" accessibilityLabel={t('premiumWelcomeCta')} disabled={isLoading || isPurchasing} onPress={() => { triggerHaptic(); void handlePurchase(); }} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, opacity: pressed || isLoading || isPurchasing ? 0.58 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}><Text style={[styles.nextText, { color: colors.primaryForeground }]}>{isPurchasing ? t('premiumLoading') : t('premiumWelcomeCta')}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={t('premiumRestore')} disabled={isRestoring} onPress={() => { triggerHaptic(); handleRestore(); }} style={({ pressed }) => [styles.premiumRestoreButton, { opacity: pressed || isRestoring ? 0.58 : 1 }]}><Text style={[styles.premiumRestoreText, { color: colors.primary }]}>{isRestoring ? t('premiumLoading') : t('premiumRestore')}</Text></Pressable>
    </ScrollView>
   </LinearGradient>
   <PremiumSuccessCelebration
     visible={promoCelebrationVisible}
     onDone={() => {
       setPromoCelebrationVisible(false);
       enableTestPremium();
       onUnlock();
     }}
   />
   </>;
}

function OfferScreen({ onUnlock, onSkip }: { onUnlock: () => void; onSkip: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  return <LinearGradient colors={[colors.background, colors.secondary, colors.background]} style={styles.full}><View style={[styles.offerOrb, { backgroundColor: colors.primary }]}><ForgeFitMark size={74} /></View><Text style={[styles.offerTitle, { color: colors.foreground }]}>{t('premiumTitle')}</Text><Text style={[styles.introText, { color: colors.mutedForeground }]}>{t('premiumSubtitle')}</Text><View style={styles.features}>{(['premiumFeature1', 'premiumFeature2', 'premiumFeature3', 'premiumFeature4', 'premiumFeature5'] as const).map((key) => <View key={key} style={styles.feature}><Ionicons name="checkmark-circle" size={20} color={colors.primary} /><Text style={[styles.featureText, { color: colors.foreground }]}>{t(key)}</Text></View>)}</View><Pressable onPress={() => { triggerHaptic(); onUnlock(); }} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.98 : 1 }] }]}><Text style={[styles.nextText, { color: colors.primaryForeground }]}>{t('unlockPremium')}</Text></Pressable><Pressable onPress={() => { triggerHaptic(); onSkip(); }}><Text style={[styles.skip, { color: colors.mutedForeground }]}>{t('cancel')}</Text></Pressable></LinearGradient>;
}

const styles = StyleSheet.create({
  full: { flex: 1, paddingHorizontal: 24, paddingTop: 58, paddingBottom: 30, justifyContent: 'space-between' },
  onboardingShell: { flex: 1 },
  entryRedirecting: { flex: 1 },
  entryRecovery: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  entryRecoveryTitle: { fontFamily: 'Inter_700Bold', fontSize: 26, lineHeight: 32, textAlign: 'center', marginTop: 22 },
  entryRecoveryBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 310, marginTop: 10 },
  entryRecoveryButton: { minHeight: 54, width: '100%', borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 28 },
  entryRecoveryButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
   questionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, paddingLeft: 10, paddingRight: 18 },
  brandMark: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandWordmark: { flex: 1, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 2.5, marginHorizontal: 14 },
  trademark: { fontFamily: 'Inter_700Bold', fontSize: 8, lineHeight: 10, position: 'relative', top: -3 },
   languageRow: { flexDirection: 'row', gap: 8, transform: [{ translateX: -6 }, { translateY: -4 }] },
  languageOption: { width: 20, alignItems: 'center', gap: 2 },
  language: { fontFamily: 'Inter_700Bold', fontSize: 10, lineHeight: 12 },
  languageFlagImage: { width: 20, height: 12, borderRadius: 2, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.16)' },
  onboardingBlob: { position: 'absolute', borderRadius: 999 },
  onboardingBlobBlue: { width: 420, height: 300, top: 72, right: -140 },
  onboardingBlobPurple: { width: 360, height: 520, top: 190, left: -150 },
  onboardingBlobCyan: { width: 300, height: 360, bottom: -70, right: -90 },
  questionBody: { flex: 1, minHeight: 0, marginTop: 10 },
  questionScrollContent: { paddingTop: 2, paddingBottom: 12 },
  coachQuestionVisual: { width: '100%', height: 282, alignSelf: 'center', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 8 },
  answerAnalysisStatus: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 3, paddingHorizontal: 8 },
  answerAnalysisBox: { width: 42, height: 34, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  answerAnalysisPacket: { position: 'absolute', left: 5, width: 13, height: 3, borderRadius: 3 },
  answerAnalysisPacketTop: { top: 7 },
  answerAnalysisPacketMiddle: { top: 15 },
  answerAnalysisPacketBottom: { top: 23 },
  answerAnalysisLabel: { maxWidth: 220, flexShrink: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12.5, lineHeight: 17 },
  profileEditInfoBar: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 13, padding: 11, marginTop: 10 },
  profileEditInfoText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 17 },
  coachPhotoStage: { width: 238, height: 238, alignItems: 'center', justifyContent: 'center' },
  coachSmall: { width: 238, height: 238 },
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
  questionHint: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginBottom: 16, maxWidth: 300 },
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
  choiceList: { gap: 10 },
  choice: { minHeight: 59, padding: 10, borderWidth: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 11 },
  choiceIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  choiceText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  gymLevels: { gap: 8, marginTop: 16 },
  subLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginBottom: 1 },
  textInput: { height: 58, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, fontFamily: 'Inter_500Medium', fontSize: 15 },
  rulerCard: { borderRadius: 24, borderWidth: 1, padding: 18 },
  rulerValue: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 7, marginBottom: 23 },
  rulerNumber: { fontFamily: 'Inter_700Bold', fontSize: 52, letterSpacing: -2 },
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
  unitToggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 15, padding: 3, gap: 3 },
  unitOption: { flex: 1, minHeight: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  unitOptionText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  measurementInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  measurementInput: { minWidth: 118, height: 48, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 18 },
  measurementSmallInput: { minWidth: 78 },
  measurementInputUnit: { fontFamily: 'Inter_700Bold', fontSize: 14, marginLeft: -3 },
  weightCard: { borderRadius: 24, borderWidth: 1, minHeight: 94, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  targetWeightSection: { gap: 12 },
  targetUnitToggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 15, padding: 3, gap: 3 },
  targetUnitOption: { flex: 1, minHeight: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recommendedTarget: { borderRadius: 15, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  recommendedTargetText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12 },
  recommendedTargetValue: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  stepButton: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  weightValue: { flex: 1, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  weightNumberInput: { width: 106, height: 56, padding: 0, textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false, fontFamily: 'Inter_700Bold', fontSize: 42, lineHeight: 50, letterSpacing: -2 },
  birthCard: { width: '100%', alignSelf: 'center', borderRadius: 24, borderWidth: 1, paddingVertical: 17, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dateColumn: { width: 78, alignItems: 'center', gap: 5 },
  dateLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  dateValue: { width: 70, height: 48, borderRadius: 15, padding: 0, textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false },
  dateNumber: { fontFamily: 'Inter_700Bold', fontSize: 19, lineHeight: 24, textAlign: 'center' },
  dateSlash: { width: 18, fontFamily: 'Inter_700Bold', fontSize: 22, lineHeight: 26, textAlign: 'center' },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  dayButton: { width: 82, height: 52, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  error: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 12 },
  buttonArea: { gap: 13 },
  nextButton: { minHeight: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5 },
  nextText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  skip: { textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 12 },
  welcomeAmbientGlow: { position: 'absolute', left: -60, right: -60, top: 140, height: 430, borderRadius: 220 },
  welcomeBackdropDecorations: { pointerEvents: 'none' },
   welcomeHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 0, paddingLeft: 0, paddingRight: 0, zIndex: 3 },
   welcomeLogoDock: { transform: [{ translateX: -8 }, { translateY: -6 }] },
   welcomeLanguageDock: { transform: [{ translateY: -6 }, { translateX: 8 }] },
  welcomeBrand: { fontFamily: 'Inter_700Bold', fontSize: 25, letterSpacing: -1.2 },
   welcomeLanguagePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.46)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.76)' },
  welcomeLanguageOption: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  welcomeLanguageSelected: { backgroundColor: 'rgba(255,255,255,0.88)', shadowColor: '#2E63E6', shadowOpacity: 0.12, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
   welcomeReferenceCard: { flex: 1, marginHorizontal: 25, marginTop: 38, marginBottom: 12, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.82)', backgroundColor: 'rgba(255,255,255,0.39)', overflow: 'hidden', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 22, shadowColor: '#2558D9', shadowOpacity: 0.12, shadowRadius: 26, shadowOffset: { width: 0, height: 12 }, elevation: 6 },
  welcomeCardGlow: { position: 'absolute', width: 260, height: 260, top: 30, borderRadius: 130, alignSelf: 'center' },
   welcomeCharacterStage: { width: 260, height: 260, marginTop: 18, borderRadius: 130, overflow: 'hidden', alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
   welcomeReferenceCharacter: { width: '100%', height: '100%', transform: [{ scale: 1.1 }] },
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
  introBottom: { gap: 18 },
  dots: { flexDirection: 'row', gap: 7, justifyContent: 'center' },
  dot: { width: 28, height: 4, borderRadius: 5 },
  offerGradient: { flex: 1 },
  offerScrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  offerScreen: { paddingHorizontal: 20 },
  offerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  offerProPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 7 },
  offerProText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.1 },
  offerHero: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  offerOrb: { alignSelf: 'center', width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  offerEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.6, marginTop: 14, marginBottom: 7 },
  offerTitle: { width: '100%', textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 35, lineHeight: 40, letterSpacing: -1.2 },
  offerBody: { width: '100%', textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 9, maxWidth: 330 },
  offerValueCard: { width: '100%', borderWidth: 1, borderRadius: 23, padding: 16, gap: 13 },
  offerReason: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  offerBenefits: { gap: 12 },
  offerBenefit: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  offerBenefitIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  offerBenefitText: { flex: 1, minWidth: 0, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17 },
  offerPlanChoices: { width: '100%', flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 10 },
  offerPlanOption: { flex: 1, minWidth: 0, minHeight: 104, borderWidth: 1, borderRadius: 17, padding: 14, overflow: 'hidden' },
  offerPlanHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  offerPlanLabel: { flex: 1, minWidth: 0, flexShrink: 1, fontFamily: 'Inter_700Bold', fontSize: 11 },
  offerPlanPrice: { fontFamily: 'Inter_700Bold', fontSize: 19, marginTop: 13 },
  offerPlanUnit: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 3 },
  offerRecommendedBadge: { alignSelf: 'flex-start', maxWidth: '100%', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, marginBottom: 8 },
  offerRecommendedText: { fontFamily: 'Inter_700Bold', fontSize: 9, lineHeight: 12 },
  offerAnnualPriceFooter: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', columnGap: 5, rowGap: 3 },
  offerMonthlyEquivalent: { flexGrow: 1, flexShrink: 1, textAlign: 'right', fontFamily: 'Inter_600SemiBold', fontSize: 10, lineHeight: 14, marginTop: 3 },
  offerTrialBadge: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 5, maxWidth: 88 },
  offerTrialIcon: { width: 16, height: 16, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  offerTrialBadgeText: { flexShrink: 1, fontFamily: 'Inter_700Bold', fontSize: 8, lineHeight: 10, letterSpacing: 0.45, textAlign: 'center', textTransform: 'uppercase' },
  offerSavingsBadge: { flexShrink: 0, alignItems: 'flex-end', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 3 },
  offerSavingsValue: { fontFamily: 'Inter_700Bold', fontSize: 14, lineHeight: 16, letterSpacing: -0.2 },
  offerSavingsLabel: { fontFamily: 'Inter_700Bold', fontSize: 7, lineHeight: 9, letterSpacing: 0.3, textTransform: 'uppercase' },
  features: { gap: 17, paddingVertical: 20 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  featureText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14 },
  offerActionError: { textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16, marginBottom: 10 },
  offerPromoSection: { width: '100%', marginTop: 2, marginBottom: 8 },
  offerPromoToggle: { minHeight: 32, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 10 },
  offerPromoToggleText: { fontFamily: 'Inter_500Medium', fontSize: 11, textDecorationLine: 'underline' },
  offerPromoForm: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  offerPromoInput: { flex: 1, minWidth: 0, height: 42, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontFamily: 'Inter_500Medium', fontSize: 13 },
  offerPromoApply: { minHeight: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13 },
  offerPromoApplyText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  offerPromoError: { textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 14, marginTop: 6 },
  premiumRestoreButton: { alignItems: 'center', justifyContent: 'center', minHeight: 36 },
  premiumRestoreText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
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