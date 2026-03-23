import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import './battlePresentation.css';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  tone: 'damage' | 'dodge' | 'speed' | 'red' | 'blue' | 'black';
  animated?: boolean;
}

export function StatBar({
  label,
  value,
  max = 100,
  tone,
  animated = false,
}: StatBarProps): React.ReactNode {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const normalizedTone =
    tone === 'red'
      ? 'damage'
      : tone === 'blue'
        ? 'dodge'
        : tone === 'black'
          ? 'speed'
          : tone;
  const toneClass = `warpath-meter__fill--${normalizedTone}`;

  return (
    <div className="warpath-meter">
      <span className="warpath-meter__label">{label}</span>
      <div className="warpath-meter__track">
        <motion.div
          className={`warpath-meter__fill ${toneClass} ${animated ? 'warpath-meter__fill--animated' : ''}`}
          style={
            {
              '--fill': `${pct}%`,
              '--fill-scale': pct / 100,
              transformOrigin: 'left center',
            } as CSSProperties
          }
          initial={{ scaleX: pct / 100 }}
          animate={
            animated
              ? {
                  scaleX: [
                    pct / 100,
                    Math.min(1, pct / 100 + 0.03),
                    Math.max(0, pct / 100 - 0.02),
                    Math.min(1, pct / 100 + 0.01),
                    pct / 100,
                  ],
                }
              : {
                  scaleX: pct / 100,
                }
          }
          transition={
            animated
              ? {
                  duration: 1.2,
                  repeat: Infinity,
                  ease: [0.76, 0, 0.24, 1],
                }
              : {
                  duration: 0.34,
                  ease: [0.16, 1, 0.3, 1],
                }
          }
        />
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="warpath-meter__tick"
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>
      <span className="warpath-meter__value">{value}</span>
    </div>
  );
}
