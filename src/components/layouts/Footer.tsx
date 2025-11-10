import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t, dir } = useLanguage();
  
  return (
    <footer className="border-t border-border/20 glass-light mt-auto animate-fade-in">
      <div className="container mx-auto px-1.5 md:px-2 py-1 md:py-1.5">
        <div className="flex flex-col items-center justify-center space-y-0.5 md:space-y-1 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-2 text-[10px] md:text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} talebEdu</span>
            <span className="hidden md:inline">•</span>
            <span>{t('footer.allRightsReserved')}</span>
          </div>
          <div className="flex flex-col items-center space-y-0 md:space-y-0.5 text-[10px] md:text-xs text-muted-foreground">
            <span>Mazen Khanfar</span>
            <a 
              href="tel:+96896564540" 
              className="hover:text-primary transition-colors number-display"
              dir="ltr"
            >
              +968 9656 4540
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}