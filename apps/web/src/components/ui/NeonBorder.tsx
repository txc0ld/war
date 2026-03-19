import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface NeonBorderProps {
  children: ReactNode;
  color?: 'cyan' | 'neon' | 'red' | 'gold' | 'magenta';
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

const colorMap = {
  cyan: {
    border: 'border-accent-cyan',
    shadow: {
      low: 'shadow-[0_0_8px_rgba(0,240,255,0.15)]',
      medium: 'shadow-[0_0_16px_rgba(0,240,255,0.25)]',
      high: 'shadow-[0_0_30px_rgba(0,240,255,0.4)]',
    },
  },
  neon: {
    border: 'border-accent-neon',
    shadow: {
      low: 'shadow-[0_0_8px_rgba(204,255,0,0.15)]',
      medium: 'shadow-[0_0_16px_rgba(204,255,0,0.25)]',
      high: 'shadow-[0_0_30px_rgba(204,255,0,0.4)]',
    },
  },
  red: {
    border: 'border-accent-red',
    shadow: {
      low: 'shadow-[0_0_8px_rgba(255,51,51,0.15)]',
      medium: 'shadow-[0_0_16px_rgba(255,51,51,0.25)]',
      high: 'shadow-[0_0_30px_rgba(255,51,51,0.4)]',
    },
  },
  gold: {
    border: 'border-accent-gold',
    shadow: {
      low: 'shadow-[0_0_8px_rgba(255,215,0,0.15)]',
      medium: 'shadow-[0_0_16px_rgba(255,215,0,0.25)]',
      high: 'shadow-[0_0_30px_rgba(255,215,0,0.4)]',
    },
  },
  magenta: {
    border: 'border-accent-magenta',
    shadow: {
      low: 'shadow-[0_0_8px_rgba(255,0,255,0.15)]',
      medium: 'shadow-[0_0_16px_rgba(255,0,255,0.25)]',
      high: 'shadow-[0_0_30px_rgba(255,0,255,0.4)]',
    },
  },
} as const;

export function NeonBorder({
  children,
  color = 'cyan',
  intensity = 'medium',
  className,
}: NeonBorderProps): ReactNode {
  const scheme = colorMap[color];
  return (
    <div
      className={cn(
        'border',
        scheme.border,
        scheme.shadow[intensity],
        className
      )}
    >
      {children}
    </div>
  );
}
