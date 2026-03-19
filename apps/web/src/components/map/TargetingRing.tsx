import { motion } from 'framer-motion';

interface TargetingRingProps {
  x: number;
  y: number;
  color?: string;
}

const RINGS = [
  { radius: 8, delay: 0, strokeWidth: 1 },
  { radius: 16, delay: 0.3, strokeWidth: 0.75 },
  { radius: 24, delay: 0.6, strokeWidth: 0.5 },
] as const;

export function TargetingRing({
  x,
  y,
  color = '#00F0FF',
}: TargetingRingProps): React.ReactNode {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {RINGS.map((ring) => (
        <motion.circle
          key={ring.radius}
          cx={0}
          cy={0}
          r={ring.radius}
          fill="none"
          stroke={color}
          strokeWidth={ring.strokeWidth}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{
            scale: [0.6, 1, 0.6],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 2,
            delay: ring.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </g>
  );
}
