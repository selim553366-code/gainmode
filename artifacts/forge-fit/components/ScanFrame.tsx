import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type ScanMode = 'meal' | 'barcode';

const TICK = 26;
const STROKE = 2;

/** Where the viewfinder sits for a given screen size: square-ish for plates, wide for barcodes. */
export function scanWindow(mode: ScanMode, width: number, height: number) {
  const w = mode === 'meal' ? Math.min(width - 48, 340) : Math.min(width - 48, 352);
  const h = mode === 'meal' ? w * 1.1 : w * 0.5;
  const radius = mode === 'meal' ? 22 : 16;
  return { x: (width - w) / 2, y: height * 0.46 - h / 2, w, h, radius };
}

function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  return `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

/** The four corners of the window as thin open ticks that follow its rounded corners. */
function cornerTicks(x: number, y: number, w: number, h: number, r: number) {
  const t = TICK;
  return [
    `M ${x} ${y + t} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} H ${x + t}`,
    `M ${x + w - t} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + t}`,
    `M ${x + w} ${y + h - t} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + w - t}`,
    `M ${x + t} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + h - t}`,
  ].join(' ');
}

/**
 * A quiet, still viewfinder over the camera, like a camera app's: the surroundings dim a little,
 * four thin white corners mark the window, and one line of help sits under it. Barcode mode adds
 * a faint centre line to line the code up with. Nothing moves.
 */
export function ScanFrame({ mode, width, height, hint }: { mode: ScanMode; width: number; height: number; hint: string }) {
  if (!width || !height) return null;
  const win = scanWindow(mode, width, height);
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Path d={`M 0 0 H ${width} V ${height} H 0 Z ${roundedRect(win.x, win.y, win.w, win.h, win.radius)}`} fill="rgba(0,0,0,0.38)" fillRule="evenodd" />
      <Path d={cornerTicks(win.x, win.y, win.w, win.h, win.radius)} stroke="#FFFFFF" strokeWidth={STROKE} strokeLinecap="round" fill="none" />
      {mode === 'barcode' ? <Path d={`M ${win.x + 20} ${win.y + win.h / 2} H ${win.x + win.w - 20}`} stroke="rgba(255,255,255,0.45)" strokeWidth={1} /> : null}
    </Svg>
    <Text style={[styles.hint, { top: win.y + win.h + 20 }]}>{hint}</Text>
  </View>;
}

const styles = StyleSheet.create({
  hint: { position: 'absolute', left: 40, right: 40, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.72)', textAlign: 'center' },
});
