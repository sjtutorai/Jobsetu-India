import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'motion/react';

interface BaseTextProps {
  text: string;
  className?: string;
  delay?: number;
}

// 1. Split Text Reveal – Reveal text character by character
export const SplitTextReveal: React.FC<BaseTextProps> = ({ text, className = '', delay = 0 }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <span className={className}>{text}</span>;

  const chars = Array.from(text);
  return (
    <span className={`inline-block ${className}`} aria-label={text}>
      {chars.map((char, idx) => (
        <motion.span
          key={`${char}-${idx}`}
          aria-hidden="true"
          className="inline-block"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{
            duration: 0.35,
            delay: delay + idx * 0.022,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

// 2. Word Stagger – Words enter one after another
export const WordStagger: React.FC<BaseTextProps & { stagger?: number }> = ({
  text,
  className = '',
  delay = 0,
  stagger = 0.055
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <span className={className}>{text}</span>;

  const words = text.split(' ');
  return (
    <span className={`inline ${className}`}>
      {words.map((word, idx) => (
        <React.Fragment key={`${word}-${idx}`}>
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.42,
              delay: delay + idx * stagger,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            {word}
          </motion.span>
          {idx < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </span>
  );
};

// 3. 3D Text Rotation – Text rotates into the screen
export const Rotate3DText: React.FC<BaseTextProps> = ({ text, className = '', delay = 0 }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <span className={className}>{text}</span>;

  return (
    <span className="inline-block" style={{ perspective: 900 }}>
      <motion.span
        className={`inline-block origin-bottom ${className}`}
        initial={{ opacity: 0, rotateX: -75, y: 16 }}
        whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {text}
      </motion.span>
    </span>
  );
};

// 4. Elastic Text – Text stretches and settles into position
export const ElasticText: React.FC<BaseTextProps> = ({ text, className = '', delay = 0 }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <span className={className}>{text}</span>;

  return (
    <motion.span
      className={`inline-block origin-left ${className}`}
      initial={{ opacity: 0, scaleX: 1.28, scaleY: 0.78 }}
      whileInView={{ opacity: 1, scaleX: 1, scaleY: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        type: 'spring',
        stiffness: 240,
        damping: 14,
        mass: 0.8,
        delay
      }}
    >
      {text}
    </motion.span>
  );
};

// 5. Wave Text – Letters move in a smooth wave sequence
export const WaveText: React.FC<BaseTextProps & { loop?: boolean }> = ({
  text,
  className = '',
  delay = 0,
  loop = false
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <span className={className}>{text}</span>;

  const chars = Array.from(text);
  return (
    <span className={`inline-block ${className}`} aria-label={text}>
      {chars.map((char, idx) => (
        <motion.span
          key={`${char}-${idx}`}
          aria-hidden="true"
          className="inline-block"
          initial={{ y: 8, opacity: 0 }}
          whileInView={{
            y: loop ? [0, -5, 0] : [8, -6, 0],
            opacity: 1
          }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{
            duration: loop ? 2.4 : 0.55,
            delay: delay + idx * 0.03,
            repeat: loop ? Infinity : 0,
            repeatDelay: loop ? 2.5 : 0,
            ease: 'easeInOut'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

// 6. Typewriter Effect – Text types itself automatically
export const TypewriterText: React.FC<BaseTextProps & { speedMs?: number; showCursor?: boolean }> = ({
  text,
  className = '',
  delay = 0,
  speedMs = 26,
  showCursor = false
}) => {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [displayed, setDisplayed] = useState(prefersReduced ? text : '');
  const [done, setDone] = useState(Boolean(prefersReduced));

  useEffect(() => {
    if (prefersReduced) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    if (!isInView) return;

    let timer: number | undefined;
    let interval: number | undefined;
    timer = window.setTimeout(() => {
      let i = 0;
      interval = window.setInterval(() => {
        i += 1;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          window.clearInterval(interval);
          setDone(true);
        }
      }, speedMs);
    }, delay * 1000);

    return () => {
      if (timer) window.clearTimeout(timer);
      if (interval) window.clearInterval(interval);
    };
  }, [isInView, text, speedMs, delay, prefersReduced]);

  return (
    <span ref={ref} className={className}>
      {displayed || (isInView ? '' : '\u00A0')}
      {showCursor && !done && (
        <span className="inline-block w-[2px] h-[1em] align-middle bg-current ml-0.5 animate-pulse" />
      )}
    </span>
  );
};

// 7. Scramble Text – Random characters transform into the actual heading
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const ScrambleText: React.FC<BaseTextProps> = ({ text, className = '', delay = 0 }) => {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [output, setOutput] = useState(text);

  useEffect(() => {
    if (prefersReduced || !isInView) return;

    let frame = 0;
    const totalFrames = Math.max(14, text.length * 1.3);
    let interval: number | undefined;
    const startTimer = window.setTimeout(() => {
      interval = window.setInterval(() => {
        frame += 1;
        const progress = frame / totalFrames;
        const next = text
          .split('')
          .map((char, idx) => {
            if (char === ' ') return ' ';
            if (idx / text.length <= progress) return char;
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join('');
        setOutput(next);
        if (frame >= totalFrames) {
          setOutput(text);
          window.clearInterval(interval);
        }
      }, 28);
    }, delay * 1000);

    return () => {
      window.clearTimeout(startTimer);
      if (interval) window.clearInterval(interval);
    };
  }, [isInView, text, delay, prefersReduced]);

  return (
    <span ref={ref} className={className}>
      {output}
    </span>
  );
};

// 8. Vertical Text Reveal – Text reveals from bottom to top
export const VerticalRevealText: React.FC<BaseTextProps> = ({ text, className = '', delay = 0 }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <span className={className}>{text}</span>;

  return (
    <span className="inline-block overflow-hidden align-bottom">
      <motion.span
        className={`inline-block ${className}`}
        initial={{ y: '105%', opacity: 0 }}
        whileInView={{ y: '0%', opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {text}
      </motion.span>
    </span>
  );
};

// 9. Horizontal Mask Reveal – Text appears through a moving mask
export const HorizontalMaskText: React.FC<BaseTextProps> = ({ text, className = '', delay = 0 }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <span className={className}>{text}</span>;

  return (
    <motion.span
      className={`inline-block ${className}`}
      initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.2 }}
      whileInView={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {text}
    </motion.span>
  );
};

// 10. Flip Text – Words flip vertically into position
export const FlipText: React.FC<BaseTextProps> = ({ text, className = '', delay = 0 }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <span className={className}>{text}</span>;

  const words = text.split(' ');
  return (
    <span className={`inline ${className}`} style={{ perspective: 800 }}>
      {words.map((word, idx) => (
        <React.Fragment key={`${word}-${idx}`}>
          <motion.span
            className="inline-block origin-top"
            initial={{ opacity: 0, rotateX: -85, y: 8 }}
            whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.5,
              delay: delay + idx * 0.06,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            {word}
          </motion.span>
          {idx < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </span>
  );
};

// 11. Blur Reveal – Blurred text becomes sharp
export const BlurRevealText: React.FC<BaseTextProps> = ({ text, className = '', delay = 0 }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <span className={className}>{text}</span>;

  return (
    <motion.span
      className={`inline-block ${className}`}
      initial={{ opacity: 0, filter: 'blur(10px)', y: 8 }}
      whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {text}
    </motion.span>
  );
};

// 12. Glitch Reveal – A brief digital glitch reveals the heading
export const GlitchText: React.FC<BaseTextProps> = ({ text, className = '', delay = 0 }) => {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  if (prefersReduced) return <span className={className}>{text}</span>;

  return (
    <motion.span
      ref={ref}
      className={`inline-block ${isInView ? 'jobsetu-glitch-once' : ''} ${className}`}
      initial={{ opacity: 0, x: -4 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay }}
    >
      {text}
    </motion.span>
  );
};

// 13. Character Drop – Letters fall into their positions
export const CharacterDropText: React.FC<BaseTextProps> = ({ text, className = '', delay = 0 }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <span className={className}>{text}</span>;

  const chars = Array.from(text);
  return (
    <span className={`inline-block ${className}`} aria-label={text}>
      {chars.map((char, idx) => (
        <motion.span
          key={`${char}-${idx}`}
          aria-hidden="true"
          className="inline-block"
          initial={{ opacity: 0, y: -22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{
            type: 'spring',
            stiffness: 320,
            damping: 18,
            delay: delay + idx * 0.024
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

// 14. Perspective Reveal – Text enters with a 3D perspective
export const PerspectiveRevealText: React.FC<BaseTextProps> = ({
  text,
  className = '',
  delay = 0
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <span className={className}>{text}</span>;

  return (
    <span className="inline-block" style={{ perspective: 1000 }}>
      <motion.span
        className={`inline-block ${className}`}
        initial={{ opacity: 0, rotateY: 16, rotateX: 12, scale: 0.92, y: 18 }}
        whileInView={{ opacity: 1, rotateY: 0, rotateX: 0, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.72, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {text}
      </motion.span>
    </span>
  );
};

// 15. Rotating Words – Different words rotate inside the same heading
interface RotatingWordsTextProps {
  words: string[];
  className?: string;
  intervalMs?: number;
}

export const RotatingWordsText: React.FC<RotatingWordsTextProps> = ({
  words,
  className = '',
  intervalMs = 2800
}) => {
  const prefersReduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReduced || words.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [words, intervalMs, prefersReduced]);

  if (prefersReduced) {
    return <span className={className}>{words[0]}</span>;
  }

  return (
    <span className="inline-flex overflow-hidden align-bottom" style={{ perspective: 600 }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          className={`inline-block ${className}`}
          initial={{ opacity: 0, y: 18, rotateX: -40 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: -18, rotateX: 40 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
