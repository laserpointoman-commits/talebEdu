import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Printer, Globe } from "lucide-react";
import logo from "@/assets/talebedu-logo-hq.png";

const PresentationManual = () => {
  const { language, setLanguage } = useLanguage();
  const isArabic = language === "ar";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-primary/5 to-background ${isArabic ? 'rtl' : 'ltr'}`}>
      {/* Control Bar - Hidden in Print */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2 bg-card/95 backdrop-blur-lg p-3 rounded-2xl shadow-elegant border border-border/50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLanguage(isArabic ? "en" : "ar")}
          className="gap-2"
        >
          <Globe className="w-4 h-4" />
          {isArabic ? "English" : "العربية"}
        </Button>
        <Button
          onClick={handlePrint}
          size="sm"
          className="gap-2 bg-gradient-primary text-primary-foreground"
        >
          <Printer className="w-4 h-4" />
          {isArabic ? "طباعة" : "Print"}
        </Button>
      </div>

      {/* Cover Page */}
      <section className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-4xl">
          <div className="animate-fade-in">
            <img 
              src={logo} 
              alt="TalebEdu Logo" 
              className="w-40 h-40 mx-auto mb-8 drop-shadow-glow hover:scale-110 transition-transform duration-500"
            />
          </div>
          
          <h1 className="text-7xl md:text-8xl font-bold bg-gradient-primary bg-clip-text text-transparent animate-fade-in mb-6">
            TalebEdu
          </h1>
          
          <p className="text-3xl md:text-4xl text-muted-foreground font-light animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {isArabic ? "دليل المستخدم الشامل" : "Complete User Manual"}
          </p>
          
          <div className="h-1 w-32 mx-auto bg-gradient-primary rounded-full animate-fade-in" style={{ animationDelay: '0.4s' }}></div>
          
          <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {isArabic ? "نظام إدارة مدرسي متكامل" : "Integrated School Management System"}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            {[
              { icon: "👨‍💼", label: isArabic ? "إدارة" : "Admin" },
              { icon: "👨‍🏫", label: isArabic ? "معلم" : "Teacher" },
              { icon: "👨‍👩‍👧‍👦", label: isArabic ? "ولي أمر" : "Parent" },
              { icon: "🎓", label: isArabic ? "طالب" : "Student" }
            ].map((item, i) => (
              <div key={i} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-glow transition-all duration-300 hover:scale-105">
                <div className="text-4xl mb-2">{item.icon}</div>
                <div className="text-sm font-medium text-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="min-h-screen flex items-center justify-center p-8 page-break">
        <div className="max-w-4xl w-full">
          <h2 className="text-5xl font-bold mb-12 bg-gradient-primary bg-clip-text text-transparent text-center">
            {isArabic ? "المحتويات" : "Table of Contents"}
          </h2>
          
          <div className="space-y-4">
            {[
              { num: "01", title: isArabic ? "نظرة عامة على النظام" : "System Overview", page: "3" },
              { num: "02", title: isArabic ? "دليل الإدارة" : "Administrator Guide", page: "5" },
              { num: "03", title: isArabic ? "دليل المعلم" : "Teacher Guide", page: "15" },
              { num: "04", title: isArabic ? "دليل ولي الأمر" : "Parent Guide", page: "25" },
              { num: "05", title: isArabic ? "دليل الطالب" : "Student Guide", page: "35" },
              { num: "06", title: isArabic ? "دليل السائق" : "Driver Guide", page: "45" },
              { num: "07", title: isArabic ? "المزايا المتقدمة" : "Advanced Features", page: "55" },
              { num: "08", title: isArabic ? "الأسئلة الشائعة" : "FAQ & Support", page: "65" }
            ].map((item, i) => (
              <div 
                key={i}
                className="group bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:bg-card/50 hover:shadow-elegant transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                      {item.num}
                    </div>
                    <div className="text-xl font-medium text-foreground">{item.title}</div>
                  </div>
                  <div className="text-muted-foreground text-lg">{item.page}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Overview */}
      <section className="min-h-screen p-8 page-break">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">01</div>
            <h2 className="text-5xl font-bold text-foreground">
              {isArabic ? "نظرة عامة على النظام" : "System Overview"}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-foreground mb-4">
                {isArabic ? "ما هو TalebEdu؟" : "What is TalebEdu?"}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {isArabic 
                  ? "TalebEdu هو نظام إدارة مدرسي شامل ومتكامل يجمع بين أحدث التقنيات وأفضل الممارسات التعليمية. تم تصميم النظام لتبسيط العمليات الإدارية وتعزيز التواصل بين جميع أطراف العملية التعليمية."
                  : "TalebEdu is a comprehensive integrated school management system that combines cutting-edge technology with best educational practices. The system is designed to streamline administrative processes and enhance communication between all stakeholders in the educational process."
                }
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl p-8 border border-border/50">
              <h4 className="text-2xl font-bold text-foreground mb-4">
                {isArabic ? "الأهداف الرئيسية" : "Key Objectives"}
              </h4>
              <ul className="space-y-3 text-muted-foreground">
                {(isArabic ? [
                  "تحسين كفاءة الإدارة المدرسية",
                  "تسهيل التواصل بين المدرسة والأهل",
                  "تتبع دقيق لأداء الطلاب",
                  "إدارة مالية شفافة ومنظمة",
                  "ضمان سلامة الطلاب عبر تتبع الحافلات"
                ] : [
                  "Improve school administrative efficiency",
                  "Facilitate communication between school and parents",
                  "Accurate tracking of student performance",
                  "Transparent and organized financial management",
                  "Ensure student safety through bus tracking"
                ]).map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "🎯",
                title: isArabic ? "سهل الاستخدام" : "Easy to Use",
                desc: isArabic ? "واجهة بديهية مصممة لجميع المستخدمين" : "Intuitive interface designed for all users"
              },
              {
                icon: "🔒",
                title: isArabic ? "آمن ومحمي" : "Secure & Protected",
                desc: isArabic ? "حماية متقدمة للبيانات والخصوصية" : "Advanced data and privacy protection"
              },
              {
                icon: "📱",
                title: isArabic ? "متعدد المنصات" : "Multi-Platform",
                desc: isArabic ? "يعمل على الهاتف والحاسوب والتابلت" : "Works on phone, computer and tablet"
              }
            ].map((feature, i) => (
              <div key={i} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-glow transition-all duration-300 hover:scale-105">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h4 className="text-xl font-bold text-foreground mb-2">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-3xl p-8 border border-primary/30">
            <h3 className="text-3xl font-bold text-foreground mb-6 text-center">
              {isArabic ? "الميزات الرئيسية" : "Core Features"}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {(isArabic ? [
                { title: "الحضور الذكي", desc: "نظام حضور متقدم باستخدام تقنية NFC" },
                { title: "تتبع الحافلات", desc: "تتبع مباشر لموقع الحافلات المدرسية" },
                { title: "المحفظة الرقمية", desc: "إدارة آمنة للمصروفات المدرسية" },
                { title: "نظام الكافتيريا", desc: "طلب وجبات صحية بسهولة" },
                { title: "إدارة الدرجات", desc: "تتبع شامل لأداء الطلاب الأكاديمي" },
                { title: "التواصل الفوري", desc: "رسائل مباشرة بين جميع الأطراف" }
              ] : [
                { title: "Smart Attendance", desc: "Advanced attendance system using NFC technology" },
                { title: "Bus Tracking", desc: "Real-time tracking of school bus locations" },
                { title: "Digital Wallet", desc: "Secure management of school expenses" },
                { title: "Canteen System", desc: "Easy ordering of healthy meals" },
                { title: "Grade Management", desc: "Comprehensive tracking of student academic performance" },
                { title: "Instant Communication", desc: "Direct messaging between all parties" }
              ]).map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-3 h-3 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <div>
                    <h5 className="text-lg font-bold text-foreground mb-1">{item.title}</h5>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Administrator Guide */}
      <section className="min-h-screen p-8 page-break">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="text-6xl">👨‍💼</div>
            <div>
              <div className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">02</div>
              <h2 className="text-5xl font-bold text-foreground">
                {isArabic ? "دليل الإدارة" : "Administrator Guide"}
              </h2>
            </div>
          </div>

          <div className="space-y-12">
            {/* Dashboard Overview */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">1</span>
                {isArabic ? "لوحة التحكم الرئيسية" : "Main Dashboard"}
              </h3>
              
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {isArabic
                  ? "لوحة التحكم الرئيسية هي نقطة البداية لجميع العمليات الإدارية. تعرض معلومات شاملة ومؤشرات أداء رئيسية بشكل مرئي وسهل الفهم."
                  : "The main dashboard is the starting point for all administrative operations. It displays comprehensive information and key performance indicators in a visual and easy-to-understand format."
                }
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-foreground">
                    {isArabic ? "المؤشرات الرئيسية" : "Key Metrics"}
                  </h4>
                  {(isArabic ? [
                    "إجمالي عدد الطلاب المسجلين",
                    "نسبة الحضور اليومية",
                    "الإيرادات والمصروفات الشهرية",
                    "عدد المعلمين والموظفين",
                    "الحافلات النشطة"
                  ] : [
                    "Total enrolled students",
                    "Daily attendance rate",
                    "Monthly revenue and expenses",
                    "Number of teachers and staff",
                    "Active buses"
                  ]).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-background/50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                      </div>
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-foreground">
                    {isArabic ? "الوصول السريع" : "Quick Access"}
                  </h4>
                  {(isArabic ? [
                    "إضافة طالب جديد",
                    "إضافة معلم أو موظف",
                    "إدارة الصفوف والشعب",
                    "إعداد الرسوم الدراسية",
                    "تكوين النظام"
                  ] : [
                    "Add new student",
                    "Add teacher or staff",
                    "Manage classes and sections",
                    "Configure school fees",
                    "System configuration"
                  ]).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-secondary/10 rounded-xl hover:bg-secondary/20 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-secondary/30 flex items-center justify-center">
                        <span className="text-secondary-foreground font-bold">{i + 1}</span>
                      </div>
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Student Management */}
            <div className="bg-gradient-to-br from-primary/5 to-transparent border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">2</span>
                {isArabic ? "إدارة الطلاب" : "Student Management"}
              </h3>

              <div className="space-y-6">
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-foreground mb-4">
                    {isArabic ? "إضافة طالب جديد" : "Adding a New Student"}
                  </h4>
                  <div className="space-y-3">
                    {(isArabic ? [
                      "انتقل إلى قسم 'الطلاب' من القائمة الجانبية",
                      "اضغط على زر 'إضافة طالب جديد'",
                      "أدخل المعلومات الأساسية (الاسم، تاريخ الميلاد، رقم الهوية)",
                      "حدد الصف والشعبة",
                      "أضف معلومات ولي الأمر",
                      "قم بتعيين بطاقة NFC للطالب",
                      "احفظ البيانات وأرسل دعوة لولي الأمر"
                    ] : [
                      "Navigate to 'Students' section from sidebar",
                      "Click 'Add New Student' button",
                      "Enter basic information (name, date of birth, ID number)",
                      "Select grade and section",
                      "Add parent information",
                      "Assign NFC card to student",
                      "Save data and send invitation to parent"
                    ]).map((step, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-muted-foreground pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-foreground mb-4">
                    {isArabic ? "إدارة بيانات الطالب" : "Managing Student Data"}
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    {(isArabic ? [
                      { title: "تعديل المعلومات", desc: "تحديث البيانات الشخصية والأكاديمية" },
                      { title: "نقل الصف", desc: "نقل الطالب إلى صف أعلى أو شعبة مختلفة" },
                      { title: "حذف الطالب", desc: "إلغاء تسجيل الطالب من النظام" }
                    ] : [
                      { title: "Edit Information", desc: "Update personal and academic data" },
                      { title: "Transfer Class", desc: "Move student to higher grade or different section" },
                      { title: "Delete Student", desc: "Unregister student from system" }
                    ]).map((item, i) => (
                      <div key={i} className="p-4 bg-background/50 rounded-xl">
                        <h5 className="font-bold text-foreground mb-2">{item.title}</h5>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher Management */}
            <div className="bg-gradient-to-br from-secondary/5 to-transparent border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">3</span>
                {isArabic ? "إدارة المعلمين" : "Teacher Management"}
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-foreground mb-4">
                    {isArabic ? "إضافة معلم جديد" : "Adding a New Teacher"}
                  </h4>
                  <ul className="space-y-3">
                    {(isArabic ? [
                      "المعلومات الشخصية والمؤهلات",
                      "تحديد المواد والصفوف",
                      "الجدول الزمني للحصص",
                      "معلومات الحساب البنكي للرواتب",
                      "إنشاء حساب للنظام"
                    ] : [
                      "Personal information and qualifications",
                      "Assign subjects and grades",
                      "Class schedule",
                      "Bank account for salary",
                      "Create system account"
                    ]).map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-secondary mt-2"></div>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-foreground mb-4">
                    {isArabic ? "إدارة الرواتب" : "Payroll Management"}
                  </h4>
                  <ul className="space-y-3">
                    {(isArabic ? [
                      "تحديد الراتب الأساسي",
                      "إضافة البدلات والمكافآت",
                      "الخصومات والغيابات",
                      "إصدار كشوف الرواتب",
                      "تقارير الرواتب الشهرية"
                    ] : [
                      "Set base salary",
                      "Add allowances and bonuses",
                      "Deductions and absences",
                      "Generate payslips",
                      "Monthly payroll reports"
                    ]).map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-secondary mt-2"></div>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Financial Management */}
            <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">4</span>
                {isArabic ? "الإدارة المالية" : "Financial Management"}
              </h3>

              <div className="space-y-6">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {isArabic
                    ? "نظام مالي متكامل لإدارة جميع العمليات المالية المدرسية بشفافية ودقة عالية."
                    : "Integrated financial system to manage all school financial operations with transparency and high accuracy."
                  }
                </p>

                <div className="grid md:grid-cols-3 gap-6">
                  {(isArabic ? [
                    { icon: "💰", title: "الرسوم الدراسية", desc: "إدارة وتتبع الرسوم والدفعات" },
                    { icon: "📊", title: "التقارير المالية", desc: "تقارير شاملة ومفصلة" },
                    { icon: "🔔", title: "التنبيهات", desc: "إشعارات الدفعات المتأخرة" }
                  ] : [
                    { icon: "💰", title: "School Fees", desc: "Manage and track fees and payments" },
                    { icon: "📊", title: "Financial Reports", desc: "Comprehensive detailed reports" },
                    { icon: "🔔", title: "Alerts", desc: "Late payment notifications" }
                  ]).map((item, i) => (
                    <div key={i} className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 hover:shadow-glow transition-all">
                      <div className="text-4xl mb-3">{item.icon}</div>
                      <h4 className="text-xl font-bold text-foreground mb-2">{item.title}</h4>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Teacher Guide */}
      <section className="min-h-screen p-8 page-break">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="text-6xl">👨‍🏫</div>
            <div>
              <div className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">03</div>
              <h2 className="text-5xl font-bold text-foreground">
                {isArabic ? "دليل المعلم" : "Teacher Guide"}
              </h2>
            </div>
          </div>

          <div className="space-y-12">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6">
                {isArabic ? "الصفحة الرئيسية للمعلم" : "Teacher Home Page"}
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-foreground">
                    {isArabic ? "العرض السريع" : "Quick View"}
                  </h4>
                  {(isArabic ? [
                    "الحصص اليومية والجدول الزمني",
                    "قائمة الصفوف المخصصة",
                    "الواجبات المعلقة",
                    "الإشعارات والتنبيهات"
                  ] : [
                    "Daily lessons and schedule",
                    "Assigned classes list",
                    "Pending assignments",
                    "Notifications and alerts"
                  ]).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-background/50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold">{i + 1}</span>
                      </div>
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-foreground mb-4">
                    {isArabic ? "المهام الرئيسية" : "Main Tasks"}
                  </h4>
                  <div className="space-y-3">
                    {(isArabic ? [
                      "تسجيل الحضور والغياب",
                      "إدخال الدرجات والتقييمات",
                      "إضافة واجبات منزلية",
                      "التواصل مع أولياء الأمور"
                    ] : [
                      "Record attendance",
                      "Enter grades and assessments",
                      "Add homework",
                      "Communicate with parents"
                    ]).map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span className="text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Management */}
            <div className="bg-gradient-to-br from-secondary/5 to-transparent border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">1</span>
                {isArabic ? "تسجيل الحضور" : "Attendance Recording"}
              </h3>

              <div className="space-y-6">
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-foreground mb-4">
                    {isArabic ? "الطرق المتاحة" : "Available Methods"}
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {(isArabic ? [
                      { title: "التسجيل التلقائي", desc: "باستخدام بطاقة NFC عند دخول الفصل" },
                      { title: "التسجيل اليدوي", desc: "تحديد الحضور والغياب يدوياً من القائمة" }
                    ] : [
                      { title: "Automatic Recording", desc: "Using NFC card when entering class" },
                      { title: "Manual Recording", desc: "Manually mark attendance/absence from list" }
                    ]).map((method, i) => (
                      <div key={i} className="p-4 bg-gradient-to-br from-primary/5 to-transparent rounded-xl border border-border/50">
                        <h5 className="font-bold text-foreground mb-2">{method.title}</h5>
                        <p className="text-sm text-muted-foreground">{method.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-foreground mb-4">
                    {isArabic ? "خطوات التسجيل اليدوي" : "Manual Recording Steps"}
                  </h4>
                  <div className="space-y-3">
                    {(isArabic ? [
                      "افتح صفحة الحضور من القائمة",
                      "اختر الصف والمادة",
                      "حدد التاريخ والحصة",
                      "ضع علامة بجانب كل طالب (حاضر/غائب/متأخر)",
                      "احفظ التسجيل"
                    ] : [
                      "Open attendance page from menu",
                      "Select class and subject",
                      "Choose date and period",
                      "Mark each student (present/absent/late)",
                      "Save record"
                    ]).map((step, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-muted-foreground pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Grade Management */}
            <div className="bg-gradient-to-br from-primary/5 to-transparent border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">2</span>
                {isArabic ? "إدارة الدرجات" : "Grade Management"}
              </h3>

              <div className="grid md:grid-cols-3 gap-6">
                {(isArabic ? [
                  { icon: "📝", title: "إدخال الدرجات", desc: "تسجيل درجات الاختبارات والواجبات" },
                  { icon: "📊", title: "التقارير", desc: "عرض تقارير الأداء للطلاب" },
                  { icon: "✏️", title: "التعديل", desc: "تعديل الدرجات عند الحاجة" }
                ] : [
                  { icon: "📝", title: "Enter Grades", desc: "Record test and assignment scores" },
                  { icon: "📊", title: "Reports", desc: "View student performance reports" },
                  { icon: "✏️", title: "Edit", desc: "Modify grades when needed" }
                ]).map((item, i) => (
                  <div key={i} className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 hover:shadow-glow transition-all">
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <h4 className="text-xl font-bold text-foreground mb-2">{item.title}</h4>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Parent Guide */}
      <section className="min-h-screen p-8 page-break">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="text-6xl">👨‍👩‍👧‍👦</div>
            <div>
              <div className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">04</div>
              <h2 className="text-5xl font-bold text-foreground">
                {isArabic ? "دليل ولي الأمر" : "Parent Guide"}
              </h2>
            </div>
          </div>

          <div className="space-y-12">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6">
                {isArabic ? "نظرة عامة" : "Overview"}
              </h3>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {isArabic
                  ? "تم تصميم لوحة تحكم ولي الأمر لتوفير متابعة شاملة لجميع جوانب الحياة المدرسية لأبنائكم، من الأداء الأكاديمي إلى السلامة والنشاطات اليومية."
                  : "The parent dashboard is designed to provide comprehensive monitoring of all aspects of your children's school life, from academic performance to safety and daily activities."
                }
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(isArabic ? [
                  { icon: "📚", title: "الدرجات", desc: "متابعة الأداء الأكاديمي" },
                  { icon: "🚌", title: "الحافلة", desc: "تتبع موقع حافلة أبنائك" },
                  { icon: "💰", title: "المحفظة", desc: "إدارة المصروفات" },
                  { icon: "🍽️", title: "الكافتيريا", desc: "طلب وجبات صحية" }
                ] : [
                  { icon: "📚", title: "Grades", desc: "Track academic performance" },
                  { icon: "🚌", title: "Bus", desc: "Track your children's bus" },
                  { icon: "💰", title: "Wallet", desc: "Manage expenses" },
                  { icon: "🍽️", title: "Canteen", desc: "Order healthy meals" }
                ]).map((item, i) => (
                  <div key={i} className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-6 hover:shadow-glow transition-all hover:scale-105">
                    <div className="text-5xl mb-3">{item.icon}</div>
                    <h4 className="text-lg font-bold text-foreground mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bus Tracking */}
            <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">1</span>
                {isArabic ? "تتبع الحافلة" : "Bus Tracking"}
              </h3>

              <div className="space-y-6">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {isArabic
                    ? "نظام تتبع متطور يوفر راحة البال من خلال معرفة الموقع الدقيق للحافلة في الوقت الفعلي."
                    : "Advanced tracking system provides peace of mind through real-time accurate bus location."
                  }
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6">
                    <h4 className="text-xl font-bold text-foreground mb-4">
                      {isArabic ? "المعلومات المتاحة" : "Available Information"}
                    </h4>
                    <ul className="space-y-3">
                      {(isArabic ? [
                        "الموقع الحالي على الخريطة",
                        "الوقت المتوقع للوصول",
                        "المحطة التالية",
                        "سرعة الحافلة الحالية",
                        "حالة الصعود والنزول"
                      ] : [
                        "Current location on map",
                        "Estimated arrival time",
                        "Next stop",
                        "Current bus speed",
                        "Boarding/drop-off status"
                      ]).map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6">
                    <h4 className="text-xl font-bold text-foreground mb-4">
                      {isArabic ? "التنبيهات التلقائية" : "Automatic Alerts"}
                    </h4>
                    <div className="space-y-3">
                      {(isArabic ? [
                        "عند صعود الطالب إلى الحافلة",
                        "عند اقتراب الحافلة من المنزل",
                        "عند نزول الطالب من الحافلة",
                        "في حالة أي تأخير غير متوقع"
                      ] : [
                        "When student boards the bus",
                        "When bus approaches home",
                        "When student gets off the bus",
                        "In case of unexpected delay"
                      ]).map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-background/50 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-bold">!</span>
                          </div>
                          <span className="text-foreground text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Digital Wallet */}
            <div className="bg-gradient-to-br from-secondary/5 to-transparent border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">2</span>
                {isArabic ? "المحفظة الرقمية" : "Digital Wallet"}
              </h3>

              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {(isArabic ? [
                    { icon: "💳", title: "إضافة رصيد", desc: "شحن المحفظة بسهولة" },
                    { icon: "📊", title: "السجل المالي", desc: "عرض جميع المعاملات" },
                    { icon: "🔔", title: "تنبيهات الرصيد", desc: "إشعار عند انخفاض الرصيد" }
                  ] : [
                    { icon: "💳", title: "Add Balance", desc: "Top up wallet easily" },
                    { icon: "📊", title: "Transaction History", desc: "View all transactions" },
                    { icon: "🔔", title: "Balance Alerts", desc: "Notification on low balance" }
                  ]).map((item, i) => (
                    <div key={i} className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 hover:shadow-glow transition-all">
                      <div className="text-4xl mb-3">{item.icon}</div>
                      <h4 className="text-xl font-bold text-foreground mb-2">{item.title}</h4>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-foreground mb-4">
                    {isArabic ? "كيفية شحن المحفظة" : "How to Top Up Wallet"}
                  </h4>
                  <div className="space-y-3">
                    {(isArabic ? [
                      "افتح صفحة المحفظة من القائمة",
                      "اضغط على زر 'إضافة رصيد'",
                      "أدخل المبلغ المطلوب",
                      "اختر طريقة الدفع (بطاقة ائتمان/تحويل بنكي)",
                      "أكمل عملية الدفع بأمان"
                    ] : [
                      "Open wallet page from menu",
                      "Click 'Add Balance' button",
                      "Enter desired amount",
                      "Choose payment method (credit card/bank transfer)",
                      "Complete secure payment"
                    ]).map((step, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-muted-foreground pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Canteen Orders */}
            <div className="bg-gradient-to-br from-primary/5 to-transparent border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">3</span>
                {isArabic ? "طلب الوجبات" : "Meal Orders"}
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-foreground mb-4">
                    {isArabic ? "خطوات الطلب" : "Order Steps"}
                  </h4>
                  <div className="space-y-3">
                    {(isArabic ? [
                      "تصفح قائمة الوجبات المتاحة",
                      "اختر الوجبة المناسبة",
                      "حدد الكمية ووقت التقديم",
                      "أضف أي ملاحظات خاصة",
                      "أكد الطلب والدفع من المحفظة"
                    ] : [
                      "Browse available meals menu",
                      "Choose suitable meal",
                      "Select quantity and serving time",
                      "Add special notes",
                      "Confirm order and pay from wallet"
                    ]).map((step, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-muted-foreground pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-foreground mb-4">
                    {isArabic ? "التحكم الأبوي" : "Parental Control"}
                  </h4>
                  <div className="space-y-3">
                    {(isArabic ? [
                      "تحديد حد يومي للإنفاق",
                      "اختيار الأصناف المسموحة",
                      "منع أصناف معينة",
                      "عرض سجل الطلبات السابقة"
                    ] : [
                      "Set daily spending limit",
                      "Choose allowed items",
                      "Block specific items",
                      "View order history"
                    ]).map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-background/50 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span className="text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Guide */}
      <section className="min-h-screen p-8 page-break">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="text-6xl">🎓</div>
            <div>
              <div className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">05</div>
              <h2 className="text-5xl font-bold text-foreground">
                {isArabic ? "دليل الطالب" : "Student Guide"}
              </h2>
            </div>
          </div>

          <div className="space-y-12">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6">
                {isArabic ? "الصفحة الرئيسية" : "Home Page"}
              </h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(isArabic ? [
                  { icon: "📚", title: "الدرجات", desc: "عرض نتائجك الدراسية" },
                  { icon: "📝", title: "الواجبات", desc: "متابعة الواجبات المنزلية" },
                  { icon: "🗓️", title: "الجدول", desc: "جدول الحصص اليومي" },
                  { icon: "💰", title: "المحفظة", desc: "رصيدك المتاح" }
                ] : [
                  { icon: "📚", title: "Grades", desc: "View your academic results" },
                  { icon: "📝", title: "Homework", desc: "Track homework" },
                  { icon: "🗓️", title: "Schedule", desc: "Daily class schedule" },
                  { icon: "💰", title: "Wallet", desc: "Available balance" }
                ]).map((item, i) => (
                  <div key={i} className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-6 hover:shadow-glow transition-all hover:scale-105">
                    <div className="text-5xl mb-3">{item.icon}</div>
                    <h4 className="text-lg font-bold text-foreground mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Using NFC Card */}
            <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">1</span>
                {isArabic ? "استخدام بطاقة NFC" : "Using NFC Card"}
              </h3>

              <div className="space-y-6">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {isArabic
                    ? "بطاقة NFC الخاصة بك هي مفتاحك لجميع خدمات المدرسة. احتفظ بها دائماً معك."
                    : "Your NFC card is your key to all school services. Always keep it with you."
                  }
                </p>

                <div className="grid md:grid-cols-3 gap-6">
                  {(isArabic ? [
                    { icon: "🚪", title: "دخول المدرسة", desc: "مرر البطاقة عند البوابة" },
                    { icon: "🚌", title: "الحافلة", desc: "مرر عند الصعود والنزول" },
                    { icon: "🍽️", title: "الكافتيريا", desc: "استخدمها للدفع" }
                  ] : [
                    { icon: "🚪", title: "School Entry", desc: "Tap card at gate" },
                    { icon: "🚌", title: "Bus", desc: "Tap when boarding/exiting" },
                    { icon: "🍽️", title: "Canteen", desc: "Use for payment" }
                  ]).map((item, i) => (
                    <div key={i} className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 hover:shadow-glow transition-all">
                      <div className="text-4xl mb-3">{item.icon}</div>
                      <h4 className="text-xl font-bold text-foreground mb-2">{item.title}</h4>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-foreground mb-4">
                    {isArabic ? "نصائح مهمة" : "Important Tips"}
                  </h4>
                  <ul className="space-y-3">
                    {(isArabic ? [
                      "احتفظ بالبطاقة في مكان آمن",
                      "لا تشارك بطاقتك مع أحد",
                      "أبلغ المدرسة فوراً في حالة الفقدان",
                      "نظف البطاقة بقطعة قماش ناعمة عند الحاجة"
                    ] : [
                      "Keep card in safe place",
                      "Don't share your card",
                      "Report loss immediately",
                      "Clean card with soft cloth when needed"
                    ]).map((tip, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                        <span className="text-muted-foreground">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Canteen Ordering */}
            <div className="bg-gradient-to-br from-secondary/5 to-transparent border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">2</span>
                {isArabic ? "الطلب من الكافتيريا" : "Ordering from Canteen"}
              </h3>

              <div className="space-y-6">
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-foreground mb-4">
                    {isArabic ? "كيفية الطلب" : "How to Order"}
                  </h4>
                  <div className="space-y-3">
                    {(isArabic ? [
                      "افتح تطبيق المدرسة على هاتفك",
                      "اذهب إلى قسم الكافتيريا",
                      "اختر الأصناف التي تريدها",
                      "تأكد من رصيد محفظتك",
                      "أكد الطلب واستلمه من الكافتيريا"
                    ] : [
                      "Open school app on phone",
                      "Go to canteen section",
                      "Choose items you want",
                      "Check your wallet balance",
                      "Confirm order and collect from canteen"
                    ]).map((step, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-muted-foreground pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-primary/10 to-transparent rounded-2xl p-6">
                    <h4 className="text-xl font-bold text-foreground mb-4">
                      {isArabic ? "الطلب المباشر" : "Direct Order"}
                    </h4>
                    <p className="text-muted-foreground">
                      {isArabic
                        ? "يمكنك أيضاً الطلب مباشرة من الكافتيريا باستخدام بطاقة NFC الخاصة بك والدفع من محفظتك."
                        : "You can also order directly from canteen using your NFC card and pay from wallet."
                      }
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-secondary/10 to-transparent rounded-2xl p-6">
                    <h4 className="text-xl font-bold text-foreground mb-4">
                      {isArabic ? "القيود الأبوية" : "Parental Limits"}
                    </h4>
                    <p className="text-muted-foreground">
                      {isArabic
                        ? "انتبه إلى أن والديك قد يضعون حدوداً يومية أو يمنعون بعض الأصناف."
                        : "Note that your parents may set daily limits or block certain items."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Driver Guide */}
      <section className="min-h-screen p-8 page-break">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="text-6xl">🚌</div>
            <div>
              <div className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">06</div>
              <h2 className="text-5xl font-bold text-foreground">
                {isArabic ? "دليل السائق" : "Driver Guide"}
              </h2>
            </div>
          </div>

          <div className="space-y-12">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6">
                {isArabic ? "المهام الأساسية" : "Main Tasks"}
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {(isArabic ? [
                  { icon: "✅", title: "تسجيل الصعود", desc: "مسح بطاقات الطلاب عند الصعود" },
                  { icon: "📍", title: "تحديث الموقع", desc: "الموقع يتم تحديثه تلقائياً" },
                  { icon: "❌", title: "تسجيل النزول", desc: "مسح البطاقات عند النزول" },
                  { icon: "🚨", title: "الحالات الطارئة", desc: "التواصل الفوري مع الإدارة" }
                ] : [
                  { icon: "✅", title: "Boarding", desc: "Scan student cards when boarding" },
                  { icon: "📍", title: "Location", desc: "Location updates automatically" },
                  { icon: "❌", title: "Drop-off", desc: "Scan cards when exiting" },
                  { icon: "🚨", title: "Emergencies", desc: "Instant communication with admin" }
                ]).map((task, i) => (
                  <div key={i} className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-6 hover:shadow-glow transition-all">
                    <div className="text-5xl mb-3">{task.icon}</div>
                    <h4 className="text-xl font-bold text-foreground mb-2">{task.title}</h4>
                    <p className="text-muted-foreground">{task.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent border border-border/50 rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">1</span>
                {isArabic ? "بداية الرحلة" : "Starting Trip"}
              </h3>

              <div className="space-y-6">
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-foreground mb-4">
                    {isArabic ? "الخطوات قبل التحرك" : "Steps Before Departure"}
                  </h4>
                  <div className="space-y-3">
                    {(isArabic ? [
                      "تأكد من جهوز الحافلة وسلامتها",
                      "افتح تطبيق السائق على الهاتف",
                      "اضغط على 'بدء الرحلة'",
                      "تأكد من تفعيل تتبع الموقع",
                      "راجع قائمة الطلاب المتوقعين"
                    ] : [
                      "Ensure bus is ready and safe",
                      "Open driver app on phone",
                      "Click 'Start Trip'",
                      "Ensure location tracking is on",
                      "Review expected student list"
                    ]).map((step, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-muted-foreground pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6">
                    <h4 className="text-xl font-bold text-foreground mb-4">
                      {isArabic ? "تسجيل الصعود" : "Boarding Registration"}
                    </h4>
                    <ul className="space-y-2">
                      {(isArabic ? [
                        "اطلب من الطالب تمرير البطاقة",
                        "تأكد من ظهور اسم الطالب",
                        "تحقق من المقعد المخصص",
                        "أبلغ عن أي طالب غائب"
                      ] : [
                        "Ask student to tap card",
                        "Confirm student name appears",
                        "Check assigned seat",
                        "Report any absent student"
                      ]).map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6">
                    <h4 className="text-xl font-bold text-foreground mb-4">
                      {isArabic ? "تسجيل النزول" : "Drop-off Registration"}
                    </h4>
                    <ul className="space-y-2">
                      {(isArabic ? [
                        "اطلب من الطالب تمرير البطاقة",
                        "تأكد من وجود ولي الأمر",
                        "انتظر تأكيد النزول",
                        "تابع إلى المحطة التالية"
                      ] : [
                        "Ask student to tap card",
                        "Ensure parent is present",
                        "Wait for drop-off confirmation",
                        "Continue to next stop"
                      ]).map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="min-h-screen p-8 page-break">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">08</div>
            <h2 className="text-5xl font-bold text-foreground">
              {isArabic ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </h2>
          </div>

          <div className="space-y-6">
            {(isArabic ? [
              {
                q: "ماذا أفعل إذا فقدت بطاقة NFC؟",
                a: "اتصل بالإدارة فوراً لإيقاف البطاقة وإصدار بطاقة جديدة. يمكن نقل رصيد المحفظة إلى البطاقة الجديدة."
              },
              {
                q: "كيف أغير كلمة المرور؟",
                a: "اذهب إلى الإعدادات > الحساب > تغيير كلمة المرور. ستحتاج لإدخال كلمة المرور الحالية أولاً."
              },
              {
                q: "هل يمكنني استرجاع المبلغ من المحفظة؟",
                a: "نعم، يمكنك طلب استرداد الرصيد المتبقي من الإدارة في نهاية العام الدراسي."
              },
              {
                q: "كيف أتواصل مع معلم ابني؟",
                a: "يمكنك إرسال رسالة مباشرة من خلال قسم الرسائل في التطبيق."
              },
              {
                q: "ماذا لو لم تصلني إشعارات الحافلة؟",
                a: "تأكد من تفعيل الإشعارات في إعدادات التطبيق وإعدادات الهاتف."
              }
            ] : [
              {
                q: "What if I lose my NFC card?",
                a: "Contact admin immediately to deactivate card and issue new one. Wallet balance can be transferred to new card."
              },
              {
                q: "How do I change my password?",
                a: "Go to Settings > Account > Change Password. You'll need to enter current password first."
              },
              {
                q: "Can I get refund from wallet?",
                a: "Yes, you can request refund of remaining balance from admin at end of school year."
              },
              {
                q: "How do I contact my child's teacher?",
                a: "You can send direct message through Messages section in the app."
              },
              {
                q: "What if I don't receive bus notifications?",
                a: "Ensure notifications are enabled in app settings and phone settings."
              }
            ]).map((faq, i) => (
              <div key={i} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-elegant transition-all">
                <h4 className="text-xl font-bold text-foreground mb-3 flex items-start gap-3">
                  <span className="text-primary flex-shrink-0">Q:</span>
                  <span>{faq.q}</span>
                </h4>
                <p className="text-muted-foreground pl-8">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-3xl p-8 border border-primary/30 text-center">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              {isArabic ? "هل تحتاج المزيد من المساعدة؟" : "Need More Help?"}
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              {isArabic
                ? "فريق الدعم متواجد دائماً لمساعدتك"
                : "Our support team is always here to help"
              }
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 min-w-[200px]">
                <div className="text-2xl mb-2">📧</div>
                <p className="text-sm text-muted-foreground">support@talebedu.com</p>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 min-w-[200px]">
                <div className="text-2xl mb-2">📞</div>
                <p className="text-sm text-muted-foreground">+966 XX XXX XXXX</p>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 min-w-[200px]">
                <div className="text-2xl mb-2">💬</div>
                <p className="text-sm text-muted-foreground">{isArabic ? "الدعم الفوري" : "Live Support"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Thank You Page */}
      <section className="min-h-screen flex items-center justify-center p-8 page-break">
        <div className="text-center max-w-4xl">
          <img 
            src={logo} 
            alt="TalebEdu Logo" 
            className="w-32 h-32 mx-auto mb-8 animate-float"
          />
          <h2 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-6">
            {isArabic ? "شكراً لاستخدام TalebEdu" : "Thank You for Using TalebEdu"}
          </h2>
          <p className="text-2xl text-muted-foreground mb-8">
            {isArabic
              ? "نحن سعداء بخدمتكم ونسعى دائماً للأفضل"
              : "We're happy to serve you and always strive for excellence"
            }
          </p>
          <div className="h-1 w-32 mx-auto bg-gradient-primary rounded-full"></div>
        </div>
      </section>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          .no-print {
            display: none !important;
          }
          
          .page-break {
            page-break-before: always;
            break-before: page;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .animate-float,
          .animate-fade-in {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PresentationManual;