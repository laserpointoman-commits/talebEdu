import { useRef, useState } from 'react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Camera, 
  MapPin, 
  User,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { LocationShareSheet } from './LocationShareSheet';

interface AttachmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilesSelected: (files: File[]) => void;
  onLocationShare?: (latitude: number, longitude: number, address?: string) => void;
  isArabic?: boolean;
  colors: {
    bg: string;
    bgSecondary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    divider: string;
  };
}

export function AttachmentSheet({
  open,
  onOpenChange,
  onFilesSelected,
  onLocationShare,
  isArabic = false,
  colors
}: AttachmentSheetProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLocationSheet, setShowLocationSheet] = useState(false);

  const t = (en: string, ar: string) => isArabic ? ar : en;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Validate file size (16MB max)
    const validFiles = files.filter(file => {
      if (file.size > 16 * 1024 * 1024) {
        toast.error(t('File too large', 'الملف كبير جداً'), {
          description: t(`${file.name} exceeds 16MB limit`, `${file.name} يتجاوز الحد الأقصى 16 ميجابايت`)
        });
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
      toast.success(t('Files attached', 'تم إرفاق الملفات'), {
        description: t(`${validFiles.length} file(s) ready to send`, `${validFiles.length} ملف(ات) جاهزة للإرسال`)
      });
    }
    
    onOpenChange(false);
    // Reset input
    e.target.value = '';
  };

  const handleLocationClick = () => {
    onOpenChange(false);
    // Small delay to let the drawer close before opening location sheet
    setTimeout(() => {
      setShowLocationSheet(true);
    }, 200);
  };

  const handleLocationSelect = (latitude: number, longitude: number, address?: string) => {
    if (onLocationShare) {
      onLocationShare(latitude, longitude, address);
    } else {
      // Fallback: Create a location message as a file
      const locationUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;
      const locationText = `📍 ${t('My Location', 'موقعي')}\n${locationUrl}\nLat: ${latitude}\nLng: ${longitude}`;
      const blob = new Blob([locationText], { type: 'text/plain' });
      const file = new File([blob], 'location.txt', { type: 'text/plain' });
      onFilesSelected([file]);
    }
    toast.success(t('Location shared', 'تم مشاركة الموقع'));
  };

  const handleContactShare = async () => {
    setIsProcessing(true);
    try {
      // Check if Contact Picker API is available (Chrome on Android)
      if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
        try {
          const contacts = await (navigator as any).contacts.select(
            ['name', 'email', 'tel'],
            { multiple: false }
          );
          
          if (contacts && contacts.length > 0) {
            const contact = contacts[0];
            const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name?.[0] || 'Unknown'}
TEL:${contact.tel?.[0] || ''}
EMAIL:${contact.email?.[0] || ''}
END:VCARD`;
            
            const blob = new Blob([vCard], { type: 'text/vcard' });
            const file = new File([blob], `${contact.name?.[0] || 'contact'}.vcf`, { type: 'text/vcard' });
            
            onFilesSelected([file]);
            toast.success(t('Contact attached', 'تم إرفاق جهة الاتصال'));
            onOpenChange(false);
          }
        } catch (err) {
          console.error('Contact picker error:', err);
          toast.error(t('Could not access contacts', 'تعذر الوصول لجهات الاتصال'));
        }
      } else {
        // Fallback: Create a sample contact card
        toast.info(t('Contact sharing', 'مشاركة جهة اتصال'), {
          description: t('Contact picker is not available on this device. Please share contact details as text.', 'منتقي جهات الاتصال غير متوفر على هذا الجهاز.')
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const attachmentOptions = [
    {
      icon: ImageIcon,
      label: t('Photo', 'صورة'),
      color: '#E91E63',
      onClick: () => imageInputRef.current?.click()
    },
    {
      icon: Video,
      label: t('Video', 'فيديو'),
      color: '#FF5722',
      onClick: () => videoInputRef.current?.click()
    },
    {
      icon: Camera,
      label: t('Camera', 'كاميرا'),
      color: '#9C27B0',
      onClick: () => cameraInputRef.current?.click()
    },
    {
      icon: FileText,
      label: t('Document', 'ملف'),
      color: colors.accent,
      onClick: () => fileInputRef.current?.click()
    },
    {
      icon: MapPin,
      label: t('Location', 'موقع'),
      color: '#4CAF50',
      onClick: handleLocationClick
    },
    {
      icon: User,
      label: t('Contact', 'جهة اتصال'),
      color: '#2196F3',
      onClick: handleContactShare
    }
  ];

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent 
          className="border-0"
          style={{ backgroundColor: colors.bgSecondary }}
        >
          <DrawerHeader className="flex items-center justify-between">
            <DrawerTitle style={{ color: colors.textPrimary }}>
              {t('Share', 'مشاركة')}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" style={{ color: colors.textSecondary }} />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          
          <div className="px-4 pb-8">
            <div className="grid grid-cols-3 gap-4">
              {attachmentOptions.map((option, index) => (
                <button
                  key={index}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: colors.bgTertiary }}
                  onClick={option.onClick}
                  disabled={isProcessing}
                >
                  <div 
                    className="h-14 w-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: option.color }}
                  >
                    <option.icon className="h-7 w-7 text-white" />
                  </div>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: colors.textPrimary }}
                  >
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        multiple
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Location Share Sheet */}
      <LocationShareSheet
        open={showLocationSheet}
        onOpenChange={setShowLocationSheet}
        onLocationSelect={handleLocationSelect}
        isArabic={isArabic}
        colors={colors}
      />
    </>
  );
}
