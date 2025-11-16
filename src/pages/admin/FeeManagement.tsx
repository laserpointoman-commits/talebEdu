import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FeeStructureManager from '@/components/finance/FeeStructureManager';
import StudentFeeAssignment from '@/components/finance/StudentFeeAssignment';
import PaymentTrackingTable from '@/components/finance/PaymentTrackingTable';
import InstallmentPlansManager from '@/components/finance/InstallmentPlansManager';
import { DollarSign, Users, Calendar, FileText } from 'lucide-react';

export default function FeeManagement() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('structures');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {language === 'en' ? 'Fee Management' : 'إدارة الرسوم'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'en' 
              ? 'Manage fee structures, assign fees to students, and track payments' 
              : 'إدارة هياكل الرسوم، وتعيين الرسوم للطلاب، وتتبع المدفوعات'}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="structures" className="gap-2">
            <FileText className="h-4 w-4" />
            {language === 'en' ? 'Fee Structures' : 'هياكل الرسوم'}
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <Users className="h-4 w-4" />
            {language === 'en' ? 'Student Fees' : 'رسوم الطلاب'}
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <DollarSign className="h-4 w-4" />
            {language === 'en' ? 'Payment Tracking' : 'تتبع المدفوعات'}
          </TabsTrigger>
          <TabsTrigger value="installments" className="gap-2">
            <Calendar className="h-4 w-4" />
            {language === 'en' ? 'Installment Plans' : 'خطط التقسيط'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structures">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'en' ? 'Fee Structure Templates' : 'قوالب هياكل الرسوم'}
              </CardTitle>
              <CardDescription>
                {language === 'en'
                  ? 'Create and manage fee structure templates for different grades and academic years'
                  : 'إنشاء وإدارة قوالب هياكل الرسوم لمختلف الصفوف والسنوات الدراسية'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeeStructureManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'en' ? 'Assign Fees to Students' : 'تعيين الرسوم للطلاب'}
              </CardTitle>
              <CardDescription>
                {language === 'en'
                  ? 'Assign fees to individual students or in bulk, apply discounts and set due dates'
                  : 'تعيين الرسوم للطلاب بشكل فردي أو جماعي، وتطبيق الخصومات وتحديد تواريخ الاستحقاق'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentFeeAssignment />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'en' ? 'Payment Tracking' : 'تتبع المدفوعات'}
              </CardTitle>
              <CardDescription>
                {language === 'en'
                  ? 'View and manage all student payments, export reports, and send reminders'
                  : 'عرض وإدارة جميع مدفوعات الطلاب، وتصدير التقارير، وإرسال التذكيرات'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentTrackingTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installments">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'en' ? 'Installment Plans' : 'خطط التقسيط'}
              </CardTitle>
              <CardDescription>
                {language === 'en'
                  ? 'Create and manage payment schedules for student fees'
                  : 'إنشاء وإدارة جداول الدفع لرسوم الطلاب'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InstallmentPlansManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
