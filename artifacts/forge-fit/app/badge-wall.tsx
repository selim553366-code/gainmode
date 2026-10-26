import React from 'react';
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient as SvgGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PressableScale as Pressable } from '@/components/Motion';
import { Ionicons } from '@/components/AppIcon';
import { BadgeGlyph, BadgeMedal, shade } from '@/components/BadgeMedal';
import { BadgeDetailSheet, formatBadgeDate } from '@/components/BadgeViews';
import { getBadgeMetrics, useFit } from '@/context/FitContext';
import { badgeText, badges, badgeUi, type BadgeDefinition } from '@/lib/badges';

const PLANK = 92;
const COLUMNS = 3;
const MEDAL = 74;
const CELL_HEIGHT = 196;
const woodTones = ['#8A5A34', '#7B4D2A', '#94633A', '#82542F', '#8E5D36'];
const ENGRAVE = '#2E1A0B';
const CHALK = 'rgba(255,242,224,0.42)';

/** Deterministic noise so the grain is the same on every visit. */
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

/** Horizontal planks with wavy grain, a few knots and dark seams, drawn once for the wall's size. */
const WoodWall = React.memo(function WoodWall({ width, height }: { width: number; height: number }) {
  const random = seeded(7);
  const planks = Math.ceil(height / PLANK);
  return <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
    <Defs>
      <SvgGradient id="plankShade" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.07} />
        <Stop offset="0.5" stopColor="#000000" stopOpacity={0} />
        <Stop offset="1" stopColor="#000000" stopOpacity={0.16} />
      </SvgGradient>
      <RadialGradient id="knot" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor="#3A2111" stopOpacity={0.9} />
        <Stop offset="0.6" stopColor="#5A3519" stopOpacity={0.6} />
        <Stop offset="1" stopColor="#5A3519" stopOpacity={0} />
      </RadialGradient>
    </Defs>
    {Array.from({ length: planks }, (_, index) => {
      const y = index * PLANK;
      const tone = woodTones[index % woodTones.length];
      const grain = Array.from({ length: 11 }, (__, line) => {
        const base = y + 6 + (line / 11) * (PLANK - 10) + random() * 4;
        const amplitude = 1.5 + random() * 4;
        const phase = random() * Math.PI * 2;
        const wavelength = 120 + random() * 160;
        let d = `M 0 ${base}`;
        for (let x = 0; x <= width + 20; x += 20) d += ` L ${x} ${base + Math.sin(x / wavelength * Math.PI * 2 + phase) * amplitude}`;
        return { d, opacity: 0.12 + random() * 0.16, dark: random() > 0.35 };
      });
      const knot = random() > 0.45 ? { x: random() * width, y: y + PLANK * (0.3 + random() * 0.4), r: 7 + random() * 9 } : null;
      // Butt joints break each plank into boards of different lengths.
      const joint = 80 + random() * (width - 160);
      return <G key={index}>
        <Rect x={0} y={y} width={width} height={PLANK} fill={tone} />
        {grain.map((line, lineIndex) => <Path key={lineIndex} d={line.d} stroke={line.dark ? '#4A2C14' : '#B07A4A'} strokeOpacity={line.opacity} strokeWidth={line.dark ? 1.2 : 0.8} fill="none" />)}
        {knot ? <>
          <Ellipse cx={knot.x} cy={knot.y} rx={knot.r * 1.7} ry={knot.r} fill="url(#knot)" />
          <Ellipse cx={knot.x} cy={knot.y} rx={knot.r * 2.6} ry={knot.r * 1.5} stroke="#4A2C14" strokeOpacity={0.22} fill="none" />
          <Ellipse cx={knot.x} cy={knot.y} rx={knot.r * 3.6} ry={knot.r * 2} stroke="#4A2C14" strokeOpacity={0.12} fill="none" />
        </> : null}
        <Rect x={0} y={y} width={width} height={PLANK} fill="url(#plankShade)" />
        <Rect x={joint} y={y} width={2} height={PLANK} fill="#2B180A" opacity={0.75} />
        <Rect x={0} y={y + PLANK - 2} width={width} height={2} fill="#2B180A" opacity={0.85} />
        <Rect x={0} y={y + PLANK} width={width} height={1} fill="#C99363" opacity={0.25} />
      </G>;
    })}
  </Svg>;
});

/** A small steel nail with a highlight. */
function Nail() {
  return <Svg width={14} height={14} viewBox="0 0 14 14">
    <Circle cx={7} cy={8} r={5.5} fill="#000000" opacity={0.35} />
    <Circle cx={7} cy={7} r={5} fill="#7D838C" />
    <Circle cx={7} cy={7} r={3.6} fill="#B8BEC6" />
    <Circle cx={5.6} cy={5.6} r={1.4} fill="#FFFFFF" opacity={0.85} />
  </Svg>;
}

