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
    <div className="relative mb-6">
      {showBackButton && (
        <button
          onClick={handleBack}
          className={`absolute top-0 ${isArabic ? 'right-0' : 'left-0'} p-2 hover:bg-accent rounded-md transition-colors`}
          aria-label={isArabic ? 'رجوع' : 'Go back'}
        >
          {isArabic ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
        </button>
      )}
      <div className={`${showBackButton ? 'pt-10' : ''} space-y-2`}>
        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex-1 ${isArabic ? 'text-right' : ''}`}>
            <h1 className="text-2xl md:text-3xl font-bold">{displayTitle}</h1>
            {displaySubtitle && (
              <p className="text-sm md:text-base text-muted-foreground mt-1">{displaySubtitle}</p>
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
