import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Radio } from 'lucide-react';
import { WHATSAPP_COLORS } from './WhatsAppTheme';

interface MessengerUpdatesProps {
  profile: any;
  isArabic?: boolean;
}

export function MessengerUpdates({ profile, isArabic }: MessengerUpdatesProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {/* Status Section */}
        <h3 className="text-sm font-semibold mb-3" style={{ color: WHATSAPP_COLORS.textSecondary }}>
          {isArabic ? 'الحالة' : 'Status'}
        </h3>
        
        {/* My Status */}
        <div className="flex items-center gap-4 mb-6 cursor-pointer transition-colors hover:bg-white/5 -mx-2 px-2 py-2 rounded-xl">
          <div className="relative">
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile?.profile_image || profile?.avatar_url} />
              <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                {profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div 
              className="absolute bottom-0 right-0 h-5 w-5 rounded-full flex items-center justify-center border-2"
              style={{ backgroundColor: WHATSAPP_COLORS.accent, borderColor: WHATSAPP_COLORS.bg }}
            >
              <Plus className="h-3 w-3 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {isArabic ? 'حالتي' : 'My status'}
            </p>
            <p className="text-sm" style={{ color: WHATSAPP_COLORS.textSecondary }}>
              {isArabic ? 'اضغط لإضافة تحديث الحالة' : 'Tap to add status update'}
            </p>
          </div>
        </div>

        {/* Recent Updates */}
        <h3 className="text-sm font-semibold mb-3" style={{ color: WHATSAPP_COLORS.textSecondary }}>
          {isArabic ? 'التحديثات الأخيرة' : 'Recent updates'}
        </h3>
        
        <div className="flex flex-col items-center justify-center py-12">
          <div 
            className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
          >
            <Radio className="h-8 w-8" style={{ color: WHATSAPP_COLORS.textMuted }} />
          </div>
          <p className="text-center text-sm" style={{ color: WHATSAPP_COLORS.textSecondary }}>
            {isArabic ? 'لا توجد تحديثات جديدة' : 'No recent updates'}
          </p>
        </div>

        {/* Channels Section */}
        <h3 className="text-sm font-semibold mb-3 mt-6" style={{ color: WHATSAPP_COLORS.textSecondary }}>
          {isArabic ? 'القنوات' : 'Channels'}
        </h3>
        
        <div 
          className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors hover:opacity-90"
          style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
        >
          <div 
            className="h-12 w-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: WHATSAPP_COLORS.accent }}
          >
            <Radio className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {isArabic ? 'البحث عن القنوات' : 'Find channels'}
            </p>
            <p className="text-sm" style={{ color: WHATSAPP_COLORS.textSecondary }}>
              {isArabic ? 'تابع القنوات للبقاء على اطلاع' : 'Follow channels to stay updated'}
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
