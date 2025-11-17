import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Globe, Download, Smartphone, Shield, Wallet, Bus, UtensilsCrossed, GraduationCap, Users, BarChart, Bell, Clock, MapPin, CreditCard, CheckCircle, BookOpen, Calendar, MessageSquare, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Presentation = () => {
  const { language, setLanguage } = useLanguage();
  const isArabic = language === 'ar';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Control Bar - Hidden in Print */}
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
      <section className="min-h-screen flex flex-col items-center justify-center p-8 page-break">
        <div className="text-center space-y-8">
          <img 
            src="/src/assets/talebedu-logo-hq.png" 
            alt="TalebEdu" 
            className="h-32 mx-auto"
          />
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {isArabic ? 'طالب التعليمية' : 'TalebEdu'}
          </h1>
          <p className="text-2xl text-muted-foreground">
            {isArabic 
              ? 'نظام إدارة مدرسي متكامل مع تتبع الحضور بتقنية NFC'
              : 'Complete School Management System with NFC Attendance Tracking'}
          </p>
          <div className="mt-12 text-lg text-muted-foreground">
            {isArabic ? 'نسخة شاملة - 2025' : 'Comprehensive Edition - 2025'}
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="min-h-screen p-8 page-break">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'المحتويات' : 'Table of Contents'}
        </h2>
        <Card className="p-8 max-w-4xl mx-auto">
          <ol className="space-y-4 text-lg" dir={isArabic ? 'rtl' : 'ltr'}>
            <li className="flex justify-between border-b pb-2">
              <span>{isArabic ? '1. نظرة عامة على التطبيق' : '1. Application Overview'}</span>
              <span>3</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>{isArabic ? '2. المفهوم والقيمة' : '2. Concept & Value Proposition'}</span>
              <span>4</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>{isArabic ? '3. الميزات التفصيلية' : '3. Detailed Features'}</span>
              <span>5</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>{isArabic ? '4. الأدوار والصلاحيات' : '4. User Roles & Permissions'}</span>
              <span>12</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>{isArabic ? '5. دليل المستخدم خطوة بخطوة' : '5. Step-by-Step User Guide'}</span>
              <span>18</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>{isArabic ? '6. لقطات الشاشة والواجهات' : '6. Screenshots & Interfaces'}</span>
              <span>25</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>{isArabic ? '7. المواصفات التقنية' : '7. Technical Specifications'}</span>
              <span>32</span>
            </li>
          </ol>
        </Card>
      </section>

      {/* Application Overview */}
      <section className="min-h-screen p-8 page-break">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'نظرة عامة على التطبيق' : 'Application Overview'}
        </h2>
        <div className="max-w-4xl mx-auto space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? 'ما هو طالب التعليمية؟' : 'What is TalebEdu?'}
            </h3>
            <p className="text-lg leading-relaxed">
              {isArabic 
                ? 'طالب التعليمية هو نظام إدارة مدرسي متكامل ومتقدم يجمع بين التكنولوجيا الحديثة والحلول العملية لتبسيط العمليات اليومية في المؤسسات التعليمية. يوفر النظام منصة شاملة تربط المعلمين والطلاب وأولياء الأمور والإداريين في بيئة رقمية واحدة متكاملة.'
                : 'TalebEdu is a comprehensive and advanced school management system that combines modern technology with practical solutions to streamline daily operations in educational institutions. The system provides a complete platform connecting teachers, students, parents, and administrators in one integrated digital environment.'}
            </p>
          </Card>

          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? 'الهدف الرئيسي' : 'Main Purpose'}
            </h3>
            <p className="text-lg leading-relaxed">
              {isArabic 
                ? 'تهدف المنصة إلى تحويل الإدارة المدرسية التقليدية إلى تجربة رقمية سلسة وفعالة، مع التركيز على:'
                : 'The platform aims to transform traditional school management into a seamless and efficient digital experience, focusing on:'}
            </p>
            <ul className="list-disc list-inside space-y-3 mt-4 text-lg">
              <li>{isArabic ? 'أتمتة العمليات اليومية وتقليل العمل اليدوي' : 'Automating daily operations and reducing manual work'}</li>
              <li>{isArabic ? 'تحسين التواصل بين جميع أطراف العملية التعليمية' : 'Improving communication between all educational stakeholders'}</li>
              <li>{isArabic ? 'توفير بيانات دقيقة وفورية لاتخاذ قرارات مستنيرة' : 'Providing accurate and real-time data for informed decision-making'}</li>
              <li>{isArabic ? 'ضمان سلامة وأمان الطلاب من خلال تتبع دقيق' : 'Ensuring student safety through accurate tracking'}</li>
              <li>{isArabic ? 'تبسيط إدارة الموارد المالية والتشغيلية' : 'Simplifying financial and operational resource management'}</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? 'القيمة المضافة للمستخدمين' : 'Value Proposition'}
            </h3>
            <div className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-lg">
                <h4 className="font-bold text-lg mb-2">{isArabic ? 'للإدارة المدرسية:' : 'For School Administration:'}</h4>
                <p>{isArabic ? 'لوحة تحكم شاملة لمراقبة جميع العمليات، تقارير مالية دقيقة، وإدارة فعالة للموارد البشرية والمادية.' : 'Comprehensive dashboard for monitoring all operations, accurate financial reports, and efficient management of human and material resources.'}</p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg">
                <h4 className="font-bold text-lg mb-2">{isArabic ? 'للمعلمين:' : 'For Teachers:'}</h4>
                <p>{isArabic ? 'تسجيل حضور آلي، إدارة سهلة للدرجات والواجبات، وتواصل مباشر مع أولياء الأمور والطلاب.' : 'Automatic attendance recording, easy grade and homework management, and direct communication with parents and students.'}</p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg">
                <h4 className="font-bold text-lg mb-2">{isArabic ? 'لأولياء الأمور:' : 'For Parents:'}</h4>
                <p>{isArabic ? 'متابعة لحظية لأداء أبنائهم، تتبع الحافلات المدرسية، إدارة المحفظة الرقمية، والتواصل المباشر مع المعلمين.' : 'Real-time monitoring of their children\'s performance, school bus tracking, digital wallet management, and direct communication with teachers.'}</p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg">
                <h4 className="font-bold text-lg mb-2">{isArabic ? 'للطلاب:' : 'For Students:'}</h4>
                <p>{isArabic ? 'الوصول إلى جداولهم الدراسية، الواجبات، الدرجات، والمحفظة الرقمية للمشتريات داخل المدرسة.' : 'Access to their schedules, homework, grades, and digital wallet for in-school purchases.'}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Detailed Features */}
      <section className="min-h-screen p-8 page-break">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'الميزات التفصيلية' : 'Detailed Features'}
        </h2>
        <div className="max-w-4xl mx-auto space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
          {/* NFC Attendance */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '1. نظام الحضور بتقنية NFC' : '1. NFC Attendance System'}
            </h3>
            <p className="text-lg mb-4">
              {isArabic 
                ? 'نظام حضور متقدم يستخدم تقنية NFC لتسجيل حضور الطلاب بشكل سريع وآمن ودقيق.'
                : 'Advanced attendance system using NFC technology for fast, secure, and accurate student attendance recording.'}
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'مسح مستمر:' : 'Continuous Scanning:'}</h4>
                  <p>{isArabic ? 'القدرة على قراءة بطاقات NFC بشكل متواصل دون الحاجة لإعادة تفعيل القارئ' : 'Ability to read NFC cards continuously without reactivating the reader'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'تسجيل فوري:' : 'Instant Recording:'}</h4>
                  <p>{isArabic ? 'تسجيل الحضور والانصراف لحظياً مع إشعارات مباشرة لأولياء الأمور' : 'Instant check-in and check-out recording with direct parent notifications'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'تتبع الموقع:' : 'Location Tracking:'}</h4>
                  <p>{isArabic ? 'تسجيل موقع كل عملية حضور (بوابة المدرسة، الحافلة، إلخ)' : 'Recording location of each attendance event (school gate, bus, etc.)'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'تقارير مفصلة:' : 'Detailed Reports:'}</h4>
                  <p>{isArabic ? 'تقارير شاملة عن نسب الحضور والغياب لكل طالب وصف ومادة' : 'Comprehensive reports on attendance rates for each student, class, and subject'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Bus Tracking */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '2. نظام تتبع الحافلات' : '2. Bus Tracking System'}
            </h3>
            <p className="text-lg mb-4">
              {isArabic 
                ? 'نظام متكامل لإدارة وتتبع الحافلات المدرسية في الوقت الفعلي.'
                : 'Complete system for managing and tracking school buses in real-time.'}
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'تتبع مباشر على الخريطة:' : 'Live Map Tracking:'}</h4>
                  <p>{isArabic ? 'عرض موقع الحافلة الحالي على الخريطة مع تحديثات كل 10 ثوانٍ' : 'Display current bus location on map with updates every 10 seconds'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'وقت الوصول المتوقع:' : 'Estimated Arrival Time:'}</h4>
                  <p>{isArabic ? 'حساب دقيق لوقت وصول الحافلة إلى كل محطة' : 'Accurate calculation of bus arrival time to each stop'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'سجل الركوب والنزول:' : 'Boarding History:'}</h4>
                  <p>{isArabic ? 'تسجيل تلقائي لكل عملية ركوب ونزول باستخدام NFC' : 'Automatic recording of every boarding and alighting using NFC'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'إدارة المسارات:' : 'Route Management:'}</h4>
                  <p>{isArabic ? 'تحديد وإدارة مسارات الحافلات ومحطات التوقف' : 'Define and manage bus routes and stops'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'إشعارات للوالدين:' : 'Parent Notifications:'}</h4>
                  <p>{isArabic ? 'إشعارات تلقائية عند صعود ونزول الطالب من الحافلة' : 'Automatic notifications when student boards and exits the bus'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Digital Wallet */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '3. المحفظة الرقمية' : '3. Digital Wallet System'}
            </h3>
            <p className="text-lg mb-4">
              {isArabic 
                ? 'نظام محفظة رقمية آمن ومتكامل لإدارة المصروفات والمشتريات داخل المدرسة.'
                : 'Secure and integrated digital wallet system for managing expenses and purchases within the school.'}
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'محفظة لكل طالب:' : 'Wallet for Each Student:'}</h4>
                  <p>{isArabic ? 'محفظة رقمية خاصة بكل طالب مع رصيد قابل للتحديث' : 'Personal digital wallet for each student with updateable balance'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'التحويلات الفورية:' : 'Instant Transfers:'}</h4>
                  <p>{isArabic ? 'إمكانية إضافة رصيد من قبل الأهل بشكل فوري' : 'Parents can add balance instantly'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'سجل المعاملات:' : 'Transaction History:'}</h4>
                  <p>{isArabic ? 'سجل كامل لجميع العمليات (شحن، مشتريات، تحويلات)' : 'Complete record of all operations (top-ups, purchases, transfers)'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'تنبيهات الرصيد:' : 'Balance Alerts:'}</h4>
                  <p>{isArabic ? 'إشعارات تلقائية عند انخفاض الرصيد' : 'Automatic notifications when balance is low'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'الدفع بـ NFC:' : 'NFC Payment:'}</h4>
                  <p>{isArabic ? 'دفع سريع وآمن في المقصف والمتجر باستخدام بطاقة NFC' : 'Fast and secure payment at canteen and store using NFC card'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Canteen Management */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '4. إدارة المقصف' : '4. Canteen Management'}
            </h3>
            <p className="text-lg mb-4">
              {isArabic 
                ? 'نظام متكامل لإدارة المقصف المدرسي مع إمكانيات متقدمة للتحكم الأبوي.'
                : 'Integrated system for managing school canteen with advanced parental control features.'}
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'قائمة الأصناف:' : 'Items Catalog:'}</h4>
                  <p>{isArabic ? 'إدارة كاملة لأصناف المقصف مع الأسعار والمخزون' : 'Complete management of canteen items with prices and inventory'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'نظام الطلبات:' : 'Order System:'}</h4>
                  <p>{isArabic ? 'طلب وشراء سريع باستخدام المحفظة الرقمية' : 'Quick ordering and purchasing using digital wallet'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'التحكم الأبوي:' : 'Parental Control:'}</h4>
                  <p>{isArabic ? 'إمكانية تحديد أصناف معينة يمكن للطالب شراؤها وحد أقصى يومي للإنفاق' : 'Ability to specify allowed items and daily spending limit'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'تقارير المبيعات:' : 'Sales Reports:'}</h4>
                  <p>{isArabic ? 'تقارير تفصيلية عن المبيعات والمخزون والأرباح' : 'Detailed reports on sales, inventory, and profits'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Academic Management */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '5. الإدارة الأكاديمية' : '5. Academic Management'}
            </h3>
            <p className="text-lg mb-4">
              {isArabic 
                ? 'نظام شامل لإدارة جميع الجوانب الأكاديمية للمدرسة.'
                : 'Comprehensive system for managing all academic aspects of the school.'}
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'إدارة الصفوف:' : 'Class Management:'}</h4>
                  <p>{isArabic ? 'تنظيم الصفوف والأقسام والطلاب' : 'Organizing classes, sections, and students'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'الجداول الدراسية:' : 'Class Schedules:'}</h4>
                  <p>{isArabic ? 'إنشاء وإدارة الجداول الدراسية لكل صف' : 'Creating and managing class schedules for each class'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'إدارة الدرجات:' : 'Grade Management:'}</h4>
                  <p>{isArabic ? 'تسجيل وعرض درجات الطلاب في جميع المواد والاختبارات' : 'Recording and displaying student grades in all subjects and exams'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'الاختبارات:' : 'Exams:'}</h4>
                  <p>{isArabic ? 'جدولة الاختبارات وإدارة النتائج' : 'Scheduling exams and managing results'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'الواجبات:' : 'Homework:'}</h4>
                  <p>{isArabic ? 'إنشاء وإرسال وتتبع الواجبات المنزلية' : 'Creating, sending, and tracking homework'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Finance Management */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '6. الإدارة المالية' : '6. Financial Management'}
            </h3>
            <p className="text-lg mb-4">
              {isArabic 
                ? 'نظام مالي متكامل لإدارة جميع الجوانب المالية للمدرسة.'
                : 'Integrated financial system for managing all school financial aspects.'}
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'إدارة الرسوم:' : 'Fee Management:'}</h4>
                  <p>{isArabic ? 'هيكلة وإدارة رسوم الطلاب لكل مرحلة دراسية' : 'Structuring and managing student fees for each grade level'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'خطط التقسيط:' : 'Installment Plans:'}</h4>
                  <p>{isArabic ? 'إنشاء خطط دفع مرنة للرسوم الدراسية' : 'Creating flexible payment plans for tuition fees'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'تتبع المدفوعات:' : 'Payment Tracking:'}</h4>
                  <p>{isArabic ? 'متابعة حالة الدفع لكل طالب مع تنبيهات للمتأخرات' : 'Tracking payment status for each student with overdue alerts'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'التقارير المالية:' : 'Financial Reports:'}</h4>
                  <p>{isArabic ? 'تقارير شاملة عن الإيرادات والمصروفات والأرباح' : 'Comprehensive reports on revenues, expenses, and profits'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'إدارة الرواتب:' : 'Payroll Management:'}</h4>
                  <p>{isArabic ? 'نظام متكامل لإدارة رواتب الموظفين والمعلمين' : 'Integrated system for managing employee and teacher salaries'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Communication System */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '7. نظام المراسلات' : '7. Communication System'}
            </h3>
            <p className="text-lg mb-4">
              {isArabic 
                ? 'نظام اتصال متقدم يسهل التواصل بين جميع أطراف المجتمع المدرسي.'
                : 'Advanced communication system facilitating interaction between all school community members.'}
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'رسائل مباشرة:' : 'Direct Messaging:'}</h4>
                  <p>{isArabic ? 'إرسال واستقبال رسائل مباشرة بين المستخدمين' : 'Sending and receiving direct messages between users'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'الإشعارات:' : 'Notifications:'}</h4>
                  <p>{isArabic ? 'إشعارات فورية لجميع الأحداث المهمة' : 'Instant notifications for all important events'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[8px] h-[8px] rounded-full bg-primary mt-2"></div>
                <div>
                  <h4 className="font-semibold">{isArabic ? 'الإعلانات:' : 'Announcements:'}</h4>
                  <p>{isArabic ? 'نشر إعلانات عامة لجميع المستخدمين أو مجموعات محددة' : 'Publishing general announcements to all users or specific groups'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* User Roles */}
      <section className="min-h-screen p-8 page-break">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'الأدوار والصلاحيات' : 'User Roles & Permissions'}
        </h2>
        <div className="max-w-4xl mx-auto space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
          {/* Admin Role */}
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '1. دور المدير (Admin)' : '1. Administrator Role'}
            </h3>
            <p className="text-lg mb-4 font-semibold">
              {isArabic ? 'الصلاحيات الكاملة لإدارة النظام:' : 'Full system management permissions:'}
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إدارة جميع المستخدمين (إضافة، تعديل، حذف)' : 'Manage all users (add, edit, delete)'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إدارة الصفوف والمراحل الدراسية' : 'Manage classes and grade levels'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إدارة الحافلات والمسارات' : 'Manage buses and routes'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'مراقبة جميع العمليات المالية' : 'Monitor all financial operations'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'الوصول إلى جميع التقارير والإحصائيات' : 'Access to all reports and statistics'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إدارة إعدادات النظام' : 'System settings management'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'الموافقة على طلبات تسجيل الطلاب' : 'Approve student registration requests'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إدارة بطاقات NFC' : 'NFC card management'}</span>
              </li>
            </ul>
          </Card>

          {/* Teacher Role */}
          <Card className="p-8 bg-gradient-to-br from-secondary/5 to-secondary/10">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '2. دور المعلم (Teacher)' : '2. Teacher Role'}
            </h3>
            <p className="text-lg mb-4 font-semibold">
              {isArabic ? 'إدارة الجوانب الأكاديمية للصفوف المسندة:' : 'Managing academic aspects of assigned classes:'}
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'تسجيل الحضور والغياب للطلاب' : 'Record student attendance'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إدخال وتعديل الدرجات' : 'Enter and edit grades'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إنشاء وإدارة الواجبات المنزلية' : 'Create and manage homework'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'جدولة الاختبارات' : 'Schedule exams'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'التواصل مع أولياء الأمور' : 'Communicate with parents'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'عرض معلومات الطلاب في صفوفهم' : 'View student information in their classes'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'طلب إجازات' : 'Request leaves'}</span>
              </li>
            </ul>
          </Card>

          {/* Parent Role */}
          <Card className="p-8 bg-gradient-to-br from-accent/5 to-accent/10">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '3. دور ولي الأمر (Parent)' : '3. Parent Role'}
            </h3>
            <p className="text-lg mb-4 font-semibold">
              {isArabic ? 'متابعة ومراقبة الأبناء:' : 'Monitoring and tracking children:'}
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'عرض حضور وغياب الأبناء' : 'View children attendance records'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'متابعة الدرجات والأداء الأكاديمي' : 'Track grades and academic performance'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'تتبع الحافلة المدرسية في الوقت الفعلي' : 'Track school bus in real-time'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إدارة محفظة الطالب الرقمية' : 'Manage student digital wallet'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'دفع الرسوم المدرسية' : 'Pay school fees'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'التحكم في مشتريات المقصف (تحديد الأصناف والحد اليومي)' : 'Control canteen purchases (specify items and daily limit)'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'التواصل مع المعلمين والإدارة' : 'Communicate with teachers and administration'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'استقبال إشعارات فورية' : 'Receive instant notifications'}</span>
              </li>
            </ul>
          </Card>

          {/* Student Role */}
          <Card className="p-8 bg-gradient-to-br from-muted/30 to-muted/50">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '4. دور الطالب (Student)' : '4. Student Role'}
            </h3>
            <p className="text-lg mb-4 font-semibold">
              {isArabic ? 'الوصول إلى المعلومات الشخصية والخدمات:' : 'Access personal information and services:'}
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'عرض الجدول الدراسي' : 'View class schedule'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'الاطلاع على الدرجات' : 'View grades'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'عرض الواجبات المنزلية' : 'View homework assignments'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إدارة المحفظة الرقمية الخاصة' : 'Manage personal digital wallet'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'الشراء من المقصف والمتجر' : 'Purchase from canteen and store'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'التواصل مع الأصدقاء (إذا كان متاحاً)' : 'Communicate with friends (if enabled)'}</span>
              </li>
            </ul>
          </Card>

          {/* Driver Role */}
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '5. دور السائق (Driver)' : '5. Driver Role'}
            </h3>
            <p className="text-lg mb-4 font-semibold">
              {isArabic ? 'إدارة الحافلة وركوب الطلاب:' : 'Managing bus and student boarding:'}
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'تحديث موقع الحافلة' : 'Update bus location'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'تسجيل صعود ونزول الطلاب' : 'Record student boarding and alighting'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'عرض قائمة الطلاب المسجلين في الحافلة' : 'View list of students assigned to bus'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'اتباع المسار المحدد' : 'Follow assigned route'}</span>
              </li>
            </ul>
          </Card>

          {/* Finance Role */}
          <Card className="p-8 bg-gradient-to-br from-secondary/5 to-secondary/10">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '6. دور المالية (Finance)' : '6. Finance Role'}
            </h3>
            <p className="text-lg mb-4 font-semibold">
              {isArabic ? 'إدارة جميع الأمور المالية:' : 'Managing all financial matters:'}
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إدارة هيكل الرسوم الدراسية' : 'Manage fee structure'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'تسجيل المدفوعات' : 'Record payments'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إنشاء خطط التقسيط' : 'Create installment plans'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إدارة الحسابات المالية' : 'Manage financial accounts'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إنشاء التقارير المالية' : 'Generate financial reports'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إدارة الرواتب' : 'Manage payroll'}</span>
              </li>
            </ul>
          </Card>

          {/* Canteen Role */}
          <Card className="p-8 bg-gradient-to-br from-accent/5 to-accent/10">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '7. دور المقصف (Canteen)' : '7. Canteen Role'}
            </h3>
            <p className="text-lg mb-4 font-semibold">
              {isArabic ? 'إدارة المقصف المدرسي:' : 'Managing school canteen:'}
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إدارة أصناف المقصف' : 'Manage canteen items'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'معالجة طلبات الطلاب' : 'Process student orders'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إدارة المخزون' : 'Manage inventory'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'عرض تقارير المبيعات' : 'View sales reports'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'تسجيل المشتريات باستخدام NFC' : 'Record purchases using NFC'}</span>
              </li>
            </ul>
          </Card>

          {/* School Attendance Role */}
          <Card className="p-8 bg-gradient-to-br from-muted/30 to-muted/50">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '8. دور حضور المدرسة (School Attendance)' : '8. School Attendance Role'}
            </h3>
            <p className="text-lg mb-4 font-semibold">
              {isArabic ? 'إدارة حضور الطلاب عند بوابة المدرسة:' : 'Managing student attendance at school gate:'}
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'تسجيل دخول وخروج الطلاب' : 'Record student check-in and check-out'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'مسح بطاقات NFC عند البوابة' : 'Scan NFC cards at gate'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'عرض قائمة الحضور اليومي' : 'View daily attendance list'}</span>
              </li>
            </ul>
          </Card>

          {/* Bus Attendance Role */}
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '9. دور حضور الحافلة (Bus Attendance)' : '9. Bus Attendance Role'}
            </h3>
            <p className="text-lg mb-4 font-semibold">
              {isArabic ? 'إدارة حضور الطلاب في الحافلات:' : 'Managing student attendance on buses:'}
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'تسجيل صعود ونزول الطلاب من الحافلة' : 'Record student boarding and alighting from bus'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'مسح بطاقات NFC في الحافلة' : 'Scan NFC cards on bus'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'عرض قائمة الطلاب المسجلين' : 'View list of assigned students'}</span>
              </li>
            </ul>
          </Card>

          {/* Developer Role */}
          <Card className="p-8 bg-gradient-to-br from-secondary/5 to-secondary/10">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? '10. دور المطور (Developer)' : '10. Developer Role'}
            </h3>
            <p className="text-lg mb-4 font-semibold">
              {isArabic ? 'صلاحيات خاصة للاختبار والتطوير:' : 'Special permissions for testing and development:'}
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'الوصول الكامل لجميع الميزات' : 'Full access to all features'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'محاكاة أي دور مستخدم' : 'Simulate any user role'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{isArabic ? 'إدارة أدوات الاختبار' : 'Manage testing tools'}</span>
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* User Guide */}
      <section className="min-h-screen p-8 page-break">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'دليل المستخدم خطوة بخطوة' : 'Step-by-Step User Guide'}
        </h2>
        <div className="max-w-4xl mx-auto space-y-8" dir={isArabic ? 'rtl' : 'ltr'}>
          
          {/* Getting Started */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-6 text-primary">
              {isArabic ? 'البدء مع التطبيق' : 'Getting Started'}
            </h3>
            <div className="space-y-6">
              <div className="bg-muted/30 p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-3">{isArabic ? 'الخطوة 1: تسجيل الدخول' : 'Step 1: Login'}</h4>
                <p className="mb-3">{isArabic ? 'افتح التطبيق وأدخل بياناتك:' : 'Open the app and enter your credentials:'}</p>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>{isArabic ? 'البريد الإلكتروني' : 'Email address'}</li>
                  <li>{isArabic ? 'كلمة المرور' : 'Password'}</li>
                </ul>
                <div className="mt-4 p-4 bg-primary/5 rounded border-l-4 border-primary">
                  <p className="text-sm">{isArabic ? '💡 نصيحة: احتفظ ببيانات تسجيل الدخول في مكان آمن' : '💡 Tip: Keep your login credentials in a safe place'}</p>
                </div>
              </div>

              <div className="bg-muted/30 p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-3">{isArabic ? 'الخطوة 2: الصفحة الرئيسية' : 'Step 2: Home Dashboard'}</h4>
                <p className="mb-3">{isArabic ? 'بعد تسجيل الدخول، ستظهر لك الصفحة الرئيسية التي تحتوي على:' : 'After logging in, you\'ll see the home dashboard containing:'}</p>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>{isArabic ? 'ملخص سريع للمعلومات المهمة' : 'Quick summary of important information'}</li>
                  <li>{isArabic ? 'إشعارات حديثة' : 'Recent notifications'}</li>
                  <li>{isArabic ? 'إجراءات سريعة' : 'Quick actions'}</li>
                  <li>{isArabic ? 'القائمة الجانبية للتنقل' : 'Side menu for navigation'}</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* For Parents */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-6 text-primary">
              {isArabic ? 'دليل أولياء الأمور' : 'Parent Guide'}
            </h3>
            <div className="space-y-6">
              <div className="bg-muted/30 p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-3">{isArabic ? 'متابعة حضور الأبناء' : 'Track Children Attendance'}</h4>
                <ol className="list-decimal list-inside space-y-2 mr-4">
                  <li>{isArabic ? 'من القائمة الجانبية، اضغط على "الحضور"' : 'From the side menu, click on "Attendance"'}</li>
                  <li>{isArabic ? 'اختر اسم الطالب إذا كان لديك أكثر من طفل' : 'Select student name if you have multiple children'}</li>
                  <li>{isArabic ? 'شاهد سجل الحضور والغياب الكامل' : 'View complete attendance and absence record'}</li>
                  <li>{isArabic ? 'استخدم التصفية لعرض فترة محددة' : 'Use filters to view specific period'}</li>
                </ol>
              </div>

              <div className="bg-muted/30 p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-3">{isArabic ? 'شحن المحفظة الرقمية' : 'Top Up Digital Wallet'}</h4>
                <ol className="list-decimal list-inside space-y-2 mr-4">
                  <li>{isArabic ? 'اذهب إلى قسم "المحفظة"' : 'Go to "Wallet" section'}</li>
                  <li>{isArabic ? 'اضغط على "شحن الرصيد"' : 'Click on "Top Up Balance"'}</li>
                  <li>{isArabic ? 'أدخل المبلغ المراد شحنه' : 'Enter amount to top up'}</li>
                  <li>{isArabic ? 'اختر طريقة الدفع' : 'Choose payment method'}</li>
                  <li>{isArabic ? 'أكمل عملية الدفع' : 'Complete payment process'}</li>
                  <li>{isArabic ? 'سيتم تحديث الرصيد فوراً' : 'Balance will be updated instantly'}</li>
                </ol>
              </div>

              <div className="bg-muted/30 p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-3">{isArabic ? 'تتبع الحافلة' : 'Track Bus'}</h4>
                <ol className="list-decimal list-inside space-y-2 mr-4">
                  <li>{isArabic ? 'افتح قسم "تتبع الحافلة"' : 'Open "Bus Tracking" section'}</li>
                  <li>{isArabic ? 'شاهد موقع الحافلة الحالي على الخريطة' : 'View current bus location on map'}</li>
                  <li>{isArabic ? 'تحقق من وقت الوصول المتوقع' : 'Check estimated arrival time'}</li>
                  <li>{isArabic ? 'استقبل إشعارات عند صعود ونزول طفلك' : 'Receive notifications when your child boards and exits'}</li>
                </ol>
              </div>

              <div className="bg-muted/30 p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-3">{isArabic ? 'التحكم في مشتريات المقصف' : 'Control Canteen Purchases'}</h4>
                <ol className="list-decimal list-inside space-y-2 mr-4">
                  <li>{isArabic ? 'اذهب إلى "المقصف" ثم "التحكم الأبوي"' : 'Go to "Canteen" then "Parental Control"'}</li>
                  <li>{isArabic ? 'حدد الحد الأقصى للإنفاق اليومي' : 'Set maximum daily spending limit'}</li>
                  <li>{isArabic ? 'اختر الأصناف المسموح بشرائها' : 'Choose allowed items for purchase'}</li>
                  <li>{isArabic ? 'احفظ الإعدادات' : 'Save settings'}</li>
                </ol>
              </div>
            </div>
          </Card>

          {/* For Teachers */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-6 text-primary">
              {isArabic ? 'دليل المعلمين' : 'Teacher Guide'}
            </h3>
            <div className="space-y-6">
              <div className="bg-muted/30 p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-3">{isArabic ? 'تسجيل الحضور' : 'Record Attendance'}</h4>
                <ol className="list-decimal list-inside space-y-2 mr-4">
                  <li>{isArabic ? 'افتح صفحة "الحضور"' : 'Open "Attendance" page'}</li>
                  <li>{isArabic ? 'اختر الصف والمادة' : 'Select class and subject'}</li>
                  <li>{isArabic ? 'استخدم قارئ NFC لمسح بطاقات الطلاب أو' : 'Use NFC reader to scan student cards or'}</li>
                  <li>{isArabic ? 'سجل الحضور يدوياً من القائمة' : 'Record attendance manually from list'}</li>
                </ol>
              </div>

              <div className="bg-muted/30 p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-3">{isArabic ? 'إدخال الدرجات' : 'Enter Grades'}</h4>
                <ol className="list-decimal list-inside space-y-2 mr-4">
                  <li>{isArabic ? 'انتقل إلى صفحة "الدرجات"' : 'Navigate to "Grades" page'}</li>
                  <li>{isArabic ? 'اختر الصف والاختبار' : 'Select class and exam'}</li>
                  <li>{isArabic ? 'أدخل الدرجات لكل طالب' : 'Enter grades for each student'}</li>
                  <li>{isArabic ? 'أضف ملاحظات إذا لزم الأمر' : 'Add comments if needed'}</li>
                  <li>{isArabic ? 'احفظ التغييرات' : 'Save changes'}</li>
                </ol>
              </div>

              <div className="bg-muted/30 p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-3">{isArabic ? 'إنشاء واجب منزلي' : 'Create Homework'}</h4>
                <ol className="list-decimal list-inside space-y-2 mr-4">
                  <li>{isArabic ? 'اذهب إلى قسم "الواجبات"' : 'Go to "Homework" section'}</li>
                  <li>{isArabic ? 'اضغط على "إضافة واجب جديد"' : 'Click "Add New Homework"'}</li>
                  <li>{isArabic ? 'املأ التفاصيل (العنوان، الوصف، تاريخ التسليم)' : 'Fill in details (title, description, due date)'}</li>
                  <li>{isArabic ? 'اختر الصف المستهدف' : 'Select target class'}</li>
                  <li>{isArabic ? 'انشر الواجب' : 'Publish homework'}</li>
                </ol>
              </div>
            </div>
          </Card>

          {/* For Students */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-6 text-primary">
              {isArabic ? 'دليل الطلاب' : 'Student Guide'}
            </h3>
            <div className="space-y-6">
              <div className="bg-muted/30 p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-3">{isArabic ? 'التسوق من المقصف' : 'Shop from Canteen'}</h4>
                <ol className="list-decimal list-inside space-y-2 mr-4">
                  <li>{isArabic ? 'افتح صفحة "المقصف"' : 'Open "Canteen" page'}</li>
                  <li>{isArabic ? 'تصفح الأصناف المتاحة' : 'Browse available items'}</li>
                  <li>{isArabic ? 'أضف الأصناف إلى سلة التسوق' : 'Add items to shopping cart'}</li>
                  <li>{isArabic ? 'راجع الطلب والمبلغ الإجمالي' : 'Review order and total amount'}</li>
                  <li>{isArabic ? 'استخدم بطاقة NFC للدفع أو' : 'Use NFC card to pay or'}</li>
                  <li>{isArabic ? 'ادفع من المحفظة الرقمية مباشرة' : 'Pay from digital wallet directly'}</li>
                </ol>
              </div>

              <div className="bg-muted/30 p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-3">{isArabic ? 'عرض الواجبات' : 'View Homework'}</h4>
                <ol className="list-decimal list-inside space-y-2 mr-4">
                  <li>{isArabic ? 'انتقل إلى صفحة "الواجبات"' : 'Navigate to "Homework" page'}</li>
                  <li>{isArabic ? 'شاهد قائمة الواجبات الحالية' : 'View list of current homework'}</li>
                  <li>{isArabic ? 'اضغط على أي واجب لقراءة التفاصيل' : 'Click on any homework to read details'}</li>
                  <li>{isArabic ? 'تحقق من تاريخ التسليم' : 'Check submission date'}</li>
                </ol>
              </div>
            </div>
          </Card>

          {/* For Admin */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-6 text-primary">
              {isArabic ? 'دليل المدير' : 'Administrator Guide'}
            </h3>
            <div className="space-y-6">
              <div className="bg-muted/30 p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-3">{isArabic ? 'إضافة مستخدم جديد' : 'Add New User'}</h4>
                <ol className="list-decimal list-inside space-y-2 mr-4">
                  <li>{isArabic ? 'اذهب إلى "إدارة المستخدمين"' : 'Go to "User Management"'}</li>
                  <li>{isArabic ? 'اضغط على "إضافة مستخدم"' : 'Click "Add User"'}</li>
                  <li>{isArabic ? 'املأ المعلومات المطلوبة' : 'Fill in required information'}</li>
                  <li>{isArabic ? 'اختر الدور المناسب' : 'Select appropriate role'}</li>
                  <li>{isArabic ? 'احفظ وأرسل بيانات التسجيل' : 'Save and send login credentials'}</li>
                </ol>
              </div>

              <div className="bg-muted/30 p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-3">{isArabic ? 'برمجة بطاقة NFC' : 'Program NFC Card'}</h4>
                <ol className="list-decimal list-inside space-y-2 mr-4">
                  <li>{isArabic ? 'انتقل إلى "إدارة NFC"' : 'Navigate to "NFC Management"'}</li>
                  <li>{isArabic ? 'اختر الطالب المراد برمجة بطاقته' : 'Select student to program their card'}</li>
                  <li>{isArabic ? 'ضع البطاقة على القارئ' : 'Place card on reader'}</li>
                  <li>{isArabic ? 'اضغط على "برمجة البطاقة"' : 'Click "Program Card"'}</li>
                  <li>{isArabic ? 'انتظر تأكيد نجاح العملية' : 'Wait for success confirmation'}</li>
                </ol>
              </div>

              <div className="bg-muted/30 p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-3">{isArabic ? 'إنشاء تقرير' : 'Generate Report'}</h4>
                <ol className="list-decimal list-inside space-y-2 mr-4">
                  <li>{isArabic ? 'افتح صفحة "التقارير"' : 'Open "Reports" page'}</li>
                  <li>{isArabic ? 'اختر نوع التقرير المطلوب' : 'Select desired report type'}</li>
                  <li>{isArabic ? 'حدد الفترة الزمنية' : 'Set time period'}</li>
                  <li>{isArabic ? 'اضغط على "إنشاء التقرير"' : 'Click "Generate Report"'}</li>
                  <li>{isArabic ? 'شاهد التقرير أو قم بتحميله' : 'View or download report'}</li>
                </ol>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="min-h-screen p-8 page-break">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'لقطات الشاشة والواجهات' : 'Screenshots & Interfaces'}
        </h2>
        <div className="max-w-4xl mx-auto space-y-8" dir={isArabic ? 'rtl' : 'ltr'}>
          <Card className="p-8 text-center">
            <div className="bg-muted/20 rounded-lg p-12 mb-4 border-2 border-dashed border-primary/30">
              <p className="text-2xl text-muted-foreground mb-4">
                {isArabic ? '📱 صورة: واجهة تسجيل الدخول' : '📱 Screenshot: Login Interface'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'يتم إدراج لقطة الشاشة داخل موكاب iPhone 15 هنا'
                  : 'Screenshot inside iPhone 15 mockup goes here'}
              </p>
            </div>
            <p className="text-lg">
              {isArabic 
                ? 'واجهة تسجيل الدخول البسيطة والآمنة'
                : 'Simple and secure login interface'}
            </p>
          </Card>

          <Card className="p-8 text-center">
            <div className="bg-muted/20 rounded-lg p-12 mb-4 border-2 border-dashed border-primary/30">
              <p className="text-2xl text-muted-foreground mb-4">
                {isArabic ? '📱 صورة: لوحة التحكم الرئيسية' : '📱 Screenshot: Main Dashboard'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'يتم إدراج لقطة الشاشة داخل موكاب iPhone 15 هنا'
                  : 'Screenshot inside iPhone 15 mockup goes here'}
              </p>
            </div>
            <p className="text-lg">
              {isArabic 
                ? 'لوحة تحكم شاملة مع معلومات سريعة ومفيدة'
                : 'Comprehensive dashboard with quick and useful information'}
            </p>
          </Card>

          <Card className="p-8 text-center">
            <div className="bg-muted/20 rounded-lg p-12 mb-4 border-2 border-dashed border-primary/30">
              <p className="text-2xl text-muted-foreground mb-4">
                {isArabic ? '📱 صورة: تتبع الحافلة' : '📱 Screenshot: Bus Tracking'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'يتم إدراج لقطة الشاشة داخل موكاب iPhone 15 هنا'
                  : 'Screenshot inside iPhone 15 mockup goes here'}
              </p>
            </div>
            <p className="text-lg">
              {isArabic 
                ? 'تتبع مباشر للحافلة على الخريطة مع وقت الوصول'
                : 'Live bus tracking on map with arrival time'}
            </p>
          </Card>

          <Card className="p-8 text-center">
            <div className="bg-muted/20 rounded-lg p-12 mb-4 border-2 border-dashed border-primary/30">
              <p className="text-2xl text-muted-foreground mb-4">
                {isArabic ? '📱 صورة: المحفظة الرقمية' : '📱 Screenshot: Digital Wallet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'يتم إدراج لقطة الشاشة داخل موكاب iPhone 15 هنا'
                  : 'Screenshot inside iPhone 15 mockup goes here'}
              </p>
            </div>
            <p className="text-lg">
              {isArabic 
                ? 'واجهة المحفظة الرقمية مع الرصيد وتاريخ المعاملات'
                : 'Digital wallet interface with balance and transaction history'}
            </p>
          </Card>

          <Card className="p-8 text-center">
            <div className="bg-muted/20 rounded-lg p-12 mb-4 border-2 border-dashed border-primary/30">
              <p className="text-2xl text-muted-foreground mb-4">
                {isArabic ? '📱 صورة: المقصف' : '📱 Screenshot: Canteen'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'يتم إدراج لقطة الشاشة داخل موكاب iPhone 15 هنا'
                  : 'Screenshot inside iPhone 15 mockup goes here'}
              </p>
            </div>
            <p className="text-lg">
              {isArabic 
                ? 'واجهة المقصف مع الأصناف المتاحة وسلة التسوق'
                : 'Canteen interface with available items and shopping cart'}
            </p>
          </Card>

          <Card className="p-8 text-center">
            <div className="bg-muted/20 rounded-lg p-12 mb-4 border-2 border-dashed border-primary/30">
              <p className="text-2xl text-muted-foreground mb-4">
                {isArabic ? '📱 صورة: الدرجات والتقارير' : '📱 Screenshot: Grades & Reports'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'يتم إدراج لقطة الشاشة داخل موكاب iPhone 15 هنا'
                  : 'Screenshot inside iPhone 15 mockup goes here'}
              </p>
            </div>
            <p className="text-lg">
              {isArabic 
                ? 'عرض مفصل للدرجات والأداء الأكاديمي'
                : 'Detailed view of grades and academic performance'}
            </p>
          </Card>

          <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-center text-lg">
              {isArabic 
                ? 'ملاحظة: يمكن إضافة المزيد من لقطات الشاشة حسب الحاجة لتوضيح جميع الميزات'
                : 'Note: More screenshots can be added as needed to illustrate all features'}
            </p>
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="min-h-screen p-8 page-break">
        <h2 className="text-4xl font-bold mb-8 text-center">
          {isArabic ? 'المواصفات التقنية' : 'Technical Specifications'}
        </h2>
        <div className="max-w-4xl mx-auto space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? 'التقنيات المستخدمة' : 'Technologies Used'}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/20 p-4 rounded-lg">
                <h4 className="font-bold mb-2">{isArabic ? 'الواجهة الأمامية:' : 'Frontend:'}</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>React</li>
                  <li>TypeScript</li>
                  <li>Tailwind CSS</li>
                  <li>Vite</li>
                </ul>
              </div>
              <div className="bg-muted/20 p-4 rounded-lg">
                <h4 className="font-bold mb-2">{isArabic ? 'الخلفية:' : 'Backend:'}</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Supabase</li>
                  <li>PostgreSQL</li>
                  <li>Edge Functions</li>
                  <li>Real-time</li>
                </ul>
              </div>
              <div className="bg-muted/20 p-4 rounded-lg">
                <h4 className="font-bold mb-2">{isArabic ? 'الموبايل:' : 'Mobile:'}</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Capacitor</li>
                  <li>Web NFC API</li>
                  <li>PWA</li>
                </ul>
              </div>
              <div className="bg-muted/20 p-4 rounded-lg">
                <h4 className="font-bold mb-2">{isArabic ? 'الخرائط:' : 'Maps:'}</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Mapbox GL</li>
                  <li>Real-time Tracking</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? 'المتطلبات التقنية' : 'Technical Requirements'}
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-2">{isArabic ? 'للمتصفحات:' : 'For Browsers:'}</h4>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>{isArabic ? 'متصفح حديث يدعم Web NFC (Chrome, Edge)' : 'Modern browser supporting Web NFC (Chrome, Edge)'}</li>
                  <li>{isArabic ? 'اتصال إنترنت مستقر' : 'Stable internet connection'}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-2">{isArabic ? 'للأجهزة المحمولة:' : 'For Mobile Devices:'}</h4>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>{isArabic ? 'Android 8.0 أو أحدث' : 'Android 8.0 or newer'}</li>
                  <li>{isArabic ? 'iOS 14.0 أو أحدث' : 'iOS 14.0 or newer'}</li>
                  <li>{isArabic ? 'دعم NFC في الجهاز' : 'NFC support in device'}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-2">{isArabic ? 'للخوادم:' : 'For Servers:'}</h4>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>{isArabic ? 'قاعدة بيانات PostgreSQL' : 'PostgreSQL database'}</li>
                  <li>{isArabic ? 'Supabase للخلفية' : 'Supabase for backend'}</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? 'الأمان والخصوصية' : 'Security & Privacy'}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">🔒</span>
                <span>{isArabic ? 'تشفير البيانات end-to-end' : 'End-to-end data encryption'}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">🔒</span>
                <span>{isArabic ? 'Row Level Security (RLS) لحماية البيانات' : 'Row Level Security (RLS) for data protection'}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">🔒</span>
                <span>{isArabic ? 'مصادقة آمنة متعددة المستويات' : 'Secure multi-level authentication'}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">🔒</span>
                <span>{isArabic ? 'نسخ احتياطي تلقائي للبيانات' : 'Automatic data backup'}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">🔒</span>
                <span>{isArabic ? 'امتثال لمعايير حماية البيانات' : 'Compliance with data protection standards'}</span>
              </li>
            </ul>
          </Card>

          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {isArabic ? 'الدعم والصيانة' : 'Support & Maintenance'}
            </h3>
            <div className="space-y-4">
              <p className="text-lg">
                {isArabic 
                  ? 'نوفر دعماً فنياً شاملاً وتحديثات منتظمة لضمان أفضل أداء للنظام.'
                  : 'We provide comprehensive technical support and regular updates to ensure optimal system performance.'}
              </p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>{isArabic ? 'دعم فني متاح على مدار الساعة' : '24/7 technical support'}</li>
                <li>{isArabic ? 'تحديثات أمنية منتظمة' : 'Regular security updates'}</li>
                <li>{isArabic ? 'تدريب مستمر للمستخدمين' : 'Continuous user training'}</li>
                <li>{isArabic ? 'صيانة دورية للنظام' : 'Periodic system maintenance'}</li>
              </ul>
            </div>
          </Card>
        </div>
      </section>

      {/* Closing Page */}
      <section className="min-h-screen flex flex-col items-center justify-center p-8 page-break">
        <div className="text-center space-y-8 max-w-3xl">
          <h2 className="text-4xl font-bold">
            {isArabic ? 'شكراً لاهتمامكم' : 'Thank You'}
          </h2>
          <p className="text-2xl text-muted-foreground">
            {isArabic 
              ? 'طالب التعليمية - نظام إدارة مدرسي متكامل'
              : 'TalebEdu - Complete School Management System'}
          </p>
          <div className="space-y-4 text-lg">
            <p>{isArabic ? 'للاستفسارات والدعم الفني:' : 'For inquiries and technical support:'}</p>
            <p className="text-primary font-semibold">support@talebedu.com</p>
            <p className="text-primary font-semibold">+966 XX XXX XXXX</p>
          </div>
          <img 
            src="/src/assets/talebedu-logo-hq.png" 
            alt="TalebEdu" 
            className="h-24 mx-auto mt-8"
          />
        </div>
      </section>

      {/* Print Styles */}
      <style>{`
        @media print {
          .page-break {
            page-break-after: always;
          }
          
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default Presentation;