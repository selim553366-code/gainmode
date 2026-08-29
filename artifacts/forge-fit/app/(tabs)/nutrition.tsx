import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFit, Meal } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, EmptyState, Header, Pill, ProgressBar, Screen, SectionTitle } from '@/components/FitUI';

export default function NutritionScreen() {
  const colors = useColors();
  const { language, meals, calorieGoal, addMeal, removeMeal, photoAnalysesUsed, incrementPhotoUsage } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [range, setRange] = React.useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showForm, setShowForm] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [photoUri, setPhotoUri] = React.useState<string | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [draft, setDraft] = React.useState({ name: '', calories: '', protein: '', carbs: '', fat: '', type: 'breakfast' as Meal['type'] });
  const calories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const foodCatalog = [
    { name: 'Chicken rice bowl', calories: 560, protein: 42, carbs: 58, fat: 14 },
    { name: 'Greek yogurt', calories: 170, protein: 17, carbs: 12, fat: 5 },
    { name: 'Oatmeal with banana', calories: 340, protein: 11, carbs: 57, fat: 9 },
    { name: 'Egg sandwich', calories: 390, protein: 23, carbs: 34, fat: 18 },
    { name: 'Protein shake', calories: 220, protein: 30, carbs: 14, fat: 5 },
    { name: 'Apple', calories: 95, protein: 1, carbs: 25, fat: 0 },
    { name: 'Iced coffee', calories: 80, protein: 3, carbs: 10, fat: 3 },
    { name: 'Granola bar', calories: 190, protein: 5, carbs: 29, fat: 7 },
  ];
  const foodResults = search.trim() ? foodCatalog.filter((food) => food.name.toLowerCase().includes(search.toLowerCase())) : [];
  const pickPhoto = async (camera = false) => {
    if (photoAnalysesUsed >= 5) { Alert.alert(t('premiumOnly'), t('photoLimitReached')); return; }
    const result = camera ? await ImagePicker.launchCameraAsync({ quality: 0.65, base64: true }) : await ImagePicker.launchImageLibraryAsync({ quality: 0.65, base64: true });
    const asset = result.canceled ? undefined : result.assets?.[0];
    if (!asset) return;
    setPhotoUri(asset.uri);
    if (!asset.base64) { Alert.alert(t('scanMeal'), t('photoComing')); return; }
    setAnalyzing(true);
    try {
      const response = await fetch(`https://${process.env.EXPO_PUBLIC_DOMAIN}/api/ai/food-analysis`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageData: asset.base64, language }) });
      if (!response.ok) throw new Error('analysis failed');
      const analyzed = await response.json() as Meal;
      addMeal({ name: analyzed.name, type: 'snack', calories: analyzed.calories, protein: analyzed.protein, carbs: analyzed.carbs, fat: analyzed.fat, imageUri: asset.uri });
      incrementPhotoUsage();
      Alert.alert(t('analyzePhoto'), t('foodAdded'));
    } catch {
      Alert.alert(t('analyzePhoto'), t('photoComing'));
    } finally {
      setAnalyzing(false);
    }
  };
  const addCatalogFood = (food: typeof foodCatalog[number]) => {
    addMeal({ ...food, type: 'snack' });
    setSearch('');
    Alert.alert(t('addFood'), t('foodAdded'));
  };
  const saveMeal = () => {
    const calories = Number(draft.calories);
    if (!draft.name.trim() || !Number.isFinite(calories) || calories <= 0) {
      Alert.alert(t('logMeal'), t('mealName'));
      return;
    }
    addMeal({ name: draft.name.trim(), type: draft.type, calories, protein: Number(draft.protein) || 0, carbs: Number(draft.carbs) || 0, fat: Number(draft.fat) || 0 });
    setDraft({ name: '', calories: '', protein: '', carbs: '', fat: '', type: 'breakfast' });
    setShowForm(false);
    Alert.alert(t('logMeal'), t('mealAdded'));
  };
  const grouped: Meal['type'][] = ['breakfast', 'lunch', 'dinner', 'snack'];
  return <Screen>
    <Header eyebrow="Fuel / 01" title={t('nutritionTitle')} subtitle={t('nutritionSubtitle')} action="ellipsis-horizontal" onAction={() => Alert.alert(t('nutrition'), t('premiumDesc'))} />
    <View style={styles.rangeRow}><Pill label={t('daily')} active={range === 'daily'} onPress={() => setRange('daily')} /><Pill label={t('weekly')} active={range === 'weekly'} onPress={() => setRange('weekly')} /><Pill label={t('monthly')} active={range === 'monthly'} onPress={() => setRange('monthly')} /></View>
    <Card style={styles.summaryCard}>
      <View style={styles.summaryTop}><View><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('calories')}</Text><Text style={[styles.summaryNumber, { color: colors.foreground }]}>{calories.toLocaleString()} <Text style={styles.summaryUnit}>{t('caloriesShort')}</Text></Text></View><View style={[styles.summaryBadge, { backgroundColor: `${colors.success}22` }]}><Ionicons name="checkmark-circle" size={15} color={colors.success} /><Text style={[styles.badgeText, { color: colors.success }]}>{calorieGoal ? `${Math.round((calories / calorieGoal) * 100)}%` : '—'}</Text></View></View>
      <ProgressBar value={calorieGoal ? calories / calorieGoal : 0} />
      <View style={styles.summaryFooter}><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('remaining')}</Text><Text style={[styles.footerValue, { color: colors.foreground }]}>{calorieGoal ? `${Math.max(calorieGoal - calories, 0)} ${t('caloriesShort')}` : '—'}</Text></View>
    </Card>
    <View style={styles.scanRow}>
      <Pressable testID="camera-scan" onPress={() => pickPhoto(true)} style={({ pressed }) => [styles.scanButton, { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="camera-outline" size={19} color={colors.primaryForeground} /><Text style={[styles.scanText, { color: colors.primaryForeground }]}>{t('scanMeal')}</Text></Pressable>
      <Pressable testID="gallery-scan" onPress={() => pickPhoto(false)} style={({ pressed }) => [styles.scanButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="images-outline" size={19} color={colors.foreground} /><Text style={[styles.scanText, { color: colors.foreground }]}>{t('add')}</Text></Pressable>
    </View>
    {photoUri ? <Card style={styles.photoCard}><Image source={{ uri: photoUri }} style={styles.photo} /><View style={{ flex: 1 }}><Text style={[styles.mealName, { color: colors.foreground }]}>{analyzing ? t('analyzing') : t('analyzePhoto')}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{photoAnalysesUsed} / 5 {t('photoLimit')}</Text></View></Card> : null}
    <Card style={styles.searchCard}><View style={styles.searchRow}><Ionicons name="search-outline" size={18} color={colors.mutedForeground} /><TextInput value={search} onChangeText={setSearch} placeholder={t('searchPlaceholder')} placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} /></View>{search && foodResults.length === 0 ? <Text style={[styles.noResults, { color: colors.mutedForeground }]}>{t('noFoodResults')}</Text> : foodResults.map((food) => <Pressable key={food.name} onPress={() => addCatalogFood(food)} style={styles.resultRow}><View style={{ flex: 1 }}><Text style={[styles.mealName, { color: colors.foreground }]}>{food.name}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{food.calories} {t('caloriesShort')}  •  {food.protein}g {t('protein').toLowerCase()}</Text></View><Ionicons name="add-circle-outline" size={21} color={colors.primary} /></Pressable>)}</Card>
    <SectionTitle title={t('nutritionTitle')} action={t('logMeal')} onAction={() => setShowForm((current) => !current)} />
    {showForm ? <Card style={styles.formCard}>
      <TextInput value={draft.name} onChangeText={(value) => setDraft((current) => ({ ...current, name: value }))} placeholder={t('mealName')} placeholderTextColor={colors.mutedForeground} style={[styles.formInput, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]} />
      <View style={styles.formRow}>{(['calories', 'protein', 'carbs', 'fat'] as const).map((field) => <TextInput key={field} value={draft[field]} onChangeText={(value) => setDraft((current) => ({ ...current, [field]: value }))} keyboardType="decimal-pad" placeholder={field === 'calories' ? t('mealCalories') : t(field)} placeholderTextColor={colors.mutedForeground} style={[styles.smallInput, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]} />)}</View>
      <View style={styles.formTypes}>{grouped.map((type) => <Pill key={type} label={t(type)} active={draft.type === type} onPress={() => setDraft((current) => ({ ...current, type }))} />)}</View>
      <Pressable testID="save-meal" onPress={saveMeal} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}><Text style={[styles.saveText, { color: colors.primaryForeground }]}>{t('saveMeal')}</Text></Pressable>
    </Card> : null}
    {grouped.map((type) => {
      const typeMeals = meals.filter((meal) => meal.type === type);
      const total = typeMeals.reduce((sum, meal) => sum + meal.calories, 0);
      return <Card key={type} style={styles.mealCard}>
        <View style={styles.mealHeader}><View style={[styles.mealIcon, { backgroundColor: `${type === 'snack' ? colors.plum : colors.orange}20` }]}><Ionicons name={type === 'snack' ? 'nutrition-outline' : 'restaurant-outline'} size={19} color={type === 'snack' ? colors.plum : colors.orange} /></View><View style={{ flex: 1 }}><Text style={[styles.mealTitle, { color: colors.foreground }]}>{t(type)}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{total} {t('caloriesShort')}  •  {typeMeals.length} {t('add').toLowerCase()}</Text></View><Pressable testID={`add-${type}`} onPress={() => { setShowForm(true); setDraft((current) => ({ ...current, type })); }} style={[styles.smallAdd, { backgroundColor: colors.secondary }]}><Ionicons name="add" size={18} color={colors.primary} /></Pressable></View>
        {typeMeals.length > 0 ? typeMeals.map((meal) => <View key={meal.id} style={[styles.mealLine, { borderTopColor: colors.border }]}>{meal.imageUri ? <Image source={{ uri: meal.imageUri }} style={styles.mealThumb} /> : null}<View style={{ flex: 1 }}><Text style={[styles.mealName, { color: colors.foreground }]}>{meal.name}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{meal.protein}g {t('protein').toLowerCase()}  •  {meal.carbs}g {t('carbs').toLowerCase()}</Text></View><View style={styles.mealActions}><Text style={[styles.mealKcal, { color: colors.foreground }]}>{meal.calories}</Text><Pressable onPress={() => removeMeal(meal.id)}><Ionicons name="close-circle-outline" size={18} color={colors.mutedForeground} /></Pressable></View></View>) : <Text style={[styles.emptyMeal, { color: colors.mutedForeground }]}>{t('noMeals')}</Text>}
      </Card>;
    })}
  </Screen>;
}

const styles = StyleSheet.create({
  rangeRow: { flexDirection: 'row', marginBottom: 14 },
  summaryCard: { padding: 20 },
  formCard: { padding: 15 },
  formInput: { height: 46, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 10 },
  formRow: { flexDirection: 'row', gap: 7 },
  smallInput: { flex: 1, minWidth: 0, height: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 9, fontFamily: 'Inter_400Regular', fontSize: 11 },
  formTypes: { flexDirection: 'row', marginVertical: 12 },
  saveButton: { height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  photoCard: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  photo: { width: 58, height: 58, borderRadius: 15 },
  mealThumb: { width: 42, height: 42, borderRadius: 12, marginRight: 10 },
  searchCard: { padding: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, height: 38, fontFamily: 'Inter_400Regular', fontSize: 12 },
  resultRow: { borderTopWidth: 1, borderTopColor: '#1D3B5E', paddingTop: 12, marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  noResults: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 12 },
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
  mealLine: { borderTopWidth: 1, paddingTop: 13, marginTop: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealName: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  mealActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mealKcal: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  emptyMeal: { fontFamily: 'Inter_400Regular', fontSize: 12, paddingTop: 15 },
});