import React from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PressableScale as Pressable, EASE_OUT } from '@/components/Motion';
import { BadgeMedal, tierMetal } from '@/components/BadgeMedal';
import { TierChip } from '@/components/BadgeViews';
import { useFit } from '@/context/FitContext';
import { badges, badgeText, badgeUi, type BadgeDefinition } from '@/lib/badges';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TOTAL = 2400;
const T = {
  backdrop: [0, 320],
  ring: [250, 850],
  spin: [350, 1150],
  land: 1150,
  burst: [1150, 2150],
  wave: [1150, 1750],
  eyebrow: [1300, 1650],
  chip: [1420, 1720],
  title: [1500, 1880],
  body: [1600, 1980],
  actions: [1900, 2350],
} as const;
const at = (ms: number) => ms / TOTAL;
const MEDAL = 168;
const STAGE = 300;
const RING_R = 112;
const RING_LENGTH = 2 * Math.PI * RING_R;

/** Plays a sound; a blocked autoplay (web, before any tap) is not an error worth surfacing. */
function playQuietly(player: ReturnType<typeof useAudioPlayer>) {
  try {
    void player.seekTo(0).catch(() => undefined);
    const result = player.play() as unknown;
    if (result instanceof Promise) result.catch(() => undefined);
  } catch {
    // Sound is decoration; the haptic still lands.
  }
}

/** Fixed particle layout so every unlock bursts the same, balanced way. */
const PARTICLES = Array.from({ length: 26 }, (_, index) => {
  const angle = (index / 26) * Math.PI * 2 + (index % 3) * 0.17;
  return { angle, distance: 105 + ((index * 37) % 70), size: 3 + (index % 4) * 1.6, kind: index % 3, spin: (index % 2 ? 1 : -1) * (120 + index * 9) };
});

