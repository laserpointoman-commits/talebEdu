import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  Edit, 
  Trash2, 
  Nfc, 
  Eye, 
  User, 
  GraduationCap, 
  Phone,
  Mail,
  Fingerprint,
  Signal,
  CheckCircle2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StudentCardProps {
  student: {
    id: string;
    name: string;
    nameAr: string;
    email?: string;
    class: string;
    classId?: string;
    grade?: string;
    nfcId?: string;
    phone?: string;
    profileImage?: string;
  };
  language: string;
  isSelected?: boolean;
  isAdmin?: boolean;
  canEdit?: boolean;
  writingNfc?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onWriteNfc?: () => void;
  onViewProfile?: () => void;
}

export function StudentCard({
  student,
  language,
  isSelected = false,
  isAdmin = false,
  canEdit = false,
  writingNfc = false,
  onSelect,
  onEdit,
  onDelete,
  onWriteNfc,
  onViewProfile,
}: StudentCardProps) {
  const displayName = language === 'ar' ? student.nameAr : student.name;
  const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative bg-card rounded-2xl border overflow-hidden transition-all duration-300",
        isSelected 
          ? "border-primary ring-2 ring-primary/20 shadow-lg" 
          : "border-border hover:border-primary/30 hover:shadow-xl"
      )}
    >
      {/* Top accent bar with gradient */}
      <div className="h-1.5 bg-gradient-to-r from-sky-400 via-primary to-sky-600" />
      
      {/* Card content */}
      <div className="p-4">
        {/* Header row: checkbox, avatar, actions */}
        <div className="flex items-start gap-3">
          {/* Selection checkbox for admin */}
          {isAdmin && onSelect && (
            <div className="pt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>
          )}
          
          {/* Avatar with status ring */}
          <div className="relative">
            <div className={cn(
              "absolute -inset-1 rounded-full bg-gradient-to-br from-sky-400 to-primary opacity-75",
              "group-hover:opacity-100 transition-opacity"
            )} />
            <Avatar className="relative h-14 w-14 border-2 border-card">
              <AvatarImage src={student.profileImage} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-sky-100 to-primary/20 text-primary font-semibold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Online status indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-card flex items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          
          {/* Name and class info */}
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-semibold text-foreground truncate text-base leading-tight">
              {displayName}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              {student.classId ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 rounded-md">
                  <GraduationCap className="h-3 w-3" />
                  {student.class}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {student.grade || (language === 'en' ? 'Unassigned' : language === 'hi' ? 'अनियुक्त' : 'غير معين')}
                </span>
              )}
            </div>
          </div>
          
          {/* Actions dropdown */}
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Edit' : language === 'hi' ? 'संपादित करें' : 'تعديل'}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Delete' : language === 'hi' ? 'हटाएं' : 'حذف'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Divider */}
        <div className="my-3 border-t border-dashed border-border" />
        
        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* NFC ID with chip visual */}
          <div className="col-span-2 flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
                  <Fingerprint className="h-5 w-5 text-white" />
                </div>
                {student.nfcId && (
                  <Signal className="absolute -top-1 -right-1 h-3.5 w-3.5 text-emerald-500" />
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  NFC ID
                </p>
                <p className="text-sm font-mono font-semibold text-foreground number-display">
                  {student.nfcId || '—'}
                </p>
              </div>
            </div>
            {student.nfcId && canEdit && onWriteNfc && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                onClick={onWriteNfc}
                disabled={writingNfc}
              >
                <Nfc className={cn(
                  "h-4 w-4 text-amber-600",
                  writingNfc && "animate-pulse"
                )} />
              </Button>
            )}
          </div>
          
          {/* Contact info - Email */}
          {student.email && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate number-display">
                {student.email}
              </span>
            </div>
          )}
          
          {/* Contact info - Phone */}
          {student.phone && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground number-display">
                {student.phone}
              </span>
            </div>
          )}
        </div>
        
        {/* Status bar */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {language === 'en' ? 'Active' : language === 'hi' ? 'सक्रिय' : 'نشط'}
            </span>
          </div>
          
          {/* View profile button */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
            onClick={onViewProfile}
          >
            <Eye className="h-3.5 w-3.5" />
            {language === 'en' ? 'View Profile' : language === 'hi' ? 'प्रोफाइल देखें' : 'عرض الملف'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}