import React from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';

// IMPORTANT: iOS 26 uses NativeTabs for native tabs with liquid glass support.
// NativeTabs intentionally does NOT use custom design tokens — liquid glass
// is a system-level appearance provided by iOS and cannot be overridden.
// Custom brand colors are applied only on the ClassicTabLayout path (older iOS / Android / web).
function NativeTabLayout() {
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>{t('today')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="nutrition">
        <Icon sf={{ default: 'fork.knife', selected: 'fork.knife' }} />
        <Label>{t('nutrition')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plan">
        <Icon sf={{ default: 'figure.strengthtraining.traditional', selected: 'figure.strengthtraining.traditional' }} />
        <Label>{t('plan')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="coach">
        <Icon sf={{ default: 'sparkles', selected: 'sparkles' }} />
        <Label>{t('coach')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <Icon sf={{ default: 'chart.xyaxis.line', selected: 'chart.xyaxis.line' }} />
        <Label>{t('progress')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="friends">
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <Label>{t('friends')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="goals">
        <Icon sf={{ default: 'target', selected: 'target' }} />
        <Label>{t('goals')}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('today'),
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen name="nutrition" options={{ title: t('nutrition'), tabBarIcon: ({ color }) => isIOS ? <SymbolView name="fork.knife" tintColor={color} size={22} /> : <Feather name="pie-chart" size={21} color={color} /> }} />
      <Tabs.Screen name="plan" options={{ title: t('plan'), tabBarIcon: ({ color }) => isIOS ? <SymbolView name="figure.strengthtraining.traditional" tintColor={color} size={22} /> : <Feather name="activity" size={21} color={color} /> }} />
      <Tabs.Screen name="coach" options={{ title: t('coach'), tabBarIcon: ({ color }) => isIOS ? <SymbolView name="sparkles" tintColor={color} size={22} /> : <Feather name="zap" size={21} color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: t('progress'), tabBarIcon: ({ color }) => isIOS ? <SymbolView name="chart.xyaxis.line" tintColor={color} size={22} /> : <Feather name="bar-chart-2" size={21} color={color} /> }} />
      <Tabs.Screen name="friends" options={{ title: t('friends'), tabBarIcon: ({ color }) => isIOS ? <SymbolView name="person.2" tintColor={color} size={22} /> : <Feather name="users" size={21} color={color} /> }} />
      <Tabs.Screen name="goals" options={{ title: t('goals'), tabBarIcon: ({ color }) => isIOS ? <SymbolView name="target" tintColor={color} size={22} /> : <Feather name="target" size={21} color={color} /> }} />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
