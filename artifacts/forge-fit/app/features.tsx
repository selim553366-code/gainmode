import React from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@/components/AppIcon';
import { Header, Screen } from '@/components/FitUI';
import { translate, type TranslationKey } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';

type FeatureTab = 'ai' | 'photo' | 'live' | 'plan';
type FeatureCard = {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  image: number;
  title: string;
  summary: string;
  detail: string;
};

export default function FeaturesScreen() {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: TranslationKey) => translate(language, key);
  const [activeTab, setActiveTab] = React.useState<FeatureTab>('ai');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const tabs: Array<{ id: FeatureTab; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = [
    { id: 'ai', label: t('featuresTabAi'), icon: 'sparkles' },
    { id: 'photo', label: t('featuresTabPhoto'), icon: 'camera-scan' },
    { id: 'live', label: t('featuresTabLive'), icon: 'activity' },
    { id: 'plan', label: t('featuresTabPlan'), icon: 'barbell-outline' },
  ];

  const cards: Record<FeatureTab, FeatureCard[]> = {
    ai: [
      { id: 'aiCoach', icon: 'chatbubble-ellipses-outline', image: require('@/assets/images/coach-tab-custom.jpeg'), title: t('featuresAiCoachTitle'), summary: t('featuresAiCoachSummary'), detail: t('featuresAiCoachDetail') },
      { id: 'weeklyAi', icon: 'analytics-outline', image: require('@/assets/images/coach-thinking-custom.jpeg'), title: t('featuresWeeklyTitle'), summary: t('featuresWeeklySummary'), detail: t('featuresWeeklyDetail') },
      { id: 'profileChanges', icon: 'person-add-outline', image: require('@/assets/images/coach-writing-no-bg.png'), title: t('featuresProfileTitle'), summary: t('featuresProfileSummary'), detail: t('featuresProfileDetail') },
    ],
    photo: [
      { id: 'foodPhoto', icon: 'camera-scan', image: require('@/assets/images/coach-background.jpeg'), title: t('featuresFoodPhotoTitle'), summary: t('featuresFoodPhotoSummary'), detail: t('featuresFoodPhotoDetail') },
      { id: 'barcode', icon: 'scan-outline', image: require('@/assets/images/icon_2.png'), title: t('featuresBarcodeTitle'), summary: t('featuresBarcodeSummary'), detail: t('featuresBarcodeDetail') },
      { id: 'macroDetails', icon: 'pie-chart-outline', image: require('@/assets/images/forge-fit-logo.jpeg'), title: t('featuresMacroTitle'), summary: t('featuresMacroSummary'), detail: t('featuresMacroDetail') },
    ],
    live: [
      { id: 'liveForm', icon: 'activity', image: require('@/assets/images/coach-thinking.png'), title: t('featuresLiveFormTitle'), summary: t('featuresLiveFormSummary'), detail: t('featuresLiveFormDetail') },
      { id: 'supportedMoves', icon: 'barbell-outline', image: require('@/assets/images/coach-wave-static-v2.png'), title: t('featuresMovesTitle'), summary: t('featuresMovesSummary'), detail: t('featuresMovesDetail') },
      { id: 'cameraPrivacy', icon: 'shield-checkmark-outline', image: require('@/assets/images/coach-wave-direct.jpg'), title: t('featuresCameraTitle'), summary: t('featuresCameraSummary'), detail: t('featuresCameraDetail') },
    ],
    plan: [
      { id: 'workoutPlan', icon: 'barbell-outline', image: require('@/assets/images/coach-onboarding.png'), title: t('featuresWorkoutTitle'), summary: t('featuresWorkoutSummary'), detail: t('featuresWorkoutDetail') },
      { id: 'nutritionTargets', icon: 'nutrition-outline', image: require('@/assets/images/coach-welcome.png'), title: t('featuresNutritionTitle'), summary: t('featuresNutritionSummary'), detail: t('featuresNutritionDetail') },
      { id: 'restDays', icon: 'analytics-outline', image: require('@/assets/images/coach-thumbs-up-no-bg.png'), title: t('featuresRestTitle'), summary: t('featuresRestSummary'), detail: t('featuresRestDetail') },
    ],
  };

  return (
    <Screen bottomPadding={120}>
      <Header eyebrow={t('featuresEyebrow')} title={t('featuresTitle')} subtitle={t('featuresSubtitle')} action="close-outline" onAction={() => router.back()} />
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <Image source={require('@/assets/images/coach-background.jpeg')} resizeMode="cover" style={styles.heroImage} />
        <View style={styles.heroOverlay} />
        <View style={styles.heroCopy}>
          <Text style={[styles.heroEyebrow, { color: `${colors.primaryForeground}B3` }]}>{t('featuresHeroEyebrow')}</Text>
          <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>{t('featuresHeroTitle')}</Text>
          <Text style={[styles.heroText, { color: `${colors.primaryForeground}D9` }]}>{t('featuresHeroText')}</Text>
        </View>
      </View>
      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => { setActiveTab(tab.id); setExpandedId(null); }} style={({ pressed }) => [styles.tab, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border, opacity: pressed ? 0.72 : 1 }]}><Ionicons name={tab.icon} size={15} color={active ? colors.primaryForeground : colors.mutedForeground} /><Text style={[styles.tabText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>{tab.label}</Text></Pressable>;
        })}
      </View>
      <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>{t('featuresTapHint')}</Text>
      {cards[activeTab].map((card) => {
        const expanded = card.id === expandedId;
        return <Pressable key={card.id} accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpandedId(expanded ? null : card.id)} style={({ pressed }) => [styles.featureCard, { backgroundColor: colors.card, borderColor: expanded ? `${colors.primary}70` : colors.border, opacity: pressed ? 0.78 : 1 }]}>
          <ImageBackground source={card.image} resizeMode="cover" style={styles.featureImage} />
          <View style={styles.featureBody}>
            <View style={styles.featureHeading}><View style={[styles.featureIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name={card.icon} size={18} color={colors.primary} /></View><View style={styles.featureTitleCopy}><Text style={[styles.featureTitle, { color: colors.foreground }]}>{card.title}</Text><Text style={[styles.featureSummary, { color: colors.mutedForeground }]}>{card.summary}</Text></View><Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} /></View>
            {expanded ? <View style={[styles.featureDetail, { borderTopColor: colors.border }]}><Text style={[styles.featureDetailText, { color: colors.foreground }]}>{card.detail}</Text></View> : null}
          </View>
        </Pressable>;
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 178, borderRadius: 25, overflow: 'hidden', marginBottom: 16 },
  heroImage: { ...StyleSheet.absoluteFillObject, opacity: 0.45 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#06162966' },
  heroCopy: { padding: 20, paddingTop: 22 },
  heroEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.3 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 25, lineHeight: 30, marginTop: 9, maxWidth: '90%' },
  heroText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 8, maxWidth: '92%' },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  tab: { minHeight: 38, borderRadius: 14, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  sectionHint: { fontFamily: 'Inter_400Regular', fontSize: 11, marginBottom: 11 },
  featureCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  featureImage: { width: '100%', height: 112, backgroundColor: '#102A44' },
  featureBody: { padding: 13 },
  featureHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureTitleCopy: { flex: 1, minWidth: 0 },
  featureTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  featureSummary: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 3 },
  featureDetail: { borderTopWidth: 1, marginTop: 12, paddingTop: 11 },
  featureDetailText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 19 },
});