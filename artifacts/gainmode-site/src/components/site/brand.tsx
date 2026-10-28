import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const S_PATH = 'M100 14 C 64 60, 136 140, 100 186';

/**
 * The Globe Studios mark: a royal-blue globe parted by an S-shaped meridian.
 * With `animate`, the globe grows in and the S cuts through it once on load.
 */
export function LogoMark({ size = 40, animate = false, light = false, className }: { size?: number; animate?: boolean; light?: boolean; className?: string }) {
  const id = useId().replace(/:/g, '');
  const reduced = useReducedMotion();
  const play = animate && !reduced;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0.35" y2="1">
          {light
            ? <><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#C9D6FF" /></>
            : <><stop offset="0" stopColor="#7FA2FF" /><stop offset=".45" stopColor="#2F5BFF" /><stop offset="1" stopColor="#1733B8" /></>}
        </linearGradient>
        <mask id={`${id}m`}>
          <rect width="200" height="200" fill="#fff" />
          <motion.path
            d={S_PATH}
            fill="none"
            stroke="#000"
            strokeWidth={12}
            strokeLinecap="round"
            initial={play ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, delay: 0.45, ease: [0.65, 0, 0.35, 1] }}
          />
        </mask>
      </defs>
      <motion.circle
        cx="100"
        cy="100"
        r="80"
        fill={`url(#${id}g)`}
        mask={`url(#${id}m)`}
        initial={play ? { scale: 0.4, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: '100px 100px' }}
      />
    </svg>
  );
}

/** The mark next to the wordmark, as used in the header and footer. */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="font-display text-[16px] font-extrabold uppercase leading-[0.95] tracking-[-0.01em] text-white">
        Globe<br />Studios
      </span>
    </span>
  );
}
