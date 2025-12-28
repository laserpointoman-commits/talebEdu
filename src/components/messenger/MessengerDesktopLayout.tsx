import { useState, useRef, useEffect } from 'react';
import { Conversation, GroupChat } from '@/hooks/useMessenger';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { MessengerSettings } from './MessengerSettings';
import { WHATSAPP_COLORS } from './WhatsAppTheme';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { 
  Search, 
  MessageCircle, 
  Users,
  Phone,
  Video,
  MoreVertical,
  Settings,
  ArrowLeft,
  CheckCheck,
  Check,
  Clock,
  Archive,
  Filter,
  Plus,
  Circle,
  PhoneCall
} from 'lucide-react';

interface MessengerDesktopLayoutProps {
  profile: any;
  user: any;
  conversations: Conversation[];
  groups: GroupChat[];
  messages: any[];
  callLogs: any[];
  selectedConversation: Conversation | null;
  selectedGroup: GroupChat | null;
  onSelectConversation: (conv: Conversation) => void;
  onSelectGroup: (group: GroupChat) => void;
  onSendMessage: (content: string, files: File[], replyToMsg?: any) => void;
  onVoiceSend: (audioBlob: Blob, duration: number) => void;
  onTyping: (recipientId: string, typing: boolean) => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
  onDeleteMessage: (msgId: string, forEveryone: boolean) => void;
  onReact: (msgId: string, emoji: string) => void;
  onRemoveReaction: (msgId: string) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  onBack: () => void;
  isArabic?: boolean;
}

type SidebarTab = 'chats' | 'groups' | 'calls' | 'settings';

