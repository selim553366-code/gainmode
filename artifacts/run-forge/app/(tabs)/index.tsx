import React from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { Pedometer } from 'expo-sensors';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Circle, Marker, Polyline, type MapPressEvent } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { claimRunForgeDiscount } from '@workspace/api-client-react';
import { localeFor, languageLabels, type CopyKey, type Language, translate } from '@/lib/i18n';

type Coordinate = { latitude: number; longitude: number };
type Region = Coordinate & { latitudeDelta: number; longitudeDelta: number };
type Phase = 'ready' | 'countdown' | 'running' | 'summary';
type RunRecord = { id: string; date: string; distanceKm: number; durationSec: number; averageSpeed: number; steps: number; route: Coordinate[] };

const STORAGE_KEYS = { language: '@runforge/language', runs: '@runforge/runs', client: '@runforge/client' };
const DEFAULT_REGION: Region = { latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.035, longitudeDelta: 0.035 };

function distanceBetween(a: Coordinate, b: Coordinate) {
  const radius = 6371;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function sameDay(date: string) {
  return new Date(date).toDateString() === new Date().toDateString();
}

function makeClientId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function NeonIconButton({ icon, onPress, colors, accessibilityLabel }: { icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void; colors: ReturnType<typeof useColors>; accessibilityLabel: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [styles.iconButton, { borderColor: `${colors.primary}66`, backgroundColor: `${colors.primary}12`, opacity: pressed ? 0.72 : 1 }]}>
      <Ionicons name={icon} size={19} color={colors.primary} />
    </Pressable>
  );
}

function SatelliteMap({ region, route, current, start, finish, colors, onPress, interactive }: { region: Region; route: Coordinate[]; current: Coordinate | null; start: Coordinate | null; finish: Coordinate | null; colors: ReturnType<typeof useColors>; onPress?: (event: MapPressEvent) => void; interactive?: boolean }) {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webMap, { borderColor: `${colors.primary}36` }]}>
        <View style={[styles.mapGrid, { borderColor: `${colors.foreground}12` }]} />
        <View style={[styles.webRoad, styles.webRoadOne, { backgroundColor: `${colors.primary}40` }]} />
        <View style={[styles.webRoad, styles.webRoadTwo, { backgroundColor: `${colors.accent}45` }]} />
        <View style={[styles.webRoute, { borderColor: colors.primary }]} />
        <View style={styles.webMapTop}><Ionicons name="map" size={14} color={colors.primary} /><Text style={[styles.mapLabel, { color: colors.primary }]}>{translate('en', 'mapPreview')}</Text></View>
        <View style={styles.mapPinWeb}><Ionicons name="navigate" size={20} color={colors.primaryForeground} /></View>
        <Text style={[styles.webMapCaption, { color: colors.foreground }]}>{translate('en', 'gpsWaiting')}</Text>
      </View>
    );
  }
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      mapType="satellite"
      region={region}
      showsUserLocation={Boolean(current)}
      showsMyLocationButton={false}
      pitchEnabled={false}
      rotateEnabled={false}
      scrollEnabled={interactive !== false}
      zoomEnabled={interactive !== false}
      onPress={onPress}
    >
      {route.length > 1 ? <Polyline coordinates={route} strokeColor={colors.primary} strokeWidth={5} lineCap="round" lineJoin="round" /> : null}
      {start ? <Marker coordinate={start} title="Start"><View style={[styles.mapMarker, { backgroundColor: colors.success, borderColor: colors.background }]}><Ionicons name="flag" size={13} color={colors.background} /></View></Marker> : null}
      {finish ? <Marker coordinate={finish} title="Finish"><View style={[styles.mapMarker, { backgroundColor: colors.destructive, borderColor: colors.background }]}><Ionicons name="flag" size={13} color={colors.background} /></View></Marker> : null}
      {current ? <Circle center={current} radius={7} fillColor={`${colors.primary}55`} strokeColor={colors.primary} strokeWidth={2} /> : null}
    </MapView>
  );
}

