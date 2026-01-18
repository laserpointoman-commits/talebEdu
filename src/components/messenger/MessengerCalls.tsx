import { useState, useEffect } from 'react';
import { CallLog, UserSearchResult } from '@/hooks/useMessenger';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Search, X, Users, Loader2 } from 'lucide-react';
import { WHATSAPP_COLORS } from './WhatsAppTheme';
import { format, isToday, isYesterday } from 'date-fns';
import { callService } from '@/services/callService';
import { toast } from 'sonner';

interface MessengerCallsProps {
  callLogs: CallLog[];
  isArabic?: boolean;
  searchUsers?: (query: string) => Promise<UserSearchResult[]>;
  currentUserId?: string;
}

export function MessengerCalls({ callLogs, isArabic, searchUsers, currentUserId }: MessengerCallsProps) {
  const [showNewCallDialog, setShowNewCallDialog] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [initialContacts, setInitialContacts] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const t = (en: string, ar: string) => isArabic ? ar : en;

  // Load contacts when dialog opens
  useEffect(() => {
    const loadContacts = async () => {
      if (!showNewCallDialog || !searchUsers) return;
      setLoadingContacts(true);
      try {
        // Load all contacts with empty query to get initial list
        const results = await searchUsers('');
        setInitialContacts(results);
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        setLoadingContacts(false);
      }
    };
    loadContacts();
  }, [showNewCallDialog, searchUsers]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!searchUsers || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const results = await searchUsers(query);
    setSearchResults(results);
    setSearching(false);
  };

  // Get displayed contacts - search results if searching, otherwise initial contacts
  const displayedContacts = searchQuery.trim().length >= 2 
    ? searchResults 
    : initialContacts;

  const startCall = async (user: UserSearchResult, type: 'voice' | 'video') => {
    try {
      await callService.startCall(user.id, user.full_name, user.profile_image, type);
      setShowNewCallDialog(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error(t('Could not start call', 'تعذر بدء المكالمة'));
    }
  };

  const handleCallBack = async (call: CallLog) => {
    const userId = call.caller_id === currentUserId ? call.recipient_id : call.caller_id;
    const userName = call.caller_id === currentUserId ? call.recipient_name : call.caller_name;
    const userImage = call.caller_id === currentUserId ? call.recipient_image : call.caller_image;
    
    if (!userId) return;
    
    try {
      await callService.startCall(userId, userName || 'Unknown', userImage || null, call.call_type);
    } catch (error) {
      console.error('Error starting callback:', error);
      toast.error(t('Could not start call', 'تعذر بدء المكالمة'));
    }
  };

  const openNewCall = (type: 'voice' | 'video') => {
    setCallType(type);
    setShowNewCallDialog(true);
  };

  const formatCallTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return t('Yesterday', 'أمس') + ' ' + format(date, 'HH:mm');
    return format(date, 'MMM d, HH:mm');
  };

  const getCallDisplayInfo = (call: CallLog) => {
    const isOutgoing = call.caller_id === currentUserId;
    return {
      name: isOutgoing ? call.recipient_name : call.caller_name,
      image: isOutgoing ? call.recipient_image : call.caller_image,
      isOutgoing
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Quick Actions */}
      <div 
        className="flex justify-around py-4 border-b shrink-0" 
        style={{ borderColor: WHATSAPP_COLORS.divider }}
      >
        <div className="flex flex-col items-center gap-2">
          <div 
            className="h-14 w-14 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:opacity-80 active:scale-95"
            style={{ backgroundColor: WHATSAPP_COLORS.accent }}
            onClick={() => openNewCall('voice')}
          >
            <Phone className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs font-medium" style={{ color: WHATSAPP_COLORS.textSecondary }}>
            {t('Call', 'اتصال')}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div 
            className="h-14 w-14 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:opacity-80"
            style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
          >
            <Clock className="h-6 w-6" style={{ color: WHATSAPP_COLORS.textSecondary }} />
          </div>
          <span className="text-xs font-medium" style={{ color: WHATSAPP_COLORS.textSecondary }}>
            {t('Schedule', 'جدولة')}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div 
            className="h-14 w-14 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:opacity-80 active:scale-95"
            style={{ backgroundColor: WHATSAPP_COLORS.accent }}
            onClick={() => openNewCall('video')}
          >
            <Video className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs font-medium" style={{ color: WHATSAPP_COLORS.textSecondary }}>
            {t('Video', 'فيديو')}
          </span>
        </div>
      </div>

      {/* Call History */}
      <ScrollArea className="flex-1">
        <h3 
          className="px-4 py-3 text-sm font-semibold sticky top-0 z-10"
          style={{ color: WHATSAPP_COLORS.textSecondary, backgroundColor: WHATSAPP_COLORS.bg }}
        >
          {t('Recent', 'الأخيرة')}
        </h3>
        
        {callLogs.length > 0 ? (
          callLogs.map((call) => {
            const displayInfo = getCallDisplayInfo(call);
            return (
              <div 
                key={call.id} 
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 active:bg-white/10"
                style={{ borderBottom: `1px solid ${WHATSAPP_COLORS.divider}` }}
                onClick={() => handleCallBack(call)}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={displayInfo.image || undefined} />
                  <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                    {displayInfo.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p 
                    className="font-medium truncate"
                    style={{ 
                      color: call.status === 'missed' || call.status === 'no_answer' 
                        ? WHATSAPP_COLORS.missedCall 
                        : WHATSAPP_COLORS.textPrimary 
                    }}
                  >
                    {displayInfo.name || t('Unknown', 'غير معروف')}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {call.status === 'missed' || call.status === 'no_answer' ? (
                      <PhoneMissed className="h-4 w-4" style={{ color: WHATSAPP_COLORS.missedCall }} />
                    ) : displayInfo.isOutgoing ? (
                      <PhoneOutgoing className="h-4 w-4" style={{ color: WHATSAPP_COLORS.accentLight }} />
                    ) : (
                      <PhoneIncoming className="h-4 w-4" style={{ color: WHATSAPP_COLORS.accentLight }} />
                    )}
                    <span className="text-sm" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                      {formatCallTime(call.started_at)}
                    </span>
                    {call.duration && call.duration > 0 && (
                      <span className="text-sm" style={{ color: WHATSAPP_COLORS.textMuted }}>
                        • {Math.floor(call.duration / 60)}:{String(call.duration % 60).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full shrink-0 hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCallBack(call);
                  }}
                >
                  {call.call_type === 'video' ? (
                    <Video className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
                  ) : (
                    <Phone className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
                  )}
                </Button>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div 
              className="h-20 w-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
            >
              <Phone className="h-10 w-10" style={{ color: WHATSAPP_COLORS.textMuted }} />
            </div>
            <p className="text-center mb-1 font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {t('No calls yet', 'لا توجد مكالمات')}
            </p>
            <p className="text-center text-sm" style={{ color: WHATSAPP_COLORS.textSecondary }}>
              {t('Tap the call button to start', 'اضغط على زر الاتصال للبدء')}
            </p>
          </div>
        )}
      </ScrollArea>

      {/* New Call Dialog */}
      <Dialog open={showNewCallDialog} onOpenChange={setShowNewCallDialog}>
        <DialogContent 
          className="max-w-md p-0 border-0 overflow-hidden z-[9999]"
          style={{ backgroundColor: WHATSAPP_COLORS.bg }}
        >
          <DialogHeader 
            className="p-4 border-b"
            style={{ borderColor: WHATSAPP_COLORS.divider, backgroundColor: WHATSAPP_COLORS.headerBg }}
          >
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
                onClick={() => setShowNewCallDialog(false)}
              >
                <X className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textPrimary }} />
              </Button>
              <DialogTitle style={{ color: WHATSAPP_COLORS.textPrimary }}>
                {callType === 'video' 
                  ? t('New Video Call', 'مكالمة فيديو جديدة')
                  : t('New Voice Call', 'مكالمة صوتية جديدة')
                }
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Search */}
          <div className="p-3 border-b" style={{ borderColor: WHATSAPP_COLORS.divider }}>
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" 
                style={{ color: WHATSAPP_COLORS.textMuted }} 
              />
              <Input
                placeholder={t('Search contacts', 'البحث في جهات الاتصال')}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 border-0"
                style={{ 
                  backgroundColor: WHATSAPP_COLORS.inputBg, 
                  color: WHATSAPP_COLORS.textPrimary 
                }}
                autoFocus
              />
            </div>
          </div>

          {/* Contacts list */}
          <ScrollArea className="h-80">
            <div className="p-2">
              {(searching || loadingContacts) ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: WHATSAPP_COLORS.accent }} />
                </div>
              ) : displayedContacts.length > 0 ? (
                displayedContacts.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-lg cursor-pointer active:bg-white/10"
                    onClick={() => startCall(user, callType)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.profile_image || undefined} />
                      <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                        {(user.full_name?.charAt(0) || '?').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                        {user.full_name || t('Unknown', 'غير معروف')}
                      </p>
                      <p className="text-xs capitalize" style={{ color: WHATSAPP_COLORS.textMuted }}>
                        {user.role}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full shrink-0">
                      {callType === 'video' ? (
                        <Video className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
                      ) : (
                        <Phone className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
                      )}
                    </Button>
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                <p className="text-center py-8" style={{ color: WHATSAPP_COLORS.textMuted }}>
                  {t('No contacts found', 'لم يتم العثور على جهات اتصال')}
                </p>
              ) : (
                <p className="text-center py-8" style={{ color: WHATSAPP_COLORS.textMuted }}>
                  {t('No contacts available', 'لا توجد جهات اتصال متاحة')}
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
