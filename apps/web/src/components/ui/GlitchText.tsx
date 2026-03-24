import { cn } from '@/lib/cn';

interface GlitchTextProps {
  text: string;
  className?: string;
}

export function GlitchText({ text, className }: GlitchTextProps): React.ReactNode {
  return (
    <span
      className={cn(
        'relative inline-block uppercase tracking-widest',
        className
      )}
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 900,
      }}
      data-text={text}
    >
      {text}
    </span>
  );
}
