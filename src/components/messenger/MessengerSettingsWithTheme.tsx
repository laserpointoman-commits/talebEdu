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
import { useMessengerTheme } from '@/contexts/MessengerThemeContext';
import { getMessengerColors } from './MessengerThemeColors';
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
  Eye,
  Clock,
  Moon,
  Sun,
  Sunrise,
  Check
} from 'lucide-react';

interface MessengerSettingsWithThemeProps {
  profile: any;
  isArabic?: boolean;
  onProfileUpdate?: () => void;
}

type SettingsDialog = 'account' | 'privacy' | 'chats' | 'notifications' | 'storage' | 'help' | null;

export function MessengerSettingsWithTheme({ profile, isArabic, onProfileUpdate }: MessengerSettingsWithThemeProps) {
  const { theme, setTheme, isDark } = useMessengerTheme();
  const colors = getMessengerColors(isDark);
  
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
  
  // Notification settings state
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [groupNotifications, setGroupNotifications] = useState(true);
  const [callNotifications, setCallNotifications] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [sound, setSound] = useState(true);

  const settingsItems = [
    { key: 'account' as const, icon: Key, label: isArabic ? 'الحساب' : 'Account', description: isArabic ? 'الملف الشخصي، الخصوصية' : 'Profile, privacy settings' },
    { key: 'privacy' as const, icon: Lock, label: isArabic ? 'الخصوصية' : 'Privacy', description: isArabic ? 'آخر ظهور، إيصالات القراءة' : 'Last seen, read receipts' },
    { key: 'chats' as const, icon: Palette, label: isArabic ? 'الدردشات' : 'Chats', description: isArabic ? 'السمة، المظهر' : 'Theme, appearance' },
    { key: 'notifications' as const, icon: Bell, label: isArabic ? 'الإشعارات' : 'Notifications', description: isArabic ? 'نغمة الرسائل والمكالمات' : 'Message & call tones' },
    { key: 'storage' as const, icon: Database, label: isArabic ? 'التخزين والبيانات' : 'Storage and data', description: isArabic ? 'استخدام البيانات، التنزيل' : 'Data usage, downloads' },
    { key: 'help' as const, icon: HelpCircle, label: isArabic ? 'المساعدة' : 'Help', description: isArabic ? 'الأسئلة الشائعة، سياسة الخصوصية' : 'FAQ, privacy policy' },
  ];

  const handleSaveAccount = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName, bio: bio, updated_at: new Date().toISOString() }).eq('id', profile.id);
      if (error) throw error;
      toast({ title: isArabic ? 'تم الحفظ' : 'Saved', description: isArabic ? 'تم تحديث ملفك الشخصي' : 'Your profile has been updated' });
      onProfileUpdate?.();
      setActiveDialog(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: isArabic ? 'خطأ' : 'Error', description: isArabic ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem('messenger_cache');
    toast({ title: isArabic ? 'تم المسح' : 'Cleared', description: isArabic ? 'تم مسح ذاكرة التخزين المؤقت' : 'Cache has been cleared' });
  };

  return (
    <>
      <ScrollArea className="h-full">
        {/* Profile Section */}
        <div 
          className="flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-white/5"
          style={{ borderBottom: `1px solid ${colors.divider}` }}
          onClick={() => setActiveDialog('account')}
        >
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.profile_image || profile?.avatar_url} />
            <AvatarFallback style={{ backgroundColor: colors.accent }}>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg truncate" style={{ color: colors.textPrimary }}>{profile?.full_name || (isArabic ? 'المستخدم' : 'User')}</p>
            <p className="text-sm truncate" style={{ color: colors.textSecondary }}>{profile?.bio || profile?.email || (isArabic ? 'أضف معلومات عنك' : 'Add your info')}</p>
          </div>
          <QrCode className="h-6 w-6 shrink-0" style={{ color: colors.accent }} />
        </div>

        {/* Settings List */}
        <div className="py-2">
          {settingsItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors hover:bg-white/5"
              onClick={() => setActiveDialog(item.key)}
            >
              <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: colors.bgTertiary }}>
                <item.icon className="h-5 w-5" style={{ color: colors.textSecondary }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium" style={{ color: colors.textPrimary }}>{item.label}</p>
                {item.description && <p className="text-sm truncate" style={{ color: colors.textSecondary }}>{item.description}</p>}
              </div>
              <ChevronRight className="h-5 w-5 shrink-0" style={{ color: colors.textMuted }} />
            </div>
          ))}
        </div>

        {/* App Info */}
        <div className="flex flex-col items-center py-8">
          <p className="text-sm" style={{ color: colors.textMuted }}>{isArabic ? 'من' : 'from'}</p>
          <p className="font-semibold text-lg" style={{ color: colors.textPrimary }}>TalebEdu</p>
        </div>
      </ScrollArea>

      {/* Account Dialog */}
      <Dialog open={activeDialog === 'account'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-md z-[200]" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.divider}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>{isArabic ? 'الحساب' : 'Account'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.profile_image || profile?.avatar_url} />
                <AvatarFallback style={{ backgroundColor: colors.accent }} className="text-2xl">{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2">
              <Label style={{ color: colors.textSecondary }}>{isArabic ? 'الاسم' : 'Name'}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ backgroundColor: colors.bgSecondary, borderColor: colors.divider, color: colors.textPrimary }} />
            </div>
            <div className="space-y-2">
              <Label style={{ color: colors.textSecondary }}>{isArabic ? 'نبذة عنك' : 'About'}</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder={isArabic ? 'أضف نبذة عنك...' : 'Add something about yourself...'} style={{ backgroundColor: colors.bgSecondary, borderColor: colors.divider, color: colors.textPrimary }} />
            </div>
            <div className="space-y-2">
              <Label style={{ color: colors.textSecondary }}>{isArabic ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input value={profile?.email || ''} disabled style={{ backgroundColor: colors.bgTertiary, borderColor: colors.divider, color: colors.textMuted }} />
            </div>
            <Button onClick={handleSaveAccount} disabled={saving} className="w-full" style={{ backgroundColor: colors.accent }}>
              {saving ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ' : 'Save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Dialog */}
      <Dialog open={activeDialog === 'privacy'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-md z-[200]" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.divider}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>{isArabic ? 'الخصوصية' : 'Privacy'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5" style={{ color: colors.textSecondary }} />
                <div>
                  <p style={{ color: colors.textPrimary }}>{isArabic ? 'آخر ظهور' : 'Last seen'}</p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>{isArabic ? 'إظهار آخر ظهور للآخرين' : 'Show last seen to others'}</p>
                </div>
              </div>
              <Switch checked={lastSeenVisible} onCheckedChange={setLastSeenVisible} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5" style={{ color: colors.textSecondary }} />
                <div>
                  <p style={{ color: colors.textPrimary }}>{isArabic ? 'الحالة' : 'Online status'}</p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>{isArabic ? 'إظهار حالة الاتصال' : 'Show when you are online'}</p>
                </div>
              </div>
              <Switch checked={onlineStatus} onCheckedChange={setOnlineStatus} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5" style={{ color: colors.textSecondary }} />
                <div>
                  <p style={{ color: colors.textPrimary }}>{isArabic ? 'صورة الملف الشخصي' : 'Profile photo'}</p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>{isArabic ? 'من يمكنه رؤية صورتك' : 'Who can see your photo'}</p>
                </div>
              </div>
              <Switch checked={profilePhotoVisible} onCheckedChange={setProfilePhotoVisible} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5" style={{ color: colors.textSecondary }} />
                <div>
                  <p style={{ color: colors.textPrimary }}>{isArabic ? 'إيصالات القراءة' : 'Read receipts'}</p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>{isArabic ? 'إظهار علامات القراءة' : 'Show read checkmarks'}</p>
                </div>
              </div>
              <Switch checked={readReceipts} onCheckedChange={setReadReceipts} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chats/Theme Dialog - WITH DYNAMIC THEME SELECTION */}
      <Dialog open={activeDialog === 'chats'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-md z-[200]" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.divider}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>{isArabic ? 'الدردشات' : 'Chats'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label style={{ color: colors.textSecondary }}>{isArabic ? 'السمة' : 'Theme'}</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'light' as const, icon: Sun, label: isArabic ? 'فاتح' : 'Light', desc: isArabic ? 'دائماً فاتح' : 'Always light' },
                  { key: 'dark' as const, icon: Moon, label: isArabic ? 'داكن' : 'Dark', desc: isArabic ? 'دائماً داكن' : 'Always dark' },
                  { key: 'auto' as const, icon: Sunrise, label: isArabic ? 'تلقائي' : 'Auto', desc: isArabic ? 'حسب الوقت' : 'Based on time' },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTheme(t.key)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all border-2"
                    style={{ 
                      backgroundColor: theme === t.key ? colors.accent : colors.bgSecondary,
                      borderColor: theme === t.key ? colors.accent : colors.divider,
                      color: theme === t.key ? '#fff' : colors.textPrimary
                    }}
                  >
                    <t.icon className="h-6 w-6" />
                    <span className="font-medium text-sm">{t.label}</span>
                    <span className="text-xs opacity-70">{t.desc}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-center" style={{ color: colors.textMuted }}>
                {theme === 'auto' 
                  ? (isArabic ? 'سيتغير المظهر تلقائياً حسب شروق وغروب الشمس' : 'Theme will change automatically based on sunrise/sunset')
                  : (isArabic ? 'المظهر ثابت' : 'Theme is fixed')}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={activeDialog === 'notifications'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-md z-[200]" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.divider}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>{isArabic ? 'الإشعارات' : 'Notifications'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <p style={{ color: colors.textPrimary }}>{isArabic ? 'إشعارات الرسائل' : 'Message notifications'}</p>
              <Switch checked={messageNotifications} onCheckedChange={setMessageNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <p style={{ color: colors.textPrimary }}>{isArabic ? 'إشعارات المجموعات' : 'Group notifications'}</p>
              <Switch checked={groupNotifications} onCheckedChange={setGroupNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <p style={{ color: colors.textPrimary }}>{isArabic ? 'إشعارات المكالمات' : 'Call notifications'}</p>
              <Switch checked={callNotifications} onCheckedChange={setCallNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <p style={{ color: colors.textPrimary }}>{isArabic ? 'الاهتزاز' : 'Vibration'}</p>
              <Switch checked={vibration} onCheckedChange={setVibration} />
            </div>
            <div className="flex items-center justify-between">
              <p style={{ color: colors.textPrimary }}>{isArabic ? 'الصوت' : 'Sound'}</p>
              <Switch checked={sound} onCheckedChange={setSound} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Storage Dialog */}
      <Dialog open={activeDialog === 'storage'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-md z-[200]" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.divider}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>{isArabic ? 'التخزين والبيانات' : 'Storage and data'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button onClick={handleClearCache} variant="outline" className="w-full" style={{ borderColor: colors.divider, color: colors.textPrimary }}>
              {isArabic ? 'مسح ذاكرة التخزين المؤقت' : 'Clear cache'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={activeDialog === 'help'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-md z-[200]" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.divider}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>{isArabic ? 'المساعدة' : 'Help'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgSecondary }}>
              <p className="font-medium mb-2" style={{ color: colors.textPrimary }}>{isArabic ? 'الأسئلة الشائعة' : 'FAQ'}</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>{isArabic ? 'تعرف على كيفية استخدام المراسلة' : 'Learn how to use messaging'}</p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgSecondary }}>
              <p className="font-medium mb-2" style={{ color: colors.textPrimary }}>{isArabic ? 'اتصل بنا' : 'Contact us'}</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>support@talebedu.com</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
