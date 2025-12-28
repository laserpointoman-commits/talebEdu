import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  colors: {
    bgTertiary: string;
    accent: string;
    textMuted: string;
  };
  userName?: string;
  isArabic?: boolean;
}

export function TypingIndicator({ colors, userName, isArabic = false }: TypingIndicatorProps) {
  const t = (en: string, ar: string) => isArabic ? ar : en;

  return (
    <div className="flex items-start gap-2 mb-2">
      <div
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
        style={{ backgroundColor: colors.bgTertiary }}
      >
        <span className="text-xs mr-1" style={{ color: colors.textMuted }}>
          {userName ? `${userName} ${t('is typing', 'يكتب')}` : t('Typing', 'يكتب')}
        </span>
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: colors.accent }}
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
