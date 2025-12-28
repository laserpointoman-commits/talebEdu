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
  href: string;
  icon: React.ElementType;
}

const getNavItemsForRole = (role: string): NavItem[] => {
  const baseItems: NavItem[] = [
    {
      title: 'Home',
      titleAr: 'الرئيسية',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
  ];

  const roleSpecificItems: Record<string, NavItem[]> = {
    admin: [
      { title: 'Students', titleAr: 'الطلاب', href: '/dashboard/students', icon: GraduationCap },
      { title: 'Finance', titleAr: 'المالية', href: '/dashboard/finance', icon: DollarSign },
      { title: 'Messages', titleAr: 'الرسائل', href: '/dashboard/messages', icon: MessageSquare },
    ],
    teacher: [
      { title: 'Classes', titleAr: 'الفصول', href: '/dashboard/classes', icon: Users },
      { title: 'Schedule', titleAr: 'الجدول', href: '/dashboard/schedule', icon: Calendar },
      { title: 'Messages', titleAr: 'الرسائل', href: '/dashboard/messages', icon: MessageSquare },
    ],
    parent: [
      { title: 'Tracking', titleAr: 'التتبع', href: '/dashboard/bus-tracking', icon: MapPin },
      { title: 'Wallet', titleAr: 'المحفظة', href: '/dashboard/wallet', icon: Wallet },
      { title: 'Messages', titleAr: 'الرسائل', href: '/dashboard/messages', icon: MessageSquare },
    ],
    student: [
      { title: 'Schedule', titleAr: 'الجدول', href: '/dashboard/schedule', icon: Calendar },
      { title: 'Wallet', titleAr: 'المحفظة', href: '/dashboard/wallet', icon: Wallet },
      { title: 'Canteen', titleAr: 'المقصف', href: '/dashboard/canteen', icon: ShoppingBag },
    ],
    driver: [
      { title: 'Tracking', titleAr: 'التتبع', href: '/dashboard/bus-tracking', icon: MapPin },
      { title: 'Transport', titleAr: 'النقل', href: '/dashboard/transport', icon: Bus },
      { title: 'Messages', titleAr: 'الرسائل', href: '/dashboard/messages', icon: MessageSquare },
    ],
    finance: [
      { title: 'Finance', titleAr: 'المالية', href: '/dashboard/finance', icon: DollarSign },
      { title: 'Fees', titleAr: 'الرسوم', href: '/dashboard/admin/fees', icon: Wallet },
      { title: 'Messages', titleAr: 'الرسائل', href: '/dashboard/messages', icon: MessageSquare },
    ],
    developer: [
      { title: 'Students', titleAr: 'الطلاب', href: '/dashboard/students', icon: GraduationCap },
      { title: 'Finance', titleAr: 'المالية', href: '/dashboard/finance', icon: DollarSign },
      { title: 'Messages', titleAr: 'الرسائل', href: '/dashboard/messages', icon: MessageSquare },
    ],
  };

  const profileItem: NavItem = {
    title: 'Profile',
    titleAr: 'الملف',
    href: '/dashboard/profile',
    icon: User,
  };

  return [...baseItems, ...(roleSpecificItems[role] || roleSpecificItems.student), profileItem];
};

export default function BottomNavigation() {
  const { profile } = useAuth();
  const { language, dir } = useLanguage();
  const location = useLocation();

  const effectiveRole = profile?.role === 'developer'
    ? sessionStorage.getItem('developerViewRole') || 'developer'
    : profile?.role || 'student';

  const navItems = getNavItemsForRole(effectiveRole);

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
      dir={dir}
    >
      {/* Background blur layer */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/40" />
      
      {/* Navigation container */}
      <nav className="relative flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          
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
                    className="absolute -top-1 w-8 h-1 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                
                {/* Icon container */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200",
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
                  {language === 'ar' ? item.titleAr : item.title}
                </span>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
