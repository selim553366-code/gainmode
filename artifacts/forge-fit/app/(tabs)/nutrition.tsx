import React from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@/components/AppIcon';
import { searchFood, type FoodSearchItem } from '@workspace/api-client-react';
import { useFit, Meal } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { apiUrl } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { Card, ForgeFitMark, Header, InlineStatus, ProgressBar, Screen, SectionTitle } from '@/components/FitUI';
import { HOURLY_PHOTO_ANALYSIS_LIMIT } from '@/lib/usageLimits';
import { getMealsForRange } from '@/lib/nutritionDates';
import { getAiAccessToken, getAiClientId } from '@/lib/aiUsage';
import { calculateCalorieProgress, calculateNetCalories, calculateRemainingCalories } from '@/lib/nutritionCalories';
import { estimateWorkoutCalories, getWorkoutForDate } from '@/lib/workoutPlan';
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

function NeonCaptureCamera({ visible, onClose, onScanned, onPhoto, mode, title, hint, healthySlogan, permissionText, unavailableText, allowCameraLabel, closeLabel, captureLabel, flipLabel, sendPhotoLabel, retakeLabel, photoGuidance }: { visible: boolean; onClose: () => void; onScanned?: (data: string) => void; onPhoto?: (photo: CapturedPhoto) => void; mode: CaptureMode; title: string; hint: string; healthySlogan: string; permissionText: string; unavailableText: string; allowCameraLabel: string; closeLabel: string; captureLabel: string; flipLabel: string; sendPhotoLabel: string; retakeLabel: string; photoGuidance: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = React.useState<'back' | 'front'>('back');
  const [capturing, setCapturing] = React.useState(false);
  const [capturedPhoto, setCapturedPhoto] = React.useState<CapturedPhoto | null>(null);
  const scanLocked = React.useRef(false);
  const cameraRef = React.useRef<CameraView>(null);
  const scanLine = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    scanLocked.current = false;
    setFacing('back');
    setCapturedPhoto(null);
    if (visible && permission && !permission.granted && permission.canAskAgain) requestPermission().catch(() => undefined);
  }, [visible, permission, requestPermission]);

  React.useEffect(() => {
    if (!visible || Platform.OS === 'web') return;
    const scanLoop = mode === 'barcode' ? Animated.loop(Animated.sequence([
      Animated.timing(scanLine, { toValue: 1, duration: 1700, useNativeDriver: false }),
      Animated.timing(scanLine, { toValue: 0, duration: 1700, useNativeDriver: false }),
    ])) : null;
    scanLoop?.start();
    return () => {
      scanLoop?.stop();
    };
  }, [mode, scanLine, visible]);

  const capturePhoto = async () => {
    if (!cameraRef.current || capturing || !onPhoto) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: true });
      if (photo?.uri) setCapturedPhoto({ uri: photo.uri, base64: photo.base64 });
    } catch {
      // Keep the camera open so the user can try again.
    } finally {
      setCapturing(false);
    }
  };
  const submitPhoto = () => {
    if (!capturedPhoto || !onPhoto) return;
    const photo = capturedPhoto;
    setCapturedPhoto(null);
    onPhoto(photo);
  };

  if (!visible) return null;
  const cameraAvailable = Platform.OS !== 'web';
  const cameraReady = cameraAvailable && permission?.granted;
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
    <View style={[styles.scannerScreen, { backgroundColor: colors.background }]}>
      {!cameraReady ? <View style={styles.cameraPermission}><Ionicons name="camera-outline" size={42} color={colors.primary} /><Text style={[styles.scannerTitle, { color: colors.foreground }]}>{cameraAvailable ? permissionText : unavailableText}</Text>{cameraAvailable ? <Pressable onPress={() => requestPermission()} style={[styles.scannerPermissionButton, { backgroundColor: colors.primary }]}><Text style={[styles.scanText, { color: colors.primaryForeground }]}>{allowCameraLabel}</Text></Pressable> : null}</View> : null}
      <View style={[styles.scannerHeader, { top: insets.top + 14 }]}><View style={styles.scannerHeaderCopy}><Text style={[styles.scannerTitle, { color: colors.foreground }]}>{title}</Text><View style={[styles.scannerLivePill, { borderColor: `${colors.primary}75`, backgroundColor: `${colors.primary}20` }]}><View style={[styles.scannerLiveDot, { backgroundColor: colors.primary }]} /><Text style={[styles.scannerLiveText, { color: colors.primary }]}>{mode === 'meal' ? captureLabel : title}</Text></View></View><Pressable accessibilityLabel={closeLabel} onPress={onClose} style={[styles.scannerClose, { backgroundColor: `${colors.background}CC`, borderColor: `${colors.primary}55` }]}><Ionicons name="close" size={22} color={colors.foreground} /></Pressable></View>
        {cameraReady ? <View pointerEvents="none" style={styles.scannerCenter}><Text style={[styles.healthySlogan, { color: colors.primary }]}>{healthySlogan}</Text><LinearGradient colors={[colors.secondary, colors.blue, colors.primary]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={[styles.neonFrame, styles.neonFrameGradient, mode === 'barcode' ? styles.neonBarcodeFrame : styles.neonMealFrame]}><View style={styles.neonCameraInner}>{capturedPhoto ? <Image source={{ uri: capturedPhoto.uri }} style={styles.camera} /> : <CameraView
         ref={cameraRef}
         style={styles.camera}
         facing={facing}
          barcodeScannerSettings={mode === 'barcode' ? { barcodeTypes: ['aztec', 'codabar', 'code128', 'code39', 'code93', 'datamatrix', 'ean13', 'ean8', 'itf14', 'pdf417', 'qr', 'upc_a', 'upc_e'] } : undefined}
         onBarcodeScanned={mode === 'barcode' ? ({ data }) => {
           if (scanLocked.current || !data) return;
           scanLocked.current = true;
           onScanned?.(data);
         } : undefined}
        />}{mode === 'barcode' ? <Animated.View style={[styles.scanLine, { backgroundColor: colors.primary, shadowColor: colors.primary, transform: [{ translateY: scanLine.interpolate({ inputRange: [0, 1], outputRange: [0, 145] }) }] }]} /> : null}</View><View style={[styles.neonFrameGlow, { borderColor: colors.primary, shadowColor: colors.primary }]} /><View style={[styles.frameCorner, styles.frameTopLeft, { borderColor: colors.primary }]} /><View style={[styles.frameCorner, styles.frameTopRight, { borderColor: colors.primary }]} /><View style={[styles.frameCorner, styles.frameBottomLeft, { borderColor: colors.primary }]} /><View style={[styles.frameCorner, styles.frameBottomRight, { borderColor: colors.primary }]} /></LinearGradient><Text style={[styles.scannerHint, { color: colors.foreground }]}>{capturedPhoto ? photoGuidance : hint}</Text></View> : null}
       {cameraReady ? <View style={[styles.scannerBottom, { paddingBottom: insets.bottom + 22 }]}>{mode === 'meal' ? capturedPhoto ? <View style={styles.photoReview}><View style={styles.photoReviewRow}><Pressable accessibilityRole="button" accessibilityLabel={sendPhotoLabel} onPress={submitPhoto} style={[styles.photoSendButton, { backgroundColor: colors.primary }]}><Ionicons name="share-outline" size={18} color={colors.primaryForeground} /><Text style={[styles.photoSendText, { color: colors.primaryForeground }]}>{sendPhotoLabel}</Text></Pressable><Text style={[styles.photoGuidance, { color: colors.foreground }]}>{photoGuidance}</Text></View><Pressable accessibilityRole="button" onPress={() => setCapturedPhoto(null)} style={[styles.photoRetakeButton, { borderColor: `${colors.primary}65`, backgroundColor: `${colors.background}D9` }]}><Ionicons name="camera-outline" size={16} color={colors.foreground} /><Text style={[styles.cameraControlText, { color: colors.foreground }]}>{retakeLabel}</Text></Pressable></View> : <View style={styles.mealCameraControls}><Pressable accessibilityLabel={flipLabel} onPress={() => setFacing((current) => current === 'back' ? 'front' : 'back')} style={[styles.cameraControlButton, { backgroundColor: `${colors.background}D9`, borderColor: `${colors.primary}65` }]}><Ionicons name="camera-outline" size={20} color={colors.foreground} /><Text style={[styles.cameraControlText, { color: colors.foreground }]}>{flipLabel}</Text></Pressable><Pressable accessibilityLabel={captureLabel} onPress={capturePhoto} disabled={capturing} style={[styles.shutterButton, { backgroundColor: `${colors.background}AA`, borderColor: colors.primary, opacity: capturing ? 0.55 : 1 }]}><View style={[styles.shutterInner, { backgroundColor: colors.primary }]} /></Pressable><View style={styles.cameraControlSpacer} /></View> : <View style={[styles.barcodeReady, { backgroundColor: `${colors.background}D9`, borderColor: `${colors.primary}55` }]}><Ionicons name="scan-outline" size={16} color={colors.primary} /><Text style={[styles.barcodeReadyText, { color: colors.foreground }]}>{hint}</Text></View>}</View> : null}
    </View>
  </Modal>;
}

