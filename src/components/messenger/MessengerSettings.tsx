import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  Lock, 
  HelpCircle, 
  Key, 
  Database, 
  Palette,
  QrCode,
  ChevronRight,
  User,
  Shield,
  Eye,
  Clock,
  Moon,
  Sun,
  Image,
  Trash2,
  Download,
  Wifi,
  Check,
  X,
  MessageSquare,
  Phone,
  Video
} from 'lucide-react';
import { WHATSAPP_COLORS } from './WhatsAppTheme';

interface MessengerSettingsProps {
  profile: any;
  isArabic?: boolean;
  onProfileUpdate?: () => void;
}

type SettingsDialog = 'account' | 'privacy' | 'chats' | 'notifications' | 'storage' | 'help' | null;

export function MessengerSettings({ profile, isArabic, onProfileUpdate }: MessengerSettingsProps) {
  const [activeDialog, setActiveDialog] = useState<SettingsDialog>(null);
  const [saving, setSaving] = useState(false);
  
  // Account settings state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  
  // Privacy settings state
  const [lastSeenVisible, setLastSeenVisible] = useState(true);
  const [profilePhotoVisible, setProfilePhotoVisible] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  
  // Chat settings state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [enterToSend, setEnterToSend] = useState(true);
  
  // Notification settings state
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [groupNotifications, setGroupNotifications] = useState(true);
  const [callNotifications, setCallNotifications] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [sound, setSound] = useState(true);

  const settingsItems = [
    { 
      key: 'account' as const,
      icon: Key, 
      label: isArabic ? 'الحساب' : 'Account', 
      description: isArabic ? 'الملف الشخصي، الخصوصية' : 'Profile, privacy settings' 
    },
    { 
      key: 'privacy' as const,
      icon: Lock, 
      label: isArabic ? 'الخصوصية' : 'Privacy', 
      description: isArabic ? 'آخر ظهور، إيصالات القراءة' : 'Last seen, read receipts' 
    },
    { 
      key: 'chats' as const,
      icon: Palette, 
      label: isArabic ? 'الدردشات' : 'Chats', 
      description: isArabic ? 'السمة، حجم الخط' : 'Theme, font size' 
    },
    { 
      key: 'notifications' as const,
      icon: Bell, 
      label: isArabic ? 'الإشعارات' : 'Notifications', 
      description: isArabic ? 'نغمة الرسائل والمكالمات' : 'Message & call tones' 
    },
    { 
      key: 'storage' as const,
      icon: Database, 
      label: isArabic ? 'التخزين والبيانات' : 'Storage and data', 
      description: isArabic ? 'استخدام البيانات، التنزيل' : 'Data usage, downloads' 
    },
    { 
      key: 'help' as const,
      icon: HelpCircle, 
      label: isArabic ? 'المساعدة' : 'Help', 
      description: isArabic ? 'الأسئلة الشائعة، سياسة الخصوصية' : 'FAQ, privacy policy' 
    },
  ];

  const handleSaveAccount = async () => {
    if (!profile?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio: bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: isArabic ? 'تم الحفظ' : 'Saved',
        description: isArabic ? 'تم تحديث ملفك الشخصي' : 'Your profile has been updated',
      });
      
      onProfileUpdate?.();
      setActiveDialog(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem('messenger_cache');
    toast({
      title: isArabic ? 'تم المسح' : 'Cleared',
      description: isArabic ? 'تم مسح ذاكرة التخزين المؤقت' : 'Cache has been cleared',
    });
  };

  return (
    <>
      <ScrollArea className="h-full">
        {/* Profile Section */}
        <div 
          className="flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-white/5"
          style={{ borderBottom: `1px solid ${WHATSAPP_COLORS.divider}` }}
          onClick={() => setActiveDialog('account')}
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
              {profile?.bio || profile?.email || (isArabic ? 'أضف معلومات عنك' : 'Add your info')}
            </p>
          </div>
          <QrCode className="h-6 w-6 shrink-0" style={{ color: WHATSAPP_COLORS.accent }} />
        </div>

        {/* Settings List */}
        <div className="py-2">
          {settingsItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors hover:bg-white/5"
              onClick={() => setActiveDialog(item.key)}
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

      {/* Account Dialog */}
      <Dialog open={activeDialog === 'account'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-md z-[200]" style={{ backgroundColor: WHATSAPP_COLORS.bg, border: `1px solid ${WHATSAPP_COLORS.divider}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {isArabic ? 'الحساب' : 'Account'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.profile_image || profile?.avatar_url} />
                <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }} className="text-2xl">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="space-y-2">
              <Label style={{ color: WHATSAPP_COLORS.textSecondary }}>
                {isArabic ? 'الاسم' : 'Name'}
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ 
                  backgroundColor: WHATSAPP_COLORS.bgSecondary, 
                  borderColor: WHATSAPP_COLORS.divider,
                  color: WHATSAPP_COLORS.textPrimary 
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label style={{ color: WHATSAPP_COLORS.textSecondary }}>
                {isArabic ? 'نبذة عنك' : 'About'}
              </Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={isArabic ? 'أضف نبذة عنك...' : 'Add something about yourself...'}
                style={{ 
                  backgroundColor: WHATSAPP_COLORS.bgSecondary, 
                  borderColor: WHATSAPP_COLORS.divider,
                  color: WHATSAPP_COLORS.textPrimary 
                }}
              />
            </div>

            <div className="space-y-2">
              <Label style={{ color: WHATSAPP_COLORS.textSecondary }}>
                {isArabic ? 'البريد الإلكتروني' : 'Email'}
              </Label>
              <Input
                value={profile?.email || ''}
                disabled
                style={{ 
                  backgroundColor: WHATSAPP_COLORS.bgTertiary, 
                  borderColor: WHATSAPP_COLORS.divider,
                  color: WHATSAPP_COLORS.textMuted 
                }}
              />
            </div>
            
            <Button 
              onClick={handleSaveAccount} 
              disabled={saving}
              className="w-full"
              style={{ backgroundColor: WHATSAPP_COLORS.accent }}
            >
              {saving ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ' : 'Save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Dialog */}
      <Dialog open={activeDialog === 'privacy'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-md z-[200]" style={{ backgroundColor: WHATSAPP_COLORS.bg, border: `1px solid ${WHATSAPP_COLORS.divider}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {isArabic ? 'الخصوصية' : 'Privacy'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                <div>
                  <p style={{ color: WHATSAPP_COLORS.textPrimary }}>
                    {isArabic ? 'آخر ظهور' : 'Last seen'}
                  </p>
                  <p className="text-sm" style={{ color: WHATSAPP_COLORS.textMuted }}>
                    {isArabic ? 'إظهار آخر ظهور للآخرين' : 'Show last seen to others'}
                  </p>
                </div>
              </div>
              <Switch checked={lastSeenVisible} onCheckedChange={setLastSeenVisible} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                <div>
                  <p style={{ color: WHATSAPP_COLORS.textPrimary }}>
                    {isArabic ? 'الحالة' : 'Online status'}
                  </p>
                  <p className="text-sm" style={{ color: WHATSAPP_COLORS.textMuted }}>
                    {isArabic ? 'إظهار حالة الاتصال' : 'Show when you are online'}
                  </p>
                </div>
              </div>
              <Switch checked={onlineStatus} onCheckedChange={setOnlineStatus} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                <div>
                  <p style={{ color: WHATSAPP_COLORS.textPrimary }}>
                    {isArabic ? 'صورة الملف الشخصي' : 'Profile photo'}
                  </p>
                  <p className="text-sm" style={{ color: WHATSAPP_COLORS.textMuted }}>
                    {isArabic ? 'من يمكنه رؤية صورتك' : 'Who can see your photo'}
                  </p>
                </div>
              </div>
              <Switch checked={profilePhotoVisible} onCheckedChange={setProfilePhotoVisible} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                <div>
                  <p style={{ color: WHATSAPP_COLORS.textPrimary }}>
                    {isArabic ? 'إيصالات القراءة' : 'Read receipts'}
                  </p>
                  <p className="text-sm" style={{ color: WHATSAPP_COLORS.textMuted }}>
                    {isArabic ? 'إظهار علامات القراءة' : 'Show read checkmarks'}
                  </p>
                </div>
              </div>
              <Switch checked={readReceipts} onCheckedChange={setReadReceipts} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chats Dialog */}
      <Dialog open={activeDialog === 'chats'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-md z-[200]" style={{ backgroundColor: WHATSAPP_COLORS.bg, border: `1px solid ${WHATSAPP_COLORS.divider}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {isArabic ? 'الدردشات' : 'Chats'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label style={{ color: WHATSAPP_COLORS.textSecondary }}>
                {isArabic ? 'السمة' : 'Theme'}
              </Label>
              <div className="flex gap-2">
                {[
                  { key: 'light', icon: Sun, label: isArabic ? 'فاتح' : 'Light' },
                  { key: 'dark', icon: Moon, label: isArabic ? 'داكن' : 'Dark' },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTheme(t.key as any)}
                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: theme === t.key ? WHATSAPP_COLORS.accent : WHATSAPP_COLORS.bgSecondary,
                      color: theme === t.key ? '#fff' : WHATSAPP_COLORS.textPrimary
                    }}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label style={{ color: WHATSAPP_COLORS.textSecondary }}>
                {isArabic ? 'حجم الخط' : 'Font size'}
              </Label>
              <div className="flex gap-2">
                {[
                  { key: 'small', label: isArabic ? 'صغير' : 'Small' },
                  { key: 'medium', label: isArabic ? 'متوسط' : 'Medium' },
                  { key: 'large', label: isArabic ? 'كبير' : 'Large' },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setFontSize(s.key as any)}
                    className="flex-1 p-3 rounded-lg transition-colors text-sm"
                    style={{ 
                      backgroundColor: fontSize === s.key ? WHATSAPP_COLORS.accent : WHATSAPP_COLORS.bgSecondary,
                      color: fontSize === s.key ? '#fff' : WHATSAPP_COLORS.textPrimary
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: WHATSAPP_COLORS.textPrimary }}>
                  {isArabic ? 'Enter للإرسال' : 'Enter to send'}
                </p>
                <p className="text-sm" style={{ color: WHATSAPP_COLORS.textMuted }}>
                  {isArabic ? 'اضغط Enter لإرسال الرسالة' : 'Press Enter to send message'}
                </p>
              </div>
              <Switch checked={enterToSend} onCheckedChange={setEnterToSend} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={activeDialog === 'notifications'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-md z-[200]" style={{ backgroundColor: WHATSAPP_COLORS.bg, border: `1px solid ${WHATSAPP_COLORS.divider}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {isArabic ? 'الإشعارات' : 'Notifications'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                <div>
                  <p style={{ color: WHATSAPP_COLORS.textPrimary }}>
                    {isArabic ? 'إشعارات الرسائل' : 'Message notifications'}
                  </p>
                </div>
              </div>
              <Switch checked={messageNotifications} onCheckedChange={setMessageNotifications} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                <div>
                  <p style={{ color: WHATSAPP_COLORS.textPrimary }}>
                    {isArabic ? 'إشعارات المجموعات' : 'Group notifications'}
                  </p>
                </div>
              </div>
              <Switch checked={groupNotifications} onCheckedChange={setGroupNotifications} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                <div>
                  <p style={{ color: WHATSAPP_COLORS.textPrimary }}>
                    {isArabic ? 'إشعارات المكالمات' : 'Call notifications'}
                  </p>
                </div>
              </div>
              <Switch checked={callNotifications} onCheckedChange={setCallNotifications} />
            </div>

            <div className="h-px" style={{ backgroundColor: WHATSAPP_COLORS.divider }} />

            <div className="flex items-center justify-between">
              <p style={{ color: WHATSAPP_COLORS.textPrimary }}>
                {isArabic ? 'الاهتزاز' : 'Vibration'}
              </p>
              <Switch checked={vibration} onCheckedChange={setVibration} />
            </div>

            <div className="flex items-center justify-between">
              <p style={{ color: WHATSAPP_COLORS.textPrimary }}>
                {isArabic ? 'الصوت' : 'Sound'}
              </p>
              <Switch checked={sound} onCheckedChange={setSound} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Storage Dialog */}
      <Dialog open={activeDialog === 'storage'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-md z-[200]" style={{ backgroundColor: WHATSAPP_COLORS.bg, border: `1px solid ${WHATSAPP_COLORS.divider}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {isArabic ? 'التخزين والبيانات' : 'Storage and data'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary }}>
              <div className="flex items-center gap-3 mb-3">
                <Database className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
                <p className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                  {isArabic ? 'استخدام التخزين' : 'Storage usage'}
                </p>
              </div>
              <div className="space-y-2 text-sm" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                <div className="flex justify-between">
                  <span>{isArabic ? 'الرسائل' : 'Messages'}</span>
                  <span>12 MB</span>
                </div>
                <div className="flex justify-between">
                  <span>{isArabic ? 'الوسائط' : 'Media'}</span>
                  <span>45 MB</span>
                </div>
                <div className="flex justify-between">
                  <span>{isArabic ? 'ذاكرة التخزين المؤقت' : 'Cache'}</span>
                  <span>8 MB</span>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleClearCache}
              style={{ borderColor: WHATSAPP_COLORS.divider, color: WHATSAPP_COLORS.textPrimary }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isArabic ? 'مسح ذاكرة التخزين المؤقت' : 'Clear cache'}
            </Button>

            <div className="h-px" style={{ backgroundColor: WHATSAPP_COLORS.divider }} />

            <div className="space-y-3">
              <p className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                {isArabic ? 'التنزيل التلقائي للوسائط' : 'Media auto-download'}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                  <span style={{ color: WHATSAPP_COLORS.textSecondary }}>
                    {isArabic ? 'عند الاتصال بـ Wi-Fi' : 'When on Wi-Fi'}
                  </span>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                  <span style={{ color: WHATSAPP_COLORS.textSecondary }}>
                    {isArabic ? 'عند استخدام البيانات' : 'When using mobile data'}
                  </span>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={activeDialog === 'help'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-md z-[200]" style={{ backgroundColor: WHATSAPP_COLORS.bg, border: `1px solid ${WHATSAPP_COLORS.divider}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {isArabic ? 'المساعدة' : 'Help'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div 
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
              style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary }}
            >
              <HelpCircle className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
              <div>
                <p style={{ color: WHATSAPP_COLORS.textPrimary }}>
                  {isArabic ? 'الأسئلة الشائعة' : 'FAQ'}
                </p>
                <p className="text-sm" style={{ color: WHATSAPP_COLORS.textMuted }}>
                  {isArabic ? 'الأسئلة الأكثر شيوعاً' : 'Frequently asked questions'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 ml-auto" style={{ color: WHATSAPP_COLORS.textMuted }} />
            </div>

            <div 
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
              style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary }}
            >
              <Shield className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
              <div>
                <p style={{ color: WHATSAPP_COLORS.textPrimary }}>
                  {isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </p>
                <p className="text-sm" style={{ color: WHATSAPP_COLORS.textMuted }}>
                  {isArabic ? 'كيف نحمي بياناتك' : 'How we protect your data'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 ml-auto" style={{ color: WHATSAPP_COLORS.textMuted }} />
            </div>

            <div 
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
              style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary }}
            >
              <Lock className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
              <div>
                <p style={{ color: WHATSAPP_COLORS.textPrimary }}>
                  {isArabic ? 'شروط الخدمة' : 'Terms of Service'}
                </p>
                <p className="text-sm" style={{ color: WHATSAPP_COLORS.textMuted }}>
                  {isArabic ? 'شروط استخدام التطبيق' : 'App usage terms'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 ml-auto" style={{ color: WHATSAPP_COLORS.textMuted }} />
            </div>

            <div className="pt-4 text-center">
              <p className="text-sm" style={{ color: WHATSAPP_COLORS.textMuted }}>
                {isArabic ? 'الإصدار' : 'Version'} 1.0.0
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
