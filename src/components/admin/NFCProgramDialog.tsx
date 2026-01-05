import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Wifi, CheckCircle, Edit, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { nfcService, NFCData } from '@/services/nfcService';
import { motion } from 'framer-motion';

interface NFCProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountType: 'student' | 'employee' | 'supervisor' | 'driver' | 'teacher';
  accountId: string;
  accountName: string;
  currentNfcId?: string;
  onNfcAssigned: (nfcId: string) => void;
}

export default function NFCProgramDialog({
  open,
  onOpenChange,
  accountType,
  accountId,
  accountName,
  currentNfcId,
  onNfcAssigned,
}: NFCProgramDialogProps) {
  const { language } = useLanguage();
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [manualNfcId, setManualNfcId] = useState('');
  const [scannedNfcId, setScannedNfcId] = useState<string | null>(null);
  const [isProgramming, setIsProgramming] = useState(false);

  const handleScanNfc = async () => {
    setIsScanning(true);
    setScannedNfcId(null);
    
    try {
      const nfcData = await nfcService.readOnce();
      setScannedNfcId(nfcData.id);
      toast.success(language === 'ar' ? 'تم قراءة البطاقة' : 'Card read successfully');
    } catch (error) {
      console.error('NFC scan error:', error);
      toast.error(language === 'ar' ? 'فشل قراءة البطاقة' : 'Failed to read card');
    } finally {
      setIsScanning(false);
    }
  };

  const handleProgramCard = async () => {
    const nfcIdToUse = mode === 'scan' ? scannedNfcId : manualNfcId.trim();
    
    if (!nfcIdToUse) {
      toast.error(language === 'ar' ? 'يرجى مسح أو إدخال معرف NFC' : 'Please scan or enter NFC ID');
      return;
    }

    setIsProgramming(true);
    
    try {
      // Write data to NFC card
      const dataToWrite: NFCData = {
        id: nfcIdToUse,
        type: accountType === 'student' ? 'student' : 
              accountType === 'driver' ? 'driver' :
              accountType === 'teacher' ? 'teacher' : 'employee',
        name: accountName,
        additionalData: {
          accountId,
          programmedAt: new Date().toISOString(),
        }
      };

      const success = await nfcService.writeTag(dataToWrite);
      
      if (success) {
        onNfcAssigned(nfcIdToUse);
        onOpenChange(false);
        toast.success(language === 'ar' ? 'تم برمجة البطاقة بنجاح' : 'Card programmed successfully');
      }
    } catch (error) {
      console.error('Error programming card:', error);
      toast.error(language === 'ar' ? 'فشل برمجة البطاقة' : 'Failed to program card');
    } finally {
      setIsProgramming(false);
    }
  };

  const handleLinkOnly = () => {
    const nfcIdToUse = mode === 'scan' ? scannedNfcId : manualNfcId.trim();
    
    if (!nfcIdToUse) {
      toast.error(language === 'ar' ? 'يرجى مسح أو إدخال معرف NFC' : 'Please scan or enter NFC ID');
      return;
    }

    onNfcAssigned(nfcIdToUse);
    onOpenChange(false);
    toast.success(language === 'ar' ? 'تم ربط البطاقة بالحساب' : 'Card linked to account');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {language === 'ar' ? 'ربط بطاقة NFC' : 'Link NFC Card'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Account Info */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {language === 'ar' ? 'الحساب:' : 'Account:'}
              </span>
              <span className="font-medium">{accountName}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-muted-foreground">
                {language === 'ar' ? 'النوع:' : 'Type:'}
              </span>
              <Badge variant="secondary">{accountType}</Badge>
            </div>
            {currentNfcId && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'NFC الحالي:' : 'Current NFC:'}
                </span>
                <code className="text-xs">{currentNfcId}</code>
              </div>
            )}
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'scan' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scan" className="gap-2">
                <Wifi className="h-4 w-4" />
                {language === 'ar' ? 'مسح' : 'Scan'}
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2">
                <Edit className="h-4 w-4" />
                {language === 'ar' ? 'يدوي' : 'Manual'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scan" className="space-y-4">
              <div className="text-center py-6">
                {isScanning ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex justify-center mb-4"
                  >
                    <Wifi className="h-16 w-16 text-primary" />
                  </motion.div>
                ) : scannedNfcId ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <p className="font-medium">{language === 'ar' ? 'تم قراءة البطاقة' : 'Card Scanned'}</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{scannedNfcId}</code>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <CreditCard className="h-16 w-16 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">
                      {language === 'ar' ? 'اضغط للمسح' : 'Tap to scan'}
                    </p>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleScanNfc} 
                disabled={isScanning} 
                className="w-full"
                variant={scannedNfcId ? "outline" : "default"}
              >
                <Wifi className="mr-2 h-4 w-4" />
                {isScanning 
                  ? (language === 'ar' ? 'جاري المسح...' : 'Scanning...') 
                  : scannedNfcId 
                    ? (language === 'ar' ? 'إعادة المسح' : 'Scan Again')
                    : (language === 'ar' ? 'مسح البطاقة' : 'Scan Card')}
              </Button>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'معرف NFC' : 'NFC ID'}</Label>
                <Input
                  value={manualNfcId}
                  onChange={(e) => setManualNfcId(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل معرف NFC' : 'Enter NFC ID'}
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' 
                    ? 'أدخل معرف البطاقة المطبوع عليها أو المعروف'
                    : 'Enter the card ID printed on it or known'}
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Warning */}
          {currentNfcId && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
              <p className="text-sm text-orange-600">
                {language === 'ar' 
                  ? 'سيتم استبدال بطاقة NFC الحالية'
                  : 'This will replace the current NFC card'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleLinkOnly}
            disabled={isProgramming || (mode === 'scan' && !scannedNfcId) || (mode === 'manual' && !manualNfcId.trim())}
          >
            {language === 'ar' ? 'ربط فقط' : 'Link Only'}
          </Button>
          <Button 
            onClick={handleProgramCard}
            disabled={isProgramming || (mode === 'scan' && !scannedNfcId) || (mode === 'manual' && !manualNfcId.trim())}
          >
            {isProgramming 
              ? (language === 'ar' ? 'جاري البرمجة...' : 'Programming...') 
              : (language === 'ar' ? 'برمجة البطاقة' : 'Program Card')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}