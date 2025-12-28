import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMessenger, Conversation } from '@/hooks/useMessenger';
import { useIsMobile } from '@/hooks/use-mobile';
import { WHATSAPP_COLORS } from '@/components/messenger/WhatsAppTheme';
import { MessageBubble } from '@/components/messenger/MessageBubble';
import { ChatHeader } from '@/components/messenger/ChatHeader';
import { ChatInput } from '@/components/messenger/ChatInput';
import { ForwardDialog } from '@/components/messenger/ForwardDialog';
import { CreateGroupDialog } from '@/components/messenger/CreateGroupDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  MessageCircle, 
  Phone, 
  Video,
  MoreVertical,
  Archive,
  Users,
  UserPlus,
  Radio,
  Settings,
  Camera,
  Plus,
  Check,
  CheckCheck,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Loader2,
  Clock
} from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

type TabType = 'chats' | 'updates' | 'calls' | 'settings';

export default function Messages() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    conversations,
    messages,
    groups,
    callLogs,
    loading,
    sendMessage,
    fetchMessages,
    markAsRead,
    deleteMessage,
    addReaction,
    removeReaction,
    setTyping,
    searchUsers
  } = useMessenger();

  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [searchTerm, setSearchTerm] = useState('');
  const [chatFilter, setChatFilter] = useState<'all' | 'unread' | 'favorites' | 'groups'>('all');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<any>(null);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const isArabic = language === 'ar';

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.recipient_id);
      markAsRead(selectedConversation.recipient_id);
    }
  }, [selectedConversation, fetchMessages, markAsRead]);

  // Format time for chat list
  const formatChatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return language === 'en' ? 'Yesterday' : 'أمس';
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE');
    }
    return format(date, 'dd/MM/yyyy');
  };

  // Get message status icon
  const getStatusIcon = (conv: Conversation) => {
    // This would need more data to show proper status
    return <CheckCheck className="h-4 w-4" style={{ color: WHATSAPP_COLORS.checkBlue }} />;
  };

  // Group messages by date
  const groupMessagesByDate = (msgs: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    msgs.forEach(msg => {
      const date = new Date(msg.created_at);
      let key: string;
      if (isToday(date)) {
        key = language === 'en' ? 'Today' : 'اليوم';
      } else if (isYesterday(date)) {
        key = language === 'en' ? 'Yesterday' : 'أمس';
      } else {
        key = format(date, 'MMMM d, yyyy');
      }
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(msg);
    });
    return grouped;
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase());
    if (chatFilter === 'unread') return matchesSearch && conv.unread_count > 0;
    if (chatFilter === 'groups') return false;
    return matchesSearch;
  });

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedGroup = selectedGroupId ? groups.find(g => g.id === selectedGroupId) : null;

  // Handle send message
  const handleSendMessage = (content: string, files: File[], replyToMsg?: any) => {
    if (!selectedConversation) return;
    
    sendMessage(
      selectedConversation.recipient_id,
      content,
      files,
      replyToMsg?.id
    );
    
    setReplyTo(null);
  };

  // Handle voice send
  const handleVoiceSend = (audioBlob: Blob, duration: number) => {
    if (!selectedConversation) return;
    
    const file = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });
    sendMessage(
      selectedConversation.recipient_id,
      '',
      [file],
      undefined,
      undefined,
      'voice',
      duration
    );
  };

  // Handle conversation select
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setSelectedGroupId(null);
    if (isMobile) setShowMobileChat(true);
  };

  // Handle group select
  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedConversation(null);
    if (isMobile) setShowMobileChat(true);
  };

  // Get current chat partner info
  const currentChatName = selectedConversation?.recipient_name || selectedGroup?.name || '';
  const currentChatImage = selectedConversation?.recipient_image || selectedGroup?.image_url || null;
  const isOnline = selectedConversation?.is_online;
  const isTyping = selectedConversation?.is_typing;

  // Desktop two-column layout
  const renderDesktopLayout = () => (
    <div className="flex h-[calc(100vh-6rem)] rounded-lg overflow-hidden border" style={{ backgroundColor: WHATSAPP_COLORS.bg }}>
      {/* Left Panel - Chat List */}
      <div className="w-[400px] flex flex-col border-r" style={{ borderColor: WHATSAPP_COLORS.divider, backgroundColor: WHATSAPP_COLORS.bgSecondary }}>
        {/* Header */}
        <div className="p-3 flex items-center justify-between" style={{ backgroundColor: WHATSAPP_COLORS.headerBg }}>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={(profile as any)?.profile_image || (profile as any)?.avatar_url} />
              <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                {profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold" style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {profile?.full_name || 'User'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
              <Users className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10" onClick={() => setShowNewChat(true)}>
              <MessageCircle className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
              <MoreVertical className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-2" style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: WHATSAPP_COLORS.textMuted }} />
            <Input
              placeholder={language === 'en' ? 'Search or start new chat' : 'ابحث أو ابدأ محادثة جديدة'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-0 rounded-lg"
              style={{ backgroundColor: WHATSAPP_COLORS.inputBg, color: WHATSAPP_COLORS.textPrimary }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-3 py-2 overflow-x-auto" style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary }}>
          {(['all', 'unread', 'favorites', 'groups'] as const).map((filter) => (
            <Button
              key={filter}
              variant="ghost"
              size="sm"
              className={`rounded-full px-4 whitespace-nowrap ${chatFilter === filter ? 'text-white' : ''}`}
              style={{
                backgroundColor: chatFilter === filter ? WHATSAPP_COLORS.accent : WHATSAPP_COLORS.bgTertiary,
                color: chatFilter === filter ? 'white' : WHATSAPP_COLORS.textSecondary
              }}
              onClick={() => setChatFilter(filter)}
            >
              {filter === 'all' ? (language === 'en' ? 'All' : 'الكل') :
               filter === 'unread' ? (language === 'en' ? 'Unread' : 'غير مقروء') :
               filter === 'favorites' ? (language === 'en' ? 'Favorites' : 'المفضلة') :
               (language === 'en' ? 'Groups' : 'المجموعات')}
            </Button>
          ))}
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          {/* Archived section */}
          <div 
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5"
            style={{ borderBottom: `1px solid ${WHATSAPP_COLORS.divider}` }}
          >
            <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}>
              <Archive className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
            </div>
            <span style={{ color: WHATSAPP_COLORS.textPrimary }}>{language === 'en' ? 'Archived' : 'مؤرشف'}</span>
          </div>

          {/* Groups (if filter is groups) */}
          {chatFilter === 'groups' && filteredGroups.map((group) => (
            <div
              key={group.id}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                selectedGroupId === group.id ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              style={{ borderBottom: `1px solid ${WHATSAPP_COLORS.divider}` }}
              onClick={() => handleSelectGroup(group.id)}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={group.image_url || undefined} />
                <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                  <Users className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                    {group.name}
                  </span>
                </div>
                <p className="text-sm truncate" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                  {group.description || (language === 'en' ? 'Group chat' : 'محادثة جماعية')}
                </p>
              </div>
            </div>
          ))}

          {/* Conversations */}
          {chatFilter !== 'groups' && filteredConversations.map((conv) => (
            <div
              key={conv.recipient_id}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                selectedConversation?.recipient_id === conv.recipient_id ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              style={{ borderBottom: `1px solid ${WHATSAPP_COLORS.divider}` }}
              onClick={() => handleSelectConversation(conv)}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conv.recipient_image || undefined} />
                  <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                    {conv.recipient_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                {conv.is_online && (
                  <div 
                    className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2"
                    style={{ backgroundColor: WHATSAPP_COLORS.accentLight, borderColor: WHATSAPP_COLORS.bgSecondary }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                    {conv.recipient_name}
                  </span>
                  <span className="text-xs" style={{ color: conv.unread_count > 0 ? WHATSAPP_COLORS.accentLight : WHATSAPP_COLORS.textMuted }}>
                    {conv.last_message_time && formatChatTime(conv.last_message_time)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    {getStatusIcon(conv)}
                    <p className="text-sm truncate" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                      {conv.last_message || (language === 'en' ? 'No messages yet' : 'لا توجد رسائل بعد')}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <Badge 
                      className="h-5 min-w-5 rounded-full flex items-center justify-center text-xs"
                      style={{ backgroundColor: WHATSAPP_COLORS.accentLight }}
                    >
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Right Panel - Chat View */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: WHATSAPP_COLORS.light.chatBg }}>
        {selectedConversation || selectedGroup ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              conversation={selectedConversation}
              group={selectedGroup}
              onBack={() => {
                setSelectedConversation(null);
                setSelectedGroupId(null);
              }}
              onVoiceCall={() => {}}
              onVideoCall={() => {}}
              isArabic={isArabic}
            />

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-3xl mx-auto space-y-1">
                {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                  <div key={date}>
                    <div className="flex justify-center my-4">
                      <span 
                        className="px-3 py-1 rounded-lg text-xs"
                        style={{ backgroundColor: WHATSAPP_COLORS.light.bgSecondary, color: WHATSAPP_COLORS.light.textSecondary }}
                      >
                        {date}
                      </span>
                    </div>
                    {(dateMessages as any[]).map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwnMessage={msg.sender_id === user?.id}
                        onReply={(m) => setReplyTo(m)}
                        onForward={(m) => setForwardMessage(m)}
                        onDelete={(msgId, forEveryone) => deleteMessage(msgId, forEveryone)}
                        onReact={(msgId, emoji) => addReaction(msgId, emoji)}
                        onRemoveReaction={(msgId) => removeReaction(msgId)}
                        isArabic={isArabic}
                      />
                    ))}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <ChatInput
              onSend={handleSendMessage}
              onVoiceSend={handleVoiceSend}
              onTyping={(typing) => setTyping(selectedConversation?.recipient_id || '', typing)}
              replyingTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              isArabic={isArabic}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary }}>
            <div className="text-center p-8">
              <div className="h-64 w-64 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}>
                <MessageCircle className="h-32 w-32" style={{ color: WHATSAPP_COLORS.textMuted }} />
              </div>
              <h2 className="text-2xl font-light mb-2" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                {language === 'en' ? 'TalebEdu Messenger' : 'رسائل طالب التعليمية'}
              </h2>
              <p style={{ color: WHATSAPP_COLORS.textSecondary }}>
                {language === 'en' 
                  ? 'Send and receive messages with your school community' 
                  : 'أرسل واستقبل الرسائل مع مجتمع مدرستك'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Mobile full-screen layout
  const renderMobileLayout = () => (
    <div className="h-[calc(100vh-4rem)] flex flex-col" style={{ backgroundColor: WHATSAPP_COLORS.bg }}>
      {!showMobileChat ? (
        <>
          {/* Mobile Header */}
          <div className="p-4 flex items-center justify-between" style={{ backgroundColor: WHATSAPP_COLORS.headerBg }}>
            <h1 className="text-xl font-bold" style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {activeTab === 'chats' ? (language === 'en' ? 'Chats' : 'المحادثات') :
               activeTab === 'updates' ? (language === 'en' ? 'Updates' : 'التحديثات') :
               activeTab === 'calls' ? (language === 'en' ? 'Calls' : 'المكالمات') :
               (language === 'en' ? 'Settings' : 'الإعدادات')}
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Camera className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Search className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          <ScrollArea className="flex-1">
            {activeTab === 'chats' && (
              <>
                {/* Filters */}
                <div className="flex gap-2 px-4 py-3 overflow-x-auto">
                  {(['all', 'unread', 'favorites', 'groups'] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant="ghost"
                      size="sm"
                      className="rounded-full px-4 whitespace-nowrap"
                      style={{
                        backgroundColor: chatFilter === filter ? WHATSAPP_COLORS.accent : WHATSAPP_COLORS.bgTertiary,
                        color: chatFilter === filter ? 'white' : WHATSAPP_COLORS.textSecondary
                      }}
                      onClick={() => setChatFilter(filter)}
                    >
                      {filter === 'all' ? (language === 'en' ? 'All' : 'الكل') :
                       filter === 'unread' ? (language === 'en' ? 'Unread' : 'غير مقروء') :
                       filter === 'favorites' ? (language === 'en' ? 'Favorites' : 'المفضلة') :
                       (language === 'en' ? 'Groups' : 'المجموعات')}
                    </Button>
                  ))}
                </div>

                {/* Archived */}
                <div className="flex items-center gap-4 px-4 py-3">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}>
                    <Archive className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
                  </div>
                  <span style={{ color: WHATSAPP_COLORS.textPrimary }}>{language === 'en' ? 'Archived' : 'مؤرشف'}</span>
                </div>

                {/* Conversations */}
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.recipient_id}
                    className="flex items-center gap-3 px-4 py-3 active:bg-white/10"
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="relative">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={conv.recipient_image || undefined} />
                        <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                          {conv.recipient_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {conv.is_online && (
                        <div 
                          className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2"
                          style={{ backgroundColor: WHATSAPP_COLORS.accentLight, borderColor: WHATSAPP_COLORS.bg }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                          {conv.recipient_name}
                        </span>
                        <span className="text-xs" style={{ color: conv.unread_count > 0 ? WHATSAPP_COLORS.accentLight : WHATSAPP_COLORS.textMuted }}>
                          {conv.last_message_time && formatChatTime(conv.last_message_time)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          {getStatusIcon(conv)}
                          <p className="text-sm truncate" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                            {conv.last_message || (language === 'en' ? 'No messages yet' : 'لا توجد رسائل بعد')}
                          </p>
                        </div>
                        {conv.unread_count > 0 && (
                          <Badge 
                            className="h-5 min-w-5 rounded-full flex items-center justify-center text-xs"
                            style={{ backgroundColor: WHATSAPP_COLORS.accentLight }}
                          >
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {activeTab === 'updates' && (
              <div className="p-4">
                {/* Status Section */}
                <h3 className="text-sm font-medium mb-3" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                  {language === 'en' ? 'Status' : 'الحالة'}
                </h3>
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={(profile as any)?.profile_image || (profile as any)?.avatar_url} />
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
                  <div>
                    <p className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                      {language === 'en' ? 'My status' : 'حالتي'}
                    </p>
                    <p className="text-sm" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                      {language === 'en' ? 'Tap to add status update' : 'اضغط لإضافة تحديث الحالة'}
                    </p>
                  </div>
                </div>

                {/* Channels Section */}
                <h3 className="text-sm font-medium mb-3" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                  {language === 'en' ? 'Channels' : 'القنوات'}
                </h3>
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                    <Radio className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                      {language === 'en' ? 'Find channels' : 'البحث عن القنوات'}
                    </p>
                    <p className="text-sm" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                      {language === 'en' ? 'Follow channels to stay updated' : 'تابع القنوات للبقاء على اطلاع'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calls' && (
              <div>
                {/* Call Actions */}
                <div className="flex justify-around py-4 border-b" style={{ borderColor: WHATSAPP_COLORS.divider }}>
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                      {language === 'en' ? 'Call' : 'اتصال'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}>
                      <Clock className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                    </div>
                    <span className="text-xs" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                      {language === 'en' ? 'Schedule' : 'جدولة'}
                    </span>
                  </div>
                </div>

                {/* Recent Calls */}
                <h3 className="px-4 py-2 text-sm font-medium" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                  {language === 'en' ? 'Recent' : 'الأخيرة'}
                </h3>
                {callLogs.map((call) => (
                  <div key={call.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                        {call.caller_id === user?.id ? 'O' : 'I'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                        {call.caller_id === user?.id ? 'Outgoing Call' : 'Incoming Call'}
                      </p>
                      <div className="flex items-center gap-1">
                        {call.status === 'missed' ? (
                          <PhoneMissed className="h-4 w-4" style={{ color: WHATSAPP_COLORS.missedCall }} />
                        ) : call.caller_id === user?.id ? (
                          <PhoneOutgoing className="h-4 w-4" style={{ color: WHATSAPP_COLORS.textMuted }} />
                        ) : (
                          <PhoneIncoming className="h-4 w-4" style={{ color: WHATSAPP_COLORS.accentLight }} />
                        )}
                        <span className="text-sm" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                          {format(new Date(call.started_at), 'MMM d, HH:mm')}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      {call.call_type === 'video' ? (
                        <Video className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
                      ) : (
                        <Phone className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-4">
                {/* Profile */}
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={(profile as any)?.profile_image || (profile as any)?.avatar_url} />
                    <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                      {profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                      {profile?.full_name}
                    </p>
                    <p className="text-sm" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                      {profile?.email}
                    </p>
                  </div>
                </div>

                {/* Settings Options */}
                <div className="space-y-1">
                  {[
                    { icon: Settings, label: language === 'en' ? 'Account' : 'الحساب' },
                    { icon: MessageCircle, label: language === 'en' ? 'Chats' : 'المحادثات' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}>
                        <item.icon className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                      </div>
                      <span style={{ color: WHATSAPP_COLORS.textPrimary }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* FAB for new chat */}
          {activeTab === 'chats' && (
            <Button
              className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg"
              style={{ backgroundColor: WHATSAPP_COLORS.accent }}
              onClick={() => setShowNewChat(true)}
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </Button>
          )}

          {/* Bottom Navigation */}
          <div 
            className="flex items-center justify-around py-2 border-t"
            style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary, borderColor: WHATSAPP_COLORS.divider }}
          >
            {[
              { tab: 'updates' as const, icon: Radio, label: language === 'en' ? 'Updates' : 'التحديثات' },
              { tab: 'calls' as const, icon: Phone, label: language === 'en' ? 'Calls' : 'المكالمات' },
              { tab: 'chats' as const, icon: MessageCircle, label: language === 'en' ? 'Chats' : 'المحادثات', badge: conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0) },
              { tab: 'settings' as const, icon: Settings, label: language === 'en' ? 'Settings' : 'الإعدادات' },
            ].map(({ tab, icon: Icon, label, badge }) => (
              <button
                key={tab}
                className="flex flex-col items-center gap-1 py-2 px-4"
                onClick={() => setActiveTab(tab)}
              >
                <div className="relative">
                  <Icon 
                    className="h-6 w-6" 
                    style={{ color: activeTab === tab ? WHATSAPP_COLORS.accent : WHATSAPP_COLORS.textMuted }}
                  />
                  {badge && badge > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full flex items-center justify-center text-[10px]"
                      style={{ backgroundColor: WHATSAPP_COLORS.accentLight }}
                    >
                      {badge}
                    </Badge>
                  )}
                </div>
                <span 
                  className="text-xs"
                  style={{ color: activeTab === tab ? WHATSAPP_COLORS.accent : WHATSAPP_COLORS.textMuted }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        // Mobile Chat View
        <div className="flex flex-col h-full">
          <ChatHeader
            conversation={selectedConversation}
            group={selectedGroup}
            onBack={() => {
              setShowMobileChat(false);
              setSelectedConversation(null);
              setSelectedGroupId(null);
            }}
            onVoiceCall={() => {}}
            onVideoCall={() => {}}
            isArabic={isArabic}
          />
          
          <ScrollArea className="flex-1 p-3" style={{ backgroundColor: WHATSAPP_COLORS.light.chatBg }}>
            <div className="space-y-1">
              {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                <div key={date}>
                  <div className="flex justify-center my-3">
                    <span 
                      className="px-3 py-1 rounded-lg text-xs"
                      style={{ backgroundColor: 'rgba(0,0,0,0.1)', color: WHATSAPP_COLORS.light.textSecondary }}
                    >
                      {date}
                    </span>
                  </div>
                  {(dateMessages as any[]).map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwnMessage={msg.sender_id === user?.id}
                      onReply={(m) => setReplyTo(m)}
                      onForward={(m) => setForwardMessage(m)}
                      onDelete={(msgId, forEveryone) => deleteMessage(msgId, forEveryone)}
                      onReact={(msgId, emoji) => addReaction(msgId, emoji)}
                      onRemoveReaction={(msgId) => removeReaction(msgId)}
                      isArabic={isArabic}
                    />
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <ChatInput
            onSend={handleSendMessage}
            onVoiceSend={handleVoiceSend}
            onTyping={(typing) => setTyping(selectedConversation?.recipient_id || '', typing)}
            replyingTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            isArabic={isArabic}
          />
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]" style={{ backgroundColor: WHATSAPP_COLORS.bg }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: WHATSAPP_COLORS.accent }} />
      </div>
    );
  }

  return (
    <>
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}

      {/* New Chat Dialog */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent className="max-w-md" style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary, borderColor: WHATSAPP_COLORS.divider }}>
          <DialogHeader>
            <DialogTitle style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {language === 'en' ? 'New Chat' : 'محادثة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: WHATSAPP_COLORS.textMuted }} />
              <Input
                placeholder={language === 'en' ? 'Search contacts...' : 'البحث عن جهات الاتصال...'}
                className="pl-10 border-0"
                style={{ backgroundColor: WHATSAPP_COLORS.inputBg, color: WHATSAPP_COLORS.textPrimary }}
              />
            </div>
            
            <div 
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5"
              onClick={() => {
                setShowNewChat(false);
                setShowCreateGroup(true);
              }}
            >
              <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                <Users className="h-6 w-6 text-white" />
              </div>
              <span style={{ color: WHATSAPP_COLORS.textPrimary }}>
                {language === 'en' ? 'New group' : 'مجموعة جديدة'}
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5">
              <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <span style={{ color: WHATSAPP_COLORS.textPrimary }}>
                {language === 'en' ? 'New contact' : 'جهة اتصال جديدة'}
              </span>
            </div>

            <ScrollArea className="h-64">
              {conversations.map((conv) => (
                <div
                  key={conv.recipient_id}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5"
                  onClick={() => {
                    handleSelectConversation(conv);
                    setShowNewChat(false);
                  }}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.recipient_image || undefined} />
                    <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                      {conv.recipient_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                      {conv.recipient_name}
                    </p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreate={(name, description, memberIds) => {
          // Handle group creation
          setShowCreateGroup(false);
        }}
        searchUsers={searchUsers}
        isArabic={isArabic}
      />

      {/* Forward Dialog */}
      <ForwardDialog
        open={!!forwardMessage}
        onClose={() => setForwardMessage(null)}
        onForward={(recipientIds) => {
          // Handle forwarding
          setForwardMessage(null);
        }}
        conversations={conversations}
        groups={groups}
        messagePreview={forwardMessage?.content || ''}
        isArabic={isArabic}
      />
    </>
  );
}
