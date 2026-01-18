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
      <div className="h-14 border-b border-border bg-card shadow-sm flex items-center justify-between px-3"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Left - Back & Home */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-xl hover:bg-primary/10"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {showHome && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="h-9 w-9 rounded-xl hover:bg-primary/10"
              aria-label="Go to home"
            >
              <Home className="h-5 w-5" />
            </Button>
          )}
          
          <LanguageSwitcher />
        </div>

        {/* Center - Title */}
        {title && (
          <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold truncate max-w-[50%]">
            {title}
          </h1>
        )}

        {/* Right - Logo */}
        <div className="flex items-center gap-1.5">
          <div className="text-xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            t
          </div>
          <span className="font-semibold text-sm text-foreground">
            talebEdu
          </span>
        </div>
      </div>
    </header>
  );
}
