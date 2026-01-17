import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function InstallPrompt() {
  // Safely get language with fallback
  let language = 'en';
  try {
    const languageContext = useLanguage();
    language = languageContext.language;
  } catch (error) {
    // Language provider not available yet, use default
  }
  
  const getText = (en: string, ar: string, hi: string) => {
    if (language === 'ar') return ar;
    if (language === 'hi') return hi;
    return en;
  };
  
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const hasSeenPrompt = localStorage.getItem('installPromptSeen');
      if (!hasSeenPrompt) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
      localStorage.setItem('installPromptSeen', 'true');
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptSeen', 'true');
  };

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg border-primary/50 md:max-w-md md:left-auto">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            {getText('Install TalebEdu', 'تثبيت TalebEdu', 'TalebEdu इंस्टॉल करें')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {getText(
            'Install our app for quick access and better performance',
            'قم بتثبيت التطبيق للوصول السريع وأداء أفضل',
            'त्वरित पहुंच और बेहतर प्रदर्शन के लिए हमारा ऐप इंस्टॉल करें'
          )}
        </p>
        <div className="flex gap-2">
          <Button onClick={handleInstall} className="flex-1">
            {getText('Install', 'تثبيت', 'इंस्टॉल करें')}
          </Button>
          <Button onClick={handleDismiss} variant="outline">
            {getText('Not now', 'ليس الآن', 'अभी नहीं')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
