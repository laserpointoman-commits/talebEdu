import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./button";
import { useLanguage } from "@/contexts/LanguageContext";

interface PageHeaderProps {
  title: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
  showBackButton?: boolean;
  backTo?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  titleAr,
  subtitle,
  subtitleAr,
  showBackButton = false,
  backTo,
  actions,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  const displayTitle = isArabic && titleAr ? titleAr : title;
  const displaySubtitle = isArabic && subtitleAr ? subtitleAr : subtitle;

  return (
    <div className="mb-6 space-y-2">
      <div className={`flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="shrink-0"
            aria-label={isArabic ? 'رجوع' : 'Go back'}
          >
            {isArabic ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>
        )}
        <div className={`flex-1 ${isArabic ? 'text-right' : ''}`}>
          <h1 className="text-3xl font-bold">{displayTitle}</h1>
          {displaySubtitle && (
            <p className="text-muted-foreground">{displaySubtitle}</p>
          )}
        </div>
        {actions && (
          <div className={`shrink-0 ${isArabic ? 'order-first' : ''}`}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
