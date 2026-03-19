import { cn } from '@/lib/cn';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color: string;
}

export function StatBar({ label, value, max = 100, color }: StatBarProps): React.ReactNode {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="flex items-center gap-3">
      <span className="w-8 font-mono text-[10px] uppercase tracking-wider text-text-dim">
        {label}
      </span>
      <div className="relative h-2 flex-1 bg-bg-elevated">
        <div
          className={cn('absolute inset-y-0 left-0 transition-all duration-300')}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="w-8 text-right font-mono text-xs tabular-nums"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}
