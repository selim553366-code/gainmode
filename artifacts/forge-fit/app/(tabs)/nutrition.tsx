import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFit, Meal } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, EmptyState, Header, Pill, ProgressBar, Screen, SectionTitle } from '@/components/FitUI';

export default function NutritionScreen() {
  const colors = useColors();
  const { language, meals, addMeal, removeMeal, calories } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [range, setRange] = React.useState<'daily' | 'weekly' | 'monthly'>('daily');
  const pickPhoto = async (camera = false) => {
    const result = camera ? await ImagePicker.launchCameraAsync({ quality: 0.8 }) : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) Alert.alert(t('scanMeal'), t('photoComing'));
  };
  const grouped: Meal['type'][] = ['breakfast', 'lunch', 'dinner', 'snack'];
  return <Screen>
    <Header eyebrow="Fuel / 01" title={t('nutritionTitle')} subtitle={t('nutritionSubtitle')} action="ellipsis-horizontal" onAction={() => Alert.alert(t('nutrition'), t('premiumDesc'))} />
    <View style={styles.rangeRow}><Pill label={t('daily')} active={range === 'daily'} onPress={() => setRange('daily')} /><Pill label={t('weekly')} active={range === 'weekly'} onPress={() => setRange('weekly')} /><Pill label={t('monthly')} active={range === 'monthly'} onPress={() => setRange('monthly')} /></View>
    <Card style={styles.summaryCard}>
      <View style={styles.summaryTop}><View><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('calories')}</Text><Text style={[styles.summaryNumber, { color: colors.foreground }]}>{calories.toLocaleString()} <Text style={styles.summaryUnit}>{t('caloriesShort')}</Text></Text></View><View style={[styles.summaryBadge, { backgroundColor: `${colors.success}22` }]}><Ionicons name="checkmark-circle" size={15} color={colors.success} /><Text style={[styles.badgeText, { color: colors.success }]}>61%</Text></View></View>
      <ProgressBar value={calories / 2050} />
      <View style={styles.summaryFooter}><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('remaining')}</Text><Text style={[styles.footerValue, { color: colors.foreground }]}>{Math.max(2050 - calories, 0)} {t('caloriesShort')}</Text></View>
    </Card>
    <View style={styles.scanRow}>
      <Pressable testID="camera-scan" onPress={() => pickPhoto(true)} style={({ pressed }) => [styles.scanButton, { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="camera-outline" size={19} color={colors.primaryForeground} /><Text style={[styles.scanText, { color: colors.primaryForeground }]}>{t('scanMeal')}</Text></Pressable>
      <Pressable testID="gallery-scan" onPress={() => pickPhoto(false)} style={({ pressed }) => [styles.scanButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="images-outline" size={19} color={colors.foreground} /><Text style={[styles.scanText, { color: colors.foreground }]}>{t('add')}</Text></Pressable>
    </View>
    <SectionTitle title={t('nutritionTitle')} action={t('viewAll')} onAction={() => Alert.alert(t('nutritionTitle'), t('addFirstMeal'))} />
    {grouped.map((type) => {
      const typeMeals = meals.filter((meal) => meal.type === type);
      const total = typeMeals.reduce((sum, meal) => sum + meal.calories, 0);
      return <Card key={type} style={styles.mealCard}>
        <View style={styles.mealHeader}><View style={[styles.mealIcon, { backgroundColor: `${type === 'snack' ? colors.plum : colors.orange}20` }]}><Ionicons name={type === 'snack' ? 'nutrition-outline' : 'restaurant-outline'} size={19} color={type === 'snack' ? colors.plum : colors.orange} /></View><View style={{ flex: 1 }}><Text style={[styles.mealTitle, { color: colors.foreground }]}>{t(type)}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{total} {t('caloriesShort')}  •  {typeMeals.length} {t('add').toLowerCase()}</Text></View><Pressable testID={`add-${type}`} onPress={() => addMeal(type)} style={[styles.smallAdd, { backgroundColor: colors.secondary }]}><Ionicons name="add" size={18} color={colors.primary} /></Pressable></View>
        {typeMeals.length > 0 ? typeMeals.map((meal) => <View key={meal.id} style={styles.mealLine}><View><Text style={[styles.mealName, { color: colors.foreground }]}>{t(meal.type)}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{meal.protein}g {t('protein').toLowerCase()}  •  {meal.carbs}g {t('carbs').toLowerCase()}</Text></View><View style={styles.mealActions}><Text style={[styles.mealKcal, { color: colors.foreground }]}>{meal.calories}</Text><Pressable onPress={() => removeMeal(meal.id)}><Ionicons name="close-circle-outline" size={18} color={colors.mutedForeground} /></Pressable></View></View>) : <Text style={[styles.emptyMeal, { color: colors.mutedForeground }]}>{t('noMeals')}</Text>}
      </Card>;
    })}
  </Screen>;
}

const styles = StyleSheet.create({
  rangeRow: { flexDirection: 'row', marginBottom: 14 },
  summaryCard: { padding: 20 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  summaryNumber: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: -1.2, marginTop: 5 },
  summaryUnit: { fontFamily: 'Inter_500Medium', fontSize: 13, letterSpacing: 0 },
  summaryBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14 },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  summaryFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 11 },
  footerValue: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  scanRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  scanButton: { flex: 1, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  scanText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  mealCard: { padding: 16 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mealIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mealTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  smallAdd: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  mealLine: { borderTopWidth: 1, borderTopColor: '#2B332D', paddingTop: 13, marginTop: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealName: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  mealActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mealKcal: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  emptyMeal: { fontFamily: 'Inter_400Regular', fontSize: 12, paddingTop: 15 },
});