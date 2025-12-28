import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tag, Wifi, Copy, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { nfcService } from '@/services/nfcService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentNFCDialogProps {
  student: {
    id: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    student_id?: string;
    nfc_id?: string;
    class?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StudentNFCDialog({ student, open, onOpenChange }: StudentNFCDialogProps) {
  const { language } = useLanguage();
  const [isWriting, setIsWriting] = useState(false);
  const [writeSuccess, setWriteSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isNFCSupported, setIsNFCSupported] = useState(false);
  const [checkingNfc, setCheckingNfc] = useState(true);

  // Check NFC support when dialog opens
  useEffect(() => {
    if (open) {
      const checkSupport = async () => {
        setCheckingNfc(true);
        await new Promise((resolve) => setTimeout(resolve, 300));
        const supported = await nfcService.isSupportedAsync();
        setIsNFCSupported(supported);
        setCheckingNfc(false);
      };
      checkSupport();
    }
  }, [open]);

  if (!student) return null;

  const studentName = student.full_name || `${student.first_name} ${student.last_name}`;

  const handleCopyNFC = () => {
    if (student.nfc_id) {
      navigator.clipboard.writeText(student.nfc_id);
      setCopied(true);
      toast.success(language === 'en' ? 'NFC ID copied!' : 'تم نسخ رقم NFC!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWriteNFC = async () => {
    if (!student.nfc_id) {
      toast.error(language === 'en' ? 'No NFC ID assigned' : 'لم يتم تعيين رقم NFC');
      return;
    }

    setIsWriting(true);
    setWriteSuccess(false);

    try {
      // Write minimal data to fit on NFC tag (most tags have 48-144 bytes)
      // Just write the NFC ID - the app will look up full student info from database
      const success = await nfcService.writeTag({
        id: student.nfc_id,
        type: 'student',
        name: studentName.substring(0, 20), // Truncate name to save space
      });

      if (success) {
        setWriteSuccess(true);
        setTimeout(() => setWriteSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Write error:', error);
    } finally {
      setIsWriting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            {language === 'en' ? 'NFC Tag Management' : 'إدارة بطاقة NFC'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en' 
              ? 'View and write NFC tag for this student'
              : 'عرض وكتابة بطاقة NFC لهذا الطالب'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Student Name' : 'اسم الطالب'}
                </p>
                <p className="font-medium">{studentName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Student ID' : 'رقم الطالب'}
                </p>
                <p className="font-medium">{student.student_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Class' : 'الصف'}
                </p>
                <p className="font-medium">{student.class}</p>
              </div>
            </CardContent>
          </Card>

          {/* NFC ID Display */}
          {student.nfc_id ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'en' ? 'NFC Serial Number' : 'الرقم التسلسلي NFC'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyNFC}
                    className="h-8"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="font-mono text-lg font-bold text-primary break-all">
                  {student.nfc_id}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardContent className="pt-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <p className="text-sm">
                  {language === 'en' 
                    ? 'No NFC ID assigned yet. Approve the student first.'
                    : 'لم يتم تعيين رقم NFC بعد. قم بالموافقة على الطالب أولاً.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* NFC Status */}
          <div className={`p-4 rounded-lg border ${
            checkingNfc ? 'bg-blue-500/10 border-blue-500/20' :
            isNFCSupported 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-orange-500/10 border-orange-500/20'
          }`}>
            <div className="flex items-center gap-3">
              {checkingNfc ? (
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
              ) : isNFCSupported ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium">
                  {checkingNfc ? (language === 'en' ? 'Checking NFC...' : 'جاري فحص NFC...') :
                   isNFCSupported 
                    ? (language === 'en' ? 'NFC Available' : 'NFC متاح')
                    : (language === 'en' ? 'NFC Not Available' : 'NFC غير متاح')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {checkingNfc ? (language === 'en' ? 'Detecting device capabilities' : 'فحص إمكانيات الجهاز') :
                   isNFCSupported 
                    ? (language === 'en' ? 'Ready to write tag' : 'جاهز لكتابة البطاقة')
                    : (language === 'en' ? 'NFC-enabled device required' : 'يتطلب جهاز بميزة NFC')}
                </p>
              </div>
            </div>
          </div>

          {/* Write Button */}
          <AnimatePresence mode="wait">
            {writeSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-3 py-4"
              >
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <p className="font-medium text-green-600">
                  {language === 'en' ? 'NFC Tag Written Successfully!' : 'تمت كتابة بطاقة NFC بنجاح!'}
                </p>
              </motion.div>
            ) : (
              <Button
                key="write"
                onClick={handleWriteNFC}
                disabled={isWriting || !student.nfc_id || !isNFCSupported}
                className="w-full h-12"
                size="lg"
              >
                {isWriting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {language === 'en' ? 'Hold tag near device...' : 'قرب البطاقة من الجهاز...'}
                  </>
                ) : (
                  <>
                    <Wifi className="w-5 h-5 mr-2" />
                    {language === 'en' ? 'Write to NFC Tag' : 'كتابة إلى بطاقة NFC'}
                  </>
                )}
              </Button>
            )}
          </AnimatePresence>

          {/* Instructions */}
          {student.nfc_id && isNFCSupported && (
            <div className="text-sm text-muted-foreground space-y-2 border-t pt-4">
              <p className="font-medium">
                {language === 'en' ? 'Instructions:' : 'التعليمات:'}
              </p>
              <ol className={`list-decimal ${language === 'en' ? 'list-inside' : 'list-outside pr-5'} space-y-1`}>
                <li>{language === 'en' ? 'Click "Write to NFC Tag"' : 'انقر على "كتابة إلى بطاقة NFC"'}</li>
                <li>{language === 'en' ? 'Hold the NFC tag near your device' : 'قرب بطاقة NFC من جهازك'}</li>
                <li>{language === 'en' ? 'Keep steady until write completes' : 'حافظ على الثبات حتى تكتمل الكتابة'}</li>
              </ol>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
