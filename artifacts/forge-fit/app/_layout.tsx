import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { FitProvider, useFit } from '@/context/FitContext';
import { initializeRevenueCat, SubscriptionProvider } from '@/lib/revenuecat';
import { getApiBaseUrl } from '@/lib/api';
import { setBaseUrl } from '@workspace/api-client-react';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import colors from '@/constants/colors';
import { CelebrationBurst, triggerHaptic } from '@/components/FitUI';
import { Ionicons } from '@/components/AppIcon';
import { badges, badgeText, badgeUi } from '@/lib/badges';

function BadgeUnlockCelebration() {
  const { hydrated, language, unlockedBadgeIds } = useFit();
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const knownIds = useRef<string[] | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const scale = useRef(new Animated.Value(0.7)).current;
  const current = badges.find((badge) => badge.id === queue[0]);

  useEffect(() => {
    if (!hydrated) return;
    if (knownIds.current === null) {
      knownIds.current = unlockedBadgeIds;
      return;
    }
    const newIds = unlockedBadgeIds.filter((id) => !knownIds.current!.includes(id));
    knownIds.current = unlockedBadgeIds;
    if (newIds.length) setQueue((items) => [...items, ...newIds.filter((id) => !items.includes(id))]);
  }, [hydrated, unlockedBadgeIds]);

  useEffect(() => {
    if (!current) return undefined;
    scale.setValue(0.7);
    triggerHaptic();
    Animated.spring(scale, { toValue: 1, friction: 6, tension: 75, useNativeDriver: true }).start();
    return () => scale.stopAnimation();
  }, [current, scale]);

  if (!current) return null;
  return <Modal transparent visible animationType="fade">
    <View style={badgeCelebrationStyles.backdrop} pointerEvents="none">
      <CelebrationBurst
        visible
        duration={2400}
        onDone={() => setQueue((items) => items.slice(1))}
      />
      <Animated.View style={[badgeCelebrationStyles.card, { backgroundColor: palette.card, borderColor: `${current.color}75`, transform: [{ scale }] }]}>
        <View style={[badgeCelebrationStyles.glow, { backgroundColor: `${current.color}18` }]} />
        <View style={[badgeCelebrationStyles.icon, { backgroundColor: `${current.color}20`, borderColor: `${current.color}65` }]}>
          <Ionicons name={current.icon as React.ComponentProps<typeof Ionicons>['name']} size={42} color={current.color} />
        </View>
        <Text style={[badgeCelebrationStyles.eyebrow, { color: current.color }]}>{badgeText(badgeUi.unlocked, language).toUpperCase()}</Text>
        <Text style={[badgeCelebrationStyles.title, { color: palette.foreground }]}>{badgeText(current.title, language)}</Text>
        <Text style={[badgeCelebrationStyles.description, { color: palette.mutedForeground }]}>{badgeText(current.description, language)}</Text>
      </Animated.View>
    </View>
  </Modal>;
}

const badgeCelebrationStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#061629B8', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  card: { width: '100%', maxWidth: 350, minHeight: 300, borderRadius: 30, borderWidth: 2, padding: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glow: { ...StyleSheet.absoluteFillObject },
  icon: { width: 92, height: 92, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.3, textAlign: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 27, lineHeight: 33, textAlign: 'center', marginTop: 8 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 9 },
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
setBaseUrl(getApiBaseUrl());
try {
  initializeRevenueCat();
} catch (error) {
  console.warn('RevenueCat could not be initialized.', error);
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { resolvedTheme } = useTheme();
  const handledNotificationResponse = useRef<string | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const openNotificationDestination = (response: Notifications.NotificationResponse | null) => {
      if (!response || handledNotificationResponse.current === response.notification.request.identifier) return;
      const data = response.notification.request.content.data;
      if (data?.source !== 'forge-fit-daily-mood' && data?.source !== 'forge-fit-workout' && data?.source !== 'forge-fit-weight') return;
      handledNotificationResponse.current = response.notification.request.identifier;
      Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
      setTimeout(() => {
        if (data.source === 'forge-fit-workout' && typeof data.workoutDay === 'string') {
          router.push({ pathname: '/(tabs)/plan', params: { day: data.workoutDay } });
          return;
        }
        if (data.source === 'forge-fit-weight') {
          router.push('/(tabs)/progress');
          return;
        }
        router.push('/daily-mood');
      }, 0);
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(openNotificationDestination);
    Notifications.getLastNotificationResponseAsync().then(openNotificationDestination).catch(() => undefined);
    return () => subscription.remove();
  }, []);

  return (
    <>
    <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerBackTitle: 'Back', contentStyle: { backgroundColor: colors[resolvedTheme].background } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="live-workout" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="workout-session" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="update-preferences" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="streak" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="badges" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="features" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="daily-mood" options={{ headerShown: false, presentation: 'card' }} />
    </Stack>
    <BadgeUnlockCelebration />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [startupFallbackReady, setStartupFallbackReady] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const imageSources = [
      require('@/assets/images/icon.png'),
      require('@/assets/images/coach.png'),
      require('@/assets/images/coach-tab-custom.jpeg'),
      require('@/assets/images/coach-background.jpeg'),
      require('@/assets/images/coach-thinking.png'),
      require('@/assets/images/coach-thinking-custom.jpeg'),
      require('@/assets/images/coach-writing-no-bg.png'),
      require('@/assets/images/coach-thumbs-up-no-bg.png'),
      require('@/assets/images/coach-wave-direct.jpg'),
      require('@/assets/images/forge-fit-logo.jpeg'),
    ];
    void Promise.allSettled(imageSources.map((source) => Image.prefetch(Image.resolveAssetSource(source).uri)));
    return undefined;
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setStartupFallbackReady(true), 2500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError || startupFallbackReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError, startupFallbackReady]);

  return (
    <ThemeProvider>
      <SafeAreaProvider style={{ flex: 1 }}>
       <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SubscriptionProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <FitProvider>
                  <RootLayoutNav />
                </FitProvider>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </SubscriptionProvider>
        </QueryClientProvider>
       </ErrorBoundary>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
