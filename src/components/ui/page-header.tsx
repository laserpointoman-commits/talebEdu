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
    <div className="relative mb-6 md:mb-8">
      {showBackButton && (
        <button
          onClick={handleBack}
          className={`absolute top-0 ${isArabic ? 'right-0' : 'left-0'} p-2 md:p-3 hover:bg-accent rounded-lg transition-colors no-select`}
          aria-label={isArabic ? 'رجوع' : 'Go back'}
        >
          {isArabic ? <ArrowRight className="h-5 w-5 md:h-6 md:w-6" /> : <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />}
        </button>
      )}
      <div className={`${showBackButton ? 'pt-12 md:pt-14' : ''} space-y-2 md:space-y-3`}>
        <div className={`flex items-center justify-between gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex-1 ${isArabic ? 'text-right' : ''}`}>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-tight">{displayTitle}</h1>
            {displaySubtitle && (
              <p className="text-sm md:text-base lg:text-lg text-muted-foreground mt-1 md:mt-2">{displaySubtitle}</p>
            )}
          </div>
          {actions && (
            <div className="shrink-0 flex items-center">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
