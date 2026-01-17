import { useOffline } from '@/hooks/use-offline';
import { useLanguage } from '@/contexts/LanguageContext';
import { WifiOff, RefreshCw, Wifi } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function OfflineIndicator() {
  const { isOnline, isSyncing, syncPendingChanges } = useOffline();
  
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

  if (isOnline && !isSyncing) return null;

  return (
    <Card 
      className={`fixed bottom-4 ${language === 'ar' ? 'left-4' : 'right-4'} z-50 p-3 shadow-lg border-2 ${
        isOnline ? 'border-blue-500 bg-blue-50' : 'border-orange-500 bg-orange-50'
      }`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center gap-3">
        {isSyncing ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <div>
              <p className="font-semibold text-sm text-blue-800">
                {getText('Syncing...', 'مزامنة...', 'सिंक हो रहा है...')}
              </p>
              <p className="text-xs text-blue-600">
                {getText('Uploading changes', 'تحميل التغييرات', 'परिवर्तन अपलोड हो रहे हैं')}
              </p>
            </div>
          </>
        ) : !isOnline ? (
          <>
            <WifiOff className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-semibold text-sm text-orange-800">
                {getText('Offline Mode', 'وضع غير متصل', 'ऑफ़लाइन मोड')}
              </p>
              <p className="text-xs text-orange-600">
                {getText('Changes saved locally', 'التغييرات محفوظة محليًا', 'परिवर्तन स्थानीय रूप से सहेजे गए')}
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={syncPendingChanges}
              className="ml-2"
            >
              <Wifi className="h-4 w-4" />
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  );
}
