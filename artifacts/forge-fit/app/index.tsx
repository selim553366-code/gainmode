import React from 'react';
import { Animated, Easing, Image, PanResponder, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
import { ForgeFitMark, triggerHaptic } from '@/components/FitUI';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { SUBSCRIPTION_PURCHASE_ENABLED, useSubscription } from '@/lib/revenuecat';

type CoachMotionVariant = 'wave' | 'write' | 'done';
type MeasurementUnit = 'metric' | 'imperial';
type TargetWeightUnit = 'kg' | 'lb';

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

function CoachMotion({ variant, large = false }: { variant: CoachMotionVariant; large?: boolean }) {
  const source = variant === 'wave'
    ? require('@/assets/images/coach-wave-direct.jpg')
    : variant === 'write'
      ? require('@/assets/images/coach-writing-no-bg.png')
      : require('@/assets/images/coach-thumbs-up-no-bg.png');
  return <Image source={source} resizeMode="contain" style={[large ? styles.coachLarge : styles.coachSmall, !large && variant === 'wave' ? styles.coachWaveQuestion : null]} />;
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

function BirthDatePicker({ day, month, year, dayText, monthText, yearText, labels, onChange, onTextChange }: { day: number; month: number; year: number; dayText: string; monthText: string; yearText: string; labels: { day: string; month: string; year: string }; onChange: (day: number, month: number, year: number) => void; onTextChange: (field: 'day' | 'month' | 'year', value: string) => void }) {
  const colors = useColors();
  const currentYear = new Date().getFullYear();
  const adjust = (field: 'day' | 'month' | 'year', amount: number) => {
    const nextDay = field === 'day' ? Math.max(1, Math.min(31, day + amount)) : day;
    const nextMonth = field === 'month' ? Math.max(1, Math.min(12, month + amount)) : month;
    const nextYear = field === 'year' ? Math.max(currentYear - 90, Math.min(currentYear - 13, year + amount)) : year;
    onChange(nextDay, nextMonth, nextYear);
  };
  const column = (label: string, value: number, valueText: string, field: 'day' | 'month' | 'year') => <View style={styles.dateColumn}>
    <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>{label}</Text>
    <Pressable onPress={() => adjust(field, 1)}><Ionicons name="chevron-up" size={18} color={colors.primary} /></Pressable>
    <TextInput value={valueText} onChangeText={(text) => onTextChange(field, text)} keyboardType="number-pad" maxLength={field === 'year' ? 4 : 2} selectTextOnFocus style={[styles.dateValue, styles.dateNumber, { backgroundColor: colors.secondary, color: colors.foreground }]} />
    <Pressable onPress={() => adjust(field, -1)}><Ionicons name="chevron-down" size={18} color={colors.primary} /></Pressable>
  </View>;
  return <View style={[styles.birthCard, { backgroundColor: colors.card, borderColor: colors.border }]}>{column(labels.day, day, dayText, 'day')}<Text style={[styles.dateSlash, { color: colors.mutedForeground }]}>/</Text>{column(labels.month, month, monthText, 'month')}<Text style={[styles.dateSlash, { color: colors.mutedForeground }]}>/</Text>{column(labels.year, year, yearText, 'year')}</View>;
}

function getAge(day: number, month: number, year: number) {
  const today = new Date();
  let age = today.getFullYear() - year;
  const beforeBirthday = today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

export default function EntryScreen() {
  const { onboardingComplete, introSeen, isPremium, setIntroSeen } = useFit();
  React.useEffect(() => {
     if (onboardingComplete && introSeen && (isPremium || !SUBSCRIPTION_PURCHASE_ENABLED)) router.replace('/(tabs)');
  }, [onboardingComplete, introSeen, isPremium]);
  if (!onboardingComplete) return <OnboardingQuestions />;
  if (!introSeen) return <IntroScreen onDone={setIntroSeen} />;
   if (!isPremium) return SUBSCRIPTION_PURCHASE_ENABLED ? <PremiumWelcomeOfferScreen onUnlock={() => router.replace('/(tabs)')} onSkip={() => router.replace('/(tabs)')} /> : null;
  return null;
}

function OnboardingQuestions() {
  const colors = useColors();
  const { language, setLanguage, completeOnboarding } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [started, setStarted] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [equipment, setEquipment] = React.useState<Equipment>('bodyweight');
  const [gymLevel, setGymLevel] = React.useState<GymLevel>('full');
  const [goal, setGoal] = React.useState<FitnessGoal>('maintain');
  const [measurementUnit, setMeasurementUnit] = React.useState<MeasurementUnit>('metric');
  const [height, setHeight] = React.useState(170);
  const [weight, setWeight] = React.useState(70);
  const [heightText, setHeightText] = React.useState('170');
  const [heightFeetText, setHeightFeetText] = React.useState('5');
  const [heightInchesText, setHeightInchesText] = React.useState('7');
  const [weightText, setWeightText] = React.useState('70.0');
  const [birthDay, setBirthDay] = React.useState(1);
  const [birthMonth, setBirthMonth] = React.useState(1);
  const [birthYear, setBirthYear] = React.useState(new Date().getFullYear() - 25);
  const [birthDayText, setBirthDayText] = React.useState('01');
  const [birthMonthText, setBirthMonthText] = React.useState('01');
  const [birthYearText, setBirthYearText] = React.useState(String(new Date().getFullYear() - 25));
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
  const [targetWeight, setTargetWeight] = React.useState<number | null>(null);
  const [targetWeightText, setTargetWeightText] = React.useState('');
  const [buildingPlan, setBuildingPlan] = React.useState(false);
  const [taken, setTaken] = React.useState<string[]>([]);
  const [error, setError] = React.useState('');
  const slide = React.useRef(new Animated.Value(1)).current;
  const targetStep = 15;
  const hasTargetWeightStep = goal === 'weightGain' || goal === 'weightLoss';
  const total = hasTargetWeightStep ? 16 : 15;
  const currentAge = getAge(birthDay, birthMonth, birthYear);
  const recommendedTargetWeight = React.useMemo(() => recommendTargetWeight({ height, weight, age: currentAge, goal, sex, activity, goalRate }), [height, weight, currentAge, goal, sex, activity, goalRate]);

  React.useEffect(() => {
    if (!hasTargetWeightStep || step !== targetStep || targetWeight !== null) return;
    setTargetWeight(recommendedTargetWeight);
    setTargetWeightText(targetWeightUnit === 'kg' ? recommendedTargetWeight.toFixed(1) : (recommendedTargetWeight / KG_PER_POUND).toFixed(1));
  }, [hasTargetWeightStep, step, targetWeight, recommendedTargetWeight, targetWeightUnit]);

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
  const updateBirth = (day: number, month: number, year: number) => {
    setBirthDay(day);
    setBirthMonth(month);
    setBirthYear(year);
    setBirthDayText(String(day).padStart(2, '0'));
    setBirthMonthText(String(month).padStart(2, '0'));
    setBirthYearText(String(year));
  };
  const updateBirthText = (field: 'day' | 'month' | 'year', text: string) => {
    if (field === 'day') setBirthDayText(text);
    if (field === 'month') setBirthMonthText(text);
    if (field === 'year') setBirthYearText(text);
    const parsed = Number(text);
    if (!Number.isInteger(parsed)) return;
    if (field === 'day' && parsed >= 1 && parsed <= 31) setBirthDay(parsed);
    if (field === 'month' && parsed >= 1 && parsed <= 12) setBirthMonth(parsed);
    if (field === 'year' && parsed >= new Date().getFullYear() - 90 && parsed <= new Date().getFullYear()) setBirthYear(parsed);
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
      gymLevel: equipment === 'gym' ? gymLevel : undefined,
      height,
      weight,
      age: currentAge,
      birthDate: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
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
      targetWeight: hasTargetWeightStep ? (targetWeight ?? recommendedTargetWeight) : weight,
    };
    completeOnboarding(profile, cleanUsername);
    AsyncStorage.setItem('forge-fit-usernames', JSON.stringify([...taken, cleanUsername])).catch(() => undefined);
  };
  const next = () => {
    setError('');
    if (step === 0) {
      const clean = username.trim().replace(/\s+/g, '').toLowerCase();
      if (!clean) return setError(t('usernameRequired'));
      if (taken.includes(clean)) return setError(t('usernameTaken'));
    }
    if (step === 1 && equipment === 'gym' && !gymLevel) return setError(t('gymLevelQuestion'));
    if (step === 2) {
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
    if (step === 3) {
      const parsed = Number(weightText.replace(',', '.'));
      const kg = measurementUnit === 'metric' ? parsed : parsed * KG_PER_POUND;
      if (!Number.isFinite(parsed) || kg < 35 || kg > 200) return setError(t('weightRangeError'));
      updateWeightFromKg(kg);
    }
    if (step === 4) {
      const day = Number(birthDayText);
      const month = Number(birthMonthText);
      const year = Number(birthYearText);
      const date = new Date(year, month - 1, day);
      if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return setError(t('birthDateError'));
      if (getAge(day, month, year) < 13) return setError(t('ageQuestion'));
      updateBirth(day, month, year);
    }
    if (step === targetStep && hasTargetWeightStep) {
      const parsed = Number(targetWeightText.replace(',', '.'));
      const valueKg = targetWeightUnit === 'kg' ? parsed : parsed * KG_PER_POUND;
      if (!Number.isFinite(parsed) || valueKg < 35 || valueKg > 200) return setError(t('weightRangeError'));
      if ((goal === 'weightGain' && valueKg <= weight) || (goal === 'weightLoss' && valueKg >= weight)) return setError(t('targetWeightDirectionError'));
      updateTargetWeightFromKg(valueKg);
    }
    if (step === total - 1) return advance();
    advance();
  };
  const goBack = () => {
    if (step === 0) return;
    Animated.sequence([Animated.timing(slide, { toValue: 0, duration: 120, useNativeDriver: true }), Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true })]).start();
    setStep((current) => Math.max(0, current - 1));
  };
  const skip = () => {
    setError('');
    if (step === total - 1) return advance();
    advance();
  };
  const swipeResponder = React.useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
    onPanResponderRelease: (_, gesture) => {
      if (step >= 2 && step <= 4 || step === targetStep) return;
      if (gesture.dx < -55) next();
      if (gesture.dx > 55) goBack();
    },
  }), [language, step, username, equipment, gymLevel, currentAge, taken, measurementUnit, heightText, heightFeetText, heightInchesText, weightText, birthDayText, birthMonthText, birthYearText, targetWeightText, targetWeightUnit, hasTargetWeightStep, goal]);
  const titleKeys = ['nameFirstQuestion', 'equipmentQuestion', 'heightQuestion', 'weightQuestion', 'birthDateQuestion', 'goalQuestion', 'sexQuestion', 'activityQuestion', 'trainingDaysQuestion', 'durationQuestion', 'speedQuestion', 'dietQuestion', 'proteinQuestion', 'experienceQuestion', 'preferredDaysQuestion'] as const;
  const selectedDays = (day: string) => setPreferredDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
  const renderBody = () => {
    if (step === 0) return <><Text style={[styles.questionHint, { color: colors.mutedForeground }]}>{t('nameFirstHint')}</Text><TextInput autoFocus autoCapitalize="none" value={username} onChangeText={setUsername} placeholder={t('usernamePlaceholder')} placeholderTextColor={colors.mutedForeground} style={[styles.textInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /></>;
    if (step === 1) return <><View style={styles.choiceList}><ChoiceButton label={t('bodyweight')} selected={equipment === 'bodyweight'} onPress={() => setEquipment('bodyweight')} icon="body-outline" /><ChoiceButton label={t('homeEquipment')} selected={equipment === 'home'} onPress={() => setEquipment('home')} icon="home-outline" /><ChoiceButton label={t('gymEquipment')} selected={equipment === 'gym'} onPress={() => setEquipment('gym')} icon="barbell-outline" /></View>{equipment === 'gym' ? <View style={styles.gymLevels}><Text style={[styles.subLabel, { color: colors.mutedForeground }]}>{t('gymLevelQuestion')}</Text><ChoiceButton label={t('gymBasic')} selected={gymLevel === 'basic'} onPress={() => setGymLevel('basic')} /><ChoiceButton label={t('gymIntermediate')} selected={gymLevel === 'intermediate'} onPress={() => setGymLevel('intermediate')} /><ChoiceButton label={t('gymFull')} selected={gymLevel === 'full'} onPress={() => setGymLevel('full')} /></View> : null}</>;
     if (step === 2) return <View style={styles.measurementSection}>
       <UnitToggle unit={measurementUnit} onChange={changeMeasurementUnit} metricLabel={t('measurementMetric')} imperialLabel={t('measurementImperial')} />
       <RulerPicker value={height} min={130} max={220} onChange={updateHeightFromCm} valueLabel={measurementUnit === 'metric' ? `${height} cm` : formatImperialHeightLabel(height)} minLabel={measurementUnit === 'metric' ? '130 cm' : formatImperialHeightLabel(130)} maxLabel={measurementUnit === 'metric' ? '220 cm' : formatImperialHeightLabel(220)} />
       {measurementUnit === 'metric' ? <View style={styles.measurementInputRow}><TextInput value={heightText} onChangeText={updateMetricHeightText} keyboardType="number-pad" selectTextOnFocus style={[styles.measurementInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /><Text style={[styles.measurementInputUnit, { color: colors.primary }]}>cm</Text></View> : <View style={styles.measurementInputRow}><TextInput value={heightFeetText} onChangeText={(text) => updateImperialHeightText('feet', text)} keyboardType="number-pad" selectTextOnFocus style={[styles.measurementInput, styles.measurementSmallInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /><Text style={[styles.measurementInputUnit, { color: colors.primary }]}>{t('heightFeet')}</Text><TextInput value={heightInchesText} onChangeText={(text) => updateImperialHeightText('inches', text)} keyboardType="number-pad" selectTextOnFocus style={[styles.measurementInput, styles.measurementSmallInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /><Text style={[styles.measurementInputUnit, { color: colors.primary }]}>{t('heightInches')}</Text></View>}
       <Text style={[styles.centerHint, { color: colors.mutedForeground }]}>{t('heightRulerHint')}</Text>
     </View>;
     if (step === 3) return <View style={styles.measurementSection}><UnitToggle unit={measurementUnit} onChange={changeMeasurementUnit} metricLabel={t('measurementMetric')} imperialLabel={t('measurementImperial')} /><WeightPicker value={weight} unit={measurementUnit} inputValue={weightText} onInputChange={updateWeightText} onChange={updateWeightFromKg} /><Text style={[styles.centerHint, { color: colors.mutedForeground }]}>{t('weightInputHint')}</Text></View>;
     if (step === 4) return <><BirthDatePicker day={birthDay} month={birthMonth} year={birthYear} dayText={birthDayText} monthText={birthMonthText} yearText={birthYearText} labels={{ day: t('day'), month: t('month'), year: t('year') }} onChange={updateBirth} onTextChange={updateBirthText} /><Text style={[styles.centerHint, { color: colors.mutedForeground }]}>{t('birthDateHint')} · {currentAge} {t('ageYears')}</Text></>;
     if (step === 5) return <View style={styles.choiceList}><ChoiceButton label={t('goalMuscle')} selected={goal === 'muscle'} onPress={() => { setGoal('muscle'); setTargetWeight(null); }} icon="trending-up-outline" /><ChoiceButton label={t('goalWeightGain')} selected={goal === 'weightGain'} onPress={() => { setGoal('weightGain'); setTargetWeight(null); }} icon="trending-up-outline" /><ChoiceButton label={t('goalWeightLoss')} selected={goal === 'weightLoss'} onPress={() => { setGoal('weightLoss'); setTargetWeight(null); }} icon="scale-outline" /><ChoiceButton label={t('goalFatLoss')} selected={goal === 'fatLoss'} onPress={() => { setGoal('fatLoss'); setTargetWeight(null); }} icon="flame-outline" /><ChoiceButton label={t('goalMaintain')} selected={goal === 'maintain'} onPress={() => { setGoal('maintain'); setTargetWeight(null); }} icon="pause-outline" /></View>;
    if (step === 6) return <View style={styles.choiceList}><ChoiceButton label={t('sexFemale')} selected={sex === 'female'} onPress={() => setSex('female')} /><ChoiceButton label={t('sexMale')} selected={sex === 'male'} onPress={() => setSex('male')} /><ChoiceButton label={t('sexPreferNot')} selected={sex === 'preferNot'} onPress={() => setSex('preferNot')} /></View>;
    if (step === 7) return <View style={styles.choiceList}><ChoiceButton label={t('activitySedentary')} selected={activity === 'sedentary'} onPress={() => setActivity('sedentary')} /><ChoiceButton label={t('activityLight')} selected={activity === 'light'} onPress={() => setActivity('light')} /><ChoiceButton label={t('activityModerate')} selected={activity === 'moderate'} onPress={() => setActivity('moderate')} /><ChoiceButton label={t('activityHigh')} selected={activity === 'high'} onPress={() => setActivity('high')} /></View>;
    if (step === 8) return <View style={styles.choiceList}>{[2, 3, 4, 5, 6].map((days) => <ChoiceButton key={days} label={`${days} ${t('dayUnit')}`} selected={trainingDays === days} onPress={() => setTrainingDays(days)} />)}</View>;
    if (step === 9) return <View style={styles.choiceList}><ChoiceButton label={t('durationShort')} selected={sessionDuration === 25} onPress={() => setSessionDuration(25)} /><ChoiceButton label={t('durationMedium')} selected={sessionDuration === 45} onPress={() => setSessionDuration(45)} /><ChoiceButton label={t('durationLong')} selected={sessionDuration === 60} onPress={() => setSessionDuration(60)} /></View>;
    if (step === 10) return <View style={styles.choiceList}><ChoiceButton label={t('speedSlow')} selected={goalRate === 'slow'} onPress={() => setGoalRate('slow')} /><ChoiceButton label={t('speedBalanced')} selected={goalRate === 'balanced'} onPress={() => setGoalRate('balanced')} /><ChoiceButton label={t('speedFast')} selected={goalRate === 'fast'} onPress={() => setGoalRate('fast')} /></View>;
    if (step === 11) return <View style={styles.choiceList}><ChoiceButton label={t('dietEverything')} selected={diet === 'everything'} onPress={() => setDiet('everything')} /><ChoiceButton label={t('dietVegetarian')} selected={diet === 'vegetarian'} onPress={() => setDiet('vegetarian')} /><ChoiceButton label={t('dietVegan')} selected={diet === 'vegan'} onPress={() => setDiet('vegan')} /><ChoiceButton label={t('dietHalal')} selected={diet === 'halal'} onPress={() => setDiet('halal')} /></View>;
    if (step === 12) return <View style={styles.choiceList}><ChoiceButton label={t('proteinBalanced')} selected={proteinPreference === 'balanced'} onPress={() => setProteinPreference('balanced')} /><ChoiceButton label={t('proteinHigh')} selected={proteinPreference === 'high'} onPress={() => setProteinPreference('high')} /><ChoiceButton label={t('proteinLower')} selected={proteinPreference === 'lower'} onPress={() => setProteinPreference('lower')} /></View>;
    if (step === 13) return <View style={styles.choiceList}><ChoiceButton label={t('experienceBeginner')} selected={experience === 'beginner'} onPress={() => setExperience('beginner')} /><ChoiceButton label={t('experienceIntermediate')} selected={experience === 'intermediate'} onPress={() => setExperience('intermediate')} /><ChoiceButton label={t('experienceAdvanced')} selected={experience === 'advanced'} onPress={() => setExperience('advanced')} /></View>;
     if (step === targetStep && hasTargetWeightStep) return <><GoalWeightPicker valueKg={targetWeight ?? recommendedTargetWeight} recommendedKg={recommendedTargetWeight} unit={targetWeightUnit} inputValue={targetWeightText} recommendedLabel={t('recommendedTarget')} onInputChange={updateTargetWeightText} onChange={updateTargetWeightFromKg} onUnitChange={changeTargetWeightUnit} /><Text style={[styles.centerHint, { color: colors.mutedForeground }]}>{t('targetWeightHint')}</Text></>;
    return <><View style={styles.dayGrid}>{['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => <Pressable key={day} onPress={() => selectedDays(day)} style={[styles.dayButton, { backgroundColor: preferredDays.includes(day) ? colors.primary : colors.card, borderColor: preferredDays.includes(day) ? colors.primary : colors.border }]}><Text style={[styles.dayText, { color: preferredDays.includes(day) ? colors.primaryForeground : colors.foreground }]}>{day}</Text></Pressable>)}</View><Text style={[styles.centerHint, { color: colors.mutedForeground }]}>{t('preferredDaysQuestion')}</Text></>;
  };

   if (!started) return <WelcomeScreen onStart={() => { slide.setValue(0); setStarted(true); Animated.timing(slide, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }} />;
   if (buildingPlan) return <PlanBuildingScreen onComplete={finish} />;
   if (step === total) return <CompletionScreen onContinue={() => setBuildingPlan(true)} />;
   const optional = step >= 6 && !hasTargetWeightStep;
   const isTargetStep = step === targetStep && hasTargetWeightStep;
   const titleKey: Parameters<typeof translate>[1] = isTargetStep ? 'targetWeightQuestion' : titleKeys[step] ?? 'preferredDaysQuestion';
   return <LinearGradient colors={[colors.background, '#0B2340', colors.background]} style={styles.full}>
     <View style={styles.questionTop}><ForgeFitMark size={38} /><View style={styles.languageRow}>{(Object.keys(languageLabels) as Language[]).map((item) => <Pressable key={item} onPress={() => setLanguage(item)}><Text style={[styles.language, { color: language === item ? colors.primary : colors.mutedForeground }]}>{item.toUpperCase()}</Text></Pressable>)}</View></View>
    <Animated.View {...swipeResponder.panHandlers} style={[styles.questionBody, { opacity: slide, transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
       <KeyboardAwareScrollViewCompat contentContainerStyle={styles.questionScrollContent} showsVerticalScrollIndicator={false} bounces={false} bottomOffset={72}>
        <View style={styles.coachQuestionVisual}><CoachMotion variant={step === 0 ? 'wave' : 'write'} /></View>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{step + 1} / {total}</Text>
        {optional ? <Text style={[styles.optionalLabel, { color: colors.primary }]}>{t('optionalLabel')}</Text> : null}
         <Text style={[styles.questionTitle, { color: colors.foreground }]}>{t(titleKey)}</Text>
        {renderBody()}
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
      </KeyboardAwareScrollViewCompat>
    </Animated.View>
      <View style={styles.buttonArea}><Pressable onPress={() => { triggerHaptic(); next(); }} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}><Text style={[styles.nextText, { color: colors.primaryForeground }]}>{step === total - 1 ? t('continueToPlan') : t('continue')}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable>{optional ? <Pressable onPress={() => { triggerHaptic(); skip(); }}><Text style={[styles.skip, { color: colors.mutedForeground }]}>{t('skipQuestion')}</Text></Pressable> : null}</View>
  </LinearGradient>;
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const colors = useColors();
  const { language, setLanguage } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
   const { width } = useWindowDimensions();
   const [leaving, setLeaving] = React.useState(false);
   const orbScale = React.useRef(new Animated.Value(0.78)).current;
   const orbRotation = React.useRef(new Animated.Value(0)).current;
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
   return <AnimatedLinearGradient colors={[colors.background, '#0B2340', colors.background]} style={[styles.full, { opacity: pageOpacity, transform: [{ translateX: pageTranslateX }] }]}>
      <View style={styles.questionTop}><ForgeFitMark size={38} /><View style={styles.languageRow}>{(Object.keys(languageLabels) as Language[]).map((item) => <Pressable key={item} onPress={() => setLanguage(item)}><Text style={[styles.language, { color: language === item ? colors.primary : colors.mutedForeground }]}>{item.toUpperCase()}</Text></Pressable>)}</View></View>
     <View style={styles.welcomeContent}><Animated.View style={[styles.welcomeOrb, { backgroundColor: `${colors.primary}18`, transform: [{ scale: orbScale }, { rotate: orbRotateValue }] }]}><Image source={require('@/assets/images/coach-welcome.png')} resizeMode="cover" style={styles.welcomeCoachImage} /></Animated.View><Animated.View style={{ opacity: copyOpacity, transform: [{ translateY: copyTranslateY }] }}><Text style={[styles.welcomeTitle, { color: colors.foreground }]}>{t('welcomeTitle')}</Text><Text style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}>{t('welcomeSubtitle')}</Text></Animated.View></View>
      <Animated.View style={{ opacity: buttonOpacity, transform: [{ translateY: buttonTranslateY }] }}><Pressable onPress={startAdventure} disabled={leaving} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}><Text style={[styles.nextText, { color: colors.primaryForeground }]}>{t('startAdventure')}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable></Animated.View>
   </AnimatedLinearGradient>;
}

function CompletionScreen({ onContinue }: { onContinue: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
   return <LinearGradient colors={[colors.background, '#0B2340', colors.background]} style={styles.full}><View style={styles.completionContent}><View style={[styles.completionCoach, { backgroundColor: `${colors.primary}18` }]}><CoachMotion variant="done" large /></View><Text style={[styles.welcomeTitle, { color: colors.foreground }]}>{t('finishQuestionsTitle')}</Text><Text style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}>{t('finishQuestionsBody')}</Text></View><Pressable onPress={() => { triggerHaptic(); onContinue(); }} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.98 : 1 }] }]}><Text style={[styles.nextText, { color: colors.primaryForeground }]}>{t('continueToPlan')}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable></LinearGradient>;
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
  return <LinearGradient colors={[colors.background, '#0B2340', colors.background]} style={styles.full}>
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
   return <LinearGradient colors={[colors.background, '#0B2340', colors.background]} style={styles.full}><View style={styles.introVisual}><View style={[styles.auraLarge, { backgroundColor: `${colors.primary}18` }]} /><Image source={require('@/assets/images/icon.png')} style={styles.introIcon} /></View><Animated.View style={{ opacity: appear, transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }}><Text style={[styles.eyebrow, { color: colors.primary }]}>1 / 1</Text><Text style={[styles.introTitle, { color: colors.foreground }]}>{t('onboardingTitle')}</Text><Text style={[styles.introText, { color: colors.mutedForeground }]}>{t('onboardingIntro')}</Text></Animated.View><View style={styles.introBottom}><Pressable onPress={() => { triggerHaptic(); onDone(); }} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.98 : 1 }] }]}><Text style={[styles.nextText, { color: colors.primaryForeground }]}>{t('continue')}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable></View></LinearGradient>;
}

