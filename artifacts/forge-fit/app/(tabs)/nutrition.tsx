import React from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@/components/AppIcon';
import { useSearchFood, type FoodSearchItem } from '@workspace/api-client-react';
import { useFit, Meal } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, ForgeFitMark, Header, Pill, ProgressBar, Screen, SectionTitle } from '@/components/FitUI';
import { DAILY_PHOTO_ANALYSIS_LIMIT } from '@/lib/usageLimits';
import { getMealsForRange } from '@/lib/nutritionDates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const formatNutrition = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);

type CaptureMode = 'meal' | 'barcode';
type CapturedPhoto = { uri: string; base64?: string };
type AnalysisPhase = 'idle' | 'flying' | 'analyzing';

function PhotoAnalysisTransfer({ uri, phase, sendingLabel, aiBoxLabel, analyzingLabel }: { uri: string; phase: AnalysisPhase; sendingLabel: string; aiBoxLabel: string; analyzingLabel: string }) {
  const colors = useColors();
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (phase === 'flying') {
      progress.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: 1050, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      return;
    }
    if (phase === 'analyzing') {
      Animated.timing(progress, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      return;
    }
    progress.setValue(0);
  }, [phase, progress]);

  if (phase === 'idle') return null;
  const photoTranslateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 124] });
  const photoScale = progress.interpolate({ inputRange: [0, 0.72, 1], outputRange: [1, 0.78, 0.42] });
  const photoOpacity = progress.interpolate({ inputRange: [0, 0.82, 1], outputRange: [1, 0.96, 0.12] });
  const boxOpacity = progress.interpolate({ inputRange: [0, 0.52, 0.82, 1], outputRange: [0.45, 0.72, 1, 1] });
  const boxScale = progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.86, 0.96, 1] });

  return <View style={styles.analysisStage}>
    <View style={styles.analysisStageHeader}>
      <View style={[styles.analysisStageDot, { backgroundColor: colors.primary }]} />
      <Text style={[styles.analysisStageLabel, { color: colors.foreground }]}>{phase === 'flying' ? sendingLabel : analyzingLabel}</Text>
    </View>
    <View style={styles.analysisTrack}>
      <View style={[styles.analysisTrackLine, { backgroundColor: `${colors.primary}32` }]} />
      <Animated.View style={[styles.analysisPhoto, { borderColor: colors.primary, opacity: photoOpacity, transform: [{ translateX: photoTranslateX }, { scale: photoScale }] }]}>
        <Image source={{ uri }} style={styles.analysisPhotoImage} />
      </Animated.View>
      <Animated.View style={[styles.analysisAiBox, { opacity: boxOpacity, transform: [{ scale: boxScale }] }]}>
        <LinearGradient colors={[colors.secondary, colors.blue, colors.primary]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.analysisAiGradient}>
          <ForgeFitMark size={26} />
          <Text style={[styles.analysisAiText, { color: colors.primaryForeground }]}>{aiBoxLabel}</Text>
          {phase === 'analyzing' ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : <Ionicons name="arrow-forward" size={14} color={colors.primaryForeground} />}
        </LinearGradient>
      </Animated.View>
    </View>
  </View>;
}

