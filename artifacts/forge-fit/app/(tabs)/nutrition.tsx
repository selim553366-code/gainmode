import React from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@/components/AppIcon';
import { useSearchFood, type FoodSearchItem } from '@workspace/api-client-react';
import { useFit, Meal } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, Header, Pill, ProgressBar, Screen, SectionTitle } from '@/components/FitUI';

const formatNutrition = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);

function BarcodeScanner({ visible, onClose, onScanned, title, hint, permissionText, unavailableText, allowCameraLabel, closeLabel }: { visible: boolean; onClose: () => void; onScanned: (data: string) => void; title: string; hint: string; permissionText: string; unavailableText: string; allowCameraLabel: string; closeLabel: string }) {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const scanLocked = React.useRef(false);

  React.useEffect(() => {
    scanLocked.current = false;
    if (visible && permission && !permission.granted && permission.canAskAgain) requestPermission().catch(() => undefined);
  }, [visible, permission, requestPermission]);

  if (!visible) return null;
  const cameraAvailable = Platform.OS !== 'web';
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
    <View style={[styles.scannerScreen, { backgroundColor: colors.background }]}>
      {cameraAvailable && permission?.granted ? <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'itf14', 'codabar', 'qr'] }}
        onBarcodeScanned={({ data }) => {
          if (scanLocked.current || !data) return;
          scanLocked.current = true;
          onScanned(data);
        }}
      /> : <View style={styles.cameraPermission}><Ionicons name="camera-outline" size={42} color={colors.primary} /><Text style={[styles.scannerTitle, { color: colors.foreground }]}>{cameraAvailable ? permissionText : unavailableText}</Text>{cameraAvailable ? <Pressable onPress={() => requestPermission()} style={[styles.scannerPermissionButton, { backgroundColor: colors.primary }]}><Text style={[styles.scanText, { color: colors.primaryForeground }]}>{allowCameraLabel}</Text></Pressable> : null}</View>}
      {cameraAvailable && permission?.granted ? <View pointerEvents="none" style={styles.scannerShade} /> : null}
      <View style={styles.scannerHeader}><Text style={[styles.scannerTitle, { color: colors.foreground }]}>{title}</Text><Pressable accessibilityLabel={closeLabel} onPress={onClose} style={[styles.scannerClose, { backgroundColor: `${colors.background}CC` }]}><Ionicons name="close" size={22} color={colors.foreground} /></Pressable></View>
      {cameraAvailable && permission?.granted ? <View pointerEvents="none" style={styles.scannerCenter}><View style={[styles.scannerFrame, { borderColor: colors.primary }]} /><Text style={[styles.scannerHint, { color: colors.foreground }]}>{hint}</Text></View> : null}
    </View>
  </Modal>;
}

