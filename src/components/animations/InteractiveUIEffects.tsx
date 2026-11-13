import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring, useReducedMotion } from 'motion/react';

// 51. Magnetic Buttons
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  strength?: number;
}> = ({ children, className = '', strength = 0.26 }) => {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18 });
  const sy = useSpring(y, { stiffness: 260, damping: 18 });

  if (prefersReduced) return <div className={`inline-block ${className}`}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      className={`inline-block ${className}`}
      onMouseMove={(e) => {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = (e.clientX - (rect.left + rect.width / 2)) * strength;
        const offsetY = (e.clientY - (rect.top + rect.height / 2)) * strength;
        x.set(offsetX);
        y.set(offsetY);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
};

// 52. Cursor Spotlight & 53. Custom Animated Cursor (Desktop fine pointers only, non-blocking)
export const GlobalCursorEffects: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hoveringInteractive, setHoveringInteractive] = useState(false);
  const cursorX = useMotionValue(-200);
  const cursorY = useMotionValue(-200);
  const smoothX = useSpring(cursorX, { stiffness: 320, damping: 28 });
  const smoothY = useSpring(cursorY, { stiffness: 320, damping: 28 });
  const spotX = useSpring(cursorX, { stiffness: 120, damping: 24 });
  const spotY = useSpring(cursorY, { stiffness: 120, damping: 24 });

  useEffect(() => {
    if (prefersReduced || typeof window === 'undefined') return;
    const isFine = window.matchMedia('(pointer: fine)').matches;
    if (!isFine) return;
    setEnabled(true);

    const onMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      const target = e.target as HTMLElement | null;
      const interactive = Boolean(
        target?.closest('button, a, [role="button"], input, select, textarea, .cursor-pointer')
      );
      setHoveringInteractive(interactive);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [prefersReduced, cursorX, cursorY]);

  if (!enabled || prefersReduced) return null;

  return (
    <>
      {/* 52. Subtle Cursor Spotlight */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 w-72 h-72 -ml-36 -mt-36 rounded-full pointer-events-none z-30 hidden lg:block"
        style={{
          x: spotX,
          y: spotY,
          background:
            'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, rgba(245, 158, 11, 0.03) 45%, transparent 72%)'
        }}
      />
      {/* 53. Custom Animated Cursor Follower Ring */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-[9999] hidden lg:block rounded-full border border-blue-500/45 transition-colors duration-150"
        style={{
          x: smoothX,
          y: smoothY,
          width: hoveringInteractive ? 36 : 22,
          height: hoveringInteractive ? 36 : 22,
          marginLeft: hoveringInteractive ? -18 : -11,
          marginTop: hoveringInteractive ? -18 : -11,
          backgroundColor: hoveringInteractive ? 'rgba(37, 99, 235, 0.08)' : 'transparent'
        }}
      />
    </>
  );
};

// 57. 3D Tilt Cards
export const TiltCard3D: React.FC<{
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}> = ({ children, className = '', maxTilt = 6 }) => {
  const prefersReduced = useReducedMotion();
  const [rot, setRot] = useState({ rx: 0, ry: 0 });

  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <div
      className={className}
      style={{ perspective: 1000 }}
      onMouseMove={(e) => {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        setRot({ rx: -py * maxTilt, ry: px * maxTilt });
      }}
      onMouseLeave={() => setRot({ rx: 0, ry: 0 })}
    >
      <motion.div
        animate={{ rotateX: rot.rx, rotateY: rot.ry }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="h-full"
      >
        {children}
      </motion.div>
    </div>
  );
};

// 58. Card Flip Interaction (hover/focus subtle 3D flip wrapper for showcase items)
export const InteractiveFlipCard: React.FC<{
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
}> = ({ front, back, className = '' }) => {
  const prefersReduced = useReducedMotion();
  const [flipped, setFlipped] = useState(false);

  if (prefersReduced) return <div className={className}>{front}</div>;

  return (
    <div
      className={`relative cursor-pointer ${className}`}
      style={{ perspective: 1000 }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped((prev) => !prev)}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full h-full"
      >
        <div style={{ backfaceVisibility: 'hidden' }} className="w-full h-full">
          {front}
        </div>
        <div
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className="absolute inset-0 w-full h-full"
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
};

// 59. Ripple Click Effect Wrapper
export const RippleContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  rippleColor?: string;
}> = ({ children, className = '', rippleColor = 'rgba(255,255,255,0.4)' }) => {
  const prefersReduced = useReducedMotion();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples((prev) => [
      ...prev.slice(-3),
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top }
    ]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 650);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`relative overflow-hidden inline-flex ${className}`}
    >
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full"
          style={{
            left: r.x - 16,
            top: r.y - 16,
            width: 32,
            height: 32,
            backgroundColor: rippleColor,
            animation: 'jobsetu-ripple-pulse 0.6s ease-out forwards'
          }}
        />
      ))}
    </div>
  );
};

// 63. Animated Progress Bar
export const AnimatedProgressBar: React.FC<{
  percent: number;
  barClassName?: string;
  trackClassName?: string;
}> = ({
  percent,
  barClassName = 'bg-emerald-400 h-full rounded-full',
  trackClassName = 'w-full bg-white/20 h-2.5 rounded-full overflow-hidden'
}) => {
  const prefersReduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, percent));

  if (prefersReduced) {
    return (
      <div className={trackClassName}>
        <div className={barClassName} style={{ width: `${clamped}%` }} />
      </div>
    );
  }

  return (
    <div className={trackClassName}>
      <motion.div
        className={barClassName}
        initial={{ width: 0 }}
        whileInView={{ width: `${clamped}%` }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
};

// 64. Number Counting Animation
export const NumberCounter: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
}> = ({ value, prefix = '', suffix = '', durationMs = 1200, className = '' }) => {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [display, setDisplay] = useState(prefersReduced ? value : 0);

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(value);
      return;
    }
    if (!isInView) return;

    let rafId = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isInView, value, durationMs, prefersReduced]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
};

// 65. Interactive Hover Spotlight Card
export const HoverSpotlightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  onClick?: () => void;
}> = ({
  children,
  className = '',
  spotlightColor = 'rgba(37, 99, 235, 0.08)',
  onClick
}) => {
  const prefersReduced = useReducedMotion();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <div
      onClick={onClick}
      onMouseMove={(e) => {
        if (prefersReduced || window.matchMedia('(pointer: coarse)').matches) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseLeave={() => setPos(null)}
      className={`relative overflow-hidden ${className}`}
    >
      {pos && !prefersReduced && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(280px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 75%)`
          }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};
