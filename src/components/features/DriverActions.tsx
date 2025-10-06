import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AlertCircle, Clock, Phone, CheckCircle } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  nameAr: string;
  location: string;
  locationAr: string;
  parentPhone: string;
  status: 'waiting' | 'picked' | 'dropped' | 'absent';
}

interface DriverActionsProps {
  students: Student[];
  onUpdateStudent: (studentId: string, status: 'absent' | 'picked' | 'dropped') => void;
}

export default function DriverActions({ students, onUpdateStudent }: DriverActionsProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [absenceModal, setAbsenceModal] = useState(false);
  const [delayModal, setDelayModal] = useState(false);
  const [emergencyModal, setEmergencyModal] = useState(false);
  const [endRouteModal, setEndRouteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [absenceReason, setAbsenceReason] = useState('');
  const [customAbsenceReason, setCustomAbsenceReason] = useState('');
  const [showCustomReasonDialog, setShowCustomReasonDialog] = useState(false);
  const [delayReason, setDelayReason] = useState('');
  const [delayMinutes, setDelayMinutes] = useState('');
  const [emergencyType, setEmergencyType] = useState('');

  const handleMarkAbsent = () => {
    if (!selectedStudent || !absenceReason) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى اختيار الطالب وسبب الغياب' : 'Please select a student and reason',
        variant: 'destructive',
      });
      return;
    }

    if (absenceReason === 'other' && !customAbsenceReason) {
      setShowCustomReasonDialog(true);
      return;
    }

    const finalReason = absenceReason === 'other' ? customAbsenceReason : absenceReason;
    onUpdateStudent(selectedStudent, 'absent');
    
    const student = students.find(s => s.id === selectedStudent);
    toast({
      title: language === 'ar' ? 'تم التسجيل' : 'Recorded',
      description: language === 'ar' 
        ? `تم تسجيل غياب ${student?.nameAr || ''} - السبب: ${finalReason}`
        : `${student?.name || ''} marked absent - Reason: ${finalReason}`,
      variant: 'success',
    });

    setAbsenceModal(false);
    setSelectedStudent('');
    setAbsenceReason('');
    setCustomAbsenceReason('');
  };

  const handleCustomReasonSubmit = () => {
    if (!customAbsenceReason.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى إدخال سبب الغياب' : 'Please enter absence reason',
        variant: 'destructive',
      });
      return;
    }

    onUpdateStudent(selectedStudent, 'absent');
    
    const student = students.find(s => s.id === selectedStudent);
    toast({
      title: language === 'ar' ? 'تم التسجيل' : 'Recorded',
      description: language === 'ar' 
        ? `تم تسجيل غياب ${student?.nameAr || ''} - السبب: ${customAbsenceReason}`
        : `${student?.name || ''} marked absent - Reason: ${customAbsenceReason}`,
      variant: 'success',
    });

    setShowCustomReasonDialog(false);
    setAbsenceModal(false);
    setSelectedStudent('');
    setAbsenceReason('');
    setCustomAbsenceReason('');
  };

  const handleReportDelay = () => {
    if (!delayMinutes || !delayReason) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى إدخال التفاصيل المطلوبة' : 'Please enter required details',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: language === 'ar' ? 'تم الإبلاغ' : 'Reported',
      description: language === 'ar' ? `تم الإبلاغ عن تأخير ${delayMinutes} دقيقة` : `Delay of ${delayMinutes} minutes reported`,
      variant: 'info',
    });

    // Send notification to parents
    toast({
      title: language === 'ar' ? 'إشعار' : 'Notification',
      description: language === 'ar' ? 'تم إرسال إشعار لأولياء الأمور' : 'Parents have been notified',
    });

    setDelayModal(false);
    setDelayMinutes('');
    setDelayReason('');
  };

  const handleEmergencyContact = () => {
    if (!emergencyType) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى اختيار نوع الطوارئ' : 'Please select emergency type',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: language === 'ar' ? 'اتصال طارئ' : 'Emergency Contact',
      description: language === 'ar' ? 'جاري الاتصال بالمدرسة...' : 'Contacting school...',
      variant: 'warning',
    });

    setTimeout(() => {
      toast({
        title: language === 'ar' ? 'تم الاتصال' : 'Connected',
        description: language === 'ar' ? 'تم إبلاغ إدارة المدرسة' : 'School administration notified',
        variant: 'success',
      });
    }, 2000);

    setEmergencyModal(false);
    setEmergencyType('');
  };

  const handleEndRoute = () => {
    const pickedStudents = students.filter(s => s.status === 'picked').length;
    const droppedStudents = students.filter(s => s.status === 'dropped').length;
    
    toast({
      title: language === 'ar' ? 'إنهاء الرحلة' : 'Route Completed',
      description: language === 'ar' 
        ? `تم توصيل ${droppedStudents} طالب من ${pickedStudents}` 
        : `Delivered ${droppedStudents} of ${pickedStudents} students`,
      variant: 'success',
    });

    setEndRouteModal(false);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => setAbsenceModal(true)}
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          {language === 'ar' ? 'تسجيل غياب طالب' : 'Mark Student Absent'}
        </Button>
        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => setDelayModal(true)}
        >
          <Clock className="mr-2 h-4 w-4" />
          {language === 'ar' ? 'الإبلاغ عن تأخير' : 'Report Delay'}
        </Button>
        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => setEmergencyModal(true)}
        >
          <Phone className="mr-2 h-4 w-4" />
          {language === 'ar' ? 'الاتصال الطارئ' : 'Emergency Contact'}
        </Button>
        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => setEndRouteModal(true)}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          {language === 'ar' ? 'إنهاء الرحلة' : 'End Route'}
        </Button>
      </div>

      {/* Mark Absent Modal */}
      <Dialog open={absenceModal} onOpenChange={setAbsenceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تسجيل غياب طالب' : 'Mark Student Absent'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'اختر الطالب وسبب الغياب' : 'Select student and reason for absence'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'ar' ? 'الطالب' : 'Student'}</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر طالب' : 'Select student'} />
                </SelectTrigger>
                <SelectContent>
                  {students.filter(s => s.status === 'waiting').map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {language === 'ar' ? student.nameAr : student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === 'ar' ? 'سبب الغياب' : 'Reason for Absence'}</Label>
              <Select value={absenceReason} onValueChange={(value) => {
                setAbsenceReason(value);
                if (value === 'other') {
                  setShowCustomReasonDialog(true);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر السبب' : 'Select reason'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sick">{language === 'ar' ? 'مريض' : 'Sick'}</SelectItem>
                  <SelectItem value="family">{language === 'ar' ? 'ظروف عائلية' : 'Family Emergency'}</SelectItem>
                  <SelectItem value="notified">{language === 'ar' ? 'تم الإبلاغ مسبقاً' : 'Pre-notified'}</SelectItem>
                  <SelectItem value="other">{language === 'ar' ? 'أخرى' : 'Other'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbsenceModal(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleMarkAbsent}>
              {language === 'ar' ? 'تأكيد' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Delay Modal */}
      <Dialog open={delayModal} onOpenChange={setDelayModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'الإبلاغ عن تأخير' : 'Report Delay'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'أدخل تفاصيل التأخير' : 'Enter delay details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'ar' ? 'مدة التأخير (بالدقائق)' : 'Delay Duration (minutes)'}</Label>
              <Input 
                type="number" 
                value={delayMinutes} 
                onChange={(e) => setDelayMinutes(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: 15' : 'e.g., 15'}
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'سبب التأخير' : 'Reason for Delay'}</Label>
              <Textarea 
                value={delayReason} 
                onChange={(e) => setDelayReason(e.target.value)}
                placeholder={language === 'ar' ? 'اشرح سبب التأخير...' : 'Explain the reason for delay...'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelayModal(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleReportDelay}>
              {language === 'ar' ? 'إرسال' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Contact Modal */}
      <Dialog open={emergencyModal} onOpenChange={setEmergencyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'الاتصال الطارئ' : 'Emergency Contact'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'اختر نوع الطوارئ' : 'Select emergency type'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'ar' ? 'نوع الطوارئ' : 'Emergency Type'}</Label>
              <Select value={emergencyType} onValueChange={setEmergencyType}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر النوع' : 'Select type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accident">{language === 'ar' ? 'حادث' : 'Accident'}</SelectItem>
                  <SelectItem value="breakdown">{language === 'ar' ? 'عطل في الحافلة' : 'Bus Breakdown'}</SelectItem>
                  <SelectItem value="medical">{language === 'ar' ? 'حالة طبية' : 'Medical Emergency'}</SelectItem>
                  <SelectItem value="security">{language === 'ar' ? 'مشكلة أمنية' : 'Security Issue'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'جهات الاتصال الطارئ:' : 'Emergency Contacts:'}
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'إدارة المدرسة: 123-456-7890' : 'School Admin: 123-456-7890'}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'منسق النقل: 098-765-4321' : 'Transport Coordinator: 098-765-4321'}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'الطوارئ: 911' : 'Emergency: 911'}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmergencyModal(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleEmergencyContact} variant="destructive">
              {language === 'ar' ? 'إبلاغ المدرسة' : 'Notify School'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Route Modal */}
      <Dialog open={endRouteModal} onOpenChange={setEndRouteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إنهاء الرحلة' : 'End Route'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'تأكيد إنهاء الرحلة الحالية' : 'Confirm ending current route'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">{language === 'ar' ? 'إجمالي الطلاب:' : 'Total Students:'}</span>
                <span className="font-semibold">{students.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">{language === 'ar' ? 'تم الاستلام:' : 'Picked Up:'}</span>
                <span className="font-semibold text-success">
                  {students.filter(s => s.status === 'picked' || s.status === 'dropped').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">{language === 'ar' ? 'غائبون:' : 'Absent:'}</span>
                <span className="font-semibold text-warning">
                  {students.filter(s => s.status === 'absent').length}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' 
                ? 'سيتم إرسال تقرير الرحلة إلى إدارة المدرسة' 
                : 'Route report will be sent to school administration'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEndRouteModal(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleEndRoute}>
              {language === 'ar' ? 'إنهاء الرحلة' : 'End Route'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Absence Reason Dialog */}
      <Dialog open={showCustomReasonDialog} onOpenChange={setShowCustomReasonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'سبب الغياب' : 'Absence Reason'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'يرجى إدخال سبب الغياب' : 'Please enter the reason for absence'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'ar' ? 'السبب' : 'Reason'}</Label>
              <Textarea 
                value={customAbsenceReason} 
                onChange={(e) => setCustomAbsenceReason(e.target.value)}
                placeholder={language === 'ar' 
                  ? 'اكتب سبب غياب الطالب...' 
                  : 'Enter the reason why the student is absent...'}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {customAbsenceReason.length}/500
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCustomReasonDialog(false);
                setAbsenceReason('');
                setCustomAbsenceReason('');
              }}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleCustomReasonSubmit}>
              {language === 'ar' ? 'تأكيد' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}