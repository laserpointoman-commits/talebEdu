import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Download, 
  Building2, 
  Users, 
  Bus, 
  CreditCard, 
  ShoppingBag, 
  Shield, 
  TrendingUp,
  CheckCircle2,
  Globe,
  Smartphone,
  MessageSquare,
  GraduationCap,
  Wallet,
  Store,
  AlertTriangle,
  Target,
  Award,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Sparkles,
  Building,
  Landmark,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import jsPDF from "jspdf";

const FeasibilityStudy = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    const addNewPage = () => {
      pdf.addPage();
      yPosition = margin;
    };

    const checkPageBreak = (neededHeight: number) => {
      if (yPosition + neededHeight > pageHeight - margin) {
        addNewPage();
        return true;
      }
      return false;
    };

    const addCenteredText = (text: string, y: number, size: number = 12) => {
      pdf.setFontSize(size);
      const textWidth = pdf.getTextWidth(text);
      pdf.text(text, (pageWidth - textWidth) / 2, y);
    };

    // === صفحة الغلاف ===
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    pdf.setFillColor(59, 130, 246);
    pdf.circle(pageWidth - 30, 40, 60, 'F');
    pdf.setFillColor(16, 185, 129);
    pdf.circle(30, pageHeight - 50, 40, 'F');
    
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(pageWidth/2 - 40, 50, 80, 30, 5, 5, 'F');
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(28);
    addCenteredText('TalebEdu', 70);
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    addCenteredText('Feasibility Study', 105);
    addCenteredText('ىودج ةسارد', 120);
    
    pdf.setFontSize(13);
    addCenteredText('Comprehensive School Management Application', 142);
    addCenteredText('قيبطت لماش ةرادلإ سرادملا ةظفحملاو ةينورتكللإا', 155);
    addCenteredText('تاباوبلاو ةيكذلا رجاتملاو ةيمقرلا', 165);
    
    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(margin + 20, 180, contentWidth - 40, 35, 5, 5, 'F');
    pdf.setFontSize(11);
    addCenteredText('Submitted to / :ىلإ مدقم', 193);
    pdf.setFontSize(15);
    addCenteredText('Oman Development Bank / ينامعلا ةيمنتلا كنب', 205);
    
    pdf.setFontSize(12);
    addCenteredText('Submitted by / :نم مدقملا', 230);
    addCenteredText('Mazen Khanfar - TalebEdu / رفناخ نزام', 242);
    addCenteredText('2026 :ةنسلا / Year: 2026', 255);
    
    pdf.setFontSize(10);
    addCenteredText('Muscat, Sultanate of Oman / نامع ةنطلس ،طقسم', 275);

    // === صفحة 2: الملخص التنفيذي ===
    addNewPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    addCenteredText('Executive Summary / يذيفنتلا صخلملا', 22);
    
    pdf.setTextColor(15, 23, 42);
    yPosition = 50;
    
    pdf.setFontSize(11);
    const execSummary = [
      'TalebEdu is the ONLY application in the world that combines:',
      'ملاعلا يف ديحولا قيبطتلا وه TalebEdu :عمجي يذلا',
      '',
      '• School Management: Attendance, Grades, Homework, Schedules',
      '  ةسردملا ةرادإ: روضحلا ،تاجردلا ،تابجاولا ،لوادجلا',
      '',
      '• Bus Management: 6 buses per school with real-time tracking',
      '  تاصابلا ةرادإ: 6 ةسردم لكل تاصاب عم رشابم عبتت',
      '',
      '• Smart Gates & Canteen with NFC technology',
      '  ةيكذلا تاباوبلا فصقملاو ةينقتب NFC',
      '',
      '• Electronic Wallet for students',
      '  ةينورتكللإا ةظفحملا بلاطلل',
      '',
      '• Digital Store: NFC wristbands + Private Label stationery',
      '  يمقرلا رجتملا: ةيكذ رواسأ + ةيساترق صاخ مسا',
      '',
      '• Integrated Communication: Messages, Voice/Video calls, File sharing',
      '  لماكتم لصاوت: لئاسر ،تاملاكم ةيتوص/ويديف ،ةكراشم تافلم',
    ];
    
    execSummary.forEach(line => {
      checkPageBreak(7);
      pdf.text(line, margin, yPosition);
      yPosition += 6;
    });

    yPosition += 5;
    pdf.setFontSize(12);
    pdf.setTextColor(16, 185, 129);
    pdf.text('Unique Advantages / ةديرفلا ايازملا:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    const advantages = [
      '• Smart Wristband: No charging or maintenance needed',
      '  يكذلا راوسلا: نحش وأ ةنايص نودب',
      '• Multi-language: Arabic, English, Hindi',
      '  تاغللا ددعتم: ةيبرعلا ،ةيزيلجنلإا ،ةيدنهلا',
      '• GCC Expansion in Year 3',
      '  جيلخلا لود ىلإ عسوتلا ةثلاثلا ةنسلا يف',
    ];
    
    advantages.forEach(line => {
      pdf.text(line, margin + 5, yPosition);
      yPosition += 6;
    });

    // === صفحة 3: نطاق المشروع ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    addCenteredText('Project Scope / عورشملا قاطن', 22);
    
    pdf.setTextColor(15, 23, 42);
    yPosition = 50;
    
    const metrics = [
      { labelEn: 'Target', labelAr: 'فدهتسملا', value: 'Private Schools / ةصاخ سرادم' },
      { labelEn: 'Location', labelAr: 'عقوملا', value: 'Muscat & Dakhiliyah / ةيلخادلاو طقسم' },
      { labelEn: 'Year 1 Schools', labelAr: 'ىلولأا ةنسلا سرادم', value: '50' },
      { labelEn: 'Students/School', labelAr: 'ةسردم/بلاط', value: '500' },
      { labelEn: 'Buses/School', labelAr: 'ةسردم/صاب', value: '6' },
      { labelEn: 'Gates/School', labelAr: 'ةسردم/ةباوب', value: '2' },
      { labelEn: 'Canteen/School', labelAr: 'ةسردم/فصقم', value: '1' },
    ];
    
    pdf.setFontSize(10);
    metrics.forEach((metric, i) => {
      const x = i % 2 === 0 ? margin : margin + contentWidth/2;
      const y = yPosition + Math.floor(i/2) * 22;
      
      pdf.setFillColor(240, 249, 255);
      pdf.roundedRect(x, y - 5, contentWidth/2 - 5, 18, 3, 3, 'F');
      pdf.setTextColor(59, 130, 246);
      pdf.text(metric.labelEn + ' / ' + metric.labelAr + ':', x + 3, y + 4);
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(11);
      pdf.text(metric.value, x + 3, y + 12);
      pdf.setFontSize(10);
    });
    
    yPosition += 95;
    
    pdf.setFontSize(13);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Services Offered / ةمدقملا تامدخلا:', margin, yPosition);
    yPosition += 10;
    
    const services = [
      '1. Annual Student Subscription / يونسلا بلاطلا كارتشا',
      '   (Bus, Gate, Canteen, Wallet, Grades tracking)',
      '   (صابلا ،ةباوبلا ،فصقملا ،ةظفحملا ،تاجردلا عبتت)',
      '',
      '2. NFC Wristband Sales / ةيكذلا رواسلأا عيب',
      '',
      '3. Private Label Stationery Store / ةيساترقلا رجتم',
      '',
      '4. Internal Messaging System / ةيلخادلا لئاسرلا ماظن',
    ];
    
    pdf.setFontSize(10);
    services.forEach(service => {
      pdf.text(service, margin + 5, yPosition);
      yPosition += 7;
    });

    // === صفحة 4: المزايا التنافسية ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    addCenteredText('Competitive Advantages / ةيسفانتلا ايازملا', 22);
    
    pdf.setTextColor(15, 23, 42);
    yPosition = 50;
    
    const competitiveAdvantages = [
      { en: 'Smart Wristband - No charging needed', ar: 'نحش نودب - يكذلا راوسلا' },
      { en: 'Comprehensive Tracking (Grades, Homework)', ar: '(تابجاولا ،تاجردلا) لماش عبتت' },
      { en: 'Parental Canteen Control', ar: 'فصقملاب يوبأ مكحت' },
      { en: 'Integrated Communication System', ar: 'لماكتم لصاوت ماظن' },
      { en: 'Digital Marketplace', ar: 'يمقر قوس' },
      { en: 'Multi-Language Support (AR/EN/HI)', ar: '(يدنه/يزيلجنإ/يبرع) تاغللا ددعتم' },
      { en: 'GCC Expansion Ready', ar: 'جيلخلا لودل عسوتلل زهاج' },
      { en: 'Complete Student Safety', ar: 'بلاطلل لماك نامأ' },
      { en: 'FIRST in Oman - Smart Wristband as ID', ar: 'ةيوهك يكذلا راوسلا - نامع يف لولأا' },
      { en: 'Electronic Wallet Pioneer', ar: 'ةينورتكللإا ةظفحملا يف دئار' },
      { en: 'Direct Payment to Schools', ar: 'سرادملل رشابم عفد' },
    ];
    
    pdf.setFontSize(9);
    competitiveAdvantages.forEach((adv, i) => {
      checkPageBreak(14);
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(margin, yPosition - 3, contentWidth, 12, 2, 2, 'F');
      pdf.setTextColor(16, 185, 129);
      pdf.text('✓', margin + 3, yPosition + 4);
      pdf.setTextColor(15, 23, 42);
      pdf.text(adv.en + ' / ' + adv.ar, margin + 10, yPosition + 4);
      yPosition += 14;
    });

    // === صفحة 5: الدراسة المالية - الإيرادات ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    addCenteredText('Financial Study - Revenue / تاداريلإا - ةيلاملا ةساردلا', 22);
    
    yPosition = 50;
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(11);
    pdf.text('A) Annual Revenue - Private Schools (OMR) / ةصاخلا سرادملا - ةيونسلا تاداريلإا', margin, yPosition);
    yPosition += 12;
    
    const tableHeaders = ['Year/ةنسلا', 'Students/بلاط', 'Schools/سرادم', 'Student/بلاط', 'Bus/صاب', 'NFC', 'Stationery/ةيساترق', 'Total/عومجم'];
    const tableData = [
      ['1', '25,000', '50', '625,000', '30,000', '42,500', '312,500', '1,010,000'],
      ['2', '50,000', '100', '1,250,000', '60,000', '85,000', '625,000', '2,020,000'],
      ['3', '100,000', '200', '2,500,000', '120,000', '170,000', '1,250,000', '4,040,000'],
    ];
    
    const colWidths = [18, 18, 18, 22, 20, 18, 28, 28];
    let xPos = margin;
    
    pdf.setFillColor(59, 130, 246);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    tableHeaders.forEach((header, i) => {
      pdf.text(header, xPos + 1, yPosition + 5);
      xPos += colWidths[i];
    });
    yPosition += 8;
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(8);
    tableData.forEach((row, rowIndex) => {
      xPos = margin;
      pdf.setFillColor(rowIndex % 2 === 0 ? 248 : 255, rowIndex % 2 === 0 ? 250 : 255, rowIndex % 2 === 0 ? 252 : 255);
      pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      row.forEach((cell, i) => {
        pdf.text(cell, xPos + 1, yPosition + 5);
        xPos += colWidths[i];
      });
      yPosition += 8;
    });
    
    yPosition += 15;
    pdf.setFontSize(11);
    pdf.text('B) Government + Private Scenario (OMR) / ةصاخلاو ةيموكحلا سرادملا ويرانيس', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    const govScenario = [
      '• Total Students / بلاطلا عومجم: 242,000',
      '  (192,000 Government / ةيموكح + 50,000 Private / ةصاخ)',
      '',
      '• Student Subscriptions / بلاطلا تاكارتشا: 6,050,000 OMR',
      '• Bus Subscriptions / صابلا تاكارتشا: 290,400 OMR',
      '• NFC Profit / NFC حبر: 411,400 OMR',
      '• Stationery Profit / ةيساترقلا حبر: 3,025,000 OMR',
    ];
    
    govScenario.forEach(line => {
      pdf.text(line, margin + 5, yPosition);
      yPosition += 7;
    });
    
    yPosition += 5;
    pdf.setFillColor(16, 185, 129);
    pdf.roundedRect(margin, yPosition - 4, contentWidth, 14, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.text('TOTAL REVENUE / تاداريلإا عومجم = 9,776,800 OMR', margin + 20, yPosition + 5);

    // === صفحة 6: التكاليف الرأسمالية ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    addCenteredText('Capital Expenditure (CAPEX) / ةيلامسأرلا فيلاكتلا', 22);
    
    yPosition = 50;
    
    const capexItems = [
      { item: 'Bus Devices / صابلا ةزهجأ (300)', qty: '300', price: '290', total: '87,000' },
      { item: 'Smart Gates / ةيكذلا تاباوبلا (100)', qty: '100', price: '290', total: '29,000' },
      { item: 'Canteen Systems / فصقملا ةمظنأ (50)', qty: '50', price: '370', total: '18,500' },
      { item: 'Electric Vehicles / ةيئابرهك تارايس', qty: '5', price: '8,000', total: '40,000' },
      { item: 'Employee Devices / نيفظوملا ةزهجأ', qty: '10', price: '1,000', total: '10,000' },
      { item: 'Servers & Data Room / تانايبلا ةفرغو مداوخ', qty: '1', price: '35,000', total: '35,000' },
      { item: 'Company Furniture / ةكرشلا ثاثأ', qty: '1', price: '30,000', total: '30,000' },
      { item: 'Licenses / صيخارتلا', qty: '1', price: '7,000', total: '7,000' },
      { item: 'Initial Stationery / ةيلوأ ةيساترق', qty: '-', price: '-', total: '30,000' },
      { item: 'App Development / قيبطتلا ريوطت', qty: '-', price: '-', total: '25,000' },
      { item: 'Tech Support & Security / ينقت معد', qty: '-', price: '-', total: '18,000' },
    ];
    
    const capexHeaders = ['Item / دنبلا', 'Qty / ةيمك', 'Price / رعس', 'Total / عومجم'];
    const capexColWidths = [85, 20, 30, 35];
    xPos = margin;
    
    pdf.setFillColor(59, 130, 246);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    capexHeaders.forEach((header, i) => {
      pdf.text(header, xPos + 2, yPosition + 5);
      xPos += capexColWidths[i];
    });
    yPosition += 8;
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(8);
    capexItems.forEach((row, rowIndex) => {
      xPos = margin;
      pdf.setFillColor(rowIndex % 2 === 0 ? 248 : 255, rowIndex % 2 === 0 ? 250 : 255, rowIndex % 2 === 0 ? 252 : 255);
      pdf.rect(margin, yPosition, contentWidth, 7, 'F');
      pdf.text(row.item, xPos + 2, yPosition + 5);
      xPos += capexColWidths[0];
      pdf.text(row.qty, xPos + 2, yPosition + 5);
      xPos += capexColWidths[1];
      pdf.text(row.price, xPos + 2, yPosition + 5);
      xPos += capexColWidths[2];
      pdf.text(row.total, xPos + 2, yPosition + 5);
      yPosition += 7;
    });
    
    pdf.setFillColor(15, 23, 42);
    pdf.rect(margin, yPosition, contentWidth, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text('TOTAL CAPEX / ةيلامسأرلا فيلاكتلا عومجم', margin + 5, yPosition + 7);
    pdf.text('329,500 OMR', margin + contentWidth - 40, yPosition + 7);
    
    yPosition += 20;
    
    // OPEX
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(13);
    pdf.text('Operating Expenses (OPEX) / ةيليغشتلا فيلاكتلا', margin, yPosition);
    yPosition += 10;
    
    const opexHeaders = ['Item / دنبلا', 'Monthly / يرهش', 'Annual / يونس'];
    const opexColWidths = [90, 40, 40];
    xPos = margin;
    
    pdf.setFillColor(245, 158, 11);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    opexHeaders.forEach((header, i) => {
      pdf.text(header, xPos + 2, yPosition + 5);
      xPos += opexColWidths[i];
    });
    yPosition += 8;
    
    const opexItems = [
      { item: 'Staff Salaries + Manager / بتاورلا', monthly: '8,500', annual: '102,000' },
      { item: 'Office Rent / راجيلإا', monthly: '2,000', annual: '24,000' },
    ];
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(9);
    opexItems.forEach((row, rowIndex) => {
      xPos = margin;
      pdf.setFillColor(rowIndex % 2 === 0 ? 255 : 248, rowIndex % 2 === 0 ? 251 : 250, rowIndex % 2 === 0 ? 235 : 252);
      pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      pdf.text(row.item, xPos + 2, yPosition + 5);
      xPos += opexColWidths[0];
      pdf.text(row.monthly, xPos + 2, yPosition + 5);
      xPos += opexColWidths[1];
      pdf.text(row.annual, xPos + 2, yPosition + 5);
      yPosition += 8;
    });
    
    pdf.setFillColor(245, 158, 11);
    pdf.rect(margin, yPosition, contentWidth, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text('TOTAL OPEX / ةيليغشتلا فيلاكتلا عومجم', margin + 5, yPosition + 7);
    pdf.text('126,000 OMR / Year', margin + contentWidth - 55, yPosition + 7);

    // === صفحة 7: التدفق النقدي ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    addCenteredText('Cash Flow Analysis / يدقنلا قفدتلا ليلحت', 22);
    
    yPosition = 55;
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(12);
    pdf.text('Year 1 - 50 Schools - 25,000 Students', margin, yPosition);
    pdf.text('بلاط 25,000 - ةسردم 50 - ىلولأا ةنسلا', margin + contentWidth - 70, yPosition);
    yPosition += 15;
    
    const cashFlowData = [
      { labelEn: 'Total Revenue', labelAr: 'تاداريلإا عومجم', value: '1,010,000 OMR', color: [16, 185, 129] },
      { labelEn: 'CAPEX', labelAr: 'ةيلامسأرلا فيلاكتلا', value: '329,500 OMR', color: [239, 68, 68] },
      { labelEn: 'OPEX', labelAr: 'ةيليغشتلا فيلاكتلا', value: '126,000 OMR', color: [245, 158, 11] },
      { labelEn: 'Net Income', labelAr: 'يفاصلا لخدلا', value: '554,500 OMR', color: [59, 130, 246] },
    ];
    
    cashFlowData.forEach((item, i) => {
      pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
      pdf.roundedRect(margin, yPosition, contentWidth, 16, 3, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.text(item.labelEn + ' / ' + item.labelAr, margin + 10, yPosition + 10);
      pdf.text(item.value, margin + contentWidth - 45, yPosition + 10);
      yPosition += 20;
    });
    
    yPosition += 15;
    
    pdf.setFillColor(240, 253, 244);
    pdf.roundedRect(margin, yPosition, contentWidth, 55, 5, 5, 'F');
    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(13);
    pdf.text('LOAN COVERAGE ANALYSIS / ضرقلا ةيطغت ليلحت', margin + 30, yPosition + 15);
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(10);
    pdf.text('Requested Loan / بولطملا ضرقلا: 420,000 OMR', margin + 10, yPosition + 28);
    pdf.text('Year 1 Net Income / ىلولأا ةنسلا يفاص: 554,500 OMR', margin + 10, yPosition + 38);
    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(11);
    pdf.text('Coverage: 132% - FULLY COVERED IN YEAR 1', margin + 10, yPosition + 50);
    pdf.text('ىلولأا ةنسلا يف لماكلاب ىطغم ضرقلا', margin + contentWidth - 70, yPosition + 50);

    // === صفحة 8: خطة التوسع ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    addCenteredText('Future Expansion Plan / يلبقتسملا عسوتلا ةطخ', 22);
    
    yPosition = 55;
    
    const expansionPhases = [
      {
        phaseEn: 'Year 1 - Foundation',
        phaseAr: 'سيسأتلا - ىلولأا ةنسلا',
        items: [
          '50 Private Schools in Muscat & Dakhiliyah / ةيلخادلاو طقسم يف ةصاخ ةسردم 50',
          '25,000 Students / بلاط 25,000',
          'Establish brand presence / ةيراجتلا ةمالعلا خيسرت'
        ]
      },
      {
        phaseEn: 'Year 2 - Growth',
        phaseAr: 'ومنلا - ةيناثلا ةنسلا',
        items: [
          'Expand to 100+ Schools / ةسردم 100+ ىلإ عسوتلا',
          'Cover all major cities / ةيسيئرلا ندملا لك ةيطغت',
          '50,000 Students / بلاط 50,000'
        ]
      },
      {
        phaseEn: 'Year 3 - Expansion',
        phaseAr: 'عسوتلا - ةثلاثلا ةنسلا',
        items: [
          'Government school integration / ةيموكحلا سرادملا جمد',
          'GCC market entry / جيلخلا قاوسأ لوخد',
          '100,000+ Students / بلاط +100,000'
        ]
      },
    ];
    
    const phaseColors = [[59, 130, 246], [16, 185, 129], [245, 158, 11]];
    
    expansionPhases.forEach((phase, i) => {
      pdf.setFillColor(phaseColors[i][0], phaseColors[i][1], phaseColors[i][2]);
      pdf.roundedRect(margin, yPosition, contentWidth, 50, 5, 5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.text(phase.phaseEn + ' / ' + phase.phaseAr, margin + 10, yPosition + 12);
      pdf.setFontSize(9);
      phase.items.forEach((item, j) => {
        pdf.text('• ' + item, margin + 15, yPosition + 22 + (j * 9));
      });
      yPosition += 58;
    });

    // === صفحة 9: المخاطر ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    addCenteredText('Risk Analysis / رطاخملا ليلحت', 22);
    
    yPosition = 55;
    
    const risks = [
      {
        riskEn: 'Low Subscriptions',
        riskAr: 'تاكارتشلاا ضافخنا',
        mitEn: 'Free 1-month trial',
        mitAr: 'رهش ةدمل ةيناجم ةبرجت'
      },
      {
        riskEn: 'Payment Delays',
        riskAr: 'عفدلا رخأت',
        mitEn: 'Binding contracts + service suspension',
        mitAr: 'ةمدخلا فاقيإ + ةمزلم دوقع'
      },
      {
        riskEn: 'Technical Failures',
        riskAr: 'ةينقت لاطعأ',
        mitEn: '24/7 support + local servers',
        mitAr: 'ةيلحم مداوخ + 24/7 معد'
      },
      {
        riskEn: 'Competition',
        riskAr: 'ةسفانملا',
        mitEn: 'Unique features create differentiation',
        mitAr: 'زيمتلا ققحت ةديرف ايازم'
      },
      {
        riskEn: 'Policy Changes',
        riskAr: 'تاسايسلا ريغت',
        mitEn: 'Flexible adaptable model',
        mitAr: 'فيكتلل لباق نرم جذومن'
      },
    ];
    
    risks.forEach((item, i) => {
      pdf.setFillColor(254, 242, 242);
      pdf.roundedRect(margin, yPosition, contentWidth/2 - 5, 28, 3, 3, 'F');
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(margin + contentWidth/2 + 5, yPosition, contentWidth/2 - 5, 28, 3, 3, 'F');
      
      pdf.setTextColor(239, 68, 68);
      pdf.setFontSize(8);
      pdf.text('RISK / رطخلا:', margin + 3, yPosition + 8);
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(9);
      pdf.text(item.riskEn, margin + 3, yPosition + 16);
      pdf.text(item.riskAr, margin + 3, yPosition + 23);
      
      pdf.setTextColor(16, 185, 129);
      pdf.setFontSize(8);
      pdf.text('MITIGATION / فيفختلا:', margin + contentWidth/2 + 8, yPosition + 8);
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(9);
      pdf.text(item.mitEn, margin + contentWidth/2 + 8, yPosition + 16);
      pdf.text(item.mitAr, margin + contentWidth/2 + 8, yPosition + 23);
      
      yPosition += 32;
    });

    // === صفحة 10: الخاتمة ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    pdf.setFillColor(59, 130, 246);
    pdf.circle(pageWidth - 20, 30, 50, 'F');
    pdf.setFillColor(16, 185, 129);
    pdf.circle(20, pageHeight - 40, 35, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    addCenteredText('Conclusion & Recommendation', 55);
    addCenteredText('ةيصوتلاو ةصلاخلا', 70);
    
    yPosition = 95;
    
    const summaryPoints = [
      { en: 'Innovative and unique project in Oman', ar: 'نامع يف ديرف و ركتبم عورشم' },
      { en: 'Stable income covering the loan', ar: 'ضرقلا يطغي تباث لخد' },
      { en: 'Loan fully recoverable in 3 years', ar: 'تاونس 3 للاخ لماك دادرتسا' },
      { en: 'Strong local & international expansion potential', ar: 'يلودو يلحم عسوتلل يوق لامتحا' },
      { en: 'First-mover advantage', ar: 'قبسلا ةزيم' },
      { en: 'Sustainable recurring revenue', ar: 'ةمادتسم ةرركتم تاداريإ' },
    ];
    
    pdf.setFontSize(11);
    summaryPoints.forEach((point, i) => {
      pdf.setFillColor(255, 255, 255, 0.1);
      pdf.roundedRect(margin + 10, yPosition - 3, contentWidth - 20, 14, 2, 2, 'F');
      pdf.text('✓ ' + point.en + ' / ' + point.ar, margin + 15, yPosition + 6);
      yPosition += 18;
    });
    
    yPosition += 15;
    
    pdf.setFillColor(16, 185, 129);
    pdf.roundedRect(margin, yPosition, contentWidth, 50, 5, 5, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    addCenteredText('RECOMMENDATION / ةيصوتلا', yPosition + 15);
    pdf.setFontSize(10);
    addCenteredText('Approve the project financing', yPosition + 30);
    addCenteredText('لماكتملا يميلعتلا لحلا اذه معدل عورشملا ليومت ىلع ةقفاوملا', yPosition + 42);
    
    pdf.setFontSize(10);
    addCenteredText('TalebEdu - Mazen Khanfar / رفناخ نزام', pageHeight - 30);
    addCenteredText('Muscat, Sultanate of Oman - 2026 / نامع ةنطلس ،طقسم', pageHeight - 20);

    pdf.save('TalebEdu_Feasibility_Study_2026.pdf');
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" dir="rtl">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-3 mb-6">
            <FileText className="w-8 h-8 text-blue-400" />
            <span className="text-white/80 text-lg">دراسة جدوى</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            مشروع <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-400 to-emerald-400">TalebEdu</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            تطبيق شامل لإدارة المدارس والمحفظة الإلكترونية والبوابات الذكية
          </p>
        </motion.div>

        {/* Download Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <Button
            onClick={generatePDF}
            disabled={isGenerating}
            size="lg"
            className="bg-gradient-to-l from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white text-xl px-12 py-8 rounded-2xl shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105"
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6 ml-3" />
                </motion.div>
                جاري إنشاء الملف...
              </>
            ) : (
              <>
                <Download className="w-6 h-6 ml-3" />
                تحميل دراسة الجدوى PDF
              </>
            )}
          </Button>
          <p className="text-white/50 mt-4">ملف PDF احترافي جاهز للتقديم لبنك التنمية العماني</p>
        </motion.div>

        {/* Preview Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Executive Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Award className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">الملخص التنفيذي</h3>
              </div>
              <p className="text-white/70">
                التطبيق الوحيد في العالم الذي يجمع إدارة المدرسة والباصات والبوابات والمحفظة في منصة واحدة
              </p>
            </Card>
          </motion.div>

          {/* Revenue Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">الإيرادات المتوقعة</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-white/80">
                  <span>السنة الأولى:</span>
                  <span className="font-bold text-emerald-400">1,010,000 ر.ع</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>السنة الثانية:</span>
                  <span className="font-bold text-emerald-400">2,020,000 ر.ع</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>السنة الثالثة:</span>
                  <span className="font-bold text-emerald-400">4,040,000 ر.ع</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Investment Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <Landmark className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white">القرض المطلوب</h3>
              </div>
              <p className="text-3xl font-bold text-amber-400 mb-2">420,000 ر.ع</p>
              <p className="text-white/70 text-sm">
                يُغطى بالكامل من صافي الإيرادات خلال 3 سنوات
              </p>
            </Card>
          </motion.div>

          {/* Schools Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <GraduationCap className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">نطاق المشروع</h3>
              </div>
              <div className="space-y-2 text-white/80">
                <div className="flex justify-between">
                  <span>المدارس (السنة الأولى):</span>
                  <span className="font-bold">50 مدرسة</span>
                </div>
                <div className="flex justify-between">
                  <span>عدد الطلاب:</span>
                  <span className="font-bold">25,000 طالب</span>
                </div>
                <div className="flex justify-between">
                  <span>الباصات:</span>
                  <span className="font-bold">300 باص</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Features Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-pink-500/20 rounded-xl">
                  <Shield className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white">المزايا الفريدة</h3>
              </div>
              <ul className="space-y-2 text-white/80 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  سوار ذكي لا يحتاج شحن أو صيانة
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  محفظة إلكترونية للطالب
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  تتبع مباشر للباصات
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  متعدد اللغات
                </li>
              </ul>
            </Card>
          </motion.div>

          {/* Expansion Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-cyan-500/20 rounded-xl">
                  <Globe className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white">التوسع المستقبلي</h3>
              </div>
              <ul className="space-y-2 text-white/80 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                  100+ مدرسة في السنة الثانية
                </li>
                <li className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                  دمج المدارس الحكومية
                </li>
                <li className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                  التوسع لدول الخليج
                </li>
              </ul>
            </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-16 text-white/50"
        >
          <p>TalebEdu - مازن خانفر</p>
          <p>مسقط، سلطنة عمان - 2026</p>
        </motion.div>
      </div>
    </div>
  );
};

export default FeasibilityStudy;
