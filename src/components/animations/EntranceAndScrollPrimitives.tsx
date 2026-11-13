import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// All 15 Creative Entrance Variants (16 - 30)
export type EntranceVariant =
  | 'zoomInDistance'
  | 'zoomOutPosition'
  | 'flyLeft'
  | 'flyRight'
  | 'dropTop'
  | 'riseBottom'
  | 'diagonal'
  | 'spiral'
  | 'circularReveal'
  | 'elasticBounce'
  | 'spring'
  | 'flipCard'
  | 'perspectiveSlide'
  | 'scaleRotate'
  | 'splitScreen';

interface CreativeEntranceProps {
  children: React.ReactNode;
  variant?: EntranceVariant;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

const ENTRANCE_CONFIGS: Record<
  EntranceVariant,
  { initial: Record<string, any>; animate: Record<string, any>; transition?: Record<string, any> }
> = {
  // 16. Zoom In From Distance
  zoomInDistance: {
    initial: { opacity: 0, scale: 0.72 },
    animate: { opacity: 1, scale: 1 },
    transition: { ease: [0.16, 1, 0.3, 1] }
  },
  // 17. Zoom Out Into Position
  zoomOutPosition: {
    initial: { opacity: 0, scale: 1.14 },
    animate: { opacity: 1, scale: 1 },
    transition: { ease: [0.22, 1, 0.36, 1] }
  },
  // 18. Fly In From Left
  flyLeft: {
    initial: { opacity: 0, x: -48 },
    animate: { opacity: 1, x: 0 },
    transition: { ease: [0.22, 1, 0.36, 1] }
  },
  // 19. Fly In From Right
  flyRight: {
    initial: { opacity: 0, x: 48 },
    animate: { opacity: 1, x: 0 },
    transition: { ease: [0.22, 1, 0.36, 1] }
  },
  // 20. Drop From Top
  dropTop: {
    initial: { opacity: 0, y: -36 },
    animate: { opacity: 1, y: 0 },
    transition: { ease: [0.22, 1, 0.36, 1] }
  },
  // 21. Rise From Bottom
  riseBottom: {
    initial: { opacity: 0, y: 36 },
    animate: { opacity: 1, y: 0 },
    transition: { ease: [0.22, 1, 0.36, 1] }
  },
  // 22. Diagonal Entrance
  diagonal: {
    initial: { opacity: 0, x: -32, y: 32 },
    animate: { opacity: 1, x: 0, y: 0 },
    transition: { ease: [0.22, 1, 0.36, 1] }
  },
  // 23. Spiral Entrance
  spiral: {
    initial: { opacity: 0, scale: 0.78, rotate: -14, y: 18 },
    animate: { opacity: 1, scale: 1, rotate: 0, y: 0 },
    transition: { type: 'spring', stiffness: 180, damping: 16 }
  },
  // 24. Circular Reveal
  circularReveal: {
    initial: { opacity: 0.2, clipPath: 'circle(0% at 50% 50%)' },
    animate: { opacity: 1, clipPath: 'circle(150% at 50% 50%)' },
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] }
  },
  // 25. Elastic Bounce
  elasticBounce: {
    initial: { opacity: 0, scale: 0.85, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { type: 'spring', stiffness: 300, damping: 14 }
  },
  // 26. Spring Entrance
  spring: {
    initial: { opacity: 0, y: 26, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { type: 'spring', stiffness: 220, damping: 20 }
  },
  // 27. Flip Card Entrance
  flipCard: {
    initial: { opacity: 0, rotateY: -24, scale: 0.94 },
    animate: { opacity: 1, rotateY: 0, scale: 1 },
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] }
  },
  // 28. 3D Perspective Slide
  perspectiveSlide: {
    initial: { opacity: 0, rotateX: 16, y: 30, scale: 0.96 },
    animate: { opacity: 1, rotateX: 0, y: 0, scale: 1 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  },
  // 29. Scale and Rotate
  scaleRotate: {
    initial: { opacity: 0, scale: 0.88, rotate: 5 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
  },
  // 30. Split Screen Reveal
  splitScreen: {
    initial: { opacity: 0, clipPath: 'inset(0 50% 0 50%)' },
    animate: { opacity: 1, clipPath: 'inset(0 0% 0 0%)' },
    transition: { duration: 0.68, ease: [0.22, 1, 0.36, 1] }
  }
};

export const CreativeEntrance: React.FC<CreativeEntranceProps> = ({
  children,
  variant = 'riseBottom',
  delay = 0,
  duration = 0.55,
  className = '',
  once = true
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  const cfg = ENTRANCE_CONFIGS[variant];
  const needsPerspective = variant === 'flipCard' || variant === 'perspectiveSlide';

  return (
    <div className={className} style={needsPerspective ? { perspective: 1000 } : undefined}>
      <motion.div
        initial={cfg.initial}
        whileInView={cfg.animate}
        viewport={{ once, amount: 0.14 }}
        transition={{
          duration,
          delay,
          ...cfg.transition
        }}
        className="h-full"
      >
        {children}
      </motion.div>
    </div>
  );
};

// ==================== CINEMATIC SCROLL ANIMATIONS (31 - 40) ====================

// 31. Parallax Scrolling – Background/element moves at a different speed
export const ParallaxScrollLayer: React.FC<{
  children: React.ReactNode;
  speed?: number;
  className?: string;
}> = ({ children, speed = 36, className = '' }) => {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  const y = useTransform(scrollYProgress, [0, 1], [-speed, speed]);

  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
};

// 32. Sticky Section Reveal (sticky header/aside column wrapper)
export const StickySectionReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`lg:sticky lg:top-24 ${className}`}
    >
      {children}
    </motion.div>
  );
};

