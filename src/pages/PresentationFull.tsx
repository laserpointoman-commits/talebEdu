import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Globe, Download, Smartphone, Shield, Wallet, Bus, UtensilsCrossed, GraduationCap, Users, BarChart, Bell, Clock, MapPin, CreditCard, CheckCircle, BookOpen, Calendar, MessageSquare, FileText, Mail, UserPlus, ClipboardCheck, LogIn, Home, Settings, Plus, Edit, Trash, Eye, Search, Filter, ArrowRight, UserCheck, DollarSign, Receipt, TrendingUp, FileSpreadsheet, Package, AlertTriangle, Info, Zap, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import talebEduLogo from '@/assets/talebedu-logo-blue.png';
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

  const CalloutBox = ({ type = 'info', icon: Icon, title, children }: any) => {
    const styles = {
      info: 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-700 dark:text-blue-300',
      success: 'bg-green-50 dark:bg-green-950 border-green-500 text-green-700 dark:text-green-300',
      warning: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-500 text-yellow-700 dark:text-yellow-300',
      tip: 'bg-purple-50 dark:bg-purple-950 border-purple-500 text-purple-700 dark:text-purple-300',
    };
    
    return (
      <div className={`${styles[type]} border-l-4 p-4 rounded-r-lg break-inside-avoid`}>
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 flex-shrink-0 mt-1" />
          <div>
            <p className="font-semibold">{title}</p>
            <div className="text-sm mt-1">{children}</div>
          </div>
        </div>
      </div>
    );
  };

  const ChapterDivider = ({ number, title, subtitle, icon: Icon, pages }: any) => (
    <section className="min-h-screen flex items-center justify-center p-8 print:break-after-page">
      <div className="text-center space-y-8 max-w-2xl">
        <Icon className="h-24 w-24 mx-auto text-blue-500" />
        <div className="text-8xl font-bold bg-gradient-to-br from-blue-500 to-blue-600 bg-clip-text text-transparent">
          {number}
        </div>
        <h1 className="text-5xl font-bold">{title}</h1>
        <p className="text-xl text-muted-foreground">{subtitle}</p>
        <p className="text-sm text-muted-foreground">{pages}</p>
      </div>
    </section>
  );

  const FeatureSection = ({ title, number, description, callouts, screenshot, screenshotCaption }: any) => (
    <div className="grid grid-cols-12 gap-8 items-center min-h-[700px] max-h-[850px] break-inside-avoid mb-12 px-4 py-6 print:min-h-[170mm] print:max-h-[170mm]">
      {/* Text Column - 60% */}
      <div className={`col-span-7 space-y-6 ${isArabic ? 'order-2' : 'order-1'}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
            {number}
          </div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
            {title}
          </h3>
        </div>
        
        <p className="text-lg leading-relaxed">{description}</p>
        
        {/* Numbered callouts */}
        <div className="space-y-3">
          {callouts.map((callout: any, idx: number) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {idx + 1}
              </div>
              <p>{callout}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Screenshot Column - 40% */}
      <div className={`col-span-5 flex items-center justify-center ${isArabic ? 'order-1' : 'order-2'}`}>
        <div className="w-full">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-3xl blur-xl"></div>
            <img 
              src={screenshot} 
              alt={title}
              className="relative w-full h-auto max-h-[600px] object-contain rounded-2xl shadow-2xl border-4 border-gray-200 dark:border-gray-800 print:max-h-[140mm]"
            />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4 italic">
            {screenshotCaption}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] overflow-y-auto overscroll-none" style={{ WebkitOverflowScrolling: 'touch' }}>
    <div className="min-h-screen bg-background text-foreground" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Control Bar - Hidden in print */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-4 no-print bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Globe className="h-4 w-4" />
          {language === 'en' ? 'العربية' : 'English'}
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          {isArabic ? 'تحميل PDF' : 'Download PDF'}
        </button>
      </div>

      {/* Cover Page */}
      <section className="min-h-screen flex flex-col items-center justify-center p-8 print:break-after-page">
        <div className="text-center space-y-8">
          <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary/10 mb-4">
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full" />
            <span className="relative text-6xl font-bold text-primary leading-none">
              t
            </span>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
            {isArabic ? 'منصة طالب المدرسية' : 'TalebEdu Platform'}
          </h1>
          <p className="text-2xl text-muted-foreground">
            {isArabic ? 'دليل المستخدم الكامل ودليل التطبيق' : 'Complete User Manual & Implementation Guide'}
          </p>
          <p className="text-lg text-muted-foreground">
            {isArabic ? 'الإصدار 1.0 - إصدار 2025' : 'Version 1.0 - 2025 Edition'}
          </p>
          <div className="mt-12 space-y-4 text-lg">
            <p className="text-blue-600 font-semibold" dir="ltr">
              📞 +968 9695 4540
            </p>
            <p className="text-blue-600 font-semibold" dir="ltr">
              📧 info@talebEdu.com
            </p>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="min-h-screen p-8 print:break-after-page">
        <h2 className="text-5xl font-bold mb-12 text-center bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
          {isArabic ? 'جدول المحتويات' : 'Table of Contents'}
        </h2>
        <div className="grid grid-cols-3 gap-6 max-w-7xl mx-auto">
          {[
            { icon: BookOpen, title: isArabic ? 'مقدمة' : 'Introduction', pages: '10 pages', color: 'text-blue-500' },
            { icon: Smartphone, title: isArabic ? 'البدء' : 'Getting Started', pages: '8 pages', color: 'text-blue-500' },
            { icon: Users, title: isArabic ? 'دليل ولي الأمر' : 'Parent Guide', pages: '35 pages', color: 'text-blue-500' },
            { icon: Settings, title: isArabic ? 'دليل المسؤول' : 'Admin Guide', pages: '40 pages', color: 'text-green-500' },
            { icon: GraduationCap, title: isArabic ? 'دليل المعلم' : 'Teacher Guide', pages: '20 pages', color: 'text-purple-500' },
            { icon: BookOpen, title: isArabic ? 'دليل الطالب' : 'Student Guide', pages: '15 pages', color: 'text-orange-500' },
            { icon: Bus, title: isArabic ? 'دليل السائق' : 'Driver Guide', pages: '10 pages', color: 'text-red-500' },
            { icon: UtensilsCrossed, title: isArabic ? 'دليل المقصف' : 'Canteen Staff', pages: '10 pages', color: 'text-yellow-500' },
            { icon: DollarSign, title: isArabic ? 'دليل المالية' : 'Finance Staff', pages: '12 pages', color: 'text-gray-500' },
          ].map((chapter, idx) => (
            <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <chapter.icon className={`h-8 w-8 ${chapter.color}`} />
                <div>
                  <h3 className="font-bold text-lg mb-2">{chapter.title}</h3>
                  <p className="text-sm text-muted-foreground">{chapter.pages}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>


      {/* Chapter 1: Parent Guide */}
      <ChapterDivider
        number="01"
        title={isArabic ? 'دليل ولي الأمر' : 'Parent Guide'}
        subtitle={isArabic ? 'دليل شامل لأولياء الأمور' : 'Complete guide for parents'}
        icon={Users}
        pages={isArabic ? '35 صفحة' : '35 pages'}
      />

      {/* Parent Dashboard Feature */}
      <section className="p-8">
        <FeatureSection
          number={1}
          title={isArabic ? 'لوحة تحكم ولي الأمر' : 'Parent Dashboard'}
          description={isArabic 
            ? 'توفر لوحة تحكم ولي الأمر نظرة عامة شاملة على جميع أطفالك في مكان واحد. تحقق من الحضور، تتبع الحافلة، أدر المحفظة، وابق على اطلاع بجميع الأنشطة المدرسية.'
            : 'The parent dashboard provides a comprehensive overview of all your children in one place. Check attendance, track buses, manage wallets, and stay informed about all school activities.'}
          callouts={isArabic ? [
            'يتم عرض رصيد المحفظة بشكل بارز في الأعلى للوصول السريع',
            'تعرض بطاقات الطلاب حالة الحضور والإجراءات السريعة',
            'توفر أزرار الإجراءات السريعة وصولاً فورياً إلى الميزات الرئيسية',
            'يعرض موجز النشاط الأخير جميع التحديثات المهمة'
          ] : [
            'Wallet balance is displayed prominently at the top for quick access',
            'Student cards show attendance status and quick actions for each child',
            'Quick action buttons provide instant access to key features',
            'Recent activity feed shows all important updates in real-time'
          ]}
          screenshot={screenshotNfc}
          screenshotCaption={isArabic ? 'الشكل 1: لوحة تحكم ولي الأمر تعرض نظرة عامة على الطلاب والإجراءات السريعة' : 'Figure 1: Parent Dashboard showing student overview and quick actions'}
        />

        <CalloutBox type="tip" icon={Zap} title={isArabic ? 'نصيحة احترافية' : 'Pro Tip'}>
          {isArabic 
            ? 'اضغط على أي بطاقة طالب لرؤية معلومات مفصلة بما في ذلك الحضور الأخير، الدرجات، وسجل المحفظة. يمكنك أيضاً التبديل بسرعة بين الأطفال المتعددين.'
            : 'Tap on any student card to see detailed information including recent attendance, grades, and wallet history. You can also quickly switch between multiple children.'}
        </CalloutBox>
      </section>

      {/* Bus Tracking Feature */}
      <section className="p-8">
        <FeatureSection
          number={2}
          title={isArabic ? 'تتبع الحافلة المباشر' : 'Live Bus Tracking'}
          description={isArabic
            ? 'تتبع موقع حافلة طفلك في الوقت الفعلي على خريطة تفاعلية. احصل على تحديثات الوصول الفوري، شاهد المسار الكامل، واعرف بالضبط متى يتم اصطحاف طفلك أو توصيله.'
            : 'Track your child\'s bus location in real-time on an interactive map. Get instant arrival updates, see the complete route, and know exactly when your child is picked up or dropped off.'}
          callouts={isArabic ? [
            'يتحرك أيقونة الحافلة الزرقاء في الوقت الفعلي على الخريطة',
            'يظهر خط المسار الأزرق المسار الكامل مع جميع التوقفات',
            'يشير أيقونة المنزل الأخضر إلى موقع طفلك',
            'تعرض بطاقة الوقت المتوقع للوصول الوقت الدقيق للوصول والمحطة التالية',
            'تؤكد حالة الطالب ما إذا كان طفلك على متن الحافلة'
          ] : [
            'Blue bus icon moves in real-time on the map showing exact location',
            'Blue route line shows the complete path with all stops clearly marked',
            'Green home icon indicates your child\'s pickup/drop-off location',
            'ETA card displays precise arrival time and next stop information',
            'Student status confirms whether your child is on board or waiting'
          ]}
          screenshot={screenshotBus}
          screenshotCaption={isArabic ? 'الشكل 2: خريطة تتبع الحافلة المباشرة مع المسار ووقت الوصول المتوقع' : 'Figure 2: Live bus tracking map with route and ETA information'}
        />

        <CalloutBox type="info" icon={Bell} title={isArabic ? 'الإشعارات' : 'Notifications'}>
          {isArabic
            ? 'قم بتمكين إشعارات الدفع لتلقي تحديثات تلقائية عندما تكون الحافلة على بعد 10 دقائق، 5 دقائق، وعند صعود/نزول طفلك.'
            : 'Enable push notifications to receive automatic updates when the bus is 10 minutes away, 5 minutes away, and when your child boards/exits.'}
        </CalloutBox>
      </section>

      {/* Digital Wallet Feature */}
      <section className="p-8">
        <FeatureSection
          number={3}
          title={isArabic ? 'المحفظة الرقمية' : 'Digital Wallet'}
          description={isArabic
            ? 'أدر أموال طفلك بأمان من خلال المحفظة الرقمية المدمجة. قم بإيداع الأموال، حدد حدود الإنفاق، وتتبع جميع المعاملات في الوقت الفعلي مع تحليلات مفصلة.'
            : 'Manage your child\'s money securely through the integrated digital wallet. Top up funds, set spending limits, and track all transactions in real-time with detailed analytics.'}
          callouts={isArabic ? [
            'يظهر عرض الرصيد الكبير الأموال المتاحة بوضوح',
            'يتيح زر الإيداع البارز إضافة الأموال بسرعة',
            'يعرض قائمة المعاملات الأخيرة جميع عمليات الشراء والإيداع',
            'يصور الرسم البياني الدائري تحليل الإنفاق حسب الفئة',
            'تنبهك تنبيهات الرصيد المنخفض عندما تحتاج الأموال إلى الإيداع'
          ] : [
            'Large balance display shows available funds clearly and prominently',
            'Prominent top-up button allows quick addition of funds',
            'Recent transactions list shows all purchases and top-ups with details',
            'Pie chart visualizes spending breakdown by category',
            'Low balance alerts notify you when funds need to be added'
          ]}
          screenshot={screenshotWallet}
          screenshotCaption={isArabic ? 'الشكل 3: نظرة عامة على المحفظة الرقمية مع المعاملات والتحليلات' : 'Figure 3: Digital wallet overview with transactions and analytics'}
        />

        <CalloutBox type="warning" icon={AlertTriangle} title={isArabic ? 'إعداد الحدود' : 'Setting Limits'}>
          {isArabic
            ? 'يُوصى بشدة بتعيين حدود إنفاق يومية وأسبوعية لمساعدة طفلك على تعلم الميزانية. يمكنك أيضاً تقييد فئات معينة من عناصر المقصف.'
            : 'It\'s highly recommended to set daily and weekly spending limits to help your child learn budgeting. You can also restrict specific categories of canteen items.'}
        </CalloutBox>
      </section>

      {/* Canteen Management Feature */}
      <section className="p-8">
        <FeatureSection
          number={4}
          title={isArabic ? 'طلب المقصف' : 'Canteen Ordering'}
          description={isArabic
            ? 'تصفح قائمة المقصف، اطلب الوجبات مسبقاً، وأدر تفضيلات طفلك الغذائية. جميع المشتريات تتم من خلال المحفظة الرقمية للراحة والأمان.'
            : 'Browse the canteen menu, pre-order meals, and manage your child\'s dietary preferences. All purchases are made through the digital wallet for convenience and security.'}
          callouts={isArabic ? [
            'تتيح علامات الفئات التصفح السهل للوجبات والوجبات الخفيفة والمشروبات',
            'تعرض عناصر الطعام الصور والأسعار والسعرات الحرارية والشارات الغذائية',
            'يتتبع أيقونة السلة عدد العناصر المضافة',
            'يظهر رصيد المحفظة دائماً للإنفاق الواعي'
          ] : [
            'Category tabs allow easy browsing of meals, snacks, and drinks',
            'Food items display photos, prices, calories, and dietary badges',
            'Cart icon tracks the number of items added',
            'Wallet balance is always visible for conscious spending'
          ]}
          screenshot={screenshotCanteen}
          screenshotCaption={isArabic ? 'الشكل 4: قائمة المقصف مع الفئات وتفاصيل العناصر' : 'Figure 4: Canteen menu with categories and item details'}
        />

        <CalloutBox type="success" icon={CheckCircle} title={isArabic ? 'الرقابة الأبوية' : 'Parental Controls'}>
          {isArabic
            ? 'قم بإعداد قيود على عناصر محددة مثل المشروبات الغازية أو الحلوى. يمكنك أيضاً حظر فئات معينة تماماً من خيارات طلب طفلك.'
            : 'Set up restrictions on specific items like soft drinks or candy. You can also block certain categories entirely from your child\'s ordering options.'}
        </CalloutBox>
      </section>

      {/* Grades Feature */}
      <section className="p-8">
        <FeatureSection
          number={5}
          title={isArabic ? 'لوحة الدرجات' : 'Grades Dashboard'}
          description={isArabic
            ? 'تتبع الأداء الأكاديمي لطفلك مع عرض مفصل للدرجات حسب المادة. شاهد الاتجاهات، قارن بمتوسط الصف، وراقب التقدم طوال الفصل الدراسي.'
            : 'Track your child\'s academic performance with detailed grade breakdowns by subject. See trends, compare with class averages, and monitor progress throughout the semester.'}
          callouts={isArabic ? [
            'تعرض بطاقات المواد الدرجة الحالية والاتجاه ومتوسط الصف',
            'يلخص عرض المعدل التراكمي الكبير الأداء العام',
            'يصور الرسم البياني للأداء الاتجاهات على مدار الفصل الدراسي',
            'يوضح عرض الترتيب موقع طفلك في الصف'
          ] : [
            'Subject cards display current grade, trend, and class average',
            'Large GPA display summarizes overall performance',
            'Performance chart visualizes trends over the semester',
            'Rank display shows your child\'s position in class'
          ]}
          screenshot={screenshotGrades}
          screenshotCaption={isArabic ? 'الشكل 5: لوحة الدرجات الأكاديمية مع تحليل الأداء' : 'Figure 5: Academic grades dashboard with performance analysis'}
        />
      </section>

      {/* Chapter 2: Admin Guide */}
      <ChapterDivider
        number="02"
        title={isArabic ? 'دليل المسؤول' : 'Admin Guide'}
        subtitle={isArabic ? 'أدوات قوية لإدارة المدرسة' : 'Powerful tools for school management'}
        icon={Settings}
        pages={isArabic ? '40 صفحة' : '40 pages'}
      />

      {/* Admin Dashboard */}
      <section className="p-8">
        <FeatureSection
          number={6}
          title={isArabic ? 'لوحة تحكم المسؤول' : 'Admin Dashboard'}
          description={isArabic
            ? 'أدر المدرسة بأكملها من لوحة تحكم مركزية واحدة. راقب المقاييس الرئيسية، تتبع الحضور، أدر المستخدمين، وولد التقارير الشاملة.'
            : 'Manage the entire school from a single centralized dashboard. Monitor key metrics, track attendance, manage users, and generate comprehensive reports.'}
          callouts={isArabic ? [
            'تعرض بطاقات مؤشرات الأداء الرئيسية مقاييس حيوية مثل إجمالي الطلاب والموظفين',
            'تصور الرسوم البيانية اتجاهات الحضور والإيرادات والتوزيع',
            'توفر أزرار الإجراءات السريعة وصولاً فورياً إلى المهام الشائعة',
            'تنبه شارة العناصر المعلقة إلى الموافقات المطلوبة'
          ] : [
            'KPI cards display vital metrics like total students and staff',
            'Charts visualize attendance trends, revenue, and distribution',
            'Quick action buttons provide instant access to common tasks',
            'Pending items badge alerts you to required approvals'
          ]}
          screenshot={screenshotFinance}
          screenshotCaption={isArabic ? 'الشكل 6: لوحة تحكم المسؤول مع المقاييس والرسوم البيانية' : 'Figure 6: Admin dashboard with metrics and charts'}
        />
      </section>

      {/* Notifications Feature */}
      <section className="p-8">
        <FeatureSection
          number={7}
          title={isArabic ? 'مركز الإشعارات' : 'Notifications Center'}
          description={isArabic
            ? 'ابق على اطلاع بجميع أنشطة المدرسة من خلال نظام إشعارات شامل. تلقى تحديثات حول الحضور، الدفعات، الدرجات، والمزيد.'
            : 'Stay informed about all school activities through a comprehensive notification system. Receive updates about attendance, payments, grades, and more.'}
          callouts={isArabic ? [
            'تعرض شارة غير المقروءة عدد الإشعارات الجديدة',
            'تشير أنواع الإشعارات بالألوان إلى الأولوية والفئة',
            'تتيح علامات التصفية عرض إشعارات محددة فقط',
            'يوضح زر الإجراءات الخطوات التالية لكل إشعار'
          ] : [
            'Unread badge shows count of new notifications',
            'Notification types are color-coded for priority and category',
            'Filter tabs allow viewing only specific notifications',
            'Actions button clarifies next steps for each notification'
          ]}
          screenshot={screenshotNotifications}
          screenshotCaption={isArabic ? 'الشكل 7: مركز الإشعارات مع عناصر مصنفة حسب الأولوية' : 'Figure 7: Notifications center with prioritized items'}
        />
      </section>

      {/* Closing Page */}
      <section className="min-h-screen flex flex-col items-center justify-center p-8 print:break-after-page">
        <div className="text-center space-y-8 max-w-2xl">
          <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
            <div className="absolute -inset-3 bg-primary/20 blur-2xl rounded-full" />
            <span className="relative text-4xl font-bold text-primary leading-none">
              t
            </span>
          </div>
          <h2 className="text-4xl font-bold">
            {isArabic ? 'شكراً لاختيارك منصة طالب' : 'Thank You for Choosing TalebEdu'}
          </h2>
          <p className="text-xl text-muted-foreground">
            {isArabic 
              ? 'نحن ملتزمون بتقديم أفضل تجربة لإدارة المدرسة'
              : 'We\'re committed to providing the best school management experience'}
          </p>
          <div className="mt-12 space-y-4 text-lg">
            <p className="font-semibold">{isArabic ? 'اتصل بنا' : 'Contact Us'}</p>
            <p className="text-blue-600 font-semibold" dir="ltr">
              📞 +968 9695 4540
            </p>
            <p className="text-blue-600 font-semibold" dir="ltr">
              📧 info@talebEdu.com
            </p>
          </div>
        </div>
      </section>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 20mm 25mm 20mm 30mm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print\\:break-after-page {
            break-after: page;
            page-break-after: always;
          }
          
          .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          
          /* Feature sections = 1 page each */
          section {
            page-break-inside: avoid;
          }
          
          /* Screenshot constraints for print */
          section img {
            max-height: 140mm !important;
            max-width: 100% !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
          }
          
          h1, h2, h3, h4, h5, h6 {
            break-after: avoid;
          }
          
          /* Headers and footers */
          @page :left {
            @top-left {
              content: "TalebEdu User Manual";
              font-size: 9pt;
              color: #6b7280;
            }
            @bottom-center {
              content: counter(page);
              font-size: 10pt;
            }
          }
          
          @page :right {
            @top-right {
              content: "Version 1.0 - 2025";
              font-size: 9pt;
              color: #6b7280;
            }
            @bottom-center {
              content: counter(page);
              font-size: 10pt;
            }
          }
        }
      `}</style>
    </div>
    </div>
  );
};

export default PresentationFull;