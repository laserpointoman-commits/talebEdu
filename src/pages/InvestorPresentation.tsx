import { useState, useEffect } from "react";
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
  Calendar,
  PieChart,
  BarChart3,
  Rocket,
  Award,
  Globe,
  Smartphone,
  Bell,
  MapPin,
  Clock,
  Utensils,
  BookOpen,
  Watch,
  ShoppingBag,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Floating particle component
const FloatingParticle = ({ delay, duration, x, y, size }: { delay: number; duration: number; x: number; y: number; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-gradient-to-r from-primary/40 to-accent/40"
    style={{ width: size, height: size }}
    initial={{ x, y, opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 1, 0],
      scale: [0, 1, 1, 0],
      y: [y, y - 200],
      x: [x, x + (Math.random() - 0.5) * 100]
    }}
    transition={{
      duration,
      delay,
      ease: "easeOut"
    }}
  />
);

// Intro Animation Component
const IntroAnimation = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 5500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: 2 + Math.random() * 1.5,
    duration: 2 + Math.random(),
    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
    y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 50,
    size: 4 + Math.random() * 12
  }));

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated background circles */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full border border-primary/10"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.2 }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full border border-primary/20"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.3, delay: 0.4 }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full border border-primary/30"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.1, delay: 0.6 }}
      />
      
      {/* Floating particles */}
      {particles.map((particle) => (
        <FloatingParticle key={particle.id} {...particle} />
      ))}

      {/* Spinning rings */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full border-2 border-dashed border-primary/30"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: 360 }}
        transition={{ duration: 4, delay: 0.5, ease: "linear", repeat: Infinity }}
      />
      <motion.div
        className="absolute w-[250px] h-[250px] rounded-full border-2 border-dotted border-accent/40"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: -360 }}
        transition={{ duration: 3, delay: 0.7, ease: "linear", repeat: Infinity }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Glowing backdrop */}
        <motion.div
          className="absolute -inset-32 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-3xl rounded-full"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.6, 0.4], scale: [0.5, 1.2, 1] }}
          transition={{ duration: 2, delay: 0.3 }}
        />

        {/* Logo with dramatic entrance */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0, rotateY: 180 }}
          animate={{ scale: 1, rotateY: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 20, 
            delay: 0.8 
          }}
        >
          {/* Logo glow effect */}
          <motion.div
            className="absolute -inset-4 bg-primary/30 rounded-3xl blur-xl"
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.img 
            src="/app-icon.jpg" 
            alt="TalebEdu Logo" 
            className="w-32 h-32 md:w-40 md:h-40 rounded-3xl shadow-2xl relative z-10"
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(var(--primary), 0.3)",
                "0 0 60px rgba(var(--primary), 0.5)",
                "0 0 20px rgba(var(--primary), 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Sparkle effects around logo */}
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${angle}deg) translateY(-80px)`
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
              transition={{ duration: 1.5, delay: 1.5 + i * 0.15, repeat: Infinity, repeatDelay: 1 }}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
            </motion.div>
          ))}
        </motion.div>

        {/* Title with letter-by-letter animation */}
        <motion.div className="relative mb-4" dir="ltr">
          <motion.h1
            className="text-5xl md:text-7xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            {"TalebEdu".split("").map((letter, i) => (
              <motion.span
                key={i}
                className="inline-block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto]"
                initial={{ opacity: 0, y: 50, rotateX: -90 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  rotateX: 0,
                  backgroundPosition: ["0% center", "200% center"]
                }}
                transition={{ 
                  opacity: { delay: 1.3 + i * 0.08, duration: 0.5 },
                  y: { delay: 1.3 + i * 0.08, duration: 0.5 },
                  rotateX: { delay: 1.3 + i * 0.08, duration: 0.5 },
                  backgroundPosition: { delay: 2.5, duration: 3, repeat: Infinity }
                }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.h1>
          
          {/* Underline animation */}
          <motion.div
            className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mt-2"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 2.2, duration: 0.8 }}
          />
        </motion.div>

        {/* Arabic tagline */}
        <motion.p
          className="text-xl md:text-2xl text-muted-foreground mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.6 }}
          dir="rtl"
        >
          مستقبل الإدارة المدرسية الذكية
        </motion.p>


        {/* Loading indicator */}
        <motion.div
          className="mt-12 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5 }}
        >
          <motion.div
            className="flex gap-1"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-primary rounded-full"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, delay: 4 + i * 0.15, repeat: Infinity }}
              />
            ))}
          </motion.div>
          <motion.span
            className="text-muted-foreground text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            جاري التحميل...
          </motion.span>
        </motion.div>
      </div>

      {/* Corner decorations */}
      <motion.div
        className="absolute top-10 left-10 w-20 h-20 border-l-2 border-t-2 border-primary/30 rounded-tl-3xl"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      />
      <motion.div
        className="absolute top-10 right-10 w-20 h-20 border-r-2 border-t-2 border-primary/30 rounded-tr-3xl"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      />
      <motion.div
        className="absolute bottom-10 left-10 w-20 h-20 border-l-2 border-b-2 border-primary/30 rounded-bl-3xl"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-20 h-20 border-r-2 border-b-2 border-primary/30 rounded-br-3xl"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      />
    </motion.div>
  );
};

const InvestorPresentation = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

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
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative inline-block mb-6"
          >
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              TalebEdu
            </h1>
            <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full -z-10" />
          </motion.div>
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
            className="relative"
          >
            {/* Glow effect */}
            <motion.div
              className="absolute -inset-3 bg-gradient-to-r from-amber-500/40 via-orange-500/50 to-amber-500/40 rounded-3xl blur-xl"
              animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.98, 1.02, 0.98] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 rounded-2xl blur-sm"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative bg-gradient-to-l from-amber-500 via-orange-500 to-amber-500 text-white px-10 py-5 rounded-2xl shadow-2xl overflow-hidden">
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12"
                animate={{ x: ["-200%", "200%"] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
              />
              <span className="relative text-xl md:text-2xl font-bold tracking-wide flex items-center gap-3 justify-center">
                <Sparkles className="w-6 h-6" />
                عرض استثماري
                <Sparkles className="w-6 h-6" />
              </span>
            </div>
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
            الحل: TalebEdu
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-center text-muted-foreground mb-8"
          >
            منصة متكاملة تجمع كل احتياجات المدرسة في تطبيق واحد
          </motion.p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
            {[
              { icon: Watch, title: "أساور NFC الذكية", color: "from-blue-500 to-cyan-500" },
              { icon: MapPin, title: "تتبع GPS مباشر", color: "from-green-500 to-emerald-500" },
              { icon: Wallet, title: "محفظة إلكترونية", color: "from-purple-500 to-pink-500" },
              { icon: Bell, title: "إشعارات فورية", color: "from-orange-500 to-amber-500" },
              { icon: Utensils, title: "إدارة المقصف", color: "from-red-500 to-rose-500" },
              { icon: Bus, title: "تتبع الحافلات", color: "from-indigo-500 to-violet-500" },
              { icon: GraduationCap, title: "إدارة الدرجات", color: "from-teal-500 to-cyan-500" },
              { icon: Users, title: "تواصل مباشر", color: "from-pink-500 to-fuchsia-500" },
              { icon: ShoppingBag, title: "متجر قرطاسية إلكتروني", color: "from-amber-500 to-yellow-500" }
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
              { value: "250,000+", label: "طالب وطالبة", icon: Users },
              { value: "20M+ ر.ع", label: "حجم السوق المتوقع", icon: TrendingUp }
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
    // Slide 5: Investment Usage (without prices)
    {
      id: "investment-usage",
      content: (
        <div className="flex flex-col h-full px-8 py-12" dir="rtl">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-bold text-primary mb-8 text-center"
          >
            توزيع الاستثمار
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { 
                title: "تأسيس الشركة والتراخيص", 
                percent: 7.5,
                icon: Briefcase,
                items: ["تسجيل الشركة", "التراخيص التجارية", "الاستشارات القانونية", "العلامة التجارية"]
              },
              { 
                title: "المكتب والتجهيزات", 
                percent: 17.5,
                icon: Building2,
                items: ["إيجار مكتب (سنة)", "أثاث مكتبي", "أجهزة كمبيوتر", "معدات اجتماعات"]
              },
              { 
                title: "غرفة الخوادم والبنية التحتية", 
                percent: 22.5,
                icon: Server,
                items: ["خوادم عالية الأداء", "نظام تبريد", "UPS وحماية", "شبكات وأمان"]
              },
              { 
                title: "معدات المدارس", 
                percent: 20,
                icon: Monitor,
                items: ["أجهزة NFC", "تابلتات", "طابعات الأساور", "أساور NFC"]
              },
              { 
                title: "الرواتب والتوظيف", 
                percent: 25,
                icon: Users,
                items: ["مدير تقني", "مطورين", "مبيعات وتسويق", "دعم فني"]
              },
              { 
                title: "التسويق والمبيعات", 
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
                    <span className="text-xs text-muted-foreground">({item.percent}%)</span>
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
    // Slide 6: Revenue Sources
    {
      id: "revenue",
      content: (
        <div className="flex flex-col h-full px-8 py-12" dir="rtl">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-bold text-primary mb-8 text-center"
          >
            مصادر الإيرادات
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6"
            >
              <GraduationCap className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">اشتراك الطلاب السنوي</h3>
              <div className="text-center">
                <p className="text-5xl font-bold text-blue-600 mb-2">25 ر.ع</p>
                <p className="text-muted-foreground">لكل طالب سنوياً</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6"
            >
              <Bus className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">اشتراك الحافلات السنوي</h3>
              <div className="text-center">
                <p className="text-5xl font-bold text-green-600 mb-2">100 ر.ع</p>
                <p className="text-muted-foreground">لكل حافلة سنوياً</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6"
            >
              <ShoppingBag className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">متجر القرطاسية</h3>
              <div className="text-center">
                <p className="text-5xl font-bold text-purple-600 mb-2">50 ر.ع</p>
                <p className="text-muted-foreground">متوسط الإنفاق لكل طالب سنوياً</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-6"
            >
              <Watch className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">أساور NFC الذكية</h3>
              <div className="text-center">
                <p className="text-5xl font-bold text-orange-600 mb-2">بيع</p>
                <p className="text-muted-foreground">أساور ذكية لكل طالب</p>
              </div>
            </motion.div>
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
                icon: Watch, 
                title: "أساور NFC ذكية", 
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
    // Slide 9: Roadmap (4 months)
    {
      id: "roadmap",
      content: (
        <div className="flex flex-col h-full px-8 py-12" dir="rtl">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-bold text-primary mb-8 text-center"
          >
            خطة التنفيذ - 4 أشهر
          </motion.h2>
          <div className="relative flex-1">
            <div className="absolute right-6 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary to-primary/30 rounded-full" />
            <div className="space-y-6">
              {[
                { 
                  phase: "الشهر 1", 
                  title: "التأسيس", 
                  tasks: ["تسجيل الشركة", "تأجير المكتب", "توظيف الفريق الأساسي", "التراخيص التجارية"],
                  status: "start"
                },
                { 
                  phase: "الشهر 2", 
                  title: "البنية التحتية", 
                  tasks: ["تجهيز غرفة الخوادم", "شراء المعدات", "إعداد الأنظمة", "تدريب الفريق"],
                  status: "progress"
                },
                { 
                  phase: "الشهر 3", 
                  title: "الإطلاق التجريبي", 
                  tasks: ["5 مدارس تجريبية", "جمع التغذية الراجعة", "تحسين النظام", "إعداد المواد التسويقية"],
                  status: "progress"
                },
                { 
                  phase: "الشهر 4", 
                  title: "الإطلاق الرسمي", 
                  tasks: ["إطلاق رسمي", "استهداف 20 مدرسة", "حملات تسويقية", "بناء فريق المبيعات"],
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
                    item.status === 'progress' ? 'bg-blue-500' : 'bg-amber-500'
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
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative inline-block mb-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              TalebEdu
            </h2>
            <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full -z-10" />
          </motion.div>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl text-primary mb-4"
          >
            انضم إلى مستقبل التعليم
          </motion.p>
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Intro Animation */}
      <AnimatePresence>
        {showIntro && (
          <IntroAnimation onComplete={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Progress bar */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <Progress value={(currentSlide / (slides.length - 1)) * 100} className="h-1 rounded-none" />
        </div>

        {/* Slide content */}
        <div className="flex-1 pt-4 pb-24">
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
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4" dir="ltr">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            التالي
          </Button>
          
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-primary w-6' 
                    : 'bg-muted hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="gap-2"
          >
            السابق
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      </div>
    </>
  );
};

export default InvestorPresentation;
