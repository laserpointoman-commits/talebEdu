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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background/95 to-background">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, hsl(var(--primary) / 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 left-[10%] w-32 h-32 rounded-full bg-primary/10 blur-3xl"
        animate={{
          y: [0, 30, 0],
          x: [0, 20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-[15%] w-40 h-40 rounded-full bg-accent/10 blur-3xl"
        animate={{
          y: [0, -40, 0],
          x: [0, -20, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

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
            className="text-6xl md:text-8xl lg:text-9xl font-bold mb-8 leading-[1.1] tracking-tight"
            delay={0.3}
          >
            {text.headline}
          </TextSplitAnimation>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-xl md:text-2xl lg:text-3xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
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
