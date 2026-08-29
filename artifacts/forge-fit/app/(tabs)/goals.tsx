import React from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFit } from '@/context/FitContext';
import { languageLabels, Language, translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, Header, Screen, SectionTitle } from '@/components/FitUI';

export default function GoalsScreen() {
  const colors = useColors();
  const { language, setLanguage } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [notifications, setNotifications] = React.useState(true);
  return <Screen>
    <Header eyebrow="Personalize / 08" title={t('goalsTitle')} subtitle={t('goalsSubtitle')} action="settings-outline" onAction={() => Alert.alert(t('goalsTitle'), t('goalsSubtitle'))} />
    <SectionTitle title={t('dailyTargets')} />
    <Card style={styles.targetCard}><Target icon="flame-outline" label={t('calories')} value="2,050 kcal" color={colors.orange} /><Target icon="barbell-outline" label={t('protein')} value="160 g" color={colors.blue} /><Target icon="scale-outline" label={t('goalWeight')} value="65.0 kg" color={colors.success} /></Card>
    <SectionTitle title={t('activity')} />
    <Card style={styles.levelCard}><View style={styles.levelHeader}><View style={[styles.levelIcon, { backgroundColor: `${colors.primary}20` }]}><Ionicons name="trending-up-outline" size={18} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.itemTitle, { color: colors.foreground }]}>Active</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>4–5 {t('plan').toLowerCase()} / week</Text></View><Ionicons name="chevron-forward" size={17} color={colors.mutedForeground} /></View></Card>
    <SectionTitle title={t('changeLanguage')} />
    <Card style={styles.languageCard}><Text style={[styles.choose, { color: colors.mutedForeground }]}>{t('chooseLanguage')}</Text>{(Object.keys(languageLabels) as Language[]).map((item) => <Pressable key={item} onPress={() => setLanguage(item)} style={styles.languageRow}><Text style={[styles.languageText, { color: colors.foreground }]}>{languageLabels[item]}</Text>{language === item ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : <View style={[styles.radio, { borderColor: colors.border }]} />}</Pressable>)}</Card>
    <Card style={styles.preference}><Ionicons name="notifications-outline" size={19} color={colors.primary} /><Text style={[styles.itemTitle, { color: colors.foreground, flex: 1 }]}>{t('notifications')}</Text><Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: colors.secondary, true: colors.primary }} thumbColor={notifications ? colors.primaryForeground : colors.mutedForeground} /></Card>
  </Screen>;
}

function Target({ icon, label, value, color }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string; color: string }) {
  const colors = useColors();
  return <View style={styles.target}><View style={[styles.targetIcon, { backgroundColor: `${color}20` }]}><Ionicons name={icon} size={17} color={color} /></View><Text style={[styles.caption, { color: colors.mutedForeground }]}>{label}</Text><Text style={[styles.targetValue, { color: colors.foreground }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  targetCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  target: { flex: 1, alignItems: 'flex-start' },
  targetIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  targetValue: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 5 },
  levelCard: { padding: 15 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  languageCard: { padding: 16 },
  choose: { fontFamily: 'Inter_400Regular', fontSize: 12, marginBottom: 9 },
  languageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  languageText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  radio: { width: 19, height: 19, borderWidth: 1, borderRadius: 10 },
  preference: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
});