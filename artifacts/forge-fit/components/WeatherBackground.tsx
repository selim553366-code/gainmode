import React from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon } from 'react-native-svg';
import { WEATHER_SCENES, type PaletteGroup, type WeatherKind, type WeatherScene } from '@/lib/weatherBackground';

type Props = {
  kind: WeatherKind;
  isDay: boolean;
  reveal: Animated.Value;
  background: string;
  dark: boolean;
};

type Palette = { top: string; bottom: string };

const SKY: Record<PaletteGroup, { day: Palette; night: Palette }> = {
  sunny: { day: { top: '#4DA3FF', bottom: '#BFE3FF' }, night: { top: '#0B1433', bottom: '#2A2F63' } },
  cloudy: { day: { top: '#8FA6BD', bottom: '#CBD6E0' }, night: { top: '#1A2132', bottom: '#3A4256' } },
  rainy: { day: { top: '#5F7488', bottom: '#9AAAB8' }, night: { top: '#10161F', bottom: '#2B3441' } },
  storm: { day: { top: '#3C4655', bottom: '#6D7685' }, night: { top: '#080B12', bottom: '#1E2430' } },
  snow: { day: { top: '#B9CBDD', bottom: '#EAF2F9' }, night: { top: '#26344A', bottom: '#5A6B86' } },
  fog: { day: { top: '#B4BDC4', bottom: '#DADFE3' }, night: { top: '#2A3036', bottom: '#4C545B' } },
  smog: { day: { top: '#9A8467', bottom: '#C4B08A' }, night: { top: '#2B241B', bottom: '#52463A' } },
  sand: { day: { top: '#C9974F', bottom: '#EBCB93' }, night: { top: '#32230F', bottom: '#5E4A2C' } },
  hot: { day: { top: '#FF9B3D', bottom: '#FFD79A' }, night: { top: '#2A1A2E', bottom: '#6B3A3A' } },
  dry: { day: { top: '#F57C2A', bottom: '#FFC27A' }, night: { top: '#2E1A12', bottom: '#74402A' } },
  mild: { day: { top: '#7CC8F0', bottom: '#F7E3C3' }, night: { top: '#16254A', bottom: '#4A4A78' } },
  cool: { day: { top: '#7FA3C4', bottom: '#D3E0EA' }, night: { top: '#142036', bottom: '#38506C' } },
  cold: { day: { top: '#6FA8D8', bottom: '#DCEBF7' }, night: { top: '#0F2038', bottom: '#34506F' } },
  frost: { day: { top: '#A9D6F0', bottom: '#F0F9FF' }, night: { top: '#122338', bottom: '#40617F' } },
  tornado: { day: { top: '#4A5057', bottom: '#8D8F86' }, night: { top: '#0E1115', bottom: '#2F3338' } },
  hurricane: { day: { top: '#2B3340', bottom: '#66717F' }, night: { top: '#06080C', bottom: '#222A35' } },
};

function mix(from: string, to: string, amount: number) {
  const parse = (hex: string) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  const a = parse(from);
  const b = parse(to);
  return `#${a.map((value, index) => Math.round(value + (b[index] - value) * amount).toString(16).padStart(2, '0')).join('')}`;
}

function rand(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/** Linear 0 to 1 loop that begins part-way through so particles are spread out immediately. */
function useCycle(duration: number, start = 0) {
  const value = React.useRef(new Animated.Value(start)).current;
  React.useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    const first = Animated.timing(value, { toValue: 1, duration: Math.max(1, duration * (1 - start)), easing: Easing.linear, useNativeDriver: true });
    first.start(({ finished }) => {
      if (!finished) return;
      value.setValue(0);
      loop = Animated.loop(Animated.timing(value, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }));
      loop.start();
    });
    return () => {
      first.stop();
      loop?.stop();
    };
  }, [duration, start, value]);
  return value;
}

function usePulse(duration: number) {
  const value = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [duration, value]);
  return value;
}