export function MessengerDesktopLayout({
  profile,
  user,
  conversations,
  groups,
  messages,
  callLogs,
  selectedConversation,
  selectedGroup,
  onSelectConversation,
  onSelectGroup,
  onSendMessage,
  onVoiceSend,
  onTyping,
  onVoiceCall,
  onVideoCall,
  onDeleteMessage,
  onReact,
  onRemoveReaction,
  onNewChat,
  onNewGroup,
  onBack,
  isArabic
}: MessengerDesktopLayoutProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('chats');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [forwardMessage, setForwardMessage] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dir = isArabic ? 'rtl' : 'ltr';

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatChatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return isArabic ? 'أمس' : 'Yesterday';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'dd/MM/yyyy');
  };

  const groupMessagesByDate = (msgs: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    msgs.forEach(msg => {
      const date = new Date(msg.created_at);
      let key: string;
      if (isToday(date)) {
        key = isArabic ? 'اليوم' : 'Today';
      } else if (isYesterday(date)) {
        key = isArabic ? 'أمس' : 'Yesterday';
      } else {
        key = format(date, 'MMMM d, yyyy');
      }
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(msg);
    });
    return grouped;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentChat = selectedConversation || selectedGroup;
  const chatName = selectedConversation?.recipient_name || selectedGroup?.name || '';
  const chatImage = selectedConversation?.recipient_image || selectedGroup?.image_url || '';
  const isOnline = selectedConversation?.is_online || false;

  const getMessageStatus = (msg: any) => {
    if (msg.is_read) return 'read';
    if (msg.is_delivered) return 'delivered';
    return 'sent';
  };

  return (
    <div 
      className="fixed inset-0 flex z-[100]" 
      style={{ backgroundColor: WHATSAPP_COLORS.bg }}
      dir={dir}
    >
      {/* Left Sidebar */}
      <div 
        className="w-[400px] xl:w-[420px] flex flex-col border-r shrink-0"
        style={{ borderColor: WHATSAPP_COLORS.divider, backgroundColor: WHATSAPP_COLORS.bgSecondary }}
      >
        {/* Sidebar Header */}
        <div 
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ backgroundColor: WHATSAPP_COLORS.headerBg }}
        >
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-white/10 shrink-0"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textPrimary }} />
            </Button>
            <Avatar className="h-10 w-10 cursor-pointer" onClick={() => setActiveTab('settings')}>
              <AvatarImage src={profile?.profile_image || profile?.avatar_url} />
              <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                {profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold" style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {isArabic ? 'المحادثات' : 'Messenger'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full hover:bg-white/10"
                    onClick={activeTab === 'groups' ? onNewGroup : onNewChat}
                  >
                    <Plus className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {activeTab === 'groups' 
                    ? (isArabic ? 'مجموعة جديدة' : 'New group')
                    : (isArabic ? 'محادثة جديدة' : 'New chat')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
              <MoreVertical className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2 shrink-0" style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary }}>
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" 
              style={{ color: WHATSAPP_COLORS.textMuted }} 
            />
            <Input
              placeholder={isArabic ? 'ابحث أو ابدأ محادثة جديدة' : 'Search or start new chat'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-0 rounded-lg h-9"
              style={{ backgroundColor: WHATSAPP_COLORS.inputBg, color: WHATSAPP_COLORS.textPrimary }}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-white/10"
            >
              <Filter className="h-4 w-4" style={{ color: WHATSAPP_COLORS.textMuted }} />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SidebarTab)} className="shrink-0">
          <TabsList 
            className="w-full justify-start gap-0 h-12 rounded-none border-b p-0"
            style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary, borderColor: WHATSAPP_COLORS.divider }}
          >
            <TabsTrigger 
              value="chats" 
              className="flex-1 h-full rounded-none border-b-2 data-[state=active]:border-b-2 data-[state=active]:shadow-none"
              style={{ 
                borderColor: 'transparent',
                color: WHATSAPP_COLORS.textSecondary 
              }}
            >
              <MessageCircle className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="groups" 
              className="flex-1 h-full rounded-none border-b-2 data-[state=active]:border-b-2 data-[state=active]:shadow-none"
              style={{ 
                borderColor: 'transparent',
                color: WHATSAPP_COLORS.textSecondary 
              }}
            >
              <Users className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="calls" 
              className="flex-1 h-full rounded-none border-b-2 data-[state=active]:border-b-2 data-[state=active]:shadow-none"
              style={{ 
                borderColor: 'transparent',
                color: WHATSAPP_COLORS.textSecondary 
              }}
            >
              <PhoneCall className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex-1 h-full rounded-none border-b-2 data-[state=active]:border-b-2 data-[state=active]:shadow-none"
              style={{ 
                borderColor: 'transparent',
                color: WHATSAPP_COLORS.textSecondary 
              }}
            >
              <Settings className="h-5 w-5" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tab Content */}
        <ScrollArea className="flex-1">
          {activeTab === 'settings' ? (
            <MessengerSettings profile={profile} isArabic={isArabic} />
          ) : activeTab === 'calls' ? (
            <div className="py-4">
              {callLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div 
                    className="h-20 w-20 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
                  >
                    <PhoneCall className="h-10 w-10" style={{ color: WHATSAPP_COLORS.textMuted }} />
                  </div>
                  <p className="text-center" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                    {isArabic ? 'لا توجد مكالمات' : 'No calls yet'}
                  </p>
                </div>
              ) : (
                callLogs.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
                    style={{ borderBottom: `1px solid ${WHATSAPP_COLORS.divider}` }}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                        {call.caller_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p style={{ color: WHATSAPP_COLORS.textPrimary }}>{call.caller_name}</p>
                      <p className="text-xs" style={{ color: WHATSAPP_COLORS.textMuted }}>
                        {call.call_type} • {format(new Date(call.started_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      {call.call_type === 'video' ? (
                        <Video className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
                      ) : (
                        <Phone className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {/* Archived (only for chats) */}
              {activeTab === 'chats' && (
                <div 
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
                  style={{ borderBottom: `1px solid ${WHATSAPP_COLORS.divider}` }}
                >
                  <div 
                    className="h-12 w-12 rounded-full flex items-center justify-center" 
                    style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
                  >
                    <Archive className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
                  </div>
                  <span className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                    {isArabic ? 'مؤرشف' : 'Archived'}
                  </span>
                </div>
              )}

              {/* Groups */}
              {(activeTab === 'groups' || (activeTab === 'chats' && filteredGroups.length > 0)) && 
                filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 ${
                      selectedGroup?.id === group.id ? 'bg-white/10' : ''
                    }`}
                    style={{ borderBottom: `1px solid ${WHATSAPP_COLORS.divider}` }}
                    onClick={() => onSelectGroup(group)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={group.image_url || undefined} />
                      <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                        <Users className="h-5 w-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                          {group.name}
                        </span>
                        {group.last_message_time && (
                          <span className="text-xs shrink-0 ml-2" style={{ color: WHATSAPP_COLORS.textMuted }}>
                            {formatChatTime(group.last_message_time)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm truncate" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                        {group.description || (isArabic ? 'محادثة جماعية' : 'Group chat')}
                      </p>
                    </div>
                    {group.unread_count > 0 && (
                      <Badge 
                        className="h-5 min-w-5 rounded-full flex items-center justify-center text-xs shrink-0"
                        style={{ backgroundColor: WHATSAPP_COLORS.accentLight }}
                      >
                        {group.unread_count}
                      </Badge>
                    )}
                  </div>
                ))}

              {/* Conversations */}
              {activeTab === 'chats' && filteredConversations.map((conv) => (
                <div
                  key={conv.recipient_id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 ${
                    selectedConversation?.recipient_id === conv.recipient_id ? 'bg-white/10' : ''
                  }`}
                  style={{ borderBottom: `1px solid ${WHATSAPP_COLORS.divider}` }}
                  onClick={() => onSelectConversation(conv)}
                >
                  <div className="relative shrink-0">
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
                      <span 
                        className="text-xs shrink-0 ml-2" 
                        style={{ color: conv.unread_count > 0 ? WHATSAPP_COLORS.accentLight : WHATSAPP_COLORS.textMuted }}
                      >
                        {conv.last_message_time && formatChatTime(conv.last_message_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCheck className="h-4 w-4 shrink-0" style={{ color: WHATSAPP_COLORS.checkBlue }} />
                      <p className="text-sm truncate" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                        {conv.last_message || (isArabic ? 'لا توجد رسائل بعد' : 'No messages yet')}
                      </p>
                      {conv.unread_count > 0 && (
                        <Badge 
                          className="h-5 min-w-5 rounded-full flex items-center justify-center text-xs shrink-0 ml-auto"
                          style={{ backgroundColor: WHATSAPP_COLORS.accentLight }}
                        >
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {((activeTab === 'chats' && filteredConversations.length === 0 && filteredGroups.length === 0) ||
                (activeTab === 'groups' && filteredGroups.length === 0)) && (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div 
                    className="h-20 w-20 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
                  >
                    {activeTab === 'groups' ? (
                      <Users className="h-10 w-10" style={{ color: WHATSAPP_COLORS.textMuted }} />
                    ) : (
                      <MessageCircle className="h-10 w-10" style={{ color: WHATSAPP_COLORS.textMuted }} />
                    )}
                  </div>
                  <p className="text-center" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                    {activeTab === 'groups' 
                      ? (isArabic ? 'لا توجد مجموعات بعد' : 'No groups yet')
                      : (isArabic ? 'لا توجد محادثات' : 'No conversations')}
                  </p>
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Chat Area */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: WHATSAPP_COLORS.bg }}>
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div 
              className="flex items-center justify-between px-4 py-2 shrink-0 border-b"
              style={{ backgroundColor: WHATSAPP_COLORS.headerBg, borderColor: WHATSAPP_COLORS.divider }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={chatImage || undefined} />
                    <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                      {selectedGroup ? <Users className="h-5 w-5 text-white" /> : chatName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <div 
                      className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2"
                      style={{ backgroundColor: WHATSAPP_COLORS.accentLight, borderColor: WHATSAPP_COLORS.headerBg }}
                    />
                  )}
                </div>
                <div>
                  <p className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                    {chatName}
                  </p>
                <p className="text-xs" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                    {selectedGroup 
                      ? (isArabic ? 'محادثة جماعية' : 'Group chat')
                      : isOnline 
                        ? (isArabic ? 'متصل الآن' : 'online')
                        : (isArabic ? 'غير متصل' : 'offline')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full hover:bg-white/10"
                        onClick={onVideoCall}
                      >
                        <Video className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isArabic ? 'مكالمة فيديو' : 'Video call'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full hover:bg-white/10"
                        onClick={onVoiceCall}
                      >
                        <Phone className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isArabic ? 'مكالمة صوتية' : 'Voice call'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <Search className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isArabic ? 'بحث' : 'Search'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                  <MoreVertical className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea 
              className="flex-1 px-4 lg:px-16 py-4"
              style={{ 
                backgroundColor: '#0B141A',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.02"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
              }}
            >
              <div className="max-w-4xl mx-auto space-y-1">
                {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                  <div key={date}>
                    <div className="flex justify-center my-4">
                      <span 
                        className="px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm"
                        style={{ 
                          backgroundColor: WHATSAPP_COLORS.bgTertiary, 
                          color: WHATSAPP_COLORS.textSecondary 
                        }}
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
                        onDelete={(msgId, forEveryone) => onDeleteMessage(msgId, forEveryone)}
                        onReact={(msgId, emoji) => onReact(msgId, emoji)}
                        onRemoveReaction={(msgId) => onRemoveReaction(msgId)}
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
              onSend={(content, files) => onSendMessage(content, files, replyTo)}
              onVoiceSend={onVoiceSend}
              onTyping={(typing) => onTyping(selectedConversation?.recipient_id || '', typing)}
              replyingTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              isArabic={isArabic}
            />
          </>
        ) : (
          // Empty state - No chat selected
          <div className="flex-1 flex flex-col items-center justify-center" style={{ backgroundColor: WHATSAPP_COLORS.bg }}>
            <div 
              className="h-32 w-32 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
            >
              <MessageCircle className="h-16 w-16" style={{ color: WHATSAPP_COLORS.textMuted }} />
            </div>
            <h2 className="text-2xl font-light mb-2" style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {isArabic ? 'مرحباً في المحادثات' : 'Welcome to Messenger'}
            </h2>
            <p className="text-center max-w-md" style={{ color: WHATSAPP_COLORS.textSecondary }}>
              {isArabic 
                ? 'اختر محادثة من القائمة للبدء في المراسلة'
                : 'Select a chat from the list to start messaging'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
