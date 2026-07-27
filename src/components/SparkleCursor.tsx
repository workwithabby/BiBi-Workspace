import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkle } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
}

const COLORS = [
  '#FF85BB',
  '#FFCEE3',
  '#FF539B',
  '#FFB3D1',
  '#FBBF24', // golden shine
  '#60A5FA', // soft blue spark
];

export const SparkleCursor: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    let lastTime = 0;
    let particleId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      // Throttle particle creation to every ~45ms so it's smooth and performant
      if (now - lastTime < 45) return;
      lastTime = now;

      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      const randomSize = Math.floor(Math.random() * 10) + 10; // 10px to 20px
      const randomRotation = Math.floor(Math.random() * 360);

      const newParticle: Particle = {
        id: particleId++,
        x: e.clientX,
        y: e.clientY,
        size: randomSize,
        color: randomColor,
        rotation: randomRotation,
      };

      setParticles((prev) => [...prev.slice(-18), newParticle]); // keep max 18 active sparkles
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden no-print">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              opacity: 1,
              scale: 0.2,
              x: p.x - p.size / 2,
              y: p.y - p.size / 2,
              rotate: p.rotation,
            }}
            animate={{
              opacity: [1, 0.8, 0],
              scale: [0.3, 1.1, 0.1],
              y: p.y - p.size / 2 - 24, // float upwards slightly
              x: p.x - p.size / 2 + (Math.random() * 16 - 8),
              rotate: p.rotation + 45,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
            }}
          >
            <Sparkle
              size={p.size}
              style={{ color: p.color, fill: p.color }}
              className="drop-shadow-[0_0_6px_rgba(255,133,187,0.8)]"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