function sine(value: Animated.Value, amplitude: number, phase = 0, cycles = 1) {
  const steps = 16;
  const inputRange = Array.from({ length: steps + 1 }, (_, index) => index / steps);
  const outputRange = inputRange.map((point) => Math.sin((point * cycles + phase) * Math.PI * 2) * amplitude);
  return value.interpolate({ inputRange, outputRange });
}

function Sun({ size, color, glow, pulse }: { size: number; color: string; glow: string; pulse: Animated.Value }) {
  return <View style={{ position: 'absolute', top: 70, right: 28, width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Animated.View style={{
      position: 'absolute', width: size * 2.6, height: size * 2.6, borderRadius: size * 1.3, backgroundColor: glow,
      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.4] }),
      transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] }) }],
    }} />
    <Animated.View style={{
      position: 'absolute', width: size * 1.7, height: size * 1.7, borderRadius: size * 0.85, backgroundColor: glow,
      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.52] }),
    }} />
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
  </View>;
}

function Star({ index }: { index: number }) {
  const twinkle = useCycle(2600 + rand(index, 3) * 2400, rand(index, 4));
  return <Animated.View style={{
    position: 'absolute', left: `${rand(index, 1) * 96}%`, top: `${rand(index, 2) * 55}%`,
    width: 2 + Math.round(rand(index, 5) * 2), height: 2 + Math.round(rand(index, 5) * 2), borderRadius: 2, backgroundColor: '#FFF8D8',
    opacity: sine(twinkle, 0.35, 0).interpolate({ inputRange: [-0.35, 0.35], outputRange: [0.25, 1] }),
  }} />;
}

function Cloud({ index, total, color, wide, windSpeed, top }: { index: number; total: number; color: string; wide: number; windSpeed: number; top: number }) {
  const width = 150 + rand(index, 7) * 120;
  const duration = (110000 - windSpeed * 80000) * (0.8 + rand(index, 8) * 0.5);
  const drift = useCycle(duration, rand(index, 9));
  const height = width * 0.46;
  return <Animated.View style={{
    position: 'absolute', top: top + (index / Math.max(total, 1)) * 130 + rand(index, 10) * 30, left: 0, width, height, opacity: 0.88,
    transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-width, wide] }) }],
  }}>
    <View style={{ position: 'absolute', bottom: 0, width, height: height * 0.55, borderRadius: height, backgroundColor: color }} />
    <View style={{ position: 'absolute', bottom: height * 0.25, left: width * 0.14, width: width * 0.4, height: width * 0.4, borderRadius: width * 0.2, backgroundColor: color }} />
    <View style={{ position: 'absolute', bottom: height * 0.2, left: width * 0.38, width: width * 0.5, height: width * 0.5, borderRadius: width * 0.25, backgroundColor: color }} />
  </Animated.View>;
}

type ParticleKind = 'drop' | 'flake' | 'ball' | 'petal' | 'streak';

