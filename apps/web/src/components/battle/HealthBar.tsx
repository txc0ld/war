import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
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
  const previousPctRef = useRef(pct);
  const [isFlashing, setIsFlashing] = useState(false);
  const fillClass =
    pct <= 25
      ? 'warpath-meter__fill--health-low'
      : side === 'left'
        ? 'warpath-meter__fill--health-left'
        : 'warpath-meter__fill--health-right';

  useEffect(() => {
    if (pct < previousPctRef.current) {
      setIsFlashing(true);
      const timer = window.setTimeout(() => setIsFlashing(false), 260);
      previousPctRef.current = pct;
      return () => window.clearTimeout(timer);
    }
    previousPctRef.current = pct;
  }, [pct]);

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
            animate={{
              width: `${pct}%`,
              boxShadow: isFlashing
                ? '0 0 18px rgba(245, 247, 239, 0.3)'
                : '0 0 0 rgba(0, 0, 0, 0)',
              opacity: isFlashing ? 0.72 : 1,
            }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
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