function PremiumWelcomeOfferScreen({ onUnlock, onSkip }: { onUnlock: () => void; onSkip: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, isPremium } = useFit();
  const { monthlyPackage, isAvailable, isLoading, isPurchasing, isSubscribed, purchase } = useSubscription();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const price = monthlyPackage?.product.priceString;
  const benefits: Array<{ icon?: React.ComponentProps<typeof Ionicons>['name']; logo?: boolean; key: 'premiumWelcomeBenefit1' | 'premiumWelcomeBenefit2' | 'premiumWelcomeBenefit3' }> = [
    { logo: true, key: 'premiumWelcomeBenefit1' },
    { icon: 'restaurant-outline', key: 'premiumWelcomeBenefit2' },
    { icon: 'chatbubble-ellipses-outline', key: 'premiumWelcomeBenefit3' },
  ];
  const handlePurchase = async () => {
    if (!isAvailable || !monthlyPackage) {
      setActionError(t('premiumStoreUnavailable'));
      return;
    }
    setActionError(null);
    try {
      await purchase(monthlyPackage);
      onUnlock();
    } catch {
      setActionError(t('premiumPurchaseError'));
    }
  };
  return <LinearGradient colors={[colors.background, '#102E53', colors.background]} style={[styles.full, styles.offerScreen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 18 }]}>
     <View style={styles.offerHeader}>
       <ForgeFitMark size={38} />
       <View style={[styles.offerProPill, { backgroundColor: `${isSubscribed ?? isPremium ? colors.success : colors.primary}18`, borderColor: `${isSubscribed ?? isPremium ? colors.success : colors.primary}55` }]}>{isSubscribed ?? isPremium ? <Ionicons name="checkmark-circle" size={12} color={colors.success} /> : <ForgeFitMark size={18} />}<Text style={[styles.offerProText, { color: isSubscribed ?? isPremium ? colors.success : colors.primary }]}>{isSubscribed ?? isPremium ? t('premiumOwned') : t('premiumShort')}</Text></View>
    </View>
    <View style={styles.offerHero}>
       <View style={[styles.offerOrb, { backgroundColor: colors.primary }]}><ForgeFitMark size={74} /></View>
      <Text style={[styles.offerEyebrow, { color: colors.primary }]}>{t('premiumWelcomeEyebrow')}</Text>
      <Text style={[styles.offerTitle, { color: colors.foreground }]}>{t('premiumWelcomeTitle')}</Text>
      <Text style={[styles.offerBody, { color: colors.mutedForeground }]}>{t('premiumWelcomeBody')}</Text>
    </View>
    <View style={[styles.offerValueCard, { backgroundColor: `${colors.card}D9`, borderColor: colors.border }]}>
      <Text style={[styles.offerReason, { color: colors.foreground }]}>{t('premiumWelcomeReason')}</Text>
       <View style={styles.offerBenefits}>{benefits.map((benefit) => <View key={benefit.key} style={styles.offerBenefit}><View style={[styles.offerBenefitIcon, { backgroundColor: `${colors.primary}18` }]}>{benefit.logo ? <ForgeFitMark size={25} /> : <Ionicons name={benefit.icon!} size={17} color={colors.primary} />}</View><Text style={[styles.offerBenefitText, { color: colors.foreground }]}>{t(benefit.key)}</Text></View>)}</View>
    </View>
    <View style={[styles.offerTrial, { backgroundColor: `${colors.success}18`, borderColor: `${colors.success}45` }]}><Ionicons name="gift-outline" size={17} color={colors.success} /><Text style={[styles.offerTrialText, { color: colors.success }]}>{t('premiumTrial')}</Text></View>
     {price ? <Text style={[styles.offerPrice, { color: colors.foreground }]}>{price} {t('premiumPerMonth')}</Text> : null}
     {actionError ? <Text style={[styles.offerActionError, { color: colors.destructive }]}>{actionError}</Text> : null}
     <Pressable accessibilityRole="button" accessibilityLabel={t('premiumWelcomeCta')} disabled={isLoading || isPurchasing} onPress={() => { triggerHaptic(); handlePurchase(); }} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, opacity: pressed || isLoading || isPurchasing ? 0.58 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}><Text style={[styles.nextText, { color: colors.primaryForeground }]}>{isLoading || isPurchasing ? t('premiumLoading') : t('premiumWelcomeCta')}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={t('premiumWelcomeSkip')} onPress={() => { triggerHaptic(); onSkip(); }}><Text style={[styles.skip, { color: colors.mutedForeground }]}>{t('premiumWelcomeSkip')}</Text></Pressable>
  </LinearGradient>;
}

