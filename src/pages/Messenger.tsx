import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMessenger, Conversation, GroupChat } from '@/hooks/useMessenger';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessengerThemeProvider, useMessengerTheme } from '@/contexts/MessengerThemeContext';
import { getMessengerColors, MESSENGER_GRADIENTS } from '@/components/messenger/MessengerThemeColors';
import { EnhancedMessageBubble } from '@/components/messenger/EnhancedMessageBubble';
import { SimplifiedChatHeader } from '@/components/messenger/SimplifiedChatHeader';
import { ChatListMenu } from '@/components/messenger/ChatListMenu';
import { SwipeableChatItem } from '@/components/messenger/SwipeableChatItem';
import { ChatInput } from '@/components/messenger/ChatInput';
import { ForwardDialog } from '@/components/messenger/ForwardDialog';
import { CreateGroupDialog } from '@/components/messenger/CreateGroupDialog';
import { MessengerBottomNav } from '@/components/messenger/MessengerBottomNav';
import { MessengerUpdates } from '@/components/messenger/MessengerUpdates';
import { MessengerCalls } from '@/components/messenger/MessengerCalls';
import { MessengerSearch } from '@/components/messenger/MessengerSearch';
import { MessengerContacts } from '@/components/messenger/MessengerContacts';
import { MessengerDesktopLayout } from '@/components/messenger/MessengerDesktopLayout';
import { CallScreen } from '@/components/messenger/CallScreen';
import { ContactInfoScreen } from '@/components/messenger/ContactInfoScreen';
import { callService } from '@/services/callService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  ArrowLeft,
  Search, 
  MessageCircle, 
  Users,
  Loader2,
  X,
  CheckCheck,
  Archive,
  Pin
} from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { MessengerSettingsWithTheme } from '@/components/messenger/MessengerSettingsWithTheme';

type MessengerTab = 'chats' | 'groups' | 'calls' | 'contacts' | 'settings';