function NeonCaptureCamera({ visible, onClose, onScanned, onPhoto, mode, title, hint, permissionText, unavailableText, allowCameraLabel, closeLabel, captureLabel, flipLabel }: { visible: boolean; onClose: () => void; onScanned?: (data: string) => void; onPhoto?: (photo: CapturedPhoto) => void; mode: CaptureMode; title: string; hint: string; permissionText: string; unavailableText: string; allowCameraLabel: string; closeLabel: string; captureLabel: string; flipLabel: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = React.useState<'back' | 'front'>('back');
  const [capturing, setCapturing] = React.useState(false);
  const scanLocked = React.useRef(false);
  const cameraRef = React.useRef<CameraView>(null);
  const glow = React.useRef(new Animated.Value(0.58)).current;
  const scanLine = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    scanLocked.current = false;
    setFacing('back');
    if (visible && permission && !permission.granted && permission.canAskAgain) requestPermission().catch(() => undefined);
  }, [visible, permission, requestPermission]);

  React.useEffect(() => {
    if (!visible || Platform.OS === 'web') return;
    const glowLoop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: false }),
      Animated.timing(glow, { toValue: 0.58, duration: 1200, useNativeDriver: false }),
    ]));
    glowLoop.start();
    const scanLoop = mode === 'barcode' ? Animated.loop(Animated.sequence([
      Animated.timing(scanLine, { toValue: 1, duration: 1700, useNativeDriver: false }),
      Animated.timing(scanLine, { toValue: 0, duration: 1700, useNativeDriver: false }),
    ])) : null;
    scanLoop?.start();
    return () => {
      glowLoop.stop();
      scanLoop?.stop();
    };
  }, [glow, mode, scanLine, visible]);

  const capturePhoto = async () => {
    if (!cameraRef.current || capturing || !onPhoto) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: true });
      if (photo?.uri) onPhoto({ uri: photo.uri, base64: photo.base64 });
    } catch {
      // Keep the camera open so the user can try again.
    } finally {
      setCapturing(false);
    }
  };

  if (!visible) return null;
  const cameraAvailable = Platform.OS !== 'web';
  const cameraReady = cameraAvailable && permission?.granted;
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
    <View style={[styles.scannerScreen, { backgroundColor: colors.background }]}>
      {!cameraReady ? <View style={styles.cameraPermission}><Ionicons name="camera-outline" size={42} color={colors.primary} /><Text style={[styles.scannerTitle, { color: colors.foreground }]}>{cameraAvailable ? permissionText : unavailableText}</Text>{cameraAvailable ? <Pressable onPress={() => requestPermission()} style={[styles.scannerPermissionButton, { backgroundColor: colors.primary }]}><Text style={[styles.scanText, { color: colors.primaryForeground }]}>{allowCameraLabel}</Text></Pressable> : null}</View> : null}
      <View style={[styles.scannerHeader, { top: insets.top + 14 }]}><View style={styles.scannerHeaderCopy}><Text style={[styles.scannerTitle, { color: colors.foreground }]}>{title}</Text><View style={[styles.scannerLivePill, { borderColor: `${colors.primary}75`, backgroundColor: `${colors.primary}20` }]}><View style={[styles.scannerLiveDot, { backgroundColor: colors.primary }]} /><Text style={[styles.scannerLiveText, { color: colors.primary }]}>{mode === 'meal' ? captureLabel : title}</Text></View></View><Pressable accessibilityLabel={closeLabel} onPress={onClose} style={[styles.scannerClose, { backgroundColor: `${colors.background}CC`, borderColor: `${colors.primary}55` }]}><Ionicons name="close" size={22} color={colors.foreground} /></Pressable></View>
      {cameraReady ? <View pointerEvents="none" style={styles.scannerCenter}><LinearGradient colors={[colors.secondary, colors.blue, colors.primary]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={[styles.neonFrame, styles.neonFrameGradient, mode === 'barcode' ? styles.neonBarcodeFrame : styles.neonMealFrame]}><View style={styles.neonCameraInner}><CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        barcodeScannerSettings={mode === 'barcode' ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'itf14', 'codabar', 'qr'] } : undefined}
        onBarcodeScanned={mode === 'barcode' ? ({ data }) => {
          if (scanLocked.current || !data) return;
          scanLocked.current = true;
          onScanned?.(data);
        } : undefined}
      />{mode === 'barcode' ? <Animated.View style={[styles.scanLine, { backgroundColor: colors.primary, shadowColor: colors.primary, transform: [{ translateY: scanLine.interpolate({ inputRange: [0, 1], outputRange: [0, 145] }) }] }]} /> : null}</View><Animated.View style={[styles.neonFrameGlow, { borderColor: colors.primary, shadowColor: colors.primary, opacity: glow }]} /><View style={[styles.frameCorner, styles.frameTopLeft, { borderColor: colors.primary }]} /><View style={[styles.frameCorner, styles.frameTopRight, { borderColor: colors.primary }]} /><View style={[styles.frameCorner, styles.frameBottomLeft, { borderColor: colors.primary }]} /><View style={[styles.frameCorner, styles.frameBottomRight, { borderColor: colors.primary }]} /></LinearGradient><Text style={[styles.scannerHint, { color: colors.foreground }]}>{hint}</Text></View> : null}
      {cameraReady ? <View style={[styles.scannerBottom, { paddingBottom: insets.bottom + 22 }]}>{mode === 'meal' ? <View style={styles.mealCameraControls}><Pressable accessibilityLabel={flipLabel} onPress={() => setFacing((current) => current === 'back' ? 'front' : 'back')} style={[styles.cameraControlButton, { backgroundColor: `${colors.background}D9`, borderColor: `${colors.primary}65` }]}><Ionicons name="camera-outline" size={20} color={colors.foreground} /><Text style={[styles.cameraControlText, { color: colors.foreground }]}>{flipLabel}</Text></Pressable><Pressable accessibilityLabel={captureLabel} onPress={capturePhoto} disabled={capturing} style={[styles.shutterButton, { backgroundColor: `${colors.background}AA`, borderColor: colors.primary, opacity: capturing ? 0.55 : 1 }]}><View style={[styles.shutterInner, { backgroundColor: colors.primary }]} /></Pressable><View style={styles.cameraControlSpacer} /></View> : <View style={[styles.barcodeReady, { backgroundColor: `${colors.background}D9`, borderColor: `${colors.primary}55` }]}><Ionicons name="scan-outline" size={16} color={colors.primary} /><Text style={[styles.barcodeReadyText, { color: colors.foreground }]}>{hint}</Text></View>}</View> : null}
    </View>
  </Modal>;
}

