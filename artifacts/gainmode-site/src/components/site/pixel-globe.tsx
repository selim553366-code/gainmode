import { useEffect, useRef } from 'react';

/**
 * The hero mark drawn as a living globe of small tiles. The tiles start as
 * a flat design grid, fold into a sphere, and the S-shaped meridian of the
 * logo is then cut through it from top to bottom. The sphere keeps turning
 * behind the cut, so the mark stays readable while the globe moves. Tiles
 * near the pointer lift and brighten, and the globe leans toward it.
 */

const COUNT = 1100;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

// The logo's S: M100 14 C 64 60, 136 140, 100 186 on a 200 box with an r=80 globe.
function sCurveLookup(samples = 256) {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= 400; i++) {
    const t = i / 400;
    const u = 1 - t;
    const x = u * u * u * 100 + 3 * u * u * t * 64 + 3 * u * t * t * 136 + t * t * t * 100;
    const y = u * u * u * 14 + 3 * u * u * t * 60 + 3 * u * t * t * 140 + t * t * t * 186;
    pts.push([(x - 100) / 80, (y - 100) / 80]);
  }
  const table = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const y = -1.1 + (2.2 * i) / (samples - 1);
    let best = pts[0];
    for (const p of pts) if (Math.abs(p[1] - y) < Math.abs(best[1] - y)) best = p;
    table[i] = best[0];
  }
  return (y: number) => table[Math.max(0, Math.min(samples - 1, Math.round(((y + 1.1) / 2.2) * (samples - 1))))];
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

export function PixelGlobe({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sAt = sCurveLookup();

    // Points on the sphere, plus a flat grid slot each one starts from.
    const side = Math.ceil(Math.sqrt(COUNT));
    const pts = Array.from({ length: COUNT }, (_, i) => {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const rr = Math.sqrt(1 - y * y);
      const th = GOLDEN * i;
      const slot = (i * 7919) % (side * side);
      return {
        x: Math.cos(th) * rr, y, z: Math.sin(th) * rr,
        gx: ((slot % side) / (side - 1)) * 2.3 - 1.15,
        gy: (Math.floor(slot / side) / (side - 1)) * 2.3 - 1.15,
        delay: ((slot % side) + Math.floor(slot / side)) / (side * 2),
        lift: 0,
      };
    });

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const pointer = { x: 0, y: 0, active: false, sx: 0, sy: 0 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      pointer.active = Math.abs(pointer.x) < 1.4 && Math.abs(pointer.y) < 1.4;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(canvas);

    const start = performance.now();
    let spin = 0, last = start, raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = reduced ? 10 : (now - start) / 1000;
      if (!reduced) spin += dt * 0.22;

      // Lean toward the pointer, softly.
      pointer.sx += ((pointer.active ? pointer.x : 0) - pointer.sx) * 0.05;
      pointer.sy += ((pointer.active ? pointer.y : 0) - pointer.sy) * 0.05;
      const ry = spin + pointer.sx * 0.5;
      const rx = -0.32 + pointer.sy * 0.35;
      const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);

      const R = Math.min(w, h) * 0.4;
      const ox = w / 2, oy = h / 2 + (reduced ? 0 : Math.sin(t * 1.05) * R * 0.03);
      const cut = clamp01((t - 2.1) / 1.1); // the S travels top to bottom after assembly
      const gap = 0.075;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      for (const p of pts) {
        // Rotate the sphere point.
        const x1 = p.x * cy + p.z * sy;
        const z1 = -p.x * sy + p.z * cy;
        const y2 = p.y * cx - z1 * sx;
        const z2 = p.y * sx + z1 * cx;

        const k = easeInOut(clamp01((t - 0.15 - p.delay * 1.1) / 1.0));
        // Morph from the flat grid to the sphere; back tiles fade as they fold away.
        const px = p.gx + (x1 - p.gx) * k;
        const py = p.gy + (y2 - p.gy) * k;
        const depth = 1 - k + k * z2;
        if (k > 0.98 && z2 < -0.05) continue;

        // The S cut, fixed to the viewer, revealed from the top down.
        if (cut > 0 && k > 0.98 && (py + 1) / 2 < cut * 1.1 && Math.abs(px - sAt(py)) < gap) continue;

        const dxp = px - pointer.sx * 1.05, dyp = py - pointer.sy * 1.05;
        const near = pointer.active ? Math.max(0, 1 - Math.hypot(dxp, dyp) / 0.45) : 0;
        p.lift += (near - p.lift) * 0.12;

        const light = clamp01(0.35 + 0.65 * (0.55 * depth + 0.45 * (-py * 0.6 - px * 0.3 + 0.5)));
        const size = R * (0.028 + 0.03 * Math.max(0, depth)) * (1 + p.lift * 0.9) * (0.55 + 0.45 * k);
        const alpha = (0.25 + 0.75 * Math.max(0, depth)) * clamp01(0.3 + k);

        // Light #9DB8FF at the top-left, deep #1733B8 at the bottom-right; lifted tiles go white.
        const r = Math.round(23 + (157 - 23) * light + (255 - 157) * p.lift * 0.8);
        const g = Math.round(51 + (184 - 51) * light + (255 - 184) * p.lift * 0.8);
        const b = Math.round(184 + (255 - 184) * light);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        const X = ox + px * R - size / 2;
        const Y = oy + py * R - size / 2 - p.lift * R * 0.04;
        ctx.beginPath();
        ctx.roundRect(X, Y, size, size, size * 0.28);
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
