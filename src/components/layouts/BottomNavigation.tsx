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

// Define navigation items per role
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

  // Handle developer role testing
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
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      dir={dir}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50" />
      
      {/* Navigation items */}
      <div className="relative flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className="relative flex flex-col items-center justify-center min-w-[56px] py-1"
            >
              {/* Active indicator pill */}
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-1 w-12 h-1 rounded-full bg-primary"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              
              {/* Icon container */}
              <motion.div
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300",
                  active 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                whileTap={{ scale: 0.9 }}
                animate={active ? { y: -4 } : { y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon className={cn(
                  "transition-all duration-300",
                  active ? "h-6 w-6" : "h-5 w-5"
                )} />
              </motion.div>
              
              {/* Label */}
              <motion.span
                className={cn(
                  "text-[10px] font-medium mt-1 transition-colors duration-300",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                animate={active ? { opacity: 1 } : { opacity: 0.7 }}
              >
                {language === 'ar' ? item.titleAr : item.title}
              </motion.span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
