import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Globe, Download, Smartphone, Shield, Wallet, Bus, UtensilsCrossed, GraduationCap, Users, BarChart, Bell, Clock, MapPin, CreditCard, CheckCircle, BookOpen, Calendar, MessageSquare, FileText, Mail, UserPlus, ClipboardCheck, LogIn, Home, Settings, Plus, Edit, Trash, Eye, Search, Filter, ArrowRight, UserCheck, DollarSign, Receipt, TrendingUp, FileSpreadsheet, Package, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import logo from '@/assets/talebedu-logo-hq.png';
import screenshotNfc from '@/assets/presentation/screenshot-nfc.jpg';
import screenshotBus from '@/assets/presentation/screenshot-bus.jpg';
import screenshotWallet from '@/assets/presentation/screenshot-wallet.jpg';
import screenshotCanteen from '@/assets/presentation/screenshot-canteen.jpg';
import screenshotGrades from '@/assets/presentation/screenshot-grades.jpg';
import screenshotFinance from '@/assets/presentation/screenshot-finance.jpg';
import screenshotNotifications from '@/assets/presentation/screenshot-notifications.jpg';

const PresentationFull = () => {
  const { language, setLanguage } = useLanguage();
  const isArabic = language === 'ar';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background print:bg-white" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Control Bar */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 print:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setLanguage(isArabic ? 'en' : 'ar')}
        >
          <Globe className="h-4 w-4" />
        </Button>
        <Button onClick={handlePrint}>
          <Download className="h-4 w-4 mr-2" />
          {isArabic ? 'تحميل PDF' : 'Download PDF'}
        </Button>
      </div>

      {/* Cover Page */}
      <section className="min-h-screen flex flex-col items-center justify-center p-8 print:break-after-page">
        <div className="text-center space-y-8">
          <img src={logo} alt="TalebEdu Logo" className="w-48 h-48 mx-auto object-contain" />
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
            {isArabic ? 'منصة طالب المدرسية' : 'TalebEdu Platform'}
          </h1>
          <p className="text-2xl text-muted-foreground max-w-3xl mx-auto">
            {isArabic 
              ? 'دليل شامل - جميع الأدوار والوظائف'
              : 'Complete Guide - All Roles & Features'}
          </p>
          <div className="mt-12 space-y-4 text-lg text-muted-foreground">
            <p>{isArabic ? 'إصدار 2025' : '2025 Edition'}</p>
            <p className="text-blue-600 font-semibold" dir="ltr">+966 53 445 5688</p>
          </div>
        </div>
      </section>

      {/* Parent Registration Flow */}
      <section className="min-h-screen p-8 print:break-after-page">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'تسجيل ولي الأمر - خطوة بخطوة' : 'Parent Registration - Step by Step'}
        </h2>
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="p-6 break-inside-avoid">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">1</div>
              <h3 className="text-2xl font-semibold">{isArabic ? 'استلام رابط الدعوة' : 'Receive Invitation Link'}</h3>
            </div>
            <div className="space-y-4">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {isArabic
                  ? 'تقوم إدارة المدرسة بإرسال رابط دعوة فريد عبر البريد الإلكتروني أو رسالة نصية.'
                  : 'School administration sends a unique invitation link via email or SMS.'}
              </p>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600 mb-2" />
                <p className="text-sm font-mono break-all">https://talebedu.app/parent-registration?token=abc123xyz</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 break-inside-avoid">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">2</div>
              <h3 className="text-2xl font-semibold">{isArabic ? 'إنشاء الحساب' : 'Create Account'}</h3>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: UserCheck, text: isArabic ? 'الاسم الكامل' : 'Full Name' },
                  { icon: Mail, text: isArabic ? 'البريد الإلكتروني' : 'Email' },
                  { icon: Smartphone, text: isArabic ? 'رقم الجوال' : 'Phone Number' },
                  { icon: Shield, text: isArabic ? 'كلمة المرور' : 'Password' },
                ].map((field, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <field.icon className="h-5 w-5 text-blue-600" />
                    <span>{field.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6 break-inside-avoid">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">3</div>
              <h3 className="text-2xl font-semibold">{isArabic ? 'تسجيل بيانات الطالب' : 'Register Student Data'}</h3>
            </div>
            <div className="space-y-3">
              {[
                isArabic ? 'الاسم الكامل بالعربي والإنجليزي' : 'Full name in Arabic and English',
                isArabic ? 'الصف والشعبة' : 'Grade and Section',
                isArabic ? 'تاريخ الميلاد' : 'Date of Birth',
                isArabic ? 'معلومات الحساسية الغذائية' : 'Food Allergy Information',
                isArabic ? 'رقم الطوارئ' : 'Emergency Contact',
                isArabic ? 'صورة شخصية' : 'Profile Photo',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-lg">{item}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 break-inside-avoid">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">4</div>
              <h3 className="text-2xl font-semibold">{isArabic ? 'انتظار الموافقة' : 'Wait for Approval'}</h3>
            </div>
            <div className="p-4 bg-yellow-100 dark:bg-yellow-950 rounded-lg text-center">
              <Clock className="h-12 w-12 mx-auto mb-2 text-yellow-600" />
              <p className="text-lg font-semibold">{isArabic ? 'قيد المراجعة...' : 'Under Review...'}</p>
            </div>
          </Card>

          <Card className="p-6 break-inside-avoid">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg">5</div>
              <h3 className="text-2xl font-semibold">{isArabic ? 'البدء' : 'Start Using'}</h3>
            </div>
            <div className="p-6 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
              <p className="text-lg font-semibold text-center text-green-700 dark:text-green-400">
                {isArabic ? '✓ تمت الموافقة' : '✓ Approved'}
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Attendance with Screenshot */}
      <section className="min-h-screen p-8 print:break-after-page">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'متابعة الحضور' : 'Attendance Tracking'}
        </h2>
        <div className="max-w-5xl mx-auto">
          <Card className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">
                  {isArabic ? 'تسجيل فوري بتقنية NFC' : 'Instant NFC Registration'}
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {isArabic
                    ? 'يستخدم الطلاب بطاقات NFC للتسجيل السريع عند دخول المدرسة. إشعار فوري لولي الأمر.'
                    : 'Students use NFC cards for quick check-in when entering school. Instant parent notification.'}
                </p>
                <div className="space-y-3">
                  {[
                    { icon: CheckCircle, text: isArabic ? 'تسجيل أقل من ثانية' : 'Registration in less than 1 second' },
                    { icon: Bell, text: isArabic ? 'إشعار فوري للوالدين' : 'Instant parent notification' },
                    { icon: Calendar, text: isArabic ? 'سجل كامل للحضور' : 'Complete attendance log' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <item.icon className="h-5 w-5 text-blue-600" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src={screenshotNfc} 
                  alt={isArabic ? 'شاشة الحضور' : 'Attendance Screen'} 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Bus Tracking with Screenshot */}
      <section className="min-h-screen p-8 print:break-after-page">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'تتبع الحافلة المدرسية' : 'School Bus Tracking'}
        </h2>
        <div className="max-w-5xl mx-auto">
          <Card className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">
                  {isArabic ? 'تتبع مباشر بنظام GPS' : 'Live GPS Tracking'}
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {isArabic
                    ? 'متابعة موقع الحافلة في الوقت الفعلي ومعرفة الوقت المتوقع للوصول.'
                    : 'Track bus location in real-time and know expected arrival time.'}
                </p>
                <div className="space-y-3">
                  {[
                    { icon: MapPin, text: isArabic ? 'خريطة مباشرة' : 'Live map' },
                    { icon: Clock, text: isArabic ? 'وقت الوصول المتوقع' : 'Expected arrival time' },
                    { icon: Bell, text: isArabic ? 'إشعارات الركوب والنزول' : 'Boarding/exit notifications' },
                    { icon: Users, text: isArabic ? 'معلومات السائق' : 'Driver information' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <item.icon className="h-5 w-5 text-orange-600" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src={screenshotBus} 
                  alt={isArabic ? 'شاشة الحافلة' : 'Bus Screen'} 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Digital Wallet with Screenshot */}
      <section className="min-h-screen p-8 print:break-after-page">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'المحفظة الرقمية' : 'Digital Wallet'}
        </h2>
        <div className="max-w-5xl mx-auto">
          <Card className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">
                  {isArabic ? 'إدارة مالية آمنة' : 'Secure Financial Management'}
                </h3>
                <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white mb-4">
                  <p className="text-sm opacity-90">{isArabic ? 'الرصيد الحالي' : 'Current Balance'}</p>
                  <p className="text-4xl font-bold">250.00 {isArabic ? 'ريال' : 'SAR'}</p>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Plus, text: isArabic ? 'تعبئة فورية' : 'Instant top-up' },
                    { icon: Eye, text: isArabic ? 'سجل معاملات كامل' : 'Complete transaction history' },
                    { icon: ArrowRight, text: isArabic ? 'تحويل بين الطلاب' : 'Transfer between students' },
                    { icon: AlertTriangle, text: isArabic ? 'تنبيهات الرصيد المنخفض' : 'Low balance alerts' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <item.icon className="h-5 w-5 text-green-600" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src={screenshotWallet} 
                  alt={isArabic ? 'شاشة المحفظة' : 'Wallet Screen'} 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Canteen Management with Screenshot */}
      <section className="min-h-screen p-8 print:break-after-page">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'إدارة المقصف' : 'Canteen Management'}
        </h2>
        <div className="max-w-5xl mx-auto">
          <Card className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">
                  {isArabic ? 'تحكم كامل في المصروف' : 'Full Spending Control'}
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {isArabic
                    ? 'تحديد الحد اليومي للمصروف والمنتجات المسموحة ومتابعة جميع المشتريات.'
                    : 'Set daily spending limit, allowed products, and track all purchases.'}
                </p>
                <div className="space-y-3">
                  {[
                    { icon: DollarSign, text: isArabic ? 'حد يومي للمصروف' : 'Daily spending limit' },
                    { icon: UtensilsCrossed, text: isArabic ? 'تحديد المنتجات المسموحة' : 'Set allowed products' },
                    { icon: AlertTriangle, text: isArabic ? 'معلومات الحساسية' : 'Allergy information' },
                    { icon: Eye, text: isArabic ? 'تقارير المشتريات' : 'Purchase reports' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <item.icon className="h-5 w-5 text-yellow-600" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src={screenshotCanteen} 
                  alt={isArabic ? 'شاشة المقصف' : 'Canteen Screen'} 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Grades with Screenshot */}
      <section className="min-h-screen p-8 print:break-after-page">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'متابعة الدرجات' : 'Grades Tracking'}
        </h2>
        <div className="max-w-5xl mx-auto">
          <Card className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">
                  {isArabic ? 'الأداء الأكاديمي' : 'Academic Performance'}
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {isArabic
                    ? 'متابعة الدرجات في جميع المواد، الواجبات المنزلية، والاختبارات.'
                    : 'Track grades in all subjects, homework, and exams.'}
                </p>
                <div className="space-y-3">
                  {[
                    { icon: BookOpen, text: isArabic ? 'درجات جميع المواد' : 'All subject grades' },
                    { icon: FileText, text: isArabic ? 'متابعة الواجبات' : 'Homework tracking' },
                    { icon: Calendar, text: isArabic ? 'جدول الاختبارات' : 'Exam schedule' },
                    { icon: TrendingUp, text: isArabic ? 'تقارير الأداء' : 'Performance reports' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <item.icon className="h-5 w-5 text-purple-600" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src={screenshotGrades} 
                  alt={isArabic ? 'شاشة الدرجات' : 'Grades Screen'} 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Finance with Screenshot */}
      <section className="min-h-screen p-8 print:break-after-page">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'الإدارة المالية' : 'Financial Management'}
        </h2>
        <div className="max-w-5xl mx-auto">
          <Card className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">
                  {isArabic ? 'الرسوم والمدفوعات' : 'Fees & Payments'}
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {isArabic
                    ? 'عرض الرسوم المستحقة، الدفع الإلكتروني، وخطط التقسيط.'
                    : 'View due fees, electronic payment, and installment plans.'}
                </p>
                <div className="space-y-3">
                  {[
                    { icon: Eye, text: isArabic ? 'الرسوم المستحقة' : 'Due fees' },
                    { icon: CreditCard, text: isArabic ? 'الدفع الإلكتروني' : 'Electronic payment' },
                    { icon: Calendar, text: isArabic ? 'خطط التقسيط' : 'Installment plans' },
                    { icon: Receipt, text: isArabic ? 'إيصالات إلكترونية' : 'Electronic receipts' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-950 rounded-lg">
                      <item.icon className="h-5 w-5 text-teal-600" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src={screenshotFinance} 
                  alt={isArabic ? 'شاشة المالية' : 'Finance Screen'} 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Notifications with Screenshot */}
      <section className="min-h-screen p-8 print:break-after-page">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'نظام الإشعارات' : 'Notification System'}
        </h2>
        <div className="max-w-5xl mx-auto">
          <Card className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">
                  {isArabic ? 'تواصل فوري' : 'Instant Communication'}
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {isArabic
                    ? 'إشعارات فورية للحضور، المعاملات المالية، الدرجات، والأحداث المهمة.'
                    : 'Instant notifications for attendance, financial transactions, grades, and important events.'}
                </p>
                <div className="space-y-3">
                  {[
                    { icon: Bell, text: isArabic ? 'الحضور والانصراف' : 'Attendance notifications' },
                    { icon: CreditCard, text: isArabic ? 'المعاملات المالية' : 'Financial transactions' },
                    { icon: MessageSquare, text: isArabic ? 'إعلانات المدرسة' : 'School announcements' },
                    { icon: Calendar, text: isArabic ? 'تذكير بالواجبات' : 'Homework reminders' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <item.icon className="h-5 w-5 text-red-600" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src={screenshotNotifications} 
                  alt={isArabic ? 'شاشة الإشعارات' : 'Notifications Screen'} 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* All User Roles */}
      <section className="min-h-screen p-8 print:break-after-page">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'جميع أدوار المستخدمين' : 'All User Roles'}
        </h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {[
            { 
              icon: Shield, 
              title: isArabic ? 'المدير' : 'Admin', 
              color: 'bg-red-50 dark:bg-red-950 border-red-500',
              features: isArabic ? ['إدارة كاملة', 'إضافة مستخدمين', 'إدارة الرسوم', 'برمجة NFC'] : ['Full management', 'Add users', 'Fee management', 'NFC programming']
            },
            { 
              icon: Users, 
              title: isArabic ? 'ولي الأمر' : 'Parent', 
              color: 'bg-blue-50 dark:bg-blue-950 border-blue-500',
              features: isArabic ? ['متابعة الحضور', 'المحفظة', 'تتبع الحافلة', 'الدرجات'] : ['Track attendance', 'Wallet', 'Bus tracking', 'Grades']
            },
            { 
              icon: GraduationCap, 
              title: isArabic ? 'المعلم' : 'Teacher', 
              color: 'bg-green-50 dark:bg-green-950 border-green-500',
              features: isArabic ? ['إدخال الدرجات', 'الواجبات', 'الحضور', 'التقارير'] : ['Grade entry', 'Homework', 'Attendance', 'Reports']
            },
            { 
              icon: Smartphone, 
              title: isArabic ? 'الطالب' : 'Student', 
              color: 'bg-purple-50 dark:bg-purple-950 border-purple-500',
              features: isArabic ? ['عرض الدرجات', 'المحفظة', 'الأصدقاء', 'الرسائل'] : ['View grades', 'Wallet', 'Friends', 'Messages']
            },
            { 
              icon: Bus, 
              title: isArabic ? 'السائق' : 'Driver', 
              color: 'bg-orange-50 dark:bg-orange-950 border-orange-500',
              features: isArabic ? ['تسجيل الركوب', 'تحديث الموقع', 'قائمة الطلاب', 'المسار'] : ['Record boarding', 'Update location', 'Student list', 'Route']
            },
            { 
              icon: UtensilsCrossed, 
              title: isArabic ? 'المقصف' : 'Canteen', 
              color: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-500',
              features: isArabic ? ['إتمام البيع', 'مسح NFC', 'إدارة المخزون', 'القيود'] : ['Complete sale', 'Scan NFC', 'Inventory', 'Restrictions']
            },
            { 
              icon: CreditCard, 
              title: isArabic ? 'المالية' : 'Finance', 
              color: 'bg-teal-50 dark:bg-teal-950 border-teal-500',
              features: isArabic ? ['الفواتير', 'المدفوعات', 'التقارير', 'المتأخرات'] : ['Invoices', 'Payments', 'Reports', 'Overdue']
            },
          ].map((role, i) => (
            <Card key={i} className={`p-6 ${role.color} border-l-4 break-inside-avoid`}>
              <div className="flex items-center gap-4 mb-4">
                <role.icon className="h-10 w-10" />
                <h3 className="text-2xl font-semibold">{role.title}</h3>
              </div>
              <ul className="space-y-2">
                {role.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-8">
          <div className="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl">
            <span className="text-7xl font-bold text-white">ت</span>
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
            {isArabic ? 'شكراً لاهتمامكم' : 'Thank You'}
          </h2>
          <p className="text-2xl text-muted-foreground max-w-2xl mx-auto">
            {isArabic 
              ? 'منصة طالب المدرسية - نظام شامل لإدارة المدارس'
              : 'TalebEdu Platform - Complete School Management System'}
          </p>
          <div className="space-y-2 text-lg text-muted-foreground">
            <p className="text-blue-600 font-semibold" dir="ltr">+966 53 445 5688</p>
            <p className="text-blue-600">info@talebedu.app</p>
          </div>
        </div>
      </section>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          
          .print\\:break-after-page {
            page-break-after: always;
            break-after: page;
          }
          
          .break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PresentationFull;