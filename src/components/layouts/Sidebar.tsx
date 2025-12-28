import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useFeatureVisibility } from '@/hooks/use-feature-visibility';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  DollarSign,
  Bus,
  ShoppingBag,
  MessageSquare,
  FileText,
  Settings,
  ClipboardList,
  Wallet,
  MapPin,
  Award,
  Home,
  Package,
  ChefHat,
  Code,
  ArrowLeft,
  Receipt,
  CreditCard,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    title: 'dashboard.overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'teacher', 'parent', 'student', 'driver', 'finance', 'developer'],
  },
  {
    title: 'dashboard.students',
    href: '/dashboard/students',
    icon: GraduationCap,
    roles: ['admin', 'teacher', 'developer'],
  },
  {
    title: 'dashboard.teachers',
    href: '/dashboard/teachers',
    icon: Users,
    roles: ['admin', 'developer'],
  },
  {
    title: 'dashboard.classes',
    href: '/dashboard/classes',
    icon: BookOpen,
    roles: ['admin', 'teacher', 'developer'],
  },
  {
    title: 'dashboard.schedule',
    href: '/dashboard/schedule',
    icon: Calendar,
    roles: ['teacher', 'student', 'parent', 'developer'],
  },
  {
    title: 'dashboard.examSchedule',
    href: '/dashboard/exams',
    icon: ClipboardList,
    roles: ['teacher', 'student', 'parent', 'developer'],
  },
  {
    title: 'dashboard.homework',
    href: '/dashboard/homework',
    icon: FileText,
    roles: ['teacher', 'student', 'parent', 'developer'],
  },
  {
    title: 'dashboard.grades',
    href: '/dashboard/grades',
    icon: Award,
    roles: ['teacher', 'student', 'parent', 'developer'],
  },
  {
    title: 'dashboard.attendance',
    href: '/dashboard/nfc-attendance',
    icon: ClipboardList,
    roles: ['admin', 'teacher', 'developer'],
  },
  {
    title: 'dashboard.tracking',
    href: '/dashboard/bus-tracking',
    icon: MapPin,
    roles: ['parent', 'driver', 'admin', 'developer'],
  },
  {
    title: 'dashboard.transport',
    href: '/dashboard/transport',
    icon: Bus,
    roles: ['admin', 'developer'],
  },
  {
    title: 'dashboard.finance',
    href: '/dashboard/finance',
    icon: DollarSign,
    roles: ['admin', 'parent', 'finance', 'developer'],
  },
  {
    title: 'dashboard.feeManagement',
    href: '/dashboard/admin/fees',
    icon: Receipt,
    roles: ['admin', 'finance', 'developer'],
  },
  {
    title: 'dashboard.parentFinance',
    href: '/dashboard/parent-finance',
    icon: CreditCard,
    roles: ['parent', 'developer'],
  },
  {
    title: 'dashboard.payroll',
    href: '/dashboard/payroll',
    icon: DollarSign,
    roles: ['admin', 'teacher', 'finance', 'developer'],
  },
  {
    title: 'dashboard.wallet',
    href: '/dashboard/wallet',
    icon: Wallet,
    roles: ['parent', 'student', 'admin', 'developer'],
  },
  {
    title: 'dashboard.store',
    href: '/dashboard/store',
    icon: Package,
    roles: ['admin', 'parent', 'developer'],
  },
  {
    title: 'dashboard.kitchen',
    href: '/dashboard/kitchen',
    icon: ChefHat,
    roles: ['parent', 'developer'],
  },
  {
    title: 'dashboard.canteen',
    href: '/dashboard/canteen',
    icon: ShoppingBag,
    roles: ['admin', 'parent', 'student', 'developer'],
  },
  {
    title: 'dashboard.messages',
    href: '/dashboard/messages',
    icon: MessageSquare,
    roles: ['admin', 'teacher', 'parent', 'developer'],
  },
  {
    title: 'dashboard.reports',
    href: '/dashboard/reports',
    icon: FileText,
    roles: ['admin', 'driver', 'finance', 'developer'],
  },
  {
    title: 'dashboard.userManagement',
    href: '/dashboard/admin/users',
    icon: Users,
    roles: ['admin', 'developer'], // Visible to admin and developer
  },
  {
    title: 'dashboard.nfcManagement',
    href: '/dashboard/admin/nfc',
    icon: Code,
    roles: ['admin', 'developer'],
  },
  {
    title: 'dashboard.settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin', 'developer'],
  },
];

