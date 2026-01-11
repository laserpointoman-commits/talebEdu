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
  const contentRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Add Arabic font support - we'll use a simple approach
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

    // Helper function to add centered text
    const addCenteredText = (text: string, y: number, size: number = 12) => {
      pdf.setFontSize(size);
      const textWidth = pdf.getTextWidth(text);
      pdf.text(text, (pageWidth - textWidth) / 2, y);
    };

    // Helper for RTL text (reverse for display)
    const rtlText = (text: string) => text.split('').reverse().join('');

    // === COVER PAGE ===
    // Background gradient effect (simulated with rectangles)
    pdf.setFillColor(15, 23, 42); // Dark blue
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Decorative elements
    pdf.setFillColor(59, 130, 246); // Blue accent
    pdf.circle(pageWidth - 30, 40, 60, 'F');
    pdf.setFillColor(16, 185, 129); // Green accent
    pdf.circle(30, pageHeight - 50, 40, 'F');
    
    // Logo area
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(pageWidth/2 - 40, 50, 80, 30, 5, 5, 'F');
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(28);
    addCenteredText('TalebEdu', 70);
    
    // Main title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    addCenteredText('Feasibility Study', 110);
    addCenteredText('ىودج ةسارد', 125); // دراسة جدوى RTL
    
    pdf.setFontSize(14);
    addCenteredText('Comprehensive School Management Application', 145);
    addCenteredText('Electronic Wallet & Smart Gates & Digital Stores', 155);
    
    // Submitted to
    pdf.setFillColor(59, 130, 246, 0.3);
    pdf.roundedRect(margin + 20, 175, contentWidth - 40, 40, 5, 5, 'F');
    pdf.setFontSize(12);
    addCenteredText('Submitted to:', 190);
    pdf.setFontSize(16);
    addCenteredText('Oman Development Bank', 202);
    
    // Submitted by
    pdf.setFontSize(12);
    addCenteredText('Submitted by: Mazen Khanfar - TalebEdu', 235);
    addCenteredText('Year: 2026', 248);
    
    // Contact info
    pdf.setFontSize(10);
    addCenteredText('Muscat, Sultanate of Oman', 270);

    // === PAGE 2: EXECUTIVE SUMMARY ===
    addNewPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Header
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    addCenteredText('Executive Summary', 22);
    
    pdf.setTextColor(15, 23, 42);
    yPosition = 50;
    
    // Intro text
    pdf.setFontSize(11);
    const execSummary = [
      'TalebEdu is the ONLY application in the world that combines in one platform:',
      '',
      '• School Management: Attendance, Grades, Homework, Schedules',
      '• Bus Management: Minimum 6 buses per school with real-time tracking',
      '• Smart Gates & Canteen with NFC technology',
      '• Electronic Wallet for students',
      '• Digital Store for NFC wristbands + Private Label stationery',
      '• Integrated Communication: Messages, Voice/Video calls, File sharing',
      '',
      'UNIQUE ADVANTAGES:',
      '',
      '• Smart Wristband: Resistant to all elements except fire, NO charging or maintenance needed',
      '• Multi-language Support: Arabic, English, Hindi',
      '• Complete Security for students and parents',
      '• Local and International Scalability (GCC countries in Year 3)',
      '• Complete Financial Management: All subscriptions paid directly via wallet to school',
      '',
      'PROJECT GOAL: Create a reliable and comprehensive platform to solve school management,',
      'security, communication, and digital purchasing problems in a sustainable and profitable way.'
    ];
    
    execSummary.forEach(line => {
      checkPageBreak(8);
      pdf.text(line, margin, yPosition);
      yPosition += 7;
    });

    // === PAGE 3: PROJECT SCOPE ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    addCenteredText('Project Scope', 22);
    
    pdf.setTextColor(15, 23, 42);
    yPosition = 50;
    
    // Key metrics boxes
    const metrics = [
      { label: 'Target Segment', value: 'Private Schools + Government Partnership' },
      { label: 'Location', value: 'Muscat & Ad Dakhiliyah' },
      { label: 'Year 1 Schools', value: '50 Schools' },
      { label: 'Avg. Students/School', value: '500 Students' },
      { label: 'Buses per School', value: '6 Buses' },
      { label: 'Gates per School', value: '2 Gates' },
      { label: 'Canteen per School', value: '1 Canteen' },
    ];
    
    pdf.setFontSize(11);
    metrics.forEach((metric, i) => {
      const x = i % 2 === 0 ? margin : margin + contentWidth/2;
      const y = yPosition + Math.floor(i/2) * 20;
      
      pdf.setFillColor(240, 249, 255);
      pdf.roundedRect(x, y - 5, contentWidth/2 - 5, 16, 3, 3, 'F');
      pdf.setTextColor(59, 130, 246);
      pdf.text(metric.label + ':', x + 5, y + 4);
      pdf.setTextColor(15, 23, 42);
      pdf.text(metric.value, x + 5, y + 11);
    });
    
    yPosition += 90;
    
    // Services offered
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Services Offered:', margin, yPosition);
    yPosition += 10;
    
    const services = [
      '1. Annual Student Subscription (Includes: Bus, Gate, Canteen, Wallet, Grades & Homework tracking)',
      '2. Additional NFC Wristband Sales',
      '3. Private Label Stationery Store',
      '4. Internal Messaging System for Parent-Teacher-Admin Communication'
    ];
    
    pdf.setFontSize(10);
    services.forEach(service => {
      pdf.text(service, margin + 5, yPosition);
      yPosition += 8;
    });

    // === PAGE 4: COMPETITIVE ADVANTAGES ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    addCenteredText('Competitive Advantages', 22);
    
    pdf.setTextColor(15, 23, 42);
    yPosition = 50;
    
    const advantages = [
      { title: 'Smart Wristband Technology', desc: 'Resistant to water, dust, impact - No charging or maintenance required' },
      { title: 'Comprehensive Tracking', desc: 'Grades, Homework, Attendance - All in one place' },
      { title: 'Parental Control', desc: 'Parents can control canteen purchases and spending limits' },
      { title: 'Integrated Communication', desc: 'Messages, Voice/Video calls, File sharing between all stakeholders' },
      { title: 'Digital Marketplace', desc: 'Wristbands + Private Label Stationery store' },
      { title: 'Multi-Language Support', desc: 'Arabic, English, Hindi - Serving diverse communities' },
      { title: 'GCC Expansion Ready', desc: 'Scalable architecture for regional growth' },
      { title: 'Complete Student Safety', desc: 'Real-time tracking and secure access control' },
      { title: 'FIRST in Oman', desc: 'Only platform using Smart Wristband as digital school ID' },
      { title: 'Electronic Wallet Pioneer', desc: 'First to enable student pocket money via wristband' },
      { title: 'Direct Payment System', desc: 'All fees paid directly through wallet to school' },
    ];
    
    pdf.setFontSize(10);
    advantages.forEach((adv, i) => {
      checkPageBreak(15);
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(margin, yPosition - 3, contentWidth, 14, 2, 2, 'F');
      pdf.setTextColor(16, 185, 129);
      pdf.text('✓ ' + adv.title + ':', margin + 3, yPosition + 4);
      pdf.setTextColor(75, 85, 99);
      pdf.text(adv.desc, margin + 55, yPosition + 4);
      yPosition += 16;
    });

    // === PAGE 5: FINANCIAL STUDY - REVENUE ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    addCenteredText('Financial Study - Revenue Projections', 22);
    
    yPosition = 50;
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(12);
    pdf.text('A) Annual Revenue - Private Schools Only (OMR)', margin, yPosition);
    yPosition += 10;
    
    // Revenue table
    const tableHeaders = ['Scenario', 'Students', 'Schools', 'Student Sub.', 'Bus Sub.', 'NFC Profit', 'Stationery', 'TOTAL'];
    const tableData = [
      ['Year 1', '25,000', '50', '625,000', '30,000', '42,500', '312,500', '1,010,000'],
      ['Year 2', '50,000', '100', '1,250,000', '60,000', '85,000', '625,000', '2,020,000'],
      ['Year 3', '100,000', '200', '2,500,000', '120,000', '170,000', '1,250,000', '4,040,000'],
    ];
    
    const colWidths = [20, 20, 18, 25, 22, 22, 22, 28];
    let xPos = margin;
    
    // Header row
    pdf.setFillColor(59, 130, 246);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    tableHeaders.forEach((header, i) => {
      pdf.text(header, xPos + 2, yPosition + 5);
      xPos += colWidths[i];
    });
    yPosition += 8;
    
    // Data rows
    pdf.setTextColor(15, 23, 42);
    tableData.forEach((row, rowIndex) => {
      xPos = margin;
      pdf.setFillColor(rowIndex % 2 === 0 ? 248 : 255, rowIndex % 2 === 0 ? 250 : 255, rowIndex % 2 === 0 ? 252 : 255);
      pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      row.forEach((cell, i) => {
        pdf.text(cell, xPos + 2, yPosition + 5);
        xPos += colWidths[i];
      });
      yPosition += 8;
    });
    
    yPosition += 15;
    pdf.setFontSize(12);
    pdf.text('B) Government + Private Schools Scenario (OMR)', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    const govScenario = [
      '• Total Students: 242,000 (192,000 Government + 50,000 Private)',
      '• Student Subscriptions: 6,050,000 OMR',
      '• Bus Subscriptions: 290,400 OMR',
      '• NFC Profit: 411,400 OMR',
      '• Stationery Profit: 3,025,000 OMR',
      '',
      'TOTAL REVENUE = 9,776,800 OMR'
    ];
    
    govScenario.forEach(line => {
      if (line.includes('TOTAL')) {
        pdf.setFillColor(16, 185, 129);
        pdf.roundedRect(margin, yPosition - 4, contentWidth, 12, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
      }
      pdf.text(line, margin + 5, yPosition + 3);
      yPosition += 10;
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(10);
    });

    // === PAGE 6: CAPEX ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    addCenteredText('Capital Expenditure (CAPEX)', 22);
    
    yPosition = 50;
    
    const capexItems = [
      { item: 'Bus Devices (50 schools × 6)', qty: '300', price: '290', total: '87,000' },
      { item: 'Smart Gates (50 schools × 2)', qty: '100', price: '290', total: '29,000' },
      { item: 'Canteen Systems (50 schools × 1)', qty: '50', price: '370', total: '18,500' },
      { item: 'Electric Vehicles', qty: '5', price: '8,000', total: '40,000' },
      { item: 'Employee Devices', qty: '10', price: '1,000', total: '10,000' },
      { item: 'Servers & Data Room', qty: '1', price: '35,000', total: '35,000' },
      { item: 'Company Furniture', qty: '1', price: '30,000', total: '30,000' },
      { item: 'Licenses & Commercial Registration', qty: '1', price: '7,000', total: '7,000' },
      { item: 'Initial Stationery Import', qty: '-', price: '-', total: '30,000' },
      { item: 'App Development & Maintenance', qty: '-', price: '-', total: '25,000' },
      { item: 'Technical Support & Cybersecurity', qty: '-', price: '-', total: '18,000' },
    ];
    
    // Table header
    const capexHeaders = ['Item', 'Quantity', 'Unit Price (OMR)', 'Total (OMR)'];
    const capexColWidths = [75, 25, 35, 35];
    xPos = margin;
    
    pdf.setFillColor(59, 130, 246);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    capexHeaders.forEach((header, i) => {
      pdf.text(header, xPos + 2, yPosition + 5);
      xPos += capexColWidths[i];
    });
    yPosition += 8;
    
    pdf.setTextColor(15, 23, 42);
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
    
    // Total
    pdf.setFillColor(15, 23, 42);
    pdf.rect(margin, yPosition, contentWidth, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.text('TOTAL CAPEX', margin + 5, yPosition + 7);
    pdf.text('329,500 OMR', margin + contentWidth - 40, yPosition + 7);
    
    yPosition += 25;
    
    // OPEX Section
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(14);
    pdf.text('Operating Expenses (OPEX)', margin, yPosition);
    yPosition += 10;
    
    const opexHeaders = ['Item', 'Monthly (OMR)', 'Annual (OMR)'];
    const opexColWidths = [80, 45, 45];
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
      { item: 'Staff Salaries + Manager', monthly: '8,500', annual: '102,000' },
      { item: 'Office Rent', monthly: '2,000', annual: '24,000' },
    ];
    
    pdf.setTextColor(15, 23, 42);
    opexItems.forEach((row, rowIndex) => {
      xPos = margin;
      pdf.setFillColor(rowIndex % 2 === 0 ? 255 : 248, rowIndex % 2 === 0 ? 251 : 250, rowIndex % 2 === 0 ? 235 : 252);
      pdf.rect(margin, yPosition, contentWidth, 7, 'F');
      pdf.text(row.item, xPos + 2, yPosition + 5);
      xPos += opexColWidths[0];
      pdf.text(row.monthly, xPos + 2, yPosition + 5);
      xPos += opexColWidths[1];
      pdf.text(row.annual, xPos + 2, yPosition + 5);
      yPosition += 7;
    });
    
    pdf.setFillColor(245, 158, 11);
    pdf.rect(margin, yPosition, contentWidth, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.text('TOTAL OPEX', margin + 5, yPosition + 7);
    pdf.text('126,000 OMR / Year', margin + contentWidth - 55, yPosition + 7);

    // === PAGE 7: CASH FLOW & LOAN ANALYSIS ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    addCenteredText('Cash Flow Analysis - Year 1', 22);
    
    yPosition = 55;
    pdf.setTextColor(15, 23, 42);
    
    // Cash flow summary box
    const cashFlowData = [
      { label: 'Total Revenue', value: '1,010,000 OMR', color: [16, 185, 129] },
      { label: 'CAPEX', value: '329,500 OMR', color: [239, 68, 68] },
      { label: 'OPEX', value: '126,000 OMR', color: [245, 158, 11] },
      { label: 'Net Income Before Loan', value: '554,500 OMR', color: [59, 130, 246] },
    ];
    
    cashFlowData.forEach((item, i) => {
      pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
      pdf.roundedRect(margin, yPosition, contentWidth, 15, 3, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.text(item.label, margin + 10, yPosition + 10);
      pdf.text(item.value, margin + contentWidth - 50, yPosition + 10);
      yPosition += 20;
    });
    
    yPosition += 10;
    
    // Loan coverage analysis
    pdf.setFillColor(240, 253, 244);
    pdf.roundedRect(margin, yPosition, contentWidth, 50, 5, 5, 'F');
    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(14);
    pdf.text('LOAN COVERAGE ANALYSIS', margin + 10, yPosition + 15);
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(11);
    pdf.text('Requested Loan: 420,000 OMR', margin + 10, yPosition + 28);
    pdf.text('Year 1 Net Income: 554,500 OMR', margin + 10, yPosition + 38);
    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(12);
    pdf.text('Coverage Ratio: 132% - LOAN FULLY COVERED IN YEAR 1', margin + 10, yPosition + 48);
    
    yPosition += 65;
    
    // 3-year projection
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(14);
    pdf.text('3-Year Revenue Projection', margin, yPosition);
    yPosition += 15;
    
    // Simple bar chart representation
    const years = [
      { year: 'Year 1', revenue: 1010000, height: 30 },
      { year: 'Year 2', revenue: 2020000, height: 60 },
      { year: 'Year 3', revenue: 4040000, height: 90 },
    ];
    
    const barWidth = 40;
    const barGap = 20;
    const startX = margin + 30;
    const baseY = yPosition + 95;
    
    years.forEach((item, i) => {
      const x = startX + (barWidth + barGap) * i;
      pdf.setFillColor(59, 130, 246);
      pdf.roundedRect(x, baseY - item.height, barWidth, item.height, 3, 3, 'F');
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(10);
      pdf.text(item.year, x + 8, baseY + 10);
      pdf.setFontSize(8);
      pdf.text((item.revenue / 1000000).toFixed(2) + 'M', x + 8, baseY - item.height - 5);
    });

    // === PAGE 8: EXPANSION PLAN ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    addCenteredText('Future Expansion Plan', 22);
    
    yPosition = 55;
    
    const expansionPhases = [
      {
        phase: 'Year 1 - Foundation',
        items: ['50 Private Schools in Muscat & Ad Dakhiliyah', '25,000 Students', 'Establish brand presence']
      },
      {
        phase: 'Year 2 - Growth',
        items: ['Expand to 100+ Private Schools', 'Cover all major cities in Oman', '50,000 Students']
      },
      {
        phase: 'Year 3 - Expansion',
        items: ['Government school integration', 'GCC market entry (UAE, Saudi, Bahrain)', '100,000+ Students', 'Stationery market expansion']
      },
    ];
    
    expansionPhases.forEach((phase, i) => {
      const colors = [[59, 130, 246], [16, 185, 129], [245, 158, 11]];
      pdf.setFillColor(colors[i][0], colors[i][1], colors[i][2]);
      pdf.roundedRect(margin, yPosition, contentWidth, 45, 5, 5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.text(phase.phase, margin + 10, yPosition + 15);
      pdf.setFontSize(10);
      phase.items.forEach((item, j) => {
        pdf.text('• ' + item, margin + 15, yPosition + 25 + (j * 7));
      });
      yPosition += 55;
    });

    // === PAGE 9: RISKS & MITIGATION ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    addCenteredText('Risk Analysis & Mitigation', 22);
    
    yPosition = 55;
    
    const risks = [
      {
        risk: 'Low Subscription Rates',
        mitigation: 'Free 1-month trial for schools to experience full platform value'
      },
      {
        risk: 'Payment Delays',
        mitigation: 'Binding contracts with schools; service suspension for non-payment'
      },
      {
        risk: 'Technical Failures',
        mitigation: '24/7 technical support and local server infrastructure'
      },
      {
        risk: 'Market Competition',
        mitigation: 'Unique features (smart wristband, wallet) create strong differentiation'
      },
      {
        risk: 'Government Policy Changes',
        mitigation: 'Flexible business model adaptable to regulatory requirements'
      },
    ];
    
    risks.forEach((item, i) => {
      pdf.setFillColor(254, 242, 242);
      pdf.roundedRect(margin, yPosition, contentWidth/2 - 5, 30, 3, 3, 'F');
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(margin + contentWidth/2 + 5, yPosition, contentWidth/2 - 5, 30, 3, 3, 'F');
      
      pdf.setTextColor(239, 68, 68);
      pdf.setFontSize(9);
      pdf.text('RISK:', margin + 5, yPosition + 8);
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(8);
      const riskLines = pdf.splitTextToSize(item.risk, contentWidth/2 - 20);
      pdf.text(riskLines, margin + 5, yPosition + 16);
      
      pdf.setTextColor(16, 185, 129);
      pdf.setFontSize(9);
      pdf.text('MITIGATION:', margin + contentWidth/2 + 10, yPosition + 8);
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(8);
      const mitLines = pdf.splitTextToSize(item.mitigation, contentWidth/2 - 20);
      pdf.text(mitLines, margin + contentWidth/2 + 10, yPosition + 16);
      
      yPosition += 35;
    });

    // === PAGE 10: CONCLUSION ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Decorative elements
    pdf.setFillColor(59, 130, 246);
    pdf.circle(pageWidth - 20, 30, 50, 'F');
    pdf.setFillColor(16, 185, 129);
    pdf.circle(20, pageHeight - 40, 35, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    addCenteredText('Conclusion & Recommendation', 60);
    
    yPosition = 90;
    
    // Summary points
    const summaryPoints = [
      'TalebEdu is an innovative and unique project in the Sultanate',
      'Capable of generating stable income covering the requested loan',
      'Loan of 420,000 OMR fully recoverable within 3 years',
      'Strong potential for local and international expansion',
      'First-mover advantage in smart school management',
      'Sustainable recurring revenue model'
    ];
    
    pdf.setFontSize(12);
    summaryPoints.forEach((point, i) => {
      pdf.setFillColor(255, 255, 255, 0.1);
      pdf.roundedRect(margin + 10, yPosition - 3, contentWidth - 20, 12, 2, 2, 'F');
      pdf.text('✓ ' + point, margin + 15, yPosition + 5);
      yPosition += 18;
    });
    
    yPosition += 20;
    
    // Final recommendation box
    pdf.setFillColor(16, 185, 129);
    pdf.roundedRect(margin, yPosition, contentWidth, 45, 5, 5, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    addCenteredText('RECOMMENDATION', yPosition + 15);
    pdf.setFontSize(11);
    addCenteredText('Approve the project financing to support this integrated', yPosition + 28);
    addCenteredText('educational and digital security solution.', yPosition + 38);
    
    // Footer
    pdf.setFontSize(10);
    addCenteredText('TalebEdu - Mazen Khanfar', pageHeight - 30);
    addCenteredText('Muscat, Sultanate of Oman - 2026', pageHeight - 20);

    // Save the PDF
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
          <p className="text-white/50 mt-4">ملف PDF احترافي جاهز للتقديم لبنك التنمية</p>
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
          <p>TalebEdu - مازن خانفار</p>
          <p>مسقط، سلطنة عمان - 2026</p>
        </motion.div>
      </div>
    </div>
  );
};

export default FeasibilityStudy;
