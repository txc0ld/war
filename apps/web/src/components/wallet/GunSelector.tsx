import { useCallback } from 'react';
import { motion } from 'framer-motion';
import type { GunMetadata } from '@warpath/shared';
import { Modal } from '@/components/ui/Modal';
import { StatBars } from '@/components/battle/StatBars';
import { useStore } from '@/store';
import { useGuns } from '@/hooks/useGuns';
import { cn } from '@/lib/cn';

export function GunSelector(): React.ReactNode {
  const { showGunSelector, closeGunSelector, selectGun, selectedCountry } =
    useStore();
  const { guns, isLoading } = useGuns();

  const handleSelect = useCallback(
    (gun: GunMetadata) => {
      if (!gun.canBattle) return;
      selectGun(gun);
    },
    [selectGun]
  );

  return (
    <Modal
      open={showGunSelector}
      onClose={closeGunSelector}
      title={selectedCountry ? `Deploy to ${selectedCountry}` : 'Select Weapon'}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin border-2 border-accent-cyan border-t-transparent" />
        </div>
      ) : guns.length === 0 ? (
        <p className="py-8 text-center font-mono text-sm text-text-muted">
          No weapons in arsenal
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {guns.map((gun, i) => (
            <motion.button
              key={gun.tokenId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleSelect(gun)}
              disabled={!gun.canBattle}
              className={cn(
                'group relative flex flex-col border p-4 text-left transition-all',
                gun.canBattle
                  ? 'border-bg-border bg-bg-elevated hover:border-accent-cyan hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                  : 'cursor-not-allowed border-bg-border/50 bg-bg-primary opacity-50'
              )}
            >
              {!gun.canBattle && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                  <span className="font-mono text-xs uppercase tracking-wider text-accent-red">
                    Cannot be used in battle
                  </span>
                </div>
              )}
              <div className="mb-3 flex items-start gap-3">
                {gun.image ? (
                  <img
                    src={gun.image}
                    alt={gun.name}
                    className="h-16 w-16 object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center bg-bg-primary font-mono text-xs text-text-dim">
                    ?
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-text-primary">
                    {gun.name}
                  </h3>
                  <p className="font-mono text-[10px] text-text-dim">
                    #{gun.tokenId}
                  </p>
                  {gun.traits.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {gun.traits.map((trait) => (
                        <span
                          key={trait}
                          className={cn(
                            'font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border',
                            trait === 'Jammy Pasty'
                              ? 'border-accent-red/30 text-accent-red'
                              : trait === 'Unkillable'
                                ? 'border-accent-gold/30 text-accent-gold'
                                : 'border-bg-border text-text-dim'
                          )}
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <StatBars stats={gun.stats} />
            </motion.button>
          ))}
        </div>
      )}
    </Modal>
  );
}
