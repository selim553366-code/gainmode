import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';

/** The soft sky behind the welcome screen, onboarding and the app's pages: light blue fading to white, deep navy in dark mode. */
export function SkyBackdrop() {
  const colors = useColors();
  const dark = colors.colorScheme === 'dark';
  const sky = dark ? ['#1A3F8F', '#0E1E42', colors.background] as const : ['#B9D9FF', '#E4F0FF', '#F6F9FD'] as const;
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dark ? colors.background : '#F6F9FD' }]}>
    <LinearGradient colors={sky} locations={[0, 0.45, 0.85]} style={StyleSheet.absoluteFill} />
  </View>;
}
