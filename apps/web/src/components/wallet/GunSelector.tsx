import { useMemo } from 'react';
import { COUNTRIES } from '@/data/countries';
import { GUNS_BY_ID, getTierLabel } from '@/data/guns';
import { useGuns } from '@/hooks/useGuns';
import { useStore } from '@/store';
import { StatBar } from '@/components/battle/StatBar';
import { formatCooldownLabel, getCooldownRemainingMs } from '@/lib/cooldowns';

export function GunSelector(): React.ReactNode {
  const {
    selectedCountry,
    selectedGun,
    showGunSelector,
    selectGun,
    closeGunSelector,
    weaponCooldowns,
  } = useStore();
  const { guns, isLoading, error } = useGuns();

  const countryName = useMemo(
    () => COUNTRIES.find((country) => country.code === selectedCountry)?.name ?? selectedCountry,
    [selectedCountry]
  );
  const arsenalBonus = guns.length >= 3;

  if (!showGunSelector || !selectedCountry) {
    return null;
  }

  return (
    <div className="gun-selector-backdrop" role="dialog" aria-modal="true" aria-labelledby="gun-selector-title">
      <section className="gun-selector">
        <header className="gun-selector__header">
          <div className="gun-selector__header-copy">
            <p className="panel-label">Deployment Zone</p>
            <h2 className="gun-selector__title" id="gun-selector-title">
              {countryName}
            </h2>
            {arsenalBonus && <p className="arsenal-bonus">ARSENAL BONUS +10%</p>}
          </div>
          <button
            type="button"
            className="warpath-button warpath-button--outline"
            onClick={closeGunSelector}
          >
            Close
          </button>
        </header>

        {isLoading && (
          <div className="warpath-panel">
            <p className="panel-title">SCANNING ARSENAL</p>
          </div>
        )}

        {error && (
          <div className="warpath-panel">
            <p className="panel-title">WEAPON SYNC FAILED</p>
            <p className="panel-copy">{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="gun-selector__grid">
            {guns.map((gun) => {
              const registryGun = GUNS_BY_ID.get(gun.tokenId);
              const tierLabel = registryGun ? getTierLabel(registryGun.tier) : 'UNSORTED';
              const typeLabel = registryGun?.type ?? gun.traits[0] ?? 'NODE';
              const isSelected = selectedGun?.tokenId === gun.tokenId;
              const cooldownRemaining = getCooldownRemainingMs(
                weaponCooldowns,
                gun.tokenId
              );
              const isCoolingDown = cooldownRemaining > 0 || !gun.canBattle;

              return (
                <button
                  key={gun.tokenId}
                  type="button"
                  className={`gun-card ${arsenalBonus && isSelected ? 'gun-card--selected' : ''} ${
                    isCoolingDown ? 'gun-card--locked' : ''
                  }`}
                  onClick={() => {
                    if (!isCoolingDown) {
                      selectGun(gun);
                    }
                  }}
                  disabled={isCoolingDown}
                >
                  <div className="gun-frame">
                    <img src={gun.image} alt={gun.name} />
                  </div>
                  <div>
                    <p className="gun-card__name">{gun.name}</p>
                    <div className="gun-card__meta">
                      <span>{tierLabel}</span>
                      <span className="gun-card__type">{typeLabel}</span>
                    </div>
                  </div>
                  {isCoolingDown ? (
                    <p className="gun-card__cooldown">
                      COOLING DOWN {formatCooldownLabel(cooldownRemaining)}
                    </p>
                  ) : null}
                  <div className="gun-card__stats">
                    <StatBar label="Damage" value={gun.stats.damage} tone="red" />
                    <StatBar label="Dodge" value={gun.stats.dodge} tone="blue" />
                    <StatBar label="Speed" value={gun.stats.speed} tone="black" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
