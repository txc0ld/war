import { motion } from 'framer-motion';
import type { GunStats } from '@warpath/shared';
import { HealthBar } from './HealthBar';
import { StatBars } from './StatBars';
import { cn } from '@/lib/cn';

interface GunCardProps {
  imageUrl: string;
  name: string;
  tokenId: number;
  hp: number;
  maxHp?: number;
  stats: GunStats;
  side: 'left' | 'right';
  showStats?: boolean;
  className?: string;
}

export function GunCard({
  imageUrl,
  name,
  tokenId,
  hp,
  maxHp = 100,
  stats,
  side,
  showStats = true,
  className,
}: GunCardProps): React.ReactNode {
  return (
    <motion.div
      className={cn(
        'flex flex-col items-center gap-3 w-48 md:w-56',
        className
      )}
      layout
    >
      {/* Health bar above gun */}
      <HealthBar current={hp} max={maxHp} side={side} />

      {/* Gun image */}
      <div className="relative">
        <div
          className={cn(
            'h-32 w-32 md:h-40 md:w-40 overflow-hidden border',
            'bg-bg-card',
            side === 'left'
              ? 'border-accent-cyan/30'
              : 'border-accent-magenta/30'
          )}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-contain"
              loading="eager"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-2xl text-text-dim">
              #{tokenId}
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <p className="font-mono text-xs uppercase tracking-wider text-text-secondary">
        {name}
      </p>

      {/* Stats */}
      {showStats && (
        <div className="w-full">
          <StatBars stats={stats} />
        </div>
      )}
    </motion.div>
  );
}
