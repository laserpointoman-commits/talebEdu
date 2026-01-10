import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap, 
  Shield, 
  Wallet,
  Bus,
  Users,
  TrendingUp,
  Building2,
  Server,
  Monitor,
  Briefcase,
  Target,
  CheckCircle2,
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  Rocket,
  Award,
  Globe,
  Smartphone,
  CreditCard,
  Bell,
  MapPin,
  Clock,
  Utensils,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const InvestorPresentation = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    // Slide 1: Cover
    {
      id: "cover",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-8" dir="rtl">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <img 
              src="/app-icon.jpg" 
              alt="TalebEdu Logo" 
              className="w-40 h-40 rounded-3xl shadow-2xl mx-auto"
            />
          </motion.div>
          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold bg-gradient-to-l from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-6"
          >
            طالب إيدو
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-2xl md:text-3xl text-muted-foreground mb-8"
          >
            مستقبل الإدارة المدرسية الذكية
          </motion.p>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="bg-gradient-to-l from-amber-500 to-orange-500 text-white px-8 py-4 rounded-2xl text-xl font-bold shadow-lg"
          >
            عرض استثماري - 200,000 ريال عماني
          </motion.div>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="text-lg text-muted-foreground mt-8"
          >
            يناير 2026
          </motion.p>
        </div>
      )
    },
    // Slide 2: Problem
    {
      id: "problem",
      content: (
        <div className="flex flex-col h-full px-8 py-12" dir="rtl">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-bold text-destructive mb-8 text-center"
          >
            المشكلة التي نحلها
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {[
              { icon: Clock, title: "إهدار الوقت", desc: "ساعات طويلة في العمليات الورقية والإدارية اليدوية" },
              { icon: Users, title: "صعوبة التواصل", desc: "فجوة كبيرة بين المدرسة وأولياء الأمور" },
              { icon: Shield, title: "مخاوف أمنية", desc: "غياب نظام متابعة موحد لسلامة الطلاب" },
              { icon: Wallet, title: "إدارة مالية صعبة", desc: "تعقيد في تتبع الرسوم والمصروفات" },
              { icon: Bus, title: "قلق النقل", desc: "عدم معرفة موقع الطالب أثناء التنقل" },
              { icon: BookOpen, title: "تتبع الأداء", desc: "صعوبة متابعة التقدم الأكاديمي بشكل فوري" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex items-start gap-4"
              >
                <div className="bg-destructive/20 p-3 rounded-xl">
                  <item.icon className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    // Slide 3: Solution
    {
      id: "solution",
      content: (
        <div className="flex flex-col h-full px-8 py-12" dir="rtl">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-bold text-primary mb-8 text-center"
          >
            الحل: طالب إيدو
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-center text-muted-foreground mb-8"
          >
            منصة متكاملة تجمع كل احتياجات المدرسة في تطبيق واحد
          </motion.p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
            {[
              { icon: CreditCard, title: "بطاقة NFC ذكية", color: "from-blue-500 to-cyan-500" },
              { icon: MapPin, title: "تتبع GPS مباشر", color: "from-green-500 to-emerald-500" },
              { icon: Wallet, title: "محفظة إلكترونية", color: "from-purple-500 to-pink-500" },
              { icon: Bell, title: "إشعارات فورية", color: "from-orange-500 to-amber-500" },
              { icon: Utensils, title: "إدارة المقصف", color: "from-red-500 to-rose-500" },
              { icon: Bus, title: "تتبع الحافلات", color: "from-indigo-500 to-violet-500" },
              { icon: GraduationCap, title: "إدارة الدرجات", color: "from-teal-500 to-cyan-500" },
              { icon: Users, title: "تواصل مباشر", color: "from-pink-500 to-fuchsia-500" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 text-white text-center shadow-lg`}
              >
                <item.icon className="w-10 h-10 mx-auto mb-3" />
                <p className="font-bold text-sm">{item.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    // Slide 4: Market Opportunity
    {
      id: "market",
      content: (
        <div className="flex flex-col h-full px-8 py-12" dir="rtl">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-bold text-primary mb-8 text-center"
          >
            فرصة السوق
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {[
              { value: "1,200+", label: "مدرسة في سلطنة عمان", icon: Building2 },
              { value: "700,000+", label: "طالب وطالبة", icon: Users },
              { value: "$50M+", label: "حجم السوق المتوقع", icon: TrendingUp }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.2 }}
                className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 text-center"
              >
                <item.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-4xl font-bold text-primary mb-2">{item.value}</h3>
                <p className="text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="bg-gradient-to-l from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6 text-center"
          >
            <Globe className="w-10 h-10 mx-auto mb-4 text-green-600" />
            <h3 className="text-2xl font-bold text-green-600 mb-2">إمكانية التوسع الإقليمي</h3>
            <p className="text-muted-foreground">دول الخليج العربي والشرق الأوسط - سوق يتجاوز 15 مليون طالب</p>
          </motion.div>
        </div>
      )
    },
    // Slide 5: Business Model
    {
      id: "business-model",
      content: (
        <div className="flex flex-col h-full px-8 py-12" dir="rtl">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-bold text-primary mb-8 text-center"
          >
            نموذج العمل والإيرادات
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6"
            >
              <DollarSign className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">اشتراك شهري للمدارس</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>مدرسة صغيرة (حتى 300 طالب)</span>
                  <span className="font-bold text-blue-600">150 ر.ع/شهر</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>مدرسة متوسطة (300-800 طالب)</span>
                  <span className="font-bold text-blue-600">300 ر.ع/شهر</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>مدرسة كبيرة (800+ طالب)</span>
                  <span className="font-bold text-blue-600">500 ر.ع/شهر</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6"
            >
              <CreditCard className="w-10 h-10 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">بيع بطاقات NFC</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>سعر البطاقة للمدرسة</span>
                  <span className="font-bold text-green-600">2 ر.ع</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>سعر البيع لولي الأمر</span>
                  <span className="font-bold text-green-600">5 ر.ع</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>الربح لكل بطاقة</span>
                  <span className="font-bold text-green-600">3 ر.ع</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6"
            >
              <Wallet className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">عمولة المحفظة</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>عمولة الشحن</span>
                  <span className="font-bold text-purple-600">2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>متوسط الشحن الشهري/طالب</span>
                  <span className="font-bold text-purple-600">20 ر.ع</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-6"
            >
              <Monitor className="w-10 h-10 text-orange-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">بيع الأجهزة</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>جهاز NFC للبوابات</span>
                  <span className="font-bold text-orange-600">250 ر.ع</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>تابلت للمقصف</span>
                  <span className="font-bold text-orange-600">150 ر.ع</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )
    },
    // Slide 6: Investment Usage
    {
      id: "investment-usage",
      content: (
        <div className="flex flex-col h-full px-8 py-12" dir="rtl">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-bold text-primary mb-8 text-center"
          >
            توزيع الاستثمار - 200,000 ر.ع
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { 
                title: "تأسيس الشركة والتراخيص", 
                amount: "15,000", 
                percent: 7.5,
                icon: Briefcase,
                items: ["تسجيل الشركة", "التراخيص التجارية", "الاستشارات القانونية", "العلامة التجارية"]
              },
              { 
                title: "المكتب والتجهيزات", 
                amount: "35,000", 
                percent: 17.5,
                icon: Building2,
                items: ["إيجار مكتب (سنة)", "أثاث مكتبي", "أجهزة كمبيوتر", "معدات اجتماعات"]
              },
              { 
                title: "غرفة الخوادم والبنية التحتية", 
                amount: "45,000", 
                percent: 22.5,
                icon: Server,
                items: ["خوادم عالية الأداء", "نظام تبريد", "UPS وحماية", "شبكات وأمان"]
              },
              { 
                title: "معدات المدارس", 
                amount: "40,000", 
                percent: 20,
                icon: Monitor,
                items: ["أجهزة NFC", "تابلتات", "طابعات البطاقات", "بطاقات NFC"]
              },
              { 
                title: "الرواتب والتوظيف", 
                amount: "50,000", 
                percent: 25,
                icon: Users,
                items: ["مدير تقني", "مطورين", "مبيعات وتسويق", "دعم فني"]
              },
              { 
                title: "التسويق والمبيعات", 
                amount: "15,000", 
                percent: 7.5,
                icon: TrendingUp,
                items: ["حملات إعلانية", "معارض تعليمية", "مواد ترويجية", "موقع إلكتروني"]
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-card border rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-bold">{item.amount} ر.ع</span>
                      <span className="text-xs text-muted-foreground">({item.percent}%)</span>
                    </div>
                  </div>
                </div>
                <Progress value={item.percent} className="h-2 mb-3" />
                <div className="flex flex-wrap gap-2">
                  {item.items.map((subItem, i) => (
                    <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full">{subItem}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    // Slide 7: Financial Projections
    {
      id: "projections",
      content: (
        <div className="flex flex-col h-full px-8 py-12" dir="rtl">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-bold text-primary mb-8 text-center"
          >
            التوقعات المالية - 3 سنوات
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { 
                year: "السنة الأولى", 
                schools: "20", 
                students: "8,000",
                revenue: "180,000",
                status: "نمو"
              },
              { 
                year: "السنة الثانية", 
                schools: "60", 
                students: "25,000",
                revenue: "540,000",
                status: "توسع"
              },
              { 
                year: "السنة الثالثة", 
                schools: "150", 
                students: "60,000",
                revenue: "1,350,000",
                status: "ريادة"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.2 }}
                className={`rounded-2xl p-6 text-center ${
                  index === 2 
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white' 
                    : 'bg-card border'
                }`}
              >
                <Calendar className={`w-10 h-10 mx-auto mb-4 ${index === 2 ? 'text-white' : 'text-primary'}`} />
                <h3 className="text-2xl font-bold mb-4">{item.year}</h3>
                <div className="space-y-3">
                  <div>
                    <p className={`text-3xl font-bold ${index === 2 ? 'text-white' : 'text-primary'}`}>{item.schools}</p>
                    <p className={`text-sm ${index === 2 ? 'text-white/80' : 'text-muted-foreground'}`}>مدرسة</p>
                  </div>
                  <div>
                    <p className={`text-3xl font-bold ${index === 2 ? 'text-white' : 'text-green-600'}`}>{item.students}</p>
                    <p className={`text-sm ${index === 2 ? 'text-white/80' : 'text-muted-foreground'}`}>طالب</p>
                  </div>
                  <div className={`pt-3 border-t ${index === 2 ? 'border-white/20' : 'border-border'}`}>
                    <p className={`text-3xl font-bold ${index === 2 ? 'text-white' : 'text-amber-600'}`}>{item.revenue}</p>
                    <p className={`text-sm ${index === 2 ? 'text-white/80' : 'text-muted-foreground'}`}>ر.ع إيرادات</p>
                  </div>
                </div>
                <div className={`mt-4 px-4 py-2 rounded-full ${
                  index === 2 ? 'bg-white/20' : 'bg-primary/10'
                }`}>
                  <span className={`font-bold ${index === 2 ? 'text-white' : 'text-primary'}`}>{item.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="bg-gradient-to-l from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6"
          >
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600">575%</p>
                <p className="text-muted-foreground">العائد على الاستثمار (3 سنوات)</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600">18 شهر</p>
                <p className="text-muted-foreground">نقطة التعادل</p>
              </div>
            </div>
          </motion.div>
        </div>
      )
    },
    // Slide 8: Competitive Advantages
    {
      id: "advantages",
      content: (
        <div className="flex flex-col h-full px-8 py-12" dir="rtl">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-bold text-primary mb-8 text-center"
          >
            مميزاتنا التنافسية
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {[
              { 
                icon: Smartphone, 
                title: "تطبيق جاهز ومكتمل", 
                desc: "التطبيق تم تطويره بالكامل وجاهز للإطلاق فوراً",
                color: "from-blue-500 to-cyan-500"
              },
              { 
                icon: Award, 
                title: "حل متكامل وشامل", 
                desc: "نظام واحد يغطي جميع احتياجات المدرسة بدلاً من أنظمة متعددة",
                color: "from-purple-500 to-pink-500"
              },
              { 
                icon: Shield, 
                title: "تقنية NFC متقدمة", 
                desc: "تتبع دقيق وآمن للطلاب في جميع الأوقات",
                color: "from-green-500 to-emerald-500"
              },
              { 
                icon: Globe, 
                title: "دعم عربي كامل", 
                desc: "واجهة عربية متكاملة تناسب السوق المحلي",
                color: "from-orange-500 to-amber-500"
              },
              { 
                icon: Target, 
                title: "أول في السوق", 
                desc: "لا يوجد منافس محلي يقدم نفس الحل المتكامل",
                color: "from-red-500 to-rose-500"
              },
              { 
                icon: TrendingUp, 
                title: "قابلية التوسع", 
                desc: "بنية تقنية جاهزة للتوسع الإقليمي والعالمي",
                color: "from-indigo-500 to-violet-500"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-card border rounded-2xl p-6 flex items-start gap-4"
              >
                <div className={`bg-gradient-to-br ${item.color} p-3 rounded-xl`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    // Slide 9: Roadmap
    {
      id: "roadmap",
      content: (
        <div className="flex flex-col h-full px-8 py-12" dir="rtl">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-bold text-primary mb-8 text-center"
          >
            خطة التنفيذ
          </motion.h2>
          <div className="relative flex-1">
            <div className="absolute right-6 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary to-primary/30 rounded-full" />
            <div className="space-y-6">
              {[
                { 
                  phase: "الشهر 1-2", 
                  title: "التأسيس", 
                  tasks: ["تسجيل الشركة", "تأجير المكتب", "توظيف الفريق الأساسي"],
                  status: "start"
                },
                { 
                  phase: "الشهر 3-4", 
                  title: "البنية التحتية", 
                  tasks: ["تجهيز غرفة الخوادم", "شراء المعدات", "إعداد الأنظمة"],
                  status: "progress"
                },
                { 
                  phase: "الشهر 5-6", 
                  title: "الإطلاق التجريبي", 
                  tasks: ["5 مدارس تجريبية", "جمع التغذية الراجعة", "تحسين النظام"],
                  status: "progress"
                },
                { 
                  phase: "الشهر 7-12", 
                  title: "التوسع", 
                  tasks: ["إطلاق رسمي", "استهداف 20 مدرسة", "بناء فريق المبيعات"],
                  status: "future"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.15 }}
                  className="flex gap-4 mr-3"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 ${
                    item.status === 'start' ? 'bg-green-500' :
                    item.status === 'progress' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 bg-card border rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                        {item.phase}
                      </span>
                      <h3 className="font-bold text-lg">{item.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.tasks.map((task, i) => (
                        <span key={i} className="text-sm bg-muted px-3 py-1 rounded-full">
                          {task}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    // Slide 10: Investment Offer
    {
      id: "offer",
      content: (
        <div className="flex flex-col h-full px-8 py-12" dir="rtl">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-bold text-primary mb-8 text-center"
          >
            عرض الاستثمار
          </motion.h2>
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-8 text-white text-center mb-8"
            >
              <DollarSign className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-5xl font-bold mb-2">200,000 ر.ع</h3>
              <p className="text-2xl opacity-90">مقابل 25% من الشركة</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: PieChart, title: "حصة المستثمر", value: "25%", desc: "من أرباح الشركة" },
                { icon: BarChart3, title: "العائد المتوقع", value: "575%", desc: "خلال 3 سنوات" },
                { icon: Rocket, title: "قيمة الشركة", value: "800,000 ر.ع", desc: "التقييم الحالي" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="bg-card border rounded-2xl p-6 text-center"
                >
                  <item.icon className="w-10 h-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-3xl font-bold text-primary mb-1">{item.value}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    // Slide 11: Call to Action
    {
      id: "cta",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-8" dir="rtl">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <img 
              src="/app-icon.jpg" 
              alt="TalebEdu Logo" 
              className="w-32 h-32 rounded-3xl shadow-2xl mx-auto"
            />
          </motion.div>
          <motion.h2
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold text-primary mb-6"
          >
            انضم إلى مستقبل التعليم
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-muted-foreground mb-8 max-w-2xl"
          >
            فرصة استثمارية فريدة في قطاع التقنية التعليمية المتنامي
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-4 text-lg">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <span>تطبيق جاهز للإطلاق</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-lg">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <span>سوق كبير وغير مستغل</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-lg">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <span>عوائد مجزية متوقعة</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-12 bg-gradient-to-l from-primary to-blue-600 text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-xl"
          >
            هل أنت مستعد لتكون شريكنا في النجاح؟
          </motion.div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={(currentSlide / (slides.length - 1)) * 100} className="h-1 rounded-none" />
      </div>

      {/* Slide content */}
      <div className="flex-1 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {slides[currentSlide].content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </Button>
          
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-primary w-6' 
                    : 'bg-muted hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="gap-2"
          >
            التالي
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Slide counter */}
      <div className="fixed bottom-20 left-4 text-sm text-muted-foreground">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
};

export default InvestorPresentation;
