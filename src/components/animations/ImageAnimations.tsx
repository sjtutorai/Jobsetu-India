import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';

// All 10 Premium Image Animation Variants (41 - 50)
export type ImageAnimationVariant =
  | 'curtain'
  | 'circular'
  | 'zoomThrough'
  | 'tilt3d'
  | 'floating'
  | 'rotationEntrance'
  | 'blurToSharp'
  | 'parallax'
  | 'splitReveal'
  | 'morphTransition';

interface AnimatedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: ImageAnimationVariant;
  wrapperClassName?: string;
  curtainColor?: string;
  delay?: number;
}

export const AnimatedImage: React.FC<AnimatedImageProps> = ({
  variant = 'curtain',
  wrapperClassName = '',
  curtainColor = 'bg-blue-600',
  delay = 0,
  className = '',
  ...imgProps
}) => {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [-18, 18]);

  if (prefersReduced) {
    return (
      <div className={wrapperClassName}>
        <img {...imgProps} className={className} />
      </div>
    );
  }

  // 44. 3D Image Tilt (interactive pointer tracking on fine pointers)
  if (variant === 'tilt3d') {
    return (
      <div
        ref={containerRef}
        className={`relative ${wrapperClassName}`}
        style={{ perspective: 900 }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          setTilt({ rx: -py * 14, ry: px * 14 });
        }}
        onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
      >
        <motion.div
          animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-full h-full"
        >
          <img {...imgProps} className={className} />
        </motion.div>
      </div>
    );
  }

  // 41. Image Curtain Reveal
  if (variant === 'curtain') {
    return (
      <div ref={containerRef} className={`relative overflow-hidden ${wrapperClassName}`}>
        <motion.img
          {...(imgProps as any)}
          className={className}
          initial={{ scale: 1.12, opacity: 0.7 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          aria-hidden="true"
          className={`absolute inset-0 pointer-events-none ${curtainColor}`}
          initial={{ scaleX: 1 }}
          whileInView={{ scaleX: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.72, delay, ease: [0.77, 0, 0.175, 1] }}
          style={{ transformOrigin: 'right center' }}
        />
      </div>
    );
  }

  // 42. Circular Image Reveal
  if (variant === 'circular') {
    return (
      <motion.div
        ref={containerRef}
        className={wrapperClassName}
        initial={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0.4 }}
        whileInView={{ clipPath: 'circle(120% at 50% 50%)', opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        <img {...imgProps} className={className} />
      </motion.div>
    );
  }

  // 43. Image Zoom Through
  if (variant === 'zoomThrough') {
    return (
      <div ref={containerRef} className={`overflow-hidden ${wrapperClassName}`}>
        <motion.img
          {...(imgProps as any)}
          className={className}
          initial={{ scale: 1.24, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    );
  }

  // 45. Floating Image Animation
  if (variant === 'floating') {
    return (
      <motion.div
        ref={containerRef}
        className={wrapperClassName}
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay }}
      >
        <img {...imgProps} className={className} />
      </motion.div>
    );
  }

  // 46. Image Rotation Entrance
  if (variant === 'rotationEntrance') {
    return (
      <motion.div
        ref={containerRef}
        className={wrapperClassName}
        initial={{ opacity: 0, rotate: -10, scale: 0.86 }}
        whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16, delay }}
      >
        <img {...imgProps} className={className} />
      </motion.div>
    );
  }

  // 47. Image Blur-to-Sharp
  if (variant === 'blurToSharp') {
    return (
      <div ref={containerRef} className={wrapperClassName}>
        <motion.img
          {...(imgProps as any)}
          className={className}
          initial={{ opacity: 0, filter: 'blur(12px)', scale: 1.04 }}
          whileInView={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    );
  }

  // 48. Image Parallax
  if (variant === 'parallax') {
    return (
      <div ref={containerRef} className={`overflow-hidden ${wrapperClassName}`}>
        <motion.img
          {...(imgProps as any)}
          style={{ y: parallaxY, scale: 1.08 }}
          className={className}
        />
      </div>
    );
  }

  // 49. Image Split Reveal
  if (variant === 'splitReveal') {
    return (
      <div ref={containerRef} className={`relative overflow-hidden ${wrapperClassName}`}>
        <img {...imgProps} className={className} />
        <motion.div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1/2 bg-slate-900/90 pointer-events-none"
          initial={{ x: '0%' }}
          whileInView={{ x: '-100%' }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.72, delay, ease: [0.77, 0, 0.175, 1] }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-1/2 bg-slate-900/90 pointer-events-none"
          initial={{ x: '0%' }}
          whileInView={{ x: '100%' }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.72, delay, ease: [0.77, 0, 0.175, 1] }}
        />
      </div>
    );
  }

  // 50. Image Morph Transition
  return (
    <motion.div
      ref={containerRef}
      className={wrapperClassName}
      initial={{ borderRadius: '48%', scale: 0.9, opacity: 0 }}
      whileInView={{ borderRadius: '1rem', scale: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <img {...imgProps} className={className} />
    </motion.div>
  );
};
