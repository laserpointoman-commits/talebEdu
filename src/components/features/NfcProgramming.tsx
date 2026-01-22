import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CreditCard, CheckCircle, AlertCircle, Wifi, User, Loader2, WifiOff } from 'lucide-react';
import LogoLoader from '@/components/LogoLoader';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { nfcService, NFCData } from '@/services/nfcService';
import { toast } from 'sonner';

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
  const [status, setStatus] = useState<'idle' | 'checking' | 'scanning' | 'writing' | 'success' | 'error'>('idle');
  const [nfcId, setNfcId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isNFCSupported, setIsNFCSupported] = useState(false);
  const [checkingNfc, setCheckingNfc] = useState(true);

  // Check NFC support when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setNfcId(userData.nfcId || generateNfcId());
      setErrorMessage('');
      checkNFCSupport();
    }
  }, [isOpen, userData]);

  const checkNFCSupport = async () => {
    setCheckingNfc(true);
    try {
      const supported = await nfcService.isSupportedAsync();
      setIsNFCSupported(supported);
    } catch (error) {
      console.error('Error checking NFC support:', error);
      setIsNFCSupported(false);
    } finally {
      setCheckingNfc(false);
    }
  };

  const generateNfcId = () => {
    const prefixMap: Record<string, string> = {
      teacher: 'TCH',
      student: 'STD',
      driver: 'DRV',
      employee: 'EMP',
      admin: 'ADM',
    };
    const prefix = prefixMap[userData.role] || 'USR';
    const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    return `${prefix}-${random}`;
  };

  const handleStartProgramming = async () => {
    // Check if NFC is supported first
    if (!isNFCSupported) {
      setStatus('error');
      setErrorMessage(
        language === 'en'
          ? 'NFC is not supported on this device. Please use an NFC-enabled device.'
          : 'NFC غير مدعوم على هذا الجهاز. يرجى استخدام جهاز يدعم NFC.'
      );
      toast.error(language === 'en' ? 'NFC not supported' : 'NFC غير مدعوم');
      return;
    }

    setStatus('scanning');
    setErrorMessage('');

    try {
      // Prepare NFC data to write
      const nfcData: NFCData = {
        id: nfcId,
        type: userData.role as 'student' | 'teacher' | 'driver' | 'employee',
        name: userData.name.substring(0, 20), // Truncate to save space on NFC tag
        additionalData: {
          entityId: userData.entityId,
          email: userData.email,
        },
      };

      setStatus('writing');

      // Actually write to NFC tag using the real service
      const success = await nfcService.writeTag(nfcData);

      if (success) {
        setStatus('success');
        toast.success(
          language === 'en' 
            ? 'NFC card programmed successfully!' 
            : 'تم برمجة بطاقة NFC بنجاح!'
        );
        
        if (onSuccess) {
          onSuccess(nfcId);
        }

        // Auto close after success
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error('Write operation failed');
      }
    } catch (error) {
      console.error('NFC programming error:', error);
      setStatus('error');
      setErrorMessage(
        language === 'en'
          ? 'Failed to program NFC card. Please ensure the card is properly positioned and try again.'
          : 'فشل في برمجة بطاقة NFC. يرجى التأكد من وضع البطاقة بشكل صحيح والمحاولة مرة أخرى.'
      );
      toast.error(language === 'en' ? 'NFC programming failed' : 'فشل برمجة NFC');
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setErrorMessage('');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-16 w-16 text-primary animate-spin" />;
      case 'scanning':
        return <Wifi className="h-16 w-16 text-primary animate-pulse" />;
      case 'writing':
        return <LogoLoader size="large" text={false} />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-16 w-16 text-destructive" />;
      default:
        return isNFCSupported ? (
          <CreditCard className="h-16 w-16 text-muted-foreground" />
        ) : (
          <WifiOff className="h-16 w-16 text-orange-500" />
        );
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        return language === 'en' 
          ? 'Checking NFC availability...' 
          : 'جاري التحقق من توفر NFC...';
      case 'scanning':
        return language === 'en' 
          ? 'Place the NFC card near the device...' 
          : 'ضع بطاقة NFC بالقرب من الجهاز...';
      case 'writing':
        return language === 'en' 
          ? 'Writing data to card... Keep card steady' 
          : 'جاري كتابة البيانات على البطاقة... حافظ على ثبات البطاقة';
      case 'success':
        return language === 'en' 
          ? 'Card programmed successfully!' 
          : 'تم برمجة البطاقة بنجاح!';
      case 'error':
        return errorMessage || (language === 'en' 
          ? 'Failed to program card' 
          : 'فشل في برمجة البطاقة');
      default:
        if (checkingNfc) {
          return language === 'en' 
            ? 'Checking device NFC capability...' 
            : 'جاري فحص قدرة NFC للجهاز...';
        }
        if (!isNFCSupported) {
          return language === 'en' 
            ? 'NFC is not available on this device' 
            : 'NFC غير متاح على هذا الجهاز';
        }
        return language === 'en' 
          ? 'Ready to program NFC card' 
          : 'جاهز لبرمجة بطاقة NFC';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/*
        NOTE: Do not set `overflow-hidden` here.
        On CM30/Android WebViews it prevents the dialog from scrolling.
        Our base DialogContent already provides `max-h` + `overflow-y-auto`.
      */}
      <DialogContent className="sm:max-w-[500px]">
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
          {/* NFC Support Status Banner */}
          {!checkingNfc && (
            <div className={cn(
              "mb-6 p-3 rounded-lg border flex items-center gap-3",
              isNFCSupported 
                ? "bg-green-500/10 border-green-500/20" 
                : "bg-orange-500/10 border-orange-500/20"
            )}>
              {isNFCSupported ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              ) : (
                <WifiOff className="h-5 w-5 text-orange-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {isNFCSupported 
                    ? (language === 'en' ? 'NFC Available' : 'NFC متاح')
                    : (language === 'en' ? 'NFC Not Available' : 'NFC غير متاح')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isNFCSupported 
                    ? (language === 'en' ? 'Ready to write to NFC tags' : 'جاهز للكتابة على بطاقات NFC')
                    : (language === 'en' ? 'Use an NFC-enabled mobile device' : 'استخدم جهاز محمول يدعم NFC')}
                </p>
              </div>
            </div>
          )}

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
                
                {/* Loading spinner for checking */}
                {checkingNfc && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                  </div>
                )}
                
                {/* Icon */}
                {!checkingNfc && (
                  <div className={cn(
                    "p-8 rounded-full transition-colors duration-300",
                    status === 'scanning' && "bg-primary/10",
                    status === 'writing' && "bg-primary/20",
                    status === 'success' && "bg-green-100",
                    status === 'error' && "bg-red-100",
                    status === 'idle' && !isNFCSupported && "bg-orange-100",
                    status === 'idle' && isNFCSupported && "bg-muted"
                  )}>
                    {getStatusIcon()}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Status Message */}
            <motion.p
              key={status + String(checkingNfc)}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "text-center font-medium transition-colors",
                status === 'success' && "text-green-600",
                status === 'error' && "text-destructive",
                !isNFCSupported && status === 'idle' && "text-orange-600"
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
                    transition={{ duration: 3, ease: 'linear' }}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  {language === 'en' ? 'Do not remove the card' : 'لا تزل البطاقة'}
                </p>
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
              <Button 
                onClick={handleStartProgramming} 
                className="gap-2"
                disabled={checkingNfc || !isNFCSupported}
              >
                {checkingNfc ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
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
          ) : (
            <Button variant="outline" onClick={onClose} disabled={status === 'writing'}>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

