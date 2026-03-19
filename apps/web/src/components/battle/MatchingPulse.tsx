import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface MatchingPulseProps {
  onCancel?: () => void;
}

export function MatchingPulse({ onCancel }: MatchingPulseProps): React.ReactNode {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Scan line effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent"
          initial={{ top: '-1%' }}
          animate={{ top: '101%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        {/* Secondary slower scan line */}
        <motion.div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-cyan/20 to-transparent"
          initial={{ top: '-1%' }}
          animate={{ top: '101%' }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'linear',
            delay: 0.8,
          }}
        />
      </div>

      {/* Horizontal grid lines */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px bg-accent-cyan/5"
            style={{ top: `${(i + 1) * 5}%` }}
          />
        ))}
      </div>

      {/* Concentric rings behind text */}
      <div className="pointer-events-none absolute">
        {[120, 180, 260].map((size, i) => (
          <motion.div
            key={size}
            className="absolute rounded-full border border-accent-cyan/10"
            style={{
              width: size,
              height: size,
              left: -(size / 2),
              top: -(size / 2),
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.1, 0.25, 0.1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* MATCHING text with pulse */}
        <motion.h2
          className={cn(
            'font-mono text-4xl font-bold uppercase tracking-[0.5em] text-accent-cyan',
            'md:text-6xl'
          )}
          animate={{
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          MATCHING
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          className="font-mono text-xs uppercase tracking-widest text-text-dim"
          animate={{
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        >
          Scanning for opponents...
        </motion.p>

        {/* Loading dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 bg-accent-cyan"
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Cancel button */}
        {onCancel && (
          <motion.button
            onClick={onCancel}
            className={cn(
              'mt-4 font-mono text-xs uppercase tracking-widest',
              'border border-bg-border px-4 py-2 text-text-dim',
              'transition-all duration-200',
              'hover:border-accent-red hover:text-accent-red'
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            Cancel
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
