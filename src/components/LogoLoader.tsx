import { motion } from 'framer-motion';

interface LogoLoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: boolean;
  className?: string;
  showText?: boolean; // Alias for text prop for backwards compatibility
  fullScreen?: boolean; // When true, centers in viewport with backdrop
}

export default function LogoLoader({ size = 'medium', text = false, className, showText, fullScreen = false }: LogoLoaderProps) {
  // Use showText if provided, otherwise use text
  const shouldShowText = showText !== undefined ? showText : text;
  const sizes = {
    small: {
      logo: 'text-4xl',
      container: 'h-16 w-16',
      blur: 'blur-xl',
      text: 'text-sm'
    },
    medium: {
      logo: 'text-6xl',
      container: 'h-24 w-24',
      blur: 'blur-2xl',
      text: 'text-base'
    },
    large: {
      logo: 'text-8xl',
      container: 'h-32 w-32',
      blur: 'blur-3xl',
      text: 'text-lg'
    }
  };

  const currentSize = sizes[size];

  // If fullScreen, wrap in a fixed position container
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className={`flex flex-col items-center justify-center space-y-3 ${className || ''}`}>
          <LoaderContent currentSize={currentSize} shouldShowText={shouldShowText} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className || ''}`}>
      <LoaderContent currentSize={currentSize} shouldShowText={shouldShowText} />
    </div>
  );
}

function LoaderContent({ currentSize, shouldShowText }: { currentSize: any; shouldShowText: boolean }) {
  return (
    <>
      <div className="relative">
        {/* Animated glow background */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40 ${currentSize.blur} rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Secondary glow layer */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r from-accent/30 via-primary/50 to-accent/30 ${currentSize.blur} rounded-full`}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
            rotate: [360, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Main logo container */}
        <motion.div
          className={`relative ${currentSize.container} flex items-center justify-center`}
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* The "t" logo */}
          <motion.div
            className={`${currentSize.logo} font-bold text-primary relative z-10`}
            style={{
              textShadow: '0 0 30px rgba(var(--primary-rgb), 0.5)',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            t
          </motion.div>

          {/* Orbiting dots */}
          {[0, 120, 240].map((rotation, index) => (
            <motion.div
              key={index}
              className="absolute inset-0"
              animate={{
                rotate: [rotation, rotation + 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
                delay: index * 0.2,
              }}
            >
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"
                style={{
                  boxShadow: '0 0 10px rgba(var(--primary-rgb), 0.8)',
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.3,
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Pulse rings */}
        {[0, 1, 2].map((index) => (
          <motion.div
            key={`ring-${index}`}
            className={`absolute inset-0 border-2 border-primary/20 rounded-full`}
            initial={{ scale: 1, opacity: 0 }}
            animate={{
              scale: [1, 1.5, 2],
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.5,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      {shouldShowText && (
        <motion.div
          className={`${currentSize.text} font-medium text-muted-foreground flex items-center space-x-1`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span>Loading</span>
          <motion.div className="flex space-x-0.5">
            {[0, 0.2, 0.4].map((delay, i) => (
              <motion.span
                key={i}
                animate={{
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: delay,
                  ease: "easeInOut"
                }}
              >
                .
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      )}
    </>
  );
}