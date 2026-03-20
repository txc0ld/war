import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import './battlePresentation.css';

interface HealthBarProps {
  current?: number;
  hp?: number;
  max?: number;
  side?: 'left' | 'right';
  label?: string;
}

export function HealthBar({
  current,
  hp,
  max = 100,
  side = 'left',
  label,
}: HealthBarProps): React.ReactNode {
  const value = typeof current === 'number' ? current : hp ?? max;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fillClass =
    pct > 50
      ? 'warpath-meter__fill--health-high'
      : pct > 25
        ? 'warpath-meter__fill--health-mid'
        : 'warpath-meter__fill--health-low';

  return (
    <div className="warpath-health">
      <div className="warpath-health__header">
        <span className={`warpath-health__side warpath-health__side--${side}`}>
          {label ?? (side === 'left' ? 'Alpha' : 'Enemy')}
        </span>
        <span className="warpath-meter__value">
          {value}/{max}
        </span>
      </div>
      <div className="warpath-meter">
        <span className="warpath-meter__label">HP</span>
        <div className="warpath-meter__track">
          <motion.div
            className={`warpath-meter__fill ${fillClass}`}
            initial={{ width: '100%' }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ '--fill': `${pct}%` } as CSSProperties}
          />
          {[25, 50, 75].map((mark) => (
            <div
              key={mark}
              className="warpath-meter__tick"
              style={{ left: `${mark}%` }}
            />
          ))}
        </div>
        <span className="warpath-meter__value">{pct.toFixed(0)}</span>
      </div>
    </div>
  );
}
