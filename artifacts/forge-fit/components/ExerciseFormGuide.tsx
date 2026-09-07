import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { Ionicons } from '@/components/AppIcon';
import { useColors } from '@/hooks/useColors';
import { translate, type Language, type TranslationKey } from '@/lib/i18n';

type FormKind = 'push' | 'squat' | 'lunge' | 'hinge' | 'plank' | 'row' | 'press' | 'curl' | 'bridge' | 'calf' | 'pullup' | 'core';

const formImages: Record<FormKind, ImageSourcePropType> = {
  push: require('@/assets/images/live-guide-coach-pushup.png'),
  squat: require('@/assets/images/live-guide-coach-squat.png'),
  lunge: require('@/assets/images/live-guide-coach-lunge.png'),
  hinge: require('@/assets/images/form-coach-hinge.png'),
  plank: require('@/assets/images/form-coach-plank.png'),
  row: require('@/assets/images/form-coach-row.png'),
  press: require('@/assets/images/form-coach-press.png'),
  curl: require('@/assets/images/form-coach-curl.png'),
  bridge: require('@/assets/images/form-coach-bridge.png'),
  calf: require('@/assets/images/form-coach-calf.png'),
  pullup: require('@/assets/images/form-coach-pullup.png'),
  core: require('@/assets/images/form-coach-core.png'),
};

const specialFormImages = {
  pikePushup: require('@/assets/images/form-coach-pike-pushup.png'),
  shoulderTap: require('@/assets/images/form-coach-shoulder-tap.png'),
  diamondPushup: require('@/assets/images/form-coach-diamond-pushup.png'),
  closeGripPushup: require('@/assets/images/form-coach-close-grip-pushup.png'),
  sidePlank: require('@/assets/images/form-coach-side-plank.png'),
  superman: require('@/assets/images/form-coach-superman.png'),
  reverseSnowAngel: require('@/assets/images/form-coach-reverse-snow-angel.png'),
} satisfies Record<string, ImageSourcePropType>;

