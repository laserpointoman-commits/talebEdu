import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, 
  MailPlus, 
  Bus, 
  Settings, 
  Shield,
  Users,
  Wallet,
  GraduationCap
} from 'lucide-react';

export function QuickActions() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const actions = [
    {
      icon: UserPlus,
      label: language === 'ar' ? 'إضافة طالب' : 'Add Student',
      onClick: () => navigate('/dashboard/admin/students'),
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    },
    {
      icon: MailPlus,
      label: language === 'ar' ? 'دعوة ولي أمر' : 'Invite Parent',
      onClick: () => navigate('/dashboard/admin/parent-invitations'),
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20'
    },
    {
      icon: Users,
      label: language === 'ar' ? 'إدارة المستخدمين' : 'User Management',
      onClick: () => navigate('/dashboard/admin/users'),
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
    },
    {
      icon: Bus,
      label: language === 'ar' ? 'إدارة الحافلات' : 'Manage Buses',
      onClick: () => navigate('/dashboard/admin/buses'),
      color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
    },
    {
      icon: Wallet,
      label: language === 'ar' ? 'المالية' : 'Finance',
      onClick: () => navigate('/dashboard/finance'),
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20'
    },
    {
      icon: Shield,
      label: language === 'ar' ? 'رؤية الميزات' : 'Feature Visibility',
      onClick: () => navigate('/dashboard/admin/features'),
      color: 'text-red-600 bg-red-100 dark:bg-red-900/20'
    },
    {
      icon: GraduationCap,
      label: language === 'ar' ? 'إدارة الفصول' : 'Class Management',
      onClick: () => navigate('/dashboard/classes'),
      color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20'
    },
    {
      icon: Settings,
      label: language === 'ar' ? 'الإعدادات' : 'Settings',
      onClick: () => navigate('/dashboard/settings'),
      color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto flex-col gap-2 p-4 hover:scale-105 transition-transform"
                onClick={action.onClick}
              >
                <div className={`p-3 rounded-lg ${action.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs text-center">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
