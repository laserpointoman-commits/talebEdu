import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 1 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

export const slideInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

export const slideInRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const hoverLift = {
  rest: { y: 0 },
  hover: { 
    y: -8,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  }
};

export const hoverGlow = {
  rest: { boxShadow: '0 4px 60px rgba(0, 0, 0, 0.08)' },
  hover: { 
    boxShadow: '0 8px 80px rgba(0, 127, 255, 0.3)',
    transition: { duration: 0.3 }
  }
};
