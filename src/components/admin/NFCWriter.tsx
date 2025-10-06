import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wifi, Tag, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { nfcService, NFCData } from '@/services/nfcService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function NFCWriter() {
  const { language } = useLanguage();
  const [isWriting, setIsWriting] = useState(false);
  const [writeSuccess, setWriteSuccess] = useState(false);
  const [nfcData, setNfcData] = useState<Partial<NFCData>>({
    type: 'student'
  });

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
          // Reset form
          setNfcData({ type: 'student' });
        }, 3000);
      }
    } catch (error) {
      console.error('Write error:', error);
    } finally {
      setIsWriting(false);
    }
  };

  const isNFCSupported = nfcService.isSupported();

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
          <div className={`p-4 rounded-lg border ${isNFCSupported ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
            <div className="flex items-center gap-3">
              {isNFCSupported ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              <div>
                <p className="font-medium">
                  {isNFCSupported 
                    ? (language === 'ar' ? 'NFC متاح' : 'NFC Available')
                    : (language === 'ar' ? 'NFC غير متاح' : 'NFC Not Available')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isNFCSupported 
                    ? (language === 'ar' ? 'الجهاز يدعم NFC' : 'Device supports NFC')
                    : (language === 'ar' ? 'يتطلب جهاز بميزة NFC' : 'Requires NFC-enabled device')}
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
                  <SelectItem value="student">
                    {language === 'ar' ? 'طالب' : 'Student'}
                  </SelectItem>
                  <SelectItem value="teacher">
                    {language === 'ar' ? 'معلم' : 'Teacher'}
                  </SelectItem>
                  <SelectItem value="driver">
                    {language === 'ar' ? 'سائق' : 'Driver'}
                  </SelectItem>
                  <SelectItem value="employee">
                    {language === 'ar' ? 'موظف' : 'Employee'}
                  </SelectItem>
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

          {/* Write Animation */}
          <AnimatePresence>
            {isWriting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-8 bg-primary/5 rounded-lg border border-primary/20"
              >
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Wifi className="h-16 w-16 text-primary mx-auto" />
                  </motion.div>
                  <p className="text-lg font-medium">
                    {language === 'ar' ? 'جاري الكتابة...' : 'Writing to NFC tag...'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'ضع البطاقة بالقرب من الجهاز' : 'Hold tag near device'}
                  </p>
                </div>
              </motion.div>
            )}

            {writeSuccess && !isWriting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-8 bg-green-500/10 rounded-lg border border-green-500/20"
              >
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                  </motion.div>
                  <p className="text-lg font-medium text-green-600">
                    {language === 'ar' ? 'تمت الكتابة بنجاح!' : 'Successfully Written!'}
                  </p>
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-sm">
                      {nfcData.type?.toUpperCase()} - {nfcData.id}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{nfcData.name}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Write Button */}
          {!isWriting && !writeSuccess && (
            <Button
              onClick={handleWrite}
              disabled={!isNFCSupported || isWriting}
              className="w-full"
              size="lg"
            >
              {isWriting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'ar' ? 'جاري الكتابة...' : 'Writing...'}
                </>
              ) : (
                <>
                  <Tag className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'كتابة البطاقة' : 'Write Tag'}
                </>
              )}
            </Button>
          )}

          {/* Instructions */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">
              {language === 'ar' ? 'تعليمات:' : 'Instructions:'}
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                {language === 'ar' 
                  ? 'املأ جميع الحقول المطلوبة'
                  : 'Fill in all required fields'}
              </li>
              <li>
                {language === 'ar' 
                  ? 'اضغط على "كتابة البطاقة"'
                  : 'Click "Write Tag" button'}
              </li>
              <li>
                {language === 'ar' 
                  ? 'ضع بطاقة NFC الفارغة بالقرب من الجهاز'
                  : 'Hold blank NFC tag near device'}
              </li>
              <li>
                {language === 'ar' 
                  ? 'انتظر حتى تظهر رسالة النجاح'
                  : 'Wait for success confirmation'}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
