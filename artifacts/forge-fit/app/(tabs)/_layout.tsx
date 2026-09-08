import React from 'react';
import { Animated, Easing, Image, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { Feather, Ionicons } from '@/components/AppIcon';
import { router, Tabs } from 'expo-router';
import { PremiumLock } from '@/components/FitUI';
import { SUBSCRIPTION_PURCHASE_ENABLED } from '@/lib/revenuecat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isDailyMoodDue } from '@/lib/dailyMood';
import { localDateKey } from '@/lib/nutritionDates';

const tabOrder = ['index', 'nutrition', 'coach', 'plan', 'progress'];
const COACH_POSITION_KEY = 'forge-fit-coach-tab-position';
const COACH_LONG_PRESS_MS = 3000;
const COACH_BUTTON_SIZE = 88;

type TabRoute = { key: string; name: string };
type TabBarProps = {
  state: { index: number; routes: TabRoute[] };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented?: boolean };
    navigate: (name: string) => void;
  };
};

function CoachTabButton({ focused, label, onPress, colors }: { focused: boolean; label: string; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  const { coachThinking } = useFit();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const logoScale = React.useRef(new Animated.Value(focused ? 0.8 : 1)).current;
  const logoDeparture = React.useRef(new Animated.Value(focused ? 0 : 1)).current;
  const circleCollapse = React.useRef(new Animated.Value(focused ? 1 : 0)).current;
  const thinkingTransition = React.useRef(new Animated.Value(coachThinking ? 1 : 0)).current;
  const position = React.useRef(new Animated.ValueXY()).current;
  const positionRef = React.useRef({ x: 0, y: 0 });
  const dragStartRef = React.useRef({ x: 0, y: 0 });
  const dragReadyRef = React.useRef(false);
  const gestureCanceledRef = React.useRef(false);
  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clampPosition = React.useCallback((next: { x: number; y: number }) => {
    const maxHorizontal = Math.max(0, (width - COACH_BUTTON_SIZE) / 2);
    const baseBottom = Math.max(insets.bottom, 10) + 32;
    const minY = -(height - baseBottom - insets.top - COACH_BUTTON_SIZE);
    return {
      x: Math.max(-maxHorizontal, Math.min(maxHorizontal, next.x)),
      y: Math.max(minY, Math.min(0, next.y)),
    };
  }, [height, insets.bottom, insets.top, width]);

  const setPosition = React.useCallback((next: { x: number; y: number }) => {
    const clamped = clampPosition(next);
    positionRef.current = clamped;
    position.setValue(clamped);
    return clamped;
  }, [clampPosition, position]);

  React.useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(COACH_POSITION_KEY).then((stored) => {
      if (!active || !stored) return;
      try {
        const parsed = JSON.parse(stored) as { x?: unknown; y?: unknown };
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition({ x: parsed.x, y: parsed.y });
        }
      } catch {
        void AsyncStorage.removeItem(COACH_POSITION_KEY);
      }
    });
    return () => {
      active = false;
    };
  }, [setPosition]);

  React.useEffect(() => {
    setPosition(positionRef.current);
  }, [setPosition]);

  React.useEffect(() => () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  }, []);

  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      dragReadyRef.current = false;
      gestureCanceledRef.current = false;
      dragStartRef.current = positionRef.current;
      longPressTimerRef.current = setTimeout(() => {
        dragReadyRef.current = true;
        Animated.spring(logoScale, {
          toValue: 1.08,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }).start();
      }, COACH_LONG_PRESS_MS);
    },
    onPanResponderMove: (_event, gesture) => {
      if (!dragReadyRef.current && Math.hypot(gesture.dx, gesture.dy) > 10) {
        gestureCanceledRef.current = true;
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        return;
      }
      if (!dragReadyRef.current) return;
      setPosition({
        x: dragStartRef.current.x + gesture.dx,
        y: dragStartRef.current.y + gesture.dy,
      });
    },
    onPanResponderRelease: () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      if (dragReadyRef.current) {
        dragReadyRef.current = false;
        void AsyncStorage.setItem(COACH_POSITION_KEY, JSON.stringify(positionRef.current));
        Animated.spring(logoScale, {
          toValue: focused ? 0.8 : 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }).start();
        return;
      }
      if (!gestureCanceledRef.current) onPress();
    },
    onPanResponderTerminate: () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      dragReadyRef.current = false;
      gestureCanceledRef.current = false;
      setPosition(dragStartRef.current);
    },
  }), [focused, logoScale, onPress, setPosition]);

  React.useEffect(() => {
    Animated.spring(logoScale, {
      toValue: focused ? 0.8 : 1,
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [focused, logoScale]);
  React.useEffect(() => {
    Animated.timing(logoDeparture, {
      toValue: focused ? 0 : 1,
      duration: focused ? 180 : 260,
      useNativeDriver: true,
    }).start();
  }, [focused, logoDeparture]);
  React.useEffect(() => {
    const animation = focused
      ? Animated.timing(circleCollapse, {
        toValue: 1,
        duration: 820,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      })
      : Animated.spring(circleCollapse, {
        toValue: 0,
        damping: 13,
        stiffness: 155,
        mass: 0.7,
        useNativeDriver: true,
      });
    animation.start();
    return () => animation.stop();
  }, [circleCollapse, focused]);
  React.useEffect(() => {
    Animated.timing(thinkingTransition, { toValue: coachThinking ? 1 : 0, duration: 360, useNativeDriver: true }).start();
  }, [coachThinking, thinkingTransition]);

  return (
    <Animated.View
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      {...panResponder.panHandlers}
      style={[
        styles.coachTabItem,
        {
          bottom: Math.max(insets.bottom, 10) + 32,
          left: width / 2 - COACH_BUTTON_SIZE / 2,
          transform: position.getTranslateTransform(),
        },
      ]}
    >
      <View style={[styles.coachTabButton, { shadowColor: colors.primary }]}>
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <Animated.View style={[styles.coachTabCircle, { backgroundColor: colors.secondary, borderColor: colors.primary, shadowColor: colors.primary, opacity: circleCollapse.interpolate({ inputRange: [0, 0.46, 0.72, 1], outputRange: [1, 1, 0.78, 0] }), transform: [{ translateY: circleCollapse.interpolate({ inputRange: [0, 0.32, 0.58, 1], outputRange: [0, 0, 10, 18] }) }, { scale: circleCollapse.interpolate({ inputRange: [0, 0.32, 0.66, 1], outputRange: [1, 1, 0.62, 0] }) }, { rotate: circleCollapse.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-18deg'] }) }] }]}>
            <Animated.Image source={require('@/assets/images/coach-tab-custom.jpeg')} resizeMode="cover" style={[styles.coachTabImage, { opacity: Animated.multiply(logoDeparture, thinkingTransition.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })) }]} />
            <Animated.Image source={require('@/assets/images/coach-thinking-custom.jpeg')} resizeMode="cover" style={[styles.coachTabImage, styles.coachThinkingImage, styles.coachThinkingOverlay, { opacity: thinkingTransition }]} />
          </Animated.View>
        </Animated.View>
        <Text style={[styles.coachTabLabel, { color: focused ? colors.primary : colors.mutedForeground }]}>{label}</Text>
        {focused ? <View style={[styles.coachTabDot, { backgroundColor: colors.primary }]} /> : null}
      </View>
    </Animated.View>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const routes = tabOrder
    .map((name) => state.routes.find((route) => route.name === name))
    .filter((route): route is typeof state.routes[number] => Boolean(route));
  const coachRoute = routes.find((route) => route.name === 'coach');
  const handlePress = (route: typeof routes[number]) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(route.name);
  };
  const iconForRoute = (name: string): React.ComponentProps<typeof Feather>['name'] => {
    if (name === 'index') return 'home';
    if (name === 'nutrition') return 'pie-chart';
    if (name === 'plan') return 'activity';
    if (name === 'progress') return 'trending-up-outline';
    return 'users';
  };

  return (
    <View pointerEvents="box-none" style={[styles.tabBarOverlay, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.tabBar, { backgroundColor: colors.background, borderColor: colors.border, shadowColor: colors.background }]}>
        {routes.map((route) => {
          const descriptor = descriptors[route.key];
          const focused = state.index === state.routes.findIndex((item) => item.key === route.key);
          const label = typeof descriptor.options.title === 'string' ? descriptor.options.title : route.name;
          if (route.name === 'coach') {
            return <View key={route.key} style={styles.tabItem} />;
          }
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => handlePress(route)}
              style={styles.tabItem}
            >
              <Feather name={iconForRoute(route.name)} size={22} color={focused ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.tabLabel, { color: focused ? colors.primary : colors.mutedForeground }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      {coachRoute ? (
        <CoachTabButton
          focused={state.index === state.routes.findIndex((item) => item.key === coachRoute.key)}
          label={descriptors[coachRoute.key].options.title ?? coachRoute.name}
          onPress={() => handlePress(coachRoute)}
          colors={colors}
        />
      ) : null}
    </View>
  );
}

function DailyMoodPrompt() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, onboardingComplete, dailyMoodCompletedDate } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [dismissed, setDismissed] = React.useState(false);
  const [due, setDue] = React.useState(isDailyMoodDue());

  React.useEffect(() => {
    const timer = setInterval(() => setDue(isDailyMoodDue()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!onboardingComplete || dismissed || !due || dailyMoodCompletedDate === localDateKey()) return null;

  return (
    <View pointerEvents="box-none" style={[styles.moodPromptOverlay, { top: insets.top + 10 }]}>
      <View style={[styles.moodPrompt, { backgroundColor: colors.card, borderColor: `${colors.primary}70`, shadowColor: colors.background }]}>
        <View style={[styles.moodPromptIcon, { backgroundColor: `${colors.primary}1F` }]}><Ionicons name="sparkles" size={19} color={colors.primary} /></View>
        <View style={styles.moodPromptCopy}><Text style={[styles.moodPromptTitle, { color: colors.foreground }]}>{t('dailyMoodPromptTitle')}</Text><Text style={[styles.moodPromptBody, { color: colors.mutedForeground }]}>{t('dailyMoodPromptBody')}</Text></View>
        <Pressable accessibilityRole="button" onPress={() => { setDismissed(true); router.push('/daily-mood'); }} style={({ pressed }) => [styles.moodPromptButton, { backgroundColor: colors.primary, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.moodPromptButtonText, { color: colors.primaryForeground }]}>{t('dailyMoodOpen')}</Text></Pressable>
        <Pressable accessibilityLabel={t('dailyMoodLater')} onPress={() => setDismissed(true)} hitSlop={8}><Ionicons name="close" size={18} color={colors.mutedForeground} /></Pressable>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const { isPremium } = useFit();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  if (!isPremium && SUBSCRIPTION_PURCHASE_ENABLED) return <PremiumLock />;
  return (
    <View style={{ flex: 1 }}>
      <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}>
        <Tabs.Screen name="index" options={{ title: t('today') }} />
        <Tabs.Screen name="nutrition" options={{ title: t('nutrition') }} />
        <Tabs.Screen name="plan" options={{ title: t('plan') }} />
        <Tabs.Screen name="coach" options={{ title: t('coachTitle') }} />
         <Tabs.Screen name="progress" options={{ title: t('progress') }} />
      </Tabs>
      <DailyMoodPrompt />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, zIndex: 10 },
  tabBar: { height: 78, borderRadius: 28, borderWidth: 1, flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: 4, shadowOpacity: 0.32, shadowRadius: 18, shadowOffset: { width: 0, height: -5 }, elevation: 16 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 5, paddingBottom: 9, paddingTop: 12 },
  tabLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  coachTabItem: { position: 'absolute', width: 88, height: 116, alignItems: 'center', justifyContent: 'flex-start', overflow: 'visible', zIndex: 30 },
  coachTabButton: { alignItems: 'center', shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 4 }, elevation: 18 },
  coachTabCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowOpacity: 0.42, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 13 },
  coachTabImage: { width: 88, height: 88, borderRadius: 44 },
  coachThinkingImage: { width: 100, height: 100, transform: [{ translateY: 6 }] },
  coachThinkingOverlay: { position: 'absolute', left: -6, top: -6 },
  coachTabLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, marginTop: 7, letterSpacing: 0.8 },
  coachTabDot: { width: 5, height: 5, borderRadius: 3, marginTop: 4 },
  moodPromptOverlay: { position: 'absolute', left: 14, right: 14, zIndex: 20 },
  moodPrompt: { borderRadius: 20, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9, shadowOpacity: 0.28, shadowRadius: 15, shadowOffset: { width: 0, height: 7 }, elevation: 10 },
  moodPromptIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  moodPromptCopy: { flex: 1, minWidth: 0 },
  moodPromptTitle: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  moodPromptBody: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14, marginTop: 2 },
  moodPromptButton: { borderRadius: 11, paddingHorizontal: 10, paddingVertical: 9 },
  moodPromptButtonText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
});
