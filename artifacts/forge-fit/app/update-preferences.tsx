import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@/components/AppIcon';
import { Card, Header, Screen, triggerHaptic } from '@/components/FitUI';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { isProfileEditAvailable, PROFILE_EDIT_FIELDS, type ProfileEditField } from '@/lib/profileEdit';

const fieldCopy: Record<ProfileEditField, {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: Parameters<typeof translate>[1];
  description: Parameters<typeof translate>[1];
}> = {
  name: { icon: 'person-add-outline', title: 'editPreferencesName', description: 'editPreferencesNameDescription' },
  equipment: { icon: 'barbell-outline', title: 'editPreferencesEquipment', description: 'editPreferencesEquipmentDescription' },
  body: { icon: 'scale-outline', title: 'editPreferencesBody', description: 'editPreferencesBodyDescription' },
  personal: { icon: 'options-outline', title: 'editPreferencesPersonal', description: 'editPreferencesPersonalDescription' },
  goal: { icon: 'trophy-outline', title: 'editPreferencesGoal', description: 'editPreferencesGoalDescription' },
  activity: { icon: 'activity', title: 'editPreferencesActivity', description: 'editPreferencesActivityDescription' },
  training: { icon: 'barbell-outline', title: 'editPreferencesTraining', description: 'editPreferencesTrainingDescription' },
  nutrition: { icon: 'nutrition-outline', title: 'editPreferencesNutrition', description: 'editPreferencesNutritionDescription' },
};

export default function UpdatePreferencesScreen() {
  const colors = useColors();
  const { language, profileEditUsedMonth } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const profileEditAvailable = isProfileEditAvailable(profileEditUsedMonth);
  const [selected, setSelected] = React.useState<ProfileEditField[]>([]);

  const toggle = (field: ProfileEditField) => {
    setSelected((current) => current.includes(field) ? current.filter((item) => item !== field) : [...current, field]);
  };

  const beginEdit = () => {
    if (!profileEditAvailable || selected.length === 0) return;
    triggerHaptic();
    router.replace({ pathname: '/', params: { edit: '1', fields: selected.join(',') } });
  };

  return (
    <Screen bottomPadding={32}>
      <Header
        eyebrow={t('coachTitle')}
        title={t('editPreferences')}
        subtitle={t('editPreferencesDescription')}
        action="close-outline"
        onAction={() => router.back()}
      />
      <View style={styles.coachArea}>
        <View style={[styles.coachGlow, { backgroundColor: `${colors.blue}18` }]} />
        <Image source={require('@/assets/images/coach-tab-custom.jpeg')} resizeMode="cover" style={styles.coachImage} />
      </View>
      <View style={[styles.chatBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.chatText, { color: colors.foreground }]}>{t('editPreferencesChatIntro')}</Text>
        <Text style={[styles.chatHint, { color: colors.mutedForeground }]}>{t('editPreferencesSelectHint')}</Text>
      </View>
      <View style={[styles.infoBar, { backgroundColor: `${colors.blue}16`, borderColor: `${colors.blue}55` }]}>
        <Ionicons name="information-circle-outline" size={20} color={colors.blue} />
        <Text style={[styles.infoText, { color: colors.foreground }]}>
          {!profileEditAvailable ? t('profileEditLimitBarUsed') : t('profileEditLimitBar')}
        </Text>
      </View>
      <View style={styles.list}>
        {PROFILE_EDIT_FIELDS.map((field) => {
          const copy = fieldCopy[field];
          const isSelected = selected.includes(field);
          return (
            <Pressable
              key={field}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected, disabled: !profileEditAvailable }}
              disabled={!profileEditAvailable}
              onPress={() => { triggerHaptic(); toggle(field); }}
              style={({ pressed }) => [
                styles.option,
                { backgroundColor: isSelected ? `${colors.primary}18` : colors.card, borderColor: isSelected ? colors.primary : colors.border, opacity: pressed ? 0.76 : !profileEditAvailable ? 0.55 : 1 },
              ]}
            >
              <View style={[styles.optionIcon, { backgroundColor: isSelected ? colors.primary : colors.secondary }]}>
                <Ionicons name={copy.icon} size={20} color={isSelected ? colors.primaryForeground : colors.foreground} />
              </View>
              <View style={styles.optionCopy}>
                <Text style={[styles.optionTitle, { color: colors.foreground }]}>{t(copy.title)}</Text>
                <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>{t(copy.description)}</Text>
              </View>
              <Ionicons name={isSelected ? 'checkmark-circle' : 'checkmark-circle-outline'} size={22} color={isSelected ? colors.primary : colors.mutedForeground} />
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={selected.length === 0 || !profileEditAvailable}
        onPress={beginEdit}
        style={({ pressed }) => [styles.continueButton, { backgroundColor: colors.primary, opacity: selected.length === 0 || !profileEditAvailable ? 0.45 : pressed ? 0.78 : 1 }]}
      >
        <Text style={[styles.continueText, { color: colors.primaryForeground }]}>{t('editPreferencesContinue')}</Text>
        <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  coachArea: { height: 156, alignItems: 'center', justifyContent: 'flex-end', marginTop: -4 },
  coachGlow: { position: 'absolute', width: 150, height: 150, borderRadius: 75, bottom: 0 },
  coachImage: { width: 150, height: 150, borderRadius: 75 },
  chatBubble: { borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 14, gap: 6 },
  chatText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 23 },
  chatHint: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  infoBar: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 14 },
  infoText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  list: { gap: 10, marginTop: 18 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderRadius: 17, padding: 12 },
  optionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  optionCopy: { flex: 1, gap: 3 },
  optionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  optionDescription: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  continueButton: { minHeight: 52, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 },
  continueText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
});