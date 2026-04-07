import { useCallback, useEffect } from 'react';
import type { SniperMetadata } from '@warpath/shared';
import { useAccount } from 'wagmi';
import { s2GetSnipers } from '@/lib/s2Api';
import { useStore } from '@/store';

// ── Sniper Card ───────────────────────────────────────────────────────────────

interface SniperCardProps {
  sniper: SniperMetadata;
  isSelected: boolean;
  onSelect: (sniper: SniperMetadata) => void;
}

function SniperCard({ sniper, isSelected, onSelect }: SniperCardProps): React.ReactNode {
  return (
    <button
      type="button"
      onClick={() => onSelect(sniper)}
      style={{
        background: isSelected ? 'var(--accent-soft)' : 'var(--bg-elevated)',
        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: isSelected ? '0 0 0 1px var(--accent), 0 0 18px var(--accent-glow)' : 'none',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        cursor: 'pointer',
        transition: 'border-color 160ms, box-shadow 160ms, background 160ms',
        textAlign: 'left',
        width: '100%',
      }}
    >
      {/* NFT image */}
      <div
        style={{
          aspectRatio: '1 / 1',
          background: 'var(--bg-panel-strong)',
          borderRadius: '0.375rem',
          overflow: 'hidden',
          marginBottom: '0.625rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {sniper.image ? (
          <img
            src={sniper.image}
            alt={sniper.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <span style={{ color: 'var(--text-ghost)', fontSize: '0.75rem' }}>No image</span>
        )}
      </div>

      {/* Name + token ID */}
      <p
        style={{
          color: 'var(--text)',
          fontWeight: 700,
          fontSize: '0.8125rem',
          lineHeight: 1.3,
          marginBottom: '0.25rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {sniper.name}
      </p>
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.6875rem',
          marginBottom: '0.5rem',
          letterSpacing: '0.04em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        #{sniper.tokenId}
      </p>

      {/* Tracer color swatch + skin label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <span
          style={{
            display: 'inline-block',
            width: '0.625rem',
            height: '0.625rem',
            borderRadius: '50%',
            background: sniper.tracerColor || 'var(--accent)',
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        <span
          style={{
            color: 'var(--text-ghost)',
            fontSize: '0.6875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {sniper.skin || 'Default'}
        </span>
      </div>
    </button>
  );
}

// ── ArmorySelector ────────────────────────────────────────────────────────────

export function ArmorySelector(): React.ReactNode {
  const {
    showArmory,
    s2Snipers,
    s2SnipersLoading,
    s2SelectedSniper,
    setS2Snipers,
    setS2SelectedSniper,
    closeArmory,
  } = useStore();

  const { address } = useAccount();

  // Pick a sniper. The slice's setS2SelectedSniper auto-closes the modal.
  const handleSelectAndClose = useCallback(
    (sniper: SniperMetadata) => {
      // eslint-disable-next-line no-console
      console.log('[s2:armory] click', { tokenId: sniper.tokenId, name: sniper.name });
      setS2SelectedSniper(sniper);
      // eslint-disable-next-line no-console
      console.log('[s2:armory] after-set', {
        selected: useStore.getState().s2SelectedSniper?.tokenId ?? null,
        showArmory: useStore.getState().showArmory,
      });
    },
    [setS2SelectedSniper],
  );

  // Fetch snipers when armory opens and we have a connected address
  useEffect(() => {
    if (!showArmory || !address) return;

    let cancelled = false;

    setS2Snipers(s2Snipers, true);

    s2GetSnipers(address)
      .then((res) => {
        if (!cancelled) {
          setS2Snipers(res.snipers, false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setS2Snipers([], false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArmory, address]);

  if (!showArmory) return null;

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="armory-selector-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeArmory();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0, 0, 0, 0.80)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Panel */}
      <section
        style={{
          width: '100%',
          maxWidth: '48rem',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-deep)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 4rem)',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                color: 'var(--accent)',
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '0.25rem',
              }}
            >
              Season 2
            </p>
            <h2
              id="armory-selector-title"
              style={{
                color: 'var(--text)',
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '0.02em',
                margin: 0,
              }}
            >
              Select Sniper
            </h2>
          </div>

          <button
            type="button"
            onClick={closeArmory}
            aria-label="Close armory"
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              padding: '0.375rem 0.75rem',
              transition: 'color 160ms, border-color 160ms',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
            }}
          >
            Close
          </button>
        </header>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', flex: 1 }}>
          {/* Loading state */}
          {s2SnipersLoading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 1rem',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Scanning arsenal...
            </div>
          )}

          {/* Empty state */}
          {!s2SnipersLoading && s2Snipers.length === 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 1rem',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                textAlign: 'center',
              }}
            >
              No Deadshot snipers found in this wallet
            </div>
          )}

          {/* Grid */}
          {!s2SnipersLoading && s2Snipers.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
              }}
              className="armory-grid"
            >
              {s2Snipers.map((sniper) => (
                <SniperCard
                  key={sniper.tokenId}
                  sniper={sniper}
                  isSelected={s2SelectedSniper?.tokenId === sniper.tokenId}
                  onSelect={handleSelectAndClose}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Responsive grid style for sm+ breakpoint */}
      <style>{`
        @media (min-width: 640px) {
          .armory-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
