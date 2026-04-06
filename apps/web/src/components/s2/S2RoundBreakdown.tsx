export interface RoundLine {
  round: number;
  result: 'win' | 'loss' | 'draw';
  headshot: boolean;
}

interface S2RoundBreakdownProps {
  rounds: RoundLine[];
}

function badgeStyles(result: RoundLine['result']): React.CSSProperties {
  switch (result) {
    case 'win':
      return {
        background: 'rgba(0, 189, 254, 0.20)',
        color: 'var(--accent)',
        border: '1px solid rgba(0, 189, 254, 0.30)',
      };
    case 'loss':
      return {
        background: 'rgba(239, 68, 68, 0.20)',
        color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.30)',
      };
    case 'draw':
      return {
        background: 'rgba(255, 255, 255, 0.05)',
        color: 'var(--text-ghost)',
        border: '1px solid transparent',
      };
  }
}

function badgeLabel(result: RoundLine['result']): string {
  switch (result) {
    case 'win':
      return 'W';
    case 'loss':
      return 'L';
    case 'draw':
      return 'D';
  }
}

function tooltipText(line: RoundLine): string {
  const base = `Round ${line.round}: ${line.result}`;
  return line.headshot ? `${base} (headshot)` : base;
}

export function S2RoundBreakdown({ rounds }: S2RoundBreakdownProps): React.ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.375rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      {rounds.map((line) => (
        <div
          key={line.round}
          title={tooltipText(line)}
          style={{
            ...badgeStyles(line.result),
            width: '2rem',
            height: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.25rem',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            fontWeight: 700,
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          {badgeLabel(line.result)}
        </div>
      ))}
    </div>
  );
}
