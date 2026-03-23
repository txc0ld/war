import { motion } from 'framer-motion';
import type { GunStats } from '@warpath/shared';
import { HealthBar } from './HealthBar';
import { StatBars } from './StatBars';
import './battlePresentation.css';

interface GunCardProps {
  imageUrl: string;
  name: string;
  tokenId: number;
  stats: GunStats;
  hp?: number;
  maxHp?: number;
  side?: 'left' | 'right';
  showStats?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

export function GunCard({
  imageUrl,
  name,
  tokenId,
  stats,
  hp,
  maxHp = 100,
  side = 'left',
  showStats = true,
  label,
  animated = false,
  className,
}: GunCardProps): React.ReactNode {
  const classes = ['warpath-gun-card', `warpath-gun-card--${side}`, className]
    .filter(Boolean)
    .join(' ');
  const idleRotation =
    animated
      ? side === 'left'
        ? [0, -0.45, 0.15, -0.2, 0]
        : [0, 0.45, -0.15, 0.2, 0]
      : 0;

  return (
    <motion.article
      className={classes}
      layout
      animate={{
        rotate: idleRotation,
        y: animated ? [0, -1.2, 0, 0.9, 0] : 0,
      }}
      transition={
        animated
          ? {
              duration: 5.4,
              repeat: Infinity,
              ease: [0.76, 0, 0.24, 1],
            }
          : { duration: 0.18, ease: [0.25, 1, 0.5, 1] }
      }
    >
      {typeof hp === 'number' ? (
        <HealthBar
          current={hp}
          hp={hp}
          max={maxHp}
          side={side}
          label={label}
        />
      ) : null}
      <div className="warpath-gun-card__plate">
        <div className="warpath-gun-frame">
          <div className="warpath-gun-frame__image">
            {imageUrl ? (
              <img src={imageUrl} alt={name} />
            ) : (
              <div className="warpath-gun-frame__placeholder">#{tokenId}</div>
            )}
          </div>
        </div>
        <div className="warpath-gun-card__meta">
          <p className="warpath-gun-card__name">{name}</p>
          <p className="warpath-gun-card__token">
            {label ? `${label} ` : ''}ID {tokenId}
          </p>
        </div>
        {showStats ? <StatBars stats={stats} animated={animated} /> : null}
      </div>
    </motion.article>
  );
}
