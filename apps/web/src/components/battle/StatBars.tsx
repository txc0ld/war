import type { GunStats } from '@warpath/shared';
import { StatBar } from './StatBar';

interface StatBarsProps {
  stats: GunStats;
}

export function StatBars({ stats }: StatBarsProps): React.ReactNode {
  return (
    <div className="flex flex-col gap-1.5">
      <StatBar label="DMG" value={stats.damage} color="#FF3333" />
      <StatBar label="DDG" value={stats.dodge} color="#FFD700" />
      <StatBar label="SPD" value={stats.speed} color="#FF00FF" />
    </div>
  );
}
