import { motion } from 'framer-motion';
import { MessageCircle, Users, Phone, UserCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type MessengerTab = 'chats' | 'groups' | 'calls' | 'contacts' | 'settings';

interface MessengerBottomNavProps {
  activeTab: MessengerTab;
  onTabChange: (tab: MessengerTab) => void;
  unreadCount: number;
  isArabic?: boolean;
}

export function MessengerBottomNav({ 
  activeTab, 
  onTabChange, 
  unreadCount,
  isArabic 
}: MessengerBottomNavProps) {
  const tabs = [
    { id: 'chats' as const, icon: MessageCircle, label: isArabic ? 'المحادثات' : 'Chats', badge: unreadCount },
    { id: 'groups' as const, icon: Users, label: isArabic ? 'المجموعات' : 'Groups' },
    { id: 'contacts' as const, icon: UserCircle, label: isArabic ? 'جهات الاتصال' : 'Contacts' },
    { id: 'calls' as const, icon: Phone, label: isArabic ? 'المكالمات' : 'Calls' },
    { id: 'settings' as const, icon: Settings, label: isArabic ? 'الإعدادات' : 'Settings' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 shrink-0 z-[110] bg-sky-100"
      style={{
        touchAction: 'none',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label={isArabic ? 'تنقل المراسلة' : 'Messenger navigation'}
    >
      {/* Light blue background */}
      <div
        className="absolute inset-0 bg-sky-100"
      />

      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-sky-200" />

      {/* Active tab soft glow */}
      <motion.div
        className="absolute top-0 h-full pointer-events-none"
        animate={{
          left: `${tabs.findIndex((t) => t.id === activeTab) * 20}%`,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{ width: '20%' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 blur-xl" />
        </div>
      </motion.div>

      <div className="relative flex items-stretch justify-around h-14">
        {tabs.map(({ id, icon: Icon, label, badge }) => {
          const isActive = activeTab === id;

          return (
            <motion.button
              key={id}
              className={cn(
                'flex-1 flex flex-col items-center justify-center relative',
                'transition-colors duration-200'
              )}
              onClick={() => onTabChange(id)}
              whileTap={{ scale: 0.92 }}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icon */}
              <motion.div
                className="relative"
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="navIconGlow"
                    className="absolute -inset-2.5 rounded-full bg-primary/10 blur-md"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <Icon
                  className={cn(
                    'h-5 w-5 relative z-10 transition-all duration-200',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                {/* Badge */}
                {badge !== undefined && badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 z-20"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-primary blur-sm opacity-50" />
                      <div className="relative h-[18px] min-w-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground shadow-glow-sm">
                        {badge > 99 ? '99+' : badge}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Label */}
              <motion.span
                className={cn(
                  'text-[10px] font-medium mt-0.5 transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
                animate={{ opacity: isActive ? 1 : 0.8 }}
              >
                {label}
              </motion.span>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="activeNavDot"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary shadow-glow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
