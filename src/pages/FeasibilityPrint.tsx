import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import talebEduLogo from "@/assets/talebedu-app-icon.jpg";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const PHONE_NUMBER = "+968 9656 4540";

const FeasibilityPrint = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [isGenerating, setIsGenerating] = useState(false);
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const updateWidth = () => setScreenWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const pages = document.querySelectorAll('.print-page');
      if (pages.length === 0) return;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const originalZoom = page.style.zoom;
        page.style.zoom = '1';
        
        const allElements = page.querySelectorAll('*');
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.letterSpacing = 'normal';
          htmlEl.style.wordWrap = 'normal';
          htmlEl.style.fontFeatureSettings = '"liga" 0';
        });
        
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          width: 794,
          height: 1123,
          logging: false,
        });
        
        page.style.zoom = originalZoom;
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.letterSpacing = '';
          htmlEl.style.wordWrap = '';
          htmlEl.style.fontFeatureSettings = '';
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(language === 'ar' ? 'دراسة_جدوى_TalebEdu.pdf' : 'TalebEdu_Feasibility_Study.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const pageWidthPx = 794;
  const pageHeightPx = 1123;
  const pageScale = screenWidth < pageWidthPx + 40
    ? Math.max(0.3, (screenWidth - 16) / pageWidthPx)
    : 1;

  // Dark themed page style
  const pageStyle: React.CSSProperties = {
    width: "210mm",
    height: "297mm",
    minHeight: "297mm",
    maxHeight: "297mm",
    padding: "12mm 15mm",
    boxSizing: "border-box",
    background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
    color: "white",
    margin: "0 auto",
    marginBottom: "20px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    overflow: "hidden",
    display: "block",
    position: "relative",
    zoom: pageScale < 1 ? pageScale : undefined,
  };

  // Glass card style for sections
  const glassCard: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.06)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "16px",
  };

  // Section header with gradient accent
  const sectionHeader: React.CSSProperties = {
    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(96, 165, 250, 0.1))",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    borderRadius: "12px",
    padding: "14px 20px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // Accent divider
  const accentLine: React.CSSProperties = {
    height: "3px",
    background: "linear-gradient(90deg, transparent, #3b82f6, #60a5fa, #3b82f6, transparent)",
    borderRadius: "2px",
    margin: "12px 0",
  };

  const GlowingTitle = ({ size = "48px" }: { size?: string }) => (
    <div style={{ textAlign: "center", marginBottom: "10px", direction: "ltr" }}>
      <span
        style={{
          fontSize: size,
          fontWeight: "bold",
          background: "linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd, #60a5fa, #3b82f6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "3px",
        }}
      >
        TalebEdu
      </span>
    </div>
  );

  const LogoImage = ({ size = "100px", style = {} }: { size?: string; style?: React.CSSProperties }) => (
    <img
      src={talebEduLogo}
      alt="TalebEdu Logo"
      style={{
        width: size,
        height: size,
        borderRadius: "20%",
        boxShadow: "0 8px 32px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.15)",
        border: "2px solid rgba(96, 165, 250, 0.3)",
        ...style,
      }}
    />
  );

  const HeaderLogo = () => (
    <img
      src={talebEduLogo}
      alt="Logo"
      style={{ width: "36px", height: "36px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(59,130,246,0.3)" }}
    />
  );

  // Styled table for dark theme
  const DarkTable = ({ headers, rows, highlightLastRow = false }: { headers: string[]; rows: string[][]; highlightLastRow?: boolean }) => (
    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px", fontSize: "12px", direction: "ltr" }}>
      <thead>
        <tr>
          {headers.map((h, j) => (
            <th key={j} style={{
              padding: "10px 12px",
              textAlign: "center",
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "white",
              fontWeight: "bold",
              borderRadius: j === 0 ? "8px 0 0 8px" : j === headers.length - 1 ? "0 8px 8px 0" : "0",
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const isLast = highlightLastRow && i === rows.length - 1;
          return (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: "9px 12px",
                  textAlign: "center",
                  background: isLast
                    ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                    : i % 2 === 0
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(255,255,255,0.02)",
                  color: isLast ? "white" : j === 0 ? "#93c5fd" : "#e2e8f0",
                  fontWeight: isLast || j === 0 || j === row.length - 1 ? "bold" : "normal",
                  borderRadius: j === 0 ? "8px 0 0 8px" : j === row.length - 1 ? "0 8px 8px 0" : "0",
                }}>{cell}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  // Feature item with icon
  const FeatureItem = ({ title, desc, isRtl = false }: { title: string; desc: string; isRtl?: boolean }) => (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(59,130,246,0.2)",
      borderRadius: "10px",
      padding: "10px 14px",
      marginBottom: "6px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      direction: isRtl ? "rtl" : "ltr",
    }}>
      <span style={{
        background: "linear-gradient(135deg, #10b981, #059669)",
        borderRadius: "50%",
        width: "22px",
        height: "22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: "12px",
      }}>✓</span>
      <span style={{ fontWeight: "bold", color: "#93c5fd", whiteSpace: "nowrap", fontSize: "13px" }}>{title}</span>
      <span style={{ flex: 1, color: "#94a3b8", fontSize: "12px" }}>{desc}</span>
    </div>
  );

  // Risk item
  const RiskItem = ({ risk, mitigation, icon, isRtl = false }: { risk: string; mitigation: string; icon: string; isRtl?: boolean }) => (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(245,158,11,0.2)",
      borderRadius: "12px",
      padding: "14px 16px",
      marginBottom: "10px",
      direction: isRtl ? "rtl" : "ltr",
    }}>
      <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "4px", color: "#fbbf24" }}>{icon} {risk}</p>
      <p style={{ fontSize: "12px", color: "#94a3b8" }}>{isRtl ? "الحلول: " : "Mitigation: "}{mitigation}</p>
    </div>
  );

  // Highlight box
  const HighlightBox = ({ children, color = "blue" }: { children: React.ReactNode; color?: string }) => {
    const colors: Record<string, { bg: string; border: string }> = {
      blue: { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)" },
      green: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)" },
      amber: { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)" },
      purple: { bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.3)" },
    };
    const c = colors[color] || colors.blue;
    return (
      <div style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: "12px",
        padding: "16px 20px",
      }}>
        {children}
      </div>
    );
  };

  const printStyles = `
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      @page { size: A4; margin: 0; }
      html, body, #root {
        margin: 0 !important; padding: 0 !important;
        height: auto !important; overflow: visible !important;
      }
      #feasibility-print-root {
        height: auto !important; overflow: visible !important; max-height: none !important;
      }
      .print-container { padding: 0 !important; margin: 0 !important; }
      .print-pages-wrapper { padding: 0 !important; margin: 0 !important; }
      .print-page {
        width: 210mm !important; height: 297mm !important;
        margin: 0 !important; padding: 12mm 15mm !important;
        box-sizing: border-box !important; box-shadow: none !important;
        page-break-after: always !important; page-break-inside: avoid !important;
        overflow: visible !important; display: block !important; zoom: 1 !important;
      }
      .print-page:last-child { page-break-after: auto !important; }
      .no-print { display: none !important; }
    }
    @media screen and (max-width: 850px) {
      .print-pages-wrapper { overflow-x: hidden; }
    }
  `;

  return (
    <div id="feasibility-print-root" className="h-[100dvh] overflow-y-auto overscroll-none" style={{ WebkitOverflowScrolling: 'touch' }}>
      <style>{printStyles}</style>
      <div
        className="min-h-screen print:bg-white print-container"
        dir={language === "ar" ? "rtl" : "ltr"}
        style={{
          fontFamily: language === "ar" ? "'Noto Naskh Arabic', 'Geeza Pro', 'Arial', sans-serif" : "Arial, sans-serif",
          background: "linear-gradient(180deg, #0a0f1e 0%, #111827 100%)",
        }}
      >

      {/* Controls */}
      <div className="no-print sticky top-0 z-50 p-3 sm:p-4 shadow-lg" style={{ background: "rgba(15,23,42,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(59,130,246,0.2)" }}>
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="w-1" />
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="flex rounded-lg p-1" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <button
                onClick={() => setLanguage("ar")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md transition-all text-sm sm:text-base`}
                style={{
                  background: language === "ar" ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "transparent",
                  color: language === "ar" ? "white" : "#94a3b8",
                }}
              >
                عربي
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md transition-all text-sm sm:text-base`}
                style={{
                  background: language === "en" ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "transparent",
                  color: language === "en" ? "white" : "#94a3b8",
                }}
              >
                English
              </button>
            </div>

            <Button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="text-white border-0"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              {isGenerating ? <Loader2 className="w-5 h-5 ml-2 animate-spin" /> : <Download className="w-5 h-5 ml-2" />}
              {isGenerating ? (language === 'ar' ? 'جاري التحميل...' : 'Generating...') : (language === 'ar' ? 'تحميل PDF' : 'Download PDF')}
            </Button>
          </div>
        </div>
      </div>

      {/* A4 Pages Container */}
      <div className="py-8 print:py-0 print-pages-wrapper">
        {language === "ar" ? (
          <>
            {/* ===== ARABIC COVER ===== */}
            <div
              className="print-page"
              dir="rtl"
              style={{
                ...pageStyle,
                background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0f172a 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                direction: "rtl",
              }}
            >
              {/* Decorative circles */}
              <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(59,130,246,0.08)" }} />
              <div style={{ position: "absolute", bottom: "-40px", left: "-40px", width: "150px", height: "150px", borderRadius: "50%", background: "rgba(96,165,250,0.06)" }} />

              <LogoImage size="130px" style={{ marginBottom: "30px" }} />
              <GlowingTitle size="56px" />
              <div style={accentLine} />
              <h2 style={{ fontSize: "28px", marginBottom: "16px", color: "#60a5fa", fontWeight: "300" }}>دراسة جدوى</h2>
              <p style={{ fontSize: "16px", marginBottom: "8px", color: "#e2e8f0" }}>نظام آمان و متابعة الطلاب الذكي للمدارس و اولياء الامور</p>
              <p style={{ fontSize: "13px", color: "#64748b", letterSpacing: "2px" }}>المحفظة الإلكترونية | البوابات الذكية | المتجر الرقمي</p>

              <div style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(59,130,246,0.1))",
                border: "1px solid rgba(59,130,246,0.3)",
                padding: "20px 50px",
                borderRadius: "16px",
                marginTop: "40px",
                marginBottom: "40px",
              }}>
                <p style={{ fontSize: "13px", marginBottom: "5px", color: "#93c5fd" }}>مقدم إلى</p>
                <p style={{ fontSize: "22px", fontWeight: "bold" }}>الجهة المستثمرة</p>
              </div>

              <p style={{ fontSize: "14px", color: "#94a3b8" }}>مقدم من: مازن خنفر - TalebEdu</p>
              <p style={{ fontSize: "14px", marginTop: "8px", color: "#94a3b8" }}>
                هاتف: <span style={{ direction: "ltr", unicodeBidi: "plaintext", display: "inline-block" }}>{PHONE_NUMBER}</span>
              </p>
              <p style={{ fontSize: "13px", marginTop: "20px", color: "#475569" }}>مسقط، سلطنة عمان - 2026</p>
            </div>

            {/* ===== AR PAGE 2: Executive Summary ===== */}
            <div className="print-page" dir="rtl" style={{ ...pageStyle, direction: "rtl" }}>
              <div style={sectionHeader}>
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>الملخص التنفيذي</span>
                <HeaderLogo />
              </div>

              <div style={{ lineHeight: "1.8", textAlign: "right" }}>
                <p style={{ fontSize: "15px", fontWeight: "bold", color: "#60a5fa", marginBottom: "14px" }}>
                  TalebEdu هو التطبيق الوحيد في العالم الذي يجمع في منصة واحدة:
                </p>

                <div style={glassCard}>
                  {[
                    "إدارة المدرسة: الحضور، الدرجات، الواجبات، الجداول",
                    "إدارة الباصات: 6 باصات كحد أدنى لكل مدرسة مع تتبع مباشر",
                    "البوابات الذكية والمقصف بتقنية NFC",
                    "المحفظة الإلكترونية للطلاب - شراء من المقصف و من المتجر الالكتروني",
                    "المتجر الرقمي: أساور NFC + قرطاسية بعلامة تجارية خاصة",
                    "نظام تواصل متكامل: رسائل، مكالمات صوتية ومرئية، مشاركة ملفات",
                  ].map((text, i) => (
                    <div key={i} style={{ marginBottom: "8px", display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: "10px" }}>
                      <span style={{ flex: 1, textAlign: "right", color: "#e2e8f0", fontSize: "13px" }}>{text}</span>
                      <span style={{ background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "11px" }}>✓</span>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: "15px", fontWeight: "bold", color: "#10b981", marginBottom: "12px" }}>المزايا الفريدة:</p>

                <div style={glassCard}>
                  {[
                    "السوار الذكي: مقاوم لجميع العوامل عدا النار، لا يحتاج شحن",
                    "دعم متعدد اللغات: العربية، الإنجليزية، الهندية",
                    "أمان كامل للطلاب وأولياء الأمور",
                    "قابلية التوسع المحلي والدولي (دول الخليج في السنة 3)",
                    "إدارة مالية متكاملة: جميع الاشتراكات عبر المحفظة",
                  ].map((text, i) => (
                    <div key={i} style={{ marginBottom: "8px", display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: "10px" }}>
                      <span style={{ flex: 1, textAlign: "right", color: "#e2e8f0", fontSize: "13px" }}>{text}</span>
                      <span style={{ color: "#10b981", flexShrink: 0, fontSize: "14px" }}>✓</span>
                    </div>
                  ))}
                </div>

                <HighlightBox color="green">
                  <p style={{ fontSize: "14px", fontWeight: "bold", color: "#10b981", marginBottom: "4px" }}>هدف المشروع:</p>
                  <p style={{ fontSize: "13px", color: "#a7f3d0" }}>
                    إنشاء منصة موثوقة وشاملة لحل مشاكل إدارة المدارس والأمان والتواصل والشراء الرقمي بطريقة مستدامة.
                  </p>
                </HighlightBox>
              </div>
            </div>

            {/* ===== AR PAGE 3: Project Scope ===== */}
            <div className="print-page" dir="rtl" style={{ ...pageStyle, direction: "rtl" }}>
              <div style={sectionHeader}>
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>نطاق المشروع</span>
                <HeaderLogo />
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={glassCard}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
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
                        <tr key={i}>
                          <td style={{ padding: "10px 14px", fontWeight: "bold", color: "#60a5fa", background: "rgba(255,255,255,0.04)", borderRadius: "8px 0 0 8px" }}>{label}</td>
                          <td style={{ padding: "10px 14px", color: "#e2e8f0", background: "rgba(255,255,255,0.04)", borderRadius: "0 8px 8px 0" }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 style={{ fontSize: "17px", fontWeight: "bold", marginBottom: "14px", color: "#93c5fd" }}>الخدمات المقدمة:</h3>
                <div style={glassCard}>
                  {[
                    "اشتراك سنوي للطالب (الباص، البوابة، المقصف، المحفظة، متابعة الدرجات)",
                    "بيع أساور NFC إضافية",
                    "متجر قرطاسية بعلامة تجارية خاصة",
                    "نظام مراسلة داخلي للتواصل بين الأهل والمعلمين والإدارة",
                  ].map((text, i) => (
                    <div key={i} style={{ marginBottom: "10px", display: "flex", flexDirection: "row-reverse", alignItems: "flex-start", gap: "10px" }}>
                      <span style={{ flex: 1, textAlign: "right", color: "#e2e8f0", fontSize: "14px" }}>{text}</span>
                      <span style={{ color: "#3b82f6", fontWeight: "bold", fontSize: "14px" }}>{i + 1}.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ===== AR PAGE 4: Competitive Advantages ===== */}
            <div className="print-page" dir="rtl" style={{ ...pageStyle, direction: "rtl" }}>
              <div style={sectionHeader}>
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>المزايا التنافسية</span>
                <HeaderLogo />
              </div>

              <div style={{ textAlign: "right" }}>
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
                  <FeatureItem key={i} title={title} desc={desc} isRtl />
                ))}
              </div>
            </div>

            {/* ===== AR PAGE 5: Revenue ===== */}
            <div className="print-page" dir="rtl" style={{ ...pageStyle, direction: "rtl" }}>
              <div style={sectionHeader}>
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>الدراسة المالية - الإيرادات</span>
                <HeaderLogo />
              </div>

              <div style={{ textAlign: "right" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "14px", color: "#60a5fa", textAlign: "right", direction: "rtl" }}>
                  أ) الإيرادات السنوية - المدارس الخاصة فقط (ر.ع)
                </h3>

                <DarkTable
                  headers={["السنة", "الطلاب", "المدارس", "اشتراك الطالب", "الباصات", "NFC", "القرطاسية", "الإجمالي"]}
                  rows={[
                    ["1", "25,000", "50", "625,000", "30,000", "42,500", "312,500", "1,010,000"],
                    ["2", "50,000", "100", "1,250,000", "60,000", "85,000", "625,000", "2,020,000"],
                    ["3", "100,000", "200", "2,500,000", "120,000", "170,000", "1,250,000", "4,040,000"],
                  ]}
                />

                <div style={{ marginTop: "20px" }}>
                  <HighlightBox color="blue">
                    <p style={{ fontSize: "13px", fontWeight: "bold", color: "#93c5fd", marginBottom: "8px" }}>ملاحظات:</p>
                    <div style={{ fontSize: "12px", color: "#93c5fd" }}>
                      <p style={{ marginBottom: "4px" }}>• اشتراك الطالب: <span dir="ltr">25</span> ر.ع سنوياً</p>
                      <p style={{ marginBottom: "4px" }}>• رسوم الباص: <span dir="ltr">150</span> ر.ع لكل باص سنوياً</p>
                      <p style={{ marginBottom: "4px" }}>• سوار <span dir="ltr">NFC</span>: <span dir="ltr">2</span> ر.ع للقطعة (سعر البيع)</p>
                      <p>• القرطاسية: <span dir="ltr">50</span> ر.ع متوسط إنفاق الطالب سنوياً</p>
                    </div>
                  </HighlightBox>
                </div>
              </div>
            </div>

            {/* ===== AR PAGE 6: CAPEX ===== */}
            <div className="print-page" dir="rtl" style={{ ...pageStyle, direction: "rtl" }}>
              <div style={sectionHeader}>
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>الدراسة المالية - التكاليف</span>
                <HeaderLogo />
              </div>

              <div style={{ textAlign: "right" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "14px", color: "#60a5fa" }}>ب) التكاليف التأسيسية CAPEX (ر.ع)</h3>

                <div style={glassCard}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px", fontSize: "13px" }}>
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
                      ].map(([label, value], i) => {
                        const isTotal = i === 8;
                        return (
                          <tr key={i}>
                            <td style={{
                              padding: "10px 14px",
                              fontWeight: isTotal ? "bold" : "normal",
                              color: isTotal ? "white" : "#e2e8f0",
                              background: isTotal ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "rgba(255,255,255,0.04)",
                              borderRadius: "8px 0 0 8px",
                            }}>{label}</td>
                            <td style={{
                              padding: "10px 14px",
                              fontWeight: "bold",
                              color: isTotal ? "white" : "#93c5fd",
                              background: isTotal ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "rgba(255,255,255,0.04)",
                              borderRadius: "0 8px 8px 0",
                              textAlign: "center",
                            }}>{value}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ===== AR PAGE 6b: OPEX ===== */}
            <div className="print-page" dir="rtl" style={{ ...pageStyle, direction: "rtl" }}>
              <div style={sectionHeader}>
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>الدراسة المالية - التكاليف التشغيلية</span>
                <HeaderLogo />
              </div>

              <div style={{ textAlign: "right" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "14px", color: "#60a5fa" }}>ج) التكاليف التشغيلية OPEX (ر.ع/سنة)</h3>

                <DarkTable
                  headers={["البند", "السنة 1", "السنة 2", "السنة 3"]}
                  rows={[
                    ["الرواتب", "180,000", "250,000", "350,000"],
                    ["الخوادم", "24,000", "36,000", "48,000"],
                    ["التسويق", "50,000", "75,000", "100,000"],
                    ["تكلفة الأساور", "25,500", "51,000", "102,000"],
                    ["تكلفة القرطاسية", "187,500", "375,000", "750,000"],
                    ["مصاريف إدارية", "30,000", "40,000", "50,000"],
                    ["الإجمالي", "497,000", "827,000", "1,400,000"],
                  ]}
                  highlightLastRow
                />
              </div>
            </div>

            {/* ===== AR PAGE 7: Profitability ===== */}
            <div className="print-page" dir="rtl" style={{ ...pageStyle, direction: "rtl" }}>
              <div style={sectionHeader}>
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>الربحية والتدفق النقدي</span>
                <HeaderLogo />
              </div>

              <div style={{ textAlign: "right" }}>
                <DarkTable
                  headers={["البند", "السنة 1", "السنة 2", "السنة 3"]}
                  rows={[
                    ["الإيرادات", "1,010,000", "2,020,000", "4,040,000"],
                    ["التكاليف التشغيلية", "497,000", "827,000", "1,400,000"],
                    ["صافي الربح", "513,000", "1,193,000", "2,640,000"],
                    ["هامش الربح", "50.8%", "59.1%", "65.3%"],
                  ]}
                />

                <div style={{ marginTop: "24px" }}>
                  <div style={{
                    background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: "16px",
                    padding: "24px",
                    textAlign: "center",
                  }}>
                    <h4 style={{ fontSize: "18px", fontWeight: "bold", color: "#fbbf24", marginBottom: "10px" }}>
                      إجمالي الأرباح خلال 3 سنوات:
                    </h4>
                    <p style={{ fontSize: "36px", fontWeight: "bold", color: "#fbbf24", marginBottom: "8px" }}>4,346,000 ر.ع</p>
                    <p style={{ fontSize: "13px", color: "#fcd34d" }}>(بعد خصم جميع التكاليف التشغيلية)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== AR PAGE 8: Loan Repayment ===== */}
            <div className="print-page" dir="rtl" style={{ ...pageStyle, direction: "rtl" }}>
              <div style={sectionHeader}>
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>سيناريو سداد القرض</span>
                <HeaderLogo />
              </div>

              <div style={{ textAlign: "right" }}>
                <HighlightBox color="blue">
                  <h4 style={{ fontSize: "17px", fontWeight: "bold", color: "#93c5fd", marginBottom: "14px" }}>تفاصيل القرض المطلوب:</h4>
                  <table style={{ width: "100%", fontSize: "14px" }}>
                    <tbody>
                      {[
                        ["مبلغ القرض", "420,000 ر.ع"],
                        ["مدة السداد", "3 سنوات"],
                        ["القسط السنوي", "140,000 ر.ع"],
                      ].map(([label, value], i) => (
                        <tr key={i}>
                          <td style={{ padding: "6px 0", fontWeight: "bold", color: "#93c5fd" }}>{label}</td>
                          <td style={{ padding: "6px 0", color: "#e2e8f0" }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </HighlightBox>

                <h3 style={{ fontSize: "16px", fontWeight: "bold", marginTop: "20px", marginBottom: "14px", color: "#60a5fa" }}>جدول السداد:</h3>

                <DarkTable
                  headers={["السنة", "صافي الربح", "القسط", "المتبقي بعد السداد"]}
                  rows={[
                    ["1", "513,000", "140,000", "373,000"],
                    ["2", "1,193,000", "140,000", "1,053,000"],
                    ["3", "2,640,000", "140,000", "2,500,000"],
                  ]}
                />

                <div style={{ marginTop: "20px" }}>
                  <HighlightBox color="green">
                    <p style={{ fontSize: "14px", color: "#a7f3d0", display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: "8px" }}>
                      <span style={{ flex: 1, textAlign: "right" }}>القدرة على سداد القرض بالكامل من أرباح السنة الأولى فقط</span>
                      <span style={{ background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "12px" }}>✓</span>
                    </p>
                  </HighlightBox>
                </div>
              </div>
            </div>

            {/* ===== AR PAGE 9: Risk Analysis ===== */}
            <div className="print-page" dir="rtl" style={{ ...pageStyle, direction: "rtl" }}>
              <div style={sectionHeader}>
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>تحليل المخاطر والحلول</span>
                <HeaderLogo />
              </div>

              <div style={{ textAlign: "right" }}>
                <RiskItem risk="تأخر اعتماد المدارس" mitigation="برنامج تجريبي مجاني + شراكات استراتيجية مع وزارة التربية" icon="⚠️" isRtl />
                <RiskItem risk="منافسة جديدة" mitigation="ميزة الريادة + تكنولوجيا السوار الفريدة + عقود طويلة الأمد" icon="🛡️" isRtl />
                <RiskItem risk="أعطال تقنية" mitigation="فريق دعم 24/7 + خوادم احتياطية + نظام offline" icon="🔧" isRtl />
                <RiskItem risk="تغير الأسعار" mitigation="عقود مع الموردين + تنويع المصادر + مخزون استراتيجي" icon="📊" isRtl />
                <RiskItem risk="تغيرات تنظيمية" mitigation="التزام كامل بمعايير الخصوصية + شراكة مع الجهات الحكومية" icon="📋" isRtl />
              </div>
            </div>

            {/* ===== AR PAGE 10: Conclusion ===== */}
            <div
              className="print-page"
              dir="rtl"
              style={{
                ...pageStyle,
                background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0f172a 100%)",
                direction: "rtl",
              }}
            >
              <div style={{ position: "absolute", top: "-40px", left: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(16,185,129,0.06)" }} />

              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <LogoImage size="80px" style={{ marginBottom: "16px" }} />
                <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px", color: "#93c5fd" }}>الخلاصة والتوصية</h1>
                <div style={accentLine} />
              </div>

              <div style={{ ...glassCard, marginBottom: "24px" }}>
                {[
                  "TalebEdu مشروع مبتكر وفريد في عمان",
                  "قادر على توليد دخل مستقر يغطي القرض",
                  "قرض 420,000 ر.ع قابل للاسترداد خلال 3 سنوات",
                  "إمكانية قوية للتوسع محلياً ودولياً",
                  "ميزة الريادة في إدارة المدارس الذكية",
                  "نموذج إيرادات مستدام ومتكرر",
                ].map((point, i) => (
                  <p key={i} style={{ fontSize: "15px", marginBottom: "10px", display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: "10px" }}>
                    <span style={{ flex: 1, textAlign: "right", color: "#e2e8f0" }}>{point}</span>
                    <span style={{ background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "12px" }}>✓</span>
                  </p>
                ))}
              </div>

              <div style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                padding: "24px",
                borderRadius: "16px",
                textAlign: "center",
                marginBottom: "30px",
                boxShadow: "0 8px 32px rgba(16,185,129,0.3)",
              }}>
                <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "12px" }}>التوصية</h2>
                <p style={{ fontSize: "15px" }}>الموافقة على تمويل المشروع لدعم هذا الحل التعليمي والأمني الرقمي المتكامل</p>
              </div>

              <div style={{ textAlign: "center", marginTop: "30px" }}>
                <GlowingTitle size="32px" />
                <p style={{ fontSize: "14px", marginTop: "12px", color: "#94a3b8" }}>مازن خنفر</p>
                <p style={{ fontSize: "14px", marginTop: "6px", color: "#94a3b8" }}>
                  هاتف: <span style={{ direction: "ltr", unicodeBidi: "plaintext", display: "inline-block" }}>{PHONE_NUMBER}</span>
                </p>
                <p style={{ fontSize: "13px", color: "#475569", marginTop: "10px" }}>مسقط، سلطنة عمان - 2026</p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ===== ENGLISH COVER ===== */}
            <div
              className="print-page"
              style={{
                ...pageStyle,
                background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0f172a 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(59,130,246,0.08)" }} />
              <div style={{ position: "absolute", bottom: "-40px", left: "-40px", width: "150px", height: "150px", borderRadius: "50%", background: "rgba(96,165,250,0.06)" }} />

              <LogoImage size="130px" style={{ marginBottom: "30px" }} />
              <GlowingTitle size="56px" />
              <div style={accentLine} />
              <h2 style={{ fontSize: "28px", marginBottom: "16px", color: "#60a5fa", fontWeight: "300" }}>Feasibility Study</h2>
              <p style={{ fontSize: "16px", marginBottom: "8px", color: "#e2e8f0" }}>Smart Student Safety & Tracking System for Schools & Parents</p>
              <p style={{ fontSize: "13px", color: "#64748b", letterSpacing: "2px" }}>E-Wallet | Smart Gates | Digital Store</p>

              <div style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(59,130,246,0.1))",
                border: "1px solid rgba(59,130,246,0.3)",
                padding: "20px 50px",
                borderRadius: "16px",
                marginTop: "40px",
                marginBottom: "40px",
              }}>
                <p style={{ fontSize: "13px", marginBottom: "5px", color: "#93c5fd" }}>Presented to</p>
                <p style={{ fontSize: "22px", fontWeight: "bold" }}>Oman Development Bank</p>
              </div>

              <p style={{ fontSize: "14px", color: "#94a3b8" }}>Presented by: Mazen Khanfar - TalebEdu</p>
              <p style={{ fontSize: "14px", marginTop: "8px", color: "#94a3b8" }}>Phone: {PHONE_NUMBER}</p>
              <p style={{ fontSize: "13px", marginTop: "20px", color: "#475569" }}>Muscat, Sultanate of Oman - 2026</p>
            </div>

            {/* ===== EN PAGE 2: Executive Summary ===== */}
            <div className="print-page" style={pageStyle}>
              <div style={sectionHeader}>
                <HeaderLogo />
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>Executive Summary</span>
              </div>

              <div style={{ lineHeight: "1.8" }}>
                <p style={{ fontSize: "15px", fontWeight: "bold", color: "#60a5fa", marginBottom: "14px" }}>
                  TalebEdu is the ONLY application in the world combining:
                </p>

                <div style={glassCard}>
                  {[
                    "School Management: Attendance, Grades, Homework, Schedules",
                    "Bus Management: 6+ buses per school with real-time tracking",
                    "Smart Gates & Canteen with NFC technology",
                    "Electronic Wallet for students",
                    "Digital Store: NFC wristbands + Private Label stationery",
                    "Integrated Communication: Messages, Voice/Video calls",
                  ].map((text, i) => (
                    <div key={i} style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "11px" }}>✓</span>
                      <span style={{ color: "#e2e8f0", fontSize: "13px" }}>{text}</span>
                    </div>
                  ))}
                </div>

                <HighlightBox color="green">
                  <p style={{ fontSize: "14px", fontWeight: "bold", color: "#10b981", marginBottom: "4px" }}>Project Goal:</p>
                  <p style={{ fontSize: "13px", color: "#a7f3d0" }}>
                    Create a reliable platform solving school management, security, and digital purchasing sustainably.
                  </p>
                </HighlightBox>
              </div>
            </div>

            {/* ===== EN PAGE 3: Project Scope ===== */}
            <div className="print-page" style={pageStyle}>
              <div style={sectionHeader}>
                <HeaderLogo />
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>Project Scope</span>
              </div>

              <div style={glassCard}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
                  <tbody>
                    {[
                      ["Target Segment", "Private Schools + Government Partnership"],
                      ["Location", "Muscat & Dakhiliyah"],
                      ["Year 1 Schools", "50 schools"],
                      ["Avg Students/School", "500 students"],
                      ["Buses per School", "6 buses"],
                      ["Gates per School", "2 gates"],
                    ].map(([label, value], i) => (
                      <tr key={i}>
                        <td style={{ padding: "10px 14px", fontWeight: "bold", color: "#60a5fa", background: "rgba(255,255,255,0.04)", borderRadius: "8px 0 0 8px" }}>{label}</td>
                        <td style={{ padding: "10px 14px", color: "#e2e8f0", background: "rgba(255,255,255,0.04)", borderRadius: "0 8px 8px 0" }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ===== EN PAGE 4: Competitive Advantages ===== */}
            <div className="print-page" style={pageStyle}>
              <div style={sectionHeader}>
                <HeaderLogo />
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>Competitive Advantages</span>
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
                <FeatureItem key={i} title={title} desc={desc} />
              ))}
            </div>

            {/* ===== EN PAGE 5: Revenue ===== */}
            <div className="print-page" style={pageStyle}>
              <div style={sectionHeader}>
                <HeaderLogo />
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>Financial Study - Revenue</span>
              </div>

              <DarkTable
                headers={["Year", "Students", "Schools", "Subscriptions", "Buses", "NFC", "Stationery", "Total"]}
                rows={[
                  ["1", "25,000", "50", "625,000", "30,000", "42,500", "312,500", "1,010,000"],
                  ["2", "50,000", "100", "1,250,000", "60,000", "85,000", "625,000", "2,020,000"],
                  ["3", "100,000", "200", "2,500,000", "120,000", "170,000", "1,250,000", "4,040,000"],
                ]}
              />
            </div>

            {/* ===== EN PAGE 6: Costs ===== */}
            <div className="print-page" style={pageStyle}>
              <div style={sectionHeader}>
                <HeaderLogo />
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>Financial Study - Costs</span>
              </div>

              <h3 style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "14px", color: "#60a5fa" }}>CAPEX (OMR)</h3>
              <div style={glassCard}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px", fontSize: "13px" }}>
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
                    ].map(([label, value], i) => {
                      const isTotal = i === 8;
                      return (
                        <tr key={i}>
                          <td style={{
                            padding: "10px 14px",
                            fontWeight: isTotal ? "bold" : "normal",
                            color: isTotal ? "white" : "#e2e8f0",
                            background: isTotal ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "rgba(255,255,255,0.04)",
                            borderRadius: "8px 0 0 8px",
                          }}>{label}</td>
                          <td style={{
                            padding: "10px 14px",
                            fontWeight: "bold",
                            color: isTotal ? "white" : "#93c5fd",
                            background: isTotal ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "rgba(255,255,255,0.04)",
                            borderRadius: "0 8px 8px 0",
                            textAlign: "center",
                          }}>{value}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ===== EN PAGE 7: Profitability ===== */}
            <div className="print-page" style={pageStyle}>
              <div style={sectionHeader}>
                <HeaderLogo />
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>Profitability & Cash Flow</span>
              </div>

              <DarkTable
                headers={["Item", "Year 1", "Year 2", "Year 3"]}
                rows={[
                  ["Revenue", "1,010,000", "2,020,000", "4,040,000"],
                  ["Operating Costs", "497,000", "827,000", "1,400,000"],
                  ["Net Profit", "513,000", "1,193,000", "2,640,000"],
                  ["Profit Margin", "50.8%", "59.1%", "65.3%"],
                ]}
              />

              <div style={{ marginTop: "24px" }}>
                <div style={{
                  background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: "16px",
                  padding: "24px",
                  textAlign: "center",
                }}>
                  <h4 style={{ fontSize: "18px", fontWeight: "bold", color: "#fbbf24", marginBottom: "10px" }}>Total 3-Year Profit:</h4>
                  <p style={{ fontSize: "36px", fontWeight: "bold", color: "#fbbf24" }}>4,346,000 OMR</p>
                </div>
              </div>
            </div>

            {/* ===== EN PAGE 8: Loan Repayment ===== */}
            <div className="print-page" style={pageStyle}>
              <div style={sectionHeader}>
                <HeaderLogo />
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>Loan Repayment Scenario</span>
              </div>

              <HighlightBox color="blue">
                <h4 style={{ fontSize: "17px", fontWeight: "bold", color: "#93c5fd", marginBottom: "14px" }}>Loan Details:</h4>
                <table style={{ width: "100%", fontSize: "14px" }}>
                  <tbody>
                    {[
                      ["Loan Amount", "420,000 OMR"],
                      ["Repayment Period", "3 years"],
                      ["Interest Rate", "5%"],
                      ["Annual Payment", "~154,000 OMR"],
                    ].map(([label, value], i) => (
                      <tr key={i}>
                        <td style={{ padding: "6px 0", fontWeight: "bold", color: "#93c5fd" }}>{label}</td>
                        <td style={{ padding: "6px 0", color: "#e2e8f0" }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </HighlightBox>
            </div>

            {/* ===== EN PAGE 9: Risk Analysis ===== */}
            <div className="print-page" style={pageStyle}>
              <div style={sectionHeader}>
                <HeaderLogo />
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#93c5fd" }}>Risk Analysis & Mitigation</span>
              </div>

              <RiskItem risk="Delayed School Adoption" mitigation="Free pilot program + strategic partnerships" icon="⚠️" />
              <RiskItem risk="New Competition" mitigation="First-mover advantage + unique wristband tech" icon="🛡️" />
              <RiskItem risk="Technical Failures" mitigation="24/7 support + backup servers + offline mode" icon="🔧" />
              <RiskItem risk="Price Changes" mitigation="Supplier contracts + diversified sources" icon="📊" />
              <RiskItem risk="Regulatory Changes" mitigation="Privacy compliance + government partnerships" icon="📋" />
            </div>

            {/* ===== EN PAGE 10: Conclusion ===== */}
            <div
              className="print-page"
              style={{
                ...pageStyle,
                background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0f172a 100%)",
              }}
            >
              <div style={{ position: "absolute", top: "-40px", left: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(16,185,129,0.06)" }} />

              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <LogoImage size="80px" style={{ marginBottom: "16px" }} />
                <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px", color: "#93c5fd" }}>Conclusion & Recommendation</h1>
                <div style={accentLine} />
              </div>

              <div style={{ ...glassCard, marginBottom: "24px" }}>
                {[
                  "TalebEdu is an innovative and unique project in Oman",
                  "Capable of generating stable income covering the loan",
                  "420,000 OMR loan recoverable within 3 years",
                  "Strong potential for local and international expansion",
                  "First-mover advantage in smart school management",
                  "Sustainable recurring revenue model",
                ].map((point, i) => (
                  <p key={i} style={{ fontSize: "15px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "12px" }}>✓</span>
                    <span style={{ color: "#e2e8f0" }}>{point}</span>
                  </p>
                ))}
              </div>

              <div style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                padding: "24px",
                borderRadius: "16px",
                textAlign: "center",
                marginBottom: "30px",
                boxShadow: "0 8px 32px rgba(16,185,129,0.3)",
              }}>
                <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "12px" }}>Recommendation</h2>
                <p style={{ fontSize: "15px" }}>Approve project funding to support this comprehensive educational and security solution</p>
              </div>

              <div style={{ textAlign: "center", marginTop: "30px" }}>
                <GlowingTitle size="32px" />
                <p style={{ fontSize: "14px", marginTop: "12px", color: "#94a3b8" }}>Mazen Khanfar</p>
                <p style={{ fontSize: "14px", marginTop: "6px", color: "#94a3b8" }}>Phone: {PHONE_NUMBER}</p>
                <p style={{ fontSize: "13px", color: "#475569", marginTop: "10px" }}>Muscat, Sultanate of Oman - 2026</p>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
    </div>
  );
};

export default FeasibilityPrint;
