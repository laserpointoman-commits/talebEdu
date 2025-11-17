import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ScreenshotConfig {
  name: string;
  prompt: string;
  width: number;
  height: number;
  language: 'en' | 'ar';
}

const SCREENSHOTS: ScreenshotConfig[] = [
  {
    name: 'parent-dashboard',
    language: 'en',
    width: 1400,
    height: 900,
    prompt: 'Modern parent dashboard UI for school management system. Show: Large "Welcome, Sarah" header at top. Below that, 3 student cards in a row, each card shows student photo (circular), name "Ahmed Ali" age 12, Grade 7, and a green "Present" badge. Below cards: 8 large icon buttons in 2 rows (Track Bus, View Wallet, Canteen Orders, Check Grades, Attendance, Messages, Pay Fees, Reports). Right sidebar: Wallet balance "$250" in large text with green card background, and Activity feed showing 3 recent items with timestamps. Use blue/white color scheme, modern shadows, clean spacing. Professional educational app design.'
  },
  {
    name: 'parent-dashboard-ar',
    language: 'ar',
    width: 1400,
    height: 900,
    prompt: 'Arabic (RTL) parent dashboard UI. Right-to-left layout. Top right: "مرحباً، سارة". Below: 3 student cards right-aligned showing circular photos, Arabic names "أحمد علي" عمر 12، الصف السابع، with green "حاضر" badges. Below: 8 icon buttons in Arabic (تتبع الحافلة، المحفظة، الكافتيريا، الدرجات، الحضور، الرسائل، دفع الرسوم، التقارير). Left sidebar: "رصيد المحفظة" showing "$250" with activity feed in Arabic. Blue/white theme, RTL text direction, modern shadows.'
  },
  {
    name: 'bus-tracking-map',
    language: 'en',
    width: 1400,
    height: 900,
    prompt: 'Live bus tracking map interface. Large interactive map showing: Blue bus icon on road with motion trail, blue route line connecting 5 stops (marked with small circles), green home icon at destination, current location pin. Top right overlay: White card showing "Bus #12", ETA "8 minutes", Next Stop "Al Khuwair Street", student status "Ahmed is on board" with green checkmark. Bottom: Route timeline showing 5 stops with current position highlighted. Modern map UI with clean blue/white/green color scheme, realistic map texture.'
  },
  {
    name: 'bus-tracking-map-ar',
    language: 'ar',
    width: 1400,
    height: 900,
    prompt: 'Arabic (RTL) bus tracking map. Large map with blue bus icon, blue route line, 5 stops, green home icon. Top LEFT overlay card (RTL): "حافلة رقم 12"، "8 دقائق"، "المحطة التالية: شارع الخوير"، "أحمد على متن الحافلة" with checkmark. Bottom: Arabic timeline of stops right-aligned. Blue/white/green colors, RTL layout, Arabic text.'
  },
  {
    name: 'digital-wallet',
    language: 'en',
    width: 1200,
    height: 900,
    prompt: 'Digital wallet interface. Top: Large balance card with gradient blue background showing "$250.00" in huge text, "Available Balance" subtitle, "Top Up" and "Transfer" buttons. Below: "Recent Transactions" section showing list of 6 transactions with icons, descriptions (Canteen Purchase $5, Bus Fee $20, Top Up $100), dates, and amounts in green/red. Right side: Pie chart showing spending breakdown (Canteen 45%, Transport 30%, Other 25%) with legend. Bottom: Transaction filters. Modern financial app design, blue/green color scheme.'
  },
  {
    name: 'digital-wallet-ar',
    language: 'ar',
    width: 1200,
    height: 900,
    prompt: 'Arabic (RTL) digital wallet. Top: Large balance card "250.00 ريال" in huge text, "الرصيد المتاح" subtitle, buttons "شحن" and "تحويل". Below: "المعاملات الأخيرة" showing 6 Arabic transactions right-aligned (شراء من الكافتيريا، رسوم الحافلة، شحن الرصيد). LEFT side: Pie chart with Arabic labels. RTL layout, Arabic numerals, blue/green theme.'
  },
  {
    name: 'canteen-menu',
    language: 'en',
    width: 1400,
    height: 900,
    prompt: 'School canteen menu grid. Top: "Canteen Menu" header with cart icon showing "3 items". Below: 2x4 grid of food item cards. Each card: Food photo (burger, pizza, juice, salad, sandwich, fruit, snack, dessert), item name, price "$3.50", calories "250 cal", dietary icons (vegetarian, gluten-free), and green "Add to Cart" button. Right sidebar: Cart summary showing 3 items, subtotal, total "$10.50", and large "Checkout" button. Modern food ordering app, appetizing food photos, green/orange accents.'
  },
  {
    name: 'canteen-menu-ar',
    language: 'ar',
    width: 1400,
    height: 900,
    prompt: 'Arabic (RTL) canteen menu. Top right: "قائمة الكافتيريا" with cart icon "3 عناصر". Below: 2x4 grid of food items right-aligned, Arabic names (برجر، بيتزا، عصير، سلطة), prices "3.50 ريال", "250 سعرة", dietary icons, green "إضافة" buttons. LEFT sidebar: Cart in Arabic showing items, "المجموع: 10.50 ريال", large "الدفع" button. RTL layout, appetizing photos, green/orange theme.'
  },
  {
    name: 'grades-dashboard',
    language: 'en',
    width: 1400,
    height: 900,
    prompt: 'Student grades dashboard. Top: "Academic Performance" header with semester selector. Below: 3x2 grid of subject cards (Math, Science, English, Arabic, History, Art). Each card: Subject name, large grade "A+" or "85%", progress bar, mini line chart showing trend, teacher name. Right panel: Overall GPA "3.8/4.0" in large circle, class rank "5th/45", performance radar chart showing 6 subjects. Bottom: Upcoming exams list with dates. Academic blue/purple theme, charts and graphs, professional education UI.'
  },
  {
    name: 'grades-dashboard-ar',
    language: 'ar',
    width: 1400,
    height: 900,
    prompt: 'Arabic (RTL) grades dashboard. Top right: "الأداء الأكاديمي" with semester selector. 3x2 grid right-aligned (رياضيات، علوم، إنجليزي، عربي، تاريخ، فن), each showing Arabic grades "ممتاز" or "85%", progress bars, mini charts, teacher names in Arabic. LEFT panel: GPA "3.8/4.0" in circle, "الترتيب: 5/45", radar chart with Arabic labels. Bottom: Upcoming exams in Arabic. RTL layout, blue/purple theme.'
  },
  {
    name: 'admin-dashboard',
    language: 'en',
    width: 1400,
    height: 900,
    prompt: 'School admin dashboard. Top: "Admin Dashboard" with date. Below: 4 KPI cards in row (Total Students 1,248, Active Teachers 58, Attendance Today 94%, Revenue This Month $45,200). Middle: 3 charts side-by-side (Bar chart for weekly attendance, Line chart for monthly revenue, Donut chart for student distribution by grade). Bottom section: 2 columns - left shows "Pending Approvals" table with 5 items, right shows "Quick Actions" with 8 large buttons (Add Student, Manage Fees, Send Notification, View Reports, etc). Professional admin interface, blue/gray/green colors, clean modern design.'
  },
  {
    name: 'admin-dashboard-ar',
    language: 'ar',
    width: 1400,
    height: 900,
    prompt: 'Arabic (RTL) admin dashboard. Top right: "لوحة تحكم المسؤول" with date. 4 KPI cards right-aligned (إجمالي الطلاب 1,248، المعلمين 58، الحضور اليوم 94%، الإيرادات 45,200 ريال). Middle: 3 charts with Arabic labels (رسم الحضور، الإيرادات، توزيع الطلاب). Bottom: RIGHT column "الموافقات المعلقة" table, LEFT column "إجراءات سريعة" buttons in Arabic. RTL layout, blue/gray/green, Arabic text throughout.'
  },
  {
    name: 'student-registration',
    language: 'en',
    width: 1200,
    height: 900,
    prompt: 'Student registration form. Top: "Register New Student" header with progress bar showing "Step 2 of 5". Form sections: Personal Info (First Name, Last Name, Date of Birth fields with labels), photo upload area with placeholder silhouette and "Upload Photo" button, Grade & Class dropdowns, Parent Info section, Medical Information section with checkboxes for allergies, Emergency Contact fields. Right sidebar: Checklist showing completed steps. Bottom: "Previous" and "Continue" buttons. Clean form design, blue accents, clear field labels, organized sections.'
  },
  {
    name: 'student-registration-ar',
    language: 'ar',
    width: 1200,
    height: 900,
    prompt: 'Arabic (RTL) student registration form. Top right: "تسجيل طالب جديد" with progress bar "الخطوة 2 من 5". Form right-aligned: معلومات شخصية (الاسم الأول، الاسم الأخير، تاريخ الميلاد), photo upload "رفع صورة", الصف والشعبة dropdowns, معلومات ولي الأمر, المعلومات الطبية with checkboxes for حساسية, جهة اتصال الطوارئ. LEFT sidebar: Checklist in Arabic. Bottom: "السابق" and "متابعة" buttons. RTL layout, blue accents, Arabic labels.'
  },
  {
    name: 'attendance-calendar',
    language: 'en',
    width: 1400,
    height: 900,
    prompt: 'Attendance calendar view. Top: "Attendance - Ahmed Ali" header with month/year selector showing "January 2025". Large calendar grid showing full month, each day cell colored: green for present, red for absent, yellow for late, gray for weekend/holiday. Numbers show "23 Present, 2 Absent, 1 Late" in color-coded badges. Below calendar: Detailed list view of recent attendance with dates, times, entry/exit times, and status icons. Right sidebar: Monthly statistics with percentage bar, attendance streak counter. Clean calendar UI, color-coded, easy to read.'
  },
  {
    name: 'attendance-calendar-ar',
    language: 'ar',
    width: 1400,
    height: 900,
    prompt: 'Arabic (RTL) attendance calendar. Top right: "الحضور - أحمد علي" with "يناير 2025" selector. Calendar grid right-aligned, days in Arabic (السبت to الجمعة), colored cells (green حاضر, red غائب, yellow متأخر, gray إجازة). Statistics badges in Arabic "23 حاضر، 2 غائب، 1 متأخر". Below: List of recent attendance in Arabic. LEFT sidebar: Monthly stats with Arabic labels. RTL layout, color-coded, Arabic calendar format.'
  },
  {
    name: 'notifications-center',
    language: 'en',
    width: 1200,
    height: 900,
    prompt: 'Notifications center interface. Top: "Notifications" header with unread badge showing "5" and "Mark all as read" button. Tabs: All, Attendance, Payments, Grades, Messages. Below: List of 8 notifications, each showing: colored icon (blue info, green success, red alert, yellow warning), title, message text, timestamp, and action button. Unread notifications have blue left border and bold text. Read notifications are grayed out. Mix of notification types: attendance alert, payment due, grade posted, bus arrival, message received. Modern notification UI, clean list design.'
  },
  {
    name: 'notifications-center-ar',
    language: 'ar',
    width: 1200,
    height: 900,
    prompt: 'Arabic (RTL) notifications center. Top right: "الإشعارات" with badge "5" and "تحديد الكل كمقروء" button. Tabs right-aligned: الكل، الحضور، المدفوعات، الدرجات، الرسائل. List of 8 notifications right-aligned: colored icons (right side in RTL), Arabic titles and messages, timestamps, action buttons. Unread have RIGHT blue border. Mix of Arabic notification types. RTL layout, clean design, Arabic text.'
  },
  {
    name: 'teacher-class-management',
    language: 'en',
    width: 1400,
    height: 900,
    prompt: 'Teacher class management interface. Top: "Grade 7-A Mathematics" header with class info (45 students, Room 204). Top section: Quick stats cards (Present Today 42/45, Average Grade 78%, Homework Submitted 38/45). Middle: Student list table with columns (Photo, Name, Attendance, Last Grade, Homework Status), 10 rows visible, checkboxes for selection, action buttons (Mark Attendance, Enter Grades, Send Message). Right sidebar: Today\'s schedule showing 4 periods, upcoming assignments list. Bottom: Grade distribution chart. Teacher-focused UI, organized table, blue/green theme.'
  },
  {
    name: 'teacher-class-management-ar',
    language: 'ar',
    width: 1400,
    height: 900,
    prompt: 'Arabic (RTL) teacher class management. Top right: "الصف السابع-أ رياضيات" with info (45 طالب، غرفة 204). Stats cards right-aligned (الحاضرون اليوم 42/45، المعدل 78%، الواجبات 38/45). Student table right-to-left: columns (الصورة، الاسم، الحضور، آخر درجة، حالة الواجب), 10 rows, checkboxes, action buttons in Arabic. LEFT sidebar: جدول اليوم showing periods, assignments. Bottom: Grade chart with Arabic labels. RTL layout, teacher-focused, blue/green.'
  },
  {
    name: 'driver-dashboard',
    language: 'en',
    width: 1200,
    height: 900,
    prompt: 'Bus driver dashboard. Top: "Driver Dashboard - Bus #12" with current time and date. Large map showing route with current position marked. Top right: Card showing "Route: Morning Pickup", "Students: 18/25 on board", "Next Stop: Al Khuwair Street in 3 min". Middle section: Student list with photos, names, pickup status (green checkmark for picked up, gray for waiting), home locations. NFC scan button prominently displayed "Tap to Scan Student Card". Bottom: Today\'s completed trips count, total distance. Driver-focused UI, simple clear buttons, large text for driving visibility.'
  },
  {
    name: 'driver-dashboard-ar',
    language: 'ar',
    width: 1200,
    height: 900,
    prompt: 'Arabic (RTL) driver dashboard. Top right: "لوحة السائق - حافلة رقم 12" with time/date. Map showing route and position. Top LEFT card: "المسار: الصباحي"، "الطلاب: 18/25 على المتن"، "المحطة التالية: شارع الخوير في 3 دقائق". Student list right-aligned with photos, names in Arabic, status icons. Large NFC button "مسح بطاقة الطالب". Bottom: Trip statistics in Arabic. RTL layout, large text, driver-friendly, simple buttons.'
  },
  {
    name: 'canteen-pos',
    language: 'en',
    width: 1400,
    height: 900,
    prompt: 'Canteen point-of-sale interface. Left side (60%): Large number pad for manual entry, search bar at top, current order display showing 3 items with prices, running total "$12.50" in large text. Right side (40%): Quick access food categories (Drinks, Snacks, Meals, Desserts) with large icon buttons. Top center: NFC scan area showing "Tap Student Card to Pay" with card animation. Bottom: Payment methods (Wallet, Cash, Card) and "Complete Sale" button. Canteen staff focused, large touch-friendly buttons, green/orange theme.'
  },
];

