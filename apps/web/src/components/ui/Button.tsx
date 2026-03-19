import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variants = {
  primary: cn(
    'border-accent-cyan bg-bg-primary text-accent-cyan',
    'hover:bg-accent-cyan/10 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]'
  ),
  secondary: cn(
    'border-accent-neon bg-bg-primary text-accent-neon',
    'hover:bg-accent-neon/10 hover:shadow-[0_0_20px_rgba(204,255,0,0.3)]'
  ),
  danger: cn(
    'border-accent-red bg-bg-primary text-accent-red',
    'hover:bg-accent-red/10 hover:shadow-[0_0_20px_rgba(255,51,51,0.3)]'
  ),
  ghost: cn(
    'border-bg-border bg-transparent text-text-muted',
    'hover:border-text-dim hover:text-text-secondary'
  ),
} as const;

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
} as const;

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  children,
  ...props
}: ButtonProps): ReactNode {
  return (
    <button
      className={cn(
        'font-mono uppercase tracking-widest',
        'border transition-all duration-200',
        'active:scale-95',
        'disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
