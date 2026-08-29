import React from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { PremiumLock } from '@/components/FitUI';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const tabOrder = ['index', 'nutrition', 'coach', 'plan', 'friends'];

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
  const logoScale = React.useRef(new Animated.Value(focused ? 0.8 : 1)).current;

  React.useEffect(() => {
    Animated.spring(logoScale, {
      toValue: focused ? 0.8 : 1,
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [focused, logoScale]);

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
          <View style={[styles.coachTabCircle, { backgroundColor: colors.secondary, borderColor: colors.primary, shadowColor: colors.primary }]}>
            <Image source={coachThinking ? require('@/assets/images/coach-thinking.png') : require('@/assets/images/coach.png')} resizeMode="cover" style={styles.coachTabImage} />
          </View>
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

export default function TabLayout() {
  const colors = useColors();
  const { isPremium } = useFit();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  if (!isPremium) return <PremiumLock />;
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}>
      <Tabs.Screen name="index" options={{ title: t('today') }} />
      <Tabs.Screen name="nutrition" options={{ title: t('nutrition') }} />
      <Tabs.Screen name="plan" options={{ title: t('plan') }} />
      <Tabs.Screen name="coach" options={{ title: t('coachTitle') }} />
      <Tabs.Screen name="progress" options={{ href: null }} />
      <Tabs.Screen name="friends" options={{ title: t('friends') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, zIndex: 10 },
  tabBar: { height: 78, borderRadius: 28, borderWidth: 1, flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: 4, shadowOpacity: 0.32, shadowRadius: 18, shadowOffset: { width: 0, height: -5 }, elevation: 16 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 5, paddingBottom: 9, paddingTop: 12 },
  tabLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  coachTabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', overflow: 'visible' },
  coachTabButton: { position: 'absolute', top: -42, alignItems: 'center', shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 4 }, elevation: 18 },
  coachTabCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowOpacity: 0.42, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 13 },
  coachTabImage: { width: 88, height: 88, borderRadius: 44 },
  coachTabLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, marginTop: 7, letterSpacing: 0.8 },
  coachTabDot: { width: 5, height: 5, borderRadius: 3, marginTop: 4 },
});
