import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function NetworkStatus() {
  // Safely get language with fallback
  let language = 'en';
  try {
    const languageContext = useLanguage();
    language = languageContext.language;
  } catch (error) {
    // Language provider not available yet, use default
  }
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showAlert && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md"
        >
          <Alert variant={isOnline ? 'default' : 'destructive'}>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              <AlertDescription>
                {isOnline
                  ? language === 'ar'
                    ? 'تم استعادة الاتصال'
                    : language === 'hi'
                    ? 'कनेक्शन बहाल हुआ'
                    : 'Connection restored'
                  : language === 'ar'
                  ? 'لا يوجد اتصال بالإنترنت'
                  : language === 'hi'
                  ? 'इंटरनेट कनेक्शन नहीं है'
                  : 'No internet connection'}
              </AlertDescription>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
