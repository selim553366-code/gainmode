import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform } from 'react-native';
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
import { FitProvider } from '@/context/FitContext';
import { initializeRevenueCat, SubscriptionProvider } from '@/lib/revenuecat';
import { getApiBaseUrl } from '@/lib/api';
import { setBaseUrl } from '@workspace/api-client-react';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import colors from '@/constants/colors';

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
      if (data?.source !== 'forge-fit-daily-mood' && data?.source !== 'forge-fit-workout') return;
      handledNotificationResponse.current = response.notification.request.identifier;
      Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
      setTimeout(() => {
        if (data.source === 'forge-fit-workout' && typeof data.workoutDay === 'string') {
          router.push({ pathname: '/(tabs)/plan', params: { day: data.workoutDay } });
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
      <Stack.Screen name="features" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="daily-mood" options={{ headerShown: false, presentation: 'card' }} />
    </Stack>
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
