import { cn } from '@/lib/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4 border',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-2',
} as const;

export function Spinner({
  size = 'md',
  color = 'border-accent-cyan',
  className,
}: SpinnerProps): React.ReactNode {
  return (
    <div
      className={cn(
        'animate-spin border-t-transparent',
        sizeMap[size],
        color,
        className
      )}
    />
  );
}
