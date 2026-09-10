import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@/components/AppIcon';
import { Card } from '@/components/FitUI';
import { useColors } from '@/hooks/useColors';
import { translate, type Language } from '@/lib/i18n';

type TodayWeightBarProps = {
  language: Language;
  tracksWeight: boolean;
  onSave: (value: number) => void;
  testID?: string;
};

export function TodayWeightBar({ language, tracksWeight, onSave, testID = 'add-today-weight' }: TodayWeightBarProps) {
  const colors = useColors();
  const [draftWeight, setDraftWeight] = React.useState('');
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);

  if (!tracksWeight) return null;

  const saveWeight = () => {
    const value = Number(draftWeight.replace(',', '.'));
    if (value > 0) {
      onSave(value);
      setDraftWeight('');
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}>
          <Ionicons name="scale-outline" size={17} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('weeklyAddWeight')}</Text>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>{t('weeklyWeightLogHint')}</Text>
        </View>
      </View>
      <Card style={styles.card}>
        <TextInput
          testID={`${testID}-input`}
          value={draftWeight}
          onChangeText={setDraftWeight}
          keyboardType="decimal-pad"
          placeholder={t('currentWeight')}
          placeholderTextColor={colors.mutedForeground}
          accessibilityLabel={t('currentWeight')}
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
        />
        <Pressable
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={t('add')}
          onPress={saveWeight}
          style={({ pressed }) => [styles.addButton, { backgroundColor: colors.primary, opacity: pressed ? 0.72 : 1 }]}
        >
          <Ionicons name="add" size={19} color={colors.primaryForeground} />
        </Pressable>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
  card: { padding: 10, flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, height: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontFamily: 'Inter_400Regular', fontSize: 12 },
  addButton: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});