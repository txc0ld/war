import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface HealthBarProps {
  current: number;
  max?: number;
  side: 'left' | 'right';
}

export function HealthBar({
  current,
  max = 100,
  side,
}: HealthBarProps): React.ReactNode {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));

  const barColor =
    pct > 60
      ? 'bg-accent-neon'
      : pct > 30
        ? 'bg-accent-gold'
        : 'bg-accent-red';

  const glowColor =
    pct > 60
      ? 'shadow-[0_0_8px_rgba(204,255,0,0.4)]'
      : pct > 30
        ? 'shadow-[0_0_8px_rgba(255,215,0,0.4)]'
        : 'shadow-[0_0_8px_rgba(255,51,51,0.4)]';

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between">
        <span
          className={cn(
            'font-mono text-[10px] uppercase tracking-wider',
            side === 'left' ? 'text-accent-cyan' : 'text-accent-magenta'
          )}
        >
          HP
        </span>
        <span className="font-mono text-[10px] tabular-nums text-text-muted">
          {current}/{max}
        </span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden bg-bg-elevated">
        <motion.div
          className={cn('absolute inset-y-0 left-0', barColor, glowColor)}
          initial={{ width: '100%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        {/* Notch marks every 25% */}
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="absolute inset-y-0 w-px bg-bg-primary/40"
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>
    </div>
  );
}
