import type { ActiveSeason } from '@warpath/shared';

interface SeasonTabsProps {
  activeSeason: ActiveSeason;
  onSelect: (season: ActiveSeason) => void;
}

export function SeasonTabs({ activeSeason, onSelect }: SeasonTabsProps): React.ReactNode {
  return (
    <div className="season-tabs">
      <button
        type="button"
        className={`season-tabs__tab ${activeSeason === 2 ? 'season-tabs__tab--active' : ''}`}
        onClick={() => onSelect(2)}
      >
        Season 2
      </button>
      <button
        type="button"
        className={`season-tabs__tab ${activeSeason === 1 ? 'season-tabs__tab--active' : ''}`}
        onClick={() => onSelect(1)}
      >
        S1 Archive
      </button>
    </div>
  );
}