export default function NutritionScreen() {
  const colors = useColors();
  const { language, meals, calorieGoal, addMeal, removeMeal, photoAnalysesUsed, incrementPhotoUsage } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [range, setRange] = React.useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [photoUri, setPhotoUri] = React.useState<string | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [barcodeScannerVisible, setBarcodeScannerVisible] = React.useState(false);
  const normalizedSearch = search.trim();
  const searchEnabled = debouncedSearch.length >= 2;
  const foodSearch = useSearchFood(
    { q: searchEnabled ? debouncedSearch : '  ', language, limit: 12 },
    { query: { enabled: searchEnabled, staleTime: 5 * 60 * 1000, queryKey: ['food-search', debouncedSearch, language] } },
  );
  const calories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const macros = meals.reduce((totals, meal) => ({
    protein: totals.protein + meal.protein,
    carbs: totals.carbs + meal.carbs,
    fat: totals.fat + meal.fat,
  }), { protein: 0, carbs: 0, fat: 0 });

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(normalizedSearch), 350);
    return () => clearTimeout(timeout);
  }, [normalizedSearch]);

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

  const addFood = (food: FoodSearchItem) => {
    addMeal({ name: food.name, type: 'snack', calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat });
    setSearch('');
    setDebouncedSearch('');
    Alert.alert(t('addFood'), t('foodAdded'));
  };
  const handleBarcode = (data: string) => {
    setBarcodeScannerVisible(false);
    setSearch(data);
    setDebouncedSearch(data);
    Alert.alert(t('barcodeFound'), data);
  };

  const loggedMeals = [...meals].reverse();

  return <Screen>
    <Header eyebrow="Fuel / 01" title={t('nutritionTitle')} subtitle={t('nutritionSubtitle')} action="ellipsis-horizontal" onAction={() => Alert.alert(t('nutrition'), t('premiumDesc'))} />
    <View style={styles.rangeRow}><Pill label={t('daily')} active={range === 'daily'} onPress={() => setRange('daily')} /><Pill label={t('weekly')} active={range === 'weekly'} onPress={() => setRange('weekly')} /><Pill label={t('monthly')} active={range === 'monthly'} onPress={() => setRange('monthly')} /></View>
    <Card style={styles.summaryCard}>
      <View style={styles.summaryTop}><View><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('calories')}</Text><Text style={[styles.summaryNumber, { color: colors.foreground }]}>{calories.toLocaleString()} <Text style={styles.summaryUnit}>{t('caloriesShort')}</Text></Text></View><View style={[styles.summaryBadge, { backgroundColor: `${colors.success}22` }]}><Ionicons name="checkmark-circle" size={15} color={colors.success} /><Text style={[styles.badgeText, { color: colors.success }]}>{calorieGoal ? `${Math.round((calories / calorieGoal) * 100)}%` : '—'}</Text></View></View>
      <ProgressBar value={calorieGoal ? calories / calorieGoal : 0} />
      <View style={styles.summaryFooter}><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('remaining')}</Text><Text style={[styles.footerValue, { color: colors.foreground }]}>{calorieGoal ? `${Math.max(calorieGoal - calories, 0)} ${t('caloriesShort')}` : '—'}</Text></View>
      <View style={[styles.macroSummary, { borderTopColor: colors.border }]}>
        <View><Text style={[styles.macroValue, { color: colors.foreground }]}>{formatNutrition(macros.protein)}g</Text><Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>{t('protein')}</Text></View>
        <View><Text style={[styles.macroValue, { color: colors.foreground }]}>{formatNutrition(macros.carbs)}g</Text><Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>{t('carbs')}</Text></View>
        <View><Text style={[styles.macroValue, { color: colors.foreground }]}>{formatNutrition(macros.fat)}g</Text><Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>{t('fat')}</Text></View>
      </View>
    </Card>
    <Card style={styles.captureCard}>
      <View style={[styles.captureFrame, { borderColor: `${colors.primary}70`, backgroundColor: `${colors.primary}0D` }]}>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.captureImage} /> : <><Ionicons name="scan-outline" size={31} color={colors.primary} /><Text style={[styles.capturePlaceholder, { color: colors.mutedForeground }]}>{t('mealCaptureHint')}</Text></>}
      </View>
      {photoUri ? <View style={styles.captureStatus}><Text style={[styles.mealName, { color: colors.foreground }]}>{analyzing ? t('analyzing') : t('analyzePhoto')}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{photoAnalysesUsed} / 5 {t('photoLimit')}</Text></View> : null}
      <View style={styles.captureOptions}>
        <Pressable testID="camera-scan" onPress={() => pickPhoto(true)} style={({ pressed }) => [styles.captureOptionPrimary, { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="camera-outline" size={18} color={colors.primaryForeground} /><Text style={[styles.scanText, { color: colors.primaryForeground }]}>{t('scanMeal')}</Text></Pressable>
        <Pressable testID="barcode-scan" onPress={() => setBarcodeScannerVisible(true)} style={({ pressed }) => [styles.captureOption, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="scan-outline" size={18} color={colors.foreground} /><Text style={[styles.scanText, { color: colors.foreground }]}>{t('scanBarcode')}</Text></Pressable>
        <Pressable testID="gallery-scan" onPress={() => pickPhoto(false)} style={({ pressed }) => [styles.captureOption, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="images-outline" size={18} color={colors.foreground} /><Text style={[styles.scanText, { color: colors.foreground }]}>{t('add')}</Text></Pressable>
      </View>
    </Card>
    <SectionTitle title={t('searchFood')} />
    <Card style={styles.searchCard}>
      <View style={styles.searchRow}><Ionicons name="search-outline" size={18} color={colors.mutedForeground} /><TextInput testID="food-search" value={search} onChangeText={setSearch} placeholder={t('searchPlaceholder')} placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} autoCapitalize="none" returnKeyType="search" />{normalizedSearch ? <Pressable testID="clear-food-search" onPress={() => { setSearch(''); setDebouncedSearch(''); }} hitSlop={8}><Ionicons name="close-circle" size={18} color={colors.mutedForeground} /></Pressable> : null}</View>
      {!normalizedSearch ? <Text style={[styles.searchHint, { color: colors.mutedForeground }]}>{t('searchFoodHint')}</Text> : null}
      {normalizedSearch.length === 1 ? <Text style={[styles.searchHint, { color: colors.mutedForeground }]}>{t('searchTooShort')}</Text> : null}
      {searchEnabled && foodSearch.isLoading ? <View style={styles.stateRow}><ActivityIndicator size="small" color={colors.primary} /><Text style={[styles.searchHint, { color: colors.mutedForeground }]}>{t('searchingFood')}</Text></View> : null}
      {searchEnabled && foodSearch.isError ? <Text style={[styles.searchHint, { color: colors.destructive }]}>{t('foodSearchError')}</Text> : null}
      {searchEnabled && !foodSearch.isLoading && !foodSearch.isError && foodSearch.data?.items.length === 0 ? <Text style={[styles.searchHint, { color: colors.mutedForeground }]}>{t('noFoodResults')}</Text> : null}
      {searchEnabled && !foodSearch.isLoading && !foodSearch.isError ? foodSearch.data?.items.map((food) => <Pressable key={`${food.id}-${food.name}`} onPress={() => addFood(food)} style={({ pressed }) => [styles.resultRow, { borderTopColor: colors.border, opacity: pressed ? 0.65 : 1 }]}><View style={styles.resultContent}><Text style={[styles.mealName, { color: colors.foreground }]}>{food.name}</Text><Text style={[styles.resultServing, { color: colors.mutedForeground }]}>{food.serving}</Text><View style={styles.nutritionLine}><Text style={[styles.nutritionValue, { color: colors.foreground }]}>{food.calories} {t('caloriesShort')}</Text><Text style={[styles.nutritionValue, { color: colors.blue }]}>{formatNutrition(food.protein)}g {t('protein')}</Text><Text style={[styles.nutritionValue, { color: colors.orange }]}>{formatNutrition(food.carbs)}g {t('carbs')}</Text><Text style={[styles.nutritionValue, { color: colors.plum }]}>{formatNutrition(food.fat)}g {t('fat')}</Text></View></View><Ionicons name="add-circle-outline" size={22} color={colors.primary} /></Pressable>) : null}
    </Card>
    <SectionTitle title={t('loggedFoods')} />
    <Card style={styles.mealCard}>
      <View style={styles.mealHeader}><View style={[styles.mealIcon, { backgroundColor: `${colors.orange}20` }]}><Ionicons name="restaurant-outline" size={19} color={colors.orange} /></View><View style={{ flex: 1 }}><Text style={[styles.mealTitle, { color: colors.foreground }]}>{t('loggedFoods')}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{loggedMeals.length} · {calories} {t('caloriesShort')}</Text></View></View>
      {loggedMeals.length > 0 ? loggedMeals.map((meal) => <View key={meal.id} style={[styles.mealLine, { borderTopColor: colors.border }]}>{meal.imageUri ? <Image source={{ uri: meal.imageUri }} style={styles.mealThumb} /> : null}<View style={{ flex: 1 }}><Text style={[styles.mealName, { color: colors.foreground }]}>{meal.name}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{meal.protein}g {t('protein')}  ·  {meal.carbs}g {t('carbs')}  ·  {meal.fat}g {t('fat')}</Text></View><View style={styles.mealActions}><Text style={[styles.mealKcal, { color: colors.foreground }]}>{meal.calories}</Text><Pressable onPress={() => removeMeal(meal.id)} hitSlop={8}><Ionicons name="close-circle-outline" size={18} color={colors.mutedForeground} /></Pressable></View></View>) : <Text style={[styles.emptyMeal, { color: colors.mutedForeground }]}>{t('noMeals')}</Text>}
    </Card>
    <BarcodeScanner visible={barcodeScannerVisible} onClose={() => setBarcodeScannerVisible(false)} onScanned={handleBarcode} title={t('barcodeScannerTitle')} hint={t('barcodeScannerHint')} permissionText={t('barcodePermission')} unavailableText={t('barcodeUnavailable')} allowCameraLabel={t('allowCamera')} closeLabel={t('close')} />
  </Screen>;
}

const styles = StyleSheet.create({
  rangeRow: { flexDirection: 'row', marginBottom: 14 },
  summaryCard: { padding: 20 },
  macroSummary: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, marginTop: 17, paddingTop: 14 },
  macroValue: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  macroLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
  captureCard: { padding: 13, marginBottom: 2 },
  captureFrame: { height: 142, borderRadius: 19, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 18 },
  captureImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  capturePlaceholder: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 9, maxWidth: 230 },
  captureStatus: { paddingHorizontal: 4, paddingTop: 11 },
  captureOptions: { flexDirection: 'row', gap: 8, marginTop: 13 },
  captureOptionPrimary: { flex: 1.15, minHeight: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  captureOption: { flex: 1, minHeight: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  searchCard: { padding: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, height: 40, fontFamily: 'Inter_400Regular', fontSize: 13 },
  searchHint: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 10 },
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 },
  resultRow: { borderTopWidth: 1, paddingTop: 13, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultContent: { flex: 1 },
  resultServing: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  nutritionLine: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  nutritionValue: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  summaryNumber: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: -1.2, marginTop: 5 },
  summaryUnit: { fontFamily: 'Inter_500Medium', fontSize: 13, letterSpacing: 0 },
  summaryBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14 },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  summaryFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 11 },
  footerValue: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  scanText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  scannerScreen: { flex: 1, justifyContent: 'center' },
  camera: { ...StyleSheet.absoluteFillObject },
  scannerShade: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000035' },
  scannerHeader: { position: 'absolute', top: 58, left: 22, right: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scannerTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, textAlign: 'center' },
  scannerClose: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  scannerCenter: { alignItems: 'center', justifyContent: 'center' },
  scannerFrame: { width: 286, height: 168, borderRadius: 22, borderWidth: 2 },
  scannerHint: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 22, textAlign: 'center' },
  cameraPermission: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 35, gap: 14 },
  scannerPermissionButton: { minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  mealCard: { padding: 16 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mealIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mealTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  mealLine: { borderTopWidth: 1, paddingTop: 13, marginTop: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealThumb: { width: 42, height: 42, borderRadius: 12, marginRight: 10 },
  mealName: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  mealActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mealKcal: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  emptyMeal: { fontFamily: 'Inter_400Regular', fontSize: 12, paddingTop: 15 },
});