function Particle({ clock, color, index }: { clock: ReturnType<typeof useSharedValue<number>>; color: string; index: number }) {
  const particle = PARTICLES[index];
  const style = useAnimatedStyle(() => {
    const p = interpolate(clock.get(), [at(T.burst[0]), at(T.burst[1])], [0, 1], 'clamp');
    const eased = 1 - (1 - p) ** 3;
    const x = Math.cos(particle.angle) * particle.distance * eased;
    // A little gravity pulls the pieces down as they slow.
    const y = Math.sin(particle.angle) * particle.distance * eased + p * p * 70;
    return {
      opacity: p <= 0 ? 0 : interpolate(p, [0, 0.1, 0.7, 1], [0, 1, 1, 0]),
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${particle.spin * p}deg` }, { scale: 1 - p * 0.4 }],
    };
  });
  return <Animated.View style={[styles.particle, {
    width: particle.size * (particle.kind === 1 ? 2.4 : 1.4),
    height: particle.size * 1.4,
    borderRadius: particle.kind === 0 ? particle.size : 1.5,
    backgroundColor: color,
  }, style]} />;
}

/**
 * A badge is minted: the screen dims into the badge's colour, a metal ring draws itself, the medal
 * spins in like a tossed coin and lands with a clink, haptic and a burst of confetti; light sweeps
 * across its face, then the rarity stamps in and the copy rises. Light rays keep turning slowly
 * behind it until the person hangs it on their wall or closes it.
 */
function BadgeUnlockSequence({ badge, onDone }: { badge: BadgeDefinition; onDone: (openWall: boolean) => void }) {
  const { language } = useFit();
  const reduced = useReducedMotion();
  const androidLiteMode = Platform.OS === 'android';
  const clock = useSharedValue(reduced ? 1 : 0);
  const rays = useSharedValue(0);
  const float = useSharedValue(0);
  const shine = useSharedValue(0);
  const clink = useAudioPlayer(require('@/assets/sounds/badge-unlock.wav'));
  const metal = tierMetal[badge.tier];

  React.useEffect(() => {
    const land = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); };
    if (!androidLiteMode) void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
    if (reduced) {
      land();
      return undefined;
    }
    if (androidLiteMode) {
      clock.set(withTiming(1, { duration: 950, easing: Easing.out(Easing.cubic) }));
      const haptic = setTimeout(land, 700);
      return () => {
        clearTimeout(haptic);
        cancelAnimation(clock);
      };
    }
    clock.set(withTiming(1, { duration: TOTAL, easing: Easing.linear }));
    rays.set(withRepeat(withTiming(1, { duration: 24000, easing: Easing.linear }), -1));
    float.set(withDelay(T.land + 400, withRepeat(withSequence(withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.sin) })), -1)));
    shine.set(withDelay(T.land + 80, withRepeat(withSequence(withTiming(1, { duration: 900, easing: EASE_OUT }), withDelay(2600, withTiming(0, { duration: 0 }))), -1)));
    // The sound's clink sits 450ms in, so start it to land with the medal.
    const sound = setTimeout(() => { playQuietly(clink); }, T.land - 450);
    const haptics = [
      setTimeout(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined); }, T.spin[0] + 200),
      setTimeout(land, T.land),
      setTimeout(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined); }, T.chip[0] + 120),
    ];
    return () => {
      clearTimeout(sound);
      haptics.forEach(clearTimeout);
      [clock, rays, float, shine].forEach(cancelAnimation);
    };
  }, [androidLiteMode, clink, clock, float, rays, reduced, shine]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: interpolate(clock.get(), [at(T.backdrop[0]), at(T.backdrop[1])], [0, 1], 'clamp') }));
  const bloomStyle = useAnimatedStyle(() => {
    const p = interpolate(clock.get(), [at(T.backdrop[0]), at(T.land)], [0, 1], 'clamp');
    const pulse = interpolate(clock.get(), [at(T.land), at(T.land + 500)], [0, 1], 'clamp');
    return { opacity: p * (1 + 0.35 * Math.sin(pulse * Math.PI)), transform: [{ scale: 0.6 + p * 0.4 + Math.sin(pulse * Math.PI) * 0.15 }] };
  });
  const raysStyle = useAnimatedStyle(() => ({
    opacity: interpolate(clock.get(), [at(T.ring[0]), at(T.land)], [0, 1], 'clamp'),
    transform: [{ rotate: `${rays.get() * 360}deg` }],
  }));
  const ringProps = useAnimatedProps(() => {
    const draw = interpolate(clock.get(), [at(T.ring[0]), at(T.ring[1])], [0, 1], 'clamp');
    const fade = interpolate(clock.get(), [at(T.land - 100), at(T.land + 150)], [1, 0], 'clamp');
    return { strokeDashoffset: RING_LENGTH * (1 - draw), strokeOpacity: draw > 0 ? fade : 0 };
  });
  const waveProps = useAnimatedProps(() => {
    const p = interpolate(clock.get(), [at(T.wave[0]), at(T.wave[1])], [0, 1], 'clamp');
    return { r: 70 + p * 80, strokeOpacity: p > 0 ? (1 - p) * 0.9 : 0, strokeWidth: 6 * (1 - p) + 0.5 };
  });
  const medalStyle = useAnimatedStyle(() => {
    const p = interpolate(clock.get(), [at(T.spin[0]), at(T.spin[1])], [0, 1], 'clamp');
    const eased = 1 - (1 - p) ** 4;
    // Settles with a small overshoot right after it lands.
    const settle = interpolate(clock.get(), [at(T.land), at(T.land + 140), at(T.land + 320)], [1, 1.07, 1], 'clamp');
    return {
      opacity: p > 0 ? Math.min(1, p * 4) : 0,
      transform: [
        { perspective: 800 },
        { translateY: (1 - eased) * -90 - float.get() * 8 },
        { rotateY: `${(1 - eased) * 900}deg` },
        { scale: (0.35 + eased * 0.65) * settle },
      ],
    };
  });
  const eyebrowStyle = useAnimatedStyle(() => {
    const p = interpolate(clock.get(), [at(T.eyebrow[0]), at(T.eyebrow[1])], [0, 1], 'clamp');
    return { opacity: p, transform: [{ translateY: (1 - (1 - (1 - p) ** 3)) * 14 }] };
  });
  const chipStyle = useAnimatedStyle(() => {
    const p = interpolate(clock.get(), [at(T.chip[0]), at(T.chip[1])], [0, 1], 'clamp');
    // A rubber stamp: comes in large, presses down, rebounds a touch.
    const scale = interpolate(p, [0, 0.55, 0.8, 1], [1.9, 0.92, 1.04, 1]);
    return { opacity: Math.min(1, p * 2.5), transform: [{ scale }, { rotate: `${(1 - p) * -8}deg` }] };
  });
  const titleStyle = useAnimatedStyle(() => {
    const p = interpolate(clock.get(), [at(T.title[0]), at(T.title[1])], [0, 1], 'clamp');
    return { opacity: p, transform: [{ translateY: (1 - (1 - (1 - p) ** 3)) * 18 }] };
  });
  const bodyStyle = useAnimatedStyle(() => {
    const p = interpolate(clock.get(), [at(T.body[0]), at(T.body[1])], [0, 1], 'clamp');
    return { opacity: p, transform: [{ translateY: (1 - (1 - (1 - p) ** 3)) * 14 }] };
  });
  const actionsStyle = useAnimatedStyle(() => {
    const p = interpolate(clock.get(), [at(T.actions[0]), at(T.actions[1])], [0, 1], 'clamp');
    return { opacity: p, transform: [{ translateY: (1 - (1 - (1 - p) ** 3)) * 22 }] };
  });

  const particleColors = [badge.color, metal[0], metal[1], '#FFFFFF'];

  return <View style={styles.root}>
    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />
    <View style={styles.center}>
      <View style={styles.stage}>
        <Animated.View pointerEvents="none" style={[styles.bloom, bloomStyle]}>
          <Svg width="100%" height="100%" viewBox="0 0 200 200">
            <Defs>
              <RadialGradient id="unlockBloom" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={badge.color} stopOpacity={0.75} />
                <Stop offset="0.45" stopColor={badge.color} stopOpacity={0.22} />
                <Stop offset="1" stopColor={badge.color} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={100} cy={100} r={100} fill="url(#unlockBloom)" />
          </Svg>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.rays, raysStyle]}>
          <Svg width={STAGE * 1.5} height={STAGE * 1.5} viewBox="-150 -150 300 300">
            {Array.from({ length: 14 }, (_, index) => {
              const angle = (index / 14) * 360;
              return <Path key={index} d="M -7 -40 L 0 -150 L 7 -40 Z" fill={index % 2 ? metal[0] : badge.color} opacity={index % 2 ? 0.16 : 0.22} transform={`rotate(${angle})`} />;
            })}
          </Svg>
        </Animated.View>
        <Svg pointerEvents="none" width={STAGE} height={STAGE} style={StyleSheet.absoluteFill}>
          <AnimatedCircle cx={STAGE / 2} cy={STAGE / 2} r={RING_R} stroke={metal[1]} strokeWidth={2} fill="none" strokeDasharray={`${RING_LENGTH} ${RING_LENGTH}`} strokeLinecap="round" rotation={-90} origin={`${STAGE / 2}, ${STAGE / 2}`} animatedProps={ringProps} />
          <AnimatedCircle cx={STAGE / 2} cy={STAGE / 2} stroke={metal[0]} fill="none" animatedProps={waveProps} />
        </Svg>
        <View pointerEvents="none" style={styles.particles}>
          {PARTICLES.slice(0, androidLiteMode ? 8 : PARTICLES.length).map((_, index) => <Particle key={index} clock={clock} index={index} color={particleColors[index % particleColors.length]} />)}
        </View>
        <Animated.View style={medalStyle}>
          <BadgeMedal badge={badge} size={MEDAL} shine={shine} />
        </Animated.View>
      </View>

      <Animated.Text style={[styles.eyebrow, { color: metal[0] }, eyebrowStyle]}>{badgeText(badgeUi.unlocked, language).toLocaleUpperCase(language)}</Animated.Text>
      <Animated.View style={[styles.chip, chipStyle]}><TierChip tier={badge.tier} language={language} onDark /></Animated.View>
      <Animated.Text style={[styles.title, titleStyle]}>{badgeText(badge.title, language)}</Animated.Text>
      <Animated.Text style={[styles.body, bodyStyle]}>{badgeText(badge.description, language)}</Animated.Text>

      <Animated.View style={[styles.actions, actionsStyle]}>
        <Pressable testID="badge-unlock-wall" accessibilityRole="button" onPress={() => onDone(true)} style={styles.primary}>
          <Text style={styles.primaryText}>{badgeText(badgeUi.hangIt, language)}</Text>
        </Pressable>
        <Pressable testID="badge-unlock-close" accessibilityRole="button" onPress={() => onDone(false)} style={styles.secondary}>
          <Text style={styles.secondaryText}>{badgeText(badgeUi.great, language)}</Text>
        </Pressable>
      </Animated.View>
    </View>
  </View>;
}

/** Watches for newly earned badges and plays the unlock for each one in turn. */
export function BadgeUnlockHost() {
  const { hydrated, unlockedBadgeIds } = useFit();
  const known = React.useRef<string[] | null>(null);
  const [queue, setQueue] = React.useState<string[]>([]);
  const current = badges.find((badge) => badge.id === queue[0]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (known.current === null) {
      known.current = unlockedBadgeIds;
      return;
    }
    const fresh = unlockedBadgeIds.filter((id) => !known.current!.includes(id));
    known.current = unlockedBadgeIds;
    if (fresh.length) setQueue((items) => [...items, ...fresh.filter((id) => !items.includes(id))]);
  }, [hydrated, unlockedBadgeIds]);

  if (!current) return null;
  return <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={() => setQueue((items) => items.slice(1))}>
    <BadgeUnlockSequence
      key={current.id}
      badge={current}
      onDone={(openWall) => {
        setQueue((items) => (openWall ? [] : items.slice(1)));
        if (openWall) router.push('/badge-wall');
      }}
    />
  </Modal>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { backgroundColor: 'rgba(6,7,11,0.94)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  stage: { width: STAGE, height: STAGE, alignItems: 'center', justifyContent: 'center' },
  bloom: { position: 'absolute', width: STAGE * 1.6, height: STAGE * 1.6 },
  rays: { position: 'absolute', width: STAGE * 1.5, height: STAGE * 1.5 },
  particles: { position: 'absolute', width: 0, height: 0, left: STAGE / 2, top: STAGE / 2 },
  particle: { position: 'absolute' },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 2.2, marginTop: 6 },
  chip: { marginTop: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: -1, color: '#FFFFFF', textAlign: 'center', marginTop: 12 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 21, color: 'rgba(255,255,255,0.68)', textAlign: 'center', marginTop: 8, maxWidth: 300 },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 30 },
  primary: { height: 54, borderRadius: 17, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#0A0B0D' },
  secondary: { height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: 'rgba(255,255,255,0.72)' },
});
