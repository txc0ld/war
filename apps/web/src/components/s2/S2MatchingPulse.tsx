import { motion } from 'framer-motion';

interface S2MatchingPulseProps {
  subtitle: string;
  onCancel?: () => void;
}

export function S2MatchingPulse({ subtitle, onCancel }: S2MatchingPulseProps): React.ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.90)',
        overflow: 'hidden',
      }}
    >
      {/* Scan line */}
      <motion.div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '1px',
          background: 'rgba(0, 189, 254, 0.20)',
          top: '0%',
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
      />

      {/* MATCHING text */}
      <motion.p
        style={{
          fontFamily: 'monospace',
          fontSize: 'clamp(2rem, 5vw, 3.75rem)',
          letterSpacing: '0.3em',
          color: 'var(--accent)',
          margin: 0,
          textTransform: 'uppercase',
          userSelect: 'none',
        }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity }}
      >
        MATCHING
      </motion.p>

      {/* Subtitle */}
      <p
        style={{
          marginTop: '1.5rem',
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
          maxWidth: '28rem',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        {subtitle}
      </p>

      {/* Cancel button */}
      {onCancel !== undefined && (
        <button
          type="button"
          onClick={onCancel}
          style={{
            marginTop: '2.5rem',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--text-ghost)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem 0.5rem',
            transition: 'color 160ms',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-ghost)';
          }}
        >
          Cancel
        </button>
      )}
    </motion.div>
  );
}