/** Text carved into the wood: a dark cut with a light lower lip. */
function Engraved({ children, size, weight = 'Inter_700Bold', opacity = 1, numberOfLines }: { children: React.ReactNode; size: number; weight?: string; opacity?: number; numberOfLines?: number }) {
  return <Text numberOfLines={numberOfLines} style={[styles.engraved, { fontSize: size, lineHeight: size * 1.25, fontFamily: weight, opacity }]}>{children}</Text>;
}

function WallMedal({ badge, index, earnedAt, onPress }: { badge: BadgeDefinition; index: number; earnedAt?: string; onPress: () => void }) {
  const { language } = useFit();
  const reduced = useReducedMotion();
  const swing = useSharedValue(reduced ? 0 : 16);
  const drop = useSharedValue(reduced ? 1 : 0);

  React.useEffect(() => {
    if (reduced) return;
    const delay = 120 + index * 70;
    drop.set(withDelay(delay, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) })));
    swing.set(withDelay(delay + 200, withSpring(0, { stiffness: 70, damping: 4.5, mass: 1 })));
  }, [drop, index, reduced, swing]);

  const hangStyle = useAnimatedStyle(() => ({
    opacity: drop.get(),
    transform: [{ translateY: (1 - drop.get()) * -40 }, { rotate: `${swing.get()}deg` }],
  }));

  const nudge = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    if (!reduced) swing.set(withSequence(withTiming(-9, { duration: 140 }), withSpring(0, { stiffness: 80, damping: 5 })));
    onPress();
  };

  const ribbon = badge.color;
  const date = formatBadgeDate(earnedAt, language);
  return <Pressable testID={`wall-${badge.id}`} accessibilityRole="button" accessibilityLabel={badgeText(badge.title, language)} scaleTo={1} onPress={nudge} style={styles.cell}>
    <Animated.View style={[styles.hang, { transformOrigin: 'top' }, hangStyle]}>
      <Svg width={MEDAL} height={46} viewBox={`0 0 ${MEDAL} 46`} style={styles.ribbon}>
        <Path d={`M ${MEDAL / 2 - 3} 2 L ${MEDAL / 2 - 20} 44 L ${MEDAL / 2 - 8} 44 L ${MEDAL / 2 + 1} 4 Z`} fill={ribbon} />
        <Path d={`M ${MEDAL / 2 + 3} 2 L ${MEDAL / 2 + 20} 44 L ${MEDAL / 2 + 8} 44 L ${MEDAL / 2 - 1} 4 Z`} fill={shade(ribbon, -0.3)} />
        <Path d={`M ${MEDAL / 2 - 14} 30 L ${MEDAL / 2 + 14} 30`} stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={1} />
      </Svg>
      <View style={styles.medalShadow}><BadgeMedal badge={badge} size={MEDAL} /></View>
    </Animated.View>
    <View style={styles.nail}><Nail /></View>
    <View style={styles.label}>
      <Engraved size={12} numberOfLines={2}>{badgeText(badge.title, language)}</Engraved>
      {date ? <Engraved size={9} weight="Inter_500Medium" opacity={0.75}>{date}</Engraved> : null}
    </View>
  </Pressable>;
}

