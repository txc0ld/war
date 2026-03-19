import { cn } from '@/lib/cn';

interface GlitchTextProps {
  text: string;
  className?: string;
}

export function GlitchText({ text, className }: GlitchTextProps): React.ReactNode {
  return (
    <span
      className={cn(
        'relative inline-block font-mono uppercase tracking-widest',
        'animate-glitch',
        className
      )}
      data-text={text}
    >
      {text}
    </span>
  );
}