function MessengerContent() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isDark, effectiveTheme } = useMessengerTheme();
  const colors = getMessengerColors(isDark);
  
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
    searchUsers,
    fetchConversations,
    fetchGroups,
    fetchCallLogs,
    createGroup,
    archiveChat,
    deleteChat,
    forwardMessage: forwardMessageFn
  } = useMessenger();

  const [activeTab, setActiveTab] = useState<MessengerTab>('chats');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<any>(null);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);
  const [showChatView, setShowChatView] = useState(false);
  const [newChatSearchQuery, setNewChatSearchQuery] = useState('');
  const [newChatSearchResults, setNewChatSearchResults] = useState<any[]>([]);
  const [newChatSearching, setNewChatSearching] = useState(false);
  
  // Select mode for chat list
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  
  // Starred messages
  const [starredMessages, setStarredMessages] = useState<Set<string>>(new Set());
  
  // Contact info screen
  const [showContactInfo, setShowContactInfo] = useState(false);
  
  const handleStarMessage = (messageId: string) => {
    setStarredMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
        toast.success(isArabic ? 'تم إلغاء التميز' : isHindi ? 'संदेश अनस्टार किया गया' : 'Message unstarred');
      } else {
        newSet.add(messageId);
        toast.success(isArabic ? 'تم التميز' : isHindi ? 'संदेश स्टार किया गया' : 'Message starred');
      }
      return newSet;
    });
  };

  const isArabic = language === 'ar';
  const isHindi = language === 'hi';
  const dir = isArabic ? 'rtl' : 'ltr';
  
  // Check if user can pin (Admin, Teacher, Supervisor)
  const canPin = ['admin', 'teacher', 'supervisor'].includes(profile?.role || '');

  useEffect(() => {
    if (user?.id) {
      callService.initialize(user.id);
      fetchConversations();
      fetchGroups();
      fetchCallLogs();
    }
  }, [user?.id, fetchConversations, fetchGroups, fetchCallLogs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.recipient_id);
      markAsRead(selectedConversation.recipient_id);
    }
  }, [selectedConversation, fetchMessages, markAsRead]);

  const handleNewChatSearch = async (query: string) => {
    setNewChatSearchQuery(query);
    if (query.trim().length < 2) {
      setNewChatSearchResults([]);
      return;
    }
    setNewChatSearching(true);
    const results = await searchUsers(query);
    setNewChatSearchResults(results);
    setNewChatSearching(false);
  };

  const startNewConversation = (userData: any) => {
    const newConv: Conversation = {
      id: userData.id,
      recipient_id: userData.id,
      recipient_name: userData.full_name,
      recipient_image: userData.profile_image,
      last_message: null,
      last_message_time: null,
      unread_count: 0,
      is_group: false,
      is_online: false
    };
    handleSelectConversation(newConv);
    setShowNewChat(false);
    setNewChatSearchQuery('');
    setNewChatSearchResults([]);
  };

  const groupMessagesByDate = (msgs: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    msgs.forEach(msg => {
      const date = new Date(msg.created_at);
      let key: string;
      if (isToday(date)) {
        key = isArabic ? 'اليوم' : isHindi ? 'आज' : 'Today';
      } else if (isYesterday(date)) {
        key = isArabic ? 'أمس' : isHindi ? 'कल' : 'Yesterday';
      } else {
        key = format(date, 'MMMM d, yyyy');
      }
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(msg);
    });
    return grouped;
  };

  const formatChatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return isArabic ? 'أمس' : isHindi ? 'कल' : 'Yesterday';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'dd/MM/yyyy');
  };

  const handleSendMessage = (content: string, files: File[], replyToMsg?: any) => {
    if (!selectedConversation) return;
    sendMessage(selectedConversation.recipient_id, content, files, replyToMsg?.id);
    setReplyTo(null);
  };

  const handleVoiceSend = async (audioBlob: Blob, duration: number) => {
    if (!selectedConversation) return;

    // Use the blob's actual MIME type for proper playback
    const mimeType = audioBlob.type || 'audio/webm';
    const extension = mimeType.includes('mp4')
      ? 'mp4'
      : mimeType.includes('wav')
        ? 'wav'
        : 'webm';

    const file = new File([audioBlob], `voice_message.${extension}`, { type: mimeType });
    await sendMessage(selectedConversation.recipient_id, '', [file], undefined, undefined, 'voice', duration);
  };

  const handleSelectConversation = (conv: Conversation) => {
    if (isSelectMode) {
      const newSelected = new Set(selectedChats);
      if (newSelected.has(conv.recipient_id)) {
        newSelected.delete(conv.recipient_id);
      } else {
        newSelected.add(conv.recipient_id);
      }
      setSelectedChats(newSelected);
      return;
    }
    setSelectedConversation(conv);
    setSelectedGroup(null);
    setShowChatView(true);
  };

  const handleSelectGroup = (group: GroupChat) => {
    setSelectedGroup(group);
    setSelectedConversation(null);
    setShowChatView(true);
  };

  const handleBackFromChat = () => {
    setShowChatView(false);
    setSelectedConversation(null);
    setSelectedGroup(null);
  };

  const handleExitMessenger = () => {
    navigate('/dashboard');
  };

  const handleVoiceCall = () => {
    if (selectedConversation) {
      callService.startCall(
        selectedConversation.recipient_id,
        selectedConversation.recipient_name || 'Unknown',
        selectedConversation.recipient_image || null,
        'voice'
      );
    }
  };

  const handleVideoCall = () => {
    if (selectedConversation) {
      callService.startCall(
        selectedConversation.recipient_id,
        selectedConversation.recipient_name || 'Unknown',
        selectedConversation.recipient_image || null,
        'video'
      );
    }
  };

  const handleMarkAllRead = () => {
    conversations.forEach(conv => {
      if (conv.unread_count > 0) {
        markAsRead(conv.recipient_id);
      }
    });
  };

  // Pinned chats state
  const [pinnedChats, setPinnedChats] = useState<Set<string>>(new Set());

  const handleDeleteChat = async (convId: string) => {
    const success = await deleteChat(convId);
    if (success) {
      toast.success(isArabic ? 'تم حذف المحادثة' : isHindi ? 'चैट हटाया गया' : 'Chat deleted');
    } else {
      toast.error(isArabic ? 'فشل حذف المحادثة' : isHindi ? 'चैट हटाने में विफल' : 'Failed to delete chat');
    }
  };

  const handleArchiveChat = async (convId: string) => {
    const success = await archiveChat(convId);
    if (success) {
      toast.success(isArabic ? 'تم أرشفة المحادثة' : isHindi ? 'चैट संग्रहीत' : 'Chat archived');
    } else {
      toast.error(isArabic ? 'فشل أرشفة المحادثة' : isHindi ? 'चैट संग्रहीत करने में विफल' : 'Failed to archive chat');
    }
  };

  const handlePinChat = (convId: string) => {
    setPinnedChats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(convId)) {
        newSet.delete(convId);
        toast.success(isArabic ? 'تم إلغاء التثبيت' : isHindi ? 'चैट अनपिन किया गया' : 'Chat unpinned');
      } else {
        newSet.add(convId);
        toast.success(isArabic ? 'تم التثبيت' : isHindi ? 'चैट पिन किया गया' : 'Chat pinned');
      }
      return newSet;
    });
  };

  const handleForwardMessage = async (messageId: string, recipientIds: string[]) => {
    const success = await forwardMessageFn(messageId, recipientIds);
    if (success) {
      toast.success(isArabic ? 'تم إعادة التوجيه' : isHindi ? 'संदेश अग्रेषित' : 'Message forwarded');
      setForwardMessage(null);
    } else {
      toast.error(isArabic ? 'فشل إعادة التوجيه' : isHindi ? 'संदेश अग्रेषित करने में विफल' : 'Failed to forward message');
    }
  };

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const filteredConversations = conversations.filter(conv =>
    conv.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[100]" style={{ backgroundColor: colors.bg }}>
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: colors.accent }} />
      </div>
    );
  }

  // Desktop/Tablet Layout
  if (!isMobile) {
    return (
      <>
        <MessengerDesktopLayout
          profile={profile}
          user={user}
          conversations={conversations}
          groups={groups}
          messages={messages}
          callLogs={callLogs}
          selectedConversation={selectedConversation}
          selectedGroup={selectedGroup}
          onSelectConversation={handleSelectConversation}
          onSelectGroup={handleSelectGroup}
          onSendMessage={handleSendMessage}
          onVoiceSend={handleVoiceSend}
          onTyping={setTyping}
          onVoiceCall={handleVoiceCall}
          onVideoCall={handleVideoCall}
          onDeleteMessage={deleteMessage}
          onReact={addReaction}
          onRemoveReaction={removeReaction}
          onNewChat={() => setShowNewChat(true)}
          onNewGroup={() => setShowCreateGroup(true)}
          onBack={handleExitMessenger}
          onDeleteChat={handleDeleteChat}
          onArchiveChat={handleArchiveChat}
          onPinChat={handlePinChat}
          onMarkAllRead={handleMarkAllRead}
          pinnedChats={pinnedChats}
          canPin={canPin}
          isArabic={isArabic}
        />

        <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
          <DialogContent 
            className="max-w-md border-0 p-0 overflow-hidden z-[9999]" 
            style={{ backgroundColor: colors.bgSecondary }}
            onInteractOutside={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <div className="p-4 flex items-center gap-3" style={{ backgroundColor: colors.headerBg }}>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowNewChat(false)}>
                <X className="h-5 w-5" style={{ color: colors.textPrimary }} />
              </Button>
              <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                {isArabic ? 'محادثة جديدة' : isHindi ? 'नई चैट' : 'New Chat'}
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.textMuted }} />
                <Input
                  placeholder={isArabic ? 'البحث عن جهات الاتصال...' : isHindi ? 'संपर्क खोजें...' : 'Search contacts...'}
                  value={newChatSearchQuery}
                  onChange={(e) => handleNewChatSearch(e.target.value)}
                  className="pl-10 border-0 rounded-lg"
                  style={{ backgroundColor: colors.inputBg, color: colors.textPrimary }}
                />
              </div>
              <ScrollArea className="h-64">
                {newChatSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.accent }} />
                  </div>
                ) : newChatSearchQuery.trim().length > 0 ? (
                  newChatSearchResults.length > 0 ? (
                    newChatSearchResults.map((userResult) => (
                      <div
                        key={userResult.id}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/5"
                        onClick={() => startNewConversation(userResult)}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={userResult.profile_image || undefined} />
                          <AvatarFallback style={{ backgroundColor: colors.accent }}>
                            {userResult.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium" style={{ color: colors.textPrimary }}>{userResult.full_name}</p>
                          <p className="text-xs capitalize" style={{ color: colors.textMuted }}>{userResult.role}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8" style={{ color: colors.textMuted }}>
                      {isArabic ? 'لم يتم العثور على مستخدمين' : isHindi ? 'कोई उपयोगकर्ता नहीं मिला' : 'No users found'}
                    </p>
                  )
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.recipient_id}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/5"
                      onClick={() => {
                        handleSelectConversation(conv);
                        setShowNewChat(false);
                      }}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conv.recipient_image || undefined} />
                        <AvatarFallback style={{ backgroundColor: colors.accent }}>{conv.recipient_name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{conv.recipient_name}</p>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>

        <CreateGroupDialog
          open={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          onCreate={async (name, description, memberIds) => {
            await createGroup(name, description, memberIds);
            setShowCreateGroup(false);
          }}
          searchUsers={searchUsers}
          isArabic={isArabic}
        />

        <ForwardDialog
          open={!!forwardMessage}
          onClose={() => setForwardMessage(null)}
          onForward={(recipientIds) => {
            if (forwardMessage?.id) {
              handleForwardMessage(forwardMessage.id, recipientIds);
            }
          }}
          conversations={conversations}
          groups={groups}
          messagePreview={forwardMessage?.content || ''}
          isArabic={isArabic}
        />

        <CallScreen isArabic={isArabic} />
      </>
    );
  }

  // Mobile Chat View
  const renderChatView = () => (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.2 }}
      className="fixed inset-0 flex flex-col z-[100]"
      style={{ 
        backgroundColor: colors.bg,
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
      dir={dir}
    >
      <SimplifiedChatHeader
        conversation={selectedConversation}
        group={selectedGroup}
        onBack={handleBackFromChat}
        onVoiceCall={handleVoiceCall}
        onVideoCall={handleVideoCall}
        onViewContact={() => setShowContactInfo(true)}
        isArabic={isArabic}
        colors={colors}
      />

      <ScrollArea 
        className="flex-1 px-3 py-2"
        style={{ 
          backgroundColor: colors.chatBg,
          backgroundImage: isDark 
            ? 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
            : 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }}
      >
        <div className="max-w-3xl mx-auto space-y-1">
          {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex justify-center my-3">
                <span 
                  className="px-3 py-1 rounded-lg text-xs font-medium shadow-sm"
                  style={{ backgroundColor: isDark ? colors.bgTertiary : 'rgba(255,255,255,0.95)', color: colors.textSecondary }}
                >
                  {date}
                </span>
              </div>
              {(dateMessages as any[]).map((msg) => (
                <EnhancedMessageBubble
                  key={msg.id}
                  message={msg}
                  isOwnMessage={msg.sender_id === user?.id}
                  onReply={(m) => setReplyTo(m)}
                  onForward={(m) => setForwardMessage(m)}
                  onDelete={(msgId, forEveryone) => deleteMessage(msgId, forEveryone)}
                  onReact={(msgId, emoji) => addReaction(msgId, emoji)}
                  onRemoveReaction={(msgId) => removeReaction(msgId)}
                  onStar={(msgId) => handleStarMessage(msgId)}
                  isStarred={starredMessages.has(msg.id)}
                  isArabic={isArabic}
                  colors={colors}
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

      {/* Contact Info Screen */}
      {showContactInfo && selectedConversation && (
        <ContactInfoScreen
          conversation={selectedConversation}
          messages={messages}
          callLogs={callLogs}
          starredMessageIds={starredMessages}
          onClose={() => setShowContactInfo(false)}
          onVoiceCall={handleVoiceCall}
          onVideoCall={handleVideoCall}
          isArabic={isArabic}
          colors={colors}
          currentUserId={user?.id}
        />
      )}
    </motion.div>
  );

  // Mobile Main View with Swipeable Chat List
  const renderMessengerMain = () => (
    <div 
      className="fixed inset-0 flex flex-col z-[100]" 
      style={{ 
        backgroundColor: colors.bg,
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }} 
      dir={dir}
    >
      {/* Simplified Header - No three-dot menu, no search, no camera buttons */}
      <div 
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ backgroundColor: colors.headerBg }}
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10" onClick={handleExitMessenger}>
            <ArrowLeft className="h-5 w-5" style={{ color: colors.textPrimary }} />
          </Button>
          <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
            {activeTab === 'chats' ? (isArabic ? 'المحادثات' : 'Chats') :
             activeTab === 'groups' ? (isArabic ? 'المجموعات' : 'Groups') :
             activeTab === 'calls' ? (isArabic ? 'المكالمات' : 'Calls') :
             activeTab === 'contacts' ? (isArabic ? 'جهات الاتصال' : 'Contacts') :
             (isArabic ? 'الإعدادات' : 'Settings')}
          </h1>
        </div>
        
        {/* Three-dot menu with Select chats and Mark all as read */}
        {(activeTab === 'chats' || activeTab === 'groups') && (
          <ChatListMenu
            onSelectChats={() => setIsSelectMode(true)}
            onMarkAllRead={handleMarkAllRead}
            isSelectMode={isSelectMode}
            onCancelSelect={() => { setIsSelectMode(false); setSelectedChats(new Set()); }}
            selectedCount={selectedChats.size}
            isArabic={isArabic}
            colors={colors}
          />
        )}
      </div>

      {/* Search Bar */}
      {(activeTab === 'chats' || activeTab === 'groups') && (
        <div className="px-4 py-2 shrink-0" style={{ backgroundColor: colors.bgSecondary }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.textMuted }} />
            <Input
              placeholder={isArabic ? 'ابحث أو ابدأ محادثة جديدة' : 'Search or start new chat'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-0 rounded-xl h-10"
              style={{ backgroundColor: colors.inputBg, color: colors.textPrimary }}
            />
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chats' && (
          <ScrollArea className="h-full">
            {/* Archived section */}
            <div 
              className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
              style={{ borderBottom: `1px solid ${colors.divider}` }}
            >
              <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.bgTertiary }}>
                <Archive className="h-5 w-5" style={{ color: colors.accent }} />
              </div>
              <span className="font-medium" style={{ color: colors.textPrimary }}>
                {isArabic ? 'مؤرشف' : 'Archived'}
              </span>
            </div>

            {/* Chat List with Swipe Actions */}
            {filteredConversations.map((conv) => (
              <SwipeableChatItem
                key={conv.recipient_id}
                onDelete={() => handleDeleteChat(conv.recipient_id)}
                onArchive={() => handleArchiveChat(conv.recipient_id)}
                onPin={() => handlePinChat(conv.recipient_id)}
                canPin={canPin}
                isArabic={isArabic}
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors active:bg-white/10 hover:bg-white/5"
                  style={{ backgroundColor: colors.bg, borderBottom: `1px solid ${colors.divider}` }}
                  onClick={() => handleSelectConversation(conv)}
                >
                  {isSelectMode && (
                    <div 
                      className="h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{ 
                        borderColor: colors.accent,
                        backgroundColor: selectedChats.has(conv.recipient_id) ? colors.accent : 'transparent'
                      }}
                    >
                      {selectedChats.has(conv.recipient_id) && (
                        <CheckCheck className="h-3 w-3 text-white" />
                      )}
                    </div>
                  )}
                  <div className="relative">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={conv.recipient_image || undefined} />
                      <AvatarFallback style={{ backgroundColor: colors.accent }}>{conv.recipient_name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    {conv.is_online && (
                      <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2" style={{ backgroundColor: colors.accentLight, borderColor: colors.bg }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate" style={{ color: colors.textPrimary }}>{conv.recipient_name}</span>
                      <span className="text-xs" style={{ color: conv.unread_count > 0 ? colors.accentLight : colors.textMuted }}>
                        {conv.last_message_time && formatChatTime(conv.last_message_time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <CheckCheck className="h-4 w-4 shrink-0" style={{ color: colors.checkBlue }} />
                        <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                          {conv.last_message || (isArabic ? 'لا توجد رسائل بعد' : 'No messages yet')}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <Badge className="h-5 min-w-5 rounded-full flex items-center justify-center text-xs shrink-0" style={{ backgroundColor: colors.accentLight }}>
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </SwipeableChatItem>
            ))}

            {/* Groups */}
            {filteredGroups.map((group) => (
              <SwipeableChatItem
                key={group.id}
                onDelete={() => handleDeleteChat(group.id)}
                onArchive={() => handleArchiveChat(group.id)}
                onPin={() => handlePinChat(group.id)}
                canPin={canPin}
                isArabic={isArabic}
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors active:bg-white/10 hover:bg-white/5"
                  style={{ backgroundColor: colors.bg, borderBottom: `1px solid ${colors.divider}` }}
                  onClick={() => handleSelectGroup(group)}
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={group.image_url || undefined} />
                    <AvatarFallback style={{ backgroundColor: colors.accent }}><Users className="h-6 w-6 text-white" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate" style={{ color: colors.textPrimary }}>{group.name}</span>
                      {group.last_message_time && (
                        <span className="text-xs" style={{ color: colors.textMuted }}>{formatChatTime(group.last_message_time)}</span>
                      )}
                    </div>
                    <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                      {group.description || (isArabic ? 'محادثة جماعية' : 'Group chat')}
                    </p>
                  </div>
                  {group.unread_count > 0 && (
                    <Badge className="h-5 min-w-5 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: colors.accentLight }}>
                      {group.unread_count}
                    </Badge>
                  )}
                </div>
              </SwipeableChatItem>
            ))}

            {filteredConversations.length === 0 && filteredGroups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="h-20 w-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: colors.bgTertiary }}>
                  <Search className="h-10 w-10" style={{ color: colors.textMuted }} />
                </div>
                <p className="text-center" style={{ color: colors.textSecondary }}>
                  {isArabic ? 'لا توجد محادثات' : 'No conversations'}
                </p>
              </div>
            )}
          </ScrollArea>
        )}

        {activeTab === 'groups' && (
          <ScrollArea className="h-full">
            {filteredGroups.map((group) => (
              <SwipeableChatItem
                key={group.id}
                onDelete={() => handleDeleteChat(group.id)}
                onArchive={() => handleArchiveChat(group.id)}
                onPin={() => handlePinChat(group.id)}
                canPin={canPin}
                isArabic={isArabic}
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors active:bg-white/10 hover:bg-white/5"
                  style={{ backgroundColor: colors.bg, borderBottom: `1px solid ${colors.divider}` }}
                  onClick={() => handleSelectGroup(group)}
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={group.image_url || undefined} />
                    <AvatarFallback style={{ backgroundColor: colors.accent }}><Users className="h-6 w-6 text-white" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate" style={{ color: colors.textPrimary }}>{group.name}</span>
                      {group.last_message_time && (
                        <span className="text-xs" style={{ color: colors.textMuted }}>{formatChatTime(group.last_message_time)}</span>
                      )}
                    </div>
                    <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                      {group.description || (isArabic ? 'محادثة جماعية' : 'Group chat')}
                    </p>
                  </div>
                </div>
              </SwipeableChatItem>
            ))}
          </ScrollArea>
        )}

        {activeTab === 'contacts' && (
          <MessengerContacts
            onSelectContact={(contact) => {
              const newConv: Conversation = {
                id: contact.id,
                recipient_id: contact.id,
                recipient_name: contact.full_name,
                recipient_image: contact.profile_image,
                last_message: null,
                last_message_time: null,
                unread_count: 0,
                is_group: false,
                is_online: false
              };
              handleSelectConversation(newConv);
            }}
            isArabic={isArabic}
          />
        )}
        {activeTab === 'settings' && <MessengerSettingsWithTheme profile={profile} isArabic={isArabic} />}
      </div>

      {/* FAB */}
      {(activeTab === 'chats' || activeTab === 'groups') && !isSelectMode && (
        <Button
          className="fixed right-5 shadow-lg h-14 w-14 rounded-full"
          style={{ backgroundColor: colors.accent, bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
          onClick={() => activeTab === 'groups' ? setShowCreateGroup(true) : setShowNewChat(true)}
        >
          {activeTab === 'groups' ? <Users className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
        </Button>
      )}

      <MessengerBottomNav activeTab={activeTab} onTabChange={setActiveTab} unreadCount={totalUnread} isArabic={isArabic} />
    </div>
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {showChatView ? renderChatView() : renderMessengerMain()}
      </AnimatePresence>

      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent 
          className="max-w-md border-0 p-0 overflow-hidden z-[9999]" 
          style={{ backgroundColor: colors.bgSecondary }}
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <div className="p-4 flex items-center gap-3" style={{ backgroundColor: colors.headerBg }}>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowNewChat(false)}>
              <X className="h-5 w-5" style={{ color: colors.textPrimary }} />
            </Button>
            <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{isArabic ? 'محادثة جديدة' : 'New Chat'}</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.textMuted }} />
              <Input placeholder={isArabic ? 'البحث عن جهات الاتصال...' : 'Search contacts...'} value={newChatSearchQuery} onChange={(e) => handleNewChatSearch(e.target.value)} className="pl-10 border-0 rounded-lg" style={{ backgroundColor: colors.inputBg, color: colors.textPrimary }} />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/5" onClick={() => { setShowNewChat(false); setShowCreateGroup(true); }}>
              <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.accent }}><Users className="h-6 w-6 text-white" /></div>
              <span className="font-medium" style={{ color: colors.textPrimary }}>{isArabic ? 'مجموعة جديدة' : 'New group'}</span>
            </div>
            <ScrollArea className="h-64">
              {newChatSearching ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.accent }} /></div>
              ) : newChatSearchQuery.trim().length > 0 ? (
                newChatSearchResults.length > 0 ? (
                  newChatSearchResults.map((userResult) => (
                    <div key={userResult.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/5" onClick={() => startNewConversation(userResult)}>
                      <Avatar className="h-12 w-12"><AvatarImage src={userResult.profile_image || undefined} /><AvatarFallback style={{ backgroundColor: colors.accent }}>{userResult.full_name?.charAt(0) || '?'}</AvatarFallback></Avatar>
                      <div><p className="font-medium" style={{ color: colors.textPrimary }}>{userResult.full_name}</p><p className="text-xs capitalize" style={{ color: colors.textMuted }}>{userResult.role}</p></div>
                    </div>
                  ))
                ) : <p className="text-center py-8" style={{ color: colors.textMuted }}>{isArabic ? 'لم يتم العثور على مستخدمين' : 'No users found'}</p>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.recipient_id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/5" onClick={() => { handleSelectConversation(conv); setShowNewChat(false); }}>
                    <Avatar className="h-12 w-12"><AvatarImage src={conv.recipient_image || undefined} /><AvatarFallback style={{ backgroundColor: colors.accent }}>{conv.recipient_name?.charAt(0) || '?'}</AvatarFallback></Avatar>
                    <p className="font-medium" style={{ color: colors.textPrimary }}>{conv.recipient_name}</p>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <CreateGroupDialog open={showCreateGroup} onClose={() => setShowCreateGroup(false)} onCreate={async (name, description, memberIds) => { await createGroup(name, description, memberIds); setShowCreateGroup(false); }} searchUsers={searchUsers} isArabic={isArabic} />
      <ForwardDialog open={!!forwardMessage} onClose={() => setForwardMessage(null)} onForward={() => setForwardMessage(null)} conversations={conversations} groups={groups} messagePreview={forwardMessage?.content || ''} isArabic={isArabic} />
      <CallScreen isArabic={isArabic} />
    </>
  );
}

export default function Messenger() {
  return (
    <MessengerThemeProvider>
      <MessengerContent />
    </MessengerThemeProvider>
  );
}
