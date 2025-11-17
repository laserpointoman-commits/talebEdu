import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Package,
  ChefHat,
  Code,
  Receipt,
  CreditCard,
} from 'lucide-react';

interface QuickAction {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const quickActionItems: QuickAction[] = [
  {
    title: 'dashboard.students',
    href: '/dashboard/students',
    icon: GraduationCap,
    roles: ['admin', 'teacher'],
  },
  {
    title: 'dashboard.teachers',
    href: '/dashboard/teachers',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'dashboard.classes',
    href: '/dashboard/classes',
    icon: BookOpen,
    roles: ['admin', 'teacher'],
  },
  {
    title: 'dashboard.schedule',
    href: '/dashboard/schedule',
    icon: Calendar,
    roles: ['teacher', 'student', 'parent'],
  },
  {
    title: 'dashboard.examSchedule',
    href: '/dashboard/exams',
    icon: ClipboardList,
    roles: ['teacher', 'student', 'parent'],
  },
  {
    title: 'dashboard.homework',
    href: '/dashboard/homework',
    icon: FileText,
    roles: ['teacher', 'student', 'parent'],
  },
  {
    title: 'dashboard.grades',
    href: '/dashboard/grades',
    icon: Award,
    roles: ['teacher', 'student', 'parent'],
  },
  {
    title: 'dashboard.attendance',
    href: '/dashboard/nfc-attendance',
    icon: ClipboardList,
    roles: ['admin', 'teacher'],
  },
  {
    title: 'dashboard.tracking',
    href: '/dashboard/bus-tracking',
    icon: MapPin,
    roles: ['parent', 'driver', 'admin'],
  },
  {
    title: 'dashboard.transport',
    href: '/dashboard/transport',
    icon: Bus,
    roles: ['admin'],
  },
  {
    title: 'dashboard.finance',
    href: '/dashboard/finance',
    icon: DollarSign,
    roles: ['admin', 'parent', 'finance'],
  },
  {
    title: 'Fee Management',
    href: '/dashboard/admin/fees',
    icon: Receipt,
    roles: ['admin', 'finance'],
  },
  {
    title: 'Parent Finance',
    href: '/dashboard/parent-finance',
    icon: CreditCard,
    roles: ['parent'],
  },
  {
    title: 'Payroll',
    href: '/dashboard/payroll',
    icon: DollarSign,
    roles: ['admin', 'teacher', 'finance'],
  },
  {
    title: 'dashboard.wallet',
    href: '/dashboard/wallet',
    icon: Wallet,
    roles: ['parent', 'student', 'admin'],
  },
  {
    title: 'dashboard.store',
    href: '/dashboard/store',
    icon: Package,
    roles: ['admin', 'parent'],
  },
  {
    title: 'dashboard.kitchen',
    href: '/dashboard/kitchen',
    icon: ChefHat,
    roles: ['parent'],
  },
  {
    title: 'dashboard.canteen',
    href: '/dashboard/canteen',
    icon: ShoppingBag,
    roles: ['admin', 'parent', 'student'],
  },
  {
    title: 'dashboard.messages',
    href: '/dashboard/messages',
    icon: MessageSquare,
    roles: ['admin', 'teacher', 'parent'],
  },
  {
    title: 'dashboard.reports',
    href: '/dashboard/reports',
    icon: FileText,
    roles: ['admin', 'driver', 'finance'],
  },
  {
    title: 'NFC Management',
    href: '/dashboard/admin/nfc',
    icon: Code,
    roles: ['admin'],
  },
  {
    title: 'dashboard.settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin'],
  },
];

const colorClasses = [
  'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  'text-green-600 bg-green-100 dark:bg-green-900/20',
  'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
  'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
  'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
  'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
  'text-red-600 bg-red-100 dark:bg-red-900/20',
  'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20',
];

export function QuickActions() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const userRole = profile?.role || 'student';
  
  const filteredActions = quickActionItems
    .filter(item => item.roles.includes(userRole))
    .slice(0, 8); // Show max 8 quick actions

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('dashboard.quickActions')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                variant="outline"
                className="h-auto flex-col gap-2 p-4 hover:scale-105 transition-transform"
                onClick={() => navigate(action.href)}
              >
                <div className={`p-3 rounded-lg ${colorClasses[index % colorClasses.length]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs text-center">{t(action.title)}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
