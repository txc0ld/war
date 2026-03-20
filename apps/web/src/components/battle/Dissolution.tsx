import { useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './battlePresentation.css';

interface DissolutionProps {
  imageUrl: string;
  onComplete: () => void;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  color: string;
  velocityX: number;
  velocityY: number;
  alpha: number;
  size: number;
}

const CANVAS_SIZE = 200;
const DURATION_MS = 2000;
const PIXEL_SAMPLE_STEP = 4;

export function Dissolution({ imageUrl, onComplete, className }: DissolutionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const createParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const { data } = imageData;
    const particles: Particle[] = [];

    for (let y = 0; y < CANVAS_SIZE; y += PIXEL_SAMPLE_STEP) {
      for (let x = 0; x < CANVAS_SIZE; x += PIXEL_SAMPLE_STEP) {
        const index = (y * CANVAS_SIZE + x) * 4;
        const r = data[index] ?? 0;
        const g = data[index + 1] ?? 0;
        const b = data[index + 2] ?? 0;
        const a = data[index + 3] ?? 0;

        if (a < 10) continue;

        particles.push({
          x,
          y,
          color: `rgba(${r},${g},${b},${a / 255})`,
          velocityX: Math.random() * 2 - 1,
          velocityY: -(Math.random() * 1.5 + 0.5),
          alpha: 1,
          size: Math.random() + 2,
        });
      }
    }

    return particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      particlesRef.current = createParticles(ctx);
      startTimeRef.current = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(elapsed / DURATION_MS, 1);

        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        for (const particle of particlesRef.current) {
          particle.x += particle.velocityX;
          particle.y += particle.velocityY;
          particle.alpha = Math.max(0, 1 - progress);

          ctx.globalAlpha = particle.alpha;
          ctx.fillStyle = particle.color;
          ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        }

        ctx.globalAlpha = 1;

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          onComplete();
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    img.src = imageUrl;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [imageUrl, onComplete, createParticles]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={['warpath-dissolution', className].filter(Boolean).join(' ')}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="warpath-dissolution__canvas"
        />
      </motion.div>
    </AnimatePresence>
  );
}