export const ScreenshotGenerator = () => {
  const [generating, setGenerating] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [images, setImages] = useState<Record<string, string>>({});

  const generateScreenshot = async (config: ScreenshotConfig) => {
    setGenerating(config.name);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-presentation-screenshots`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ screenshotName: config.name }),
        }
      );

      if (!response.ok) throw new Error('Failed to generate screenshot');

      const data = await response.json();
      setImages(prev => ({ ...prev, [config.name]: data.imageUrl }));
      setCompleted(prev => new Set([...prev, config.name]));
      toast.success(`Generated: ${config.name}`);
    } catch (error) {
      console.error('Error generating screenshot:', error);
      toast.error(`Failed to generate: ${config.name}`);
    } finally {
      setGenerating(null);
    }
  };

  const downloadImage = (name: string, imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${name}.png`;
    link.click();
  };

  const generateAll = async () => {
    for (const config of SCREENSHOTS) {
      if (!completed.has(config.name)) {
        await generateScreenshot(config);
        // Wait 2 seconds between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    toast.success('All screenshots generated!');
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">AI Screenshot Generator</h1>
        <p className="text-lg text-muted-foreground">
          Generate 21 high-quality AI screenshots for the presentation manual.
          Progress: {completed.size}/{SCREENSHOTS.length}
        </p>
        <Button onClick={generateAll} className="mt-4" size="lg">
          Generate All Screenshots
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SCREENSHOTS.map((config) => (
          <Card key={config.name} className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{config.name}</h3>
                {completed.has(config.name) && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">
                {config.width}×{config.height}px • {config.language.toUpperCase()}
              </p>

              {images[config.name] && (
                <img
                  src={images[config.name]}
                  alt={config.name}
                  className="w-full rounded-lg border"
                />
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => generateScreenshot(config)}
                  disabled={generating === config.name || completed.has(config.name)}
                  variant={completed.has(config.name) ? "secondary" : "default"}
                  className="flex-1"
                >
                  {generating === config.name && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {completed.has(config.name) ? 'Generated' : 'Generate'}
                </Button>
                
                {images[config.name] && (
                  <Button
                    onClick={() => downloadImage(config.name, images[config.name])}
                    variant="outline"
                    size="icon"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
