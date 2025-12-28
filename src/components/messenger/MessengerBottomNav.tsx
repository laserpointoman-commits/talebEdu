import { motion } from 'framer-motion';
import { MessageCircle, Users, Phone, Search, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type MessengerTab = 'chats' | 'groups' | 'calls' | 'search' | 'settings';

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
    { id: 'calls' as const, icon: Phone, label: isArabic ? 'المكالمات' : 'Calls' },
    { id: 'search' as const, icon: Search, label: isArabic ? 'البحث' : 'Search' },
    { id: 'settings' as const, icon: Settings, label: isArabic ? 'الإعدادات' : 'Settings' },
  ];

  return (
    <nav 
      className="relative shrink-0 overflow-hidden"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1014] via-[#0f1a20]/95 to-[#0f1a20]/85 backdrop-blur-xl" />
      
      {/* Top border glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      
      {/* Active tab glow background */}
      <motion.div 
        className="absolute top-0 h-full pointer-events-none"
        animate={{
          left: `${tabs.findIndex(t => t.id === activeTab) * 20}%`,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{ width: '20%' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 blur-xl" />
        </div>
      </motion.div>

      <div className="relative flex items-stretch justify-around py-1.5">
        {tabs.map(({ id, icon: Icon, label, badge }) => {
          const isActive = activeTab === id;
          
          return (
            <motion.button
              key={id}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 relative",
                "transition-colors duration-200"
              )}
              onClick={() => onTabChange(id)}
              whileTap={{ scale: 0.92 }}
            >
              {/* Icon container with glow */}
              <motion.div 
                className="relative"
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {/* Active glow ring */}
                {isActive && (
                  <motion.div
                    layoutId="navIconGlow"
                    className="absolute -inset-2.5 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)'
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                
                <Icon 
                  className={cn(
                    "h-[22px] w-[22px] relative z-10 transition-all duration-200",
                    isActive ? "text-emerald-400" : "text-slate-400"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                
                {/* Badge */}
                {badge !== undefined && badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 z-20"
                  >
                    <div className="relative">
                      {/* Badge glow */}
                      <div className="absolute inset-0 rounded-full bg-emerald-400 blur-sm opacity-60" />
                      <div 
                        className="relative h-[18px] min-w-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold bg-gradient-to-br from-emerald-400 to-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                      >
                        {badge > 99 ? '99+' : badge}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
              
              {/* Label */}
              <motion.span 
                className={cn(
                  "text-[10px] font-medium mt-1 transition-colors duration-200",
                  isActive ? "text-emerald-400" : "text-slate-500"
                )}
                animate={{
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                {label}
              </motion.span>
              
              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="activeNavDot"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-emerald-400"
                  style={{
                    boxShadow: '0 0 8px 2px rgba(16, 185, 129, 0.5)'
                  }}
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