// 33. Scroll-Triggered Zoom (uses GSAP ScrollTrigger safely)
export const ScrollTriggeredZoom: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        el,
        { scale: 0.94, opacity: 0.82 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 86%',
            end: 'top 45%',
            scrub: 0.6
          }
        }
      );
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

// 34. Horizontal Scrolling Sections (smooth horizontal track with drag/wheel friendliness)
export const HorizontalScrollTrack: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={`flex overflow-x-auto gap-4 ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 28 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-center overflow-x-auto scroll-smooth ${className}`}
    >
      {children}
    </motion.div>
  );
};

// 35. Scroll-Based Text Transformation
export const ScrollTextTransform: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center']
  });
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.7, 1], [0.4, 0.9, 1]);

  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ scale, opacity }}>{children}</motion.div>
    </div>
  );
};

// 36. Image Pinning Animation (scroll-coupled reveal via GSAP ScrollTrigger)
export const ImagePinningReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        el,
        { y: 24, clipPath: 'inset(6% 0% 6% 0% round 20px)' },
        {
          y: 0,
          clipPath: 'inset(0% 0% 0% 0% round 20px)',
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            end: 'top 35%',
            scrub: 0.7
          }
        }
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

// 37. Section-to-Section Morph Transition
export const SectionMorphTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start 0.35']
  });
  const scale = useTransform(scrollYProgress, [0, 1], [0.97, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [20, 0]);

  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ scale, y }}>{children}</motion.div>
    </div>
  );
};

// 38. Progressive Image Reveal (scroll-scrubbed reveal)
export const ProgressiveImageReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ clipPath: 'inset(0 0 100% 0)', opacity: 0.4 }}
      whileInView={{ clipPath: 'inset(0 0 0% 0)', opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 39. Scroll-Driven Rotation
export const ScrollDrivenRotation: React.FC<{
  children: React.ReactNode;
  degrees?: number;
  className?: string;
}> = ({ children, degrees = 180, className = '' }) => {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  const rotate = useTransform(scrollYProgress, [0, 1], [0, degrees]);

  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ rotate }}>{children}</motion.div>
    </div>
  );
};

// 40. Staggered Card Reveal
export const StaggeredCardContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className = '', staggerDelay = 0.08 }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggeredCardItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
