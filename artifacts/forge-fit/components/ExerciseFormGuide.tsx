import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { Ionicons } from '@/components/AppIcon';
import { useColors } from '@/hooks/useColors';
import { apiUrl } from '@/lib/api';
import { translate, type Language, type TranslationKey } from '@/lib/i18n';

type FormKind = 'push' | 'squat' | 'lunge' | 'hinge' | 'plank' | 'row' | 'press' | 'curl' | 'bridge' | 'calf' | 'pullup' | 'core';

const remoteImage = (fileName: string): ImageSourcePropType => ({
  uri: apiUrl(`/api/app-assets/form-guides/${fileName}`),
});

const formImages: Record<FormKind, ImageSourcePropType> = {
  push: remoteImage('live-guide-coach-pushup-oblique-skeleton.png'),
  squat: remoteImage('live-guide-coach-squat-oblique-skeleton.png'),
  lunge: remoteImage('live-guide-coach-lunge-oblique-skeleton.png'),
  hinge: remoteImage('form-coach-hinge.png'),
  plank: remoteImage('form-coach-plank.png'),
  row: remoteImage('form-coach-row.png'),
  press: remoteImage('form-coach-press.png'),
  curl: remoteImage('form-coach-curl.png'),
  bridge: remoteImage('form-coach-bridge.png'),
  calf: remoteImage('form-coach-calf.png'),
  pullup: remoteImage('form-coach-pullup.png'),
  core: remoteImage('form-coach-core.png'),
};

const specialFormImages = {
  pikePushup: remoteImage('form-coach-pike-pushup.png'),
  shoulderTap: remoteImage('form-coach-shoulder-tap.png'),
  diamondPushup: remoteImage('form-coach-diamond-pushup.png'),
  closeGripPushup: remoteImage('form-coach-close-grip-pushup.png'),
  sidePlank: remoteImage('form-coach-side-plank.png'),
  superman: remoteImage('form-coach-superman.png'),
  reverseSnowAngel: remoteImage('form-coach-reverse-snow-angel.png'),
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
  // Equipment variants reuse the closest coach pose so the full exercise
  // library has a guide without adding a separate image for every variant.
  exerciseArnoldPress: { kind: 'press', tip: 'formTipPress' },
  exerciseBandChestPress: { kind: 'press', tip: 'formTipPress' },
  exerciseBandTriceps: { kind: 'press', tip: 'formTipPress' },
  exerciseBentOverDumbbellRow: { kind: 'row', tip: 'formTipRow' },
  exerciseCloseGripDumbbellPress: { kind: 'press', tip: 'formTipPress' },
  exerciseConcentrationCurl: { kind: 'curl', tip: 'formTipCurl' },
  exerciseDumbbellBenchPress: { kind: 'press', tip: 'formTipPress' },
  exerciseDumbbellBulgarianSplitSquat: { kind: 'lunge', tip: 'formTipLunge' },
  exerciseDumbbellCurl: { kind: 'curl', tip: 'formTipCurl' },
  exerciseDumbbellFarmerCarry: { kind: 'hinge', tip: 'formTipHinge' },
  exerciseDumbbellFloorPress: { kind: 'press', tip: 'formTipPress' },
  exerciseDumbbellFly: { kind: 'press', tip: 'formTipPress' },
  exerciseDumbbellFrontRaise: { kind: 'press', tip: 'formTipPress' },
  exerciseDumbbellGoodMorning: { kind: 'hinge', tip: 'formTipHinge' },
  exerciseDumbbellHammerCurl: { kind: 'curl', tip: 'formTipCurl' },
  exerciseDumbbellHipThrust: { kind: 'bridge', tip: 'formTipBridge' },
  exerciseDumbbellKickback: { kind: 'press', tip: 'formTipPress' },
  exerciseDumbbellLateralRaise: { kind: 'press', tip: 'formTipPress' },
  exerciseDumbbellOverheadTriceps: { kind: 'press', tip: 'formTipPress' },
  exerciseDumbbellRdl: { kind: 'hinge', tip: 'formTipHinge' },
  exerciseDumbbellReverseFly: { kind: 'row', tip: 'formTipRow' },
  exerciseDumbbellRussianTwist: { kind: 'core', tip: 'formTipCore' },
  exerciseDumbbellShoulderPress: { kind: 'press', tip: 'formTipPress' },
  exerciseDumbbellSideBend: { kind: 'core', tip: 'formTipCore' },
  exerciseDumbbellSkullCrusher: { kind: 'press', tip: 'formTipPress' },
  exerciseDumbbellStepUp: { kind: 'lunge', tip: 'formTipLunge' },
  exerciseDumbbellSumoSquat: { kind: 'squat', tip: 'formTipSquat' },
  exerciseDumbbellThruster: { kind: 'squat', tip: 'formTipSquat' },
  exerciseGobletSquat: { kind: 'squat', tip: 'formTipSquat' },
  exerciseInclineDumbbellCurl: { kind: 'curl', tip: 'formTipCurl' },
  exerciseInclineDumbbellPress: { kind: 'press', tip: 'formTipPress' },
  exerciseLegCurl: { kind: 'hinge', tip: 'formTipHinge' },
  exerciseOneArmDumbbellRow: { kind: 'row', tip: 'formTipRow' },
  exerciseRenegadeRow: { kind: 'row', tip: 'formTipRow' },
  exerciseSeatedDumbbellCalfRaise: { kind: 'calf', tip: 'formTipCalf' },
  exerciseStandingDumbbellCalfRaise: { kind: 'calf', tip: 'formTipCalf' },
  exerciseSingleLegDumbbellRdl: { kind: 'hinge', tip: 'formTipHinge' },
  exerciseWeightedDeadBug: { kind: 'core', tip: 'formTipCore' },
};

