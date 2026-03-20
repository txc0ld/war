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
        <div
          className={`warpath-meter__fill ${toneClass} ${animated ? 'warpath-meter__fill--animated' : ''}`}
          style={
            {
              '--fill': `${pct}%`,
              '--base-width': `${pct}%`,
              width: `${pct}%`,
            } as CSSProperties
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
