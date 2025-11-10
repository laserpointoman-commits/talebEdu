import { motion } from 'framer-motion';
import { Smartphone, CreditCard, Bus, BookOpen, Bell, Shield } from 'lucide-react';
import { FadeInView, ScaleInView } from '@/components/animations/ScrollAnimations';
import { useLanguage } from '@/contexts/LanguageContext';

export default function BentoGrid() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  const features = {
    en: [
      {
        icon: Smartphone,
        title: 'NFC Attendance',
        description: 'Contactless check-in with real-time parent notifications',
        size: 'large',
        gradient: 'from-blue-500/10 to-cyan-500/10',
        image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80'
      },
      {
        icon: CreditCard,
        title: 'Smart Wallet',
        description: 'Secure digital payments and canteen management',
        size: 'medium',
        gradient: 'from-purple-500/10 to-pink-500/10',
        image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80'
      },
      {
        icon: Bus,
        title: 'Live Tracking',
        description: 'Real-time bus location with route optimization',
        size: 'medium',
        gradient: 'from-orange-500/10 to-red-500/10',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80'
      },
      {
        icon: BookOpen,
        title: 'Grade Management',
        description: 'Complete academic tracking and reporting',
        size: 'small',
        gradient: 'from-green-500/10 to-emerald-500/10',
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80'
      },
      {
        icon: Bell,
        title: 'Instant Alerts',
        description: 'Push notifications for all activities',
        size: 'small',
        gradient: 'from-yellow-500/10 to-amber-500/10',
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80'
      },
      {
        icon: Shield,
        title: 'Secure & Private',
        description: 'Bank-level encryption and data protection',
        size: 'small',
        gradient: 'from-indigo-500/10 to-violet-500/10',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&q=80'
      }
    ],
    ar: [
      {
        icon: Smartphone,
        title: 'الحضور بالـ NFC',
        description: 'تسجيل دخول بدون لمس مع إشعارات فورية للأهالي',
        size: 'large',
        gradient: 'from-blue-500/10 to-cyan-500/10',
        image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80'
      },
      {
        icon: CreditCard,
        title: 'المحفظة الذكية',
        description: 'مدفوعات رقمية آمنة وإدارة المقصف',
        size: 'medium',
        gradient: 'from-purple-500/10 to-pink-500/10',
        image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80'
      },
      {
        icon: Bus,
        title: 'التتبع المباشر',
        description: 'موقع الحافلة في الوقت الفعلي مع تحسين المسار',
        size: 'medium',
        gradient: 'from-orange-500/10 to-red-500/10',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80'
      },
      {
        icon: BookOpen,
        title: 'إدارة الدرجات',
        description: 'تتبع أكاديمي شامل وتقارير',
        size: 'small',
        gradient: 'from-green-500/10 to-emerald-500/10',
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80'
      },
      {
        icon: Bell,
        title: 'تنبيهات فورية',
        description: 'إشعارات لجميع الأنشطة',
        size: 'small',
        gradient: 'from-yellow-500/10 to-amber-500/10',
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80'
      },
      {
        icon: Shield,
        title: 'آمن وخاص',
        description: 'تشفير على مستوى البنوك وحماية البيانات',
        size: 'small',
        gradient: 'from-indigo-500/10 to-violet-500/10',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&q=80'
      }
    ]
  };

  const items = features[language];

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'large':
        return 'md:col-span-2 md:row-span-2';
      case 'medium':
        return 'md:col-span-1 md:row-span-2';
      case 'small':
        return 'md:col-span-1 md:row-span-1';
      default:
        return '';
    }
  };

  return (
    <section className="py-32 px-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-7xl">
        <FadeInView>
          <h2 className="text-5xl md:text-6xl font-bold text-center mb-6">
            {language === 'en' ? 'Everything You Need' : 'كل ما تحتاجه'}
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            {language === 'en' 
              ? 'Powerful features designed specifically for modern schools'
              : 'ميزات قوية مصممة خصيصًا للمدارس الحديثة'}
          </p>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
          {items.map((feature, index) => (
            <ScaleInView
              key={index}
              className={getSizeClasses(feature.size)}
            >
              <motion.div
                className={`relative h-full rounded-3xl overflow-hidden glass border border-border/30 hover:border-primary/30 hover:shadow-glow-soft group cursor-pointer transition-all duration-500`}
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} backdrop-blur-sm`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/70 to-background/40" />
                </div>

                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Content */}
                <div className="relative z-10 h-full flex flex-col p-8">
                  <motion.div
                    className="w-14 h-14 rounded-2xl glass border border-border/20 flex items-center justify-center mb-6"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon className="w-7 h-7 text-primary" />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold mb-3 text-foreground">
                    {feature.title}
                  </h3>
                  
                  <p className="text-foreground/80 text-lg">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            </ScaleInView>
          ))}
        </div>
      </div>
    </section>
  );
}
