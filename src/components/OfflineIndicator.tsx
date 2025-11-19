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
                {language === 'en' ? 'Syncing...' : 'مزامنة...'}
              </p>
              <p className="text-xs text-blue-600">
                {language === 'en' ? 'Uploading changes' : 'تحميل التغييرات'}
              </p>
            </div>
          </>
        ) : !isOnline ? (
          <>
            <WifiOff className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-semibold text-sm text-orange-800">
                {language === 'en' ? 'Offline Mode' : 'وضع غير متصل'}
              </p>
              <p className="text-xs text-orange-600">
                {language === 'en' ? 'Changes saved locally' : 'التغييرات محفوظة محليًا'}
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
