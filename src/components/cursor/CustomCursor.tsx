import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export const CustomCursor = () => {
  const [isPointer, setIsPointer] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const cursorX = useSpring(0, { damping: 30, stiffness: 200 });
  const cursorY = useSpring(0, { damping: 30, stiffness: 200 });
  
  const trailX = useSpring(0, { damping: 50, stiffness: 100 });
  const trailY = useSpring(0, { damping: 50, stiffness: 100 });

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      trailX.set(e.clientX);
      trailY.set(e.clientY);

      const target = e.target as HTMLElement;
      const isClickable = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.style.cursor === 'pointer';

      setIsPointer(!!isClickable);
    };

    const handleMouseEnter = () => setIsHidden(false);
    const handleMouseLeave = () => setIsHidden(true);

    window.addEventListener('mousemove', moveCursor);
    document.body.addEventListener('mouseenter', handleMouseEnter);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cursorX, cursorY, trailX, trailY]);

  return (
    <>
      {/* Blur Trail */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: trailX,
          y: trailY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isHidden ? 0 : 1,
        }}
      >
        <div 
          className={`rounded-full bg-white transition-all duration-300 ${
            isPointer ? 'w-12 h-12 blur-md' : 'w-16 h-16 blur-lg'
          }`}
          style={{ opacity: 0.3 }}
        />
      </motion.div>

      {/* Main Cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isHidden ? 0 : 1,
        }}
      >
        <div 
          className={`rounded-full bg-white transition-all duration-200 ${
            isPointer ? 'w-3 h-3' : 'w-2 h-2'
          }`}
        />
      </motion.div>

      {/* Outer Ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isHidden ? 0 : 1,
        }}
      >
        <div 
          className={`rounded-full border border-white transition-all duration-300 ${
            isPointer ? 'w-10 h-10 border-2' : 'w-8 h-8'
          }`}
          style={{ opacity: 0.5 }}
        />
      </motion.div>
    </>
  );
};
