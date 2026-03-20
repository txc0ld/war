import { useEffect, useState } from 'react';
import type { GunStats } from '@warpath/shared';
import { GunCard } from './GunCard';

interface FighterCard {
  imageUrl: string;
  name: string;
  tokenId: number;
  stats: GunStats;
  side: 'left' | 'right';
  label: string;
}

interface VSRevealProps {
  left: FighterCard;
  right: FighterCard;
  onComplete: () => void;
}

export function VSReveal({
  left,
  right,
  onComplete,
}: VSRevealProps): React.ReactNode {
  const [showFight, setShowFight] = useState(false);

  useEffect(() => {
    const vsTimer = window.setTimeout(() => setShowFight(true), 1500);
    const completeTimer = window.setTimeout(onComplete, 2300);

    return () => {
      window.clearTimeout(vsTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="vs-screen">
      <div className="vs-screen__inner">
        <div className="vs-screen__fighters">
          <GunCard
            label={left.label}
            name={left.name}
            tokenId={left.tokenId}
            imageUrl={left.imageUrl}
            stats={left.stats}
            side={left.side}
          />
          <GunCard
            label={right.label}
            name={right.name}
            tokenId={right.tokenId}
            imageUrl={right.imageUrl}
            stats={right.stats}
            side={right.side}
          />
        </div>
      </div>

      <div className="vs-screen__center">
        <h2
          className={`vs-screen__headline ${showFight ? 'vs-screen__headline--fight' : 'vs-screen__headline--slam'}`}
        >
          {showFight ? 'FIGHT' : 'VS'}
        </h2>
      </div>
    </div>
  );
}
