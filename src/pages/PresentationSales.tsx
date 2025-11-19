import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { StaggeredReveal, StaggerItem } from '@/components/animations/StaggeredReveal';
import {
  CheckCircle2, Shield, Clock, Users, TrendingUp, 
  Smartphone, Globe, Zap, Award, BarChart3, 
  Bus, CreditCard, Bell, MapPin,
  Phone, Mail, Globe2, DollarSign, X, Check,
  ShoppingBag, Package, Store, Home, Utensils
} from 'lucide-react';
import talebEduLogo from '@/assets/talebedu-logo-hq.png';

export default function PresentationSales() {
  const { language, setLanguage } = useLanguage();
  const isArabic = language === 'ar';

  const toggleLanguage = () => {
    setLanguage(isArabic ? 'en' : 'ar');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Control Bar - Hidden in Print */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <Button onClick={toggleLanguage} variant="glass" size="sm" className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {isArabic ? 'English' : 'العربية'}
        </Button>
      </div>

      {/* Hero Cover Page */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden print-page">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        
        <div className="relative z-10 text-center space-y-8 px-8">
          <ScrollReveal direction="scale">
            <div className="inline-block p-4 rounded-full bg-primary/10 mb-8">
              <img src={talebEduLogo} alt="TalebEdu" className="w-20 h-20 object-contain" />
            </div>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.2}>
            <h1 className="text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              TalebEdu
            </h1>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.3}>
            <h2 className="text-4xl font-semibold text-foreground">
              {isArabic ? 'حوّل مدرستك بالتقنية الذكية' : 'Transform Your School with Smart Technology'}
            </h2>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.4}>
            <p className="text-2xl text-muted-foreground max-w-3xl mx-auto">
              {isArabic 
                ? 'منصة إدارة مدرسية متكاملة مصممة خصيصاً للسوق العماني' 
                : 'The Complete School Management Platform Built for Oman'}
            </p>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.5}>
            <div className="flex items-center justify-center gap-6 text-xl mt-12" dir="ltr">
              <div className="flex items-center gap-2">
                <Phone className="w-6 h-6 text-primary" />
                <span>+968 9656 4540</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-6 h-6 text-primary" />
                <span>info@talebEdu.com</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Market Opportunity */}
      <section className="min-h-screen flex items-center justify-center py-20 print-page">
        <div className="container mx-auto px-8">
          <ScrollReveal direction="up">
            <h2 className="text-5xl font-bold text-center mb-16">
              {isArabic ? 'فرصة التعليم في عُمان' : 'Oman Education Opportunity'}
            </h2>
          </ScrollReveal>

          <StaggeredReveal className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <StaggerItem>
              <Card className="glass border-primary/20 hover-lift">
                <CardContent className="p-8">
                  <div className="text-6xl font-bold text-primary mb-4">1,306</div>
                  <h3 className="text-2xl font-semibold mb-2">
                    {isArabic ? 'مدرسة في عُمان' : 'Schools in Oman'}
                  </h3>
                  <p className="text-muted-foreground">
                    {isArabic 
                      ? 'وزارة التربية والتعليم، 2025' 
                      : 'Ministry of Education, 2025'}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-accent/20 hover-lift">
                <CardContent className="p-8">
                  <div className="text-6xl font-bold text-accent mb-4">$4.23B</div>
                  <h3 className="text-2xl font-semibold mb-2">
                    {isArabic ? 'سوق التقنية التعليمية' : 'Middle East EdTech Market'}
                  </h3>
                  <p className="text-muted-foreground">
                    {isArabic ? 'بحلول 2033 (9.5% نمو سنوي)' : 'By 2033 (9.5% annual growth)'}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-primary/20 hover-lift">
                <CardContent className="p-8">
                  <div className="text-5xl font-bold text-primary mb-4">
                    {isArabic ? 'رؤية عُمان 2040' : 'Oman Vision 2040'}
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">
                    {isArabic ? 'التحول الرقمي' : 'Digital Transformation'}
                  </h3>
                  <p className="text-muted-foreground">
                    {isArabic 
                      ? 'التركيز على التعليم الرقمي وتطوير القوى العاملة' 
                      : 'Focus on digital education & workforce development'}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-accent/20 hover-lift">
                <CardContent className="p-8">
                  <div className="text-5xl font-bold text-accent mb-4">2025</div>
                  <h3 className="text-2xl font-semibold mb-2">
                    {isArabic ? 'مبادرات حكومية' : 'Government Initiatives'}
                  </h3>
                  <p className="text-muted-foreground">
                    {isArabic 
                      ? 'وزارة التربية والتعليم تعلن عن مبادرات رقمية كبرى' 
                      : 'Ministry of Education announces major digital initiatives'}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggeredReveal>

          <ScrollReveal direction="up" delay={0.8}>
            <p className="text-center text-sm text-muted-foreground mt-12">
              {isArabic 
                ? 'المصادر: وزارة التربية والتعليم عُمان، Data Horizon Research 2024، SAMENA Council 2025' 
                : 'Sources: Ministry of Education Oman, Data Horizon Research 2024, SAMENA Council 2025'}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* The Problems */}
      <section className="min-h-screen flex items-center justify-center py-20 print-page bg-muted/5">
        <div className="container mx-auto px-8">
          <ScrollReveal direction="up">
            <h2 className="text-5xl font-bold text-center mb-16">
              {isArabic ? 'التحديات التي تواجهها المدارس اليوم' : 'The Problems Schools Face Today'}
            </h2>
          </ScrollReveal>

          <StaggeredReveal className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <StaggerItem>
              <Card className="glass border-destructive/20 hover-lift h-full">
                <CardContent className="p-8">
                  <Shield className="w-16 h-16 text-destructive mb-6" />
                  <h3 className="text-2xl font-bold mb-4">
                    {isArabic ? 'مخاوف السلامة' : 'Safety Concerns'}
                  </h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>{isArabic ? 'سلامة الحافلات المدرسية "الأولوية القصوى" للعائلات العمانية' : 'School bus safety "top priority" for Oman families'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>{isArabic ? 'عدم رؤية موقع الطالب في الوقت الفعلي' : 'No real-time visibility of student location'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>{isArabic ? 'bp عُمان أطلقت برنامج "أمان" لسلامة النقل المدرسي' : 'bp Oman launched "Aman" safety program for school transport'}</span>
                    </li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-6 italic">
                    {isArabic ? 'المصدر: Muscat Daily، أغسطس 2025' : 'Source: Muscat Daily, August 2025'}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-destructive/20 hover-lift h-full">
                <CardContent className="p-8">
                  <Clock className="w-16 h-16 text-destructive mb-6" />
                  <h3 className="text-2xl font-bold mb-4">
                    {isArabic ? 'الأعباء الإدارية' : 'Administrative Burden'}
                  </h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>{isArabic ? 'الحضور اليدوي يهدر 15+ ساعة أسبوعياً لكل معلم' : 'Manual attendance wastes 15+ hours per week per teacher'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>{isArabic ? 'الأنظمة الورقية عرضة للأخطاء والسجلات المفقودة' : 'Paper systems prone to errors and lost records'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>{isArabic ? 'التعامل النقدي يخلق مخاطر السرقة' : 'Cash handling creates theft risks'}</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-destructive/20 hover-lift h-full">
                <CardContent className="p-8">
                  <TrendingUp className="w-16 h-16 text-destructive mb-6" />
                  <h3 className="text-2xl font-bold mb-4">
                    {isArabic ? 'عدم الكفاءة المالية' : 'Financial Inefficiency'}
                  </h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>{isArabic ? 'أخطاء التعامل النقدي ومخاطر السرقة' : 'Cash handling errors and theft risk'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>{isArabic ? 'تحصيل الرسوم يدوياً يستغرق وقتاً طويلاً' : 'Manual fee collection time-consuming'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>{isArabic ? 'لا رؤية لأنماط إنفاق الطلاب' : 'No visibility into student spending'}</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggeredReveal>
        </div>
      </section>

      {/* Documented ROI */}
      <section className="min-h-screen flex items-center justify-center py-20 print-page">
        <div className="container mx-auto px-8">
          <ScrollReveal direction="up">
            <h2 className="text-5xl font-bold text-center mb-16">
              {isArabic ? 'عائد استثمار موثق من أنظمة المدارس' : 'Documented ROI From School Systems'}
            </h2>
          </ScrollReveal>

          <div className="max-w-5xl mx-auto space-y-8">
            <StaggeredReveal className="grid md:grid-cols-2 gap-8">
              <StaggerItem>
                <Card className="glass border-primary/20 hover-lift">
                  <CardContent className="p-8 text-center">
                    <div className="text-7xl font-bold text-primary mb-4">830%</div>
                    <h3 className="text-2xl font-semibold mb-2">
                      {isArabic ? 'عائد الاستثمار' : 'ROI'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isArabic 
                        ? 'أنظمة إدارة البيانات التعليمية' 
                        : 'Educational data management systems'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-4 italic">
                      LearningMate/Michigan DataHub, Dec 2024
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="glass border-accent/20 hover-lift">
                  <CardContent className="p-8 text-center">
                    <div className="text-7xl font-bold text-accent mb-4">426%</div>
                    <h3 className="text-2xl font-semibold mb-2">
                      {isArabic ? 'عائد الاستثمار' : 'ROI'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isArabic 
                        ? 'متوسط المنصات الرقمية K-12' 
                        : 'K-12 digital platforms average'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-4 italic">
                      Branching Minds Study, 2024
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            </StaggeredReveal>

            <ScrollReveal direction="up" delay={0.4}>
              <Card className="glass border-primary/20">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 text-center">
                    {isArabic ? 'الفوائد الموثقة في الأبحاث' : 'Benefits Documented in Research'}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">{isArabic ? 'إلغاء النداء اليدوي' : 'Automated attendance eliminates manual roll call'}</p>
                        <p className="text-xs text-muted-foreground">Applied AI Journal, 2022</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">{isArabic ? 'الأنظمة الرقمية تحسن التتبع' : 'Digital systems improve discipline tracking'}</p>
                        <p className="text-xs text-muted-foreground">IARJSET, May 2025</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">{isArabic ? 'إزالة مخاطر السرقة' : 'Cashless systems eliminate theft risk'}</p>
                        <p className="text-xs text-muted-foreground">Vanco Payments, 2024</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">{isArabic ? 'تحسين الكفاءة' : 'Digital payments improve efficiency'}</p>
                        <p className="text-xs text-muted-foreground">Allxs South Africa, 2025</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* TalebEdu Solution */}
      <section className="min-h-screen flex items-center justify-center py-20 print-page bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-8">
          <ScrollReveal direction="up">
            <h2 className="text-5xl font-bold text-center mb-8">
              {isArabic ? 'الحل - منصة TalebEdu' : 'The Solution - TalebEdu Platform'}
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-2xl text-center text-muted-foreground mb-16">
              {isArabic ? 'نظام متكامل لكل شيء' : 'One Integrated System for Everything'}
            </p>
          </ScrollReveal>

          <StaggeredReveal className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <StaggerItem>
              <Card className="glass border-primary/20 hover-lift h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {isArabic ? 'حضور NFC وصول' : 'NFC Attendance & Access'}
                  </h3>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-primary/20 hover-lift h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Bus className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {isArabic ? 'تتبع GPS للحافلة' : 'Real-Time Bus GPS Tracking'}
                  </h3>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-primary/20 hover-lift h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {isArabic ? 'محفظة رقمية ودفع' : 'Digital Wallet & Payments'}
                  </h3>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-primary/20 hover-lift h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Utensils className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {isArabic ? 'مقصف بدون نقد مع تحكم الأهل' : 'Cashless Canteen with Parent Controls'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? 'دفع NFC - منع المنتجات وحدود الإنفاق' : 'NFC payment - restrict products & spending limits'}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-primary/20 hover-lift h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {isArabic ? 'متجر المدرسة' : 'School Store'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? 'كتب وأقلام وزي - توصيل للصف أو المنزل' : 'Books, pens, uniforms - delivery to classroom or home'}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-accent/20 hover-lift h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {isArabic ? 'إدارة الدرجات والواجبات' : 'Grade & Homework Management'}
                  </h3>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-accent/20 hover-lift h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {isArabic ? 'تواصل المعلم والوالدين' : 'Parent-Teacher Communication'}
                  </h3>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-accent/20 hover-lift h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {isArabic ? 'الإدارة المالية والتقارير' : 'Financial Management & Reports'}
                  </h3>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-accent/20 hover-lift h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {isArabic ? 'تطبيقات الجوال للجميع' : 'Mobile Apps for Everyone'}
                  </h3>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggeredReveal>
        </div>
      </section>

      {/* Pricing Section - Most Important! */}
      <section className="min-h-screen flex items-center justify-center py-20 print-page">
        <div className="container mx-auto px-8">
          <ScrollReveal direction="up">
            <h2 className="text-6xl font-bold text-center mb-4">
              {isArabic ? 'التسعير الشفاف' : 'Transparent Pricing'}
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-3xl text-center text-primary font-bold mb-16">
              {isArabic ? 'شامل كل شيء - بدون رسوم خفية' : 'All-Inclusive - No Hidden Fees'}
            </p>
          </ScrollReveal>

          <div className="max-w-6xl mx-auto">
            <StaggeredReveal className="grid md:grid-cols-2 gap-8 mb-12">
              <StaggerItem>
                <Card className="glass border-primary/30 hover-lift h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                  <CardContent className="p-12 relative">
                    <Smartphone className="w-16 h-16 text-primary mb-6" />
                    <div className="text-8xl font-bold text-primary mb-4">25</div>
                    <div className="text-3xl font-semibold mb-2">
                      {isArabic ? 'ريال عماني' : 'OMR'}
                    </div>
                    <div className="text-xl text-muted-foreground mb-8">
                      {isArabic ? 'لكل طالب / سنة' : 'Per Student / Year'}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-primary" />
                        <span>{isArabic ? 'كل الميزات متضمنة' : 'All features included'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-primary" />
                        <span>{isArabic ? 'أساور NFC للطلاب' : 'NFC wristbands for students'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-primary" />
                        <span>{isArabic ? 'دعم 24/7' : '24/7 Support'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="glass border-accent/30 hover-lift h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
                  <CardContent className="p-12 relative">
                    <Bus className="w-16 h-16 text-accent mb-6" />
                    <div className="text-8xl font-bold text-accent mb-4">100</div>
                    <div className="text-3xl font-semibold mb-2">
                      {isArabic ? 'ريال عماني' : 'OMR'}
                    </div>
                    <div className="text-xl text-muted-foreground mb-8">
                      {isArabic ? 'لكل حافلة / سنة' : 'Per Bus / Year'}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-accent" />
                        <span>{isArabic ? 'تتبع GPS في الوقت الفعلي' : 'Real-time GPS tracking'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-accent" />
                        <span>{isArabic ? 'إشعارات تلقائية للوالدين' : 'Automated parent notifications'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-accent" />
                        <span>{isArabic ? 'أجهزة GPS متضمنة' : 'GPS devices included'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </StaggeredReveal>

            <ScrollReveal direction="up" delay={0.4}>
              <Card className="glass border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-12">
                  <h3 className="text-3xl font-bold text-center mb-8">
                    {isArabic ? 'مثال: مدرسة 500 طالب، 10 حافلات' : 'Example: School with 500 Students, 10 Buses'}
                  </h3>
                  
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex justify-between items-center text-xl">
                      <span className="text-muted-foreground">{isArabic ? 'الطلاب: 500 × 25 ريال عماني' : 'Students: 500 × OMR 25'}</span>
                      <span className="font-bold text-2xl">12,500 {isArabic ? 'ريال عماني' : 'OMR'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xl">
                      <span className="text-muted-foreground">{isArabic ? 'الحافلات: 10 × 100 ريال عماني' : 'Buses: 10 × OMR 100'}</span>
                      <span className="font-bold text-2xl">1,000 {isArabic ? 'ريال عماني' : 'OMR'}</span>
                    </div>
                    <div className="border-t-2 border-primary/20 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-semibold">{isArabic ? 'المجموع السنوي' : 'Total Annual Cost'}</span>
                        <span className="text-5xl font-bold text-primary">13,500 {isArabic ? 'ريال عماني' : 'OMR'}</span>
                      </div>
                      <p className="text-center text-muted-foreground mt-4 text-lg">
                        {isArabic ? '≈ 1,125 ريال عماني شهرياً' : '≈ OMR 1,125 per month'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.6}>
              <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <h4 className="text-2xl font-bold mb-6 text-center">
                  {isArabic ? '✅ كل شيء متضمن' : '✅ Everything Included'}
                </h4>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold">{isArabic ? 'الأجهزة والمعدات' : 'Hardware & Equipment'}</p>
                    <p className="text-sm text-muted-foreground">{isArabic ? 'أساور NFC، قارئات، أجهزة GPS' : 'NFC wristbands, readers, GPS devices'}</p>
                  </div>
                  <div className="text-center">
                    <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold">{isArabic ? 'الإعداد والتدريب' : 'Setup & Training'}</p>
                    <p className="text-sm text-muted-foreground">{isArabic ? 'تثبيت كامل، تدريب الموظفين' : 'Complete installation, staff training'}</p>
                  </div>
                  <div className="text-center">
                    <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold">{isArabic ? 'الدعم والتحديثات' : 'Support & Updates'}</p>
                    <p className="text-sm text-muted-foreground">{isArabic ? '24/7 دعم، تحديثات مجانية' : '24/7 support, free updates'}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="min-h-screen flex items-center justify-center py-20 print-page bg-muted/5">
        <div className="container mx-auto px-8">
          <ScrollReveal direction="up">
            <h2 className="text-5xl font-bold text-center mb-4">
              {isArabic ? 'مقارنة مع المنافسين' : 'Competitor Comparison'}
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-2xl text-center text-muted-foreground mb-16">
              {isArabic ? 'لماذا TalebEdu أفضل قيمة' : 'Why TalebEdu is Better Value'}
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.3}>
            <div className="max-w-7xl mx-auto overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-primary/20">
                    <th className="p-6 text-left text-xl font-bold">{isArabic ? 'الميزة' : 'Feature'}</th>
                    <th className="p-6 text-center">
                      <div className="text-2xl font-bold text-primary mb-2">TalebEdu</div>
                      <div className="text-sm font-normal text-muted-foreground">
                        {isArabic ? '25 ريال عماني/طالب/سنة' : 'OMR 25/student/year'}
                      </div>
                    </th>
                    <th className="p-6 text-center">
                      <div className="text-xl font-bold mb-2">Fedena</div>
                      <div className="text-sm font-normal text-muted-foreground">$999/year</div>
                    </th>
                    <th className="p-6 text-center">
                      <div className="text-xl font-bold mb-2">FeKara</div>
                      <div className="text-sm font-normal text-muted-foreground">$100/year</div>
                    </th>
                    <th className="p-6 text-center">
                      <div className="text-xl font-bold mb-2">Classter</div>
                      <div className="text-sm font-normal text-muted-foreground">{isArabic ? 'سعر مخصص' : 'Custom'}</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-lg">
                  <tr className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="p-6 font-semibold">{isArabic ? 'حضور NFC' : 'NFC Attendance'}</td>
                    <td className="p-6 text-center"><Check className="w-8 h-8 text-primary mx-auto" /></td>
                    <td className="p-6 text-center"><X className="w-8 h-8 text-destructive mx-auto" /></td>
                    <td className="p-6 text-center"><X className="w-8 h-8 text-destructive mx-auto" /></td>
                    <td className="p-6 text-center"><X className="w-8 h-8 text-destructive mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="p-6 font-semibold">{isArabic ? 'تتبع GPS للحافلات' : 'GPS Bus Tracking'}</td>
                    <td className="p-6 text-center">
                      <Check className="w-8 h-8 text-primary mx-auto" />
                      <div className="text-sm text-muted-foreground mt-1">+100 {isArabic ? 'ريال عماني/حافلة' : 'OMR/bus'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <X className="w-8 h-8 text-destructive mx-auto" />
                      <div className="text-sm text-destructive mt-1">{isArabic ? 'خدمة منفصلة' : 'Separate service'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <X className="w-8 h-8 text-destructive mx-auto" />
                      <div className="text-sm text-destructive mt-1">{isArabic ? 'خدمة منفصلة' : 'Separate service'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <X className="w-8 h-8 text-destructive mx-auto" />
                      <div className="text-sm text-destructive mt-1">{isArabic ? 'خدمة منفصلة' : 'Separate service'}</div>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="p-6 font-semibold">{isArabic ? 'محفظة رقمية' : 'Digital Wallet'}</td>
                    <td className="p-6 text-center"><Check className="w-8 h-8 text-primary mx-auto" /></td>
                    <td className="p-6 text-center"><X className="w-8 h-8 text-destructive mx-auto" /></td>
                    <td className="p-6 text-center"><X className="w-8 h-8 text-destructive mx-auto" /></td>
                    <td className="p-6 text-center"><X className="w-8 h-8 text-destructive mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="p-6 font-semibold">{isArabic ? 'إدارة كافتيريا بدون نقد' : 'Cashless Canteen'}</td>
                    <td className="p-6 text-center"><Check className="w-8 h-8 text-primary mx-auto" /></td>
                    <td className="p-6 text-center"><X className="w-8 h-8 text-destructive mx-auto" /></td>
                    <td className="p-6 text-center"><X className="w-8 h-8 text-destructive mx-auto" /></td>
                    <td className="p-6 text-center"><X className="w-8 h-8 text-destructive mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="p-6 font-semibold">{isArabic ? 'تطبيق الوالدين' : 'Parent Mobile App'}</td>
                    <td className="p-6 text-center">
                      <Check className="w-8 h-8 text-primary mx-auto" />
                      <div className="text-sm text-primary mt-1">{isArabic ? 'مجاني' : 'Free'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <Check className="w-8 h-8 text-amber-500 mx-auto" />
                      <div className="text-sm text-muted-foreground mt-1">{isArabic ? 'تكلفة إضافية' : 'Extra cost'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <Check className="w-8 h-8 text-amber-500 mx-auto" />
                      <div className="text-sm text-muted-foreground mt-1">{isArabic ? 'أساسي' : 'Basic'}</div>
                    </td>
                    <td className="p-6 text-center"><Check className="w-8 h-8 text-primary mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="p-6 font-semibold">{isArabic ? 'ثنائي اللغة (AR/EN)' : 'Bilingual (AR/EN)'}</td>
                    <td className="p-6 text-center">
                      <Check className="w-8 h-8 text-primary mx-auto" />
                      <div className="text-sm text-primary mt-1">{isArabic ? 'دعم كامل' : 'Full support'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <Check className="w-8 h-8 text-amber-500 mx-auto" />
                      <div className="text-sm text-muted-foreground mt-1">{isArabic ? 'محدود' : 'Limited'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <X className="w-8 h-8 text-destructive mx-auto" />
                      <div className="text-sm text-destructive mt-1">{isArabic ? 'إنجليزي فقط' : 'English only'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <Check className="w-8 h-8 text-amber-500 mx-auto" />
                      <div className="text-sm text-muted-foreground mt-1">{isArabic ? 'محدود' : 'Limited'}</div>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="p-6 font-semibold">{isArabic ? 'الأجهزة متضمنة' : 'Hardware Included'}</td>
                    <td className="p-6 text-center">
                      <Check className="w-8 h-8 text-primary mx-auto" />
                      <div className="text-sm text-primary mt-1">{isArabic ? 'كل شيء' : 'Everything'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <X className="w-8 h-8 text-destructive mx-auto" />
                      <div className="text-sm text-destructive mt-1">{isArabic ? 'تكلفة إضافية' : 'Extra cost'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <X className="w-8 h-8 text-destructive mx-auto" />
                      <div className="text-sm text-destructive mt-1">{isArabic ? 'تكلفة إضافية' : 'Extra cost'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <X className="w-8 h-8 text-destructive mx-auto" />
                      <div className="text-sm text-destructive mt-1">{isArabic ? 'تكلفة إضافية' : 'Extra cost'}</div>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="p-6 font-semibold">{isArabic ? 'وقت الإعداد' : 'Setup Time'}</td>
                    <td className="p-6 text-center">
                      <div className="font-bold text-primary text-xl">{isArabic ? '1 أسبوع' : '1 week'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="text-muted-foreground">{isArabic ? '4-8 أسابيع' : '4-8 weeks'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="text-muted-foreground">{isArabic ? '2-3 أسابيع' : '2-3 weeks'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="text-muted-foreground">{isArabic ? '4-8 أسابيع' : '4-8 weeks'}</div>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="p-6 font-semibold">{isArabic ? 'الدعم' : 'Support'}</td>
                    <td className="p-6 text-center">
                      <div className="font-bold text-primary">24/7</div>
                      <div className="text-sm text-muted-foreground">{isArabic ? 'عربي وإنجليزي' : 'Arabic & English'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="text-muted-foreground">{isArabic ? 'بريد إلكتروني فقط' : 'Email only'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="text-muted-foreground">{isArabic ? 'بريد إلكتروني فقط' : 'Email only'}</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="text-muted-foreground">{isArabic ? 'ساعات العمل' : 'Business hours'}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.5}>
            <Card className="glass border-primary/20 mt-12 max-w-4xl mx-auto">
              <CardContent className="p-10">
                <h3 className="text-3xl font-bold text-center mb-8">
                  {isArabic ? '💰 مقارنة التكلفة الحقيقية (500 طالب، 10 حافلات)' : '💰 Real Cost Comparison (500 students, 10 buses)'}
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xl font-bold text-primary">TalebEdu</span>
                      <span className="text-3xl font-bold text-primary">13,500 {isArabic ? 'ريال عماني/سنة' : 'OMR/year'}</span>
                    </div>
                    <div className="text-sm text-muted-foreground ml-6">
                      ✅ {isArabic ? 'كل شيء متضمن - نظام واحد متكامل' : 'Everything included - One integrated system'}
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xl font-bold">{isArabic ? 'المنافسون (حل مجزأ)' : 'Competitors (Fragmented Solution)'}</span>
                      <span className="text-3xl font-bold text-destructive">14,000+ {isArabic ? 'ريال عماني/سنة' : 'OMR/year'}</span>
                    </div>
                    <div className="text-sm text-muted-foreground ml-6 space-y-1">
                      <div>• Fedena: 385 {isArabic ? 'ريال عماني/سنة' : 'OMR/year'}</div>
                      <div>• {isArabic ? 'خدمة تتبع GPS للحافلات منفصلة' : 'Separate GPS bus tracking service'}: ~6,000 {isArabic ? 'ريال عماني/سنة' : 'OMR/year'}</div>
                      <div>• {isArabic ? 'نظام دفع بدون نقد منفصل' : 'Separate cashless payment system'}: ~3,000 {isArabic ? 'ريال عماني/سنة' : 'OMR/year'}</div>
                      <div>• {isArabic ? 'أجهزة NFC (بائع منفصل)' : 'NFC hardware (separate vendor)'}: ~5,000 {isArabic ? 'ريال عماني مرة واحدة' : 'OMR one-time'}</div>
                      <div className="text-destructive font-semibold mt-2">
                        ❌ {isArabic ? '3 أنظمة مختلفة للإدارة' : '3 different systems to manage'}<br/>
                        ❌ {isArabic ? '3 جهات اتصال دعم مختلفة' : '3 different support contacts'}<br/>
                        ❌ {isArabic ? 'البيانات غير متكاملة' : 'Data not integrated'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* Why TalebEdu */}
      <section className="min-h-screen flex items-center justify-center py-20 print-page">
        <div className="container mx-auto px-8">
          <ScrollReveal direction="up">
            <h2 className="text-5xl font-bold text-center mb-16">
              {isArabic ? 'لماذا تختار TalebEdu؟' : 'Why Choose TalebEdu?'}
            </h2>
          </ScrollReveal>

          <StaggeredReveal className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <StaggerItem>
              <Card className="glass border-primary/20 hover-lift h-full">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {isArabic ? 'منصة شاملة' : 'All-in-One Platform'}
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• {isArabic ? 'نظام واحد لكل شيء' : 'One system for everything'}</li>
                    <li>• {isArabic ? 'تسجيل دخول واحد، جهة اتصال دعم واحدة' : 'One login, one support contact'}</li>
                    <li>• {isArabic ? 'بيانات متكاملة عبر جميع الميزات' : 'Integrated data across all features'}</li>
                  </ul>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-primary/20 hover-lift h-full">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Globe className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {isArabic ? 'مصمم لعُمان' : 'Built for Oman'}
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• {isArabic ? 'واجهة كاملة بالعربية والإنجليزية' : 'Full Arabic & English interface'}</li>
                    <li>• {isArabic ? 'عملة ريال عماني' : 'OMR currency native'}</li>
                    <li>• {isArabic ? 'فريق دعم محلي' : 'Local support team'}</li>
                  </ul>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-primary/20 hover-lift h-full">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {isArabic ? 'تقنية حديثة' : 'Modern Technology'}
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• {isArabic ? 'تقنية NFC بدون تلامس' : 'NFC contactless technology'}</li>
                    <li>• {isArabic ? 'تتبع GPS في الوقت الفعلي' : 'Real-time GPS tracking'}</li>
                    <li>• {isArabic ? 'نظام سحابي (99.9% وقت التشغيل)' : 'Cloud-based system (99.9% uptime)'}</li>
                  </ul>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-primary/20 hover-lift h-full">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <DollarSign className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {isArabic ? 'تسعير شفاف' : 'Transparent Pricing'}
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• {isArabic ? 'تسعير بسيط لكل طالب' : 'Simple per-student pricing'}</li>
                    <li>• {isArabic ? 'بدون رسوم خفية' : 'No hidden fees'}</li>
                    <li>• {isArabic ? 'جميع الأجهزة متضمنة' : 'All hardware included'}</li>
                  </ul>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-primary/20 hover-lift h-full">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {isArabic ? 'تنفيذ سريع' : 'Quick Implementation'}
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• {isArabic ? 'جاهز في أسبوع واحد' : 'Ready in 1 week'}</li>
                    <li>• {isArabic ? 'تدريب كامل متضمن' : 'Complete training included'}</li>
                    <li>• {isArabic ? 'دعم كامل أثناء الإطلاق' : 'Full support during rollout'}</li>
                  </ul>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="glass border-primary/20 hover-lift h-full">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {isArabic ? 'دعم 24/7' : '24/7 Support'}
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• {isArabic ? 'دعم بالعربية والإنجليزية' : 'Arabic & English support'}</li>
                    <li>• {isArabic ? 'متاح على مدار الساعة' : 'Available around the clock'}</li>
                    <li>• {isArabic ? 'استجابة أقل من 4 ساعات' : 'Response under 4 hours'}</li>
                  </ul>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggeredReveal>
        </div>
      </section>

      {/* Implementation Timeline */}
      <section className="min-h-screen flex items-center justify-center py-20 print-page bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-8">
          <ScrollReveal direction="up">
            <h2 className="text-5xl font-bold text-center mb-4">
              {isArabic ? 'جاهز في 4 أسابيع' : 'Ready in 4 Weeks'}
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-2xl text-center text-muted-foreground mb-16">
              {isArabic ? 'جدول التنفيذ' : 'Implementation Timeline'}
            </p>
          </ScrollReveal>

          <div className="max-w-4xl mx-auto space-y-8">
            <StaggeredReveal>
              <StaggerItem>
                <Card className="glass border-primary/20 hover-lift">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-primary">1</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-3">
                          {isArabic ? 'الأسبوع 1: الإعداد والتكوين' : 'Week 1: Setup & Configuration'}
                        </h3>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• {isArabic ? 'إعداد المنصة (يوم واحد)' : 'Platform setup (1 day)'}</li>
                          <li>• {isArabic ? 'تدريب المسؤولين (ساعتان)' : 'Admin training (2 hours)'}</li>
                          <li>• {isArabic ? 'تدريب المعلمين (ساعتان)' : 'Teacher training (2 hours)'}</li>
                          <li>• {isArabic ? 'استيراد البيانات' : 'Data import'}</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="glass border-primary/20 hover-lift">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-primary">2</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-3">
                          {isArabic ? 'الأسبوع 2: تثبيت الأجهزة' : 'Week 2: Hardware Installation'}
                        </h3>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• {isArabic ? 'قارئات NFC عند البوابات المدرسية' : 'NFC readers at school gates'}</li>
                          <li>• {isArabic ? 'أجهزة GPS في الحافلات' : 'GPS trackers in buses'}</li>
                          <li>• {isArabic ? 'إعداد معدات الكافتيريا' : 'Canteen equipment setup'}</li>
                          <li>• {isArabic ? 'الاختبار والمعايرة' : 'Testing and calibration'}</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="glass border-primary/20 hover-lift">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-primary">3</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-3">
                          {isArabic ? 'الأسبوع 3: إعداد الوالدين' : 'Week 3: Parent Onboarding'}
                        </h3>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• {isArabic ? 'إرسال دعوات تلقائية' : 'Automatic invitation emails'}</li>
                          <li>• {isArabic ? 'تعليمات تنزيل التطبيق' : 'App download instructions'}</li>
                          <li>• {isArabic ? 'دروس فيديو ترحيبية' : 'Welcome video tutorials'}</li>
                          <li>• {isArabic ? 'خط دعم متاح' : 'Support hotline available'}</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="glass border-primary/20 hover-lift">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-primary">4</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-3">
                          {isArabic ? 'الأسبوع 4: البث المباشر' : 'Week 4: Go Live'}
                        </h3>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• {isArabic ? 'إطلاق تجريبي مع فصول مختارة' : 'Soft launch with pilot classes'}</li>
                          <li>• {isArabic ? 'إطلاق كامل للمدرسة بأكملها' : 'Full rollout to entire school'}</li>
                          <li>• {isArabic ? 'مراقبة يومية' : 'Daily monitoring'}</li>
                          <li>• {isArabic ? 'دعم 24/7 جاهز' : '24/7 support standing by'}</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </StaggeredReveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="min-h-screen flex items-center justify-center py-20 print-page">
        <div className="container mx-auto px-8">
          <ScrollReveal direction="up">
            <h2 className="text-5xl font-bold text-center mb-16">
              {isArabic ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
            </h2>
          </ScrollReveal>

          <div className="max-w-4xl mx-auto space-y-6">
            <StaggeredReveal>
              <StaggerItem>
                <Card className="glass border-primary/20 hover-lift">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-3">
                      {isArabic ? 'كم تكلف المنصة؟' : 'How much does it cost?'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isArabic 
                        ? '25 ريال عماني لكل طالب في السنة + 100 ريال عماني لكل حافلة في السنة. جميع الأجهزة والإعداد والتدريب والدعم متضمنة.' 
                        : 'OMR 25 per student per year + OMR 100 per bus per year. All hardware, setup, training, and support included.'}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="glass border-primary/20 hover-lift">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-3">
                      {isArabic ? 'هل من الصعب تعلمها؟' : 'Is it difficult to learn?'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isArabic 
                        ? 'لا. نقدم تدريباً لمدة ساعتين للموظفين. معظم المعلمين يشعرون بالراحة خلال 1-2 أيام. الآباء يجدون التطبيق سهل الاستخدام للغاية.' 
                        : 'No. We provide 2-hour training for staff. Most teachers are comfortable within 1-2 days. Parents find the app very easy to use.'}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="glass border-primary/20 hover-lift">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-3">
                      {isArabic ? 'ماذا لو انقطع الإنترنت؟' : 'What if internet goes down?'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isArabic 
                        ? 'الوضع غير المتصل بالإنترنت متضمن. يتم تسجيل الحضور دون اتصال ومزامنته تلقائياً عند عودة الاتصال.' 
                        : 'Offline mode included. Attendance recorded offline, syncs automatically when connection returns.'}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="glass border-primary/20 hover-lift">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-3">
                      {isArabic ? 'كيف يتم حماية البيانات؟' : 'How is data protected?'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isArabic 
                        ? 'تشفير على مستوى البنوك، استضافة سحابية آمنة، معتمد ISO 27001، متوافق تماماً مع قانون حماية البيانات في عُمان.' 
                        : 'Bank-level encryption, secure cloud hosting, ISO 27001 certified, fully compliant with Oman Data Protection Law.'}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="glass border-primary/20 hover-lift">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-3">
                      {isArabic ? 'ما هي مدة العقد؟' : "What's the contract term?"}
                    </h3>
                    <p className="text-muted-foreground">
                      {isArabic 
                        ? 'شروط مرنة متاحة: شهرية، ربع سنوية، أو سنوية. الدفع السنوي يحصل على خصم.' 
                        : 'Flexible terms available: monthly, quarterly, or annual. Annual payment receives discount.'}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="glass border-primary/20 hover-lift">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-3">
                      {isArabic ? 'ماذا لو كانت لدينا مشاكل تقنية؟' : 'What if we have technical problems?'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isArabic 
                        ? 'دعم 24/7 بالعربية والإنجليزية. متوسط وقت الاستجابة: أقل من 4 ساعات.' 
                        : '24/7 support in Arabic and English. Average response time: under 4 hours.'}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            </StaggeredReveal>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="min-h-screen flex items-center justify-center py-20 print-page bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10">
        <div className="container mx-auto px-8">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal direction="scale">
              <div className="inline-block p-4 rounded-full bg-primary/10 mb-8">
                <img src={talebEduLogo} alt="TalebEdu" className="w-20 h-20 object-contain" />
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.2}>
              <h2 className="text-6xl font-bold mb-6">
                {isArabic ? 'هل أنت مستعد لتحويل مدرستك؟' : 'Ready to Transform Your School?'}
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
              <p className="text-2xl text-muted-foreground mb-12">
                {isArabic ? '3 خطوات سهلة للبدء' : '3 Easy Steps to Get Started'}
              </p>
            </ScrollReveal>

            <StaggeredReveal className="grid md:grid-cols-3 gap-8 mb-16">
              <StaggerItem>
                <Card className="glass border-primary/20 hover-lift">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl font-bold text-primary">1</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {isArabic ? 'جدولة عرض توضيحي مجاني' : 'Schedule Free Demo'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? 'شاهد TalebEdu مع احتياجات مدرستك المحددة' : 'See TalebEdu with your school needs'}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="glass border-primary/20 hover-lift">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl font-bold text-primary">2</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {isArabic ? 'استشارة مجانية' : 'Free Consultation'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? 'فريقنا يقيم ويخطط للتنفيذ' : 'Our team assesses and plans implementation'}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="glass border-primary/20 hover-lift">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl font-bold text-primary">3</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {isArabic ? 'البث المباشر في أسبوع واحد' : 'Go Live in 1 Week'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? 'إعداد كامل وتدريب وإطلاق' : 'Complete setup, training & launch'}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            </StaggeredReveal>

            <ScrollReveal direction="up" delay={0.6}>
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3 text-2xl">
                    <Phone className="w-8 h-8 text-primary" />
                    <a href="tel:+96896564540" className="font-bold hover:text-primary transition-colors">
                      +968 9656 4540
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-2xl">
                    <Mail className="w-8 h-8 text-primary" />
                    <a href="mailto:info@talebEdu.com" className="font-bold hover:text-primary transition-colors">
                      info@talebEdu.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-2xl">
                    <Globe2 className="w-8 h-8 text-primary" />
                    <span className="font-bold">www.talebedu.com</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Thank You Page */}
      <section className="min-h-screen flex items-center justify-center print-page">
        <div className="container mx-auto px-8 text-center">
          <ScrollReveal direction="scale">
            <div className="inline-block p-6 rounded-full bg-primary/10 mb-8">
              <img src={talebEduLogo} alt="TalebEdu" className="w-32 h-32 object-contain" />
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <h2 className="text-7xl font-bold mb-8">
              {isArabic ? 'شكراً لك' : 'Thank You'}
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.3}>
            <p className="text-3xl text-muted-foreground mb-16">
              {isArabic 
                ? 'انضم إلى رحلة التحول الرقمي في التعليم بعُمان' 
                : "Join Oman's Digital Education Revolution"}
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.4}>
            <div className="space-y-4 text-2xl">
              <div className="flex items-center justify-center gap-3">
                <Phone className="w-8 h-8 text-primary" />
                <span className="font-bold">+968 9656 4540</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Mail className="w-8 h-8 text-primary" />
                <span className="font-bold">info@talebEdu.com</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Globe2 className="w-8 h-8 text-primary" />
                <span className="font-bold">www.talebedu.com</span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.5}>
            <div className="mt-16 text-lg text-muted-foreground">
              <p>{isArabic ? 'المصادر والمراجع' : 'Sources & References'}</p>
              <div className="mt-6 max-w-3xl mx-auto text-sm space-y-2 text-left">
                <p>• Ministry of Education Oman, Oman Observer (2025)</p>
                <p>• Data Horizon Research - Middle East EdTech Market (2024)</p>
                <p>• LearningMate - Michigan DataHub ROI Study (2024)</p>
                <p>• Branching Minds - K-12 Platform ROI Study (2024)</p>
                <p>• Muscat Daily - School Safety Reports (2025)</p>
                <p>• Applied Artificial Intelligence Journal (2022)</p>
                <p>• Vanco Payments, Allxs, eFunds for Schools Studies (2024-2025)</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-page {
            page-break-before: always;
            page-break-inside: avoid;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          * {
            box-shadow: none !important;
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-4px);
        }
        
        .bg-grid-white {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.05)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
        }
      `}</style>
    </div>
  );
}
