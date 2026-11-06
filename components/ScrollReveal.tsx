'use client';

import { ReactNode } from 'react';
import { motion, MotionProps } from 'framer-motion';

export interface ScrollRevealProps extends MotionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  variant?: 'fade-up' | 'zoom-in' | 'scale';
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  duration = 0.65,
  variant = 'fade-up',
  ...rest
}: ScrollRevealProps) {
  const initialVariants = {
    'fade-up': { opacity: 0, y: 30 },
    'zoom-in': { opacity: 0, scale: 0.9 },
    'scale': { opacity: 0, scale: 0.93, y: 15 },
  };

  const inViewVariants = {
    'fade-up': { opacity: 1, y: 0 },
    'zoom-in': { opacity: 1, scale: 1 },
    'scale': { opacity: 1, scale: 1, y: 0 },
  };

  return (
    <motion.div
      initial={initialVariants[variant]}
      whileInView={inViewVariants[variant]}
      viewport={{ once: true, margin: '-30px' }}
      transition={{
        duration,
        delay: delay / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export default ScrollReveal;
