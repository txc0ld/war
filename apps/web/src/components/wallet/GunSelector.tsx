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
    walletCooldownExpiresAt,
  } = useStore();
  const { guns, isLoading, error } = useGuns();

  const countryName = useMemo(
    () => COUNTRIES.find((country) => country.code === selectedCountry)?.name ?? selectedCountry,
    [selectedCountry]
  );
  const arsenalBonus = guns.length >= 3;
  const walletCooldownRemaining = getCooldownRemainingMs(walletCooldownExpiresAt);
  const isWalletCoolingDown = walletCooldownRemaining > 0;

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
          </div>
          <div className="gun-selector__header-actions">
            <button
              type="button"
              className="gun-selector__close"
              onClick={closeGunSelector}
            >
              Close
            </button>
          </div>
        </header>

        {arsenalBonus || isWalletCoolingDown ? (
          <div className="gun-selector__status-strip">
            {arsenalBonus ? <p className="arsenal-bonus">ARSENAL BONUS +10%</p> : null}
            {isWalletCoolingDown ? (
              <p className="arsenal-bonus">
                WALLET COOLDOWN {formatCooldownLabel(walletCooldownRemaining)}
              </p>
            ) : null}
          </div>
        ) : null}

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
              const isUnavailable = !gun.canBattle && !isWalletCoolingDown;
              const isCoolingDown = isWalletCoolingDown;
              const isLocked = isCoolingDown || isUnavailable;

              return (
                <button
                  key={gun.tokenId}
                  type="button"
                  className={`gun-card ${arsenalBonus && isSelected ? 'gun-card--selected' : ''} ${
                    isLocked ? 'gun-card--locked' : ''
                  }`}
                  onClick={() => {
                    if (!isLocked) {
                      selectGun(gun);
                    }
                  }}
                  disabled={isLocked}
                >
                  <div className="gun-card__media">
                    <div className="gun-frame">
                      <img src={gun.image} alt={gun.name} />
                    </div>
                  </div>
                  <div className="gun-card__identity">
                    <p className="gun-card__name">{gun.name}</p>
                    <div className="gun-card__meta">
                      <span>{tierLabel}</span>
                      <span className="gun-card__type">{typeLabel}</span>
                    </div>
                  </div>
                  {isCoolingDown ? (
                    <p className="gun-card__cooldown gun-card__cooldown--warning">
                      WALLET COOLDOWN {formatCooldownLabel(walletCooldownRemaining)}
                    </p>
                  ) : isUnavailable ? (
                    <p className="gun-card__cooldown">BATTLE LOCKED</p>
                  ) : null}
                  <div className="gun-card__stats gun-card__stats--selector">
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
