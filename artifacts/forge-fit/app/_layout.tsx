import React, { useEffect, useState } from 'react';
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
import { Feather, Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { FitProvider } from '@/context/FitContext';
import { setBaseUrl } from '@workspace/api-client-react';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
setBaseUrl(process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : null);

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Ionicons.font,
    ...Feather.font,
  });
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (Platform.OS === 'web') {
      setAssetsLoaded(true);
      return () => {
        mounted = false;
      };
    }
    const imageSources = [
      require('@/assets/images/icon.png'),
      require('@/assets/images/coach.png'),
      require('@/assets/images/coach-thinking.png'),
      require('@/assets/images/coach-writing-no-bg.png'),
      require('@/assets/images/coach-thumbs-up-no-bg.png'),
      require('@/assets/images/coach-wave-frames/frame-00.png'),
      require('@/assets/images/coach-wave-frames/frame-15.png'),
      require('@/assets/images/coach-wave-frames/frame-30.png'),
      require('@/assets/images/coach-wave-frames/frame-45.png'),
      require('@/assets/images/coach-wave-frames/frame-60.png'),
      require('@/assets/images/coach-wave-frames/frame-75.png'),
      require('@/assets/images/coach-wave-frames/frame-90.png'),
    ];
    Promise.allSettled(imageSources.map((source) => Image.prefetch(Image.resolveAssetSource(source).uri))).finally(() => {
      if (mounted) setAssetsLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if ((!fontsLoaded || !assetsLoaded) && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <FitProvider>
                <RootLayoutNav />
              </FitProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
