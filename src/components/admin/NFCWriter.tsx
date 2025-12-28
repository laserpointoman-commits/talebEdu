import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wifi, Tag, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { nfcService, NFCData } from '@/services/nfcService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function NFCWriter() {
  const { language } = useLanguage();
  const [isWriting, setIsWriting] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [writeSuccess, setWriteSuccess] = useState(false);
  const [eraseSuccess, setEraseSuccess] = useState(false);
  const [isNFCSupported, setIsNFCSupported] = useState(false);
  const [checkingNfc, setCheckingNfc] = useState(true);
  const [nfcData, setNfcData] = useState<Partial<NFCData>>({
    type: 'student'
  });

  useEffect(() => {
    const checkSupport = async () => {
      setCheckingNfc(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      const supported = await nfcService.isSupportedAsync();
      setIsNFCSupported(supported);
      setCheckingNfc(false);
    };
    checkSupport();
  }, []);

  const handleWrite = async () => {
    if (!nfcData.id || !nfcData.name || !nfcData.type) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }

    setIsWriting(true);
    setWriteSuccess(false);

    try {
      const success = await nfcService.writeTag(nfcData as NFCData);
      
      if (success) {
        setWriteSuccess(true);
        setTimeout(() => {
          setWriteSuccess(false);
          setNfcData({ type: 'student' });
        }, 3000);
      }
    } catch (error) {
      console.error('Write error:', error);
    } finally {
      setIsWriting(false);
    }
  };

  const handleErase = async () => {
    setIsErasing(true);
    setEraseSuccess(false);

    try {
      const success = await nfcService.eraseTag();
      
      if (success) {
        setEraseSuccess(true);
        setTimeout(() => {
          setEraseSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Erase error:', error);
    } finally {
      setIsErasing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {language === 'ar' ? 'كتابة بطاقة NFC' : 'NFC Tag Writer'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'برمجة بطاقات NFC للطلاب والمعلمين والموظفين'
              : 'Program NFC tags for students, teachers, and employees'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* NFC Status */}
          <div className={`p-4 rounded-lg border ${
            checkingNfc ? 'bg-blue-500/10 border-blue-500/20' :
            isNFCSupported ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'
          }`}>
            <div className="flex items-center gap-3">
              {checkingNfc ? (
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              ) : isNFCSupported ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              <div>
                <p className="font-medium">
                  {checkingNfc ? (language === 'ar' ? 'جاري الفحص...' : 'Checking...') :
                   isNFCSupported 
                    ? (language === 'ar' ? 'NFC متاح' : 'NFC Available')
                    : (language === 'ar' ? 'NFC غير متاح' : 'NFC Not Available')}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label>{language === 'ar' ? 'النوع' : 'Type'}</Label>
              <Select
                value={nfcData.type}
                onValueChange={(value: any) => setNfcData({ ...nfcData, type: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">{language === 'ar' ? 'طالب' : 'Student'}</SelectItem>
                  <SelectItem value="teacher">{language === 'ar' ? 'معلم' : 'Teacher'}</SelectItem>
                  <SelectItem value="driver">{language === 'ar' ? 'سائق' : 'Driver'}</SelectItem>
                  <SelectItem value="employee">{language === 'ar' ? 'موظف' : 'Employee'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{language === 'ar' ? 'رقم التعريف' : 'ID Number'}</Label>
              <Input
                value={nfcData.id || ''}
                onChange={(e) => setNfcData({ ...nfcData, id: e.target.value })}
                placeholder={language === 'ar' ? 'مثال: STU-001234' : 'e.g., STU-001234'}
                className="mt-2"
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</Label>
              <Input
                value={nfcData.name || ''}
                onChange={(e) => setNfcData({ ...nfcData, name: e.target.value })}
                placeholder={language === 'ar' ? 'أدخل الاسم الكامل' : 'Enter full name'}
                className="mt-2"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
          </div>

          {/* Status Animations */}
          <AnimatePresence>
            {(isWriting || isErasing) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-8 bg-primary/5 rounded-lg border border-primary/20"
              >
                <div className="text-center space-y-4">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Wifi className="h-16 w-16 text-primary mx-auto" />
                  </motion.div>
                  <p className="text-lg font-medium">
                    {isErasing 
                      ? (language === 'ar' ? 'جاري مسح البطاقة...' : 'Erasing NFC tag...')
                      : (language === 'ar' ? 'جاري الكتابة...' : 'Writing to NFC tag...')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'ضع البطاقة بالقرب من الجهاز' : 'Hold tag near device'}
                  </p>
                </div>
              </motion.div>
            )}

            {(writeSuccess || eraseSuccess) && !isWriting && !isErasing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-8 bg-green-500/10 rounded-lg border border-green-500/20"
              >
                <div className="text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                  <p className="text-lg font-medium text-green-600">
                    {eraseSuccess 
                      ? (language === 'ar' ? 'تم مسح البطاقة بنجاح!' : 'Tag Erased Successfully!')
                      : (language === 'ar' ? 'تمت الكتابة بنجاح!' : 'Successfully Written!')}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          {!isWriting && !isErasing && !writeSuccess && !eraseSuccess && (
            <div className="flex gap-3">
              <Button onClick={handleWrite} disabled={!isNFCSupported} className="flex-1" size="lg">
                <Tag className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'كتابة البطاقة' : 'Write Tag'}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={!isNFCSupported} size="lg">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'مسح' : 'Erase'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {language === 'ar' ? 'تأكيد مسح البطاقة' : 'Confirm Erase NFC Card'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {language === 'ar' 
                        ? 'هل أنت متأكد من مسح هذه البطاقة؟ سيتم حذف جميع البيانات المخزنة عليها ولا يمكن التراجع عن هذا الإجراء.'
                        : 'Are you sure you want to erase this NFC card? All stored data will be permanently deleted and this action cannot be undone.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleErase} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {language === 'ar' ? 'نعم، امسح البطاقة' : 'Yes, Erase Card'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
