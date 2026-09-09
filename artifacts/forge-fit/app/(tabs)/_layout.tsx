import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
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
  const logoScale = React.useRef(new Animated.Value(focused ? 0.9 : 1)).current;
  const thinkingTransition = React.useRef(new Animated.Value(coachThinking ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(logoScale, {
      toValue: focused ? 0.9 : 1,
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [focused, logoScale]);
  React.useEffect(() => {
    Animated.timing(thinkingTransition, { toValue: coachThinking ? 1 : 0, duration: 360, useNativeDriver: true }).start();
  }, [coachThinking, thinkingTransition]);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.coachTabItem}
    >
      <View style={[styles.coachTabButton, { shadowColor: colors.primary }]}>
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <Animated.View style={[styles.coachTabCircle, { backgroundColor: colors.secondary, borderColor: colors.primary, shadowColor: colors.primary }]}>
            <Animated.Image source={require('@/assets/images/coach-tab-custom.jpeg')} resizeMode="cover" style={[styles.coachTabImage, { opacity: thinkingTransition.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]} />
            <Animated.Image source={require('@/assets/images/coach-thinking-custom.jpeg')} resizeMode="cover" style={[styles.coachTabImage, styles.coachThinkingImage, styles.coachThinkingOverlay, { opacity: thinkingTransition }]} />
          </Animated.View>
        </Animated.View>
        <Text style={[styles.coachTabLabel, { color: focused ? colors.primary : colors.mutedForeground }]}>{label}</Text>
        {focused ? <View style={[styles.coachTabDot, { backgroundColor: colors.primary }]} /> : null}
      </View>
    </Pressable>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const routes = tabOrder
    .map((name) => state.routes.find((route) => route.name === name))
    .filter((route): route is typeof state.routes[number] => Boolean(route));
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
       <View style={[styles.tabBar, { borderColor: colors.glassBorder, shadowColor: colors.primary }]}>
         <BlurView intensity={42} tint={colors.colorScheme} pointerEvents="none" style={StyleSheet.absoluteFill} />
         <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.tabBarGlassTint, { backgroundColor: colors.glass }]} />
        {routes.map((route) => {
          const descriptor = descriptors[route.key];
          const focused = state.index === state.routes.findIndex((item) => item.key === route.key);
          const label = typeof descriptor.options.title === 'string' ? descriptor.options.title : route.name;
          if (route.name === 'coach') {
            return (
              <CoachTabButton
                key={route.key}
                focused={focused}
                label={label}
                onPress={() => handlePress(route)}
                colors={colors}
              />
            );
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
  tabBar: { height: 78, borderRadius: 28, borderWidth: 1, overflow: 'hidden', backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: 4, shadowOpacity: 0.32, shadowRadius: 18, shadowOffset: { width: 0, height: -5 }, elevation: 16 },
  tabBarGlassTint: { borderRadius: 28 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 5, paddingBottom: 9, paddingTop: 12 },
  tabLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  coachTabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', overflow: 'visible' },
  coachTabButton: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingTop: 2, shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 4 }, elevation: 18 },
  coachTabCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowOpacity: 0.42, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 13 },
  coachTabImage: { width: 48, height: 48, borderRadius: 24 },
  coachThinkingImage: { width: 54, height: 54, transform: [{ translateY: 3 }] },
  coachThinkingOverlay: { position: 'absolute', left: -3, top: -3 },
  coachTabLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, marginTop: 2, letterSpacing: 0.4 },
  coachTabDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  moodPromptOverlay: { position: 'absolute', left: 14, right: 14, zIndex: 20 },
  moodPrompt: { borderRadius: 20, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9, shadowOpacity: 0.28, shadowRadius: 15, shadowOffset: { width: 0, height: 7 }, elevation: 10 },
  moodPromptIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  moodPromptCopy: { flex: 1, minWidth: 0 },
  moodPromptTitle: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  moodPromptBody: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14, marginTop: 2 },
  moodPromptButton: { borderRadius: 11, paddingHorizontal: 10, paddingVertical: 9 },
  moodPromptButtonText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
});
