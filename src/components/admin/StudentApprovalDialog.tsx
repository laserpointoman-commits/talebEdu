import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, User, Mail, Phone, MapPin, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import StudentNFCDialog from './StudentNFCDialog';
import FeeConfigStep from './FeeConfigStep';

interface StudentApprovalDialogProps {
  student: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function StudentApprovalDialog({
  student,
  open,
  onOpenChange,
  onSuccess,
}: StudentApprovalDialogProps) {
  const { language } = useLanguage();
  const [processing, setProcessing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [nfcDialogOpen, setNfcDialogOpen] = useState(false);
  const [showNFCAfterApproval, setShowNFCAfterApproval] = useState(false);
  const [step, setStep] = useState(1); // 1: Review, 2: Fee Config, 3: Confirm
  const [feeConfig, setFeeConfig] = useState({
    amount: '',
    academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    fee_type: 'tuition',
    dueDate: '',
    discount: '0',
    discount_reason: '',
    enableInstallments: false,
    installments: '3',
    frequency: 'monthly'
  });

  const isRTL = language === 'ar';

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-student', {
        body: {
          studentId: student.id,
          approved: true,
          feeConfig: {
            amount: parseFloat(feeConfig.amount),
            academic_year: feeConfig.academic_year,
            fee_type: feeConfig.fee_type,
            due_date: feeConfig.dueDate,
            discount_amount: parseFloat(feeConfig.discount || '0'),
            discount_reason: feeConfig.discount_reason,
            installments: feeConfig.enableInstallments ? {
              total_installments: parseInt(feeConfig.installments),
              frequency: feeConfig.frequency
            } : null
          }
        },
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to approve student');
      }

      toast({
        title: language === 'en' ? 'Success!' : 'نجح!',
        description: language === 'en' ? 'Student approved successfully with fee configuration' : 'تمت الموافقة على الطالب بنجاح مع إعداد الرسوم',
      });

      // Show NFC dialog after approval
      setShowNFCAfterApproval(true);
      setTimeout(() => {
        setNfcDialogOpen(true);
      }, 500);

      onOpenChange(false);
      setStep(1);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'Error' : 'خطأ',
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'Rejection Reason Required' : 'سبب الرفض مطلوب',
        description: language === 'en' 
          ? 'Please provide a reason for rejection'
          : 'يرجى تقديم سبب للرفض',
      });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-student', {
        body: {
          studentId: student.id,
          approved: false,
          rejectionReason: rejectionReason,
        },
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to reject student');
      }

      toast({
        title: language === 'en' ? 'Student Rejected' : 'تم رفض الطالب',
        description: language === 'en' ? 'Parent has been notified' : 'تم إخطار ولي الأمر',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'Error' : 'خطأ',
        description: error.message,
      });
    } finally {
      setProcessing(false);
      setRejecting(false);
    }
  };

  if (!student) return null;

  const renderStepContent = () => {
    if (step === 1) {
      // Student Review Step
      return (
        <>
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{language === 'en' ? 'Current Status' : 'الحالة الحالية'}</h3>
              <Badge variant={student.approval_status === 'pending' ? 'secondary' : 'default'}>
                {student.approval_status === 'pending' ? (language === 'en' ? 'Pending' : 'قيد الانتظار') : student.approval_status}
              </Badge>
            </div>

            {/* Student Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {language === 'en' ? 'Full Name' : 'الاسم الكامل'}
                </Label>
                <p className="text-sm">{student.full_name}</p>
              </div>

              {student.full_name_ar && (
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Full Name (Arabic)' : 'الاسم الكامل (عربي)'}</Label>
                  <p className="text-sm" dir="rtl">{student.full_name_ar}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {language === 'en' ? 'Date of Birth' : 'تاريخ الميلاد'}
                </Label>
                <p className="text-sm">{student.date_of_birth}</p>
              </div>

              <div className="space-y-2">
                <Label>{language === 'en' ? 'Gender' : 'الجنس'}</Label>
                <p className="text-sm">{student.gender}</p>
              </div>

              <div className="space-y-2">
                <Label>{language === 'en' ? 'Class' : 'الصف'}</Label>
                <p className="text-sm">{student.class}</p>
              </div>

              <div className="space-y-2">
                <Label>{language === 'en' ? 'National ID' : 'الرقم الوطني'}</Label>
                <p className="text-sm">{student.national_id || 'N/A'}</p>
              </div>
            </div>

            {/* Parent Information */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">{language === 'en' ? 'Parent Information' : 'معلومات ولي الأمر'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {language === 'en' ? 'Parent Name' : 'اسم ولي الأمر'}
                  </Label>
                  <p className="text-sm">{student.parent?.full_name}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {language === 'en' ? 'Email' : 'البريد الإلكتروني'}
                  </Label>
                  <p className="text-sm">{student.parent?.email}</p>
                </div>

                {student.parent?.phone && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {language === 'en' ? 'Phone' : 'الهاتف'}
                    </Label>
                    <p className="text-sm">{student.parent.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      );
    } else if (step === 2) {
      // Fee Configuration Step
      return (
        <FeeConfigStep feeConfig={feeConfig} onFeeConfigChange={setFeeConfig} />
      );
    } else if (step === 3) {
      // Confirmation Step
      return (
        <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <h3 className="text-lg font-semibold">
            {language === 'en' ? 'Confirmation Summary' : 'ملخص التأكيد'}
          </h3>
          
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div><strong>{language === 'en' ? 'Student:' : 'الطالب:'}</strong> {student.full_name}</div>
            <div><strong>{language === 'en' ? 'Class:' : 'الصف:'}</strong> {student.class}</div>
            <div className="border-t pt-3 mt-3">
              <div><strong>{language === 'en' ? 'Fee Amount:' : 'مبلغ الرسوم:'}</strong> {feeConfig.amount} OMR</div>
              <div><strong>{language === 'en' ? 'Fee Type:' : 'نوع الرسوم:'}</strong> {feeConfig.fee_type}</div>
              <div><strong>{language === 'en' ? 'Due Date:' : 'تاريخ الاستحقاق:'}</strong> {feeConfig.dueDate}</div>
              {parseFloat(feeConfig.discount) > 0 && (
                <div><strong>{language === 'en' ? 'Discount:' : 'الخصم:'}</strong> {feeConfig.discount} OMR</div>
              )}
              {feeConfig.enableInstallments && (
                <div><strong>{language === 'en' ? 'Installments:' : 'الأقساط:'}</strong> {feeConfig.installments} x {feeConfig.frequency}</div>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {language === 'en' 
              ? 'Please review the information above and click "Approve" to confirm.'
              : 'يرجى مراجعة المعلومات أعلاه والنقر على "موافقة" للتأكيد.'}
          </p>
        </div>
      );
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto relative" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 rounded-t-lg" />
        <DialogHeader className="pt-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">
                {language === 'en' ? 'Student Approval' : 'موافقة الطالب'}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-all",
                      s <= step ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogDescription>
            {step === 1 && (language === 'en' ? 'Review student information' : 'مراجعة معلومات الطالب')}
            {step === 2 && (language === 'en' ? 'Configure fee details' : 'إعداد تفاصيل الرسوم')}
            {step === 3 && (language === 'en' ? 'Confirm and approve' : 'التأكيد والموافقة')}
          </DialogDescription>
        </DialogHeader>

        {renderStepContent()}

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{language === 'en' ? 'Current Status' : 'الحالة الحالية'}</h3>
            <Badge variant={student.approval_status === 'pending' ? 'secondary' : 'default'}>
              {student.approval_status === 'pending' ? (language === 'en' ? 'Pending' : 'قيد الانتظار') : student.approval_status}
            </Badge>
          </div>

          {/* Student Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {language === 'en' ? 'Full Name' : 'الاسم الكامل'}
              </Label>
              <p className="text-sm">{student.full_name}</p>
            </div>

            {student.full_name_ar && (
              <div className="space-y-2">
                <Label>{language === 'en' ? 'Full Name (Arabic)' : 'الاسم الكامل (عربي)'}</Label>
                <p className="text-sm" dir="rtl">{student.full_name_ar}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {language === 'en' ? 'Date of Birth' : 'تاريخ الميلاد'}
              </Label>
              <p className="text-sm">{student.date_of_birth}</p>
            </div>

            <div className="space-y-2">
              <Label>{language === 'en' ? 'Gender' : 'الجنس'}</Label>
              <p className="text-sm">{student.gender}</p>
            </div>

            <div className="space-y-2">
              <Label>{language === 'en' ? 'Class' : 'الصف'}</Label>
              <p className="text-sm">{student.class}</p>
            </div>

            <div className="space-y-2">
              <Label>{language === 'en' ? 'National ID' : 'الرقم الوطني'}</Label>
              <p className="text-sm">{student.national_id || 'N/A'}</p>
            </div>
          </div>

          {/* Parent Information */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">{language === 'en' ? 'Parent Information' : 'معلومات ولي الأمر'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {language === 'en' ? 'Parent Email' : 'بريد ولي الأمر'}
                </Label>
                <p className="text-sm">{student.parent_email || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {language === 'en' ? 'Parent Phone' : 'هاتف ولي الأمر'}
                </Label>
                <p className="text-sm">{student.parent_phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Address Information */}
          {student.address && (
            <div className="border-t pt-4">
              <Label className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" />
                {language === 'en' ? 'Address' : 'العنوان'}
              </Label>
              <p className="text-sm text-muted-foreground">{student.address}</p>
            </div>
          )}

          {/* Medical Information */}
          {(student.medical_conditions || student.allergies) && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">{language === 'en' ? 'Medical Information' : 'المعلومات الطبية'}</h3>
              {student.medical_conditions && (
                <div className="space-y-2 mb-3">
                  <Label>{language === 'en' ? 'Medical Conditions' : 'الحالات الطبية'}</Label>
                  <p className="text-sm text-muted-foreground">{student.medical_conditions}</p>
                </div>
              )}
              {student.allergies && (
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Allergies' : 'الحساسية'}</Label>
                  <p className="text-sm text-muted-foreground">{student.allergies}</p>
                </div>
              )}
            </div>
          )}

          {/* Rejection Reason */}
          {rejecting && (
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="rejectionReason" className="text-destructive">
                {language === 'en' ? 'Rejection Reason *' : 'سبب الرفض *'}
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={language === 'en' 
                  ? 'Please provide a clear reason for rejection...'
                  : 'يرجى تقديم سبب واضح للرفض...'}
                rows={4}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!rejecting ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={processing}
              >
                {language === 'en' ? 'Cancel' : 'إلغاء'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejecting(true)}
                disabled={processing}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Reject' : 'رفض'}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={processing}
              >
                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {!processing && <CheckCircle2 className="w-4 h-4 mr-2" />}
                {language === 'en' ? 'Approve' : 'موافقة'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setRejecting(false);
                  setRejectionReason('');
                }}
                disabled={processing}
              >
                {language === 'en' ? 'Back' : 'رجوع'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processing}
              >
                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {language === 'en' ? 'Confirm Rejection' : 'تأكيد الرفض'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* NFC Dialog after approval */}
    {showNFCAfterApproval && (
      <StudentNFCDialog
        student={student}
        open={nfcDialogOpen}
        onOpenChange={setNfcDialogOpen}
      />
    )}
    </>
  );
}
