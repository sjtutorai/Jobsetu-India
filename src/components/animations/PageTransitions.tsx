import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

// All 7 Page Transitions:
// 1. Smooth Fade Transition ('fade')
// 2. Zoom Through Transition ('zoomThrough')
// 3. Circular Page Reveal ('circularReveal')
// 4. Horizontal Slide Transition ('horizontalSlide')
// 5. Vertical Curtain Transition ('verticalCurtain')
// 6. Blur Transition ('blur')
// 7. Shared Element Transition (via `layoutId` in Navbar, Sidebar, Tabs & PageTransitionWrapper)

export type PageTransitionKind =
  | 'fade'
  | 'zoomThrough'
  | 'circularReveal'
  | 'horizontalSlide'
  | 'verticalCurtain'
  | 'blur';

interface PageTransitionWrapperProps {
  routeKey: string;
  kind?: PageTransitionKind;
  children: React.ReactNode;
  className?: string;
}

const TRANSITIONS: Record<
  PageTransitionKind,
  { initial: Record<string, any>; animate: Record<string, any>; exit: Record<string, any> }
> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  zoomThrough: {
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.02 }
  },
  circularReveal: {
    initial: { opacity: 0, scale: 0.97, y: 12 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0 }
  },
  horizontalSlide: {
    initial: { opacity: 0, x: 18 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -18 }
  },
  verticalCurtain: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 }
  },
  blur: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 }
  }
};

export const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({
  routeKey,
  kind = 'fade',
  children,
  className = ''
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  const preset = TRANSITIONS[kind] || TRANSITIONS.fade;

  return (
    <motion.div
      key={routeKey}
      initial={preset.initial}
      animate={preset.animate}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