function OfferScreen({ onUnlock, onSkip }: { onUnlock: () => void; onSkip: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  return <LinearGradient colors={[colors.background, '#102E53', colors.background]} style={styles.full}><View style={[styles.offerOrb, { backgroundColor: colors.primary }]}><ForgeFitMark size={74} /></View><Text style={[styles.offerTitle, { color: colors.foreground }]}>{t('premiumTitle')}</Text><Text style={[styles.introText, { color: colors.mutedForeground }]}>{t('premiumSubtitle')}</Text><View style={styles.features}>{(['premiumFeature1', 'premiumFeature2', 'premiumFeature3'] as const).map((key) => <View key={key} style={styles.feature}><Ionicons name="checkmark-circle" size={20} color={colors.primary} /><Text style={[styles.featureText, { color: colors.foreground }]}>{t(key)}</Text></View>)}</View><View style={[styles.offerTrial, { backgroundColor: `${colors.success}18`, borderColor: `${colors.success}45` }]}><Ionicons name="gift-outline" size={17} color={colors.success} /><Text style={[styles.offerTrialText, { color: colors.success }]}>{t('premiumTrial')}</Text></View><Pressable onPress={() => { triggerHaptic(); onUnlock(); }} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.98 : 1 }] }]}><Text style={[styles.nextText, { color: colors.primaryForeground }]}>{t('unlockPremium')}</Text></Pressable><Pressable onPress={() => { triggerHaptic(); onSkip(); }}><Text style={[styles.skip, { color: colors.mutedForeground }]}>{t('cancel')}</Text></Pressable></LinearGradient>;
}

