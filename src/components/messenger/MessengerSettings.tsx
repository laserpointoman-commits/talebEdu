import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, 
  Bell, 
  Lock, 
  HelpCircle, 
  Info, 
  Key, 
  Database, 
  Palette,
  QrCode,
  ChevronRight
} from 'lucide-react';
import { WHATSAPP_COLORS } from './WhatsAppTheme';

interface MessengerSettingsProps {
  profile: any;
  isArabic?: boolean;
}

export function MessengerSettings({ profile, isArabic }: MessengerSettingsProps) {
  const settingsItems = [
    { icon: Key, label: isArabic ? 'الحساب' : 'Account', description: isArabic ? 'الخصوصية، الأمان، تغيير الرقم' : 'Privacy, security, change number' },
    { icon: Lock, label: isArabic ? 'الخصوصية' : 'Privacy', description: isArabic ? 'الحظر، مؤقت الرسائل' : 'Block contacts, disappearing messages' },
    { icon: Palette, label: isArabic ? 'الدردشات' : 'Chats', description: isArabic ? 'السمة، الخلفيات، سجل الدردشات' : 'Theme, wallpapers, chat history' },
    { icon: Bell, label: isArabic ? 'الإشعارات' : 'Notifications', description: isArabic ? 'نغمة الرسائل والمجموعات والمكالمات' : 'Message, group & call tones' },
    { icon: Database, label: isArabic ? 'التخزين والبيانات' : 'Storage and data', description: isArabic ? 'استخدام الشبكة، التنزيل التلقائي' : 'Network usage, auto-download' },
    { icon: HelpCircle, label: isArabic ? 'المساعدة' : 'Help', description: isArabic ? 'مركز المساعدة، اتصل بنا، سياسة الخصوصية' : 'Help center, contact us, privacy policy' },
    { icon: Info, label: isArabic ? 'تطبيق ادعُ صديق' : 'Invite a friend', description: '' },
  ];

  return (
    <ScrollArea className="h-full">
      {/* Profile Section */}
      <div 
        className="flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-white/5"
        style={{ borderBottom: `1px solid ${WHATSAPP_COLORS.divider}` }}
      >
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile?.profile_image || profile?.avatar_url} />
          <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
            {profile?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-lg truncate" style={{ color: WHATSAPP_COLORS.textPrimary }}>
            {profile?.full_name || (isArabic ? 'المستخدم' : 'User')}
          </p>
          <p className="text-sm truncate" style={{ color: WHATSAPP_COLORS.textSecondary }}>
            {profile?.email || (isArabic ? 'أضف معلومات عنك' : 'Add your info')}
          </p>
        </div>
        <QrCode className="h-6 w-6 shrink-0" style={{ color: WHATSAPP_COLORS.accent }} />
      </div>

      {/* Settings List */}
      <div className="py-2">
        {settingsItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors hover:bg-white/5"
          >
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
            >
              <item.icon className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                {item.label}
              </p>
              {item.description && (
                <p className="text-sm truncate" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                  {item.description}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 shrink-0" style={{ color: WHATSAPP_COLORS.textMuted }} />
          </div>
        ))}
      </div>

      {/* App Info */}
      <div className="flex flex-col items-center py-8">
        <p className="text-sm" style={{ color: WHATSAPP_COLORS.textMuted }}>
          {isArabic ? 'من' : 'from'}
        </p>
        <p className="font-semibold text-lg" style={{ color: WHATSAPP_COLORS.textPrimary }}>
          TalebEdu
        </p>
      </div>
    </ScrollArea>
  );
}
