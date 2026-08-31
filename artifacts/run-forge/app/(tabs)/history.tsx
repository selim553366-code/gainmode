import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { languageLabels, localeFor, type CopyKey, type Language, translate } from '@/lib/i18n';

type Coordinate = { latitude: number; longitude: number };
type RunRecord = { id: string; date: string; distanceKm: number; durationSec: number; averageSpeed: number; steps: number; route: Coordinate[] };
const RUNS_KEY = '@runforge/runs';
const LANGUAGE_KEY = '@runforge/language';
const DEFAULT_REGION = { latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.04, longitudeDelta: 0.04 };

export default function HistoryTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = React.useState<Language>('tr');
  const t = React.useCallback((key: CopyKey) => translate(language, key), [language]);
  const [runs, setRuns] = React.useState<RunRecord[]>([]);
  const [selected, setSelected] = React.useState<RunRecord | null>(null);

  const load = React.useCallback(async () => {
    const [storedLanguage, storedRuns] = await Promise.all([AsyncStorage.getItem(LANGUAGE_KEY), AsyncStorage.getItem(RUNS_KEY)]);
    if (storedLanguage && ['tr', 'en', 'de', 'fr', 'es'].includes(storedLanguage)) setLanguage(storedLanguage as Language);
    if (storedRuns) {
      try { const parsed = JSON.parse(storedRuns) as RunRecord[]; setRuns(parsed); setSelected(parsed[0] ?? null); } catch { setRuns([]); }
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const totalDistance = runs.reduce((sum, run) => sum + run.distanceKm, 0);
  const totalTime = runs.reduce((sum, run) => sum + run.durationSec, 0);
  const region = selected?.route[0] ? { ...DEFAULT_REGION, ...selected.route[0] } : DEFAULT_REGION;
  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.mapArea}>
        {Platform.OS === 'web' ? <View style={[styles.webMap, { backgroundColor: colors.card }]}><View style={[styles.webArc, { borderColor: colors.primary }]} /><Ionicons name="map" size={17} color={colors.primary} /><Text style={[styles.webMapText, { color: colors.primary }]}>{t('satellite')}</Text></View> : <MapView style={StyleSheet.absoluteFill} mapType="satellite" region={region} showsUserLocation={false} rotateEnabled={false} pitchEnabled={false}>{selected?.route.length && selected.route.length > 1 ? <Polyline coordinates={selected.route} strokeColor={colors.primary} strokeWidth={5} lineCap="round" /> : null}{selected?.route[0] ? <Marker coordinate={selected.route[0]}><View style={[styles.marker, { backgroundColor: colors.primary, borderColor: colors.background }]}><Ionicons name="flag" size={12} color={colors.primaryForeground} /></View></Marker> : null}</MapView>}
        <View style={[styles.mapTop, { paddingTop: insets.top + 14 }]}><View><Text style={[styles.eyebrow, { color: colors.primary }]}>{t('history')}</Text><Text style={[styles.title, { color: colors.foreground }]}>{t('route')}</Text></View><Pressable onPress={() => setLanguage(language === 'tr' ? 'en' : language === 'en' ? 'de' : language === 'de' ? 'fr' : language === 'fr' ? 'es' : 'tr')} style={[styles.langButton, { borderColor: `${colors.primary}66`, backgroundColor: `${colors.background}CC` }]}><Text style={[styles.langText, { color: colors.primary }]}>{languageLabels[language]}</Text></Pressable></View>
        {selected ? <View style={[styles.selectedMetric, { backgroundColor: `${colors.background}D9`, borderColor: `${colors.primary}55` }]}><Text style={[styles.selectedDistance, { color: colors.primary }]}>{selected.distanceKm.toFixed(2)} {t('kilometers')}</Text><Text style={[styles.selectedMeta, { color: colors.foreground }]}>{formatTime(selected.durationSec)} · {selected.averageSpeed.toFixed(1)} {t('kilometersPerHour')}</Text></View> : null}
      </View>
      <View style={[styles.bottomSheet, { backgroundColor: `${colors.background}F4`, borderColor: `${colors.primary}40`, paddingBottom: insets.bottom + 16 }]}><View style={styles.handle} /><View style={styles.totalRow}><View><Text style={[styles.sheetTitle, { color: colors.foreground }]}>{t('history')}</Text><Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>{runs.length} · {totalDistance.toFixed(1)} {t('kilometers')} · {formatTime(totalTime)}</Text></View><Ionicons name="analytics-outline" size={23} color={colors.primary} /></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>{runs.length === 0 ? <View style={styles.empty}><Ionicons name="footsteps-outline" size={26} color={colors.mutedForeground} /><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('noRuns')}</Text></View> : runs.map((run) => <Pressable key={run.id} onPress={() => setSelected(run)} style={[styles.runRow, { borderColor: selected?.id === run.id ? colors.primary : colors.border, backgroundColor: selected?.id === run.id ? `${colors.primary}12` : colors.card }]}><View style={[styles.runIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="navigate-outline" size={18} color={colors.primary} /></View><View style={styles.runCopy}><Text style={[styles.runDate, { color: colors.foreground }]}>{new Date(run.date).toLocaleDateString(localeFor(language), { day: 'numeric', month: 'short' })}</Text><Text style={[styles.runMeta, { color: colors.mutedForeground }]}>{formatTime(run.durationSec)} · {run.averageSpeed.toFixed(1)} {t('kilometersPerHour')}</Text></View><Text style={[styles.runDistance, { color: colors.primary }]}>{run.distanceKm.toFixed(2)} {t('kilometers')}</Text></Pressable>)}</ScrollView></View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  mapArea: { flex: 1, position: 'relative', overflow: 'hidden' },
  webMap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  webArc: { position: 'absolute', width: 170, height: 95, borderWidth: 4, borderLeftColor: 'transparent', borderBottomColor: 'transparent', borderRadius: 80, transform: [{ rotate: '-20deg' }] },
  webMapText: { position: 'absolute', bottom: 19, left: 18, fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 },
  mapTop: { position: 'absolute', top: 0, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 27, marginTop: 4 },
  langButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  langText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  selectedMetric: { position: 'absolute', top: 116, left: 20, borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, paddingVertical: 10 },
  selectedDistance: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  selectedMeta: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 3 },
  bottomSheet: { maxHeight: '48%', borderTopWidth: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF55', marginBottom: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  sheetTitle: { fontFamily: 'Inter_700Bold', fontSize: 21 },
  sheetSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  list: { gap: 9, paddingBottom: 10 },
  empty: { minHeight: 90, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'center' },
  runRow: { minHeight: 67, borderWidth: 1, borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  runIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  runCopy: { flex: 1 },
  runDate: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  runMeta: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
  runDistance: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  marker: { width: 25, height: 25, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});