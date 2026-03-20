import type { GunStats } from '@warpath/shared';
import { StatBar } from './StatBar';

interface StatBarsProps {
  stats: GunStats;
  animated?: boolean;
}

export function StatBars({ stats, animated = false }: StatBarsProps): React.ReactNode {
  return (
    <div className="gun-card__stats">
      <StatBar label="Damage" value={stats.damage} tone="red" animated={animated} />
      <StatBar label="Dodge" value={stats.dodge} tone="blue" animated={animated} />
      <StatBar label="Speed" value={stats.speed} tone="black" animated={animated} />
    </div>
  );
}
