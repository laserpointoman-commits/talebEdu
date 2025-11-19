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
import talebEduLogo from '@/assets/talebedu-logo-blue.png';

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
            <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary/10 mb-8">
              <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full" />
              <span className="relative text-7xl font-bold text-primary leading-none">
                t
              </span>
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
                    {isArabic ? 'حضور NFC' : 'NFC Attendance'}
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

      {/* 🚨 BUS SAFETY - MAJOR SECTION */}
      <section className="min-h-screen flex items-center justify-center py-20 print-page bg-gradient-to-br from-destructive/5 via-primary/5 to-destructive/5">
        <div className="container mx-auto px-8">
          <ScrollReveal direction="up">
            <div className="text-center mb-4">
              <div className="inline-block p-4 rounded-full bg-destructive/10 mb-4">
                <Shield className="w-16 h-16 text-destructive" />
              </div>
            </div>
            <h2 className="text-6xl font-bold text-center mb-6 text-destructive">
              {isArabic ? '🚨 سلامة الطلاب في الحافلات' : '🚨 Student Bus Safety'}
            </h2>
            <p className="text-2xl text-center text-muted-foreground mb-16 max-w-4xl mx-auto">
              {isArabic 
                ? 'أولويتنا القصوى - راحة بال كاملة للأهل مع تتبع مباشر ونظام طوارئ فوري' 
                : 'Our Top Priority - Complete peace of mind with live tracking and instant emergency system'}
            </p>
          </ScrollReveal>

          <div className="max-w-6xl mx-auto space-y-8">
            {/* Live GPS Tracking */}
            <ScrollReveal direction="up" delay={0.1}>
              <Card className="glass border-destructive/20 overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="p-4 rounded-lg bg-primary/10 shrink-0">
                      <MapPin className="w-12 h-12 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold mb-4 text-primary">
                        {isArabic ? 'تتبع GPS المباشر للحافلات' : 'Live GPS Bus Tracking'}
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                              <span>{isArabic ? 'موقع الحافلة المباشر على الخريطة' : 'Real-time bus location on map'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                              <span>{isArabic ? 'الوقت المتوقع للوصول (ETA)' : 'Estimated time of arrival (ETA)'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                              <span>{isArabic ? 'إشعارات عند اقتراب الحافلة' : 'Notifications when bus approaches'}</span>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                              <span>{isArabic ? 'تاريخ كامل لمسار الحافلة' : 'Complete bus route history'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                              <span>{isArabic ? 'مراقبة السرعة والتوقفات' : 'Speed and stops monitoring'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                              <span>{isArabic ? 'تنبيهات التأخير الأوتوماتيكية' : 'Automatic delay alerts'}</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Boarding/Disembarking Tracking */}
            <ScrollReveal direction="up" delay={0.2}>
              <Card className="glass border-destructive/20 overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="p-4 rounded-lg bg-accent/10 shrink-0">
                      <Bell className="w-12 h-12 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold mb-4 text-accent">
                        {isArabic ? 'تتبع الصعود والنزول من الحافلة' : 'Boarding & Disembarking Tracking'}
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                              <span>{isArabic ? 'لمس NFC عند صعود الطالب - إشعار فوري للأهل' : 'NFC tap when boarding - instant parent notification'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                              <span>{isArabic ? 'لمس NFC عند نزول الطالب - إشعار فوري للأهل' : 'NFC tap when disembarking - instant parent notification'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                              <span>{isArabic ? 'الموقع الدقيق للصعود/النزول' : 'Exact location of boarding/disembarking'}</span>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                              <span>{isArabic ? 'الوقت الدقيق لكل حدث' : 'Exact time of each event'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                              <span>{isArabic ? 'تنبيه إذا لم يصعد الطالب' : 'Alert if student doesn\'t board'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                              <span>{isArabic ? 'سجل كامل لجميع الرحلات' : 'Complete log of all trips'}</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* 🚨 EMERGENCY SOS SYSTEM */}
            <ScrollReveal direction="up" delay={0.3}>
              <Card className="glass border-destructive/30 overflow-hidden bg-destructive/5">
                <CardContent className="p-10">
                  <div className="flex items-start gap-6">
                    <div className="p-5 rounded-lg bg-destructive/20 shrink-0 animate-pulse">
                      <Phone className="w-16 h-16 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-4xl font-bold mb-4 text-destructive">
                        {isArabic ? '🚨 نظام الطوارئ SOS - اتصال مباشر' : '🚨 Emergency SOS System - Direct Call'}
                      </h3>
                      <p className="text-xl text-muted-foreground mb-6">
                        {isArabic 
                          ? 'في حالة الطوارئ، يضغط السائق على زر SOS للاتصال الفوري بالمدرسة والأهل' 
                          : 'In case of emergency, driver presses SOS button for instant call to school and parents'}
                      </p>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="text-xl font-semibold text-destructive">
                            {isArabic ? 'كيف يعمل:' : 'How it works:'}
                          </h4>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                              <span className="text-2xl">1️⃣</span>
                              <span>{isArabic ? 'السائق يضغط زر SOS في التطبيق' : 'Driver presses SOS button in app'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-2xl">2️⃣</span>
                              <span>{isArabic ? 'يتم الاتصال التلقائي بإدارة المدرسة' : 'Automatic call to school management'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-2xl">3️⃣</span>
                              <span>{isArabic ? 'إرسال إشعارات طوارئ لجميع أهالي الطلاب في الحافلة' : 'Emergency notifications to all parents of students on bus'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-2xl">4️⃣</span>
                              <span>{isArabic ? 'مشاركة موقع GPS المباشر مع خدمات الطوارئ' : 'Share live GPS location with emergency services'}</span>
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-xl font-semibold text-destructive">
                            {isArabic ? 'ماذا يحصل بعدها:' : 'What happens next:'}
                          </h4>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                              <span>{isArabic ? 'تسجيل صوتي مباشر للموقف' : 'Live audio recording of situation'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                              <span>{isArabic ? 'أقرب مدرسة أو مستشفى على الخريطة' : 'Nearest school or hospital on map'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                              <span>{isArabic ? 'خيار إضافة الشرطة والإسعاف للمكالمة' : 'Option to add police and ambulance to call'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                              <span>{isArabic ? 'تسجيل كامل للحدث بالوقت والموقع' : 'Complete event log with time and location'}</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="mt-8 p-6 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-lg font-semibold text-center">
                          {isArabic 
                            ? '⚡ استجابة فورية - لا انتظار - الأهل والمدرسة يعرفون فوراً' 
                            : '⚡ Instant Response - No waiting - Parents and school know immediately'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Driver Safety Features */}
            <ScrollReveal direction="up" delay={0.4}>
              <Card className="glass border-primary/20">
                <CardContent className="p-8">
                  <h3 className="text-3xl font-bold mb-6 text-primary text-center">
                    {isArabic ? 'ميزات السلامة للسائق' : 'Driver Safety Features'}
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-primary" />
                      </div>
                      <h4 className="font-semibold mb-2">
                        {isArabic ? 'تنبيهات السرعة' : 'Speed Alerts'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'تحذير إذا تجاوز السائق الحد المسموح' : 'Warning if driver exceeds speed limit'}
                      </p>
                    </div>
                    <div className="text-center p-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-primary" />
                      </div>
                      <h4 className="font-semibold mb-2">
                        {isArabic ? 'مراقبة ساعات القيادة' : 'Driving Hours Monitor'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'تتبع ساعات العمل لتجنب الإرهاق' : 'Track work hours to avoid fatigue'}
                      </p>
                    </div>
                    <div className="text-center p-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-primary" />
                      </div>
                      <h4 className="font-semibold mb-2">
                        {isArabic ? 'عدد الطلاب' : 'Student Count'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'التأكد من عدد الطلاب قبل وبعد كل رحلة' : 'Verify student count before and after each trip'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
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
                      <div className="text-sm font-normal text-muted-foreground">{isArabic ? '$999/سنة (للمدرسة بأكملها)' : '$999/year (whole school)'}</div>
                      <div className="text-xs text-destructive">{isArabic ? '+ تكاليف إضافية للميزات' : '+ extra costs for features'}</div>
                    </th>
                    <th className="p-6 text-center">
                      <div className="text-xl font-bold mb-2">FeKara</div>
                      <div className="text-sm font-normal text-muted-foreground">{isArabic ? '$100/سنة (للمدرسة)' : '$100/year (per school)'}</div>
                      <div className="text-xs text-destructive">{isArabic ? 'ميزات محدودة جداً' : 'Very limited features'}</div>
                    </th>
                    <th className="p-6 text-center">
                      <div className="text-xl font-bold mb-2">Classter</div>
                      <div className="text-sm font-normal text-muted-foreground">{isArabic ? 'اتصل بالمبيعات' : 'Contact sales'}</div>
                      <div className="text-xs text-destructive">{isArabic ? 'عادة $2000+ سنوياً' : 'Typically $2000+/year'}</div>
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
              {isArabic ? 'جاهز في أسبوع واحد' : 'Ready in 1 Week'}
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-2xl text-center text-muted-foreground mb-16">
              {isArabic ? 'تنفيذ سريع ومباشر - من التركيب إلى الإطلاق الكامل' : 'Fast and direct implementation - from setup to full launch'}
            </p>
          </ScrollReveal>

          <div className="max-w-5xl mx-auto">
            <ScrollReveal direction="up" delay={0.3}>
              <Card className="glass border-primary/20">
                <CardContent className="p-10">
                  <div className="space-y-8">
                    {/* Day 1-2 */}
                    <div className="flex gap-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-primary">1-2</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-3">
                          {isArabic ? 'اليوم 1-2: الإعداد والتدريب' : 'Day 1-2: Setup & Training'}
                        </h3>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• {isArabic ? 'إعداد المنصة واستيراد البيانات' : 'Platform setup and data import'}</li>
                          <li>• {isArabic ? 'تدريب الإدارة والمعلمين' : 'Admin and teacher training'}</li>
                          <li>• {isArabic ? 'تكوين الصفوف والجداول' : 'Configure classes and schedules'}</li>
                        </ul>
                      </div>
                    </div>

                    {/* Day 3-4 */}
                    <div className="flex gap-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-primary">3-4</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-3">
                          {isArabic ? 'اليوم 3-4: تركيب الأجهزة' : 'Day 3-4: Hardware Installation'}
                        </h3>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• {isArabic ? 'تركيب قارئات NFC في نقاط الدخول والمقصف' : 'Install NFC readers at entrances and canteen'}</li>
                          <li>• {isArabic ? 'إعداد أجهزة تتبع GPS في الحافلات' : 'Set up GPS trackers on buses'}</li>
                          <li>• {isArabic ? 'توزيع أساور/بطاقات NFC على الطلاب' : 'Distribute NFC wristbands/cards to students'}</li>
                        </ul>
                      </div>
                    </div>

                    {/* Day 5 */}
                    <div className="flex gap-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-primary">5</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-3">
                          {isArabic ? 'اليوم 5: تفعيل الأهل' : 'Day 5: Parent Onboarding'}
                        </h3>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• {isArabic ? 'إرسال دعوات أوتوماتيكية لتحميل التطبيق' : 'Send automatic invitations to download app'}</li>
                          <li>• {isArabic ? 'أدلة تعليمات بسيطة بالعربية والإنجليزية' : 'Simple guides in Arabic and English'}</li>
                          <li>• {isArabic ? 'جلسة تعريفية للأهل (اختيارية)' : 'Parent orientation session (optional)'}</li>
                        </ul>
                      </div>
                    </div>

                    {/* Day 6-7 */}
                    <div className="flex gap-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-primary">6-7</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-3">
                          {isArabic ? 'اليوم 6-7: الإطلاق والدعم' : 'Day 6-7: Launch & Support'}
                        </h3>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• {isArabic ? 'اختبار شامل لجميع الأنظمة' : 'Comprehensive testing of all systems'}</li>
                          <li>• {isArabic ? 'إطلاق تجريبي مع عدد محدود من الطلاب' : 'Soft launch with limited students'}</li>
                          <li>• {isArabic ? 'الإطلاق الكامل مع دعم 24/7' : 'Full rollout with 24/7 support'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Thank You Page */}
      <section className="min-h-screen flex items-center justify-center print-page">
        <div className="container mx-auto px-8 text-center">
          <ScrollReveal direction="scale">
            <div className="relative inline-flex items-center justify-center w-40 h-40 rounded-full bg-primary/10 mb-8">
              <div className="absolute -inset-5 bg-primary/20 blur-3xl rounded-full" />
              <span className="relative text-8xl font-bold text-primary leading-none">
                t
              </span>
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
            <div className="space-y-4 text-2xl" dir="ltr">
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
              <div className="mt-6 max-w-3xl mx-auto text-sm space-y-2 text-left" dir="ltr">
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