const guideByExercise: Record<string, { kind: FormKind; tip: TranslationKey; image?: ImageSourcePropType }> = {
  exercisePushup: { kind: 'push', tip: 'formTipPush' },
  exerciseWidePushup: { kind: 'push', tip: 'formTipPush' },
  exerciseInclinePushup: { kind: 'push', tip: 'formTipPush' },
  exerciseDiamondPushup: { kind: 'push', tip: 'formTipPush', image: specialFormImages.diamondPushup },
  exerciseCloseGripPushup: { kind: 'push', tip: 'formTipPush', image: specialFormImages.closeGripPushup },
  exerciseBodyweightDip: { kind: 'push', tip: 'formTipPush' },
  exerciseTriceps: { kind: 'push', tip: 'formTipPush' },
  exerciseOverheadTriceps: { kind: 'press', tip: 'formTipPress' },
  exerciseCloseGripBench: { kind: 'push', tip: 'formTipPush' },
  exerciseSquat: { kind: 'squat', tip: 'formTipSquat' },
  exerciseLegPress: { kind: 'squat', tip: 'formTipSquat' },
  exerciseReverseLunge: { kind: 'lunge', tip: 'formTipLunge' },
  exerciseSplitSquat: { kind: 'lunge', tip: 'formTipLunge' },
  exerciseGoodMorning: { kind: 'hinge', tip: 'formTipHinge' },
  exerciseNordicCurl: { kind: 'hinge', tip: 'formTipHinge' },
  exerciseSingleLegRdl: { kind: 'hinge', tip: 'formTipHinge' },
  exerciseRdl: { kind: 'hinge', tip: 'formTipHinge' },
  exerciseKettlebellSwing: { kind: 'hinge', tip: 'formTipHinge' },
  exercisePlank: { kind: 'plank', tip: 'formTipPlank' },
  exerciseSidePlank: { kind: 'plank', tip: 'formTipPlank', image: specialFormImages.sidePlank },
  exerciseSuperman: { kind: 'core', tip: 'formTipCore', image: specialFormImages.superman },
  exerciseReverseSnowAngel: { kind: 'core', tip: 'formTipCore', image: specialFormImages.reverseSnowAngel },
  exerciseBodyweightRow: { kind: 'row', tip: 'formTipRow' },
  exerciseInvertedRow: { kind: 'row', tip: 'formTipRow' },
  exerciseBandRow: { kind: 'row', tip: 'formTipRow' },
  exerciseKettlebellRow: { kind: 'row', tip: 'formTipRow' },
  exerciseRow: { kind: 'row', tip: 'formTipRow' },
  exerciseLatPulldown: { kind: 'row', tip: 'formTipRow' },
  exercisePullup: { kind: 'pullup', tip: 'formTipPullup' },
  exercisePikePushup: { kind: 'press', tip: 'formTipPress', image: specialFormImages.pikePushup },
  exerciseShoulderTap: { kind: 'plank', tip: 'formTipPlank', image: specialFormImages.shoulderTap },
  exerciseProneYRaise: { kind: 'press', tip: 'formTipPress' },
  exerciseShoulderPress: { kind: 'press', tip: 'formTipPress' },
  exerciseBandShoulderPress: { kind: 'press', tip: 'formTipPress' },
  exerciseKettlebellPress: { kind: 'press', tip: 'formTipPress' },
  exerciseBench: { kind: 'press', tip: 'formTipPress' },
  exerciseInclineBench: { kind: 'press', tip: 'formTipPress' },
  exerciseCableFly: { kind: 'press', tip: 'formTipPress' },
  exerciseLateralRaise: { kind: 'press', tip: 'formTipPress' },
  exerciseFacePull: { kind: 'row', tip: 'formTipRow' },
  exerciseCurl: { kind: 'curl', tip: 'formTipCurl' },
  exerciseHammerCurl: { kind: 'curl', tip: 'formTipCurl' },
  exerciseCableCurl: { kind: 'curl', tip: 'formTipCurl' },
  exerciseBandCurl: { kind: 'curl', tip: 'formTipCurl' },
  exerciseSelfResistedCurl: { kind: 'curl', tip: 'formTipCurl' },
  exerciseTowelCurl: { kind: 'curl', tip: 'formTipCurl' },
  exerciseGluteBridge: { kind: 'bridge', tip: 'formTipBridge' },
  exerciseSingleLegGluteBridge: { kind: 'bridge', tip: 'formTipBridge' },
  exerciseDonkeyKick: { kind: 'bridge', tip: 'formTipBridge' },
  exerciseHipThrust: { kind: 'bridge', tip: 'formTipBridge' },
  exerciseCalfRaise: { kind: 'calf', tip: 'formTipCalf' },
  exerciseSingleLegCalfRaise: { kind: 'calf', tip: 'formTipCalf' },
  exerciseCalfPulse: { kind: 'calf', tip: 'formTipCalf' },
  exerciseSeatedCalfRaise: { kind: 'calf', tip: 'formTipCalf' },
  exerciseDeadBug: { kind: 'core', tip: 'formTipCore' },
  exerciseMountain: { kind: 'core', tip: 'formTipCore' },
  exerciseCableCrunch: { kind: 'core', tip: 'formTipCore' },
};

export function exerciseFormGuideFor(name: string) {
  return guideByExercise[name] ?? { kind: 'core' as FormKind, tip: 'formTipCore' as TranslationKey };
}

export function hasExerciseFormGuide(name: string) {
  return name in guideByExercise;
}

export function ExerciseFormGuide({ visible, exerciseName, language, onClose }: { visible: boolean; exerciseName: string; language: Language; onClose: () => void }) {
  const colors = useColors();
  const guide = exerciseFormGuideFor(exerciseName);
  const title = translate(language, exerciseName as TranslationKey);
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.header}>
          <View style={styles.heading}>
            <View style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="body-outline" size={18} color={colors.primary} /></View>
            <View style={styles.headingCopy}>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>{translate(language, 'exerciseFormTitle')}</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={translate(language, 'exerciseFormClose')} onPress={onClose} hitSlop={8} style={[styles.close, { backgroundColor: colors.secondary }]}>
            <Ionicons name="close" size={19} color={colors.foreground} />
          </Pressable>
        </View>
        <Image source={guide.image ?? formImages[guide.kind]} resizeMode="contain" style={styles.image} />
        <View style={[styles.tip, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}35` }]}>
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.foreground }]}>{translate(language, guide.tip)}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.action, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}>
          <Text style={[styles.actionText, { color: colors.primaryForeground }]}>{translate(language, 'exerciseFormClose')}</Text>
        </Pressable>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#020B18B8', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  card: { width: '100%', maxWidth: 360, borderRadius: 22, borderWidth: 1, padding: 11, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 9 },
  icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 17, lineHeight: 21, marginTop: 1 },
  close: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: 176, borderRadius: 15, backgroundColor: '#2461B4' },
  tip: { minHeight: 54, borderRadius: 13, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 9, marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17 },
  action: { minHeight: 44, borderRadius: 14, marginTop: 10, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
});