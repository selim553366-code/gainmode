import React from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { requestPinWidget } from 'react-native-android-widget';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate, type TranslationKey } from '@/lib/i18n';
import { quoteOfTheDay } from '@/lib/widgetQuotes';
import { Ionicons } from '@/components/AppIcon';
import { EASE_OUT, PressableScale as Pressable } from '@/components/Motion';
import { MOTIVATION_WIDGET_NAME } from '@/widgets/MotivationWidget';

const OFFER_SHOWN_KEY = 'gainmode-widget-offer-shown';

type Listener = () => void;
const listeners = new Set<Listener>();

/** Opens the widget offer from anywhere, e.g. the settings row. */
export function openWidgetOffer() {
  listeners.forEach((listener) => listener());
}

/** Called after a first successful subscription purchase; shows the offer only once per install. */
export async function offerWidgetAfterFirstPurchase() {
  try {
    if (await AsyncStorage.getItem(OFFER_SHOWN_KEY)) return;
    await AsyncStorage.setItem(OFFER_SHOWN_KEY, new Date().toISOString());
  } catch {
    return;
  }
  // Let the post-purchase navigation settle before the sheet rises.
  setTimeout(openWidgetOffer, 700);
}

const eyebrowByLanguage = { tr: 'GÜNÜN SÖZÜ', en: 'TODAY’S FUEL', de: 'IMPULS DES TAGES', fr: 'L’ÉLAN DU JOUR', es: 'IMPULSO DEL DÍA' } as const;

/** In-app replica of the home-screen poster, so the user sees exactly what they're adding. */
function WidgetPosterPreview() {
  const { language } = useFit();
  return <LinearGradient colors={['#3B7BF2', '#1B3FB8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.poster}>
    <View style={styles.posterGlow} />
    <View style={styles.posterTop}>
      <Text style={styles.posterEyebrow}>{eyebrowByLanguage[language]}</Text>
      <Text style={styles.posterBrand}>GAINMODE</Text>
    </View>
    <Text style={styles.posterQuote}>{quoteOfTheDay(language)}</Text>
    <View style={styles.posterFooter}><View style={styles.posterBar} /><Text style={styles.posterSignature}>FitBud</Text></View>
  </LinearGradient>;
}

export function WidgetOfferHost() {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: TranslationKey) => translate(language, key);
  const [visible, setVisible] = React.useState(false);
  const [manualSteps, setManualSteps] = React.useState(false);
  const appear = useSharedValue(0);

  React.useEffect(() => {
    const show = () => {
      setManualSteps(Platform.OS !== 'android');
      setVisible(true);
    };
    listeners.add(show);
    return () => { listeners.delete(show); };
  }, []);

  React.useEffect(() => {
    if (!visible) return;
    appear.set(0);
    appear.set(withDelay(60, withTiming(1, { duration: 420, easing: EASE_OUT, reduceMotion: ReduceMotion.System })));
  }, [appear, visible]);

  const sheetStyle = useAnimatedStyle(() => ({ opacity: appear.get(), transform: [{ translateY: (1 - appear.get()) * 36 }] }));
  const posterStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${(1 - appear.get()) * -4}deg` }, { scale: 0.92 + appear.get() * 0.08 }] }));

  const close = () => setVisible(false);
  const addToHomeScreen = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    // Android shows the launcher's own "Add to home screen" dialog; false means this launcher can't pin.
    const accepted = await requestPinWidget({ widgetName: MOTIVATION_WIDGET_NAME }).catch(() => false);
    if (accepted) close();
    else setManualSteps(true);
  };

  if (!visible) return null;
  const steps: TranslationKey[] = Platform.OS === 'android'
    ? ['widgetOfferAndroidStep1', 'widgetOfferAndroidStep2', 'widgetOfferAndroidStep3']
    : ['widgetOfferIosStep1', 'widgetOfferIosStep2', 'widgetOfferIosStep3'];

  return <Modal transparent visible animationType="fade" onRequestClose={close}>
    <View style={styles.root}>
      <Pressable scaleTo={1} accessibilityLabel={t('widgetOfferLater')} onPress={close} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }, sheetStyle]}>
        <Animated.View style={posterStyle}><WidgetPosterPreview /></Animated.View>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{t('widgetOfferEyebrow')}</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('widgetOfferTitle')}</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>{t('widgetOfferBody')}</Text>
        {manualSteps ? <View style={[styles.steps, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.stepsHint, { color: colors.foreground }]}>{t(Platform.OS === 'android' ? 'widgetOfferAndroidHint' : 'widgetOfferIosHint')}</Text>
          {steps.map((step, index) => <View key={step} style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}><Text style={[styles.stepNumberText, { color: colors.primaryForeground }]}>{index + 1}</Text></View>
            <Text style={[styles.stepText, { color: colors.foreground }]}>{t(step)}</Text>
          </View>)}
        </View> : null}
        {manualSteps
          ? <Pressable accessibilityRole="button" onPress={close} style={[styles.primary, { backgroundColor: colors.primary }]}>
              <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{t('widgetOfferGotIt')}</Text>
              <Ionicons name="checkmark" size={18} color={colors.primaryForeground} />
            </Pressable>
          : <Pressable accessibilityRole="button" testID="add-widget" onPress={addToHomeScreen} style={[styles.primary, { backgroundColor: colors.primary }]}>
              <Ionicons name="add-circle-outline" size={19} color={colors.primaryForeground} />
              <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{t('widgetOfferAdd')}</Text>
            </Pressable>}
        {manualSteps ? null : <Pressable accessibilityRole="button" onPress={close} hitSlop={8} style={styles.secondary}>
          <Text style={[styles.secondaryText, { color: colors.mutedForeground }]}>{t('widgetOfferLater')}</Text>
        </Pressable>}
      </Animated.View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#061629B8', justifyContent: 'flex-end', padding: 14 },
  sheet: { borderRadius: 32, borderWidth: 1, padding: 22, paddingTop: 24, alignItems: 'stretch' },
  poster: { height: 170, borderRadius: 26, padding: 18, justifyContent: 'space-between', overflow: 'hidden', marginBottom: 22 },
  posterGlow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, right: -80, top: -110, backgroundColor: 'rgba(255,255,255,0.08)' },
  posterTop: { flexDirection: 'row', justifyContent: 'space-between' },
  posterEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.3, color: 'rgba(255,255,255,0.72)' },
  posterBrand: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.8, color: '#FFFFFF' },
  posterQuote: { fontFamily: 'Inter_700Bold', fontSize: 20, lineHeight: 25, color: '#FFFFFF' },
  posterFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  posterBar: { width: 22, height: 3, borderRadius: 2, backgroundColor: '#8EDBFA' },
  posterSignature: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.3 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 29, letterSpacing: -0.6, marginTop: 8 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 8 },
  steps: { borderRadius: 20, padding: 14, gap: 10, marginTop: 16 },
  stepsHint: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNumber: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  stepText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  primary: { minHeight: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  primaryText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  secondary: { alignItems: 'center', paddingVertical: 14 },
  secondaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});
