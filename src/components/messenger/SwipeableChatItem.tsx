import { useState, useRef } from 'react';
import { motion, useMotionValue, PanInfo } from 'framer-motion';
import { Archive, Pin, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const containerRef = useRef<HTMLDivElement>(null);
  
  const leftActions = isArabic ? ['delete', 'archive'] : ['pin', 'archive'];
  const rightActions = isArabic ? ['pin'] : ['delete'];
  
  const SWIPE_THRESHOLD = 80;
  const ACTION_WIDTH = 70;

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    
    if (Math.abs(offset) > SWIPE_THRESHOLD) {
      if (offset > 0) {
        setIsRevealed('left');
        x.set(leftActions.length * ACTION_WIDTH);
      } else {
        setIsRevealed('right');
        x.set(-rightActions.length * ACTION_WIDTH);
      }
    } else {
      setIsRevealed(null);
      x.set(0);
    }
  };

  const handleActionClick = (action: string) => {
    setIsRevealed(null);
    x.set(0);
    
    switch (action) {
      case 'delete': onDelete?.(); break;
      case 'archive': onArchive?.(); break;
      case 'pin': if (canPin) onPin?.(); break;
    }
  };

  const closeSwipe = () => {
    setIsRevealed(null);
    x.set(0);
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden" onClick={isRevealed ? closeSwipe : undefined}>
      {/* Left Actions */}
      <div className="absolute inset-y-0 left-0 flex">
        {!isArabic && canPin && (
          <button onClick={() => handleActionClick('pin')} className={cn("w-[70px] flex flex-col items-center justify-center gap-1 text-white text-xs font-medium", isPinned ? "bg-primary" : "bg-yellow-500")}>
            <Pin className="h-5 w-5" />
            {isPinned ? 'Unpin' : 'Pin'}
          </button>
        )}
        <button onClick={() => handleActionClick('archive')} className="w-[70px] flex flex-col items-center justify-center gap-1 bg-slate-500 text-white text-xs font-medium">
          <Archive className="h-5 w-5" />
          {isArabic ? 'أرشفة' : 'Archive'}
        </button>
        {isArabic && (
          <button onClick={() => handleActionClick('delete')} className="w-[70px] flex flex-col items-center justify-center gap-1 bg-red-500 text-white text-xs font-medium">
            <Trash2 className="h-5 w-5" />
            حذف
          </button>
        )}
      </div>

      {/* Right Actions */}
      <div className="absolute inset-y-0 right-0 flex">
        {isArabic && canPin && (
          <button onClick={() => handleActionClick('pin')} className={cn("w-[70px] flex flex-col items-center justify-center gap-1 text-white text-xs font-medium", isPinned ? "bg-primary" : "bg-yellow-500")}>
            <Pin className="h-5 w-5" />
            {isPinned ? 'إلغاء' : 'تثبيت'}
          </button>
        )}
        {!isArabic && (
          <button onClick={() => handleActionClick('delete')} className="w-[70px] flex flex-col items-center justify-center gap-1 bg-red-500 text-white text-xs font-medium">
            <Trash2 className="h-5 w-5" />
            Delete
          </button>
        )}
      </div>

      {/* Swipeable Content */}
      <motion.div drag="x" dragConstraints={{ left: -140, right: 140 }} dragElastic={0.1} onDragEnd={handleDragEnd} style={{ x }} className="relative bg-inherit z-10">
        {children}
      </motion.div>
    </div>
  );
}
