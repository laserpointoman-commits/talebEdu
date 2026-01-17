import { useLanguage } from "@/contexts/LanguageContext";

interface PageHeaderProps {
  title: string;
  titleAr?: string;
  titleHi?: string;
  subtitle?: string;
  subtitleAr?: string;
  subtitleHi?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  titleAr,
  titleHi,
  subtitle,
  subtitleAr,
  subtitleHi,
  actions,
}: PageHeaderProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const isHindi = language === 'hi';

  const displayTitle = isArabic && titleAr ? titleAr : isHindi && titleHi ? titleHi : title;
  const displaySubtitle = isArabic && subtitleAr ? subtitleAr : isHindi && subtitleHi ? subtitleHi : subtitle;

  return (
    <div className="relative mb-6 md:mb-8">
      <div className="space-y-2 md:space-y-3">
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
