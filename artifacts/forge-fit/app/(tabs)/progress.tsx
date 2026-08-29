import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, Header, Pill, Screen, SectionTitle } from '@/components/FitUI';

export default function ProgressScreen() {
  const colors = useColors();
  const { language, weight } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const points = [0.68, 0.76, 0.62, 0.83, 0.8, 0.9, 0.95];
  return <Screen>
    <Header eyebrow="Insights / 06" title={t('progressTitle')} subtitle={t('progressSubtitle')} action="share-outline" onAction={() => Alert.alert(t('progressTitle'), t('online'))} />
    <Card style={styles.chartCard}>
      <View style={styles.chartHeader}><View><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('currentWeight')}</Text><Text style={[styles.weight, { color: colors.foreground }]}>{weight.toFixed(1)} <Text style={styles.unit}>kg</Text></Text></View><Pill label={t('thisMonth')} active /></View>
      <View style={styles.chart}><View style={[styles.gridLine, { backgroundColor: colors.border, top: 10 }]} /><View style={[styles.gridLine, { backgroundColor: colors.border, top: 57 }]} /><View style={[styles.gridLine, { backgroundColor: colors.border, top: 104 }]} />{points.map((point, index) => <View key={index} style={styles.chartColumn}><View style={[styles.bar, { height: point * 92, backgroundColor: index === points.length - 1 ? colors.primary : `${colors.primary}55` }]} /></View>)}</View>
      <View style={styles.days}>{['1', '6', '11', '16', '21', '26', '29'].map((day) => <Text key={day} style={[styles.caption, { color: colors.mutedForeground }]}>{day}</Text>)}</View>
    </Card>
    <View style={styles.statsRow}><Stat value="-2.8 kg" label={t('thisMonth')} color={colors.success} icon="trending-down" /><Stat value="86%" label={t('completed')} color={colors.primary} icon="checkmark-circle-outline" /><Stat value="14" label={t('bestStreak')} color={colors.orange} icon="flame-outline" /></View>
    <SectionTitle title={t('personalRecords')} action={t('viewAll')} onAction={() => Alert.alert(t('personalRecords'), t('progressSubtitle'))} />
    <Card style={styles.recordCard}><Record icon="barbell-outline" title="Bench press" value="72.5 kg" delta="+ 5 kg" /><Record icon="timer-outline" title="Plank" value="02:45" delta="+ 28s" /><Record icon="trophy-outline" title="Workout streak" value="14 days" delta="Best" /></Card>
    <Card style={[styles.checkCard, { backgroundColor: colors.secondary }]}><View style={[styles.checkOrb, { backgroundColor: colors.primary }]}><Ionicons name="sparkles" size={19} color={colors.primaryForeground} /></View><View style={{ flex: 1 }}><Text style={[styles.recordTitle, { color: colors.foreground }]}>AI Check</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('progressSubtitle')}</Text></View><Ionicons name="arrow-forward" size={18} color={colors.primary} /></Card>
  </Screen>;
}

function Stat({ value, label, color, icon }: { value: string; label: string; color: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  const colors = useColors();
  return <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name={icon} size={17} color={color} /><Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

function Record({ icon, title, value, delta }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; value: string; delta: string }) {
  const colors = useColors();
  return <View style={styles.record}><View style={[styles.recordIcon, { backgroundColor: colors.secondary }]}><Ionicons name={icon} size={18} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.recordTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{delta}</Text></View><Text style={[styles.recordValue, { color: colors.foreground }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  chartCard: { padding: 20 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  weight: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: -1.4, marginTop: 4 },
  unit: { fontFamily: 'Inter_500Medium', fontSize: 13, letterSpacing: 0 },
  chart: { height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', marginTop: 22, position: 'relative' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1 },
  chartColumn: { height: 110, width: 17, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: 10, borderRadius: 7 },
  days: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 7 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  stat: { flex: 1, minHeight: 92, borderRadius: 18, borderWidth: 1, padding: 12 },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 12 },
  recordCard: { padding: 15 },
  record: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  recordIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  recordTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  recordValue: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  checkCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
  checkOrb: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});