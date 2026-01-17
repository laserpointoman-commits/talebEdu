import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, PanInfo, useAnimation } from 'framer-motion';
import { Archive, Pin, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface SwipeableChatItemProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onArchive?: () => void;
  onPin?: () => void;
  isPinned?: boolean;
  canPin?: boolean;
  isArabic?: boolean;
}

export function SwipeableChatItem({
  children,
  onDelete,
  onArchive,
  onPin,
  isPinned = false,
  canPin = false,
  isArabic = false
}: SwipeableChatItemProps) {
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);
  const x = useMotionValue(0);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const leftActions = isArabic ? ['delete', 'archive'] : ['pin', 'archive'];
  const rightActions = isArabic ? ['pin'] : ['delete'];
  
  const SWIPE_THRESHOLD = 60;
  const ACTION_WIDTH = 70;

  const haptic = useCallback(async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available
    }
  }, []);

  const handleDragEnd = useCallback(async (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    // Use velocity for more natural feel
    const shouldReveal = Math.abs(offset) > SWIPE_THRESHOLD || Math.abs(velocity) > 500;
    
    if (shouldReveal) {
      await haptic();
      if (offset > 0 || velocity > 500) {
        setIsRevealed('left');
        await controls.start({ x: leftActions.length * ACTION_WIDTH }, { type: 'spring', stiffness: 500, damping: 30 });
      } else {
        setIsRevealed('right');
        await controls.start({ x: -rightActions.length * ACTION_WIDTH }, { type: 'spring', stiffness: 500, damping: 30 });
      }
    } else {
      setIsRevealed(null);
      await controls.start({ x: 0 }, { type: 'spring', stiffness: 500, damping: 30 });
    }
  }, [controls, haptic, leftActions.length, rightActions.length]);

  const handleActionClick = useCallback(async (action: string) => {
    await haptic();
    setIsRevealed(null);
    await controls.start({ x: 0 }, { type: 'spring', stiffness: 500, damping: 30 });
    
    // Small delay for visual feedback
    setTimeout(() => {
      switch (action) {
        case 'delete': onDelete?.(); break;
        case 'archive': onArchive?.(); break;
        case 'pin': if (canPin) onPin?.(); break;
      }
    }, 100);
  }, [controls, haptic, canPin, onDelete, onArchive, onPin]);

  const closeSwipe = useCallback(async () => {
    setIsRevealed(null);
    await controls.start({ x: 0 }, { type: 'spring', stiffness: 500, damping: 30 });
  }, [controls]);

  return (
    <div ref={containerRef} className="relative overflow-hidden touch-pan-y" onClick={isRevealed ? closeSwipe : undefined}>
      {/* Left Actions */}
      <div className="absolute inset-y-0 left-0 flex">
        {!isArabic && canPin && (
          <motion.button 
            onClick={() => handleActionClick('pin')} 
            className={cn(
              "w-[70px] flex flex-col items-center justify-center gap-1 text-white text-xs font-medium active:opacity-80",
              isPinned ? "bg-primary" : "bg-yellow-500"
            )}
            whileTap={{ scale: 0.95 }}
          >
            <Pin className="h-5 w-5" />
            {isPinned ? 'Unpin' : 'Pin'}
          </motion.button>
        )}
        <motion.button 
          onClick={() => handleActionClick('archive')} 
          className="w-[70px] flex flex-col items-center justify-center gap-1 bg-slate-500 text-white text-xs font-medium active:opacity-80"
          whileTap={{ scale: 0.95 }}
        >
          <Archive className="h-5 w-5" />
          {isArabic ? 'أرشفة' : 'Archive'}
        </motion.button>
        {isArabic && (
          <motion.button 
            onClick={() => handleActionClick('delete')} 
            className="w-[70px] flex flex-col items-center justify-center gap-1 bg-red-500 text-white text-xs font-medium active:opacity-80"
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 className="h-5 w-5" />
            حذف
          </motion.button>
        )}
      </div>

      {/* Right Actions */}
      <div className="absolute inset-y-0 right-0 flex">
        {isArabic && canPin && (
          <motion.button 
            onClick={() => handleActionClick('pin')} 
            className={cn(
              "w-[70px] flex flex-col items-center justify-center gap-1 text-white text-xs font-medium active:opacity-80",
              isPinned ? "bg-primary" : "bg-yellow-500"
            )}
            whileTap={{ scale: 0.95 }}
          >
            <Pin className="h-5 w-5" />
            {isPinned ? 'إلغاء' : 'تثبيت'}
          </motion.button>
        )}
        {!isArabic && (
          <motion.button 
            onClick={() => handleActionClick('delete')} 
            className="w-[70px] flex flex-col items-center justify-center gap-1 bg-red-500 text-white text-xs font-medium active:opacity-80"
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 className="h-5 w-5" />
            Delete
          </motion.button>
        )}
      </div>

      {/* Swipeable Content */}
      <motion.div 
        drag="x" 
        dragConstraints={{ left: -140, right: 140 }} 
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd} 
        animate={controls}
        style={{ x }} 
        className="relative bg-inherit z-10 will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}
