import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { FadeInView } from '@/components/animations/ScrollAnimations';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
}

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 3000 });
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${Math.floor(latest)}${suffix}`;
      }
    });
  }, [springValue, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

function StatItem({ value, suffix, label }: StatItemProps) {
  return (
    <motion.div
      className="text-center glass p-8 rounded-2xl border border-border/30 hover:border-primary/30 hover:shadow-glow-soft transition-all duration-300"
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
      <div className="text-xl text-muted-foreground">
        {label}
      </div>
    </motion.div>
  );
}

export default function AnimatedStats() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  const stats = {
    en: [
      { value: 500, suffix: '+', label: 'Schools' },
      { value: 100, suffix: 'K+', label: 'Students' },
      { value: 99, suffix: '%', label: 'Uptime' },
      { value: 24, suffix: '/7', label: 'Support' }
    ],
    ar: [
      { value: 500, suffix: '+', label: 'مدرسة' },
      { value: 100, suffix: 'K+', label: 'طالب' },
      { value: 99, suffix: '%', label: 'وقت التشغيل' },
      { value: 24, suffix: '/7', label: 'الدعم' }
    ]
  };

  const items = stats[language];

  return (
    <section className="py-32 px-6 relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80"
          alt="School background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      </div>
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <FadeInView>
          <h2 className="text-5xl md:text-6xl font-bold text-center mb-6">
            {language === 'en' ? 'Trusted by Thousands' : 'موثوق به من قبل الآلاف'}
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-20 max-w-2xl mx-auto">
            {language === 'en' 
              ? 'Join the growing community of schools transforming education'
              : 'انضم إلى المجتمع المتنامي من المدارس التي تحول التعليم'}
          </p>
        </FadeInView>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {items.map((stat, index) => (
            <FadeInView key={index}>
              <StatItem {...stat} />
            </FadeInView>
          ))}
        </div>

        {/* Decorative Elements */}
        <motion.div
          className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>
    </section>
  );
}
