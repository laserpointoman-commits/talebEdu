import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  colors: {
    bgTertiary: string;
    accent: string;
    textMuted: string;
    messageReceived?: string;
  };
  userName?: string;
  isArabic?: boolean;
}

export function TypingIndicator({ colors, userName, isArabic = false }: TypingIndicatorProps) {
  const t = (en: string, ar: string) => isArabic ? ar : en;

  return (
    <motion.div 
      className="flex items-start gap-2 mb-2"
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm"
        style={{ backgroundColor: colors.messageReceived || colors.bgTertiary }}
      >
        {userName && (
          <span className="text-xs mr-1.5 font-medium" style={{ color: colors.accent }}>
            {userName}
          </span>
        )}
        <div className="flex gap-1 items-center h-5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.accent }}
              animate={{
                y: [0, -6, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
