import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Download, 
  Users, 
  Shield, 
  TrendingUp,
  CheckCircle2,
  Globe,
  GraduationCap,
  Landmark,
  FileText,
  ArrowUpRight,
  Sparkles,
  Award
} from "lucide-react";
import jsPDF from "jspdf";
import logoImage from "@/assets/talebedu-logo-hq.png";

const FeasibilityStudy = () => {
  const [isGeneratingEn, setIsGeneratingEn] = useState(false);
  const [isGeneratingAr, setIsGeneratingAr] = useState(false);

  // Convert image to base64
  const getImageAsBase64 = async (imagePath: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = () => resolve('');
      img.src = imagePath;
    });
  };

  const generateEnglishPDF = async () => {
    setIsGeneratingEn(true);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Load logo
    const logoBase64 = await getImageAsBase64(logoImage);

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

    const addPageHeader = (title: string) => {
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      addCenteredText(title, 18);
      
      // Add logo to header
      if (logoBase64) {
        try {
          pdf.addImage(logoBase64, 'PNG', pageWidth - 35, 5, 20, 20);
        } catch (e) {
          console.log('Logo not added');
        }
      }
      yPosition = 40;
    };

    // === COVER PAGE ===
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    pdf.setFillColor(59, 130, 246);
    pdf.circle(pageWidth - 30, 40, 50, 'F');
    pdf.setFillColor(16, 185, 129);
    pdf.circle(30, pageHeight - 50, 35, 'F');
    
    // Logo on cover
    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, 'PNG', pageWidth/2 - 25, 40, 50, 50);
      } catch (e) {
        console.log('Logo not added');
      }
    }
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(32);
    addCenteredText('TalebEdu', 110);
    
    pdf.setFontSize(20);
    addCenteredText('Feasibility Study', 130);
    
    pdf.setFontSize(12);
    addCenteredText('Comprehensive School Management Application', 148);
    addCenteredText('Electronic Wallet | Smart Gates | Digital Stores', 158);
    
    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(margin + 30, 175, contentWidth - 60, 35, 5, 5, 'F');
    pdf.setFontSize(11);
    addCenteredText('Submitted to:', 188);
    pdf.setFontSize(14);
    addCenteredText('Oman Development Bank', 198);
    
    pdf.setFontSize(11);
    addCenteredText('Submitted by: Mazen Khanfar - TalebEdu', 230);
    addCenteredText('Year: 2026', 242);
    addCenteredText('Muscat, Sultanate of Oman', 265);

    // === PAGE 2: EXECUTIVE SUMMARY ===
    addNewPage();
    addPageHeader('Executive Summary');
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(10);
    
    const execSummary = [
      'TalebEdu is the ONLY application in the world that combines in one platform:',
      '',
      '  - School Management: Attendance, Grades, Homework, Schedules',
      '  - Bus Management: Minimum 6 buses per school with real-time tracking',
      '  - Smart Gates & Canteen with NFC technology',
      '  - Electronic Wallet for students',
      '  - Digital Store for NFC wristbands + Private Label stationery',
      '  - Integrated Communication: Messages, Voice/Video calls, File sharing',
      '',
      'UNIQUE ADVANTAGES:',
      '',
      '  - Smart Wristband: Resistant to all elements except fire, NO charging needed',
      '  - Multi-language Support: Arabic, English, Hindi',
      '  - Complete Security for students and parents',
      '  - Local and International Scalability (GCC countries in Year 3)',
      '  - Complete Financial Management: All subscriptions paid via wallet to school',
      '',
      'PROJECT GOAL:',
      'Create a reliable and comprehensive platform to solve school management,',
      'security, communication, and digital purchasing problems in a sustainable way.'
    ];
    
    execSummary.forEach(line => {
      checkPageBreak(7);
      pdf.text(line, margin, yPosition);
      yPosition += 6;
    });

    // === PAGE 3: PROJECT SCOPE ===
    addNewPage();
    addPageHeader('Project Scope');
    
    pdf.setTextColor(15, 23, 42);
    
    const metrics = [
      ['Target Segment', 'Private Schools + Government Partnership'],
      ['Location', 'Muscat & Ad Dakhiliyah'],
      ['Year 1 Schools', '50 Schools'],
      ['Avg. Students/School', '500 Students'],
      ['Buses per School', '6 Buses'],
      ['Gates per School', '2 Gates'],
      ['Canteen per School', '1 Canteen'],
    ];
    
    pdf.setFontSize(10);
    metrics.forEach((metric, i) => {
      const y = yPosition + (i * 14);
      pdf.setFillColor(240, 249, 255);
      pdf.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
      pdf.setTextColor(59, 130, 246);
      pdf.text(metric[0] + ':', margin + 5, y + 8);
      pdf.setTextColor(15, 23, 42);
      pdf.text(metric[1], margin + 60, y + 8);
    });
    
    yPosition += 115;
    
    pdf.setFontSize(12);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Services Offered:', margin, yPosition);
    yPosition += 10;
    
    const services = [
      '1. Annual Student Subscription (Bus, Gate, Canteen, Wallet, Grades tracking)',
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
    addPageHeader('Competitive Advantages');
    
    pdf.setTextColor(15, 23, 42);
    
    const advantages = [
      ['Smart Wristband Technology', 'No charging or maintenance required'],
      ['Comprehensive Tracking', 'Grades, Homework, Attendance in one place'],
      ['Parental Control', 'Parents control canteen purchases & limits'],
      ['Integrated Communication', 'Messages, Voice/Video calls, File sharing'],
      ['Digital Marketplace', 'Wristbands + Private Label Stationery'],
      ['Multi-Language Support', 'Arabic, English, Hindi'],
      ['GCC Expansion Ready', 'Scalable architecture for regional growth'],
      ['Complete Student Safety', 'Real-time tracking and secure access'],
      ['FIRST in Oman', 'Smart Wristband as digital school ID'],
      ['Electronic Wallet Pioneer', 'Student pocket money via wristband'],
      ['Direct Payment System', 'Fees paid directly through wallet'],
    ];
    
    pdf.setFontSize(9);
    advantages.forEach((adv, i) => {
      checkPageBreak(12);
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(margin, yPosition, contentWidth, 10, 2, 2, 'F');
      pdf.setTextColor(16, 185, 129);
      pdf.text('> ' + adv[0] + ':', margin + 3, yPosition + 7);
      pdf.setTextColor(75, 85, 99);
      pdf.text(adv[1], margin + 65, yPosition + 7);
      yPosition += 12;
    });

    // === PAGE 5: FINANCIAL STUDY - REVENUE ===
    addNewPage();
    addPageHeader('Financial Study - Revenue Projections');
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(11);
    pdf.text('A) Annual Revenue - Private Schools Only (OMR)', margin, yPosition);
    yPosition += 8;
    
    // Table
    const tableHeaders = ['Year', 'Students', 'Schools', 'Student', 'Bus', 'NFC', 'Stationery', 'TOTAL'];
    const tableData = [
      ['1', '25,000', '50', '625,000', '30,000', '42,500', '312,500', '1,010,000'],
      ['2', '50,000', '100', '1,250,000', '60,000', '85,000', '625,000', '2,020,000'],
      ['3', '100,000', '200', '2,500,000', '120,000', '170,000', '1,250,000', '4,040,000'],
    ];
    
    const colWidths = [15, 22, 20, 26, 22, 22, 26, 28];
    let xPos = margin;
    
    pdf.setFillColor(59, 130, 246);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    tableHeaders.forEach((header, i) => {
      pdf.text(header, xPos + 2, yPosition + 5);
      xPos += colWidths[i];
    });
    yPosition += 8;
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(7);
    tableData.forEach((row, rowIndex) => {
      xPos = margin;
      pdf.setFillColor(rowIndex % 2 === 0 ? 248 : 255, rowIndex % 2 === 0 ? 250 : 255, rowIndex % 2 === 0 ? 252 : 255);
      pdf.rect(margin, yPosition, contentWidth, 7, 'F');
      row.forEach((cell, i) => {
        pdf.text(cell, xPos + 2, yPosition + 5);
        xPos += colWidths[i];
      });
      yPosition += 7;
    });
    
    yPosition += 12;
    pdf.setFontSize(11);
    pdf.text('B) Government + Private Schools Scenario (OMR)', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(9);
    const govScenario = [
      '- Total Students: 242,000 (192,000 Government + 50,000 Private)',
      '- Student Subscriptions: 6,050,000 OMR',
      '- Bus Subscriptions: 290,400 OMR',
      '- NFC Profit: 411,400 OMR',
      '- Stationery Profit: 3,025,000 OMR',
    ];
    
    govScenario.forEach(line => {
      pdf.text(line, margin + 5, yPosition);
      yPosition += 7;
    });
    
    yPosition += 3;
    pdf.setFillColor(16, 185, 129);
    pdf.roundedRect(margin, yPosition, contentWidth, 12, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.text('TOTAL REVENUE = 9,776,800 OMR', margin + 50, yPosition + 8);

    // === PAGE 6: CAPEX & OPEX ===
    addNewPage();
    addPageHeader('Capital & Operating Expenditure');
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(11);
    pdf.text('Capital Expenditure (CAPEX)', margin, yPosition);
    yPosition += 8;
    
    const capexItems = [
      ['Bus Devices (300 units)', '290', '87,000'],
      ['Smart Gates (100 units)', '290', '29,000'],
      ['Canteen Systems (50 units)', '370', '18,500'],
      ['Electric Vehicles (5 units)', '8,000', '40,000'],
      ['Employee Devices (10 units)', '1,000', '10,000'],
      ['Servers & Data Room', '-', '35,000'],
      ['Company Furniture', '-', '30,000'],
      ['Licenses & Registration', '-', '7,000'],
      ['Initial Stationery Import', '-', '30,000'],
      ['App Development', '-', '25,000'],
      ['Cybersecurity', '-', '18,000'],
    ];
    
    const capexHeaders = ['Item', 'Unit Price', 'Total (OMR)'];
    const capexColWidths = [100, 35, 35];
    xPos = margin;
    
    pdf.setFillColor(59, 130, 246);
    pdf.rect(margin, yPosition, contentWidth, 7, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    capexHeaders.forEach((header, i) => {
      pdf.text(header, xPos + 2, yPosition + 5);
      xPos += capexColWidths[i];
    });
    yPosition += 7;
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(7);
    capexItems.forEach((row, rowIndex) => {
      xPos = margin;
      pdf.setFillColor(rowIndex % 2 === 0 ? 248 : 255, rowIndex % 2 === 0 ? 250 : 255, rowIndex % 2 === 0 ? 252 : 255);
      pdf.rect(margin, yPosition, contentWidth, 6, 'F');
      pdf.text(row[0], xPos + 2, yPosition + 4);
      xPos += capexColWidths[0];
      pdf.text(row[1], xPos + 2, yPosition + 4);
      xPos += capexColWidths[1];
      pdf.text(row[2], xPos + 2, yPosition + 4);
      yPosition += 6;
    });
    
    pdf.setFillColor(15, 23, 42);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.text('TOTAL CAPEX', margin + 5, yPosition + 5);
    pdf.text('329,500 OMR', margin + contentWidth - 35, yPosition + 5);
    
    yPosition += 18;
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(11);
    pdf.text('Operating Expenses (OPEX)', margin, yPosition);
    yPosition += 8;
    
    const opexHeaders = ['Item', 'Monthly', 'Annual (OMR)'];
    xPos = margin;
    
    pdf.setFillColor(245, 158, 11);
    pdf.rect(margin, yPosition, contentWidth, 7, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    opexHeaders.forEach((header, i) => {
      pdf.text(header, xPos + 2, yPosition + 5);
      xPos += capexColWidths[i];
    });
    yPosition += 7;
    
    const opexItems = [
      ['Staff Salaries + Manager', '8,500', '102,000'],
      ['Office Rent', '2,000', '24,000'],
    ];
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(8);
    opexItems.forEach((row, rowIndex) => {
      xPos = margin;
      pdf.setFillColor(255, 251, 235);
      pdf.rect(margin, yPosition, contentWidth, 6, 'F');
      pdf.text(row[0], xPos + 2, yPosition + 4);
      xPos += capexColWidths[0];
      pdf.text(row[1], xPos + 2, yPosition + 4);
      xPos += capexColWidths[1];
      pdf.text(row[2], xPos + 2, yPosition + 4);
      yPosition += 6;
    });
    
    pdf.setFillColor(245, 158, 11);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.text('TOTAL OPEX', margin + 5, yPosition + 5);
    pdf.text('126,000 OMR / Year', margin + contentWidth - 50, yPosition + 5);

    // === PAGE 7: CASH FLOW ===
    addNewPage();
    addPageHeader('Cash Flow Analysis - Year 1');
    
    pdf.setTextColor(15, 23, 42);
    
    const cashFlowData = [
      { label: 'Total Revenue', value: '1,010,000 OMR', color: [16, 185, 129] as [number, number, number] },
      { label: 'CAPEX', value: '329,500 OMR', color: [239, 68, 68] as [number, number, number] },
      { label: 'OPEX', value: '126,000 OMR', color: [245, 158, 11] as [number, number, number] },
      { label: 'Net Income Before Loan', value: '554,500 OMR', color: [59, 130, 246] as [number, number, number] },
    ];
    
    cashFlowData.forEach((item) => {
      pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
      pdf.roundedRect(margin, yPosition, contentWidth, 14, 3, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.text(item.label, margin + 10, yPosition + 9);
      pdf.text(item.value, margin + contentWidth - 50, yPosition + 9);
      yPosition += 18;
    });
    
    yPosition += 8;
    
    pdf.setFillColor(240, 253, 244);
    pdf.roundedRect(margin, yPosition, contentWidth, 45, 5, 5, 'F');
    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(12);
    pdf.text('LOAN COVERAGE ANALYSIS', margin + 10, yPosition + 12);
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(10);
    pdf.text('Requested Loan: 420,000 OMR', margin + 10, yPosition + 24);
    pdf.text('Year 1 Net Income: 554,500 OMR', margin + 10, yPosition + 34);
    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(11);
    pdf.text('Coverage Ratio: 132% - LOAN FULLY COVERED IN YEAR 1', margin + 10, yPosition + 44);

    // === PAGE 8: EXPANSION PLAN ===
    addNewPage();
    addPageHeader('Future Expansion Plan');
    
    const expansionPhases = [
      {
        phase: 'Year 1 - Foundation',
        items: ['50 Private Schools in Muscat & Ad Dakhiliyah', '25,000 Students', 'Establish brand presence'],
        color: [59, 130, 246] as [number, number, number]
      },
      {
        phase: 'Year 2 - Growth',
        items: ['Expand to 100+ Private Schools', 'Cover all major cities', '50,000 Students'],
        color: [16, 185, 129] as [number, number, number]
      },
      {
        phase: 'Year 3 - Expansion',
        items: ['Government school integration', 'GCC market entry', '100,000+ Students'],
        color: [245, 158, 11] as [number, number, number]
      },
    ];
    
    expansionPhases.forEach((phase) => {
      pdf.setFillColor(phase.color[0], phase.color[1], phase.color[2]);
      pdf.roundedRect(margin, yPosition, contentWidth, 40, 5, 5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.text(phase.phase, margin + 10, yPosition + 12);
      pdf.setFontSize(9);
      phase.items.forEach((item, j) => {
        pdf.text('- ' + item, margin + 15, yPosition + 22 + (j * 7));
      });
      yPosition += 48;
    });

    // === PAGE 9: RISKS ===
    addNewPage();
    addPageHeader('Risk Analysis & Mitigation');
    
    const risks = [
      { risk: 'Low Subscription Rates', mitigation: 'Free 1-month trial for schools' },
      { risk: 'Payment Delays', mitigation: 'Binding contracts; service suspension' },
      { risk: 'Technical Failures', mitigation: '24/7 support and local servers' },
      { risk: 'Market Competition', mitigation: 'Unique features create differentiation' },
      { risk: 'Government Policy Changes', mitigation: 'Flexible adaptable business model' },
    ];
    
    risks.forEach((item) => {
      checkPageBreak(28);
      pdf.setFillColor(254, 242, 242);
      pdf.roundedRect(margin, yPosition, contentWidth/2 - 3, 24, 3, 3, 'F');
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(margin + contentWidth/2 + 3, yPosition, contentWidth/2 - 3, 24, 3, 3, 'F');
      
      pdf.setTextColor(239, 68, 68);
      pdf.setFontSize(8);
      pdf.text('RISK:', margin + 5, yPosition + 8);
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(8);
      pdf.text(item.risk, margin + 5, yPosition + 16);
      
      pdf.setTextColor(16, 185, 129);
      pdf.text('MITIGATION:', margin + contentWidth/2 + 8, yPosition + 8);
      pdf.setTextColor(15, 23, 42);
      pdf.text(item.mitigation, margin + contentWidth/2 + 8, yPosition + 16);
      
      yPosition += 28;
    });

    // === PAGE 10: CONCLUSION ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    pdf.setFillColor(59, 130, 246);
    pdf.circle(pageWidth - 20, 30, 40, 'F');
    pdf.setFillColor(16, 185, 129);
    pdf.circle(20, pageHeight - 40, 30, 'F');
    
    // Logo
    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, 'PNG', pageWidth/2 - 20, 25, 40, 40);
      } catch (e) {
        console.log('Logo not added');
      }
    }
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    addCenteredText('Conclusion & Recommendation', 80);
    
    yPosition = 100;
    
    const summaryPoints = [
      'TalebEdu is an innovative and unique project in Oman',
      'Capable of generating stable income covering the loan',
      'Loan of 420,000 OMR recoverable within 3 years',
      'Strong potential for local and international expansion',
      'First-mover advantage in smart school management',
      'Sustainable recurring revenue model'
    ];
    
    pdf.setFontSize(10);
    summaryPoints.forEach((point) => {
      pdf.text('> ' + point, margin + 15, yPosition);
      yPosition += 12;
    });
    
    yPosition += 15;
    
    pdf.setFillColor(16, 185, 129);
    pdf.roundedRect(margin + 10, yPosition, contentWidth - 20, 40, 5, 5, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    addCenteredText('RECOMMENDATION', yPosition + 15);
    pdf.setFontSize(10);
    addCenteredText('Approve the project financing to support this', yPosition + 27);
    addCenteredText('integrated educational and digital security solution.', yPosition + 36);
    
    pdf.setFontSize(9);
    addCenteredText('TalebEdu - Mazen Khanfar', pageHeight - 25);
    addCenteredText('Muscat, Sultanate of Oman - 2026', pageHeight - 16);

    pdf.save('TalebEdu_Feasibility_Study_EN_2026.pdf');
    setIsGeneratingEn(false);
  };

  const generateArabicPDF = async () => {
    setIsGeneratingAr(true);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Load logo
    const logoBase64 = await getImageAsBase64(logoImage);

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

    const addPageHeader = (titleEn: string, titleAr: string) => {
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      addCenteredText(titleEn, 14);
      pdf.setFontSize(12);
      addCenteredText(titleAr, 24);
      
      if (logoBase64) {
        try {
          pdf.addImage(logoBase64, 'PNG', pageWidth - 35, 5, 20, 20);
        } catch (e) {
          console.log('Logo not added');
        }
      }
      yPosition = 42;
    };

    // === COVER PAGE ===
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    pdf.setFillColor(59, 130, 246);
    pdf.circle(pageWidth - 30, 40, 50, 'F');
    pdf.setFillColor(16, 185, 129);
    pdf.circle(30, pageHeight - 50, 35, 'F');
    
    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, 'PNG', pageWidth/2 - 25, 35, 50, 50);
      } catch (e) {
        console.log('Logo not added');
      }
    }
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(32);
    addCenteredText('TalebEdu', 105);
    
    pdf.setFontSize(18);
    addCenteredText('Feasibility Study', 125);
    addCenteredText('(Dirasah Jadwa)', 138);
    
    pdf.setFontSize(11);
    addCenteredText('Comprehensive School Management Application', 155);
    addCenteredText('Electronic Wallet | Smart Gates | Digital Stores', 165);
    
    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(margin + 30, 182, contentWidth - 60, 35, 5, 5, 'F');
    pdf.setFontSize(10);
    addCenteredText('Submitted to / Muqaddam Ila:', 195);
    pdf.setFontSize(13);
    addCenteredText('Oman Development Bank / Bank Al-Tanmiya Al-Umani', 207);
    
    pdf.setFontSize(10);
    addCenteredText('Submitted by / Al-Muqaddim: Mazen Khanfar - TalebEdu', 235);
    addCenteredText('Year / Al-Sana: 2026', 247);
    addCenteredText('Muscat, Sultanate of Oman / Masqat, Saltanat Uman', 268);

    // === PAGE 2: EXECUTIVE SUMMARY ===
    addNewPage();
    addPageHeader('Executive Summary', 'Al-Mulakhkhas Al-Tanfidhi');
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(9);
    
    const execSummaryAr = [
      'TalebEdu is the ONLY application in the world combining:',
      '(TalebEdu huwa al-tatbiq al-wahid fi al-alam alladhi yajma):',
      '',
      '  - School Management (Idarat Al-Madrasa): Attendance, Grades, Homework',
      '  - Bus Management (Idarat Al-Hafila): 6 buses per school minimum',
      '  - Smart Gates & Canteen (Al-Bawwabat Al-Dhakiya wal-Maqsaf)',
      '  - Electronic Wallet (Al-Mahfadha Al-Iliktruniya)',
      '  - Digital Store (Al-Matjar Al-Raqami): NFC wristbands + stationery',
      '  - Communication (Al-Tawasul): Messages, Voice/Video calls, Files',
      '',
      'UNIQUE ADVANTAGES (Mazaya Farida):',
      '',
      '  - Smart Wristband (Al-Siwar Al-Dhaki): No charging or maintenance',
      '  - Multi-language: Arabic, English, Hindi (Mutaaddid Al-Lughat)',
      '  - Complete Security (Aman Kamil) for students and parents',
      '  - GCC Expansion (Al-Tawassu Al-Khaliji) in Year 3',
      '  - Financial Management (Al-Idara Al-Maliya): All payments via wallet',
      '',
      'PROJECT GOAL (Hadaf Al-Mashru):',
      'Create a reliable platform to solve school management and security problems.'
    ];
    
    execSummaryAr.forEach(line => {
      checkPageBreak(6);
      pdf.text(line, margin, yPosition);
      yPosition += 5.5;
    });

    // === PAGE 3: PROJECT SCOPE ===
    addNewPage();
    addPageHeader('Project Scope', 'Nitaq Al-Mashru');
    
    pdf.setTextColor(15, 23, 42);
    
    const metricsAr = [
      ['Target Segment (Al-Shariha Al-Mustahda)', 'Private + Government Schools'],
      ['Location (Al-Mawqi)', 'Muscat & Ad Dakhiliyah'],
      ['Year 1 Schools (Madaris Al-Sana 1)', '50 Schools (50 Madrasa)'],
      ['Avg. Students (Mutawassit Al-Tullab)', '500 Students (500 Talib)'],
      ['Buses per School (Hafilat li-kul Madrasa)', '6 Buses (6 Hafilat)'],
      ['Gates per School (Bawwabat)', '2 Gates (2 Bawwaba)'],
      ['Canteen per School (Maqsaf)', '1 Canteen (1 Maqsaf)'],
    ];
    
    pdf.setFontSize(9);
    metricsAr.forEach((metric, i) => {
      const y = yPosition + (i * 13);
      pdf.setFillColor(240, 249, 255);
      pdf.roundedRect(margin, y, contentWidth, 11, 2, 2, 'F');
      pdf.setTextColor(59, 130, 246);
      pdf.text(metric[0], margin + 5, y + 7);
      pdf.setTextColor(15, 23, 42);
      pdf.text(metric[1], margin + contentWidth - 60, y + 7);
    });
    
    yPosition += 105;
    
    pdf.setFontSize(11);
    pdf.text('Services Offered (Al-Khadamat Al-Muqaddama):', margin, yPosition);
    yPosition += 10;
    
    const servicesAr = [
      '1. Annual Student Subscription (Ishtirak Al-Talib Al-Sanawi)',
      '2. NFC Wristband Sales (Bay Asawir NFC)',
      '3. Private Label Stationery (Qartasiya)',
      '4. Messaging System (Nidham Al-Rasail)'
    ];
    
    pdf.setFontSize(9);
    servicesAr.forEach(service => {
      pdf.text(service, margin + 5, yPosition);
      yPosition += 8;
    });

    // === PAGE 4: COMPETITIVE ADVANTAGES ===
    addNewPage();
    addPageHeader('Competitive Advantages', 'Al-Mazaya Al-Tanafusiya');
    
    pdf.setTextColor(15, 23, 42);
    
    const advantagesAr = [
      ['Smart Wristband (Al-Siwar Al-Dhaki)', 'No charging needed'],
      ['Tracking (Al-Mutaba\'a)', 'Grades, Homework, Attendance'],
      ['Parental Control (Tahakkum Al-Wali)', 'Control purchases'],
      ['Communication (Al-Tawasul)', 'Messages, Calls, Files'],
      ['Digital Store (Al-Matjar)', 'Wristbands + Stationery'],
      ['Multi-Language (Mutaaddid Al-Lughat)', 'Arabic, English, Hindi'],
      ['GCC Ready (Jahiz lil-Khalij)', 'Regional expansion'],
      ['Student Safety (Salamat Al-Talib)', 'Real-time tracking'],
      ['FIRST in Oman (Al-Awwal fi Uman)', 'Smart wristband ID'],
      ['Wallet Pioneer (Rayid Al-Mahfadha)', 'Student money via wristband'],
    ];
    
    pdf.setFontSize(8);
    advantagesAr.forEach((adv) => {
      checkPageBreak(11);
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(margin, yPosition, contentWidth, 9, 2, 2, 'F');
      pdf.setTextColor(16, 185, 129);
      pdf.text('> ' + adv[0], margin + 3, yPosition + 6);
      pdf.setTextColor(75, 85, 99);
      pdf.text(adv[1], margin + 90, yPosition + 6);
      yPosition += 11;
    });

    // === PAGE 5: FINANCIAL STUDY ===
    addNewPage();
    addPageHeader('Financial Study', 'Al-Dirasa Al-Maliya');
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(10);
    pdf.text('Annual Revenue - Private Schools (Al-Iradat - Madaris Khassa)', margin, yPosition);
    yPosition += 8;
    
    const tableHeadersAr = ['Year', 'Students', 'Schools', 'Student', 'Bus', 'NFC', 'Stationery', 'TOTAL'];
    const tableDataAr = [
      ['1', '25,000', '50', '625,000', '30,000', '42,500', '312,500', '1,010,000'],
      ['2', '50,000', '100', '1,250,000', '60,000', '85,000', '625,000', '2,020,000'],
      ['3', '100,000', '200', '2,500,000', '120,000', '170,000', '1,250,000', '4,040,000'],
    ];
    
    const colWidthsAr = [15, 22, 20, 26, 22, 22, 26, 28];
    let xPos = margin;
    
    pdf.setFillColor(59, 130, 246);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    tableHeadersAr.forEach((header, i) => {
      pdf.text(header, xPos + 2, yPosition + 5);
      xPos += colWidthsAr[i];
    });
    yPosition += 8;
    
    pdf.setTextColor(15, 23, 42);
    tableDataAr.forEach((row, rowIndex) => {
      xPos = margin;
      pdf.setFillColor(rowIndex % 2 === 0 ? 248 : 255, 250, 252);
      pdf.rect(margin, yPosition, contentWidth, 7, 'F');
      row.forEach((cell, i) => {
        pdf.text(cell, xPos + 2, yPosition + 5);
        xPos += colWidthsAr[i];
      });
      yPosition += 7;
    });
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.text('Government + Private Scenario (Hukuma + Khass)', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(9);
    const govScenarioAr = [
      '- Total: 242,000 students (192,000 Gov + 50,000 Private)',
      '- Student Subscriptions: 6,050,000 OMR',
      '- Bus Subscriptions: 290,400 OMR',
      '- NFC Profit: 411,400 OMR',
      '- Stationery Profit: 3,025,000 OMR',
    ];
    
    govScenarioAr.forEach(line => {
      pdf.text(line, margin + 5, yPosition);
      yPosition += 7;
    });
    
    yPosition += 3;
    pdf.setFillColor(16, 185, 129);
    pdf.roundedRect(margin, yPosition, contentWidth, 12, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.text('TOTAL = 9,776,800 OMR (Ijmali Al-Iradat)', margin + 35, yPosition + 8);

    // === PAGE 6: CAPEX & OPEX ===
    addNewPage();
    addPageHeader('CAPEX & OPEX', 'Al-Takaleef Al-Rasmaliya wal-Tashghiliya');
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(10);
    pdf.text('Capital Expenditure - CAPEX (Takaleef Rasmaliya)', margin, yPosition);
    yPosition += 8;
    
    const capexItemsAr = [
      ['Bus Devices (Ajhizat Hafilat) - 300', '290', '87,000'],
      ['Smart Gates (Bawwabat) - 100', '290', '29,000'],
      ['Canteen Systems (Maqasif) - 50', '370', '18,500'],
      ['Electric Vehicles (Sayarat) - 5', '8,000', '40,000'],
      ['Employee Devices (Ajhiza) - 10', '1,000', '10,000'],
      ['Servers & Data Room (Khawadem)', '-', '35,000'],
      ['Furniture (Athath)', '-', '30,000'],
      ['Licenses (Tarakhis)', '-', '7,000'],
      ['Stationery Import (Qartasiya)', '-', '30,000'],
      ['App Development (Tatwir)', '-', '25,000'],
      ['Cybersecurity (Amn Sibrani)', '-', '18,000'],
    ];
    
    const capexColWidthsAr = [100, 35, 35];
    xPos = margin;
    
    pdf.setFillColor(59, 130, 246);
    pdf.rect(margin, yPosition, contentWidth, 7, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    ['Item (Band)', 'Unit Price', 'Total (OMR)'].forEach((header, i) => {
      pdf.text(header, xPos + 2, yPosition + 5);
      xPos += capexColWidthsAr[i];
    });
    yPosition += 7;
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(7);
    capexItemsAr.forEach((row, rowIndex) => {
      xPos = margin;
      pdf.setFillColor(rowIndex % 2 === 0 ? 248 : 255, 250, 252);
      pdf.rect(margin, yPosition, contentWidth, 5.5, 'F');
      pdf.text(row[0], xPos + 2, yPosition + 4);
      xPos += capexColWidthsAr[0];
      pdf.text(row[1], xPos + 2, yPosition + 4);
      xPos += capexColWidthsAr[1];
      pdf.text(row[2], xPos + 2, yPosition + 4);
      yPosition += 5.5;
    });
    
    pdf.setFillColor(15, 23, 42);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.text('TOTAL CAPEX (Ijmali)', margin + 5, yPosition + 5);
    pdf.text('329,500 OMR', margin + contentWidth - 35, yPosition + 5);
    
    yPosition += 15;
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(10);
    pdf.text('Operating Expenses - OPEX (Takaleef Tashghiliya)', margin, yPosition);
    yPosition += 8;
    
    xPos = margin;
    pdf.setFillColor(245, 158, 11);
    pdf.rect(margin, yPosition, contentWidth, 7, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    ['Item (Band)', 'Monthly', 'Annual (OMR)'].forEach((header, i) => {
      pdf.text(header, xPos + 2, yPosition + 5);
      xPos += capexColWidthsAr[i];
    });
    yPosition += 7;
    
    const opexItemsAr = [
      ['Staff Salaries (Rawatib) + Manager', '8,500', '102,000'],
      ['Office Rent (Ijar)', '2,000', '24,000'],
    ];
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(8);
    opexItemsAr.forEach((row, rowIndex) => {
      xPos = margin;
      pdf.setFillColor(255, 251, 235);
      pdf.rect(margin, yPosition, contentWidth, 6, 'F');
      pdf.text(row[0], xPos + 2, yPosition + 4);
      xPos += capexColWidthsAr[0];
      pdf.text(row[1], xPos + 2, yPosition + 4);
      xPos += capexColWidthsAr[1];
      pdf.text(row[2], xPos + 2, yPosition + 4);
      yPosition += 6;
    });
    
    pdf.setFillColor(245, 158, 11);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.text('TOTAL OPEX (Ijmali)', margin + 5, yPosition + 5);
    pdf.text('126,000 OMR / Year', margin + contentWidth - 50, yPosition + 5);

    // === PAGE 7: CASH FLOW ===
    addNewPage();
    addPageHeader('Cash Flow Analysis', 'Tahlil Al-Tadaffuq Al-Naqdi');
    
    pdf.setTextColor(255, 255, 255);
    
    const cashFlowDataAr = [
      { label: 'Total Revenue (Ijmali Al-Iradat)', value: '1,010,000 OMR', color: [16, 185, 129] as [number, number, number] },
      { label: 'CAPEX (Takaleef Rasmaliya)', value: '329,500 OMR', color: [239, 68, 68] as [number, number, number] },
      { label: 'OPEX (Takaleef Tashghiliya)', value: '126,000 OMR', color: [245, 158, 11] as [number, number, number] },
      { label: 'Net Income (Safi Al-Dakhl)', value: '554,500 OMR', color: [59, 130, 246] as [number, number, number] },
    ];
    
    cashFlowDataAr.forEach((item) => {
      pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
      pdf.roundedRect(margin, yPosition, contentWidth, 14, 3, 3, 'F');
      pdf.setFontSize(10);
      pdf.text(item.label, margin + 10, yPosition + 9);
      pdf.text(item.value, margin + contentWidth - 45, yPosition + 9);
      yPosition += 18;
    });
    
    yPosition += 8;
    
    pdf.setFillColor(240, 253, 244);
    pdf.roundedRect(margin, yPosition, contentWidth, 45, 5, 5, 'F');
    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(11);
    pdf.text('LOAN ANALYSIS (Tahlil Al-Qard)', margin + 10, yPosition + 12);
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(9);
    pdf.text('Requested Loan (Al-Qard Al-Matlub): 420,000 OMR', margin + 10, yPosition + 24);
    pdf.text('Year 1 Net Income (Safi Dakhl Sana 1): 554,500 OMR', margin + 10, yPosition + 34);
    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(10);
    pdf.text('Coverage: 132% - LOAN COVERED IN YEAR 1', margin + 10, yPosition + 44);

    // === PAGE 8: EXPANSION ===
    addNewPage();
    addPageHeader('Expansion Plan', 'Khuttat Al-Tawassu');
    
    const expansionPhasesAr = [
      {
        phase: 'Year 1 - Foundation (Al-Tasis)',
        items: ['50 Private Schools', '25,000 Students', 'Brand presence'],
        color: [59, 130, 246] as [number, number, number]
      },
      {
        phase: 'Year 2 - Growth (Al-Numuw)',
        items: ['100+ Private Schools', 'All major cities', '50,000 Students'],
        color: [16, 185, 129] as [number, number, number]
      },
      {
        phase: 'Year 3 - Expansion (Al-Tawassu)',
        items: ['Government integration', 'GCC market entry', '100,000+ Students'],
        color: [245, 158, 11] as [number, number, number]
      },
    ];
    
    expansionPhasesAr.forEach((phase) => {
      pdf.setFillColor(phase.color[0], phase.color[1], phase.color[2]);
      pdf.roundedRect(margin, yPosition, contentWidth, 40, 5, 5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.text(phase.phase, margin + 10, yPosition + 12);
      pdf.setFontSize(9);
      phase.items.forEach((item, j) => {
        pdf.text('- ' + item, margin + 15, yPosition + 22 + (j * 7));
      });
      yPosition += 48;
    });

    // === PAGE 9: RISKS ===
    addNewPage();
    addPageHeader('Risk Analysis', 'Tahlil Al-Makhatir');
    
    const risksAr = [
      { risk: 'Low Subscriptions (Ishtirakat Munkhafida)', mitigation: 'Free 1-month trial (Tajriba Majjaniya)' },
      { risk: 'Payment Delays (Takhir Al-Daf)', mitigation: 'Contracts + suspension (Uqud + Tawqif)' },
      { risk: 'Technical Failures (Ataal Tiqniya)', mitigation: '24/7 support + local servers' },
      { risk: 'Competition (Al-Munafasa)', mitigation: 'Unique features (Mazaya Farida)' },
      { risk: 'Policy Changes (Taghyirat)', mitigation: 'Flexible model (Namudhaj Marin)' },
    ];
    
    risksAr.forEach((item) => {
      checkPageBreak(26);
      pdf.setFillColor(254, 242, 242);
      pdf.roundedRect(margin, yPosition, contentWidth/2 - 3, 22, 3, 3, 'F');
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(margin + contentWidth/2 + 3, yPosition, contentWidth/2 - 3, 22, 3, 3, 'F');
      
      pdf.setTextColor(239, 68, 68);
      pdf.setFontSize(7);
      pdf.text('RISK:', margin + 5, yPosition + 7);
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(7);
      pdf.text(item.risk, margin + 5, yPosition + 14);
      
      pdf.setTextColor(16, 185, 129);
      pdf.text('MITIGATION:', margin + contentWidth/2 + 8, yPosition + 7);
      pdf.setTextColor(15, 23, 42);
      pdf.text(item.mitigation, margin + contentWidth/2 + 8, yPosition + 14);
      
      yPosition += 26;
    });

    // === PAGE 10: CONCLUSION ===
    addNewPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    pdf.setFillColor(59, 130, 246);
    pdf.circle(pageWidth - 20, 30, 40, 'F');
    pdf.setFillColor(16, 185, 129);
    pdf.circle(20, pageHeight - 40, 30, 'F');
    
    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, 'PNG', pageWidth/2 - 20, 22, 40, 40);
      } catch (e) {
        console.log('Logo not added');
      }
    }
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    addCenteredText('Conclusion & Recommendation', 75);
    pdf.setFontSize(12);
    addCenteredText('Al-Khulasa wal-Tawsiya', 87);
    
    yPosition = 105;
    
    const summaryPointsAr = [
      'TalebEdu - Innovative project in Oman (Mashru Mubtakar fi Uman)',
      'Stable income covering the loan (Dakhl Thabit Yughatti Al-Qard)',
      '420,000 OMR recoverable in 3 years (Qabil lil-Istirdad)',
      'Strong expansion potential (Imkaniyat Tawassu Qawiya)',
      'First-mover advantage (Mizat Al-Raaid Al-Awwal)',
      'Sustainable revenue model (Namudhaj Iradat Mustadim)'
    ];
    
    pdf.setFontSize(9);
    summaryPointsAr.forEach((point) => {
      pdf.text('> ' + point, margin + 15, yPosition);
      yPosition += 11;
    });
    
    yPosition += 12;
    
    pdf.setFillColor(16, 185, 129);
    pdf.roundedRect(margin + 10, yPosition, contentWidth - 20, 38, 5, 5, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(13);
    addCenteredText('RECOMMENDATION (TAWSIYA)', yPosition + 14);
    pdf.setFontSize(9);
    addCenteredText('Approve financing for this integrated educational', yPosition + 26);
    addCenteredText('and digital security solution.', yPosition + 35);
    
    pdf.setFontSize(9);
    addCenteredText('TalebEdu - Mazen Khanfar', pageHeight - 25);
    addCenteredText('Muscat, Sultanate of Oman - 2026', pageHeight - 16);

    pdf.save('TalebEdu_Feasibility_Study_AR_2026.pdf');
    setIsGeneratingAr(false);
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

        {/* Download Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12"
        >
          {/* English PDF */}
          <Button
            onClick={generateEnglishPDF}
            disabled={isGeneratingEn}
            size="lg"
            className="bg-gradient-to-l from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg px-10 py-7 rounded-2xl shadow-2xl shadow-blue-500/30 transition-all hover:scale-105"
          >
            {isGeneratingEn ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 ml-2" />
                </motion.div>
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 ml-2" />
                تحميل النسخة الإنجليزية
              </>
            )}
          </Button>

          {/* Arabic PDF */}
          <Button
            onClick={generateArabicPDF}
            disabled={isGeneratingAr}
            size="lg"
            className="bg-gradient-to-l from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-lg px-10 py-7 rounded-2xl shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105"
          >
            {isGeneratingAr ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 ml-2" />
                </motion.div>
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 ml-2" />
                تحميل النسخة العربية
              </>
            )}
          </Button>
        </motion.div>

        <p className="text-white/50 text-center mb-8">ملف PDF احترافي جاهز للتقديم لبنك التنمية</p>

        {/* Preview Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Executive Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 hover:bg-white/15 transition-all h-full">
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
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 hover:bg-white/15 transition-all h-full">
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
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 hover:bg-white/15 transition-all h-full">
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
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 hover:bg-white/15 transition-all h-full">
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
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 hover:bg-white/15 transition-all h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-pink-500/20 rounded-xl">
                  <Shield className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white">المزايا الفريدة</h3>
              </div>
              <ul className="space-y-2 text-white/80 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  سوار ذكي لا يحتاج شحن أو صيانة
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  محفظة إلكترونية للطالب
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  تتبع مباشر للباصات
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
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
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 hover:bg-white/15 transition-all h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-cyan-500/20 rounded-xl">
                  <Globe className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white">التوسع المستقبلي</h3>
              </div>
              <ul className="space-y-2 text-white/80 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  100+ مدرسة في السنة الثانية
                </li>
                <li className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  دمج المدارس الحكومية
                </li>
                <li className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />
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
          <p>TalebEdu © 2026 - مازن خانفار</p>
          <p className="mt-2">مسقط، سلطنة عُمان</p>
        </motion.div>
      </div>
    </div>
  );
};

export default FeasibilityStudy;
