import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TextSplitAnimation from '@/components/animations/TextSplitAnimation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === 'ar';

  const content = {
    en: {
      headline: 'The Future of School Management',
      subheadline: 'Transform education with AI-powered tools, real-time tracking, and seamless management.',
      cta: 'Get Started Free',
      demo: 'Watch Demo'
    },
    ar: {
      headline: 'مستقبل إدارة المدارس',
      subheadline: 'حوّل التعليم بأدوات مدعومة بالذكاء الاصطناعي، وتتبع فوري، وإدارة سلسة.',
      cta: 'ابدأ مجانًا',
      demo: 'شاهد العرض'
    }
  };

  const text = content[language];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80" 
          alt="Students learning"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, hsl(var(--accent) / 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, hsl(var(--primary) / 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.3) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Floating 3D Cards */}
      <motion.div
        className="absolute top-32 left-[10%] w-64 h-40 rounded-2xl overflow-hidden shadow-2xl"
        animate={{
          y: [0, -20, 0],
          rotateY: [0, 5, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <img 
          src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80"
          alt="NFC Technology"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent" />
      </motion.div>

      <motion.div
        className="absolute bottom-32 right-[10%] w-64 h-40 rounded-2xl overflow-hidden shadow-2xl"
        animate={{
          y: [0, 20, 0],
          rotateY: [0, -5, 0],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <img 
          src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80"
          alt="School Bus"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-transparent" />
      </motion.div>

      <motion.div
        className="absolute top-1/2 right-[5%] w-48 h-32 rounded-2xl overflow-hidden shadow-2xl hidden lg:block"
        animate={{
          y: [0, -15, 0],
          rotateZ: [0, 3, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <img 
          src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&q=80"
          alt="Digital Wallet"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-transparent" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          {/* Main Headline */}
          <TextSplitAnimation 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.15] tracking-tight"
            delay={0.3}
          >
            {text.headline}
          </TextSplitAnimation>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            {text.subheadline}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              className="text-lg px-8 py-6 h-auto group"
              onClick={() => navigate('/auth')}
            >
              {text.cta}
              <ArrowRight className={`w-5 h-5 transition-transform group-hover:${isRtl ? '-translate-x-1' : 'translate-x-1'}`} />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 h-auto group"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              {text.demo}
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-2">
            <motion.div
              className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
