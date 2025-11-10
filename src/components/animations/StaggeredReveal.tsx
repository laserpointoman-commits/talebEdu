import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { ReactNode } from 'react';

interface StaggeredRevealProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const StaggeredReveal = ({ 
  children, 
  staggerDelay = 0.1,
  className = '' 
}: StaggeredRevealProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: true });

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      ref={ref as any}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={container}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const item = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  return (
    <motion.div 
      variants={item} 
      transition={{
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as any
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