function Particle({ index, kind, color, width, height, duration, slant, size }: {
  index: number; kind: ParticleKind; color: string; width: number; height: number; duration: number; slant: number; size: number;
}) {
  const progress = useCycle(duration * (0.75 + rand(index, 11) * 0.6), rand(index, 12));
  const common = { position: 'absolute' as const, backgroundColor: color };
  if (kind === 'streak') {
    const length = size * (3 + rand(index, 13) * 5);
    return <Animated.View style={{
      ...common, top: rand(index, 14) * height, left: 0, width: length, height: Math.max(1, size / 3), borderRadius: 2,
      opacity: 0.3 + rand(index, 15) * 0.35,
      transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-length, width + length] }) }],
    }} />;
  }
  const fall = progress.interpolate({ inputRange: [0, 1], outputRange: [-40, height + 20] });
  const drift = progress.interpolate({ inputRange: [0, 1], outputRange: [0, slant * (height + 60)] });
  const swayAmplitude = kind === 'flake' || kind === 'petal' ? 14 + rand(index, 16) * 22 : 0;
  const sway = sine(progress, swayAmplitude, rand(index, 17), 2);
  const spin = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(rand(index, 18) > 0.5 ? 1 : -1) * 540}deg`] });
  const left = `${rand(index, 19) * 108 - 4}%` as const;
  if (kind === 'drop') {
    const length = size * (1.2 + rand(index, 20));
    return <Animated.View style={{
      ...common, left, top: 0, width: 1.6, height: length, borderRadius: 1, opacity: 0.35 + rand(index, 21) * 0.4,
      transform: [{ translateX: drift }, { translateY: fall }, { rotate: `${Math.atan(slant) * -1}rad` }],
    }} />;
  }
  if (kind === 'petal') {
    return <Animated.View style={{
      ...common, left, top: 0, width: size, height: size * 0.62, borderRadius: size, opacity: 0.85,
      transform: [{ translateX: sway }, { translateY: fall }, { rotate: spin }],
    }} />;
  }
  const diameter = size * (0.55 + rand(index, 22) * 0.9);
  return <Animated.View style={{
    ...common, left, top: 0, width: diameter, height: diameter, borderRadius: diameter / 2, opacity: kind === 'ball' ? 0.9 : 0.5 + rand(index, 23) * 0.45,
    transform: [{ translateX: drift }, { translateX: sway }, { translateY: fall }],
  }} />;
}

function ParticleField(props: { count: number; kind: ParticleKind; color: string; width: number; height: number; duration: number; slant?: number; size: number; offset?: number }) {
  const { count, offset = 0, slant = 0, ...rest } = props;
  return <>{Array.from({ length: count }, (_, index) => <Particle key={index + offset} index={index + offset} slant={slant} {...rest} />)}</>;
}

function Lightning({ width, height }: { width: number; height: number }) {
  const flash = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(2600),
      Animated.timing(flash, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0.15, duration: 90, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0.9, duration: 60, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 380, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(flash, { toValue: 0.6, duration: 50, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [flash]);
  return <>
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#DCE6FF', opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.38] }) }]} />
    <Animated.View style={{ position: 'absolute', top: 40, left: width * 0.32, opacity: flash }}>
      <Svg width={width * 0.3} height={height * 0.34} viewBox="0 0 60 120">
        <Polygon points="38,0 10,66 28,66 18,120 52,48 33,48 46,0" fill="#FFF8D8" />
      </Svg>
    </Animated.View>
  </>;
}

function FogBands({ amount, color, width, height }: { amount: number; color: string; width: number; height: number }) {
  const count = amount > 0.7 ? 5 : 3;
  return <>{Array.from({ length: count }, (_, index) => <FogBand key={index} index={index} count={count} amount={amount} color={color} width={width} height={height} />)}</>;
}

function FogBand({ index, count, amount, color, width, height }: { index: number; count: number; amount: number; color: string; width: number; height: number }) {
  const drift = useCycle(42000 + index * 9000, rand(index, 24));
  const bandHeight = 120 + rand(index, 25) * 80;
  return <Animated.View style={{
    position: 'absolute', top: height * 0.1 + (index / count) * height * 0.62, left: 0, width: width * 1.6, height: bandHeight, opacity: amount * 0.7,
    transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.6, 0] }) }],
  }}>
    <LinearGradient colors={['transparent', color, 'transparent']} style={StyleSheet.absoluteFill} />
  </Animated.View>;
}

function Funnel({ width, color }: { width: number; color: string }) {
  const cycle = useCycle(5200);
  const segments = 10;
  return <View style={{ position: 'absolute', right: width * 0.1, bottom: 150, width: 210, alignItems: 'center' }}>
    {Array.from({ length: segments }, (_, index) => <Animated.View key={index} style={{
      width: 210 - index * 17, height: 24, borderRadius: 12, marginTop: -4, backgroundColor: color, opacity: 0.38 + index * 0.03,
      transform: [{ translateX: sine(cycle, 6 + index * 3, index * 0.07) }],
    }} />)}
  </View>;
}

function Spiral({ color }: { color: string }) {
  const turn = useCycle(26000);
  return <Animated.View style={{
    position: 'absolute', top: -120, right: -190, width: 520, height: 520, alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
  }}>
    {[0, 1, 2, 3].map((arm) => <View key={arm} style={{
      position: 'absolute', width: 480, height: 88, borderRadius: 44, backgroundColor: color, opacity: 0.34,
      transform: [{ rotate: `${arm * 45}deg` }, { translateX: arm % 2 ? 36 : -36 }],
    }} />)}
    <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.12)' }} />
  </Animated.View>;
}

function HeatShimmer({ width, height, color }: { width: number; height: number; color: string }) {
  return <>{[0, 1, 2, 3, 4].map((index) => <ShimmerBand key={index} index={index} width={width} height={height} color={color} />)}</>;
}

function ShimmerBand({ index, width, height, color }: { index: number; width: number; height: number; color: string }) {
  const rise = useCycle(7000 + index * 1300, index / 5);
  const wobble = useCycle(2400 + index * 300);
  return <Animated.View style={{
    position: 'absolute', top: height * 0.55, left: -20, width: width + 40, height: 26, opacity: rise.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.4, 0.2, 0] }),
    transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.5] }) }, { translateX: sine(wobble, 10) }, { scaleY: sine(wobble, 0.35, 0.25).interpolate({ inputRange: [-0.35, 0.35], outputRange: [0.6, 1.4] }) }],
  }}>
    <LinearGradient colors={['transparent', color, 'transparent']} style={StyleSheet.absoluteFill} />
  </Animated.View>;
}

function precipitationLayer(scene: WeatherScene, width: number, height: number, isDay: boolean) {
  const slant = scene.wind * 0.35;
  const rain = isDay ? '#DCEBFF' : '#9DB8E8';
  switch (scene.precipitation) {
    case 'drizzle': return <ParticleField count={34} kind="drop" color={rain} width={width} height={height} duration={3600} slant={slant} size={9} />;
    case 'rain': return <ParticleField count={34} kind="drop" color={rain} width={width} height={height} duration={1300} slant={slant} size={20} />;
    case 'shower': return <ParticleField count={48} kind="drop" color={rain} width={width} height={height} duration={950} slant={slant} size={24} />;
    case 'heavy': return <ParticleField count={64} kind="drop" color={rain} width={width} height={height} duration={720} slant={slant} size={28} />;
    case 'snow': return <ParticleField count={30} kind="flake" color="#FFFFFF" width={width} height={height} duration={9000} slant={0.05} size={7} />;
    case 'blizzard': return <ParticleField count={60} kind="flake" color="#FFFFFF" width={width} height={height} duration={2600} slant={0.6} size={6} />;
    case 'sleet': return <>
      <ParticleField count={22} kind="drop" color={rain} width={width} height={height} duration={1500} slant={slant} size={18} />
      <ParticleField count={16} kind="flake" color="#FFFFFF" width={width} height={height} duration={5200} slant={0.1} size={6} offset={100} />
    </>;
    case 'freezing': return <ParticleField count={32} kind="drop" color="#BFE8FF" width={width} height={height} duration={1700} slant={0.03} size={18} />;
    case 'hail': return <>
      <ParticleField count={26} kind="ball" color="#F2F8FF" width={width} height={height} duration={1100} slant={slant} size={9} />
      <ParticleField count={20} kind="drop" color={rain} width={width} height={height} duration={800} slant={slant} size={22} offset={100} />
    </>;
    case 'graupel': return <ParticleField count={34} kind="ball" color="#F7FBFF" width={width} height={height} duration={3000} slant={0.15} size={7} />;
    default: return null;
  }
}

export function WeatherBackground({ kind, isDay, reveal, background, dark }: Props) {
  const scene = WEATHER_SCENES[kind];
  const { width, height } = useWindowDimensions();
  const sunPulse = usePulse(3600);
  const sky = SKY[scene.group][isDay ? 'day' : 'night'];
  const amount = dark ? (isDay ? 0.55 : 0.1) : (isDay ? 0.3 : 0.5);
  const top = mix(sky.top, background, amount);
  const bottom = mix(sky.bottom, background, amount);
  const cloudBase = mix(isDay ? '#FFFFFF' : '#C9D3E6', isDay ? '#4A5260' : '#161B26', scene.cloudDarkness);
  const cloudColor = mix(cloudBase, background, dark ? 0.3 : 0.12);
  const fogColor = isDay ? (scene.group === 'smog' ? '#B7A27A' : '#F2F5F7') : '#8C97A3';
  const dustColor = isDay ? '#E8C98E' : '#A8885A';
  const windColor = isDay ? '#FFFFFF' : '#C9D6EA';

  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: reveal.interpolate({ inputRange: [0, 0.38, 0.78, 1], outputRange: [0, 0.08, 0.72, 1] }) }]}>
    <LinearGradient colors={[top, bottom]} style={StyleSheet.absoluteFill} />
    {scene.sun && isDay ? <Sun size={scene.heat ? 92 : 64} color={scene.heat ? '#FFE9A8' : '#FFF3C4'} glow={scene.heat ? '#FF9A3C' : '#FFE08A'} pulse={sunPulse} /> : null}
    {scene.sun && !isDay ? <Sun size={46} color="#F3F1E6" glow="#C9D3F5" pulse={sunPulse} /> : null}
    {!isDay && (scene.group === 'sunny' || scene.group === 'mild' || scene.group === 'cold' || scene.group === 'cool' || scene.group === 'frost') && scene.clouds < 4 ? Array.from({ length: 24 }, (_, index) => <Star key={index} index={index} />) : null}
    {scene.heat ? <View style={[StyleSheet.absoluteFill, { backgroundColor: scene.group === 'dry' ? '#FF7A1A' : '#FFB347', opacity: 0.1 }]} /> : null}
    {Array.from({ length: scene.clouds }, (_, index) => <Cloud key={index} index={index} total={scene.clouds} color={cloudColor} wide={width} windSpeed={scene.wind} top={scene.group === 'cloudy' || scene.cloudDarkness > 0.5 ? 40 : 90} />)}
    {scene.fog > 0 ? <FogBands amount={scene.fog} color={fogColor} width={width} height={height} /> : null}
    {scene.spiral ? <Spiral color={isDay ? '#E8EEF7' : '#7B8CA6'} /> : null}
    {scene.funnel ? <Funnel width={width} color={isDay ? '#3B4047' : '#1B1E22'} /> : null}
    {precipitationLayer(scene, width, height, isDay)}
    {scene.petals ? <ParticleField count={10} kind="petal" color="#FFD3E0" width={width} height={height} duration={11000} size={9} offset={200} /> : null}
    {scene.dust ? <ParticleField count={30} kind="streak" color={dustColor} width={width} height={height} duration={1600} size={5} offset={300} /> : null}
    {scene.wind >= 0.5 && !scene.dust ? <ParticleField count={Math.round(scene.wind * 9)} kind="streak" color={windColor} width={width} height={height} duration={2600} size={4} offset={400} /> : null}
    {scene.heat ? <HeatShimmer width={width} height={height} color={scene.group === 'dry' ? '#FFD9A6' : '#FFE8C2'} /> : null}
    {scene.frost ? <>
      {Array.from({ length: 18 }, (_, index) => <Star key={index} index={index + 40} />)}
      <LinearGradient colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 0.35, y: 0.5 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']} start={{ x: 1, y: 0.5 }} end={{ x: 0.65, y: 0.5 }} style={StyleSheet.absoluteFill} />
    </> : null}
    {scene.lightning ? <Lightning width={width} height={height} /> : null}
    <LinearGradient
      colors={dark ? [`${background}00`, `${background}66`, background] : [`${background}00`, `${background}B3`, background]}
      locations={[0, 0.45, 0.85]}
      style={StyleSheet.absoluteFill}
    />
  </Animated.View>;
}
