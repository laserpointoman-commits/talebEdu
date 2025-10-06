import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CreditCard, CheckCircle, AlertCircle, Wifi, User } from 'lucide-react';
import LogoLoader from '@/components/LogoLoader';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface NfcProgrammingProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    id: string;
    name: string;
    nameAr?: string;
    role: string;
    nfcId?: string;
    email?: string;
    entityId?: string;
  };
  onSuccess?: (nfcId: string) => void;
}

export default function NfcProgramming({ isOpen, onClose, userData, onSuccess }: NfcProgrammingProps) {
  const { language } = useLanguage();
  const [status, setStatus] = useState<'idle' | 'scanning' | 'writing' | 'success' | 'error'>('idle');
  const [nfcId, setNfcId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setNfcId(userData.nfcId || generateNfcId());
      setErrorMessage('');
    }
  }, [isOpen, userData]);

  const generateNfcId = () => {
    const prefix = userData.role === 'teacher' ? 'TCH' : 'STD';
    const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    return `${prefix}-${random}`;
  };

  const handleStartProgramming = async () => {
    setStatus('scanning');
    setIsSimulating(true);

    // Simulate NFC card detection
    setTimeout(() => {
      setStatus('writing');
      
      // Simulate writing to card
      setTimeout(() => {
        setStatus('success');
        if (onSuccess) {
          onSuccess(nfcId);
        }
        
        // Auto close after success
        setTimeout(() => {
          onClose();
        }, 2000);
      }, 2000);
    }, 2000);
  };

  const handleRetry = () => {
    setStatus('idle');
    setErrorMessage('');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'scanning':
        return <Wifi className="h-16 w-16 text-primary animate-pulse" />;
      case 'writing':
        return <LogoLoader size="large" text={false} />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-16 w-16 text-destructive" />;
      default:
        return <CreditCard className="h-16 w-16 text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'scanning':
        return language === 'en' 
          ? 'Place the NFC card near the device...' 
          : 'ضع بطاقة NFC بالقرب من الجهاز...';
      case 'writing':
        return language === 'en' 
          ? 'Writing data to card...' 
          : 'جاري كتابة البيانات على البطاقة...';
      case 'success':
        return language === 'en' 
          ? 'Card programmed successfully!' 
          : 'تم برمجة البطاقة بنجاح!';
      case 'error':
        return errorMessage || (language === 'en' 
          ? 'Failed to program card' 
          : 'فشل في برمجة البطاقة');
      default:
        return language === 'en' 
          ? 'Ready to program NFC card' 
          : 'جاهز لبرمجة بطاقة NFC';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {language === 'en' ? 'NFC Card Programming' : 'برمجة بطاقة NFC'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en' 
              ? `Program an NFC card for ${userData.name}` 
              : `برمجة بطاقة NFC لـ ${userData.nameAr || userData.name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-8">
          {/* User Info Card */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{userData.name}</p>
                <p className="text-sm text-muted-foreground">{userData.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <Label className="text-muted-foreground">{language === 'en' ? 'Role' : 'الدور'}</Label>
                <p className="font-medium capitalize">{userData.role}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{language === 'en' ? 'NFC ID' : 'معرف NFC'}</Label>
                <p className="font-mono font-medium text-primary">{nfcId}</p>
              </div>
            </div>
          </div>

          {/* NFC Animation Area */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={status}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                {/* Background pulse animation for scanning */}
                {status === 'scanning' && (
                  <div className="absolute inset-0 -m-8">
                    <div className="h-32 w-32 bg-primary/20 rounded-full animate-ping" />
                  </div>
                )}
                
                {/* Icon */}
                <div className={cn(
                  "p-8 rounded-full transition-colors duration-300",
                  status === 'scanning' && "bg-primary/10",
                  status === 'writing' && "bg-primary/20",
                  status === 'success' && "bg-green-100",
                  status === 'error' && "bg-red-100",
                  status === 'idle' && "bg-muted"
                )}>
                  {getStatusIcon()}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Status Message */}
            <motion.p
              key={status}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "text-center font-medium transition-colors",
                status === 'success' && "text-green-600",
                status === 'error' && "text-destructive"
              )}
            >
              {getStatusMessage()}
            </motion.p>

            {/* Progress indicator for writing */}
            {status === 'writing' && (
              <div className="w-full max-w-xs">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, ease: 'linear' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          {status === 'idle' ? (
            <>
              <Button variant="outline" onClick={onClose}>
                {language === 'en' ? 'Cancel' : 'إلغاء'}
              </Button>
              <Button onClick={handleStartProgramming} className="gap-2">
                <CreditCard className="h-4 w-4" />
                {language === 'en' ? 'Start Programming' : 'بدء البرمجة'}
              </Button>
            </>
          ) : status === 'error' ? (
            <>
              <Button variant="outline" onClick={onClose}>
                {language === 'en' ? 'Cancel' : 'إلغاء'}
              </Button>
              <Button onClick={handleRetry} variant="destructive">
                {language === 'en' ? 'Retry' : 'إعادة المحاولة'}
              </Button>
            </>
          ) : status === 'success' ? (
            <Button onClick={onClose} className="w-full">
              {language === 'en' ? 'Done' : 'تم'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}