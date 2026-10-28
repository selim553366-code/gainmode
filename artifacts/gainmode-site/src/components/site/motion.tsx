import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Fades and lifts its content in once it scrolls into view. */
export function Reveal({ children, delay = 0, y = 28, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Small uppercase label above a section title. */
export function Kicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-royal-200 ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-royal-400 shadow-[0_0_12px_#5B83FF]" />
      {children}
    </span>
  );
}

/** A section title whose lines slide up from behind a mask one after another. */
export function SplitTitle({ lines, className = '', delay = 0 }: { lines: string[]; className?: string; delay?: number }) {
  return (
    <h1 className={className}>
      {lines.map((line, index) => (
        <span key={line} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className="block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: delay + index * 0.1, ease: EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

export { EASE };