function StatCard({ icon, label, value, unit, colors }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string; unit: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name={icon} size={16} color={colors.primary} /></View>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={styles.statValueRow}><Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.statUnit, { color: colors.primary }]}>{unit}</Text></View>
    </View>
  );
}

function MainButton({ label, icon, onPress, colors, disabled = false }: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void; colors: ReturnType<typeof useColors>; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.mainButton, { backgroundColor: colors.primary, opacity: disabled ? 0.42 : pressed ? 0.78 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      <Ionicons name={icon} size={20} color={colors.primaryForeground} />
      <Text style={[styles.mainButtonText, { color: colors.primaryForeground }]}>{label}</Text>
    </Pressable>
  );
}

export default function RunForgeHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = React.useState<Language>('tr');
  const t = React.useCallback((key: CopyKey) => translate(language, key), [language]);
  const [phase, setPhase] = React.useState<Phase>('ready');
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [region, setRegion] = React.useState<Region>(DEFAULT_REGION);
  const [current, setCurrent] = React.useState<Coordinate | null>(null);
  const [route, setRoute] = React.useState<Coordinate[]>([]);
  const [distanceKm, setDistanceKm] = React.useState(0);
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const [dailySteps, setDailySteps] = React.useState<number | null>(null);
  const [runs, setRuns] = React.useState<RunRecord[]>([]);
  const [locationStatus, setLocationStatus] = React.useState<'unknown' | 'granted' | 'denied' | 'loading'>('unknown');
  const [locationError, setLocationError] = React.useState('');
  const [showRecordCamera, setShowRecordCamera] = React.useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [recordPicker, setRecordPicker] = React.useState<'start' | 'finish' | null>(null);
  const [recordStart, setRecordStart] = React.useState<Coordinate | null>(null);
  const [recordFinish, setRecordFinish] = React.useState<Coordinate | null>(null);
  const [recordCode, setRecordCode] = React.useState('');
  const [codeRemaining, setCodeRemaining] = React.useState<number | null>(null);
  const [codeLoading, setCodeLoading] = React.useState(false);
  const [codeError, setCodeError] = React.useState(false);
  const subscriptionRef = React.useRef<Location.LocationSubscription | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = React.useRef(0);
  const routeRef = React.useRef<Coordinate[]>([]);
  const distanceRef = React.useRef(0);
  const recordModeRef = React.useRef(false);
  const stepAtStartRef = React.useRef(0);

  const requestLocation = React.useCallback(async () => {
    setLocationStatus('loading');
    setLocationError('');
    try {
      if (Platform.OS === 'web') {
        const point = await new Promise<Coordinate>((resolve, reject) => navigator.geolocation.getCurrentPosition((position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }), () => reject(new Error('location'))));
        setCurrent(point);
        setRegion((previous) => ({ ...previous, ...point }));
        setLocationStatus('granted');
        return point;
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationStatus('denied');
        setLocationError(t('locationDenied'));
        return null;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCurrent(point);
      setRegion((previous) => ({ ...previous, ...point }));
      setLocationStatus('granted');
      return point;
    } catch {
      setLocationStatus('denied');
      setLocationError(t('locationUnavailable'));
      return null;
    }
  }, [t]);

  React.useEffect(() => {
    let mounted = true;
    void Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.language),
      AsyncStorage.getItem(STORAGE_KEYS.runs),
    ]).then(([storedLanguage, storedRuns]) => {
      if (!mounted) return;
      if (storedLanguage && ['tr', 'en', 'de', 'fr', 'es'].includes(storedLanguage)) setLanguage(storedLanguage as Language);
      if (storedRuns) {
        try { setRuns(JSON.parse(storedRuns) as RunRecord[]); } catch { setRuns([]); }
      }
    });
    void requestLocation();
    void Pedometer.isAvailableAsync().then((available) => {
      if (!available || Platform.OS === 'web') return;
      const start = new Date(); start.setHours(0, 0, 0, 0);
      void Pedometer.getStepCountAsync(start, new Date()).then((result) => setDailySteps(result.steps)).catch(() => setDailySteps(null));
    });
    return () => { mounted = false; };
  }, [requestLocation]);

  React.useEffect(() => { void AsyncStorage.setItem(STORAGE_KEYS.language, language); }, [language]);
  React.useEffect(() => {
    if (phase !== 'running') return;
    timerRef.current = setInterval(() => setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const updatePoint = React.useCallback((point: Coordinate) => {
    setCurrent(point);
    setRegion((previous) => ({ ...previous, ...point }));
    const previous = routeRef.current[routeRef.current.length - 1];
    if (previous) {
      const added = distanceBetween(previous, point);
      if (added > 0.002 && added < 0.25) {
        distanceRef.current += added;
        setDistanceKm(distanceRef.current);
      }
    }
    routeRef.current = [...routeRef.current, point];
    setRoute(routeRef.current);
  }, []);

  const watchLocation = React.useCallback(async () => {
    if (Platform.OS === 'web') {
      const watchId = navigator.geolocation.watchPosition((position) => updatePoint({ latitude: position.coords.latitude, longitude: position.coords.longitude }));
      return { remove: () => navigator.geolocation.clearWatch(watchId) };
    }
    return Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 4 }, (position) => updatePoint({ latitude: position.coords.latitude, longitude: position.coords.longitude }));
  }, [updatePoint]);

  const beginRun = React.useCallback(async () => {
    const point = current ?? await requestLocation();
    if (!point) { setCountdown(null); setPhase('ready'); return; }
    recordModeRef.current = Boolean(recordStart && recordFinish);
    routeRef.current = [point];
    setRoute([point]);
    distanceRef.current = 0;
    setDistanceKm(0);
    setElapsedSec(0);
    startedAtRef.current = Date.now();
    setPhase('running');
    subscriptionRef.current = await watchLocation();
    Speech.stop();
    Speech.speak(t('go'), { language: localeFor(language), rate: 0.82 });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [current, language, recordFinish, recordStart, requestLocation, t, watchLocation]);

  React.useEffect(() => {
    if (countdown === null) return;
    Speech.stop();
    Speech.speak(countdown === 5 ? t('countdownReady') : String(countdown), { language: localeFor(language), rate: 0.85 });
    const timeout = setTimeout(() => {
      if (countdown === 1) { setCountdown(null); void beginRun(); } else setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [beginRun, countdown, language, t]);

  const startCountdown = React.useCallback(async (isRecord = false) => {
    if (locationStatus !== 'granted' && !(await requestLocation())) return;
    recordModeRef.current = isRecord;
    setPhase('countdown');
    setCountdown(5);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [locationStatus, requestLocation]);

  const finishRun = React.useCallback(async () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    const durationSec = Math.max(elapsedSec, Math.floor((Date.now() - startedAtRef.current) / 1000));
    const averageSpeed = durationSec > 0 ? (distanceRef.current / durationSec) * 3600 : 0;
    const steps = dailySteps === null ? 0 : Math.max(dailySteps - stepAtStartRef.current, 0);
    const newRun: RunRecord = { id: String(Date.now()), date: new Date().toISOString(), distanceKm: distanceRef.current, durationSec, averageSpeed, steps, route: routeRef.current };
    const nextRuns = [newRun, ...runs].slice(0, 10);
    setRuns(nextRuns);
    await AsyncStorage.setItem(STORAGE_KEYS.runs, JSON.stringify(nextRuns));
    setElapsedSec(durationSec);
    setPhase('summary');
    Speech.stop();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [dailySteps, elapsedSec, runs]);

  const resetRun = () => {
    setPhase('ready'); setRoute([]); routeRef.current = []; distanceRef.current = 0; setDistanceKm(0); setElapsedSec(0); setRecordStart(null); setRecordFinish(null); recordModeRef.current = false;
  };

  const openRecord = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) return;
    }
    setShowRecordCamera(true);
    setRecordPicker('start');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectRecordPoint = (kind: 'start' | 'finish') => {
    if (!current) { Alert.alert(t('permissionNeeded'), t('locationPermission')); return; }
    if (kind === 'start') { setRecordStart(current); setRecordPicker('finish'); }
    else { setRecordFinish(current); setRecordPicker(null); }
    void Haptics.selectionAsync();
  };

  const handleMapPress = (event: MapPressEvent) => {
    if (!recordPicker) return;
    const point = event.nativeEvent.coordinate;
    if (recordPicker === 'start') { setRecordStart(point); setRecordPicker('finish'); } else { setRecordFinish(point); setRecordPicker(null); }
    void Haptics.selectionAsync();
  };

  const loadForgeCode = async () => {
    setCodeLoading(true); setCodeError(false);
    try {
      let clientId = await AsyncStorage.getItem(STORAGE_KEYS.client);
      if (!clientId) { clientId = makeClientId(); await AsyncStorage.setItem(STORAGE_KEYS.client, clientId); }
      const response = await claimRunForgeDiscount({ clientId });
      if (response.available && response.code) { setRecordCode(response.code); setCodeRemaining(response.remaining); } else setCodeError(true);
    } catch { setCodeError(true); } finally { setCodeLoading(false); }
  };

  const todayRuns = runs.filter((run) => sameDay(run.date));
  const todayDistance = todayRuns.reduce((sum, run) => sum + run.distanceKm, 0) + (phase === 'running' ? distanceKm : 0);
  const completedDistance = todayRuns.reduce((sum, run) => sum + run.distanceKm, 0);
  const completedSeconds = todayRuns.reduce((sum, run) => sum + run.durationSec, 0);
  const todaySpeed = completedSeconds > 0 ? (completedDistance / completedSeconds) * 3600 : 0;
  const targetDistance = recordStart && recordFinish ? distanceBetween(recordStart, recordFinish) : 0;
  const shownDistance = phase === 'summary' ? distanceKm : todayDistance;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <View style={styles.brandLine}><View style={[styles.brandDot, { backgroundColor: colors.primary }]} /><Text style={[styles.brand, { color: colors.foreground }]}>RUNFORGE</Text><View style={[styles.livePill, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}55` }]}><Text style={[styles.livePillText, { color: colors.primary }]}>{t('connected')}</Text></View></View>
          <Text style={[styles.greeting, { color: colors.foreground }]}>{t('greeting')}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{t('subtitle')}</Text>
        </View>
        <Pressable onPress={() => setLanguage(language === 'tr' ? 'en' : language === 'en' ? 'de' : language === 'de' ? 'fr' : language === 'fr' ? 'es' : 'tr')} style={[styles.languageButton, { borderColor: colors.border, backgroundColor: colors.card }]}><Text style={[styles.languageText, { color: colors.primary }]}>{languageLabels[language]}</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.mapCard, { borderColor: `${colors.primary}40` }]}>
          <SatelliteMap region={region} route={route} current={current} start={recordStart} finish={recordFinish} colors={colors} onPress={handleMapPress} interactive={Boolean(recordPicker)} />
          <View style={styles.mapOverlayTop}><View style={[styles.mapBadge, { backgroundColor: `${colors.background}D9`, borderColor: `${colors.primary}55` }]}><Ionicons name="map" size={15} color={colors.primary} /><Text style={[styles.mapBadgeText, { color: colors.primary }]}>{t('satellite')}</Text></View>{phase === 'running' ? <View style={[styles.liveBadge, { backgroundColor: colors.destructive }]}><View style={styles.liveDot} /><Text style={styles.liveText}>{t('live')}</Text></View> : null}</View>
          {phase === 'countdown' && countdown !== null ? <View style={[styles.countdownOverlay, { backgroundColor: `${colors.background}CC` }]}><Text style={[styles.countdownNumber, { color: colors.primary }]}>{countdown}</Text><Text style={[styles.countdownLabel, { color: colors.foreground }]}>{t('seconds')}</Text></View> : null}
          {phase === 'running' ? <View style={[styles.liveStats, { backgroundColor: `${colors.background}E6`, borderColor: `${colors.primary}44` }]}><Text style={[styles.liveTimer, { color: colors.foreground }]}>{formatDuration(elapsedSec)}</Text><Text style={[styles.liveDistance, { color: colors.primary }]}>{distanceKm.toFixed(2)} {t('kilometers')}</Text></View> : null}
          {recordPicker ? <View style={[styles.mapPickerHint, { backgroundColor: `${colors.background}E8`, borderColor: `${colors.primary}66` }]}><Ionicons name="location-outline" size={17} color={colors.primary} /><Text style={[styles.mapPickerText, { color: colors.foreground }]}>{recordPicker === 'start' ? t('chooseStart') : t('chooseFinish')}</Text></View> : null}
        </View>

        {locationStatus !== 'granted' && phase === 'ready' ? <View style={[styles.permissionCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.permissionIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="navigate-outline" size={21} color={colors.primary} /></View><View style={styles.permissionCopy}><Text style={[styles.permissionTitle, { color: colors.foreground }]}>{t('locationPermission')}</Text><Text style={[styles.permissionBody, { color: colors.mutedForeground }]}>{locationError || t('gpsWaiting')}</Text></View><Pressable onPress={() => { void requestLocation(); }}><Ionicons name="chevron-forward" size={21} color={colors.primary} /></Pressable></View> : null}

        <View style={styles.statsGrid}>
          <StatCard icon="footsteps-outline" label={t('dailySteps')} value={dailySteps === null ? '—' : dailySteps.toLocaleString(localeFor(language))} unit={t('steps')} colors={colors} />
          <StatCard icon="navigate-outline" label={t('distance')} value={shownDistance.toFixed(2)} unit={t('kilometers')} colors={colors} />
          <StatCard icon="speedometer-outline" label={t('averageSpeed')} value={todaySpeed ? todaySpeed.toFixed(1) : '—'} unit={t('kilometersPerHour')} colors={colors} />
        </View>

        {phase === 'summary' ? <View style={[styles.summaryCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}55` }]}><View style={styles.summaryIcon}><Ionicons name="checkmark-circle" size={27} color={colors.primary} /></View><View style={styles.summaryCopy}><Text style={[styles.summaryTitle, { color: colors.foreground }]}>{t('summaryTitle')}</Text><Text style={[styles.summarySubtitle, { color: colors.mutedForeground }]}>{t('summarySubtitle')}</Text></View><Text style={[styles.summaryDistance, { color: colors.primary }]}>{distanceKm.toFixed(2)}<Text style={styles.summaryUnit}> {t('kilometers')}</Text></Text></View> : null}

        {phase === 'running' ? <MainButton label={t('stopRun')} icon="stop-circle-outline" onPress={() => { void finishRun(); }} colors={colors} /> : phase === 'summary' ? <MainButton label={t('newRun')} icon="refresh-outline" onPress={resetRun} colors={colors} /> : <MainButton label={phase === 'countdown' ? `${countdown}...` : t('startRun')} icon="play" onPress={() => { void startCountdown(false); }} colors={colors} disabled={phase === 'countdown' || locationStatus === 'loading'} />}

        <Pressable onPress={() => { void openRecord(); }} style={({ pressed }) => [styles.recordCard, { borderColor: `${colors.accent}88`, backgroundColor: `${colors.accent}0D`, opacity: pressed ? 0.78 : 1 }]}>
          <View style={[styles.recordIcon, { backgroundColor: `${colors.accent}22`, borderColor: `${colors.accent}66` }]}><Ionicons name="flame-outline" size={22} color={colors.accent} /></View>
          <View style={styles.recordCopy}><Text style={[styles.recordEyebrow, { color: colors.accent }]}>{t('recordMode')}</Text><Text style={[styles.recordTitle, { color: colors.foreground }]}>{t('record')}</Text><Text style={[styles.recordSubtitle, { color: colors.mutedForeground }]}>{t('recordSubtitle')}</Text></View><Ionicons name="chevron-forward" size={21} color={colors.accent} /></Pressable>

        <View style={[styles.linkCard, { borderColor: colors.border, backgroundColor: colors.card }]}><View style={[styles.linkIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="link-outline" size={18} color={colors.primary} /></View><View style={styles.linkCopy}><Text style={[styles.linkTitle, { color: colors.foreground }]}>{t('forgeFitCode')}</Text><Text style={[styles.linkBody, { color: colors.mutedForeground }]}>{recordCode || t('linkNote')}</Text></View>{recordCode ? <Text style={[styles.codeText, { color: colors.primary }]}>{recordCode}</Text> : <Pressable onPress={() => { void loadForgeCode(); }} style={[styles.smallButton, { borderColor: `${colors.primary}66` }]}><Text style={[styles.smallButtonText, { color: colors.primary }]}>{codeLoading ? '...' : t('claimCode')}</Text></Pressable>}</View>
        {codeError ? <Text style={[styles.codeError, { color: colors.destructive }]}>{t('codeUnavailable')}</Text> : null}

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('history')}</Text><Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>{todayRuns.length} / {t('today')}</Text></View>
        {runs.length === 0 ? <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.card }]}><Ionicons name="footsteps-outline" size={22} color={colors.mutedForeground} /><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('noRuns')}</Text></View> : runs.slice(0, 3).map((run) => <View key={run.id} style={[styles.historyRow, { borderBottomColor: colors.border }]}><View style={[styles.historyDot, { backgroundColor: colors.primary }]} /><View style={styles.historyCopy}><Text style={[styles.historyDate, { color: colors.foreground }]}>{new Date(run.date).toLocaleDateString(localeFor(language), { day: 'numeric', month: 'short' })}</Text><Text style={[styles.historyMeta, { color: colors.mutedForeground }]}>{formatDuration(run.durationSec)} · {run.averageSpeed.toFixed(1)} {t('kilometersPerHour')}</Text></View><Text style={[styles.historyDistance, { color: colors.primary }]}>{run.distanceKm.toFixed(2)} {t('kilometers')}</Text></View>)}
      </ScrollView>

      {showRecordCamera ? <View style={[styles.cameraLayer, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: colors.background }]}>
        {Platform.OS === 'web' ? <View style={[styles.cameraFallback, { backgroundColor: colors.card }]}><Ionicons name="camera-outline" size={48} color={colors.primary} /><Text style={[styles.cameraFallbackTitle, { color: colors.foreground }]}>{t('cameraUnavailable')}</Text></View> : cameraPermission?.granted ? <CameraView style={StyleSheet.absoluteFill} facing="back" /> : <View style={styles.cameraFallback}><Ionicons name="camera-outline" size={48} color={colors.primary} /><Text style={[styles.cameraFallbackTitle, { color: colors.foreground }]}>{t('cameraPermission')}</Text><Pressable onPress={() => { void requestCameraPermission(); }}><Text style={[styles.cameraFallbackLink, { color: colors.primary }]}>{t('allowCamera')}</Text></Pressable></View>}
        <View style={styles.cameraTint} pointerEvents="none" />
        <View style={styles.cameraHeader}><View><Text style={[styles.cameraEyebrow, { color: colors.primary }]}>{t('recordMode')}</Text><Text style={[styles.cameraTitle, { color: colors.foreground }]}>{t('record')}</Text></View><NeonIconButton icon="close" onPress={() => { setShowRecordCamera(false); setRecordPicker(null); }} colors={colors} accessibilityLabel={t('close')} /></View>
        <View style={[styles.neonFrame, { borderColor: colors.primary, shadowColor: colors.primary }]}><View style={[styles.corner, styles.cornerTL, { borderColor: colors.primary }]} /><View style={[styles.corner, styles.cornerTR, { borderColor: colors.primary }]} /><View style={[styles.corner, styles.cornerBL, { borderColor: colors.primary }]} /><View style={[styles.corner, styles.cornerBR, { borderColor: colors.primary }]} /><View style={[styles.cameraTarget, { backgroundColor: `${colors.primary}22`, borderColor: colors.primary }]}><Ionicons name="location" size={25} color={colors.primary} /></View></View>
        <View style={styles.cameraBottom}><Text style={[styles.recordHint, { color: colors.foreground }]}>{t('recordHint')}</Text><View style={styles.selectionRow}>{<Pressable onPress={() => selectRecordPoint('start')} style={[styles.selectionButton, { borderColor: recordStart ? colors.success : colors.primary, backgroundColor: `${colors.background}D9` }]}><Ionicons name={recordStart ? 'checkmark-circle' : 'flag-outline'} size={17} color={recordStart ? colors.success : colors.primary} /><Text style={[styles.selectionText, { color: colors.foreground }]}>{recordStart ? t('selectedStart') : t('chooseStart')}</Text></Pressable>}<Pressable onPress={() => selectRecordPoint('finish')} style={[styles.selectionButton, { borderColor: recordFinish ? colors.success : colors.primary, backgroundColor: `${colors.background}D9` }]}><Ionicons name={recordFinish ? 'checkmark-circle' : 'flag-outline'} size={17} color={recordFinish ? colors.success : colors.primary} /><Text style={[styles.selectionText, { color: colors.foreground }]}>{recordFinish ? t('selectedFinish') : t('chooseFinish')}</Text></Pressable></View>{targetDistance > 0 ? <Text style={[styles.targetDistance, { color: colors.primary }]}>{t('targetRoute')} · {targetDistance.toFixed(2)} {t('kilometers')}</Text> : null}<MainButton label={t('recordStart')} icon="flame" onPress={() => { if (!recordStart || !recordFinish) { setRecordPicker(!recordStart ? 'start' : 'finish'); return; } setShowRecordCamera(false); void startCountdown(true); }} colors={colors} disabled={phase === 'countdown'} /></View>
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  brandDot: { width: 8, height: 8, borderRadius: 4 },
  brand: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 2.8 },
  livePill: { marginLeft: 4, borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  livePillText: { fontFamily: 'Inter_600SemiBold', fontSize: 8, letterSpacing: 0.5 },
  greeting: { fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -0.8 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 4 },
  languageButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  languageText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  content: { paddingHorizontal: 20, gap: 16 },
  mapCard: { height: 312, borderRadius: 26, overflow: 'hidden', borderWidth: 1, position: 'relative', backgroundColor: '#1B2B32' },
  mapOverlayTop: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mapBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, borderWidth: 1 },
  mapBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.1 },
  liveBadge: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#fff', letterSpacing: 1.1 },
  countdownOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  countdownNumber: { fontFamily: 'Inter_700Bold', fontSize: 96, lineHeight: 105 },
  countdownLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  liveStats: { position: 'absolute', bottom: 14, left: 14, right: 14, padding: 13, borderWidth: 1, borderRadius: 15 },
  liveTimer: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.5 },
  liveDistance: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 3 },
  mapPickerHint: { position: 'absolute', bottom: 14, left: 14, right: 14, padding: 12, borderWidth: 1, borderRadius: 14, flexDirection: 'row', gap: 8, alignItems: 'center' },
  mapPickerText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  webMap: { flex: 1, overflow: 'hidden', backgroundColor: '#253A3D', position: 'relative' },
  mapGrid: { ...StyleSheet.absoluteFillObject, borderWidth: 1, opacity: 0.7, transform: [{ rotate: '12deg' }, { scale: 1.3 }] },
  webRoad: { position: 'absolute', height: 15, width: '140%', transformOrigin: 'center' },
  webRoadOne: { top: 130, left: -42, transform: [{ rotate: '-22deg' }] },
  webRoadTwo: { top: 205, left: -20, transform: [{ rotate: '35deg' }] },
  webRoute: { position: 'absolute', width: 175, height: 105, borderWidth: 4, borderLeftColor: 'transparent', borderBottomColor: 'transparent', borderRadius: 80, transform: [{ rotate: '-15deg' }], top: 96, left: 84 },
  webMapTop: { position: 'absolute', bottom: 14, left: 15, flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 },
  mapPinWeb: { position: 'absolute', top: 153, left: '49%', width: 38, height: 38, borderRadius: 19, backgroundColor: '#67C7FF', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  webMapCaption: { position: 'absolute', top: 15, right: 15, fontFamily: 'Inter_600SemiBold', fontSize: 11, opacity: 0.8 },
  mapMarker: { width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  permissionCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  permissionIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  permissionCopy: { flex: 1 },
  permissionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 17 },
  permissionBody: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2, lineHeight: 16 },
  statsGrid: { flexDirection: 'row', gap: 9 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 17, padding: 11, minHeight: 105 },
  statIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  statLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 13 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 5 },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 19, letterSpacing: -0.3 },
  statUnit: { fontFamily: 'Inter_600SemiBold', fontSize: 9 },
  mainButton: { minHeight: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  mainButtonText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  summaryCard: { borderWidth: 1, borderRadius: 19, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  summaryCopy: { flex: 1 },
  summaryTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  summarySubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  summaryDistance: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  summaryUnit: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  recordCard: { borderWidth: 1, borderRadius: 21, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  recordIcon: { width: 45, height: 45, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  recordCopy: { flex: 1 },
  recordEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.4 },
  recordTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, marginTop: 3 },
  recordSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 2 },
  linkCard: { borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  linkCopy: { flex: 1 },
  linkTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  linkBody: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, marginTop: 2 },
  smallButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  smallButtonText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  codeText: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.7 },
  codeError: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: -9 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 3 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 19 },
  sectionMeta: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  emptyCard: { minHeight: 74, borderWidth: 1, borderRadius: 17, alignItems: 'center', justifyContent: 'center', gap: 7, padding: 16 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'center' },
  historyRow: { minHeight: 60, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyCopy: { flex: 1 },
  historyDate: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  historyMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  historyDistance: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  iconButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cameraLayer: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  cameraFallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 32 },
  cameraFallbackTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 14 },
  cameraFallbackLink: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 16 },
  cameraTint: { ...StyleSheet.absoluteFillObject, backgroundColor: '#07111F30' },
  cameraHeader: { paddingHorizontal: 20, paddingTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cameraEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.7 },
  cameraTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, marginTop: 4 },
  neonFrame: { position: 'absolute', top: '26%', left: 27, right: 27, height: '39%', borderWidth: 1, borderRadius: 28, shadowOpacity: 0.8, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 15 },
  corner: { position: 'absolute', width: 29, height: 29, borderWidth: 4 },
  cornerTL: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 17 },
  cornerTR: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 17 },
  cornerBL: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 17 },
  cornerBR: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 17 },
  cameraTarget: { position: 'absolute', left: '50%', top: '50%', width: 52, height: 52, marginLeft: -26, marginTop: -26, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cameraBottom: { position: 'absolute', left: 20, right: 20, bottom: 20, gap: 12 },
  recordHint: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  selectionRow: { flexDirection: 'row', gap: 9 },
  selectionButton: { flex: 1, minHeight: 47, borderWidth: 1, borderRadius: 14, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  selectionText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, textAlign: 'center' },
  targetDistance: { fontFamily: 'Inter_700Bold', fontSize: 12, textAlign: 'center' },
});