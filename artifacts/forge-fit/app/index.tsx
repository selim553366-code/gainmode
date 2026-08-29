import React from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFit, Equipment, FitnessGoal, Profile } from '@/context/FitContext';
import { languageLabels, Language, translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';

const slides = ['onboardingIntro', 'onboardingIntro2', 'onboardingIntro3'] as const;

export default function EntryScreen() {
  const colors = useColors();
  const { language, onboardingComplete, introSeen, isPremium, setIntroSeen, setPremium } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [introStep, setIntroStep] = React.useState(0);

  React.useEffect(() => {
    if (onboardingComplete && introSeen && isPremium) router.replace('/(tabs)');
  }, [onboardingComplete, introSeen, isPremium]);

  if (!onboardingComplete) return <OnboardingQuestions />;
  if (!introSeen) {
    return <IntroScreen step={introStep} setStep={setIntroStep} onDone={setIntroSeen} />;
  }
  if (!isPremium) return <OfferScreen onUnlock={() => { setPremium(true); router.replace('/(tabs)'); }} onSkip={() => router.replace('/(tabs)')} />;
  return null;
}

function OnboardingQuestions() {
  const colors = useColors();
  const { language, setLanguage, completeOnboarding } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [step, setStep] = React.useState(0);
  const [equipment, setEquipment] = React.useState<Equipment>('bodyweight');
  const [goal, setGoal] = React.useState<FitnessGoal>('maintain');
  const [height, setHeight] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [age, setAge] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [taken, setTaken] = React.useState<string[]>([]);
  const [error, setError] = React.useState('');
  const slide = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    AsyncStorage.getItem('forge-fit-usernames').then((value) => setTaken(value ? JSON.parse(value) as string[] : [])).catch(() => undefined);
  }, []);

  const next = () => {
    setError('');
    if (step === 1 && (!Number(height) || Number(height) < 100)) return setError(t('heightQuestion'));
    if (step === 2 && (!Number(weight) || Number(weight) < 25)) return setError(t('weightQuestion'));
    if (step === 3 && (!Number(age) || Number(age) < 13)) return setError(t('ageQuestion'));
    if (step < 4) {
      Animated.sequence([Animated.timing(slide, { toValue: 0, duration: 120, useNativeDriver: true }), Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true })]).start();
      setStep((current) => current + 1);
      return;
    }
    const cleanUsername = username.trim().replace(/\s+/g, '').toLowerCase();
    if (!cleanUsername) return setError(t('usernameRequired'));
    if (taken.includes(cleanUsername)) return setError(t('usernameTaken'));
    const profile: Profile = { equipment, goal, height: Number(height), weight: Number(weight), age: Number(age) };
    completeOnboarding(profile, cleanUsername);
    AsyncStorage.setItem('forge-fit-usernames', JSON.stringify([...taken, cleanUsername])).catch(() => undefined);
  };

  const options: { value: string; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] =
    step === 0
      ? [{ value: 'bodyweight', label: t('bodyweight'), icon: 'body-outline' }, { value: 'home', label: t('homeEquipment'), icon: 'home-outline' }, { value: 'gym', label: t('gymEquipment'), icon: 'barbell-outline' }]
      : [{ value: 'muscle', label: t('goalMuscle'), icon: 'trending-up-outline' }, { value: 'weightLoss', label: t('goalWeightLoss'), icon: 'scale-outline' }, { value: 'fatLoss', label: t('goalFatLoss'), icon: 'flame-outline' }, { value: 'maintain', label: t('goalMaintain'), icon: 'pause-outline' }];

  return <LinearGradient colors={[colors.background, '#0B2340', colors.background]} style={styles.full}>
    <View style={styles.questionTop}>
      <View style={[styles.brandMark, { backgroundColor: colors.primary }]}><Ionicons name="sparkles" size={18} color={colors.primaryForeground} /></View>
      <View style={styles.languageRow}>{(Object.keys(languageLabels) as Language[]).map((item) => <Pressable key={item} onPress={() => setLanguage(item)}><Text style={[styles.language, { color: language === item ? colors.primary : colors.mutedForeground }]}>{item.toUpperCase()}</Text></Pressable>)}</View>
    </View>
    <Animated.View style={[styles.questionBody, { opacity: slide, transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>{step + 1} / 5</Text>
      <Text style={[styles.questionTitle, { color: colors.foreground }]}>{t(step === 0 ? 'equipmentQuestion' : step === 1 ? 'heightQuestion' : step === 2 ? 'weightQuestion' : step === 3 ? 'ageQuestion' : 'goalQuestion')}</Text>
      {step === 0 || step === 4 ? <View style={styles.options}>{options.map((option) => {
        const selected = (step === 0 ? equipment : goal) === option.value;
        return <Pressable key={option.value} onPress={() => step === 0 ? setEquipment(option.value as Equipment) : setGoal(option.value as FitnessGoal)} style={[styles.option, { backgroundColor: selected ? `${colors.primary}20` : colors.card, borderColor: selected ? colors.primary : colors.border }]}><View style={[styles.optionIcon, { backgroundColor: selected ? colors.primary : colors.secondary }]}><Ionicons name={option.icon} size={21} color={selected ? colors.primaryForeground : colors.foreground} /></View><Text style={[styles.optionText, { color: colors.foreground }]}>{option.label}</Text>{selected ? <Ionicons name="checkmark-circle" size={21} color={colors.primary} /> : null}</Pressable>;
      })}</View> : <TextInput autoFocus keyboardType="number-pad" value={step === 1 ? height : step === 2 ? weight : age} onChangeText={step === 1 ? setHeight : step === 2 ? setWeight : setAge} placeholder={step === 1 ? 'cm' : step === 2 ? 'kg' : 'years'} placeholderTextColor={colors.mutedForeground} style={[styles.numberInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />}
      {step === 4 ? <Text style={[styles.usernameLabel, { color: colors.mutedForeground }]}>{t('usernameQuestion')}</Text> : null}
      {step === 4 ? <TextInput autoCapitalize="none" value={username} onChangeText={setUsername} placeholder={t('usernamePlaceholder')} placeholderTextColor={colors.mutedForeground} style={[styles.textInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /> : null}
      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
    </Animated.View>
    <Pressable onPress={next} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}><Text style={[styles.nextText, { color: colors.primaryForeground }]}>{step === 4 ? t('finishSetup') : t('continue')}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable>
  </LinearGradient>;
}

function IntroScreen({ step, setStep, onDone }: { step: number; setStep: React.Dispatch<React.SetStateAction<number>>; onDone: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const appear = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    appear.setValue(0);
    Animated.parallel([
      Animated.timing(appear, { toValue: 1, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [appear, step]);
  const title = step === 0 ? t('onboardingTitle') : step === 1 ? t('premiumFeature1') : t('premiumFeature2');
  return <LinearGradient colors={[colors.background, '#0B2340', colors.background]} style={styles.full}>
    <View style={styles.introVisual}><View style={[styles.auraLarge, { backgroundColor: `${colors.primary}18` }]} /><Image source={require('@/assets/images/icon.png')} style={styles.introIcon} /></View>
    <Animated.View style={{ opacity: appear, transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }}><Text style={[styles.eyebrow, { color: colors.primary }]}>{step + 1} / 3</Text><Text style={[styles.introTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.introText, { color: colors.mutedForeground }]}>{t(slides[step])}</Text></Animated.View>
    <View style={styles.introBottom}><View style={styles.dots}>{slides.map((_, index) => <View key={index} style={[styles.dot, { backgroundColor: index === step ? colors.primary : colors.border }]} />)}</View><Pressable onPress={() => step === 2 ? onDone() : setStep((current) => current + 1)} style={[styles.nextButton, { backgroundColor: colors.primary }]}><Text style={[styles.nextText, { color: colors.primaryForeground }]}>{step === 2 ? t('continue') : t('begin')}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable></View>
  </LinearGradient>;
}

function OfferScreen({ onUnlock, onSkip }: { onUnlock: () => void; onSkip: () => void }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  return <LinearGradient colors={[colors.background, '#102E53', colors.background]} style={styles.full}>
    <View style={[styles.offerOrb, { backgroundColor: colors.primary }]}><Ionicons name="sparkles" size={30} color={colors.primaryForeground} /></View><Text style={[styles.offerTitle, { color: colors.foreground }]}>{t('premiumTitle')}</Text><Text style={[styles.introText, { color: colors.mutedForeground }]}>{t('premiumSubtitle')}</Text>
    <View style={styles.features}>{(['premiumFeature1', 'premiumFeature2', 'premiumFeature3'] as const).map((key) => <View key={key} style={styles.feature}><Ionicons name="checkmark-circle" size={20} color={colors.primary} /><Text style={[styles.featureText, { color: colors.foreground }]}>{t(key)}</Text></View>)}</View>
    <Pressable onPress={onUnlock} style={[styles.nextButton, { backgroundColor: colors.primary }]}><Text style={[styles.nextText, { color: colors.primaryForeground }]}>{t('unlockPremium')}</Text></Pressable><Pressable onPress={onSkip}><Text style={[styles.skip, { color: colors.mutedForeground }]}>{t('cancel')}</Text></Pressable>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  full: { flex: 1, paddingHorizontal: 24, paddingTop: 58, paddingBottom: 30, justifyContent: 'space-between' },
  questionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandMark: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  languageRow: { flexDirection: 'row', gap: 11 },
  language: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  questionBody: { marginTop: 30 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5, marginBottom: 10 },
  questionTitle: { fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 36, letterSpacing: -1, marginBottom: 25 },
  options: { gap: 11 },
  option: { minHeight: 70, padding: 12, borderWidth: 1, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  numberInput: { height: 64, borderWidth: 1, borderRadius: 20, paddingHorizontal: 20, fontFamily: 'Inter_700Bold', fontSize: 24 },
  usernameLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 22, marginBottom: 8 },
  textInput: { height: 56, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, fontFamily: 'Inter_500Medium', fontSize: 15 },
  error: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 12 },
  nextButton: { minHeight: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  nextText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  introVisual: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  auraLarge: { position: 'absolute', width: 220, height: 220, borderRadius: 110 },
  introIcon: { width: 150, height: 150, borderRadius: 50 },
  introTitle: { fontFamily: 'Inter_700Bold', fontSize: 34, lineHeight: 39, letterSpacing: -1.2 },
  introText: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 23, marginTop: 12 },
  introBottom: { gap: 18 },
  dots: { flexDirection: 'row', gap: 7, justifyContent: 'center' },
  dot: { width: 28, height: 4, borderRadius: 5 },
  offerOrb: { alignSelf: 'center', width: 74, height: 74, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  offerTitle: { textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 34, letterSpacing: -1.1, marginTop: 26 },
  features: { gap: 17, paddingVertical: 20 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  featureText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14 },
  skip: { textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 15 },
});