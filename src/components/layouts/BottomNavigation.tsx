import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  Wallet,
  User,
  GraduationCap,
  Users,
  Bus,
  DollarSign,
  Calendar,
  MapPin,
  ShoppingBag,
} from 'lucide-react';

interface NavItem {
  title: string;
  titleAr: string;
  titleHi: string;
  href: string;
  icon: React.ElementType;
}

import { Home } from 'lucide-react';

const getNavItemsForRole = (role: string): { items: NavItem[], homeIndex: number } => {
  const roleSpecificItems: Record<string, NavItem[]> = {
    admin: [
      { title: 'Students', titleAr: 'الطلاب', titleHi: 'छात्र', href: '/dashboard/students', icon: GraduationCap },
      { title: 'Messenger', titleAr: 'المراسلة', titleHi: 'मैसेंजर', href: '/dashboard/messages', icon: MessageSquare },
      { title: 'Finance', titleAr: 'المالية', titleHi: 'वित्त', href: '/dashboard/finance', icon: DollarSign },
    ],
    teacher: [
      { title: 'Classes', titleAr: 'الفصول', titleHi: 'कक्षाएँ', href: '/dashboard/classes', icon: Users },
      { title: 'Schedule', titleAr: 'الجدول', titleHi: 'समय सारणी', href: '/dashboard/schedule', icon: Calendar },
      { title: 'Messages', titleAr: 'الرسائل', titleHi: 'संदेश', href: '/dashboard/messages', icon: MessageSquare },
    ],
    parent: [
      { title: 'Tracking', titleAr: 'التتبع', titleHi: 'ट्रैकिंग', href: '/dashboard/bus-tracking', icon: MapPin },
      { title: 'Wallet', titleAr: 'المحفظة', titleHi: 'वॉलेट', href: '/dashboard/wallet', icon: Wallet },
      { title: 'Messages', titleAr: 'الرسائل', titleHi: 'संदेश', href: '/dashboard/messages', icon: MessageSquare },
    ],
    student: [
      { title: 'Schedule', titleAr: 'الجدول', titleHi: 'समय सारणी', href: '/dashboard/schedule', icon: Calendar },
      { title: 'Wallet', titleAr: 'المحفظة', titleHi: 'वॉलेट', href: '/dashboard/wallet', icon: Wallet },
      { title: 'Canteen', titleAr: 'المقصف', titleHi: 'कैंटीन', href: '/dashboard/canteen', icon: ShoppingBag },
    ],
    driver: [
      { title: 'Tracking', titleAr: 'التتبع', titleHi: 'ट्रैकिंग', href: '/dashboard/bus-tracking', icon: MapPin },
      { title: 'Transport', titleAr: 'النقل', titleHi: 'परिवहन', href: '/dashboard/transport', icon: Bus },
      { title: 'Messages', titleAr: 'الرسائل', titleHi: 'संदेश', href: '/dashboard/messages', icon: MessageSquare },
    ],
    finance: [
      { title: 'Finance', titleAr: 'المالية', titleHi: 'वित्त', href: '/dashboard/finance', icon: DollarSign },
      { title: 'Fees', titleAr: 'الرسوم', titleHi: 'शुल्क', href: '/dashboard/admin/fees', icon: Wallet },
      { title: 'Messages', titleAr: 'الرسائل', titleHi: 'संदेश', href: '/dashboard/messages', icon: MessageSquare },
    ],
    developer: [
      { title: 'Students', titleAr: 'الطلاب', titleHi: 'छात्र', href: '/dashboard/students', icon: GraduationCap },
      { title: 'Finance', titleAr: 'المالية', titleHi: 'वित्त', href: '/dashboard/finance', icon: DollarSign },
      { title: 'Messages', titleAr: 'الرسائل', titleHi: 'संदेश', href: '/dashboard/messages', icon: MessageSquare },
    ],
  };

  const homeItem: NavItem = {
    title: 'Home',
    titleAr: 'الرئيسية',
    titleHi: 'होम',
    href: '/dashboard',
    icon: Home,
  };

  const profileItem: NavItem = {
    title: 'Profile',
    titleAr: 'الملف',
    titleHi: 'प्रोफ़ाइल',
    href: '/dashboard/profile',
    icon: User,
  };

  const sideItems = roleSpecificItems[role] || roleSpecificItems.student;
  
  // Split items: first half before home, second half after home
  const firstHalf = sideItems.slice(0, Math.ceil(sideItems.length / 2));
  const secondHalf = sideItems.slice(Math.ceil(sideItems.length / 2));
  
  const items = [...firstHalf, homeItem, ...secondHalf, profileItem];
  const homeIndex = firstHalf.length;
  
  return { items, homeIndex };
};

const getTitle = (item: NavItem, language: string): string => {
  if (language === 'ar') return item.titleAr;
  if (language === 'hi') return item.titleHi;
  return item.title;
};

export default function BottomNavigation() {
  const { profile } = useAuth();
  const { language, dir } = useLanguage();
  const location = useLocation();

  const effectiveRole = profile?.role === 'developer'
    ? sessionStorage.getItem('developerViewRole') || 'developer'
    : profile?.role || 'student';

  const { items: navItems, homeIndex } = getNavItemsForRole(effectiveRole);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      dir="ltr"
    >
      {/* Clean background */}
      <div className="absolute inset-0 bg-card border-t border-border shadow-lg" />
      
      {/* Navigation container */}
      <nav className="relative flex items-center justify-around px-1 py-1.5">
        {navItems.map((item, index) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const isHomeButton = index === homeIndex;
          
          if (isHomeButton) {
            // Special home button in the middle
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className="flex-1 flex justify-center"
              >
                <motion.div
                  className="relative flex flex-col items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  {/* Full blue circle home button */}
                  <motion.div
                    className={cn(
                      "relative -mt-6 flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 transition-all duration-200",
                      active && "ring-4 ring-primary/20"
                    )}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Icon 
                      className="h-6 w-6 text-primary-foreground" 
                      strokeWidth={2.5}
                    />
                  </motion.div>
                  
                  {/* Label */}
                  <span
                    className={cn(
                      "text-[10px] mt-1 font-medium transition-colors duration-200",
                      active 
                        ? "text-primary" 
                        : "text-muted-foreground"
                    )}
                  >
                    {getTitle(item, language)}
                  </span>
                </motion.div>
              </NavLink>
            );
          }
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className="flex-1 flex justify-center"
            >
              <motion.div
                className="relative flex flex-col items-center justify-center min-w-[56px] py-1.5"
                whileTap={{ scale: 0.9 }}
              >
                {/* Active indicator pill */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-0.5 w-6 h-0.5 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                
                {/* Icon container */}
                <div
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                    active 
                      ? "bg-primary/10" 
                      : "bg-transparent"
                  )}
                >
                  <Icon 
                    className={cn(
                      "transition-all duration-200",
                      active 
                        ? "h-[22px] w-[22px] text-primary" 
                        : "h-5 w-5 text-muted-foreground"
                    )} 
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </div>
                
                {/* Label */}
                <span
                  className={cn(
                    "text-[10px] mt-0.5 font-medium transition-colors duration-200",
                    active 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  )}
                >
                  {getTitle(item, language)}
                </span>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
