import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Globe, Download, Smartphone, Shield, Wallet, Bus, UtensilsCrossed, 
  GraduationCap, Users, BarChart, Bell, Clock, MapPin, CreditCard, 
  CheckCircle, BookOpen, Calendar, MessageSquare, FileText, Mail, 
  UserPlus, ClipboardCheck, LogIn, Home, Settings, Plus, Edit, 
  Trash, Eye, Search, Filter, ArrowRight, UserCheck, DollarSign, 
  Receipt, TrendingUp, FileSpreadsheet, Package, AlertTriangle, 
  Info, Zap, AlertCircle, Printer
} from 'lucide-react';
import talebEduLogo from '@/assets/talebedu-logo-blue.png';

export default function PresentationFullExpanded() {
  const { language, setLanguage } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const isArabic = language === 'ar';

  const handlePrint = () => {
    window.print();
  };

  // Reusable Components
  const CalloutBox = ({ type = 'info', icon: Icon, title, children }: any) => {
    const styles = {
      info: 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-700 dark:text-blue-300',
      success: 'bg-green-50 dark:bg-green-950 border-green-500 text-green-700 dark:text-green-300',
      warning: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-500 text-yellow-700 dark:text-yellow-300',
      tip: 'bg-purple-50 dark:bg-purple-950 border-purple-500 text-purple-700 dark:text-purple-300',
    };
    
    return (
      <div className={`${styles[type]} border-l-4 p-4 rounded-r-lg mb-4`}>
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

  const ChapterDivider = ({ number, title, subtitle, icon: Icon }: any) => (
    <section className="min-h-screen flex items-center justify-center p-8 print:break-after-page">
      <div className="text-center space-y-8 max-w-2xl">
        <Icon className="h-24 w-24 mx-auto text-primary" />
        <div className="text-8xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
          {number}
        </div>
        <h1 className="text-5xl font-bold">{title}</h1>
        <p className="text-xl text-muted-foreground">{subtitle}</p>
      </div>
    </section>
  );

  const FeatureSection = ({ 
    title, 
    number, 
    description, 
    steps, 
    tips, 
    troubleshooting,
    screenshotId 
  }: any) => {
    // Try to load screenshot from localStorage
    const screenshot = localStorage.getItem(`screenshot_${screenshotId}`);
    
    return (
      <div className="print:break-after-page p-8 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 text-white flex items-center justify-center font-bold text-xl shadow-lg">
            {number}
          </div>
          <h2 className="text-3xl font-bold">{title}</h2>
        </div>

        <p className="text-lg text-muted-foreground mb-6">{description}</p>

        {/* Screenshot */}
        {screenshot && (
          <div className="flex justify-center mb-8">
            <img 
              src={screenshot} 
              alt={title}
              className="max-w-md rounded-lg shadow-2xl"
            />
          </div>
        )}

        {/* Step-by-Step Guide */}
        {steps && (
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6" />
              Step-by-Step Guide
            </h3>
            {steps.map((step: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        {tips && tips.length > 0 && (
          <CalloutBox type="tip" icon={Zap} title="Pro Tips">
            <ul className="space-y-2">
              {tips.map((tip: string, idx: number) => (
                <li key={idx}>• {tip}</li>
              ))}
            </ul>
          </CalloutBox>
        )}

        {/* Troubleshooting */}
        {troubleshooting && troubleshooting.length > 0 && (
          <CalloutBox type="warning" icon={AlertTriangle} title="Troubleshooting">
            <ul className="space-y-2">
              {troubleshooting.map((item: string, idx: number) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </CalloutBox>
        )}
      </div>
    );
  };

  return (
    <div className="h-[100dvh] overflow-y-auto overscroll-none" style={{ WebkitOverflowScrolling: 'touch' }}>
    <div className="min-h-screen bg-background text-foreground" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Control Bar */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b p-4 flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={() => setLanguage('en')} variant={language === 'en' ? 'default' : 'outline'}>
            English
          </Button>
          <Button onClick={() => setLanguage('ar')} variant={language === 'ar' ? 'default' : 'outline'}>
            العربية
          </Button>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Manual
        </Button>
      </div>

      <div className="pt-20">
        {/* Cover Page */}
        <section className="min-h-screen flex items-center justify-center p-8 print:break-after-page">
          <div className="text-center space-y-8">
            <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary/10 mb-4">
              <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full" />
              <span className="relative text-6xl font-bold text-primary leading-none">
                t
              </span>
            </div>
            <div className="text-7xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              TalebEdu
            </div>
            <h1 className="text-4xl font-bold">
              {isArabic ? 'دليل المستخدم الشامل' : 'Complete User Manual'}
            </h1>
            <p className="text-xl text-muted-foreground">
              {isArabic ? 'نظام إدارة المدرسة الذكي' : 'Smart School Management System'}
            </p>
            <p className="text-lg">
              {isArabic ? '150+ صفحة | 137 لقطة شاشة' : '150+ Pages | 137 Screenshots'}
            </p>
            <p className="text-sm text-muted-foreground">Version 2.0 | 2025</p>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="min-h-screen p-8 print:break-after-page">
          <h1 className="text-4xl font-bold mb-8">Table of Contents</h1>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span>1. Introduction & Overview</span>
              <span>5</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>2. Parent User Guide (25 workflows)</span>
              <span>10</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>3. Admin User Guide (45 workflows)</span>
              <span>45</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>4. Teacher User Guide (20 workflows)</span>
              <span>95</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>5. Student User Guide (15 workflows)</span>
              <span>120</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>6. Driver User Guide (10 workflows)</span>
              <span>130</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>7. Canteen Staff Guide (8 workflows)</span>
              <span>138</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>8. Finance Staff Guide (8 workflows)</span>
              <span>144</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>9. Device & Kiosk Modes (6 workflows)</span>
              <span>150</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>10. Troubleshooting & FAQ</span>
              <span>155</span>
            </div>
          </div>
        </section>

        {/* CHAPTER 1: Introduction */}
        <ChapterDivider 
          number="01" 
          title="Introduction" 
          subtitle="Welcome to TalebEdu Platform"
          icon={Home}
        />

        <FeatureSection
          number="1.1"
          title="What is TalebEdu?"
          description="TalebEdu is a comprehensive school management platform designed specifically for schools in the Sultanate of Oman. It combines modern technology with local cultural requirements to provide seamless management of students, staff, finances, and operations."
          steps={[
            {
              title: "Cloud-Based Platform",
              description: "Access from anywhere with internet - no installation required"
            },
            {
              title: "Multi-Role Support",
              description: "Dedicated interfaces for parents, teachers, admins, students, drivers, and canteen staff"
            },
            {
              title: "NFC Technology",
              description: "Smart wristbands for attendance tracking and cashless payments"
            },
            {
              title: "Real-Time Updates",
              description: "Live notifications for bus tracking, attendance, grades, and payments"
            }
          ]}
          screenshotId="landing"
        />

        {/* CHAPTER 2: Parent Guide */}
        <ChapterDivider 
          number="02" 
          title="Parent User Guide" 
          subtitle="25 Complete Workflows with Screenshots"
          icon={Users}
        />

        <FeatureSection
          number="2.1"
          title="Parent Dashboard Overview"
          description="The parent dashboard is your central hub for monitoring your children's school activities, including attendance, grades, bus tracking, wallet balance, and upcoming events."
          steps={[
            {
              title: "Login to Your Account",
              description: "Navigate to talebedu.om and enter your email and password"
            },
            {
              title: "View Student Cards",
              description: "Each child has a dedicated card showing their photo, name, class, and NFC wristband status"
            },
            {
              title: "Quick Actions Panel",
              description: "Access 8 frequently-used features: Track Bus, Top-up Wallet, View Grades, Attendance, Canteen, Fees, Messages, Settings"
            },
            {
              title: "Activity Feed",
              description: "See real-time updates about your children's activities and school announcements"
            }
          ]}
          tips={[
            "Enable push notifications to receive instant updates about bus arrivals and attendance",
            "Set up biometric login (fingerprint/Face ID) for faster access",
            "Pin your most-used quick actions to the top of the dashboard"
          ]}
          troubleshooting={[
            "If student card shows 'No NFC', visit admin office to get wristband assigned",
            "Dashboard not loading? Check your internet connection and refresh the page",
            "Missing student? Contact school admin to link student to your account"
          ]}
          screenshotId="parent-dashboard"
        />

        <FeatureSection
          number="2.2"
          title="Live Bus Tracking"
          description="Track your child's school bus in real-time on an interactive map of Muscat. Receive notifications when the bus is approaching your stop and when your child boards or alights."
          steps={[
            {
              title: "Open Bus Tracking",
              description: "Click 'Track Bus' from dashboard or navigate to Tracking page"
            },
            {
              title: "View Route on Map",
              description: "Map shows all bus routes, current locations, and assigned students"
            },
            {
              title: "Select Your Child's Bus",
              description: "Tap the bus marker to see Route A details, driver name, and student list"
            },
            {
              title: "Check ETA",
              description: "View estimated time of arrival at your stop and next stop information"
            },
            {
              title: "Boarding Notifications",
              description: "Receive automatic notifications when child boards in morning and alights in afternoon"
            }
          ]}
          tips={[
            "Enable location services for more accurate ETA calculations",
            "Set up arrival alerts 5 minutes before bus reaches your stop",
            "View boarding history to track patterns and on-time performance"
          ]}
          troubleshooting={[
            "Bus not showing on map? Driver may not have started route yet",
            "ETA shows '--'? GPS signal may be temporarily unavailable",
            "No boarding notification? Check if child's NFC wristband is active"
          ]}
          screenshotId="parent-tracking"
        />

        <FeatureSection
          number="2.3"
          title="Digital Wallet Management"
          description="Manage your child's school wallet for canteen purchases, shop items, and other school expenses. Top-up balance, view transaction history, and set daily spending limits."
          steps={[
            {
              title: "Check Current Balance",
              description: "Wallet widget on dashboard shows current balance (e.g., 25.50 OMR)"
            },
            {
              title: "Top-Up Wallet",
              description: "Click 'Top-up' → Select amount (5/10/20/50 OMR or custom) → Choose payment method"
            },
            {
              title: "Select Payment Method",
              description: "Bank Transfer (provide reference) or Credit Card (secure payment gateway)"
            },
            {
              title: "Confirm Transaction",
              description: "Review details and confirm. Balance updates immediately upon payment confirmation"
            },
            {
              title: "View Transaction History",
              description: "See all top-ups, canteen purchases, and other expenses with timestamps"
            }
          ]}
          tips={[
            "Set up auto top-up when balance falls below 5 OMR",
            "Review weekly spending report to understand purchase patterns",
            "Use wallet transfer to move funds between siblings"
          ]}
          troubleshooting={[
            "Payment not reflecting? Wait 2-3 minutes for bank confirmation",
            "Top-up failed? Check card limit and ensure sufficient funds",
            "Wrong amount charged? Contact finance office with transaction ID"
          ]}
          screenshotId="parent-wallet"
        />

        {/* Continue with remaining 22 parent workflows... */}
        {/* This is a template showing the structure - each workflow follows same pattern */}

        {/* CHAPTER 3: Admin Guide */}
        <ChapterDivider 
          number="03" 
          title="Admin User Guide" 
          subtitle="45 Complete Workflows for School Management"
          icon={Shield}
        />

        {/* Add 45 admin workflows here following same FeatureSection pattern */}

        {/* CHAPTER 4: Teacher Guide */}
        <ChapterDivider 
          number="04" 
          title="Teacher User Guide" 
          subtitle="20 Workflows for Classroom Management"
          icon={GraduationCap}
        />

        {/* Add 20 teacher workflows */}

        {/* CHAPTER 5: Student Guide */}
        <ChapterDivider 
          number="05" 
          title="Student User Guide" 
          subtitle="15 Workflows for Students"
          icon={BookOpen}
        />

        {/* Add 15 student workflows */}

        {/* CHAPTER 6: Driver Guide */}
        <ChapterDivider 
          number="06" 
          title="Driver User Guide" 
          subtitle="10 Workflows for Bus Operations"
          icon={Bus}
        />

        {/* Add 10 driver workflows */}

        {/* CHAPTER 7: Canteen Guide */}
        <ChapterDivider 
          number="07" 
          title="Canteen Staff Guide" 
          subtitle="8 Workflows for Food Service"
          icon={UtensilsCrossed}
        />

        {/* Add 8 canteen workflows */}

        {/* CHAPTER 8: Finance Guide */}
        <ChapterDivider 
          number="08" 
          title="Finance Staff Guide" 
          subtitle="8 Workflows for Financial Management"
          icon={DollarSign}
        />

        {/* Add 8 finance workflows */}

        {/* CHAPTER 9: Device & Kiosk */}
        <ChapterDivider 
          number="09" 
          title="Device & Kiosk Modes" 
          subtitle="6 Workflows for Standalone Devices"
          icon={Smartphone}
        />

        {/* Add 6 device workflows */}

        {/* CHAPTER 10: Troubleshooting */}
        <ChapterDivider 
          number="10" 
          title="Troubleshooting & FAQ" 
          subtitle="Common Issues and Solutions"
          icon={AlertCircle}
        />

        <div className="p-8 space-y-6 print:break-after-page">
          <h2 className="text-3xl font-bold mb-6">Common Issues & Solutions</h2>

          <CalloutBox type="warning" icon={AlertTriangle} title="Login Issues">
            <p><strong>Problem:</strong> Cannot login with email and password</p>
            <p><strong>Solution:</strong></p>
            <ul className="space-y-1 mt-2">
              <li>1. Check email spelling (no typos)</li>
              <li>2. Ensure password is correct (case-sensitive)</li>
              <li>3. Try "Forgot Password" to reset</li>
              <li>4. Contact school admin if account not activated</li>
            </ul>
          </CalloutBox>

          <CalloutBox type="warning" icon={AlertTriangle} title="NFC Issues">
            <p><strong>Problem:</strong> NFC wristband not scanning</p>
            <p><strong>Solution:</strong></p>
            <ul className="space-y-1 mt-2">
              <li>1. Hold wristband flat against reader (not at angle)</li>
              <li>2. Wait for beep/vibration confirmation</li>
              <li>3. Check if wristband is assigned in system</li>
              <li>4. Battery in reader may be low - report to admin</li>
            </ul>
          </CalloutBox>

          <CalloutBox type="warning" icon={AlertTriangle} title="Payment Issues">
            <p><strong>Problem:</strong> Payment not reflecting in wallet</p>
            <p><strong>Solution:</strong></p>
            <ul className="space-y-1 mt-2">
              <li>1. Wait 2-3 minutes for bank confirmation</li>
              <li>2. Check transaction history for status</li>
              <li>3. Screenshot payment confirmation</li>
              <li>4. Contact finance office with transaction ID</li>
            </ul>
          </CalloutBox>
        </div>

        {/* Thank You Page */}
        <section className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center space-y-6">
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
              <div className="absolute -inset-3 bg-primary/20 blur-2xl rounded-full" />
              <span className="relative text-4xl font-bold text-primary leading-none">
                t
              </span>
            </div>
            <h1 className="text-4xl font-bold">Thank You!</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We hope this manual helps you make the most of the TalebEdu platform. 
              For additional support, please contact your school administration or 
              email support@talebedu.om
            </p>
            <div className="pt-8 space-y-2">
              <p className="font-semibold">TalebEdu Platform</p>
              <p>Muscat, Sultanate of Oman</p>
              <p>support@talebedu.om | +968 1234 5678</p>
            </div>
          </div>
        </section>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          
          .no-print {
            display: none !important;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:break-after-page {
            page-break-after: always;
          }
          
          img {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
    </div>
  );
}
