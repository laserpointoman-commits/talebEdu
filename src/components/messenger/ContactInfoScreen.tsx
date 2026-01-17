import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Conversation, CallLog } from '@/hooks/useMessenger';
import { callService } from '@/services/callService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Phone,
  Video,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Star,
  Bell,
  BellOff,
  Heart,
  Ban,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Play,
  X,
  ChevronRight,
  Users
} from 'lucide-react';

interface ContactInfoScreenProps {
  conversation: Conversation;
  messages: any[];
  callLogs: CallLog[];
  starredMessageIds: Set<string>;
  onClose: () => void;
  onScrollToMessage?: (messageId: string) => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
  isArabic?: boolean;
  colors: any;
  currentUserId?: string;
}

export function ContactInfoScreen({
  conversation,
  messages,
  callLogs,
  starredMessageIds,
  onClose,
  onScrollToMessage,
  onVoiceCall,
  onVideoCall,
  isArabic = false,
  colors,
  currentUserId
}: ContactInfoScreenProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [mediaTab, setMediaTab] = useState<'media' | 'links' | 'docs'>('media');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  const t = (en: string, ar: string) => isArabic ? ar : en;
  const dir = isArabic ? 'rtl' : 'ltr';

  // Filter call logs for this contact
  const contactCallLogs = callLogs.filter(call => 
    call.caller_id === conversation.recipient_id || 
    call.recipient_id === conversation.recipient_id
  );

  // Extract media from messages
  const mediaItems = messages.filter(msg => 
    msg.attachments?.some((a: any) => a.file_type?.startsWith('image/') || a.file_type?.startsWith('video/'))
  ).flatMap(msg => msg.attachments?.filter((a: any) => 
    a.file_type?.startsWith('image/') || a.file_type?.startsWith('video/')
  ) || []);

  const linkItems = messages.filter(msg => 
    msg.content && (msg.content.includes('http://') || msg.content.includes('https://'))
  );

  const docItems = messages.filter(msg =>
    msg.attachments?.some((a: any) => 
      !a.file_type?.startsWith('image/') && !a.file_type?.startsWith('video/')
    )
  ).flatMap(msg => msg.attachments?.filter((a: any) => 
    !a.file_type?.startsWith('image/') && !a.file_type?.startsWith('video/')
  ) || []);

  // Starred messages from this chat
  const starredMessages = messages.filter(msg => starredMessageIds.has(msg.id));

  // Check if contact is a favorite
  useEffect(() => {
    const checkFavorite = async () => {
      if (!currentUserId) return;
      const { data } = await supabase
        .from('favorite_contacts')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('contact_id', conversation.recipient_id)
        .maybeSingle();
      setIsFavorite(!!data);
    };
    checkFavorite();
  }, [currentUserId, conversation.recipient_id]);

  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    toast.success(
      notificationsEnabled 
        ? t('Notifications muted', 'تم كتم الإشعارات')
        : t('Notifications enabled', 'تم تفعيل الإشعارات')
    );
  };

  const handleToggleFavorite = async () => {
    if (!currentUserId) return;
    setLoadingFavorite(true);
    
    try {
      if (isFavorite) {
        await supabase
          .from('favorite_contacts')
          .delete()
          .eq('user_id', currentUserId)
          .eq('contact_id', conversation.recipient_id);
        setIsFavorite(false);
        toast.success(t('Removed from favorites', 'تم الإزالة من المفضلة'));
      } else {
        await supabase
          .from('favorite_contacts')
          .insert({
            user_id: currentUserId,
            contact_id: conversation.recipient_id
          });
        setIsFavorite(true);
        toast.success(t('Added to favorites', 'تمت الإضافة إلى المفضلة'));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error(t('Failed to update favorites', 'فشل تحديث المفضلة'));
    } finally {
      setLoadingFavorite(false);
    }
  };

  const handleBlockUser = async () => {
    setIsBlocked(true);
    setShowBlockConfirm(false);
    toast.success(t(`${conversation.recipient_name} has been blocked`, `تم حظر ${conversation.recipient_name}`));
    // In production, this would call an API to block the user
  };

  const getCallIcon = (call: CallLog) => {
    const isIncoming = call.recipient_id === currentUserId;
    if (call.status === 'missed' || call.status === 'no_answer') {
      return <PhoneMissed className="h-4 w-4 text-red-500" />;
    }
    return isIncoming 
      ? <PhoneIncoming className="h-4 w-4 text-green-500" />
      : <PhoneOutgoing className="h-4 w-4 text-green-500" />;
  };

  const formatCallDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCallBack = (call: CallLog) => {
    if (call.call_type === 'video') {
      onVideoCall();
    } else {
      onVoiceCall();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.2 }}
        className="fixed inset-0 flex flex-col z-[150]"
        style={{ backgroundColor: colors.bg }}
        dir={dir}
      >
        {/* Header - Force LTR for consistent back button placement */}
        <div 
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          dir="ltr"
          style={{ backgroundColor: colors.headerBg }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-white/10"
            onClick={onClose}
          >
            <ArrowLeft className="h-5 w-5" style={{ color: colors.textPrimary }} />
          </Button>
          <h1 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            {t('Contact Info', 'معلومات جهة الاتصال')}
          </h1>
        </div>

        <ScrollArea className="flex-1">
          {/* Profile Section */}
          <div 
            className="flex flex-col items-center py-8 px-4"
            style={{ backgroundColor: colors.bgSecondary }}
          >
            <Avatar 
              className="h-32 w-32 mb-4 cursor-pointer"
              onClick={() => conversation.recipient_image && setSelectedImage(conversation.recipient_image)}
            >
              <AvatarImage src={conversation.recipient_image || undefined} />
              <AvatarFallback 
                className="text-4xl font-bold"
                style={{ backgroundColor: colors.accent }}
              >
                {conversation.recipient_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold mb-1" style={{ color: colors.textPrimary }}>
              {conversation.recipient_name}
            </h2>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {conversation.is_online 
                ? t('Online', 'متصل') 
                : t('last seen recently', 'شوهد مؤخراً')}
            </p>

            {/* Call Buttons */}
            <div className="flex gap-6 mt-6">
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 h-auto py-3 px-6 rounded-xl hover:bg-white/10"
                onClick={onVoiceCall}
                disabled={isBlocked}
              >
                <div 
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: colors.accent }}
                >
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  {t('Audio', 'صوت')}
                </span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 h-auto py-3 px-6 rounded-xl hover:bg-white/10"
                onClick={onVideoCall}
                disabled={isBlocked}
              >
                <div 
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: colors.accent }}
                >
                  <Video className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  {t('Video', 'فيديو')}
                </span>
              </Button>
            </div>
          </div>

          {/* Media, Links & Docs */}
          <div className="mt-2" style={{ backgroundColor: colors.bgSecondary }}>
            <div 
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: `1px solid ${colors.divider}` }}
            >
              <span className="font-medium" style={{ color: colors.textPrimary }}>
                {t('Media, Links & Docs', 'الوسائط والروابط والملفات')}
              </span>
              <ChevronRight className="h-5 w-5" style={{ color: colors.textMuted }} />
            </div>
            
            <Tabs value={mediaTab} onValueChange={(v) => setMediaTab(v as any)} className="w-full">
              <TabsList className="w-full justify-start gap-0 h-10 rounded-none bg-transparent p-0">
                <TabsTrigger 
                  value="media" 
                  className="flex-1 h-full rounded-none data-[state=active]:shadow-none"
                  style={{ 
                    borderBottom: mediaTab === 'media' ? `2px solid ${colors.accent}` : '2px solid transparent',
                    color: mediaTab === 'media' ? colors.accent : colors.textSecondary 
                  }}
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  {mediaItems.length}
                </TabsTrigger>
                <TabsTrigger 
                  value="links" 
                  className="flex-1 h-full rounded-none data-[state=active]:shadow-none"
                  style={{ 
                    borderBottom: mediaTab === 'links' ? `2px solid ${colors.accent}` : '2px solid transparent',
                    color: mediaTab === 'links' ? colors.accent : colors.textSecondary 
                  }}
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  {linkItems.length}
                </TabsTrigger>
                <TabsTrigger 
                  value="docs" 
                  className="flex-1 h-full rounded-none data-[state=active]:shadow-none"
                  style={{ 
                    borderBottom: mediaTab === 'docs' ? `2px solid ${colors.accent}` : '2px solid transparent',
                    color: mediaTab === 'docs' ? colors.accent : colors.textSecondary 
                  }}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  {docItems.length}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="media" className="p-2">
                {mediaItems.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1">
                    {mediaItems.slice(0, 9).map((item: any, idx: number) => (
                      <div 
                        key={idx}
                        className="aspect-square bg-black/20 rounded-sm overflow-hidden cursor-pointer"
                        onClick={() => setSelectedImage(item.file_url)}
                      >
                        {item.file_type?.startsWith('video/') ? (
                          <div className="w-full h-full flex items-center justify-center bg-black/50">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                        ) : (
                          <img 
                            src={item.file_url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-sm" style={{ color: colors.textMuted }}>
                    {t('No media shared yet', 'لا توجد وسائط مشتركة')}
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="links" className="p-2">
                {linkItems.length > 0 ? (
                  <div className="space-y-2">
                    {linkItems.slice(0, 5).map((msg: any) => (
                      <a 
                        key={msg.id}
                        href={msg.content.match(/https?:\/\/[^\s]+/)?.[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2 rounded-lg hover:bg-white/5"
                        style={{ color: colors.accent }}
                      >
                        {msg.content.match(/https?:\/\/[^\s]+/)?.[0]}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-sm" style={{ color: colors.textMuted }}>
                    {t('No links shared yet', 'لا توجد روابط مشتركة')}
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="docs" className="p-2">
                {docItems.length > 0 ? (
                  <div className="space-y-2">
                    {docItems.slice(0, 5).map((item: any, idx: number) => (
                      <a
                        key={idx}
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
                      >
                        <FileText className="h-10 w-10" style={{ color: colors.accent }} />
                        <div className="flex-1 min-w-0">
                          <p className="truncate" style={{ color: colors.textPrimary }}>{item.file_name}</p>
                          <p className="text-xs" style={{ color: colors.textMuted }}>
                            {(item.file_size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-sm" style={{ color: colors.textMuted }}>
                    {t('No documents shared yet', 'لا توجد ملفات مشتركة')}
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Starred Messages */}
          <div 
            className="mt-2 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
            style={{ backgroundColor: colors.bgSecondary }}
          >
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5" style={{ color: colors.textMuted }} />
              <span style={{ color: colors.textPrimary }}>
                {t('Starred Messages', 'الرسائل المميزة')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {starredMessages.length}
              </Badge>
              <ChevronRight className="h-5 w-5" style={{ color: colors.textMuted }} />
            </div>
          </div>

          {/* Call History */}
          <div className="mt-2" style={{ backgroundColor: colors.bgSecondary }}>
            <div 
              className="px-4 py-3"
              style={{ borderBottom: `1px solid ${colors.divider}` }}
            >
              <span className="font-medium" style={{ color: colors.textPrimary }}>
                {t('Call History', 'سجل المكالمات')}
              </span>
            </div>
            
            {contactCallLogs.length > 0 ? (
              <div className="divide-y" style={{ borderColor: colors.divider }}>
                {contactCallLogs.slice(0, 10).map((call) => (
                  <div 
                    key={call.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer"
                    onClick={() => handleCallBack(call)}
                  >
                    <div className="flex items-center gap-2">
                      {getCallIcon(call)}
                      {call.call_type === 'video' ? (
                        <Video className="h-4 w-4" style={{ color: colors.textMuted }} />
                      ) : (
                        <Phone className="h-4 w-4" style={{ color: colors.textMuted }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm" style={{ 
                        color: call.status === 'missed' ? 'rgb(239, 68, 68)' : colors.textPrimary 
                      }}>
                        {call.status === 'missed' || call.status === 'no_answer'
                          ? t('Missed', 'فائتة')
                          : call.caller_id === currentUserId
                            ? t('Outgoing', 'صادرة')
                            : t('Incoming', 'واردة')}
                        {call.duration ? ` • ${formatCallDuration(call.duration)}` : ''}
                      </p>
                      <p className="text-xs" style={{ color: colors.textMuted }}>
                        {format(new Date(call.started_at), 'MMM d, yyyy • HH:mm')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCallBack(call);
                      }}
                    >
                      {call.call_type === 'video' ? (
                        <Video className="h-5 w-5" style={{ color: colors.accent }} />
                      ) : (
                        <Phone className="h-5 w-5" style={{ color: colors.accent }} />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-sm" style={{ color: colors.textMuted }}>
                {t('No calls yet', 'لا توجد مكالمات')}
              </p>
            )}
          </div>

          {/* Notifications */}
          <div 
            className="mt-2 px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: colors.bgSecondary }}
          >
            <div className="flex items-center gap-3">
              {notificationsEnabled ? (
                <Bell className="h-5 w-5" style={{ color: colors.textMuted }} />
              ) : (
                <BellOff className="h-5 w-5" style={{ color: colors.textMuted }} />
              )}
              <span style={{ color: colors.textPrimary }}>
                {t('Notifications', 'الإشعارات')}
              </span>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
            />
          </div>

          {/* Add to Favorites */}
          <div 
            className="mt-2 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
            style={{ backgroundColor: colors.bgSecondary }}
            onClick={handleToggleFavorite}
          >
            <div className="flex items-center gap-3">
              <Heart 
                className="h-5 w-5" 
                style={{ color: isFavorite ? '#ef4444' : colors.textMuted }}
                fill={isFavorite ? '#ef4444' : 'none'}
              />
              <span style={{ color: colors.textPrimary }}>
                {isFavorite 
                  ? t('Remove from Favorites', 'إزالة من المفضلة')
                  : t('Add to Favorites', 'إضافة إلى المفضلة')}
              </span>
            </div>
            {loadingFavorite && (
              <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin" 
                   style={{ borderColor: colors.accent }} />
            )}
          </div>

          {/* Block User */}
          <div 
            className="mt-2 mb-6 px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/5"
            style={{ backgroundColor: colors.bgSecondary }}
            onClick={() => !isBlocked && setShowBlockConfirm(true)}
          >
            <Ban className="h-5 w-5 text-red-500" />
            <span className="text-red-500">
              {isBlocked 
                ? t(`${conversation.recipient_name} is blocked`, `${conversation.recipient_name} محظور`)
                : t(`Block ${conversation.recipient_name}`, `حظر ${conversation.recipient_name}`)}
            </span>
          </div>
        </ScrollArea>

        {/* Block Confirmation Dialog */}
        <Dialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
          <DialogContent 
            className="max-w-sm"
            style={{ backgroundColor: colors.bgSecondary, borderColor: colors.divider }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {t(`Block ${conversation.recipient_name}?`, `حظر ${conversation.recipient_name}؟`)}
              </DialogTitle>
              <DialogDescription style={{ color: colors.textSecondary }}>
                {t(
                  'Blocked contacts cannot send you messages or call you.',
                  'لن تتمكن جهات الاتصال المحظورة من إرسال رسائل أو الاتصال بك.'
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowBlockConfirm(false)}
                style={{ color: colors.textPrimary }}
              >
                {t('Cancel', 'إلغاء')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleBlockUser}
              >
                {t('Block', 'حظر')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Preview Dialog */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 bg-black border-0">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 rounded-full bg-black/50 hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-5 w-5 text-white" />
            </Button>
            {selectedImage && (
              <img 
                src={selectedImage} 
                alt="Preview" 
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </AnimatePresence>
  );
}
