import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ArrowLeft, Home } from 'lucide-react';

interface PageHeaderProps {
  title?: string;
  showHome?: boolean;
}

export default function PageHeader({ title, showHome = true }: PageHeaderProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <header 
      className="fixed left-0 right-0 top-0 z-50 bg-card ios-header"
      dir="ltr"
    >
      <div className="h-12 border-b border-border bg-card shadow-sm flex items-center justify-between px-2"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Left - Back & Home */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-8 w-8 rounded-lg hover:bg-secondary"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          {showHome && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="h-8 w-8 rounded-lg hover:bg-secondary"
              aria-label="Go to home"
            >
              <Home className="h-4 w-4" />
            </Button>
          )}
          
          <LanguageSwitcher />
        </div>

        {/* Center - Title */}
        {title && (
          <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold truncate max-w-[50%]">
            {title}
          </h1>
        )}

        {/* Right - Logo */}
        <div className="flex items-center gap-1.5">
          <div className="text-2xl font-bold text-primary leading-none">
            t
          </div>
          <span className="font-bold text-base text-foreground">
            talebEdu
          </span>
        </div>
      </div>
    </header>
  );
}
