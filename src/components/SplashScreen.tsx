import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out animation
    }, 700); // 700ms + 300ms fade = 1 second total

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.43, 0.13, 0.23, 0.96] 
            }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="relative">
              <div className="text-[120px] font-bold leading-none" style={{ color: '#007FFF' }}>
                t
              </div>
              <div className="absolute -inset-4 blur-2xl rounded-full" style={{ backgroundColor: 'rgba(0, 127, 255, 0.2)' }} />
            </div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl font-semibold text-foreground"
            >
              talebEdu
            </motion.h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="w-32 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}