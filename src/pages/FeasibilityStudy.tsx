import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Download,
  Shield,
  CheckCircle2,
  Sparkles,
  Phone,
} from "lucide-react";
import talebEduBlueLogo from "@/assets/talebedu-app-icon.jpg";

const PHONE_NUMBER = "+968 9656 4540";

const FeasibilityStudy = () => {
  return (
    <div className="h-[100dvh] overflow-y-auto overscroll-none" style={{ WebkitOverflowScrolling: 'touch' }}>
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" dir="rtl">

      {/* Visible Page Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <img src={talebEduBlueLogo} alt="TalebEdu" className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl shadow-lg" />
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">دراسة جدوى TalebEdu</h1>
          <p className="text-base sm:text-xl text-blue-200"><p className="text-base sm:text-xl text-blue-200">نظام آمان و متابعة الطلاب الذكي للمدارس و اولياء الامور</p></p>
        </motion.div>

        {/* Key Highlights */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4 sm:p-6 text-center w-full max-w-xs">
            <Shield className="w-8 h-8 sm:w-12 sm:h-12 text-blue-400 mx-auto mb-2 sm:mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold text-white">اول نظام آمان في العالم للمدارس</h3>
            <p className="text-sm sm:text-base text-blue-200">بميزات فريدة</p>
          </Card>
        </div>

        {/* Features */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-5 sm:p-8 mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <Sparkles className="text-yellow-400 w-5 h-5 sm:w-6 sm:h-6" />
            المميزات الفريدة
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              "السوار الذكي - لا يحتاج شحن",
              "البوابات الذكية بتقنية NFC",
              "تتبع الباصات المباشر",
              "المحفظة الإلكترونية",
              "متجر القرطاسية الرقمي",
              "نظام التواصل المتكامل",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="text-green-400 flex-shrink-0 w-5 h-5" />
                <span className="text-white text-sm sm:text-base">{feature}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Download PDF Buttons */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button
            onClick={() => window.location.href = "/feasibility-print"}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
            size="lg"
          >
            <Download className="w-5 h-5 ml-2" />
            تحميل PDF عربي
          </Button>

          <Button
            onClick={() => {
              window.location.href = "/feasibility-print";
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
            size="lg"
          >
            <Download className="w-5 h-5 ml-2" />
            Download English PDF
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