const missingExerciseImages: Record<string, ImageSourcePropType> = {
  exerciseBodyweightDip: remoteImage('form-coach-bodyweight-dip.png'),
  exerciseTriceps: remoteImage('form-coach-triceps.png'),
  exerciseOverheadTriceps: remoteImage('form-coach-overhead-triceps.png'),
  exerciseCloseGripBench: remoteImage('form-coach-close-grip-bench.png'),
  exerciseSquat: remoteImage('form-coach-squat.png'),
  exerciseLegPress: remoteImage('form-coach-leg-press.png'),
  exerciseReverseLunge: remoteImage('form-coach-reverse-lunge.png'),
  exerciseSplitSquat: remoteImage('form-coach-split-squat.png'),
  exerciseGoodMorning: remoteImage('form-coach-good-morning.png'),
  exerciseNordicCurl: remoteImage('form-coach-nordic-curl.png'),
  exerciseSingleLegRdl: remoteImage('form-coach-single-leg-rdl.png'),
  exerciseRdl: remoteImage('form-coach-rdl.png'),
  exerciseKettlebellSwing: remoteImage('form-coach-kettlebell-swing.png'),
  exercisePlank: remoteImage('form-coach-plank_2.png'),
  exerciseBodyweightRow: remoteImage('form-coach-bodyweight-row.png'),
  exerciseInvertedRow: remoteImage('form-coach-inverted-row.png'),
  exerciseBandRow: remoteImage('form-coach-band-row.png'),
  exerciseKettlebellRow: remoteImage('form-coach-kettlebell-row.png'),
  exerciseRow: remoteImage('form-coach-row_2.png'),
  exerciseLatPulldown: remoteImage('form-coach-lat-pulldown.png'),
  exercisePullup: remoteImage('form-coach-pullup_2.png'),
  exerciseProneYRaise: remoteImage('form-coach-prone-yraise.png'),
  exerciseShoulderPress: remoteImage('form-coach-shoulder-press.png'),
  exerciseBandShoulderPress: remoteImage('form-coach-band-shoulder-press.png'),
  exerciseKettlebellPress: remoteImage('form-coach-kettlebell-press.png'),
  exerciseBench: remoteImage('form-coach-bench.png'),
  exerciseInclineBench: remoteImage('form-coach-incline-bench.png'),
  exerciseCableFly: remoteImage('form-coach-cable-fly.png'),
  exerciseLateralRaise: remoteImage('form-coach-lateral-raise.png'),
  exerciseFacePull: remoteImage('form-coach-face-pull.png'),
  exerciseCurl: remoteImage('form-coach-curl_2.png'),
  exerciseHammerCurl: remoteImage('form-coach-hammer-curl.png'),
  exerciseCableCurl: remoteImage('form-coach-cable-curl.png'),
  exerciseBandCurl: remoteImage('form-coach-band-curl.png'),
  exerciseSelfResistedCurl: remoteImage('form-coach-self-resisted-curl.png'),
  exerciseTowelCurl: remoteImage('form-coach-towel-curl.png'),
  exerciseGluteBridge: remoteImage('form-coach-glute-bridge.png'),
  exerciseSingleLegGluteBridge: remoteImage('form-coach-single-leg-glute-bridge.png'),
  exerciseDonkeyKick: remoteImage('form-coach-donkey-kick.png'),
  exerciseHipThrust: remoteImage('form-coach-hip-thrust.png'),
  exerciseCalfRaise: remoteImage('form-coach-calf-raise.png'),
  exerciseSingleLegCalfRaise: remoteImage('form-coach-single-leg-calf-raise.png'),
  exerciseCalfPulse: remoteImage('form-coach-calf-pulse.png'),
  exerciseSeatedCalfRaise: remoteImage('form-coach-seated-calf-raise.png'),
  exerciseDeadBug: remoteImage('form-coach-dead-bug.png'),
  exerciseMountain: remoteImage('form-coach-mountain.png'),
  exerciseCableCrunch: remoteImage('form-coach-cable-crunch.png'),
};

