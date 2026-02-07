import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import LogoLoader from './LogoLoader';

type TransitionType = 'fade' | 'slide' | 'scale' | 'slideUp';

const getTransitionType = (pathname: string): TransitionType => {
  if (pathname === '/' || pathname === '/auth') return 'fade';
  if (pathname.startsWith('/dashboard')) return 'slideUp';
  if (pathname.startsWith('/admin')) return 'slide';
  // Use fade (opacity-only) for standalone pages like /student/* to avoid
  // CSS transforms creating a containing block that breaks mobile touch scrolling.
  if (pathname.startsWith('/student')) return 'fade';
  return 'scale';
};

const transitionVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as any }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as any }
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as any }
  }
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isPageLoading, setPageLoading } = useLoading();
  const [showLoader, setShowLoader] = useState(false);

  // Android WebView: transformed ancestors (translate/scale) can break nested scrolling.
  // We disable route motion on native Android to keep scrolling reliable.
  const isNativeAndroid =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('native-android');

  const transitionType = getTransitionType(location.pathname);
  const variant = transitionVariants[transitionType];

  // Standalone pages (e.g. /student/*) manage their own h-[100dvh] scroll
  // container. Wrapping them in a motion.div risks adding will-change /
  // transform styles that create a containing block and break mobile touch
  // scrolling. Skip the animation wrapper for these routes entirely.
  const isStandalonePage = location.pathname.startsWith('/student');

  useEffect(() => {
    if (isStandalonePage) return; // no loader flash for standalone pages
    setPageLoading(true);
    setShowLoader(true);

    const timer = setTimeout(() => {
      setPageLoading(false);
      setShowLoader(false);
    }, 400);

    return () => {
      clearTimeout(timer);
      setPageLoading(false);
    };
  }, [location.pathname, setPageLoading, isStandalonePage]);

  if (isNativeAndroid || isStandalonePage) {
    return <div className="min-h-[100dvh]">{children}</div>;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showLoader && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <LogoLoader size="medium" text={false} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={variant.initial}
          animate={variant.animate}
          exit={variant.exit}
          transition={variant.transition}
          className="min-h-[100dvh]"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
