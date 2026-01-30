import { useState, useRef, useEffect } from "react";
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
  Award,
  Phone,
} from "lucide-react";
import html2pdf from "html2pdf.js";
import talebEduBlueLogo from "@/assets/talebedu-app-icon.jpg";

const PHONE_NUMBER = "+968 9656 4540";

const FeasibilityStudy = () => {
  const [isGeneratingEn, setIsGeneratingEn] = useState(false);
  const [isGeneratingAr, setIsGeneratingAr] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>("");
  const arabicPdfRef = useRef<HTMLDivElement>(null);
  const englishPdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await fetch(talebEduBlueLogo);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result as string);
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Failed to load logo:", error);
      }
    };
    loadLogo();
  }, []);

  const generatePDF = async (
    ref: React.RefObject<HTMLDivElement>,
    filename: string,
    setLoading: (v: boolean) => void
  ) => {
    if (!ref.current) return;
    setLoading(true);
    let container: HTMLDivElement | null = null;

    try {
      container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "0";
      container.style.top = "0";
      container.style.width = "210mm";
      container.style.zIndex = "999999";
      container.style.background = "white";
      container.style.overflow = "visible";

      const clone = ref.current.cloneNode(true) as HTMLDivElement;
      clone.style.width = "210mm";
      clone.style.background = "white";
      container.appendChild(clone);
      document.body.appendChild(container);

      const images = Array.from(container.querySelectorAll("img")) as HTMLImageElement[];
      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) return resolve();
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
        )
      );

      await new Promise((r) => setTimeout(r, 300));

      const opt = {
        margin: 0,
        filename,
        image: { type: "png" as const, quality: 1 },
        html2canvas: {
          scale: 3,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
          windowWidth: 794,
          windowHeight: 1123,
        },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
        pagebreak: { mode: ["css"] as const },
      };

      await html2pdf().set(opt).from(clone).save();
      if (container.parentNode) container.parentNode.removeChild(container);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setLoading(false);
      if (container?.parentNode) container.parentNode.removeChild(container);
    }
  };

  const generateEnglishPDF = () =>
    generatePDF(englishPdfRef, "TalebEdu_Feasibility_Study_EN_2026.pdf", setIsGeneratingEn);

  const generateArabicPDF = () =>
    generatePDF(arabicPdfRef, "TalebEdu_Feasibility_Study_AR_2026.pdf", setIsGeneratingAr);

  const pageStyle: React.CSSProperties = {
    width: "210mm",
    height: "297mm",
    padding: "15mm",
    boxSizing: "border-box",
    pageBreakAfter: "always",
    overflow: "hidden",
    backgroundColor: "white",
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: "#0f172a",
    color: "white",
    padding: "15px 20px",
    marginBottom: "20px",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const GlowingTitle = ({ size = "48px" }: { size?: string }) => (
    <div style={{ textAlign: "center", marginBottom: "10px", direction: "ltr" }}>
      <span
        style={{
          fontSize: size,
          fontWeight: "bold",
          background: "linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textShadow: "0 0 30px rgba(59, 130, 246, 0.5)",
          letterSpacing: "2px",
        }}
      >
        TalebEdu
      </span>
    </div>
  );

  const LogoImage = ({ size = "100px", style = {} }: { size?: string; style?: React.CSSProperties }) => (
    <img
      src={logoBase64 || talebEduBlueLogo}
      alt="TalebEdu Logo"
      crossOrigin="anonymous"
      style={{
        width: size,
        height: size,
        borderRadius: "20%",
        boxShadow: "0 4px 20px rgba(59, 130, 246, 0.3)",
        ...style,
      }}
    />
  );

  const HeaderLogo = () => (
    <img
      src={logoBase64 || talebEduBlueLogo}
      alt="Logo"
      crossOrigin="anonymous"
      style={{ width: "40px", height: "40px", borderRadius: "8px" }}
    />
  );

  return (
    <div className="h-[100dvh] overflow-y-auto overscroll-none" style={{ WebkitOverflowScrolling: 'touch' }}>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" dir="rtl">
      {/* Hidden Arabic PDF Content */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, overflow: "hidden" }}>
        <div ref={arabicPdfRef} dir="rtl" style={{ fontFamily: "Geeza Pro, Noto Naskh Arabic, Arial, sans-serif", backgroundColor: "white" }}>
          {/* Cover Page */}
          <div
            style={{
              ...pageStyle,
              background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              textAlign: "center",
            }}
          >
            <LogoImage size="120px" style={{ marginBottom: "30px" }} />
            <GlowingTitle size="52px" />
            <h2 style={{ fontSize: "28px", marginBottom: "20px", color: "#60a5fa" }}>دراسة جدوى</h2>
            <p style={{ fontSize: "16px", marginBottom: "10px" }}>تطبيق شامل لإدارة المدارس</p>
            <p style={{ fontSize: "14px", color: "#94a3b8" }}>المحفظة الإلكترونية | البوابات الذكية | المتجر الرقمي</p>

            <div
              style={{
                backgroundColor: "#3b82f6",
                padding: "20px 40px",
                borderRadius: "12px",
                marginTop: "40px",
                marginBottom: "40px",
              }}
            >
              <p style={{ fontSize: "14px", marginBottom: "5px" }}>مقدم إلى</p>
              <p style={{ fontSize: "20px", fontWeight: "bold" }}>بنك التنمية العماني</p>
            </div>

            <p style={{ fontSize: "14px" }}>مقدم من: مازن خنفر - TalebEdu</p>
            <p style={{ fontSize: "14px", marginTop: "10px" }}>هاتف: <span style={{ direction: "ltr", unicodeBidi: "plaintext", display: "inline-block" }}>{PHONE_NUMBER}</span></p>
            <p style={{ fontSize: "14px", marginTop: "10px" }}>السنة: 2026</p>
            <p style={{ fontSize: "14px", marginTop: "20px", color: "#94a3b8" }}>مسقط، سلطنة عمان</p>
          </div>

          {/* Page 2: Executive Summary */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>الملخص التنفيذي</span>
              <HeaderLogo />
            </div>

            <div style={{ color: "#1e293b", lineHeight: "1.8" }}>
              <p style={{ fontSize: "16px", fontWeight: "bold", color: "#3b82f6", marginBottom: "15px" }}>
                TalebEdu هو التطبيق الوحيد في العالم الذي يجمع في منصة واحدة:
              </p>

              <ul style={{ fontSize: "14px", paddingRight: "20px", marginBottom: "20px" }}>
                <li style={{ marginBottom: "8px" }}>✓ إدارة المدرسة: الحضور، الدرجات، الواجبات، الجداول</li>
                <li style={{ marginBottom: "8px" }}>✓ إدارة الباصات: 6 باصات كحد أدنى لكل مدرسة مع تتبع مباشر</li>
                <li style={{ marginBottom: "8px" }}>✓ البوابات الذكية والمقصف بتقنية NFC</li>
                <li style={{ marginBottom: "8px" }}>✓ المحفظة الإلكترونية للطلاب</li>
                <li style={{ marginBottom: "8px" }}>✓ المتجر الرقمي: أساور NFC + قرطاسية بعلامة تجارية خاصة</li>
                <li style={{ marginBottom: "8px" }}>✓ نظام تواصل متكامل: رسائل، مكالمات صوتية ومرئية، مشاركة ملفات</li>
              </ul>

              <p style={{ fontSize: "16px", fontWeight: "bold", color: "#10b981", marginBottom: "15px" }}>المزايا الفريدة:</p>

              <ul style={{ fontSize: "14px", paddingRight: "20px", marginBottom: "20px" }}>
                <li style={{ marginBottom: "8px" }}>✓ السوار الذكي: مقاوم لجميع العوامل عدا النار، لا يحتاج شحن</li>
                <li style={{ marginBottom: "8px" }}>✓ دعم متعدد اللغات: العربية، الإنجليزية، الهندية</li>
                <li style={{ marginBottom: "8px" }}>✓ أمان كامل للطلاب وأولياء الأمور</li>
                <li style={{ marginBottom: "8px" }}>✓ قابلية التوسع المحلي والدولي (دول الخليج في السنة 3)</li>
                <li style={{ marginBottom: "8px" }}>✓ إدارة مالية متكاملة: جميع الاشتراكات عبر المحفظة</li>
              </ul>

              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  padding: "15px",
                  borderRadius: "8px",
                  borderRight: "4px solid #10b981",
                }}
              >
                <p style={{ fontSize: "14px", fontWeight: "bold", color: "#166534" }}>هدف المشروع:</p>
                <p style={{ fontSize: "14px", color: "#166534" }}>
                  إنشاء منصة موثوقة وشاملة لحل مشاكل إدارة المدارس والأمان والتواصل والشراء الرقمي بطريقة مستدامة.
                </p>
              </div>
            </div>
          </div>

          {/* Page 3: Project Scope */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>نطاق المشروع</span>
              <HeaderLogo />
            </div>

            <div style={{ color: "#1e293b" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
                <tbody>
                  {[
                    ["الشريحة المستهدفة", "المدارس الخاصة + شراكة حكومية"],
                    ["الموقع", "مسقط والداخلية"],
                    ["مدارس السنة الأولى", "50 مدرسة"],
                    ["متوسط الطلاب لكل مدرسة", "500 طالب"],
                    ["الباصات لكل مدرسة", "6 باصات"],
                    ["البوابات لكل مدرسة", "بوابتان"],
                    ["المقصف لكل مدرسة", "مقصف واحد"],
                  ].map(([label, value], i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f0f9ff" : "white" }}>
                      <td style={{ padding: "12px 15px", fontWeight: "bold", color: "#3b82f6" }}>{label}</td>
                      <td style={{ padding: "12px 15px", textAlign: "left" }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px", color: "#1e293b" }}>الخدمات المقدمة:</h3>
              <ol style={{ fontSize: "14px", paddingRight: "20px" }}>
                <li style={{ marginBottom: "10px" }}>اشتراك سنوي للطالب (الباص، البوابة، المقصف، المحفظة، متابعة الدرجات)</li>
                <li style={{ marginBottom: "10px" }}>بيع أساور NFC إضافية</li>
                <li style={{ marginBottom: "10px" }}>متجر قرطاسية بعلامة تجارية خاصة</li>
                <li style={{ marginBottom: "10px" }}>نظام مراسلة داخلي للتواصل بين الأهل والمعلمين والإدارة</li>
              </ol>
            </div>
          </div>

          {/* Page 4: Competitive Advantages */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>المزايا التنافسية</span>
              <HeaderLogo />
            </div>

            <div style={{ color: "#1e293b" }}>
              {[
                ["تقنية السوار الذكي", "لا يحتاج شحن أو صيانة"],
                ["متابعة شاملة", "الدرجات، الواجبات، الحضور في مكان واحد"],
                ["تحكم الوالدين", "الأهل يتحكمون في مشتريات المقصف والحدود"],
                ["تواصل متكامل", "رسائل، مكالمات صوتية/مرئية، مشاركة ملفات"],
                ["سوق رقمي", "أساور + قرطاسية بعلامة تجارية خاصة"],
                ["دعم متعدد اللغات", "العربية، الإنجليزية، الهندية"],
                ["جاهز للتوسع الخليجي", "بنية قابلة للتوسع إقليمياً"],
                ["أمان كامل للطلاب", "تتبع مباشر ودخول آمن"],
                ["الأول في عمان", "السوار الذكي كهوية مدرسية رقمية"],
                ["رائد المحفظة الإلكترونية", "مصروف الطالب عبر السوار"],
                ["نظام دفع مباشر", "الرسوم تُدفع مباشرة عبر المحفظة"],
              ].map(([title, desc], i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#f0fdf4",
                    padding: "12px 15px",
                    marginBottom: "8px",
                    borderRadius: "6px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#10b981", fontWeight: "bold" }}>✓ {title}</span>
                  <span style={{ color: "#6b7280", fontSize: "13px" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Page 5: Financial Study - Revenue */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>الدراسة المالية - الإيرادات</span>
              <HeaderLogo />
            </div>

            <div style={{ color: "#1e293b" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px" }}>
                أ) الإيرادات السنوية - المدارس الخاصة فقط (ر.ع)
              </h3>

              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#3b82f6", color: "white" }}>
                    <th style={{ padding: "10px", textAlign: "center" }}>السنة</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>الطلاب</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>المدارس</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>اشتراك الطالب</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>الباصات</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>NFC</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>القرطاسية</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["1", "25,000", "50", "625,000", "30,000", "42,500", "312,500", "1,010,000"],
                    ["2", "50,000", "100", "1,250,000", "60,000", "85,000", "625,000", "2,020,000"],
                    ["3", "100,000", "200", "2,500,000", "120,000", "170,000", "1,250,000", "4,040,000"],
                  ].map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f8fafc" : "white" }}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          style={{
                            padding: "8px",
                            textAlign: "center",
                            borderBottom: "1px solid #e2e8f0",
                            fontWeight: j === 0 || j === row.length - 1 ? "bold" : "normal",
                          }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div
                style={{
                  backgroundColor: "#eff6ff",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                <p style={{ fontSize: "14px", fontWeight: "bold", color: "#1e40af", marginBottom: "8px" }}>ملاحظات:</p>
                <ul style={{ fontSize: "13px", color: "#1e40af", paddingRight: "15px" }}>
                  <li>اشتراك الطالب: 25 ر.ع سنوياً</li>
                  <li>رسوم الباص: 100 ر.ع لكل باص سنوياً</li>
                  <li>سوار NFC: 1.7 ر.ع للقطعة (سعر البيع)</li>
                  <li>القرطاسية: 12.5 ر.ع متوسط إنفاق الطالب سنوياً</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Page 6: Financial Study - Costs */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>الدراسة المالية - التكاليف</span>
              <HeaderLogo />
            </div>

            <div style={{ color: "#1e293b" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px" }}>ب) التكاليف التأسيسية CAPEX (ر.ع)</h3>

              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px", fontSize: "13px" }}>
                <tbody>
                  {[
                    ["تطوير التطبيق والمنصة", "50,000"],
                    ["الخوادم والبنية التحتية", "30,000"],
                    ["أجهزة NFC وقارئات", "80,000"],
                    ["مخزون أساور NFC", "42,500"],
                    ["مخزون القرطاسية", "100,000"],
                    ["تجهيز المكتب", "20,000"],
                    ["السيارات والتسويق", "50,000"],
                    ["احتياطي وطوارئ", "47,500"],
                    ["الإجمالي", "420,000"],
                  ].map(([label, value], i) => (
                    <tr
                      key={i}
                      style={{
                        backgroundColor: i === 8 ? "#3b82f6" : i % 2 === 0 ? "#f8fafc" : "white",
                        color: i === 8 ? "white" : "#1e293b",
                      }}
                    >
                      <td style={{ padding: "12px 15px", fontWeight: i === 8 ? "bold" : "normal" }}>{label}</td>
                      <td style={{ padding: "12px 15px", textAlign: "left", fontWeight: "bold" }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px" }}>ج) التكاليف التشغيلية OPEX (ر.ع/سنة)</h3>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#10b981", color: "white" }}>
                    <th style={{ padding: "10px" }}>البند</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>السنة 1</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>السنة 2</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>السنة 3</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["الرواتب", "180,000", "250,000", "350,000"],
                    ["الخوادم", "24,000", "36,000", "48,000"],
                    ["التسويق", "50,000", "75,000", "100,000"],
                    ["تكلفة الأساور", "25,500", "51,000", "102,000"],
                    ["تكلفة القرطاسية", "187,500", "375,000", "750,000"],
                    ["مصاريف إدارية", "30,000", "40,000", "50,000"],
                    ["الإجمالي", "497,000", "827,000", "1,400,000"],
                  ].map((row, i) => (
                    <tr
                      key={i}
                      style={{
                        backgroundColor: i === 6 ? "#10b981" : i % 2 === 0 ? "#f0fdf4" : "white",
                        color: i === 6 ? "white" : "#1e293b",
                      }}
                    >
                      <td style={{ padding: "10px", fontWeight: i === 6 ? "bold" : "normal" }}>{row[0]}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>{row[1]}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>{row[2]}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Page 7: Profitability */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>الربحية والتدفق النقدي</span>
              <HeaderLogo />
            </div>

            <div style={{ color: "#1e293b" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", fontSize: "14px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#8b5cf6", color: "white" }}>
                    <th style={{ padding: "12px" }}>البند</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>السنة 1</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>السنة 2</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>السنة 3</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["الإيرادات", "1,010,000", "2,020,000", "4,040,000"],
                    ["التكاليف التشغيلية", "497,000", "827,000", "1,400,000"],
                    ["صافي الربح", "513,000", "1,193,000", "2,640,000"],
                    ["هامش الربح", "50.8%", "59.1%", "65.3%"],
                  ].map((row, i) => (
                    <tr
                      key={i}
                      style={{
                        backgroundColor: i === 2 ? "#f0fdf4" : i === 3 ? "#eff6ff" : i % 2 === 0 ? "#faf5ff" : "white",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px",
                          fontWeight: i === 2 || i === 3 ? "bold" : "normal",
                          color: i === 2 ? "#10b981" : i === 3 ? "#3b82f6" : "#1e293b",
                        }}
                      >
                        {row[0]}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{row[1]}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{row[2]}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div
                style={{
                  backgroundColor: "#fef3c7",
                  padding: "20px",
                  borderRadius: "12px",
                  borderRight: "4px solid #f59e0b",
                }}
              >
                <h4 style={{ fontSize: "16px", fontWeight: "bold", color: "#92400e", marginBottom: "10px" }}>
                  إجمالي الأرباح خلال 3 سنوات:
                </h4>
                <p style={{ fontSize: "24px", fontWeight: "bold", color: "#92400e" }}>4,346,000 ر.ع</p>
                <p style={{ fontSize: "14px", color: "#92400e", marginTop: "10px" }}>
                  (بعد خصم جميع التكاليف التشغيلية)
                </p>
              </div>
            </div>
          </div>

          {/* Page 8: Loan Repayment */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>سيناريو سداد القرض</span>
              <HeaderLogo />
            </div>

            <div style={{ color: "#1e293b" }}>
              <div
                style={{
                  backgroundColor: "#eff6ff",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "30px",
                }}
              >
                <h4 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e40af", marginBottom: "15px" }}>
                  تفاصيل القرض المطلوب:
                </h4>
                <table style={{ width: "100%", fontSize: "14px" }}>
                  <tbody>
                    {[
                      ["مبلغ القرض", "420,000 ر.ع"],
                      ["مدة السداد", "3 سنوات"],
                      ["نسبة الفائدة المفترضة", "5%"],
                      ["القسط السنوي", "154,000 ر.ع تقريباً"],
                    ].map(([label, value], i) => (
                      <tr key={i}>
                        <td style={{ padding: "8px 0", fontWeight: "bold" }}>{label}</td>
                        <td style={{ padding: "8px 0", textAlign: "left" }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px" }}>جدول السداد:</h3>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#3b82f6", color: "white" }}>
                    <th style={{ padding: "10px" }}>السنة</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>صافي الربح</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>القسط</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>المتبقي بعد السداد</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["1", "513,000", "154,000", "359,000"],
                    ["2", "1,193,000", "154,000", "1,039,000"],
                    ["3", "2,640,000", "154,000", "2,486,000"],
                  ].map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f8fafc" : "white" }}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          style={{
                            padding: "10px",
                            textAlign: "center",
                            fontWeight: j === 3 ? "bold" : "normal",
                            color: j === 3 ? "#10b981" : "#1e293b",
                          }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  padding: "15px",
                  borderRadius: "8px",
                  marginTop: "20px",
                }}
              >
                <p style={{ fontSize: "14px", color: "#166534" }}>
                  ✓ القدرة على سداد القرض بالكامل من أرباح السنة الأولى فقط
                </p>
              </div>
            </div>
          </div>

          {/* Page 9: Risk Analysis */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>تحليل المخاطر والتخفيف</span>
              <HeaderLogo />
            </div>

            <div style={{ color: "#1e293b" }}>
              {[
                {
                  risk: "تأخر اعتماد المدارس",
                  mitigation: "برنامج تجريبي مجاني + شراكات استراتيجية مع وزارة التربية",
                  color: "#fef3c7",
                },
                {
                  risk: "منافسة جديدة",
                  mitigation: "ميزة الريادة + تكنولوجيا السوار الفريدة + عقود طويلة الأمد",
                  color: "#fee2e2",
                },
                {
                  risk: "أعطال تقنية",
                  mitigation: "فريق دعم 24/7 + خوادم احتياطية + نظام offline",
                  color: "#e0e7ff",
                },
                {
                  risk: "تغير الأسعار",
                  mitigation: "عقود مع الموردين + تنويع المصادر + مخزون استراتيجي",
                  color: "#d1fae5",
                },
                {
                  risk: "تغيرات تنظيمية",
                  mitigation: "التزام كامل بمعايير الخصوصية + شراكة مع الجهات الحكومية",
                  color: "#fce7f3",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: item.color,
                    padding: "15px",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "5px" }}>⚠️ {item.risk}</p>
                  <p style={{ fontSize: "13px" }}>التخفيف: {item.mitigation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Page 10: Conclusion */}
          <div
            style={{
              ...pageStyle,
              background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
              color: "white",
              pageBreakAfter: "avoid",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <LogoImage size="80px" style={{ marginBottom: "20px" }} />
              <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "10px" }}>الخلاصة والتوصية</h1>
            </div>

            <div style={{ marginBottom: "30px" }}>
              {[
                "TalebEdu مشروع مبتكر وفريد في عمان",
                "قادر على توليد دخل مستقر يغطي القرض",
                "قرض 420,000 ر.ع قابل للاسترداد خلال 3 سنوات",
                "إمكانية قوية للتوسع محلياً ودولياً",
                "ميزة الريادة في إدارة المدارس الذكية",
                "نموذج إيرادات مستدام ومتكرر",
              ].map((point, i) => (
                <p key={i} style={{ fontSize: "16px", marginBottom: "12px", paddingRight: "20px" }}>
                  ✓ {point}
                </p>
              ))}
            </div>

            <div
              style={{
                backgroundColor: "#10b981",
                padding: "25px",
                borderRadius: "12px",
                textAlign: "center",
                marginBottom: "40px",
              }}
            >
              <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "15px" }}>التوصية</h2>
              <p style={{ fontSize: "16px" }}>الموافقة على تمويل المشروع لدعم هذا الحل التعليمي والأمني الرقمي المتكامل</p>
            </div>

            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <GlowingTitle size="32px" />
              <p style={{ fontSize: "14px", marginTop: "15px" }}>مازن خنفر</p>
              <p style={{ fontSize: "14px", marginTop: "8px" }}>هاتف: <span style={{ direction: "ltr", unicodeBidi: "plaintext", display: "inline-block" }}>{PHONE_NUMBER}</span></p>
              <p style={{ fontSize: "14px", color: "#94a3b8", marginTop: "10px" }}>مسقط، سلطنة عمان - 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden English PDF Content */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, overflow: "hidden" }}>
        <div ref={englishPdfRef} dir="ltr" style={{ fontFamily: "Arial, sans-serif", backgroundColor: "white" }}>
          {/* Cover Page */}
          <div
            style={{
              ...pageStyle,
              background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              textAlign: "center",
            }}
          >
            <LogoImage size="120px" style={{ marginBottom: "30px" }} />
            <GlowingTitle size="52px" />
            <h2 style={{ fontSize: "28px", marginBottom: "20px", color: "#60a5fa" }}>Feasibility Study</h2>
            <p style={{ fontSize: "16px", marginBottom: "10px" }}>Comprehensive School Management Application</p>
            <p style={{ fontSize: "14px", color: "#94a3b8" }}>Electronic Wallet | Smart Gates | Digital Stores</p>

            <div
              style={{
                backgroundColor: "#3b82f6",
                padding: "20px 40px",
                borderRadius: "12px",
                marginTop: "40px",
                marginBottom: "40px",
              }}
            >
              <p style={{ fontSize: "14px", marginBottom: "5px" }}>Submitted to</p>
              <p style={{ fontSize: "20px", fontWeight: "bold" }}>Oman Development Bank</p>
            </div>

            <p style={{ fontSize: "14px" }}>Submitted by: Mazen Khanfar - TalebEdu</p>
            <p style={{ fontSize: "14px", marginTop: "10px" }}>Phone: {PHONE_NUMBER}</p>
            <p style={{ fontSize: "14px", marginTop: "10px" }}>Year: 2026</p>
            <p style={{ fontSize: "14px", marginTop: "20px", color: "#94a3b8" }}>Muscat, Sultanate of Oman</p>
          </div>

          {/* Page 2-10: English versions (abbreviated for size) */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <HeaderLogo />
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>Executive Summary</span>
            </div>
            <div style={{ color: "#1e293b", lineHeight: "1.8" }}>
              <p style={{ fontSize: "16px", fontWeight: "bold", color: "#3b82f6", marginBottom: "15px" }}>
                TalebEdu is the ONLY application in the world combining:
              </p>
              <ul style={{ fontSize: "14px", paddingLeft: "20px", marginBottom: "20px" }}>
                <li style={{ marginBottom: "8px" }}>✓ School Management: Attendance, Grades, Homework, Schedules</li>
                <li style={{ marginBottom: "8px" }}>✓ Bus Management: 6+ buses per school with real-time tracking</li>
                <li style={{ marginBottom: "8px" }}>✓ Smart Gates & Canteen with NFC technology</li>
                <li style={{ marginBottom: "8px" }}>✓ Electronic Wallet for students</li>
                <li style={{ marginBottom: "8px" }}>✓ Digital Store: NFC wristbands + Private Label stationery</li>
                <li style={{ marginBottom: "8px" }}>✓ Integrated Communication: Messages, Voice/Video calls</li>
              </ul>
              <div style={{ backgroundColor: "#f0fdf4", padding: "15px", borderRadius: "8px", borderLeft: "4px solid #10b981" }}>
                <p style={{ fontSize: "14px", fontWeight: "bold", color: "#166534" }}>Project Goal:</p>
                <p style={{ fontSize: "14px", color: "#166534" }}>
                  Create a reliable platform solving school management, security, and digital purchasing sustainably.
                </p>
              </div>
            </div>
          </div>

          {/* Page 3 */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <HeaderLogo />
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>Project Scope</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
              <tbody>
                {[
                  ["Target Segment", "Private Schools + Government Partnership"],
                  ["Location", "Muscat & Dakhiliyah"],
                  ["Year 1 Schools", "50 schools"],
                  ["Avg Students/School", "500 students"],
                  ["Buses per School", "6 buses"],
                  ["Gates per School", "2 gates"],
                ].map(([label, value], i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f0f9ff" : "white" }}>
                    <td style={{ padding: "12px 15px", fontWeight: "bold", color: "#3b82f6" }}>{label}</td>
                    <td style={{ padding: "12px 15px" }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Page 4 */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <HeaderLogo />
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>Competitive Advantages</span>
            </div>
            {[
              ["Smart Wristband Tech", "No charging or maintenance needed"],
              ["Comprehensive Tracking", "Grades, homework, attendance in one place"],
              ["Parental Control", "Parents control canteen purchases & limits"],
              ["Integrated Messaging", "Messages, voice/video calls, file sharing"],
              ["Digital Marketplace", "Wristbands + private label stationery"],
              ["Multi-language Support", "Arabic, English, Hindi"],
              ["GCC Expansion Ready", "Scalable regional infrastructure"],
            ].map(([title, desc], i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#f0fdf4",
                  padding: "12px 15px",
                  marginBottom: "8px",
                  borderRadius: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "#10b981", fontWeight: "bold" }}>✓ {title}</span>
                <span style={{ color: "#6b7280", fontSize: "13px" }}>{desc}</span>
              </div>
            ))}
          </div>

          {/* Page 5 */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <HeaderLogo />
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>Financial Study - Revenue</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px", fontSize: "12px" }}>
              <thead>
                <tr style={{ backgroundColor: "#3b82f6", color: "white" }}>
                  <th style={{ padding: "10px" }}>Year</th>
                  <th style={{ padding: "10px" }}>Students</th>
                  <th style={{ padding: "10px" }}>Schools</th>
                  <th style={{ padding: "10px" }}>Subscriptions</th>
                  <th style={{ padding: "10px" }}>Buses</th>
                  <th style={{ padding: "10px" }}>NFC</th>
                  <th style={{ padding: "10px" }}>Stationery</th>
                  <th style={{ padding: "10px" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["1", "25,000", "50", "625,000", "30,000", "42,500", "312,500", "1,010,000"],
                  ["2", "50,000", "100", "1,250,000", "60,000", "85,000", "625,000", "2,020,000"],
                  ["3", "100,000", "200", "2,500,000", "120,000", "170,000", "1,250,000", "4,040,000"],
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f8fafc" : "white" }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Page 6 */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <HeaderLogo />
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>Financial Study - Costs</span>
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px", color: "#1e293b" }}>CAPEX (OMR)</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px", fontSize: "13px" }}>
              <tbody>
                {[
                  ["App & Platform Development", "50,000"],
                  ["Servers & Infrastructure", "30,000"],
                  ["NFC Devices & Readers", "80,000"],
                  ["NFC Wristband Inventory", "42,500"],
                  ["Stationery Inventory", "100,000"],
                  ["Office Setup", "20,000"],
                  ["Vehicles & Marketing", "50,000"],
                  ["Contingency Reserve", "47,500"],
                  ["Total", "420,000"],
                ].map(([label, value], i) => (
                  <tr
                    key={i}
                    style={{
                      backgroundColor: i === 8 ? "#3b82f6" : i % 2 === 0 ? "#f8fafc" : "white",
                      color: i === 8 ? "white" : "#1e293b",
                    }}
                  >
                    <td style={{ padding: "12px 15px", fontWeight: i === 8 ? "bold" : "normal" }}>{label}</td>
                    <td style={{ padding: "12px 15px", fontWeight: "bold" }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Page 7 */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <HeaderLogo />
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>Profitability & Cash Flow</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "#8b5cf6", color: "white" }}>
                  <th style={{ padding: "12px" }}>Item</th>
                  <th style={{ padding: "12px" }}>Year 1</th>
                  <th style={{ padding: "12px" }}>Year 2</th>
                  <th style={{ padding: "12px" }}>Year 3</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Revenue", "1,010,000", "2,020,000", "4,040,000"],
                  ["Operating Costs", "497,000", "827,000", "1,400,000"],
                  ["Net Profit", "513,000", "1,193,000", "2,640,000"],
                  ["Profit Margin", "50.8%", "59.1%", "65.3%"],
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#faf5ff" : "white" }}>
                    <td style={{ padding: "12px", fontWeight: i >= 2 ? "bold" : "normal" }}>{row[0]}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{row[1]}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{row[2]}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ backgroundColor: "#fef3c7", padding: "20px", borderRadius: "12px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "bold", color: "#92400e" }}>Total 3-Year Profit:</h4>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#92400e" }}>4,346,000 OMR</p>
            </div>
          </div>

          {/* Page 8 */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <HeaderLogo />
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>Loan Repayment Scenario</span>
            </div>
            <div style={{ backgroundColor: "#eff6ff", padding: "20px", borderRadius: "12px", marginBottom: "30px" }}>
              <h4 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e40af", marginBottom: "15px" }}>Loan Details:</h4>
              <table style={{ width: "100%", fontSize: "14px" }}>
                <tbody>
                  {[
                    ["Loan Amount", "420,000 OMR"],
                    ["Repayment Period", "3 years"],
                    ["Interest Rate", "5%"],
                    ["Annual Payment", "~154,000 OMR"],
                  ].map(([label, value], i) => (
                    <tr key={i}>
                      <td style={{ padding: "8px 0", fontWeight: "bold" }}>{label}</td>
                      <td style={{ padding: "8px 0" }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Page 9 */}
          <div style={{ ...pageStyle, backgroundColor: "white" }}>
            <div style={headerStyle}>
              <HeaderLogo />
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>Risk Analysis & Mitigation</span>
            </div>
            {[
              { risk: "Delayed School Adoption", mitigation: "Free pilot program + strategic partnerships", color: "#fef3c7" },
              { risk: "New Competition", mitigation: "First-mover advantage + unique wristband tech", color: "#fee2e2" },
              { risk: "Technical Failures", mitigation: "24/7 support + backup servers + offline mode", color: "#e0e7ff" },
              { risk: "Price Changes", mitigation: "Supplier contracts + diversified sources", color: "#d1fae5" },
              { risk: "Regulatory Changes", mitigation: "Privacy compliance + government partnerships", color: "#fce7f3" },
            ].map((item, i) => (
              <div key={i} style={{ backgroundColor: item.color, padding: "15px", borderRadius: "8px", marginBottom: "12px" }}>
                <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "5px" }}>⚠️ {item.risk}</p>
                <p style={{ fontSize: "13px" }}>Mitigation: {item.mitigation}</p>
              </div>
            ))}
          </div>

          {/* Page 10 */}
          <div
            style={{
              ...pageStyle,
              background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
              color: "white",
              pageBreakAfter: "avoid",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <LogoImage size="80px" style={{ marginBottom: "20px" }} />
              <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "10px" }}>Conclusion & Recommendation</h1>
            </div>
            <div style={{ marginBottom: "30px" }}>
              {[
                "TalebEdu is an innovative and unique project in Oman",
                "Capable of generating stable income covering the loan",
                "420,000 OMR loan recoverable within 3 years",
                "Strong potential for local and international expansion",
                "First-mover advantage in smart school management",
                "Sustainable recurring revenue model",
              ].map((point, i) => (
                <p key={i} style={{ fontSize: "16px", marginBottom: "12px", paddingLeft: "20px" }}>
                  ✓ {point}
                </p>
              ))}
            </div>
            <div
              style={{
                backgroundColor: "#10b981",
                padding: "25px",
                borderRadius: "12px",
                textAlign: "center",
                marginBottom: "40px",
              }}
            >
              <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "15px" }}>Recommendation</h2>
              <p style={{ fontSize: "16px" }}>Approve project funding to support this comprehensive educational and security solution</p>
            </div>
            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <GlowingTitle size="32px" />
              <p style={{ fontSize: "14px", marginTop: "15px" }}>Mazen Khanfar</p>
              <p style={{ fontSize: "14px", marginTop: "8px" }}>Phone: {PHONE_NUMBER}</p>
              <p style={{ fontSize: "14px", color: "#94a3b8", marginTop: "10px" }}>Muscat, Sultanate of Oman - 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Visible Page Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img src={talebEduBlueLogo} alt="TalebEdu" className="w-24 h-24 rounded-2xl shadow-lg" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">دراسة جدوى TalebEdu</h1>
          <p className="text-xl text-blue-200">تطبيق إدارة المدارس الذكية الشامل</p>
        </motion.div>

        {/* Key Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Users, title: "100,000 طالب", subtitle: "بحلول السنة الثالثة" },
            { icon: TrendingUp, title: "4.3 مليون ر.ع", subtitle: "إجمالي الأرباح" },
            { icon: Shield, title: "أول تطبيق", subtitle: "في سلطنة عمان" },
          ].map((item, i) => (
            <Card key={i} className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center">
              <item.icon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white">{item.title}</h3>
              <p className="text-blue-200">{item.subtitle}</p>
            </Card>
          ))}
        </div>

        {/* Features */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles className="text-yellow-400" />
            المميزات الفريدة
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "السوار الذكي - لا يحتاج شحن",
              "البوابات الذكية بتقنية NFC",
              "تتبع الباصات المباشر",
              "المحفظة الإلكترونية",
              "متجر القرطاسية الرقمي",
              "نظام التواصل المتكامل",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="text-green-400 flex-shrink-0" />
                <span className="text-white">{feature}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Print View Button */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Button
            onClick={() => window.location.href = "/feasibility-print"}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
            size="lg"
          >
            <FileText className="w-5 h-5 ml-2" />
            عرض للطباعة (A4)
          </Button>
        </motion.div>

        {/* Download Buttons */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={generateArabicPDF}
            disabled={isGeneratingAr || !logoBase64}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
            size="lg"
          >
            {isGeneratingAr ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                جاري الإنشاء...
              </div>
            ) : (
              <>
                <Download className="w-5 h-5 ml-2" />
                تحميل النسخة العربية
              </>
            )}
          </Button>

          <Button
            onClick={generateEnglishPDF}
            disabled={isGeneratingEn || !logoBase64}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
            size="lg"
          >
            {isGeneratingEn ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </div>
            ) : (
              <>
                <Download className="w-5 h-5 ml-2" />
                Download English Version
              </>
            )}
          </Button>
        </motion.div>

        {/* Contact */}
        <div className="text-center mt-12 text-blue-200">
          <p className="flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" />
            <span className="direction-ltr unicode-bidi-plaintext">{PHONE_NUMBER}</span>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
};

export default FeasibilityStudy;