export default function NutritionScreen() {
  const colors = useColors();
  const { language, meals, savedMeals, calorieGoal, proteinGoal, carbsGoal, fatGoal, profile, workouts, addMeal, removeMeal, addSavedMeal, removeSavedMeal, photoAnalysesUsed, incrementPhotoUsage } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const { openCamera } = useLocalSearchParams<{ openCamera?: string }>();
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [photoUri, setPhotoUri] = React.useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = React.useState<Meal | null>(null);
  const [analysisDetailsVisible, setAnalysisDetailsVisible] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analysisPhase, setAnalysisPhase] = React.useState<AnalysisPhase>('idle');
  const [mealCameraVisible, setMealCameraVisible] = React.useState(false);
  const [barcodeScannerVisible, setBarcodeScannerVisible] = React.useState(false);
  const [barcodeResult, setBarcodeResult] = React.useState<FoodSearchItem | null>(null);
  const [barcodeLoading, setBarcodeLoading] = React.useState(false);
  const [barcodeError, setBarcodeError] = React.useState<string | null>(null);
  const [mealSection, setMealSection] = React.useState<'daily' | 'saved'>('daily');
  const [foodSearchItems, setFoodSearchItems] = React.useState<FoodSearchItem[]>([]);
  const [foodSearchLoading, setFoodSearchLoading] = React.useState(false);
  const [foodSearchError, setFoodSearchError] = React.useState(false);
  const barcodeRequestId = React.useRef(0);
  const foodSearchRequestId = React.useRef(0);
  const autoOpenedCamera = React.useRef(false);
  const normalizedSearch = search.trim();
  const searchEnabled = debouncedSearch.length >= 2;
  const visibleMeals = getMealsForRange(meals, 'daily');
  const calories = visibleMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const macros = visibleMeals.reduce((totals, meal) => ({
    protein: totals.protein + meal.protein,
    carbs: totals.carbs + meal.carbs,
    fat: totals.fat + meal.fat,
  }), { protein: 0, carbs: 0, fat: 0 });
  const todaysWorkout = getWorkoutForDate(workouts);
  const exerciseCalories = todaysWorkout ? estimateWorkoutCalories(todaysWorkout, profile ?? undefined) : 0;
  const netCalories = calculateNetCalories(calories, exerciseCalories);
  const calorieProgress = calculateCalorieProgress(calorieGoal, netCalories);
  const remainingCalories = calculateRemainingCalories(calorieGoal, netCalories);

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(normalizedSearch), 350);
    return () => clearTimeout(timeout);
  }, [normalizedSearch]);

  React.useEffect(() => {
    const requestId = ++foodSearchRequestId.current;
    if (!searchEnabled) {
      setFoodSearchItems([]);
      setFoodSearchLoading(false);
      setFoodSearchError(false);
      return;
    }
    setFoodSearchLoading(true);
    setFoodSearchError(false);
    void searchFood({ q: debouncedSearch, language, limit: 12 })
      .then((result) => {
        if (requestId === foodSearchRequestId.current) setFoodSearchItems(result.items);
      })
      .catch(() => {
        if (requestId === foodSearchRequestId.current) {
          setFoodSearchItems([]);
          setFoodSearchError(true);
        }
      })
      .finally(() => {
        if (requestId === foodSearchRequestId.current) setFoodSearchLoading(false);
      });
  }, [debouncedSearch, language, searchEnabled]);

  const analyzeFoodPhoto = async (uri: string, base64?: string) => {
    setPhotoUri(uri);
    setAnalysisResult(null);
    setAnalysisDetailsVisible(false);
    if (!base64) { Alert.alert(t('analyzePhoto'), t('photoAnalysisError')); return; }
    setAnalysisPhase('flying');
    setAnalyzing(true);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 1050));
      setAnalysisPhase('analyzing');
       const clientId = await getAiClientId();
       const accessToken = await getAiAccessToken();
       const response = await fetch(apiUrl('/api/ai/food-analysis'), { method: 'POST', headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, body: JSON.stringify({ imageData: base64, language, clientId }) });
      if (!response.ok) throw new Error('analysis failed');
      const analyzed = await response.json() as Meal;
      addMeal({ name: analyzed.name, type: 'snack', calories: analyzed.calories, protein: analyzed.protein, carbs: analyzed.carbs, fat: analyzed.fat, imageUri: uri });
      setAnalysisResult(analyzed);
      incrementPhotoUsage();
    } catch {
      Alert.alert(t('analyzePhoto'), t('photoAnalysisError'));
    } finally {
      setAnalyzing(false);
      await new Promise<void>((resolve) => setTimeout(resolve, 650));
      setAnalysisPhase('idle');
    }
  };

  const pickPhoto = async () => {
    if (photoAnalysesUsed >= HOURLY_PHOTO_ANALYSIS_LIMIT) { Alert.alert(t('premiumOnly'), t('photoLimitReached')); return; }
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
    const code = data.trim().replace(/^\](?:C1|E0|d2|Q3)/i, '').replace(/[\s-]/g, '');
    setBarcodeScannerVisible(false);
    setBarcodeResult(null);
    setBarcodeError(null);
    if (!/^\d{8,14}$/.test(code)) {
      setBarcodeError(t('barcodeProductNotFound'));
      return;
    }
    const requestId = ++barcodeRequestId.current;
    setBarcodeLoading(true);
    void searchFood({ q: code, language, limit: 1 })
      .then((result) => {
        if (requestId !== barcodeRequestId.current) return;
        const item = result?.items?.[0];
        if (item) {
          setBarcodeResult(item);
        } else {
          setBarcodeError(t('barcodeProductNotFound'));
        }
      })
      .catch(() => {
        if (requestId === barcodeRequestId.current) setBarcodeError(t('barcodeLookupError'));
      })
      .finally(() => {
        if (requestId === barcodeRequestId.current) setBarcodeLoading(false);
      });
  };
  const addBarcodeResult = () => {
    if (!barcodeResult) return;
    addFood(barcodeResult);
    setBarcodeResult(null);
  };
  const openMealCamera = () => {
    if (photoAnalysesUsed >= HOURLY_PHOTO_ANALYSIS_LIMIT) { Alert.alert(t('premiumOnly'), t('photoLimitReached')); return; }
    setMealCameraVisible(true);
  };
  const openBarcodeScanner = () => {
    barcodeRequestId.current += 1;
    setBarcodeResult(null);
    setBarcodeError(null);
    setBarcodeLoading(false);
    setBarcodeScannerVisible(true);
  };

  React.useEffect(() => {
    if (openCamera !== 'meal' || autoOpenedCamera.current) return;
    autoOpenedCamera.current = true;
    const frame = requestAnimationFrame(() => openMealCamera());
    return () => cancelAnimationFrame(frame);
  }, [openCamera]);

  const loggedMeals = [...visibleMeals].reverse();
  const isAnalysisSaved = Boolean(analysisResult && savedMeals.some((meal) => (
    meal.name === analysisResult.name
    && meal.calories === analysisResult.calories
    && meal.protein === analysisResult.protein
    && meal.carbs === analysisResult.carbs
    && meal.fat === analysisResult.fat
  )));
  const saveAnalysisMeal = () => {
    if (!analysisResult || isAnalysisSaved) return;
    addSavedMeal({ name: analysisResult.name, type: 'snack', calories: analysisResult.calories, protein: analysisResult.protein, carbs: analysisResult.carbs, fat: analysisResult.fat, imageUri: photoUri ?? undefined });
    Alert.alert(t('saveMeal'), t('saveMealSuccess'));
  };
  const addSavedFood = (meal: typeof savedMeals[number]) => {
    addMeal({ name: meal.name, type: meal.type, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, imageUri: meal.imageUri });
    Alert.alert(t('addSavedMeal'), t('foodAdded'));
  };

  return <Screen>
     <Header eyebrow="Fuel / 01" title={t('nutritionTitle')} subtitle={t('nutritionSubtitle')} />
    <Card style={styles.summaryCard}>
       <View style={styles.summaryTop}><View><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('calories')}</Text><Text style={[styles.summaryNumber, { color: colors.foreground }]}>{calories.toLocaleString()} <Text style={styles.summaryUnit}>{t('caloriesShort')}</Text></Text></View><View style={[styles.summaryBadge, { backgroundColor: `${colors.success}22` }]}><Ionicons name="checkmark-circle" size={15} color={colors.success} /><Text style={[styles.badgeText, { color: colors.success }]}>{calorieGoal ? `${Math.round((netCalories / calorieGoal) * 100)}%` : '—'}</Text></View></View>
       <ProgressBar value={calorieProgress} />
       <View style={[styles.exerciseCaloriesRow, { borderTopColor: colors.border }]}>
         <View style={[styles.exerciseCaloriesIcon, { backgroundColor: `${colors.orange}20` }]}><Ionicons name="flame-outline" size={17} color={colors.orange} /></View>
         <View style={styles.exerciseCaloriesCopy}>
           <Text style={[styles.exerciseCaloriesTitle, { color: colors.foreground }]}>{t('exerciseCalories')}</Text>
           <Text style={[styles.exerciseCaloriesHint, { color: colors.mutedForeground }]}>{todaysWorkout ? t('exerciseCaloriesEstimate') : t('noWorkoutToday')}</Text>
         </View>
         <Text style={[styles.exerciseCaloriesValue, { color: colors.orange }]}>−{exerciseCalories} {t('caloriesShort')}</Text>
       </View>
       <View style={[styles.summaryFooter, styles.netCaloriesFooter, { borderTopColor: colors.border }]}><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('netCalories')}</Text><Text style={[styles.footerValue, { color: colors.foreground }]}>{netCalories} {t('caloriesShort')}</Text></View>
       <View style={styles.summaryFooter}><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('remaining')}</Text><Text style={[styles.footerValue, { color: colors.foreground }]}>{remainingCalories === null ? '—' : `${remainingCalories} ${t('caloriesShort')}`}</Text></View>
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
        {analysisResult && !analyzing ? <Pressable accessibilityRole="button" accessibilityLabel={t('viewMacroDetails')} onPress={() => setAnalysisDetailsVisible(true)} style={({ pressed }) => [styles.analysisResultCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}45`, opacity: pressed ? 0.72 : 1 }]}>
         <View style={[styles.analysisResultIcon, { backgroundColor: `${colors.primary}22` }]}><Ionicons name="analytics-outline" size={18} color={colors.primary} /></View>
         <View style={styles.analysisResultCopy}><Text style={[styles.analysisResultName, { color: colors.foreground }]} numberOfLines={1}>{analysisResult.name}</Text><Text style={[styles.analysisResultHint, { color: colors.primary }]}>{t('photoAnalysisReady')} · {t('viewMacroDetails')}</Text></View>
         <Ionicons name="chevron-forward" size={18} color={colors.primary} />
       </Pressable> : null}
       {analysisResult && !analyzing ? <Pressable testID="save-analyzed-meal" accessibilityRole="button" accessibilityLabel={isAnalysisSaved ? t('mealSaved') : t('saveMeal')} onPress={saveAnalysisMeal} disabled={isAnalysisSaved} style={({ pressed }) => [styles.saveMealButton, { borderColor: `${colors.primary}55`, backgroundColor: isAnalysisSaved ? `${colors.success}16` : `${colors.primary}0D`, opacity: isAnalysisSaved ? 0.8 : pressed ? 0.7 : 1 }]}>
         <Ionicons name={isAnalysisSaved ? 'checkmark-circle' : 'add-circle-outline'} size={17} color={isAnalysisSaved ? colors.success : colors.primary} />
         <Text style={[styles.saveMealButtonText, { color: isAnalysisSaved ? colors.success : colors.primary }]}>{isAnalysisSaved ? t('mealSaved') : t('saveMeal')}</Text>
       </Pressable> : null}
       <View style={styles.captureOptions}>
         <Pressable testID="camera-scan" onPress={openMealCamera} style={({ pressed }) => [styles.captureOptionPrimary, { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="camera-outline" size={18} color={colors.primaryForeground} /><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} style={[styles.scanText, { color: colors.primaryForeground }]}>{t('scanMeal')}</Text></Pressable>
          <Pressable testID="barcode-scan" onPress={openBarcodeScanner} style={({ pressed }) => [styles.captureOption, styles.captureOptionBarcode, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="scan-outline" size={18} color={colors.foreground} /><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} style={[styles.scanText, { color: colors.foreground }]}>{t('scanBarcode')}</Text></Pressable>
         <Pressable testID="gallery-scan" onPress={pickPhoto} style={({ pressed }) => [styles.captureOption, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="images-outline" size={18} color={colors.foreground} /><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} style={[styles.scanText, { color: colors.foreground }]}>{t('add')}</Text></Pressable>
      </View>
    </Card>
     <Modal visible={analysisDetailsVisible} transparent animationType="fade" onRequestClose={() => setAnalysisDetailsVisible(false)}>
       <View style={styles.analysisModalBackdrop}>
         <View style={[styles.analysisDetailsSheet, { backgroundColor: colors.card, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
           <View style={styles.analysisDetailsHeader}><View style={styles.analysisDetailsHeading}><Text style={[styles.analysisDetailsTitle, { color: colors.foreground }]}>{t('photoMacroDetailsTitle')}</Text><Text style={[styles.analysisDetailsHint, { color: colors.mutedForeground }]}>{t('photoMacroDetailsHint')}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={t('close')} onPress={() => setAnalysisDetailsVisible(false)} hitSlop={8}><Ionicons name="close-circle-outline" size={24} color={colors.mutedForeground} /></Pressable></View>
           {photoUri ? <Image source={{ uri: photoUri }} style={styles.analysisDetailsImage} /> : null}
           {analysisResult ? <><Text style={[styles.analysisDetailsMealName, { color: colors.foreground }]}>{analysisResult.name}</Text><View style={styles.analysisDetailsGrid}>
             <View style={[styles.analysisDetailMetric, { backgroundColor: `${colors.primary}12` }]}><Text style={[styles.analysisDetailLabel, { color: colors.mutedForeground }]}>{t('calories')}</Text><Text style={[styles.analysisDetailValue, { color: colors.foreground }]}>{formatNutrition(analysisResult.calories)} {t('caloriesShort')}</Text></View>
             <View style={[styles.analysisDetailMetric, { backgroundColor: `${colors.blue}12` }]}><Text style={[styles.analysisDetailLabel, { color: colors.mutedForeground }]}>{t('protein')}</Text><Text style={[styles.analysisDetailValue, { color: colors.blue }]}>{formatNutrition(analysisResult.protein)}g</Text></View>
             <View style={[styles.analysisDetailMetric, { backgroundColor: `${colors.orange}12` }]}><Text style={[styles.analysisDetailLabel, { color: colors.mutedForeground }]}>{t('carbs')}</Text><Text style={[styles.analysisDetailValue, { color: colors.orange }]}>{formatNutrition(analysisResult.carbs)}g</Text></View>
             <View style={[styles.analysisDetailMetric, { backgroundColor: `${colors.plum}12` }]}><Text style={[styles.analysisDetailLabel, { color: colors.mutedForeground }]}>{t('fat')}</Text><Text style={[styles.analysisDetailValue, { color: colors.plum }]}>{formatNutrition(analysisResult.fat)}g</Text></View>
           </View></> : null}
         </View>
       </View>
     </Modal>
      {barcodeLoading ? <View style={styles.inlineStateWrap}><InlineStatus icon="search-outline" text={t('barcodeLookingUp')} color={colors.primary} loading /></View> : null}
      {barcodeError ? <View style={styles.inlineStateWrap}><InlineStatus icon="alert-circle" text={barcodeError} color={colors.destructive} /></View> : null}
     {barcodeResult ? <Card style={styles.barcodeResultCard}><View style={styles.barcodeResultHeader}><View style={[styles.barcodeResultIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="scan-outline" size={18} color={colors.primary} /></View><View style={styles.barcodeResultHeading}><Text style={[styles.barcodeResultEyebrow, { color: colors.primary }]}>{t('barcodeNutritionTitle')}</Text><Text style={[styles.barcodeProductName, { color: colors.foreground }]}>{barcodeResult.name}</Text><Text style={[styles.resultServing, { color: colors.mutedForeground }]}>{barcodeResult.serving}</Text></View></View><View style={[styles.barcodeMacroGrid, { borderTopColor: colors.border }]}><View><Text style={[styles.barcodeMacroLabel, { color: colors.mutedForeground }]}>{t('calories')}</Text><Text style={[styles.barcodeMacroValue, { color: colors.foreground }]}>{barcodeResult.calories} {t('caloriesShort')}</Text></View><View><Text style={[styles.barcodeMacroLabel, { color: colors.mutedForeground }]}>{t('protein')}</Text><Text style={[styles.barcodeMacroValue, { color: colors.blue }]}>{formatNutrition(barcodeResult.protein)}g</Text></View><View><Text style={[styles.barcodeMacroLabel, { color: colors.mutedForeground }]}>{t('carbs')}</Text><Text style={[styles.barcodeMacroValue, { color: colors.orange }]}>{formatNutrition(barcodeResult.carbs)}g</Text></View><View><Text style={[styles.barcodeMacroLabel, { color: colors.mutedForeground }]}>{t('fat')}</Text><Text style={[styles.barcodeMacroValue, { color: colors.plum }]}>{formatNutrition(barcodeResult.fat)}g</Text></View></View><Pressable onPress={addBarcodeResult} style={({ pressed }) => [styles.barcodeAddButton, { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="add-circle-outline" size={17} color={colors.primaryForeground} /><Text style={[styles.scanText, { color: colors.primaryForeground }]}>{t('barcodeAddMeal')}</Text></Pressable></Card> : null}
    <SectionTitle title={t('searchFood')} />
    <Card style={styles.searchCard}>
      <View style={styles.searchRow}><Ionicons name="search-outline" size={18} color={colors.mutedForeground} /><TextInput testID="food-search" value={search} onChangeText={setSearch} placeholder={t('searchPlaceholder')} placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} autoCapitalize="none" returnKeyType="search" />{normalizedSearch ? <Pressable testID="clear-food-search" onPress={() => { setSearch(''); setDebouncedSearch(''); }} hitSlop={8}><Ionicons name="close-circle" size={18} color={colors.mutedForeground} /></Pressable> : null}</View>
      {!normalizedSearch ? <Text style={[styles.searchHint, { color: colors.mutedForeground }]}>{t('searchFoodHint')}</Text> : null}
      {normalizedSearch.length === 1 ? <Text style={[styles.searchHint, { color: colors.mutedForeground }]}>{t('searchTooShort')}</Text> : null}
       {searchEnabled && foodSearchLoading ? <View style={styles.inlineStateWrap}><InlineStatus icon="search-outline" text={t('searchingFood')} color={colors.primary} loading /></View> : null}
       {searchEnabled && foodSearchError ? <View style={styles.inlineStateWrap}><InlineStatus icon="alert-circle" text={t('foodSearchError')} color={colors.destructive} /></View> : null}
       {searchEnabled && !foodSearchLoading && !foodSearchError && foodSearchItems.length === 0 ? <View style={styles.inlineStateWrap}><InlineStatus icon="restaurant-outline" text={t('noFoodResults')} color={colors.mutedForeground} /></View> : null}
      {searchEnabled && !foodSearchLoading && !foodSearchError ? foodSearchItems.map((food) => <Pressable key={`${food.id}-${food.name}`} onPress={() => addFood(food)} style={({ pressed }) => [styles.resultRow, { borderTopColor: colors.border, opacity: pressed ? 0.65 : 1 }]}><View style={styles.resultContent}><Text style={[styles.mealName, { color: colors.foreground }]}>{food.name}</Text><Text style={[styles.resultServing, { color: colors.mutedForeground }]}>{food.serving}</Text><View style={styles.nutritionLine}><Text style={[styles.nutritionValue, { color: colors.foreground }]}>{food.calories} {t('caloriesShort')}</Text><Text style={[styles.nutritionValue, { color: colors.blue }]}>{formatNutrition(food.protein)}g {t('protein')}</Text><Text style={[styles.nutritionValue, { color: colors.orange }]}>{formatNutrition(food.carbs)}g {t('carbs')}</Text><Text style={[styles.nutritionValue, { color: colors.plum }]}>{formatNutrition(food.fat)}g {t('fat')}</Text></View></View><Ionicons name="add-circle-outline" size={22} color={colors.primary} /></Pressable>) : null}
    </Card>
     <SectionTitle title={t('loggedFoods')} />
     <View style={[styles.mealTabs, { backgroundColor: `${colors.secondary}A8`, borderColor: colors.border }]}>
       <Pressable testID="daily-meals-tab" accessibilityRole="tab" accessibilityState={{ selected: mealSection === 'daily' }} onPress={() => setMealSection('daily')} style={[styles.mealTab, mealSection === 'daily' && { backgroundColor: colors.card, shadowColor: colors.primary }]}><Text style={[styles.mealTabText, { color: mealSection === 'daily' ? colors.foreground : colors.mutedForeground }]}>{t('loggedFoods')}</Text></Pressable>
       <Pressable testID="saved-meals-tab" accessibilityRole="tab" accessibilityState={{ selected: mealSection === 'saved' }} onPress={() => setMealSection('saved')} style={[styles.mealTab, mealSection === 'saved' && { backgroundColor: colors.card, shadowColor: colors.primary }]}><Text style={[styles.mealTabText, { color: mealSection === 'saved' ? colors.foreground : colors.mutedForeground }]}>{t('savedMealsTab')}</Text></Pressable>
     </View>
     <Card style={styles.mealCard}>
       {mealSection === 'daily' ? <>
      <View style={styles.mealHeader}><View style={[styles.mealIcon, { backgroundColor: `${colors.orange}20` }]}><Ionicons name="restaurant-outline" size={19} color={colors.orange} /></View><View style={{ flex: 1 }}><Text style={[styles.mealTitle, { color: colors.foreground }]}>{t('loggedFoods')}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{loggedMeals.length} · {calories} {t('caloriesShort')}</Text></View></View>
      {loggedMeals.length > 0 ? loggedMeals.map((meal) => <View key={meal.id} style={[styles.mealLine, { borderTopColor: colors.border }]}>{meal.imageUri ? <Image source={{ uri: meal.imageUri }} style={styles.mealThumb} /> : null}<View style={{ flex: 1 }}><Text style={[styles.mealName, { color: colors.foreground }]}>{meal.name}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{meal.protein}g {t('protein')}  ·  {meal.carbs}g {t('carbs')}  ·  {meal.fat}g {t('fat')}</Text></View><View style={styles.mealActions}><Text style={[styles.mealKcal, { color: colors.foreground }]}>{meal.calories}</Text><Pressable onPress={() => removeMeal(meal.id)} hitSlop={8}><Ionicons name="close-circle-outline" size={18} color={colors.mutedForeground} /></Pressable></View></View>) : <Text style={[styles.emptyMeal, { color: colors.mutedForeground }]}>{t('noMeals')}</Text>}
       </> : <>
        <View style={styles.mealHeader}><View style={[styles.mealIcon, { backgroundColor: `${colors.primary}20` }]}><Ionicons name="restaurant-outline" size={19} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.mealTitle, { color: colors.foreground }]}>{t('savedMealsTab')}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{savedMeals.length}</Text></View></View>
        {savedMeals.length > 0 ? [...savedMeals].reverse().map((meal) => <View key={meal.id} style={[styles.mealLine, { borderTopColor: colors.border }]}>{meal.imageUri ? <Image source={{ uri: meal.imageUri }} style={styles.mealThumb} /> : null}<View style={{ flex: 1 }}><Text style={[styles.mealName, { color: colors.foreground }]}>{meal.name}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{meal.protein}g {t('protein')}  ·  {meal.carbs}g {t('carbs')}  ·  {meal.fat}g {t('fat')}</Text></View><View style={styles.savedMealActions}><Text style={[styles.mealKcal, { color: colors.foreground }]}>{meal.calories}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('addSavedMeal')} onPress={() => addSavedFood(meal)} hitSlop={8}><Ionicons name="add-circle-outline" size={21} color={colors.primary} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={t('removeSavedMeal')} onPress={() => removeSavedMeal(meal.id)} hitSlop={8}><Ionicons name="trash-outline" size={18} color={colors.mutedForeground} /></Pressable></View></View>) : <Text style={[styles.emptyMeal, { color: colors.mutedForeground }]}>{t('noSavedMeals')}</Text>}
       </>}
    </Card>
      <NeonCaptureCamera visible={mealCameraVisible} onClose={() => setMealCameraVisible(false)} onPhoto={(photo) => { setMealCameraVisible(false); void analyzeFoodPhoto(photo.uri, photo.base64); }} mode="meal" title={t('scanMeal')} hint={t('mealCameraHint')} healthySlogan={t('healthySlogan')} permissionText={t('cameraPermission')} unavailableText={t('cameraUnavailable')} allowCameraLabel={t('allowCamera')} closeLabel={t('close')} captureLabel={t('cameraCapture')} flipLabel={t('cameraFlip')} sendPhotoLabel={t('photoSendButton')} retakeLabel={t('photoRetake')} photoGuidance={t('photoFrameGuidance')} />
      <NeonCaptureCamera visible={barcodeScannerVisible} onClose={() => setBarcodeScannerVisible(false)} onScanned={handleBarcode} mode="barcode" title={t('barcodeScannerTitle')} hint={t('barcodeScannerHint')} healthySlogan={t('healthySlogan')} permissionText={t('barcodePermission')} unavailableText={t('barcodeUnavailable')} allowCameraLabel={t('allowCamera')} closeLabel={t('close')} captureLabel={t('cameraCapture')} flipLabel={t('cameraFlip')} sendPhotoLabel={t('photoSendButton')} retakeLabel={t('photoRetake')} photoGuidance={t('photoFrameGuidance')} />
  </Screen>;
}

const styles = StyleSheet.create({
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
  analysisResultCard: { minHeight: 62, borderWidth: 1, borderRadius: 16, marginTop: 11, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 10 },
  analysisResultIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  analysisResultCopy: { flex: 1, minWidth: 0 },
  analysisResultName: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  analysisResultHint: { fontFamily: 'Inter_600SemiBold', fontSize: 10, marginTop: 4 },
  saveMealButton: { minHeight: 43, borderRadius: 14, borderWidth: 1, marginTop: 9, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  saveMealButtonText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  captureOptions: { flexDirection: 'row', gap: 8, marginTop: 13 },
  captureOptionPrimary: { flex: 1, minWidth: 0, minHeight: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, paddingHorizontal: 4 },
  captureOption: { flex: 1, minWidth: 0, minHeight: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, paddingHorizontal: 4 },
  captureOptionBarcode: { flex: 1.1 },
  barcodeResultCard: { padding: 16, marginTop: 10 },
  barcodeResultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barcodeResultTitle: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18 },
  barcodeResultIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  barcodeResultHeading: { flex: 1 },
  barcodeResultEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.1 },
  barcodeProductName: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 21, marginTop: 3 },
  barcodeMacroGrid: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, marginTop: 14, paddingTop: 13 },
  barcodeMacroLabel: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  barcodeMacroValue: { fontFamily: 'Inter_700Bold', fontSize: 12, marginTop: 4 },
  barcodeAddButton: { minHeight: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, marginTop: 14 },
  searchCard: { padding: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, height: 40, fontFamily: 'Inter_400Regular', fontSize: 13 },
  searchHint: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 10 },
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 },
  inlineStateWrap: { marginTop: 10 },
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
  analysisModalBackdrop: { flex: 1, backgroundColor: 'rgba(3, 12, 27, 0.72)', justifyContent: 'flex-end' },
  analysisDetailsSheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, padding: 20, paddingBottom: 30 },
  analysisDetailsHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  analysisDetailsHeading: { flex: 1 },
  analysisDetailsTitle: { fontFamily: 'Inter_700Bold', fontSize: 19 },
  analysisDetailsHint: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 5 },
  analysisDetailsImage: { width: '100%', height: 150, borderRadius: 16, marginTop: 16 },
  analysisDetailsMealName: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 14 },
  analysisDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 },
  analysisDetailMetric: { width: '48%', minHeight: 68, borderRadius: 14, padding: 11 },
  analysisDetailLabel: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  analysisDetailValue: { fontFamily: 'Inter_700Bold', fontSize: 17, marginTop: 6 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  summaryNumber: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: -1.2, marginTop: 5 },
  summaryUnit: { fontFamily: 'Inter_500Medium', fontSize: 13, letterSpacing: 0 },
  summaryBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14 },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  summaryFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 11 },
  footerValue: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  exerciseCaloriesRow: { borderTopWidth: 1, marginTop: 15, paddingTop: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  exerciseCaloriesIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  exerciseCaloriesCopy: { flex: 1 },
  exerciseCaloriesTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  exerciseCaloriesHint: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
  exerciseCaloriesValue: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  netCaloriesFooter: { borderTopWidth: 1, paddingTop: 11, marginTop: 12 },
  scanText: { flexShrink: 1, minWidth: 0, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: -0.15, textAlign: 'center' },
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
  healthySlogan: { fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 1.8, textAlign: 'center', marginBottom: 12 },
  neonFrame: { position: 'relative', borderRadius: 26, overflow: 'hidden' },
  neonFrameGradient: { padding: 3, alignItems: 'stretch', justifyContent: 'center' },
  neonCameraInner: { flex: 1, borderRadius: 23, overflow: 'hidden', position: 'relative', backgroundColor: 'transparent' },
  neonMealFrame: { width: 310, height: 310 },
  neonBarcodeFrame: { width: 310, height: 178 },
  neonFrameGlow: { ...StyleSheet.absoluteFill, borderWidth: 1, borderRadius: 26, shadowOpacity: 0.95, shadowRadius: 22, shadowOffset: { width: 0, height: 0 }, elevation: 12 },
  frameCorner: { position: 'absolute', width: 34, height: 34, borderWidth: 3 },
  frameTopLeft: { left: -1, top: -1, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 26 },
  frameTopRight: { right: -1, top: -1, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 26 },
  frameBottomLeft: { left: -1, bottom: -1, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 26 },
  frameBottomRight: { right: -1, bottom: -1, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 26 },
  scanLine: { position: 'absolute', left: 15, right: 15, top: 12, height: 2, borderRadius: 2, shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
  scannerHint: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 22, textAlign: 'center', maxWidth: 310 },
  scannerBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 24, zIndex: 3 },
  mealCameraControls: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoReview: { width: '100%', gap: 10 },
  photoReviewRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  photoSendButton: { minHeight: 50, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, flexShrink: 1 },
  photoSendText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  photoGuidance: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 15 },
  photoRetakeButton: { alignSelf: 'center', minHeight: 38, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  mealTabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, padding: 3, marginBottom: 10 },
  mealTab: { flex: 1, minHeight: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  mealTabText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mealIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mealTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  mealLine: { borderTopWidth: 1, paddingTop: 13, marginTop: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealThumb: { width: 42, height: 42, borderRadius: 12, marginRight: 10 },
  mealName: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  mealActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  savedMealActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealKcal: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  emptyMeal: { fontFamily: 'Inter_400Regular', fontSize: 12, paddingTop: 15 },
});