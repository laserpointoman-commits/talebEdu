import { useState, useRef } from "react";
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
import html2pdf from "html2pdf.js";
import logoImage from "@/assets/talebedu-logo-hq.png";

const FeasibilityStudy = () => {
  const [isGeneratingEn, setIsGeneratingEn] = useState(false);
  const [isGeneratingAr, setIsGeneratingAr] = useState(false);
  const arabicPdfRef = useRef<HTMLDivElement>(null);
  const englishPdfRef = useRef<HTMLDivElement>(null);

  const generateEnglishPDF = async () => {
    setIsGeneratingEn(true);
    
    if (englishPdfRef.current) {
      // Temporarily make the element visible for html2canvas
      const container = englishPdfRef.current.parentElement;
      if (container) {
        container.style.position = 'fixed';
        container.style.left = '0';
        container.style.top = '0';
        container.style.zIndex = '-1';
        container.style.opacity = '1';
      }

      const opt = {
        margin: 0,
        filename: 'TalebEdu_Feasibility_Study_EN_2026.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          allowTaint: true,
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'] as const }
      };
      
      await html2pdf().set(opt).from(englishPdfRef.current).save();

      // Hide it again
      if (container) {
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.zIndex = '';
        container.style.opacity = '';
      }
    }
    
    setIsGeneratingEn(false);
  };

  const generateArabicPDF = async () => {
    setIsGeneratingAr(true);
    
    if (arabicPdfRef.current) {
      // Temporarily make the element visible for html2canvas
      const container = arabicPdfRef.current.parentElement;
      if (container) {
        container.style.position = 'fixed';
        container.style.left = '0';
        container.style.top = '0';
        container.style.zIndex = '-1';
        container.style.opacity = '1';
      }

      const opt = {
        margin: 0,
        filename: 'TalebEdu_Feasibility_Study_AR_2026.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          allowTaint: true,
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'] as const }
      };
      
      await html2pdf().set(opt).from(arabicPdfRef.current).save();

      // Hide it again
      if (container) {
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.zIndex = '';
        container.style.opacity = '';
      }
    }
    
    setIsGeneratingAr(false);
  };

  // Common styles for PDF pages
  const pageStyle = {
    width: '210mm',
    minHeight: '297mm',
    padding: '15mm',
    boxSizing: 'border-box' as const,
    pageBreakAfter: 'always' as const,
    fontFamily: 'Arial, sans-serif',
  };

  const headerStyle = {
    backgroundColor: '#0f172a',
    color: 'white',
    padding: '15px 20px',
    marginBottom: '20px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" dir="rtl">
      {/* Hidden Arabic PDF Content */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={arabicPdfRef} dir="rtl" style={{ fontFamily: 'Arial, sans-serif', backgroundColor: 'white' }}>
          {/* Cover Page */}
          <div style={{
            ...pageStyle,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center',
          }}>
            <img src={logoImage} alt="TalebEdu Logo" style={{ width: '100px', height: '100px', marginBottom: '30px' }} />
            <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '10px' }}>TalebEdu</h1>
            <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#60a5fa' }}>دراسة جدوى</h2>
            <p style={{ fontSize: '16px', marginBottom: '10px' }}>تطبيق شامل لإدارة المدارس</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>المحفظة الإلكترونية | البوابات الذكية | المتجر الرقمي</p>
            
            <div style={{ 
              backgroundColor: '#3b82f6', 
              padding: '20px 40px', 
              borderRadius: '12px', 
              marginTop: '40px',
              marginBottom: '40px'
            }}>
              <p style={{ fontSize: '14px', marginBottom: '5px' }}>مقدم إلى</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold' }}>بنك التنمية العماني</p>
            </div>
            
            <p style={{ fontSize: '14px' }}>مقدم من: مازن خنفر - TalebEdu</p>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>السنة: 2026</p>
            <p style={{ fontSize: '14px', marginTop: '20px', color: '#94a3b8' }}>مسقط، سلطنة عمان</p>
          </div>

          {/* Page 2: Executive Summary */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>الملخص التنفيذي</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b', lineHeight: '1.8' }}>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '15px' }}>
                TalebEdu هو التطبيق الوحيد في العالم الذي يجمع في منصة واحدة:
              </p>
              
              <ul style={{ fontSize: '14px', paddingRight: '20px', marginBottom: '20px' }}>
                <li style={{ marginBottom: '8px' }}>✓ إدارة المدرسة: الحضور، الدرجات، الواجبات، الجداول</li>
                <li style={{ marginBottom: '8px' }}>✓ إدارة الباصات: 6 باصات كحد أدنى لكل مدرسة مع تتبع مباشر</li>
                <li style={{ marginBottom: '8px' }}>✓ البوابات الذكية والمقصف بتقنية NFC</li>
                <li style={{ marginBottom: '8px' }}>✓ المحفظة الإلكترونية للطلاب</li>
                <li style={{ marginBottom: '8px' }}>✓ المتجر الرقمي: أساور NFC + قرطاسية بعلامة تجارية خاصة</li>
                <li style={{ marginBottom: '8px' }}>✓ نظام تواصل متكامل: رسائل، مكالمات صوتية ومرئية، مشاركة ملفات</li>
              </ul>

              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginBottom: '15px' }}>
                المزايا الفريدة:
              </p>
              
              <ul style={{ fontSize: '14px', paddingRight: '20px', marginBottom: '20px' }}>
                <li style={{ marginBottom: '8px' }}>✓ السوار الذكي: مقاوم لجميع العوامل عدا النار، لا يحتاج شحن</li>
                <li style={{ marginBottom: '8px' }}>✓ دعم متعدد اللغات: العربية، الإنجليزية، الهندية</li>
                <li style={{ marginBottom: '8px' }}>✓ أمان كامل للطلاب وأولياء الأمور</li>
                <li style={{ marginBottom: '8px' }}>✓ قابلية التوسع المحلي والدولي (دول الخليج في السنة 3)</li>
                <li style={{ marginBottom: '8px' }}>✓ إدارة مالية متكاملة: جميع الاشتراكات عبر المحفظة</li>
              </ul>

              <div style={{ 
                backgroundColor: '#f0fdf4', 
                padding: '15px', 
                borderRadius: '8px', 
                borderRight: '4px solid #10b981' 
              }}>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534' }}>هدف المشروع:</p>
                <p style={{ fontSize: '14px', color: '#166534' }}>
                  إنشاء منصة موثوقة وشاملة لحل مشاكل إدارة المدارس والأمان والتواصل والشراء الرقمي بطريقة مستدامة.
                </p>
              </div>
            </div>
          </div>

          {/* Page 3: Project Scope */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>نطاق المشروع</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                <tbody>
                  {[
                    ['الشريحة المستهدفة', 'المدارس الخاصة + شراكة حكومية'],
                    ['الموقع', 'مسقط والداخلية'],
                    ['مدارس السنة الأولى', '50 مدرسة'],
                    ['متوسط الطلاب لكل مدرسة', '500 طالب'],
                    ['الباصات لكل مدرسة', '6 باصات'],
                    ['البوابات لكل مدرسة', 'بوابتان'],
                    ['المقصف لكل مدرسة', 'مقصف واحد'],
                  ].map(([label, value], i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f0f9ff' : 'white' }}>
                      <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#3b82f6' }}>{label}</td>
                      <td style={{ padding: '12px 15px', textAlign: 'left' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#1e293b' }}>
                الخدمات المقدمة:
              </h3>
              <ol style={{ fontSize: '14px', paddingRight: '20px' }}>
                <li style={{ marginBottom: '10px' }}>اشتراك سنوي للطالب (الباص، البوابة، المقصف، المحفظة، متابعة الدرجات)</li>
                <li style={{ marginBottom: '10px' }}>بيع أساور NFC إضافية</li>
                <li style={{ marginBottom: '10px' }}>متجر قرطاسية بعلامة تجارية خاصة</li>
                <li style={{ marginBottom: '10px' }}>نظام مراسلة داخلي للتواصل بين الأهل والمعلمين والإدارة</li>
              </ol>
            </div>
          </div>

          {/* Page 4: Competitive Advantages */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>المزايا التنافسية</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b' }}>
              {[
                ['تقنية السوار الذكي', 'لا يحتاج شحن أو صيانة'],
                ['متابعة شاملة', 'الدرجات، الواجبات، الحضور في مكان واحد'],
                ['تحكم الوالدين', 'الأهل يتحكمون في مشتريات المقصف والحدود'],
                ['تواصل متكامل', 'رسائل، مكالمات صوتية/مرئية، مشاركة ملفات'],
                ['سوق رقمي', 'أساور + قرطاسية بعلامة تجارية خاصة'],
                ['دعم متعدد اللغات', 'العربية، الإنجليزية، الهندية'],
                ['جاهز للتوسع الخليجي', 'بنية قابلة للتوسع إقليمياً'],
                ['أمان كامل للطلاب', 'تتبع مباشر ودخول آمن'],
                ['الأول في عمان', 'السوار الذكي كهوية مدرسية رقمية'],
                ['رائد المحفظة الإلكترونية', 'مصروف الطالب عبر السوار'],
                ['نظام دفع مباشر', 'الرسوم تُدفع مباشرة عبر المحفظة'],
              ].map(([title, desc], i) => (
                <div key={i} style={{ 
                  backgroundColor: '#f0fdf4', 
                  padding: '12px 15px', 
                  marginBottom: '8px', 
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ {title}</span>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Page 5: Financial Study - Revenue */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>الدراسة المالية - الإيرادات</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>
                أ) الإيرادات السنوية - المدارس الخاصة فقط (ر.ع)
              </h3>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                    <th style={{ padding: '10px', textAlign: 'center' }}>السنة</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>الطلاب</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>المدارس</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>اشتراك الطالب</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>الباصات</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>NFC</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>القرطاسية</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['1', '25,000', '50', '625,000', '30,000', '42,500', '312,500', '1,010,000'],
                    ['2', '50,000', '100', '1,250,000', '60,000', '85,000', '625,000', '2,020,000'],
                    ['3', '100,000', '200', '2,500,000', '120,000', '170,000', '1,250,000', '4,040,000'],
                  ].map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                      {row.map((cell, j) => (
                        <td key={j} style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>
                ب) سيناريو المدارس الحكومية + الخاصة (ر.ع)
              </h3>
              
              <ul style={{ fontSize: '14px', paddingRight: '20px', marginBottom: '20px' }}>
                <li style={{ marginBottom: '8px' }}>إجمالي الطلاب: 242,000 (192,000 حكومي + 50,000 خاص)</li>
                <li style={{ marginBottom: '8px' }}>اشتراكات الطلاب: 6,050,000 ر.ع</li>
                <li style={{ marginBottom: '8px' }}>اشتراكات الباصات: 290,400 ر.ع</li>
                <li style={{ marginBottom: '8px' }}>أرباح NFC: 411,400 ر.ع</li>
                <li style={{ marginBottom: '8px' }}>أرباح القرطاسية: 3,025,000 ر.ع</li>
              </ul>

              <div style={{ 
                backgroundColor: '#10b981', 
                color: 'white', 
                padding: '15px', 
                borderRadius: '8px', 
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                إجمالي الإيرادات = 9,776,800 ر.ع
              </div>
            </div>
          </div>

          {/* Page 6: CAPEX & OPEX */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>التكاليف الرأسمالية والتشغيلية</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                التكاليف الرأسمالية (CAPEX)
              </h3>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                    <th style={{ padding: '8px', textAlign: 'right' }}>البند</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>سعر الوحدة</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>الإجمالي (ر.ع)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['أجهزة الباصات (300 وحدة)', '290', '87,000'],
                    ['البوابات الذكية (100 وحدة)', '290', '29,000'],
                    ['أنظمة المقاصف (50 وحدة)', '370', '18,500'],
                    ['سيارات كهربائية (5 وحدات)', '8,000', '40,000'],
                    ['أجهزة الموظفين (10 وحدات)', '1,000', '10,000'],
                    ['الخوادم وغرفة البيانات', '-', '35,000'],
                    ['أثاث الشركة', '-', '30,000'],
                    ['التراخيص والتسجيل', '-', '7,000'],
                    ['استيراد القرطاسية الأولي', '-', '30,000'],
                    ['تطوير التطبيق', '-', '25,000'],
                    ['الأمن السيبراني', '-', '18,000'],
                  ].map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>{row[0]}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row[1]}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold' }}>
                    <td colSpan={2} style={{ padding: '10px' }}>إجمالي CAPEX</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>329,500 ر.ع</td>
                  </tr>
                </tfoot>
              </table>

              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                التكاليف التشغيلية (OPEX)
              </h3>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                    <th style={{ padding: '8px', textAlign: 'right' }}>البند</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>شهرياً</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>سنوياً (ر.ع)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: '#fffbeb' }}>
                    <td style={{ padding: '8px' }}>رواتب الموظفين + المدير</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>8,500</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>102,000</td>
                  </tr>
                  <tr style={{ backgroundColor: 'white' }}>
                    <td style={{ padding: '8px' }}>إيجار المكتب</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>2,000</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>24,000</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f59e0b', color: 'white', fontWeight: 'bold' }}>
                    <td colSpan={2} style={{ padding: '10px' }}>إجمالي OPEX</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>126,000 ر.ع / سنة</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Page 7: Cash Flow */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>تحليل التدفق النقدي - السنة الأولى</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b' }}>
              {[
                { label: 'إجمالي الإيرادات', value: '1,010,000 ر.ع', color: '#10b981' },
                { label: 'التكاليف الرأسمالية (CAPEX)', value: '329,500 ر.ع', color: '#ef4444' },
                { label: 'التكاليف التشغيلية (OPEX)', value: '126,000 ر.ع', color: '#f59e0b' },
                { label: 'صافي الدخل قبل القرض', value: '554,500 ر.ع', color: '#3b82f6' },
              ].map((item, i) => (
                <div key={i} style={{ 
                  backgroundColor: item.color, 
                  color: 'white', 
                  padding: '15px 20px', 
                  marginBottom: '15px', 
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '16px'
                }}>
                  <span>{item.label}</span>
                  <span style={{ fontWeight: 'bold' }}>{item.value}</span>
                </div>
              ))}

              <div style={{ 
                backgroundColor: '#f0fdf4', 
                padding: '25px', 
                borderRadius: '12px', 
                marginTop: '30px',
                border: '2px solid #10b981'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginBottom: '15px' }}>
                  تحليل تغطية القرض
                </h3>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>القرض المطلوب: 420,000 ر.ع</p>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>صافي دخل السنة الأولى: 554,500 ر.ع</p>
                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginTop: '15px' }}>
                  نسبة التغطية: 132% - القرض مغطى بالكامل في السنة الأولى
                </p>
              </div>
            </div>
          </div>

          {/* Page 8: Expansion Plan */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>خطة التوسع المستقبلية</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b' }}>
              {[
                {
                  phase: 'السنة الأولى - التأسيس',
                  items: ['50 مدرسة خاصة في مسقط والداخلية', '25,000 طالب', 'تأسيس الحضور في السوق'],
                  color: '#3b82f6'
                },
                {
                  phase: 'السنة الثانية - النمو',
                  items: ['التوسع إلى 100+ مدرسة خاصة', 'تغطية جميع المدن الرئيسية', '50,000 طالب'],
                  color: '#10b981'
                },
                {
                  phase: 'السنة الثالثة - التوسع',
                  items: ['دمج المدارس الحكومية', 'دخول سوق دول الخليج', '100,000+ طالب'],
                  color: '#f59e0b'
                },
              ].map((phase, i) => (
                <div key={i} style={{ 
                  backgroundColor: phase.color, 
                  color: 'white', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  marginBottom: '20px' 
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>{phase.phase}</h3>
                  <ul style={{ paddingRight: '15px' }}>
                    {phase.items.map((item, j) => (
                      <li key={j} style={{ marginBottom: '6px' }}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Page 9: Risk Analysis */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>تحليل المخاطر والتخفيف</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b' }}>
              {[
                { risk: 'انخفاض معدلات الاشتراك', mitigation: 'تجربة مجانية لمدة شهر للمدارس' },
                { risk: 'تأخر الدفع', mitigation: 'عقود ملزمة مع إمكانية تعليق الخدمة' },
                { risk: 'أعطال تقنية', mitigation: 'دعم 24/7 وخوادم محلية' },
                { risk: 'المنافسة في السوق', mitigation: 'ميزات فريدة تخلق تمايزاً' },
                { risk: 'تغييرات السياسات الحكومية', mitigation: 'نموذج عمل مرن وقابل للتكيف' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: '#fef2f2', 
                    padding: '15px', 
                    borderRadius: '8px' 
                  }}>
                    <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold', marginBottom: '5px' }}>المخاطر:</p>
                    <p style={{ fontSize: '14px' }}>{item.risk}</p>
                  </div>
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: '#f0fdf4', 
                    padding: '15px', 
                    borderRadius: '8px' 
                  }}>
                    <p style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold', marginBottom: '5px' }}>التخفيف:</p>
                    <p style={{ fontSize: '14px' }}>{item.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Page 10: Conclusion */}
          <div style={{
            ...pageStyle,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            color: 'white',
            pageBreakAfter: 'avoid',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <img src={logoImage} alt="TalebEdu Logo" style={{ width: '80px', height: '80px', marginBottom: '20px' }} />
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>الخلاصة والتوصية</h1>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              {[
                'TalebEdu مشروع مبتكر وفريد في عمان',
                'قادر على توليد دخل مستقر يغطي القرض',
                'قرض 420,000 ر.ع قابل للاسترداد خلال 3 سنوات',
                'إمكانية قوية للتوسع محلياً ودولياً',
                'ميزة الريادة في إدارة المدارس الذكية',
                'نموذج إيرادات مستدام ومتكرر'
              ].map((point, i) => (
                <p key={i} style={{ fontSize: '16px', marginBottom: '12px', paddingRight: '20px' }}>
                  ✓ {point}
                </p>
              ))}
            </div>

            <div style={{ 
              backgroundColor: '#10b981', 
              padding: '25px', 
              borderRadius: '12px', 
              textAlign: 'center',
              marginBottom: '40px'
            }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>التوصية</h2>
              <p style={{ fontSize: '16px' }}>
                الموافقة على تمويل المشروع لدعم هذا الحل التعليمي والأمني الرقمي المتكامل
              </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <p style={{ fontSize: '14px' }}>TalebEdu - مازن خنفر</p>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '10px' }}>مسقط، سلطنة عمان - 2026</p>
            </div>
          </div>
        </div>

        {/* Hidden English PDF Content */}
        <div ref={englishPdfRef} style={{ fontFamily: 'Arial, sans-serif', backgroundColor: 'white' }}>
          {/* Cover Page */}
          <div style={{
            ...pageStyle,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center',
          }}>
            <img src={logoImage} alt="TalebEdu Logo" style={{ width: '100px', height: '100px', marginBottom: '30px' }} />
            <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '10px' }}>TalebEdu</h1>
            <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#60a5fa' }}>Feasibility Study</h2>
            <p style={{ fontSize: '16px', marginBottom: '10px' }}>Comprehensive School Management Application</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Electronic Wallet | Smart Gates | Digital Stores</p>
            
            <div style={{ 
              backgroundColor: '#3b82f6', 
              padding: '20px 40px', 
              borderRadius: '12px', 
              marginTop: '40px',
              marginBottom: '40px'
            }}>
              <p style={{ fontSize: '14px', marginBottom: '5px' }}>Submitted to</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold' }}>Oman Development Bank</p>
            </div>
            
            <p style={{ fontSize: '14px' }}>Submitted by: Mazen Khanfar - TalebEdu</p>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>Year: 2026</p>
            <p style={{ fontSize: '14px', marginTop: '20px', color: '#94a3b8' }}>Muscat, Sultanate of Oman</p>
          </div>

          {/* Page 2: Executive Summary */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Executive Summary</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b', lineHeight: '1.8' }}>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '15px' }}>
                TalebEdu is the ONLY application in the world that combines in one platform:
              </p>
              
              <ul style={{ fontSize: '14px', paddingLeft: '20px', marginBottom: '20px' }}>
                <li style={{ marginBottom: '8px' }}>✓ School Management: Attendance, Grades, Homework, Schedules</li>
                <li style={{ marginBottom: '8px' }}>✓ Bus Management: 6 buses minimum per school with real-time tracking</li>
                <li style={{ marginBottom: '8px' }}>✓ Smart Gates & Canteen with NFC technology</li>
                <li style={{ marginBottom: '8px' }}>✓ Electronic Wallet for students</li>
                <li style={{ marginBottom: '8px' }}>✓ Digital Store: NFC wristbands + Private Label stationery</li>
                <li style={{ marginBottom: '8px' }}>✓ Integrated Communication: Messages, Voice/Video calls, File sharing</li>
              </ul>

              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginBottom: '15px' }}>
                Unique Advantages:
              </p>
              
              <ul style={{ fontSize: '14px', paddingLeft: '20px', marginBottom: '20px' }}>
                <li style={{ marginBottom: '8px' }}>✓ Smart Wristband: Resistant to all elements except fire, NO charging needed</li>
                <li style={{ marginBottom: '8px' }}>✓ Multi-language Support: Arabic, English, Hindi</li>
                <li style={{ marginBottom: '8px' }}>✓ Complete Security for students and parents</li>
                <li style={{ marginBottom: '8px' }}>✓ Local and International Scalability (GCC countries in Year 3)</li>
                <li style={{ marginBottom: '8px' }}>✓ Complete Financial Management: All subscriptions paid via wallet</li>
              </ul>

              <div style={{ 
                backgroundColor: '#f0fdf4', 
                padding: '15px', 
                borderRadius: '8px', 
                borderLeft: '4px solid #10b981' 
              }}>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534' }}>Project Goal:</p>
                <p style={{ fontSize: '14px', color: '#166534' }}>
                  Create a reliable and comprehensive platform to solve school management, security, communication, and digital purchasing problems in a sustainable way.
                </p>
              </div>
            </div>
          </div>

          {/* Page 3: Project Scope */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Project Scope</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                <tbody>
                  {[
                    ['Target Segment', 'Private Schools + Government Partnership'],
                    ['Location', 'Muscat & Ad Dakhiliyah'],
                    ['Year 1 Schools', '50 Schools'],
                    ['Avg. Students/School', '500 Students'],
                    ['Buses per School', '6 Buses'],
                    ['Gates per School', '2 Gates'],
                    ['Canteen per School', '1 Canteen'],
                  ].map(([label, value], i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f0f9ff' : 'white' }}>
                      <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#3b82f6' }}>{label}</td>
                      <td style={{ padding: '12px 15px', textAlign: 'right' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#1e293b' }}>
                Services Offered:
              </h3>
              <ol style={{ fontSize: '14px', paddingLeft: '20px' }}>
                <li style={{ marginBottom: '10px' }}>Annual Student Subscription (Bus, Gate, Canteen, Wallet, Grades tracking)</li>
                <li style={{ marginBottom: '10px' }}>Additional NFC Wristband Sales</li>
                <li style={{ marginBottom: '10px' }}>Private Label Stationery Store</li>
                <li style={{ marginBottom: '10px' }}>Internal Messaging System for Parent-Teacher-Admin Communication</li>
              </ol>
            </div>
          </div>

          {/* Page 4: Competitive Advantages */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Competitive Advantages</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b' }}>
              {[
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
              ].map(([title, desc], i) => (
                <div key={i} style={{ 
                  backgroundColor: '#f0fdf4', 
                  padding: '12px 15px', 
                  marginBottom: '8px', 
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ {title}</span>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Page 5: Financial Study - Revenue */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Financial Study - Revenue Projections</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>
                A) Annual Revenue - Private Schools Only (OMR)
              </h3>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Year</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Students</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Schools</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Student</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Bus</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>NFC</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Stationery</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['1', '25,000', '50', '625,000', '30,000', '42,500', '312,500', '1,010,000'],
                    ['2', '50,000', '100', '1,250,000', '60,000', '85,000', '625,000', '2,020,000'],
                    ['3', '100,000', '200', '2,500,000', '120,000', '170,000', '1,250,000', '4,040,000'],
                  ].map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                      {row.map((cell, j) => (
                        <td key={j} style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>
                B) Government + Private Schools Scenario (OMR)
              </h3>
              
              <ul style={{ fontSize: '14px', paddingLeft: '20px', marginBottom: '20px' }}>
                <li style={{ marginBottom: '8px' }}>Total Students: 242,000 (192,000 Government + 50,000 Private)</li>
                <li style={{ marginBottom: '8px' }}>Student Subscriptions: 6,050,000 OMR</li>
                <li style={{ marginBottom: '8px' }}>Bus Subscriptions: 290,400 OMR</li>
                <li style={{ marginBottom: '8px' }}>NFC Profit: 411,400 OMR</li>
                <li style={{ marginBottom: '8px' }}>Stationery Profit: 3,025,000 OMR</li>
              </ul>

              <div style={{ 
                backgroundColor: '#10b981', 
                color: 'white', 
                padding: '15px', 
                borderRadius: '8px', 
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                TOTAL REVENUE = 9,776,800 OMR
              </div>
            </div>
          </div>

          {/* Page 6: CAPEX & OPEX */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Capital & Operating Expenditure</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                Capital Expenditure (CAPEX)
              </h3>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Unit Price</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Total (OMR)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
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
                  ].map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>{row[0]}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row[1]}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold' }}>
                    <td colSpan={2} style={{ padding: '10px' }}>TOTAL CAPEX</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>329,500 OMR</td>
                  </tr>
                </tfoot>
              </table>

              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                Operating Expenses (OPEX)
              </h3>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Monthly</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Annual (OMR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: '#fffbeb' }}>
                    <td style={{ padding: '8px' }}>Staff Salaries + Manager</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>8,500</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>102,000</td>
                  </tr>
                  <tr style={{ backgroundColor: 'white' }}>
                    <td style={{ padding: '8px' }}>Office Rent</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>2,000</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>24,000</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f59e0b', color: 'white', fontWeight: 'bold' }}>
                    <td colSpan={2} style={{ padding: '10px' }}>TOTAL OPEX</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>126,000 OMR / Year</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Page 7: Cash Flow */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Cash Flow Analysis - Year 1</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b' }}>
              {[
                { label: 'Total Revenue', value: '1,010,000 OMR', color: '#10b981' },
                { label: 'CAPEX', value: '329,500 OMR', color: '#ef4444' },
                { label: 'OPEX', value: '126,000 OMR', color: '#f59e0b' },
                { label: 'Net Income Before Loan', value: '554,500 OMR', color: '#3b82f6' },
              ].map((item, i) => (
                <div key={i} style={{ 
                  backgroundColor: item.color, 
                  color: 'white', 
                  padding: '15px 20px', 
                  marginBottom: '15px', 
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '16px'
                }}>
                  <span>{item.label}</span>
                  <span style={{ fontWeight: 'bold' }}>{item.value}</span>
                </div>
              ))}

              <div style={{ 
                backgroundColor: '#f0fdf4', 
                padding: '25px', 
                borderRadius: '12px', 
                marginTop: '30px',
                border: '2px solid #10b981'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginBottom: '15px' }}>
                  Loan Coverage Analysis
                </h3>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>Requested Loan: 420,000 OMR</p>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>Year 1 Net Income: 554,500 OMR</p>
                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginTop: '15px' }}>
                  Coverage Ratio: 132% - LOAN FULLY COVERED IN YEAR 1
                </p>
              </div>
            </div>
          </div>

          {/* Page 8: Expansion Plan */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Future Expansion Plan</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b' }}>
              {[
                {
                  phase: 'Year 1 - Foundation',
                  items: ['50 Private Schools in Muscat & Ad Dakhiliyah', '25,000 Students', 'Establish brand presence'],
                  color: '#3b82f6'
                },
                {
                  phase: 'Year 2 - Growth',
                  items: ['Expand to 100+ Private Schools', 'Cover all major cities', '50,000 Students'],
                  color: '#10b981'
                },
                {
                  phase: 'Year 3 - Expansion',
                  items: ['Government school integration', 'GCC market entry', '100,000+ Students'],
                  color: '#f59e0b'
                },
              ].map((phase, i) => (
                <div key={i} style={{ 
                  backgroundColor: phase.color, 
                  color: 'white', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  marginBottom: '20px' 
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>{phase.phase}</h3>
                  <ul style={{ paddingLeft: '15px' }}>
                    {phase.items.map((item, j) => (
                      <li key={j} style={{ marginBottom: '6px' }}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Page 9: Risk Analysis */}
          <div style={{ ...pageStyle, backgroundColor: 'white' }}>
            <div style={headerStyle}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Risk Analysis & Mitigation</span>
              <img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            
            <div style={{ color: '#1e293b' }}>
              {[
                { risk: 'Low Subscription Rates', mitigation: 'Free 1-month trial for schools' },
                { risk: 'Payment Delays', mitigation: 'Binding contracts; service suspension' },
                { risk: 'Technical Failures', mitigation: '24/7 support and local servers' },
                { risk: 'Market Competition', mitigation: 'Unique features create differentiation' },
                { risk: 'Government Policy Changes', mitigation: 'Flexible adaptable business model' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: '#fef2f2', 
                    padding: '15px', 
                    borderRadius: '8px' 
                  }}>
                    <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold', marginBottom: '5px' }}>RISK:</p>
                    <p style={{ fontSize: '14px' }}>{item.risk}</p>
                  </div>
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: '#f0fdf4', 
                    padding: '15px', 
                    borderRadius: '8px' 
                  }}>
                    <p style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold', marginBottom: '5px' }}>MITIGATION:</p>
                    <p style={{ fontSize: '14px' }}>{item.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Page 10: Conclusion */}
          <div style={{
            ...pageStyle,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            color: 'white',
            pageBreakAfter: 'avoid',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <img src={logoImage} alt="TalebEdu Logo" style={{ width: '80px', height: '80px', marginBottom: '20px' }} />
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>Conclusion & Recommendation</h1>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              {[
                'TalebEdu is an innovative and unique project in Oman',
                'Capable of generating stable income covering the loan',
                'Loan of 420,000 OMR recoverable within 3 years',
                'Strong potential for local and international expansion',
                'First-mover advantage in smart school management',
                'Sustainable recurring revenue model'
              ].map((point, i) => (
                <p key={i} style={{ fontSize: '16px', marginBottom: '12px', paddingLeft: '20px' }}>
                  ✓ {point}
                </p>
              ))}
            </div>

            <div style={{ 
              backgroundColor: '#10b981', 
              padding: '25px', 
              borderRadius: '12px', 
              textAlign: 'center',
              marginBottom: '40px'
            }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>RECOMMENDATION</h2>
              <p style={{ fontSize: '16px' }}>
                Approve the project financing to support this integrated educational and digital security solution.
              </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <p style={{ fontSize: '14px' }}>TalebEdu - Mazen Khanfar</p>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '10px' }}>Muscat, Sultanate of Oman - 2026</p>
            </div>
          </div>
        </div>
      </div>

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
          <p>TalebEdu - مازن خنفر</p>
          <p className="mt-2">مسقط، سلطنة عمان - 2026</p>
        </motion.div>
      </div>
    </div>
  );
};

export default FeasibilityStudy;
