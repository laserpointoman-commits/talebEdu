import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
    <div className="relative mb-8 pt-safe">
      {showBackButton && (
        <button
          onClick={handleBack}
          className={`absolute top-safe ${isArabic ? 'right-0' : 'left-0'} p-3 hover:bg-accent rounded-lg transition-colors`}
          aria-label={isArabic ? 'رجوع' : 'Go back'}
        >
          {isArabic ? <ArrowRight className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
        </button>
      )}
      <div className={`${showBackButton ? 'pt-14' : 'pt-2'} space-y-3`}>
        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex-1 ${isArabic ? 'text-right' : ''}`}>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{displayTitle}</h1>
            {displaySubtitle && (
              <p className="text-base md:text-lg text-muted-foreground mt-2">{displaySubtitle}</p>
            )}
          </div>
          {actions && (
            <div className="shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
