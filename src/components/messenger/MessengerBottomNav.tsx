import { motion } from 'framer-motion';
import { MessageCircle, Users, Phone, Search, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WHATSAPP_COLORS } from './WhatsAppTheme';

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
      className="flex items-center justify-around shrink-0 border-t"
      style={{ 
        backgroundColor: WHATSAPP_COLORS.bgSecondary, 
        borderColor: WHATSAPP_COLORS.divider,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {tabs.map(({ id, icon: Icon, label, badge }) => (
        <button
          key={id}
          className="flex-1 flex flex-col items-center justify-center py-2 relative"
          onClick={() => onTabChange(id)}
        >
          <motion.div 
            className="relative p-2"
            whileTap={{ scale: 0.9 }}
          >
            <Icon 
              className="h-6 w-6 transition-colors" 
              style={{ 
                color: activeTab === id ? WHATSAPP_COLORS.accent : WHATSAPP_COLORS.textMuted 
              }}
              strokeWidth={activeTab === id ? 2.5 : 2}
            />
            {badge && badge > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full flex items-center justify-center text-[10px] px-1.5 font-semibold"
                style={{ backgroundColor: WHATSAPP_COLORS.accentLight }}
              >
                {badge > 99 ? '99+' : badge}
              </Badge>
            )}
          </motion.div>
          <span 
            className="text-[10px] font-medium mt-0.5 transition-colors"
            style={{ 
              color: activeTab === id ? WHATSAPP_COLORS.accent : WHATSAPP_COLORS.textMuted 
            }}
          >
            {label}
          </span>
          {activeTab === id && (
            <motion.div
              layoutId="messengerActiveTab"
              className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full"
              style={{ backgroundColor: WHATSAPP_COLORS.accent }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
