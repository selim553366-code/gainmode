import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@/components/AppIcon';
import { createGoalProjection, useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, EmptyState, Header, Screen, SectionTitle } from '@/components/FitUI';

export default function ProgressScreen() {
  const colors = useColors();
  const { language, weight, weightLogs, addWeight, profile, calorieGoal, workouts, goalWeight, goalProjection } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [draftWeight, setDraftWeight] = React.useState('');
  const saveWeight = () => { const value = Number(draftWeight); if (value > 0) { addWeight(value); setDraftWeight(''); } };
  const points = weightLogs.slice(-7);
  const min = Math.min(...points.map((item) => item.value), weight ?? 0);
  const max = Math.max(...points.map((item) => item.value), weight ?? 1);
  const span = Math.max(max - min, 1);
  const completed = workouts.filter((item) => item.completed).length;
  const projection = goalProjection ?? (profile && calorieGoal ? createGoalProjection(profile, calorieGoal, workouts, goalWeight ?? undefined) : null);
  const projectionChange = projection && projection.direction === 'loss' ? `−${projection.weeklyChangeKg.toFixed(1)}` : projection && projection.direction === 'gain' ? `+${projection.weeklyChangeKg.toFixed(1)}` : '0.0';
  return <Screen>
    <Header eyebrow="Insights" title={t('progressTitle')} subtitle={t('progressSubtitle')} action="share-outline" onAction={() => undefined} />
    <Card style={styles.addCard}><TextInput value={draftWeight} onChangeText={setDraftWeight} keyboardType="decimal-pad" placeholder={t('currentWeight')} placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} /><Pressable onPress={saveWeight} style={[styles.addButton, { backgroundColor: colors.primary }]}><Ionicons name="add" size={19} color={colors.primaryForeground} /></Pressable></Card>
    {projection ? <Card style={[styles.projectionCard, { backgroundColor: colors.card, borderColor: `${colors.primary}45` }]}>
      <View style={styles.projectionHeader}>
        <View style={[styles.projectionIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="analytics-outline" size={20} color={colors.primary} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.projectionTitle, { color: colors.foreground }]}>{t('projectionTitle')}</Text><Text style={[styles.projectionSubtitle, { color: colors.mutedForeground }]}>{t('projectionSubtitle')}</Text></View>
      </View>
      <View style={styles.projectionStats}>
        <View style={styles.projectionStat}><Text style={[styles.projectionValue, { color: colors.foreground }]}>{projection.targetWeightKg.toFixed(1)} kg</Text><Text style={[styles.projectionLabel, { color: colors.mutedForeground }]}>{t('projectionTarget')}</Text></View>
        <View style={styles.projectionStat}><Text style={[styles.projectionValue, { color: colors.primary }]}>{projectionChange} kg</Text><Text style={[styles.projectionLabel, { color: colors.mutedForeground }]}>{t('projectionWeeklyChange')}</Text></View>
        <View style={styles.projectionStat}><Text style={[styles.projectionValue, { color: colors.foreground }]}>{projection.estimatedWeeks} {t('projectionWeeks')}</Text><Text style={[styles.projectionLabel, { color: colors.mutedForeground }]}>{projection.estimatedMonths} {t('projectionMonths')}</Text></View>
      </View>
      <View style={[styles.projectionNote, { backgroundColor: `${colors.primary}0d` }]}><Ionicons name="information-circle-outline" size={16} color={colors.primary} /><Text style={[styles.projectionNoteText, { color: colors.mutedForeground }]}>{t('projectionAssumption')}</Text></View>
    </Card> : null}
    {weightLogs.length === 0 ? <EmptyState icon="analytics-outline" title={t('noData')} text={t('noProgress')} /> : <><Card style={styles.chartCard}><View style={styles.chartHeader}><View><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('currentWeight')}</Text><Text style={[styles.weight, { color: colors.foreground }]}>{weight?.toFixed(1)} <Text style={styles.unit}>kg</Text></Text></View><Text style={[styles.caption, { color: colors.mutedForeground }]}>{weightLogs.length} {t('add').toLowerCase()}</Text></View><View style={styles.chart}>{points.map((point) => <View key={point.id} style={styles.chartColumn}><View style={[styles.bar, { height: 22 + ((point.value - min) / span) * 78, backgroundColor: point.id === points[points.length - 1].id ? colors.primary : `${colors.primary}55` }]} /></View>)}</View></Card><View style={styles.statsRow}><Stat value={`${completed}`} label={t('completed')} color={colors.primary} icon="checkmark-circle-outline" /><Stat value={`${weightLogs.length}`} label={t('currentWeight')} color={colors.blue} icon="scale-outline" /><Stat value={weight ? `${Math.abs((weight - (weightLogs[0]?.value ?? weight))).toFixed(1)} kg` : '—'} label={t('thisMonth')} color={colors.success} icon="trending-down" /></View></>}
    <SectionTitle title={t('personalRecords')} />
    <Card style={styles.emptyCard}><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('noProgress')}</Text></Card>
  </Screen>;
}

function Stat({ value, label, color, icon }: { value: string; label: string; color: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  const colors = useColors();
  return <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name={icon} size={17} color={color} /><Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  addCard: { padding: 10, flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, height: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontFamily: 'Inter_400Regular', fontSize: 12 },
  addButton: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  projectionCard: { padding: 16, marginBottom: 16, borderWidth: 1 },
  projectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  projectionIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  projectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  projectionSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 3 },
  projectionStats: { flexDirection: 'row', gap: 8, marginTop: 18 },
  projectionStat: { flex: 1, minHeight: 65, justifyContent: 'center' },
  projectionValue: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  projectionLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14, marginTop: 5 },
  projectionNote: { flexDirection: 'row', gap: 7, padding: 10, borderRadius: 12, marginTop: 15 },
  projectionNoteText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15 },
  chartCard: { padding: 20 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  weight: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: -1.4, marginTop: 4 },
  unit: { fontFamily: 'Inter_500Medium', fontSize: 13, letterSpacing: 0 },
  chart: { height: 125, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', marginTop: 22 },
  chartColumn: { height: 110, width: 20, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: 12, borderRadius: 7 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  stat: { flex: 1, minHeight: 92, borderRadius: 18, borderWidth: 1, padding: 12 },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 12 },
  emptyCard: { padding: 17 },
});