const styles = StyleSheet.create({
  full: { flex: 1, paddingHorizontal: 24, paddingTop: 58, paddingBottom: 30, justifyContent: 'space-between' },
  questionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandMark: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  languageRow: { flexDirection: 'row', gap: 11 },
  language: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  questionBody: { flex: 1, minHeight: 0, marginTop: 10 },
  questionScrollContent: { paddingTop: 2, paddingBottom: 12 },
  coachQuestionVisual: { width: 238, height: 238, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  coachSmall: { width: 238, height: 238 },
  coachWaveQuestion: { transform: [{ translateX: 7 }] },
  coachLarge: { width: 220, height: 220 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5, marginBottom: 9 },
  optionalLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  questionTitle: { fontFamily: 'Inter_700Bold', fontSize: 29, lineHeight: 35, letterSpacing: -1, marginBottom: 20 },
  questionHint: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginBottom: 16, maxWidth: 300 },
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
  weightCard: { borderRadius: 24, borderWidth: 1, padding: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  targetWeightSection: { gap: 12 },
  targetUnitToggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 15, padding: 3, gap: 3 },
  targetUnitOption: { flex: 1, minHeight: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recommendedTarget: { borderRadius: 15, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  recommendedTargetText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12 },
  recommendedTargetValue: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  stepButton: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  weightValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weightNumberInput: { minWidth: 106, padding: 0, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 42, letterSpacing: -2 },
  birthCard: { borderRadius: 24, borderWidth: 1, paddingVertical: 17, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  dateColumn: { alignItems: 'center', gap: 5, minWidth: 70 },
  dateLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  dateValue: { minWidth: 62, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dateNumber: { fontFamily: 'Inter_700Bold', fontSize: 19, textAlign: 'center' },
  dateSlash: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  dayButton: { width: 82, height: 52, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  error: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 12 },
  buttonArea: { gap: 13 },
  nextButton: { minHeight: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  nextText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  skip: { textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 12 },
  welcomeContent: { alignItems: 'center', justifyContent: 'center', flex: 1 },
   welcomeOrb: { width: 245, height: 245, borderRadius: 122, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 22 },
   welcomeCoachImage: { width: 245, height: 245 },
  welcomeTitle: { textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 33, lineHeight: 38, letterSpacing: -1.2 },
  welcomeSubtitle: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 310 },
  completionContent: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  completionCoach: { width: 245, height: 245, borderRadius: 122, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
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
  introVisual: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  auraLarge: { position: 'absolute', width: 220, height: 220, borderRadius: 110 },
  introIcon: { width: 150, height: 150, borderRadius: 50 },
  introTitle: { fontFamily: 'Inter_700Bold', fontSize: 34, lineHeight: 39, letterSpacing: -1.2 },
  introText: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 23, marginTop: 12 },
  introBottom: { gap: 18 },
  dots: { flexDirection: 'row', gap: 7, justifyContent: 'center' },
  dot: { width: 28, height: 4, borderRadius: 5 },
  offerScreen: { paddingHorizontal: 20 },
  offerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offerProPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 7 },
  offerProText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.1 },
  offerHero: { alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 205 },
  offerOrb: { alignSelf: 'center', width: 74, height: 74, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  offerEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.6, marginTop: 20, marginBottom: 8 },
  offerTitle: { textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 39, lineHeight: 43, letterSpacing: -1.5 },
  offerBody: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 11, maxWidth: 330 },
  offerValueCard: { width: '100%', borderWidth: 1, borderRadius: 23, padding: 16, gap: 13 },
  offerReason: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  offerBenefits: { gap: 12 },
  offerBenefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  offerBenefitIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  offerBenefitText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17 },
  features: { gap: 17, paddingVertical: 20 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  featureText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14 },
  offerTrial: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14 },
  offerTrialText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  offerPrice: { alignSelf: 'center', fontFamily: 'Inter_700Bold', fontSize: 13, marginBottom: 10 },
  offerActionError: { textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16, marginBottom: 10 },
});