interface SidebarProps {
  onItemClick?: () => void;
}

export default function Sidebar({ onItemClick }: SidebarProps = {}) {
  const { user, profile } = useAuth();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const { isFeatureVisible } = useFeatureVisibility();

  // For developers, determine which role they're viewing as
  const effectiveRole = profile?.role === 'developer' 
    ? sessionStorage.getItem('developerViewRole') || 'developer'
    : profile?.role;

  const filteredNavItems = navItems.filter(
    item => {
      if (!user || !profile) return false;
      
      // Developers can see all menu items, but filter based on test role
      if (profile.role === 'developer') {
        // If testing a role, show only that role's items
        if (effectiveRole !== 'developer') {
          return item.roles.includes(effectiveRole as any);
        }
        return true;
      }
      
      // Check if user has the required role
      if (!item.roles.includes(profile.role)) return false;
      
      // Map nav items to feature keys for visibility check
      const featureKeyMap: Record<string, string> = {
        '/dashboard/admin/users': 'user_management',
        '/dashboard/students': 'view_students',
        '/dashboard/teachers': 'view_teachers',
        '/dashboard/classes': 'manage_classes',
        '/dashboard/attendance': 'attendance_tracking',
        '/dashboard/homework': 'homework_management',
        '/dashboard/exams': 'exam_management',
        '/dashboard/grades': 'grade_management',
        '/dashboard/transport': 'transport_management',
        '/dashboard/canteen': 'canteen_management',
        '/dashboard/store': 'store_management',
        '/dashboard/finance': 'finance_module',
        '/dashboard/admin/fees': 'finance_module',
        '/dashboard/parent-finance': 'finance_module',
        '/dashboard/payroll': 'payroll_management',
        '/dashboard/messages': 'messaging_system',
        '/dashboard/reports': 'reports_analytics',
        '/dashboard/settings': 'settings',
      };
      
      // Check feature visibility if mapping exists
      const featureKey = featureKeyMap[item.href];
      if (featureKey) {
        return isFeatureVisible(featureKey);
      }
      
      // Default to showing if no specific feature key
      return true;
    }
  );

  const handleReturnToDeveloperDashboard = () => {
    sessionStorage.removeItem('developerViewRole');
    navigate('/dashboard');
    window.location.reload(); // Force reload to refresh the dashboard
  };

  return (
    <aside className="w-full bg-card border-r border-border/40 flex flex-col h-full overflow-hidden pt-[env(safe-area-inset-top)]">
      {/* Developer Controls - Show only when developer is viewing as another role */}
      {profile?.role === 'developer' && sessionStorage.getItem('developerViewRole') && (
        <div className="p-4 border-b bg-primary/5">
          <Button
            onClick={handleReturnToDeveloperDashboard}
            variant="outline"
            className="w-full gap-2 border-primary/20 hover:bg-primary/10 h-10 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">
              {t('returnToDeveloper') || 'Return to Developer Dashboard'}
            </span>
          </Button>
          <div className="mt-2 px-2 py-1 rounded-md bg-primary/10 text-xs text-center">
            <Code className="inline h-3 w-3 mr-1" />
            Viewing as: {sessionStorage.getItem('developerViewRole')}
          </div>
        </div>
      )}
      
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onItemClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-primary text-white shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="text-base">{t(item.title)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}