/** A locked slot: an empty nail and a chalk sketch of the medal still to be earned. */
function ChalkSlot({ badge, onPress }: { badge: BadgeDefinition; onPress: () => void }) {
  const { language } = useFit();
  return <Pressable testID={`wall-${badge.id}`} accessibilityRole="button" accessibilityLabel={badgeText(badge.title, language)} scaleTo={0.97} onPress={onPress} style={styles.cell}>
    <View style={styles.hang}>
      <View style={{ height: 46 }} />
      <View style={{ width: MEDAL, height: MEDAL, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={MEDAL} height={MEDAL} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
          <Circle cx={50} cy={50} r={46} stroke={CHALK} strokeWidth={2} strokeDasharray="7 5" fill="none" />
          <Circle cx={51} cy={49} r={44} stroke={CHALK} strokeWidth={1} strokeDasharray="3 9" fill="none" opacity={0.7} />
          <Circle cx={50} cy={50} r={34} stroke={CHALK} strokeWidth={1.2} strokeDasharray="2 6" fill="none" opacity={0.6} />
        </Svg>
        <View style={{ opacity: 0.55 }}><BadgeGlyph icon={badge.icon} size={MEDAL * 0.32} color="#F5E6D3" strokeWidth={1.4} /></View>
      </View>
    </View>
    <View style={styles.nail}><Nail /></View>
    <View style={styles.label}>
      <Text numberOfLines={2} style={styles.chalkText}>{badgeText(badge.title, language)}</Text>
      <Ionicons name="badge-lock" size={11} color={CHALK} />
    </View>
  </Pressable>;
}

export default function BadgeWallScreen() {
  const insets = useSafeAreaInsets();
  const fit = useFit();
  const { language, unlockedBadgeIds, badgeEarnedAt } = fit;
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const [selected, setSelected] = React.useState<BadgeDefinition | null>(null);
  const metrics = getBadgeMetrics(fit);
  const earned = badges.filter((badge) => unlockedBadgeIds.includes(badge.id));
  const ui = <K extends keyof typeof badgeUi>(key: K) => badgeText(badgeUi[key], language);
  // Earned medals hang first; the rest wait as chalk sketches in collection order.
  const ordered = [...earned, ...badges.filter((badge) => !unlockedBadgeIds.includes(badge.id))];

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (Math.abs(width - size.width) > 1 || Math.abs(height - size.height) > 1) setSize({ width, height });
  };

  return <View style={styles.root}>
    <ScrollView contentContainerStyle={{ minHeight: '100%' }} showsVerticalScrollIndicator={false}>
      <View onLayout={onLayout} style={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }]}>
        {size.width ? <WoodWall width={size.width} height={size.height} /> : null}
        <LinearGradient pointerEvents="none" colors={['rgba(255,200,140,0.22)', 'rgba(255,200,140,0)']} style={styles.spotlight} />
        <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0)', 'rgba(20,10,3,0.55)']} style={styles.floorShade} />

        <View style={styles.topBar}>
          <Pressable testID="wall-back" accessibilityRole="button" accessibilityLabel={ui('close')} onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={20} color="#FFF4E6" />
          </Pressable>
        </View>

        <View style={styles.plaque}>
          <LinearGradient colors={['#F8DD9A', '#C99A3E', '#8F6418', '#E8C677']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.plaqueMetal}>
            <View style={styles.plaqueInner}>
              <Text style={styles.plaqueTitle}>{ui('wall').toLocaleUpperCase(language)}</Text>
              <Text style={styles.plaqueCount}>{earned.length} / {badges.length}</Text>
            </View>
          </LinearGradient>
          <View style={[styles.screw, { left: 8 }]} />
          <View style={[styles.screw, { right: 8 }]} />
        </View>
        <Engraved size={12} weight="Inter_500Medium" opacity={0.85}>{earned.length ? ui('wallSubtitle') : ui('wallEmpty')}</Engraved>

        <View style={styles.grid}>
          {ordered.map((badge, index) => unlockedBadgeIds.includes(badge.id)
            ? <WallMedal key={badge.id} badge={badge} index={index} earnedAt={badgeEarnedAt[badge.id]} onPress={() => setSelected(badge)} />
            : <ChalkSlot key={badge.id} badge={badge} onPress={() => setSelected(badge)} />)}
        </View>
      </View>
    </ScrollView>
    <BadgeDetailSheet
      badge={selected}
      metrics={metrics}
      unlocked={Boolean(selected && unlockedBadgeIds.includes(selected.id))}
      earnedAt={selected ? badgeEarnedAt[selected.id] : undefined}
      language={language}
      onClose={() => setSelected(null)}
    />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#5E3A1E' },
  content: { flexGrow: 1, paddingHorizontal: 14, alignItems: 'center', overflow: 'hidden' },
  spotlight: { position: 'absolute', left: 0, right: 0, top: 0, height: 360 },
  floorShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 220 },
  topBar: { alignSelf: 'stretch', flexDirection: 'row' },
  back: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(30,16,6,0.55)', borderWidth: 1, borderColor: 'rgba(255,230,200,0.18)', alignItems: 'center', justifyContent: 'center' },
  plaque: { marginTop: 4, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  plaqueMetal: { borderRadius: 12, padding: 3 },
  plaqueInner: { borderRadius: 9, borderWidth: 1, borderColor: 'rgba(90,60,10,0.6)', paddingHorizontal: 34, paddingVertical: 10, alignItems: 'center' },
  plaqueTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: 3, color: '#4A3208', textShadowColor: 'rgba(255,240,200,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0 },
  plaqueCount: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.5, color: '#5C4010', marginTop: 2, textShadowColor: 'rgba(255,240,200,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0 },
  screw: { position: 'absolute', top: '50%', marginTop: -3, width: 6, height: 6, borderRadius: 3, backgroundColor: '#6B4A12', borderWidth: 1, borderColor: '#F3D58C' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'stretch', marginTop: 22 },
  cell: { width: `${100 / COLUMNS}%`, height: CELL_HEIGHT, alignItems: 'center' },
  hang: { alignItems: 'center', paddingTop: 6 },
  ribbon: { marginBottom: -10 },
  medalShadow: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 2, height: 8 }, elevation: 8, borderRadius: MEDAL / 2 },
  nail: { position: 'absolute', top: 0 },
  label: { alignItems: 'center', gap: 2, marginTop: 10, paddingHorizontal: 6 },
  engraved: { color: ENGRAVE, textAlign: 'center', textShadowColor: 'rgba(255,214,170,0.38)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0 },
  chalkText: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 14, color: CHALK, textAlign: 'center' },
});
