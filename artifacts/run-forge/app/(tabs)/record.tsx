import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { localeFor, languageLabels, type CopyKey, type Language, translate } from '@/lib/i18n';

type Coordinate = { latitude: number; longitude: number };
type RunRecord = { id: string; date: string; distanceKm: number; durationSec: number; averageSpeed: number; steps: number; route: Coordinate[] };
type RecordPhase = 'setup' | 'countdown' | 'running' | 'finished';

const RUNS_KEY = '@runforge/runs';
const LANGUAGE_KEY = '@runforge/language';

function haversine(a: Coordinate, b: Coordinate) {
  const radius = 6371;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function MainButton({ label, icon, onPress, colors, disabled = false }: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void; colors: ReturnType<typeof useColors>; disabled?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.mainButton, { backgroundColor: colors.primary, opacity: disabled ? 0.35 : pressed ? 0.75 : 1 }]}><Ionicons name={icon} size={19} color={colors.primaryForeground} /><Text style={[styles.mainButtonText, { color: colors.primaryForeground }]}>{label}</Text></Pressable>;
}

export default function RecordTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = React.useState<Language>('tr');
  const t = React.useCallback((key: CopyKey) => translate(language, key), [language]);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [phase, setPhase] = React.useState<RecordPhase>('setup');
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [current, setCurrent] = React.useState<Coordinate | null>(null);
  const [startPoint, setStartPoint] = React.useState<Coordinate | null>(null);
  const [finishPoint, setFinishPoint] = React.useState<Coordinate | null>(null);
  const [route, setRoute] = React.useState<Coordinate[]>([]);
  const [distanceKm, setDistanceKm] = React.useState(0);
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const locationSubRef = React.useRef<Location.LocationSubscription | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = React.useRef(0);
  const lastPointRef = React.useRef<Coordinate | null>(null);
  const distanceRef = React.useRef(0);
  const routeRef = React.useRef<Coordinate[]>([]);

  React.useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
      if (active && stored && ['tr', 'en', 'de', 'fr', 'es'].includes(stored)) setLanguage(stored as Language);
    });
    void requestLocation();
    return () => { active = false; };
  }, []);

  const requestLocation = React.useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        return await new Promise<Coordinate>((resolve, reject) => navigator.geolocation.getCurrentPosition((position) => { const point = { latitude: position.coords.latitude, longitude: position.coords.longitude }; setCurrent(point); resolve(point); }, reject));
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return null;
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCurrent(point);
      return point;
    } catch {
      return null;
    }
  }, []);

  const selectPoint = async (kind: 'start' | 'finish') => {
    const point = current ?? await requestLocation();
    if (!point) return;
    if (kind === 'start') setStartPoint(point); else setFinishPoint(point);
    await Haptics.selectionAsync();
  };

  const updatePoint = React.useCallback((point: Coordinate) => {
    setCurrent(point);
    const last = lastPointRef.current;
    if (last) {
      const added = haversine(last, point);
      if (added > 0.002 && added < 0.25) {
        distanceRef.current += added;
        setDistanceKm(distanceRef.current);
      }
    }
    lastPointRef.current = point;
    routeRef.current = [...routeRef.current, point];
    setRoute(routeRef.current);
  }, []);

  const beginTracking = React.useCallback(async () => {
    const point = current ?? await requestLocation();
    if (!point) { setCountdown(null); setPhase('setup'); return; }
    routeRef.current = [point];
    lastPointRef.current = point;
    setRoute([point]);
    distanceRef.current = 0;
    setDistanceKm(0);
    setElapsedSec(0);
    startedAtRef.current = Date.now();
    setPhase('running');
    if (Platform.OS === 'web') {
      const watchId = navigator.geolocation.watchPosition((position) => updatePoint({ latitude: position.coords.latitude, longitude: position.coords.longitude }));
      locationSubRef.current = { remove: () => navigator.geolocation.clearWatch(watchId) } as Location.LocationSubscription;
    } else {
      locationSubRef.current = await Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 4 }, (position) => updatePoint({ latitude: position.coords.latitude, longitude: position.coords.longitude }));
    }
    Speech.stop();
    Speech.speak(t('go'), { language: localeFor(language), rate: 0.82 });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [current, language, requestLocation, t, updatePoint]);

  React.useEffect(() => {
    if (countdown === null) return;
    Speech.stop();
    Speech.speak(countdown === 5 ? t('countdownReady') : String(countdown), { language: localeFor(language), rate: 0.85 });
    const timeout = setTimeout(() => {
      if (countdown === 1) { setCountdown(null); void beginTracking(); } else setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [beginTracking, countdown, language, t]);

  React.useEffect(() => {
    if (phase !== 'running') return;
    timerRef.current = setInterval(() => setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const startRecord = async () => {
    if (!startPoint || !finishPoint) return;
    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission.granted) return;
    setPhase('countdown');
    setCountdown(5);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const finishRecord = async () => {
    locationSubRef.current?.remove();
    locationSubRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    const durationSec = Math.max(elapsedSec, Math.floor((Date.now() - startedAtRef.current) / 1000));
    const averageSpeed = durationSec > 0 ? (distanceRef.current / durationSec) * 3600 : 0;
    const record: RunRecord = { id: String(Date.now()), date: new Date().toISOString(), distanceKm: distanceRef.current, durationSec, averageSpeed, steps: 0, route: routeRef.current };
    const stored = await AsyncStorage.getItem(RUNS_KEY);
    let runs: RunRecord[] = [];
    try { if (stored) runs = JSON.parse(stored) as RunRecord[]; } catch { runs = []; }
    await AsyncStorage.setItem(RUNS_KEY, JSON.stringify([record, ...runs].slice(0, 10)));
    setElapsedSec(durationSec);
    setPhase('finished');
    Speech.stop();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const targetDistance = startPoint && finishPoint ? haversine(startPoint, finishPoint) : 0;
  const reset = () => { setPhase('setup'); setCountdown(null); setRoute([]); routeRef.current = []; lastPointRef.current = null; distanceRef.current = 0; setDistanceKm(0); setElapsedSec(0); };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {Platform.OS === 'web' ? <View style={[styles.webBackdrop, { backgroundColor: colors.card }]}><Ionicons name="camera-outline" size={52} color={colors.primary} /><Text style={[styles.unavailable, { color: colors.foreground }]}>{t('cameraUnavailable')}</Text></View> : cameraPermission?.granted ? <CameraView style={StyleSheet.absoluteFill} facing="back" /> : <View style={[styles.cameraPermission, { backgroundColor: colors.background }]}><Ionicons name="camera-outline" size={50} color={colors.primary} /><Text style={[styles.permissionTitle, { color: colors.foreground }]}>{t('cameraPermission')}</Text><Pressable onPress={() => { void requestCameraPermission(); }}><Text style={[styles.permissionLink, { color: colors.primary }]}>{t('allowCamera')}</Text></Pressable></View>}
      <View style={styles.darkTint} pointerEvents="none" />
      <View style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <View><Text style={[styles.eyebrow, { color: colors.primary }]}>{t('recordMode')}</Text><Text style={[styles.title, { color: colors.foreground }]}>{t('record')}</Text></View>
        <Pressable onPress={() => setLanguage(language === 'tr' ? 'en' : language === 'en' ? 'de' : language === 'de' ? 'fr' : language === 'fr' ? 'es' : 'tr')} style={[styles.langButton, { borderColor: `${colors.primary}66` }]}><Text style={[styles.langText, { color: colors.primary }]}>{languageLabels[language]}</Text></Pressable>
      </View>
      <View style={[styles.neonFrame, { borderColor: colors.primary, shadowColor: colors.primary }]}><View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} /><View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} /><View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} /><View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} /><View style={[styles.target, { borderColor: colors.primary, backgroundColor: `${colors.primary}25` }]}><Ionicons name="navigate" size={24} color={colors.primary} /></View></View>
      {countdown !== null ? <View style={[styles.countdown, { backgroundColor: `${colors.background}BB` }]}><Text style={[styles.countdownNumber, { color: colors.primary }]}>{countdown}</Text><Text style={[styles.countdownLabel, { color: colors.foreground }]}>{t('seconds')}</Text></View> : null}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 14, backgroundColor: `${colors.background}F0`, borderColor: `${colors.primary}40` }]}>
        <View style={styles.panelHandle} />
        <View style={styles.panelHeader}><View><Text style={[styles.panelTitle, { color: colors.foreground }]}>{phase === 'running' ? `${distanceKm.toFixed(2)} ${t('kilometers')}` : phase === 'finished' ? t('summaryTitle') : t('record')}</Text><Text style={[styles.panelSub, { color: colors.mutedForeground }]}>{phase === 'running' ? `${formatTime(elapsedSec)} · ${t('live')}` : t('recordHint')}</Text></View>{phase === 'running' ? <Pressable onPress={() => { void finishRecord(); }} style={[styles.finishButton, { borderColor: colors.destructive }]}><Ionicons name="stop" size={14} color={colors.destructive} /><Text style={[styles.finishText, { color: colors.destructive }]}>{t('stopRun')}</Text></Pressable> : null}</View>
        <View style={styles.selectionRow}><Pressable onPress={() => { void selectPoint('start'); }} style={[styles.selection, { borderColor: startPoint ? colors.success : colors.primary }]}><Ionicons name={startPoint ? 'checkmark-circle' : 'flag-outline'} size={18} color={startPoint ? colors.success : colors.primary} /><Text style={[styles.selectionText, { color: colors.foreground }]}>{startPoint ? t('selectedStart') : t('chooseStart')}</Text></Pressable><Pressable onPress={() => { void selectPoint('finish'); }} style={[styles.selection, { borderColor: finishPoint ? colors.success : colors.primary }]}><Ionicons name={finishPoint ? 'checkmark-circle' : 'flag-outline'} size={18} color={finishPoint ? colors.success : colors.primary} /><Text style={[styles.selectionText, { color: colors.foreground }]}>{finishPoint ? t('selectedFinish') : t('chooseFinish')}</Text></Pressable></View>
        {targetDistance > 0 ? <Text style={[styles.targetDistance, { color: colors.primary }]}>{t('recordDistance')} · {targetDistance.toFixed(2)} {t('kilometers')}</Text> : null}
        {phase === 'finished' ? <View style={[styles.finishedRow, { borderColor: `${colors.primary}55`, backgroundColor: `${colors.primary}12` }]}><Ionicons name="trophy-outline" size={21} color={colors.primary} /><Text style={[styles.finishedText, { color: colors.foreground }]}>{distanceKm.toFixed(2)} {t('kilometers')} · {formatTime(elapsedSec)}</Text></View> : phase !== 'running' ? <MainButton label={phase === 'countdown' ? `${countdown}...` : t('recordStart')} icon="flame" onPress={() => { void startRecord(); }} colors={colors} disabled={phase === 'countdown' || !startPoint || !finishPoint} /> : null}
        {phase === 'finished' ? <MainButton label={t('newRun')} icon="refresh" onPress={reset} colors={colors} /> : null}
      </View>
    </View>
  );
}

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden' },
  webBackdrop: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 30 },
  unavailable: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 14 },
  cameraPermission: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 30 },
  permissionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, textAlign: 'center', marginTop: 15 },
  permissionLink: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 16 },
  darkTint: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000038' },
  topBar: { position: 'absolute', left: 20, right: 20, top: 0, zIndex: 3, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.7, marginTop: 5 },
  langButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#00000052' },
  langText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  neonFrame: { position: 'absolute', top: '25%', left: 24, right: 24, height: '39%', borderWidth: 1, borderRadius: 28, shadowOpacity: 0.9, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 12 },
  corner: { position: 'absolute', width: 32, height: 32, borderWidth: 4 },
  topLeft: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 18 },
  topRight: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 18 },
  bottomLeft: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 18 },
  bottomRight: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 18 },
  target: { position: 'absolute', left: '50%', top: '50%', marginLeft: -27, marginTop: -27, width: 54, height: 54, borderRadius: 27, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  countdown: { ...StyleSheet.absoluteFillObject, zIndex: 4, alignItems: 'center', justifyContent: 'center' },
  countdownNumber: { fontFamily: 'Inter_700Bold', fontSize: 100, lineHeight: 110 },
  countdownLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  bottomPanel: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 5, borderTopWidth: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, gap: 13 },
  panelHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF66' },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  panelSub: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 3, maxWidth: 235 },
  finishButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  finishText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  selectionRow: { flexDirection: 'row', gap: 9 },
  selection: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 6, flexDirection: 'row', paddingHorizontal: 6 },
  selectionText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  targetDistance: { textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 12 },
  mainButton: { minHeight: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  mainButtonText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  finishedRow: { minHeight: 49, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  finishedText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});