export default function NutritionScreen() {
  const colors = useColors();
  const { language, meals, calorieGoal, proteinGoal, carbsGoal, fatGoal, addMeal, removeMeal, photoAnalysesUsed, incrementPhotoUsage } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const { openCamera } = useLocalSearchParams<{ openCamera?: string }>();
  const [range, setRange] = React.useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [photoUri, setPhotoUri] = React.useState<string | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analysisPhase, setAnalysisPhase] = React.useState<AnalysisPhase>('idle');
  const [mealCameraVisible, setMealCameraVisible] = React.useState(false);
  const [barcodeScannerVisible, setBarcodeScannerVisible] = React.useState(false);
  const autoOpenedCamera = React.useRef(false);
  const normalizedSearch = search.trim();
  const searchEnabled = debouncedSearch.length >= 2;
  const foodSearch = useSearchFood(
    { q: searchEnabled ? debouncedSearch : '  ', language, limit: 12 },
    { query: { enabled: searchEnabled, staleTime: 5 * 60 * 1000, queryKey: ['food-search', debouncedSearch, language] } },
  );
  const visibleMeals = getMealsForRange(meals, range);
  const calories = visibleMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const macros = visibleMeals.reduce((totals, meal) => ({
    protein: totals.protein + meal.protein,
    carbs: totals.carbs + meal.carbs,
    fat: totals.fat + meal.fat,
  }), { protein: 0, carbs: 0, fat: 0 });

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(normalizedSearch), 350);
    return () => clearTimeout(timeout);
  }, [normalizedSearch]);

  const analyzeFoodPhoto = async (uri: string, base64?: string) => {
    setPhotoUri(uri);
    if (!base64) { Alert.alert(t('scanMeal'), t('photoComing')); return; }
    setAnalysisPhase('flying');
    setAnalyzing(true);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 1050));
      setAnalysisPhase('analyzing');
      const response = await fetch(`https://${process.env.EXPO_PUBLIC_DOMAIN}/api/ai/food-analysis`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageData: base64, language }) });
      if (!response.ok) throw new Error('analysis failed');
      const analyzed = await response.json() as Meal;
      addMeal({ name: analyzed.name, type: 'snack', calories: analyzed.calories, protein: analyzed.protein, carbs: analyzed.carbs, fat: analyzed.fat, imageUri: uri });
      incrementPhotoUsage();
      Alert.alert(t('analyzePhoto'), t('foodAdded'));
    } catch {
      Alert.alert(t('analyzePhoto'), t('photoComing'));
    } finally {
      setAnalyzing(false);
      await new Promise<void>((resolve) => setTimeout(resolve, 650));
      setAnalysisPhase('idle');
    }
  };

  const pickPhoto = async () => {
    if (photoAnalysesUsed >= DAILY_PHOTO_ANALYSIS_LIMIT) { Alert.alert(t('premiumOnly'), t('photoLimitReached')); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.65, base64: true });
    const asset = result.canceled ? undefined : result.assets?.[0];
    if (!asset) return;
    await analyzeFoodPhoto(asset.uri, asset.base64 ?? undefined);
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
  const openMealCamera = () => {
    if (photoAnalysesUsed >= DAILY_PHOTO_ANALYSIS_LIMIT) { Alert.alert(t('premiumOnly'), t('photoLimitReached')); return; }
    setMealCameraVisible(true);
  };

  React.useEffect(() => {
    if (openCamera !== 'meal' || autoOpenedCamera.current) return;
    autoOpenedCamera.current = true;
    const frame = requestAnimationFrame(() => openMealCamera());
    return () => cancelAnimationFrame(frame);
  }, [openCamera]);

  const loggedMeals = [...visibleMeals].reverse();

  return <Screen>
    <Header eyebrow="Fuel / 01" title={t('nutritionTitle')} subtitle={t('nutritionSubtitle')} action="ellipsis-horizontal" onAction={() => Alert.alert(t('nutrition'), t('premiumDesc'))} />
    <View style={styles.rangeRow}><Pill label={t('daily')} active={range === 'daily'} onPress={() => setRange('daily')} /><Pill label={t('weekly')} active={range === 'weekly'} onPress={() => setRange('weekly')} /><Pill label={t('monthly')} active={range === 'monthly'} onPress={() => setRange('monthly')} /></View>
    <Card style={styles.summaryCard}>
      <View style={styles.summaryTop}><View><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('calories')}</Text><Text style={[styles.summaryNumber, { color: colors.foreground }]}>{calories.toLocaleString()} <Text style={styles.summaryUnit}>{t('caloriesShort')}</Text></Text></View><View style={[styles.summaryBadge, { backgroundColor: `${colors.success}22` }]}><Ionicons name="checkmark-circle" size={15} color={colors.success} /><Text style={[styles.badgeText, { color: colors.success }]}>{calorieGoal ? `${Math.round((calories / calorieGoal) * 100)}%` : '—'}</Text></View></View>
      <ProgressBar value={calorieGoal ? calories / calorieGoal : 0} />
      <View style={styles.summaryFooter}><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('remaining')}</Text><Text style={[styles.footerValue, { color: colors.foreground }]}>{calorieGoal ? `${Math.max(calorieGoal - calories, 0)} ${t('caloriesShort')}` : '—'}</Text></View>
      <View style={[styles.macroTargets, { borderTopColor: colors.border }]}>
        <Text style={[styles.macroTargetsTitle, { color: colors.foreground }]}>{t('dailyTargets')}</Text>
        {[
          { label: t('protein'), current: macros.protein, target: proteinGoal, color: colors.blue },
          { label: t('carbs'), current: macros.carbs, target: carbsGoal, color: colors.orange },
          { label: t('fat'), current: macros.fat, target: fatGoal, color: colors.plum },
        ].map((macro) => (
          <View key={macro.label} style={styles.macroTarget}>
            <View style={styles.macroTargetRow}>
              <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>{macro.label}</Text>
              <Text style={[styles.macroValue, { color: colors.foreground }]}>{formatNutrition(macro.current)} / {macro.target ? `${formatNutrition(macro.target)}g` : '—'}</Text>
            </View>
            <View style={[styles.macroTrack, { backgroundColor: `${macro.color}20` }]}>
              <View style={[styles.macroFill, { width: `${macro.target ? Math.min((macro.current / macro.target) * 100, 100) : 0}%`, backgroundColor: macro.color }]} />
            </View>
          </View>
        ))}
      </View>
    </Card>
    <Card style={styles.captureCard}>
      <View style={[styles.captureFrame, { borderColor: `${colors.primary}70`, backgroundColor: `${colors.primary}0D` }]}>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.captureImage} /> : <><Ionicons name="scan-outline" size={31} color={colors.primary} /><Text style={[styles.capturePlaceholder, { color: colors.mutedForeground }]}>{t('mealCaptureHint')}</Text></>}
      </View>
      {photoUri ? <PhotoAnalysisTransfer uri={photoUri} phase={analysisPhase} sendingLabel={t('photoSendingToAi')} aiBoxLabel={t('photoAiBox')} analyzingLabel={t('photoAnalyzingStep')} /> : null}
      {photoUri ? <View style={styles.captureStatus}><Text style={[styles.mealName, { color: colors.foreground }]}>{analyzing ? t('analyzing') : t('analyzePhoto')}</Text></View> : null}
      <View style={styles.captureOptions}>
        <Pressable testID="camera-scan" onPress={openMealCamera} style={({ pressed }) => [styles.captureOptionPrimary, { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="camera-outline" size={18} color={colors.primaryForeground} /><Text style={[styles.scanText, { color: colors.primaryForeground }]}>{t('scanMeal')}</Text></Pressable>
        <Pressable testID="barcode-scan" onPress={() => setBarcodeScannerVisible(true)} style={({ pressed }) => [styles.captureOption, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="scan-outline" size={18} color={colors.foreground} /><Text style={[styles.scanText, { color: colors.foreground }]}>{t('scanBarcode')}</Text></Pressable>
        <Pressable testID="gallery-scan" onPress={pickPhoto} style={({ pressed }) => [styles.captureOption, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="images-outline" size={18} color={colors.foreground} /><Text style={[styles.scanText, { color: colors.foreground }]}>{t('add')}</Text></Pressable>
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
     <NeonCaptureCamera visible={mealCameraVisible} onClose={() => setMealCameraVisible(false)} onPhoto={(photo) => { setMealCameraVisible(false); void analyzeFoodPhoto(photo.uri, photo.base64); }} mode="meal" title={t('scanMeal')} hint={t('mealCameraHint')} permissionText={t('barcodePermission')} unavailableText={t('barcodeUnavailable')} allowCameraLabel={t('allowCamera')} closeLabel={t('close')} captureLabel={t('cameraCapture')} flipLabel={t('cameraFlip')} />
     <NeonCaptureCamera visible={barcodeScannerVisible} onClose={() => setBarcodeScannerVisible(false)} onScanned={handleBarcode} mode="barcode" title={t('barcodeScannerTitle')} hint={t('barcodeScannerHint')} permissionText={t('barcodePermission')} unavailableText={t('barcodeUnavailable')} allowCameraLabel={t('allowCamera')} closeLabel={t('close')} captureLabel={t('cameraCapture')} flipLabel={t('cameraFlip')} />
  </Screen>;
}

const styles = StyleSheet.create({
  rangeRow: { flexDirection: 'row', marginBottom: 14 },
  summaryCard: { padding: 20 },
  macroTargets: { borderTopWidth: 1, marginTop: 17, paddingTop: 14 },
  macroTargetsTitle: { fontFamily: 'Inter_700Bold', fontSize: 12, marginBottom: 10 },
  macroTarget: { marginBottom: 9 },
  macroTargetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  macroTrack: { height: 5, borderRadius: 99, overflow: 'hidden', marginTop: 5 },
  macroFill: { height: '100%', borderRadius: 99 },
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
  analysisStage: { marginTop: 13, paddingHorizontal: 4, paddingVertical: 12, borderRadius: 18, backgroundColor: 'rgba(103,199,255,0.07)' },
  analysisStageHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  analysisStageDot: { width: 7, height: 7, borderRadius: 4 },
  analysisStageLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  analysisTrack: { height: 78, position: 'relative', justifyContent: 'center', overflow: 'hidden' },
  analysisTrackLine: { position: 'absolute', left: 38, right: 38, top: 38, height: 1, borderRadius: 1 },
  analysisPhoto: { position: 'absolute', left: 8, top: 4, width: 70, height: 70, borderRadius: 17, overflow: 'hidden', borderWidth: 2, zIndex: 2 },
  analysisPhotoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  analysisAiBox: { position: 'absolute', right: 8, top: 3, width: 111, height: 72, borderRadius: 18, overflow: 'hidden', zIndex: 1 },
  analysisAiGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 9 },
  analysisAiText: { fontFamily: 'Inter_700Bold', fontSize: 11, flexShrink: 1 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  summaryNumber: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: -1.2, marginTop: 5 },
  summaryUnit: { fontFamily: 'Inter_500Medium', fontSize: 13, letterSpacing: 0 },
  summaryBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14 },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  summaryFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 11 },
  footerValue: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  scanText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  scannerScreen: { flex: 1, justifyContent: 'center', overflow: 'hidden' },
  camera: { flex: 1 },
  scannerHeader: { position: 'absolute', left: 22, right: 22, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', zIndex: 3 },
  scannerHeaderCopy: { gap: 8 },
  scannerTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  scannerLivePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  scannerLiveDot: { width: 6, height: 6, borderRadius: 3 },
  scannerLiveText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.5 },
  scannerClose: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scannerCenter: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  neonFrame: { position: 'relative', borderRadius: 26, overflow: 'hidden' },
  neonFrameGradient: { padding: 3, alignItems: 'stretch', justifyContent: 'center' },
  neonCameraInner: { flex: 1, borderRadius: 23, overflow: 'hidden', position: 'relative', backgroundColor: 'transparent' },
  neonMealFrame: { width: 310, height: 310 },
  neonBarcodeFrame: { width: 310, height: 178 },
  neonFrameGlow: { ...StyleSheet.absoluteFillObject, borderWidth: 1, borderRadius: 26, shadowOpacity: 0.95, shadowRadius: 22, shadowOffset: { width: 0, height: 0 }, elevation: 12 },
  frameCorner: { position: 'absolute', width: 34, height: 34, borderWidth: 3 },
  frameTopLeft: { left: -1, top: -1, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 26 },
  frameTopRight: { right: -1, top: -1, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 26 },
  frameBottomLeft: { left: -1, bottom: -1, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 26 },
  frameBottomRight: { right: -1, bottom: -1, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 26 },
  scanLine: { position: 'absolute', left: 15, right: 15, top: 12, height: 2, borderRadius: 2, shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
  scannerHint: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 22, textAlign: 'center', maxWidth: 310 },
  scannerBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 24, zIndex: 3 },
  mealCameraControls: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cameraControlButton: { minWidth: 92, minHeight: 44, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 10 },
  cameraControlText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  cameraControlSpacer: { width: 92 },
  shutterButton: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.9, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 12 },
  shutterInner: { width: 58, height: 58, borderRadius: 29 },
  barcodeReady: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 11 },
  barcodeReadyText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
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