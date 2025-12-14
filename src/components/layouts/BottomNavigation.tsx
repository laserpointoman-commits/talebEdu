import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
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
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden flex justify-center pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      dir={dir}
    >
      {/* Floating Navigation Pill */}
      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="pointer-events-auto mx-4 mb-2"
      >
        {/* Outer glow */}
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110 opacity-50" />
        
        {/* Main container */}
        <div className="relative flex items-center gap-1 px-3 py-2 rounded-[28px] bg-card/95 backdrop-blur-2xl border border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]">
          {navItems.map((item, index) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className="relative"
              >
                <motion.div
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300",
                    active && "bg-primary"
                  )}
                  whileTap={{ scale: 0.92 }}
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  {/* Active glow effect */}
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 bg-primary rounded-full blur-md opacity-40"
                        layoutId="navGlow"
                      />
                    )}
                  </AnimatePresence>
                  
                  {/* Icon */}
                  <Icon 
                    className={cn(
                      "relative z-10 transition-all duration-300",
                      active 
                        ? "h-[22px] w-[22px] text-primary-foreground" 
                        : "h-5 w-5 text-muted-foreground"
                    )} 
                    strokeWidth={active ? 2.5 : 2}
                  />
                  
                  {/* Label - only show when active */}
                  <AnimatePresence mode="wait">
                    {active && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 text-sm font-semibold text-primary-foreground whitespace-nowrap overflow-hidden"
                      >
                        {language === 'ar' ? item.titleAr : item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </NavLink>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}
