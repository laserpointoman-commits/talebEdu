import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Nfc, 
  GraduationCap, 
  Phone,
  Mail,
  Fingerprint,
  Signal,
  CheckCircle2,
  Calendar,
  Droplets,
  MapPin,
  User,
  AlertTriangle,
  Heart,
  Globe,
  Barcode,
  X,
  Edit
} from 'lucide-react';

interface StudentProfileDialogProps {
  student: {
    id: string;
    name: string;
    nameAr: string;
    email?: string;
    class: string;
    classId?: string;
    grade?: string;
    nfcId?: string;
    barcode?: string;
    phone?: string;
    parentPhone?: string;
    address?: string;
    profileImage?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    nationality?: string;
    gender?: string;
    emergencyContact?: string;
    emergencyContactName?: string;
    medicalConditions?: string;
    allergies?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: string;
  canEdit?: boolean;
  writingNfc?: boolean;
  onWriteNfc?: () => void;
  onEdit?: () => void;
  t: (key: string) => string;
}

export function StudentProfileDialog({
  student,
  open,
  onOpenChange,
  language,
  canEdit = false,
  writingNfc = false,
  onWriteNfc,
  onEdit,
  t,
}: StudentProfileDialogProps) {
  if (!student) return null;

  const displayName = language === 'ar' ? student.nameAr : student.name;
  const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const InfoCard = ({ 
    icon: Icon, 
    label, 
    value, 
    iconColor = "text-primary",
    action 
  }: { 
    icon: React.ElementType; 
    label: string; 
    value: string; 
    iconColor?: string;
    action?: React.ReactNode;
  }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center bg-card shadow-sm", iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-foreground truncate number-display">{value || '—'}</p>
      </div>
      {action}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card border-0 shadow-2xl">
        {/* Header with gradient */}
        <div className="relative">
          {/* Gradient background */}
          <div className="h-32 bg-gradient-to-br from-sky-400 via-primary to-sky-600" />
          
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
          
          {/* Avatar overlapping the gradient */}
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-sky-400 to-primary opacity-75" />
              <Avatar className="relative h-24 w-24 border-4 border-card shadow-xl">
                <AvatarImage src={student.profileImage} alt={displayName} />
                <AvatarFallback className="bg-gradient-to-br from-sky-100 to-primary/20 text-primary font-bold text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Status indicator */}
              <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-card flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
          
          {/* Edit button */}
          {canEdit && onEdit && (
            <Button
              size="sm"
              variant="secondary"
              className="absolute -bottom-5 right-6 shadow-lg"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Edit' : language === 'hi' ? 'संपादित करें' : 'تعديل'}
            </Button>
          )}
        </div>
        
        {/* Content */}
        <div className="pt-16 pb-6 px-6 space-y-6">
          {/* Name and class */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 rounded-lg">
                <GraduationCap className="h-4 w-4" />
                {student.class || student.grade || (language === 'en' ? 'Unassigned' : language === 'hi' ? 'अनियुक्त' : 'غير معين')}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {language === 'en' ? 'Active' : language === 'hi' ? 'सक्रिय' : 'نشط'}
              </span>
            </div>
          </div>
          
          {/* NFC and Barcode Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                    <Fingerprint className="h-7 w-7 text-white" />
                  </div>
                  {student.nfcId && (
                    <Signal className="absolute -top-1 -right-1 h-4 w-4 text-emerald-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 font-medium">NFC ID</p>
                  <p className="text-lg font-mono font-bold text-amber-900 dark:text-amber-100 number-display">
                    {student.nfcId || '—'}
                  </p>
                </div>
              </div>
              {student.nfcId && canEdit && onWriteNfc && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/30"
                  onClick={onWriteNfc}
                  disabled={writingNfc}
                >
                  <Nfc className={cn("h-4 w-4 mr-2 text-amber-600", writingNfc && "animate-pulse")} />
                  {language === 'en' ? 'Write NFC' : language === 'hi' ? 'NFC लिखें' : 'كتابة NFC'}
                </Button>
              )}
            </div>
            {student.barcode && (
              <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-700/30 flex items-center gap-3">
                <Barcode className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-mono text-amber-700 dark:text-amber-300 number-display">{student.barcode}</span>
              </div>
            )}
          </div>
          
          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {language === 'en' ? 'Contact Information' : language === 'hi' ? 'संपर्क जानकारी' : 'معلومات الاتصال'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoCard icon={Mail} label={language === 'en' ? 'Email' : language === 'hi' ? 'ईमेल' : 'البريد الإلكتروني'} value={student.email || ''} iconColor="text-sky-500" />
              <InfoCard icon={Phone} label={t('common.phone')} value={student.phone || ''} iconColor="text-emerald-500" />
              <InfoCard icon={Phone} label={t('common.parentPhone')} value={student.parentPhone || ''} iconColor="text-violet-500" />
              <InfoCard icon={MapPin} label={t('common.address')} value={student.address || ''} iconColor="text-rose-500" />
            </div>
          </div>
          
          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {language === 'en' ? 'Personal Information' : language === 'hi' ? 'व्यक्तिगत जानकारी' : 'المعلومات الشخصية'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoCard icon={Calendar} label={t('common.dateOfBirth')} value={student.dateOfBirth || ''} iconColor="text-blue-500" />
              <InfoCard icon={User} label={language === 'en' ? 'Gender' : language === 'hi' ? 'लिंग' : 'الجنس'} value={student.gender || ''} iconColor="text-purple-500" />
              <InfoCard icon={Globe} label={language === 'en' ? 'Nationality' : language === 'hi' ? 'राष्ट्रीयता' : 'الجنسية'} value={student.nationality || ''} iconColor="text-teal-500" />
              <InfoCard icon={Droplets} label={t('common.bloodGroup')} value={student.bloodGroup || ''} iconColor="text-red-500" />
            </div>
          </div>
          
          {/* Emergency & Medical */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {language === 'en' ? 'Emergency & Medical' : language === 'hi' ? 'आपातकालीन और चिकित्सा' : 'الطوارئ والطبية'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoCard 
                icon={AlertTriangle} 
                label={language === 'en' ? 'Emergency Contact' : language === 'hi' ? 'आपातकालीन संपर्क' : 'جهة الاتصال الطارئة'} 
                value={student.emergencyContactName ? `${student.emergencyContactName} - ${student.emergencyContact}` : ''} 
                iconColor="text-orange-500" 
              />
              <InfoCard 
                icon={Heart} 
                label={language === 'en' ? 'Medical Conditions' : language === 'hi' ? 'चिकित्सा स्थितियाँ' : 'الحالة الطبية'} 
                value={student.medicalConditions || ''} 
                iconColor="text-pink-500" 
              />
              {student.allergies && (
                <div className="sm:col-span-2">
                  <InfoCard 
                    icon={AlertTriangle} 
                    label={t('common.allergies')} 
                    value={student.allergies} 
                    iconColor="text-yellow-500" 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}