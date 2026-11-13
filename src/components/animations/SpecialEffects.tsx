import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

// 66. Particle Background (lightweight GPU-friendly particles)
export const ParticleBackground: React.FC<{
  count?: number;
  className?: string;
  dotColor?: string;
}> = ({ count = 16, className = '', dotColor = 'bg-blue-400/25' }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return null;

  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${(i * 19 + 7) % 94}%`,
    top: `${(i * 23 + 11) % 88}%`,
    size: 4 + (i % 4) * 2,
    duration: 5 + (i % 5) * 1.4,
    delay: (i % 6) * 0.4
  }));

  return (
    <div aria-hidden="true" className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className={`absolute rounded-full ${dotColor}`}
          style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
          animate={{
            y: [0, -18, 0],
            opacity: [0.25, 0.75, 0.25],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};

// 67. Floating Geometric Shapes
export const FloatingGeometricShapes: React.FC<{ className?: string }> = ({ className = '' }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return null;

  return (
    <div aria-hidden="true" className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        className="absolute top-16 left-[8%] text-blue-400/20"
        animate={{ y: [0, -14, 0], rotate: [0, 25, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <polygon points="18,3 33,31 3,31" fill="none" stroke="currentColor" strokeWidth="2" />
      </motion.svg>

      <motion.svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        className="absolute top-28 right-[9%] text-amber-400/25"
        animate={{ y: [0, 14, 0], rotate: [0, -30, 0] }}
        transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="4" y="4" width="24" height="24" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      </motion.svg>

      <motion.svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        className="hidden sm:block absolute bottom-24 left-[12%] text-emerald-500/20"
        animate={{ y: [0, -10, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="14" cy="14" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      </motion.svg>
    </div>
  );
};

// 68. Animated Gradient Orbs + 69. Liquid Blob + 70. Aurora + 71. Moving Grid + 72. Shooting Stars
export const HeroAmbientBackdrop: React.FC = () => {
  const prefersReduced = useReducedMotion();

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 71. Moving Grid Background */}
      <div className="absolute inset-0 jobsetu-moving-grid opacity-65" />

      {/* 70. Aurora Background Effect */}
      <div
        className="jobsetu-aurora-layer absolute -top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl h-96 opacity-45 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at 30% 40%, rgba(37,99,235,0.22), transparent 60%), radial-gradient(ellipse at 70% 55%, rgba(245,158,11,0.16), transparent 60%)'
        }}
      />

      {/* 68. Animated Gradient Orbs & 69. Liquid Blob */}
      {!prefersReduced && (
        <>
          <div className="jobsetu-blob-shape absolute -top-10 -left-16 w-64 h-64 bg-blue-200/25 blur-2xl" />
          <div
            className="jobsetu-blob-shape absolute top-16 -right-12 w-72 h-72 bg-amber-200/20 blur-2xl"
            style={{ animationDelay: '3s' }}
          />
          {/* 72. Shooting Star Effect */}
          <span
            className="hidden md:block absolute top-10 left-[18%] w-24 h-[2px] rounded-full bg-gradient-to-r from-transparent via-blue-400/70 to-amber-300/80"
            style={{ animation: 'jobsetu-shooting-star 8s ease-in-out infinite' }}
          />
          <span
            className="hidden md:block absolute top-24 right-[22%] w-20 h-[2px] rounded-full bg-gradient-to-r from-transparent via-amber-400/60 to-blue-400/70"
            style={{ animation: 'jobsetu-shooting-star 11s ease-in-out 4s infinite' }}
          />
        </>
      )}

      {/* 66. Particle Background & 67. Floating Geometric Shapes */}
      <ParticleBackground count={14} />
      <FloatingGeometricShapes />
    </div>
  );
};

// 76. Animated SVG Draw (Self-drawing decorative connector / divider)
export const AnimatedSVGDrawLine: React.FC<{
  className?: string;
  strokeColor?: string;
}> = ({ className = 'w-full h-4', strokeColor = '#2563EB' }) => {
  const prefersReduced = useReducedMotion();
  return (
    <svg viewBox="0 0 600 16" fill="none" className={className} aria-hidden="true">
      <motion.path
        d="M4 8 C 150 2, 300 14, 596 8"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.28"
        initial={{ pathLength: prefersReduced ? 1 : 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
};

// 77. Morphing Shapes Badge Accent
export const MorphingAccentOrb: React.FC<{ className?: string }> = ({
  className = 'w-20 h-20 bg-blue-500/10'
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
      animate={{
        borderRadius: [
          '60% 40% 30% 70% / 60% 30% 70% 40%',
          '35% 65% 60% 40% / 45% 55% 45% 55%',
          '60% 40% 30% 70% / 60% 30% 70% 40%'
        ],
        rotate: [0, 12, 0]
      }}
      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
};

// 79. Ripple Background (subtle radar pulse rings behind 50km focal points)
export const RippleRadarPulse: React.FC<{ className?: string; colorClass?: string }> = ({
  className = '',
  colorClass = 'border-emerald-500/35'
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return null;

  return (
    <span aria-hidden="true" className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}>
      <span
        className={`w-full h-full rounded-full border ${colorClass}`}
        style={{ animation: 'jobsetu-ripple-pulse 2.6s cubic-bezier(0.16, 1, 0.3, 1) infinite' }}
      />
    </span>
  );
};

// 78. Smoke-Like Reveal Wrapper
export const SmokeReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(12px)', y: 12, scale: 1.03 }}
      whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.72, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
