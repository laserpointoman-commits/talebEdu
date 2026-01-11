import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, GraduationCap, Bus, Shield, Loader2, Copy, Download, RefreshCw, Check } from 'lucide-react';

interface Account {
  email: string;
  password: string;
  role: string;
  name: string;
  nameAr: string;
  phone: string;
}

export default function AccountCredentials() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const defaultAccounts: Account[] = [
    // Admin
    { email: 'admin@talebschool.om', password: 'Admin@2024', role: 'admin', name: 'System Administrator', nameAr: 'مدير النظام', phone: '+968 91234567' },
    
    // Parents (20)
    ...Array.from({ length: 20 }, (_, i) => ({
      email: `parent${i + 1}@talebschool.om`,
      password: `Parent@${i + 1}23`,
      role: 'parent',
      name: `Parent ${i + 1}`,
      nameAr: `ولي الأمر ${i + 1}`,
      phone: `+968 9${1000000 + i}`
    })),
    
    // Teachers (10)
    ...Array.from({ length: 10 }, (_, i) => ({
      email: `teacher${i + 1}@talebschool.om`,
      password: `Teacher@${i + 1}23`,
      role: 'teacher',
      name: `Teacher ${i + 1}`,
      nameAr: `المعلم ${i + 1}`,
      phone: `+968 9${2000000 + i}`
    })),
    
    // Drivers (5)
    ...Array.from({ length: 5 }, (_, i) => ({
      email: `driver${i + 1}@talebschool.om`,
      password: `Driver@${i + 1}23`,
      role: 'driver',
      name: `Driver ${i + 1}`,
      nameAr: `السائق ${i + 1}`,
      phone: `+968 9${3000000 + i}`
    })),
    
    // Supervisors (5)
    ...Array.from({ length: 5 }, (_, i) => ({
      email: `supervisor${i + 1}@talebschool.om`,
      password: `Supervisor@${i + 1}23`,
      role: 'supervisor',
      name: `Supervisor ${i + 1}`,
      nameAr: `المشرف ${i + 1}`,
      phone: `+968 9${4000000 + i}`
    })),
  ];

  useEffect(() => {
    setAccounts(defaultAccounts);
  }, []);

  const createAllAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-omani-accounts');
      
      if (error) throw error;
      
      if (data.accounts) {
        setAccounts(data.accounts);
      }
      
      toast.success(isArabic ? 'تم إنشاء جميع الحسابات بنجاح!' : 'All accounts created successfully!');
    } catch (error) {
      console.error('Error creating accounts:', error);
      toast.error(isArabic ? 'خطأ في إنشاء الحسابات' : 'Error creating accounts');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadCredentials = () => {
    const groupedAccounts = {
      admin: accounts.filter(a => a.role === 'admin'),
      parent: accounts.filter(a => a.role === 'parent'),
      teacher: accounts.filter(a => a.role === 'teacher'),
      driver: accounts.filter(a => a.role === 'driver'),
      supervisor: accounts.filter(a => a.role === 'supervisor'),
    };

    let content = `TalebEdu School Management System
Account Credentials
Generated: ${new Date().toLocaleString()}
========================================

`;

    Object.entries(groupedAccounts).forEach(([role, accs]) => {
      content += `\n${'='.repeat(40)}\n`;
      content += `${role.toUpperCase()} ACCOUNTS (${accs.length})\n`;
      content += `${'='.repeat(40)}\n\n`;
      
      accs.forEach((acc, i) => {
        content += `${i + 1}. ${acc.name} (${acc.nameAr})\n`;
        content += `   Email: ${acc.email}\n`;
        content += `   Password: ${acc.password}\n`;
        content += `   Phone: ${acc.phone}\n\n`;
      });
    });

    content += `\n${'='.repeat(40)}\n`;
    content += `STUDENT INFO\n`;
    content += `${'='.repeat(40)}\n\n`;
    content += `Students do not have login accounts.\n`;
    content += `They are managed through parent accounts.\n`;
    content += `Total Students: 30 (linked to 20 parents)\n`;
    content += `- First 10 parents have 2 students each\n`;
    content += `- Last 10 parents have 1 student each\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TalebEdu_Account_Credentials.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'parent': return <Users className="h-4 w-4" />;
      case 'teacher': return <GraduationCap className="h-4 w-4" />;
      case 'driver': return <Bus className="h-4 w-4" />;
      case 'supervisor': return <Bus className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'parent': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'driver': return 'bg-orange-100 text-orange-800';
      case 'supervisor': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderAccountList = (role: string) => {
    const roleAccounts = accounts.filter(a => a.role === role);
    
    return (
      <div className="grid gap-3">
        {roleAccounts.map((acc, i) => (
          <Card key={acc.email} className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{acc.name}</span>
                    <Badge variant="outline" className={getRoleColor(acc.role)}>
                      {getRoleIcon(acc.role)}
                      <span className="ml-1 capitalize">{acc.role}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{acc.nameAr}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16">Email:</span>
                      <code className="bg-background px-2 py-0.5 rounded text-xs">{acc.email}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16">Password:</span>
                      <code className="bg-background px-2 py-0.5 rounded text-xs">{acc.password}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16">Phone:</span>
                      <span className="text-xs">{acc.phone}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(`${acc.email}\n${acc.password}`, i)}
                >
                  {copiedIndex === i ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl" dir={isArabic ? 'rtl' : 'ltr'}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {isArabic ? 'بيانات اعتماد الحسابات' : 'Account Credentials'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <Button onClick={createAllAccounts} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {isArabic ? 'إنشاء جميع الحسابات' : 'Create All Accounts'}
            </Button>
            <Button variant="outline" onClick={downloadCredentials}>
              <Download className="h-4 w-4 mr-2" />
              {isArabic ? 'تحميل البيانات' : 'Download Credentials'}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
            <div className="bg-red-50 p-2 rounded text-center">
              <div className="font-bold text-red-700">1</div>
              <div className="text-xs text-red-600">Admin</div>
            </div>
            <div className="bg-blue-50 p-2 rounded text-center">
              <div className="font-bold text-blue-700">20</div>
              <div className="text-xs text-blue-600">Parents</div>
            </div>
            <div className="bg-green-50 p-2 rounded text-center">
              <div className="font-bold text-green-700">10</div>
              <div className="text-xs text-green-600">Teachers</div>
            </div>
            <div className="bg-orange-50 p-2 rounded text-center">
              <div className="font-bold text-orange-700">5</div>
              <div className="text-xs text-orange-600">Drivers</div>
            </div>
            <div className="bg-purple-50 p-2 rounded text-center">
              <div className="font-bold text-purple-700">5</div>
              <div className="text-xs text-purple-600">Supervisors</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>{isArabic ? 'ملاحظة:' : 'Note:'}</strong>{' '}
              {isArabic 
                ? 'الطلاب ليس لديهم حسابات تسجيل دخول. يتم إدارتهم من خلال حسابات أولياء الأمور.'
                : 'Students do not have login accounts. They are managed through parent accounts.'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="admin" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="admin" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </TabsTrigger>
          <TabsTrigger value="parent" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Parents
          </TabsTrigger>
          <TabsTrigger value="teacher" className="text-xs">
            <GraduationCap className="h-3 w-3 mr-1" />
            Teachers
          </TabsTrigger>
          <TabsTrigger value="driver" className="text-xs">
            <Bus className="h-3 w-3 mr-1" />
            Drivers
          </TabsTrigger>
          <TabsTrigger value="supervisor" className="text-xs">
            <Bus className="h-3 w-3 mr-1" />
            Supervisors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="mt-4">
          {renderAccountList('admin')}
        </TabsContent>
        
        <TabsContent value="parent" className="mt-4">
          {renderAccountList('parent')}
        </TabsContent>
        
        <TabsContent value="teacher" className="mt-4">
          {renderAccountList('teacher')}
        </TabsContent>
        
        <TabsContent value="driver" className="mt-4">
          {renderAccountList('driver')}
        </TabsContent>
        
        <TabsContent value="supervisor" className="mt-4">
          {renderAccountList('supervisor')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