const generatedExerciseImages: Record<string, ImageSourcePropType> = {
  exerciseArnoldPress: remoteImage('form-coach-arnold-press.webp'),
  exerciseBandChestPress: remoteImage('form-coach-band-chest-press.webp'),
  exerciseBandTriceps: remoteImage('form-coach-band-triceps.webp'),
  exerciseBentOverDumbbellRow: remoteImage('form-coach-bent-over-dumbbell-row.webp'),
  exerciseCloseGripDumbbellPress: remoteImage('form-coach-close-grip-dumbbell-press.webp'),
  exerciseConcentrationCurl: remoteImage('form-coach-concentration-curl.webp'),
  exerciseDumbbellBenchPress: remoteImage('form-coach-dumbbell-bench-press.webp'),
  exerciseDumbbellBulgarianSplitSquat: remoteImage('form-coach-dumbbell-bulgarian-split-squat.webp'),
  exerciseDumbbellCurl: remoteImage('form-coach-dumbbell-curl.webp'),
  exerciseDumbbellFarmerCarry: remoteImage('form-coach-dumbbell-farmer-carry.webp'),
  exerciseDumbbellFloorPress: remoteImage('form-coach-dumbbell-floor-press.webp'),
  exerciseDumbbellFly: remoteImage('form-coach-dumbbell-fly.webp'),
  exerciseDumbbellFrontRaise: remoteImage('form-coach-dumbbell-front-raise.webp'),
  exerciseDumbbellGoodMorning: remoteImage('form-coach-dumbbell-good-morning.webp'),
  exerciseDumbbellHammerCurl: remoteImage('form-coach-dumbbell-hammer-curl.webp'),
  exerciseDumbbellHipThrust: remoteImage('form-coach-dumbbell-hip-thrust.webp'),
  exerciseDumbbellKickback: remoteImage('form-coach-dumbbell-kickback.webp'),
  exerciseDumbbellLateralRaise: remoteImage('form-coach-dumbbell-lateral-raise.webp'),
  exerciseDumbbellOverheadTriceps: remoteImage('form-coach-dumbbell-overhead-triceps.webp'),
  exerciseDumbbellRdl: remoteImage('form-coach-dumbbell-rdl.webp'),
  exerciseDumbbellReverseFly: remoteImage('form-coach-dumbbell-reverse-fly.webp'),
  exerciseDumbbellRussianTwist: remoteImage('form-coach-dumbbell-russian-twist.webp'),
  exerciseDumbbellShoulderPress: remoteImage('form-coach-dumbbell-shoulder-press.webp'),
  exerciseDumbbellSideBend: remoteImage('form-coach-dumbbell-side-bend.webp'),
  exerciseDumbbellSkullCrusher: remoteImage('form-coach-dumbbell-skull-crusher.webp'),
  exerciseDumbbellStepUp: remoteImage('form-coach-dumbbell-step-up.webp'),
  exerciseDumbbellSumoSquat: remoteImage('form-coach-dumbbell-sumo-squat.webp'),
  exerciseDumbbellThruster: remoteImage('form-coach-dumbbell-thruster.webp'),
  exerciseGobletSquat: remoteImage('form-coach-goblet-squat.webp'),
  exerciseInclineDumbbellCurl: remoteImage('form-coach-incline-dumbbell-curl.webp'),
  exerciseInclineDumbbellPress: remoteImage('form-coach-incline-dumbbell-press.webp'),
  exerciseInclinePushup: remoteImage('form-coach-incline-pushup.webp'),
  exerciseLegCurl: remoteImage('form-coach-leg-curl.webp'),
  exerciseOneArmDumbbellRow: remoteImage('form-coach-one-arm-dumbbell-row.webp'),
  exercisePushup: remoteImage('form-coach-pushup.webp'),
  exerciseRenegadeRow: remoteImage('form-coach-renegade-row.webp'),
  exerciseSeatedDumbbellCalfRaise: remoteImage('form-coach-seated-dumbbell-calf-raise.webp'),
  exerciseSingleLegDumbbellRdl: remoteImage('form-coach-single-leg-dumbbell-rdl.webp'),
  exerciseStandingDumbbellCalfRaise: remoteImage('form-coach-standing-dumbbell-calf-raise.webp'),
  exerciseWeightedDeadBug: remoteImage('form-coach-weighted-dead-bug.webp'),
  exerciseWidePushup: remoteImage('form-coach-wide-pushup.webp'),
};

Object.entries(missingExerciseImages).forEach(([exercise, image]) => {
  if (guideByExercise[exercise]) guideByExercise[exercise].image = image;
});
Object.entries(generatedExerciseImages).forEach(([exercise, image]) => {
  if (guideByExercise[exercise]) guideByExercise[exercise].image = image;
});

export function exerciseFormGuideFor(name: string) {
  return guideByExercise[name] ?? { kind: 'core' as FormKind, tip: 'formTipCore' as TranslationKey };
}

export function hasExerciseFormGuide(name: string) {
  return name in guideByExercise;
}

export function ExerciseFormGuide({ visible, exerciseName, language, onClose }: { visible: boolean; exerciseName: string; language: Language; onClose: () => void }) {
  const colors = useColors();
  if (!visible) return null;
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
        <Image source={guide.image ?? formImages[guide.kind]} resizeMode="cover" style={styles.image} />
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
  image: { width: '100%', height: 196, borderRadius: 15, backgroundColor: '#2461B4' },
  tip: { minHeight: 54, borderRadius: 13, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 9, marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17 },
  action: { minHeight: 44, borderRadius: 14, marginTop: 10, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
});