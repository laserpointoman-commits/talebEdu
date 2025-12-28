import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMessenger, Conversation, GroupChat } from '@/hooks/useMessenger';
import { useIsMobile } from '@/hooks/use-mobile';
import { WHATSAPP_COLORS } from '@/components/messenger/WhatsAppTheme';
import { MessageBubble } from '@/components/messenger/MessageBubble';
import { ChatHeader } from '@/components/messenger/ChatHeader';
import { ChatInput } from '@/components/messenger/ChatInput';
import { ForwardDialog } from '@/components/messenger/ForwardDialog';
import { CreateGroupDialog } from '@/components/messenger/CreateGroupDialog';
import { MessengerChatList } from '@/components/messenger/MessengerChatList';
import { MessengerBottomNav } from '@/components/messenger/MessengerBottomNav';
import { MessengerUpdates } from '@/components/messenger/MessengerUpdates';
import { MessengerCalls } from '@/components/messenger/MessengerCalls';
import { MessengerSearch } from '@/components/messenger/MessengerSearch';
import { MessengerSettings } from '@/components/messenger/MessengerSettings';
import { MessengerDesktopLayout } from '@/components/messenger/MessengerDesktopLayout';
import { CallScreen } from '@/components/messenger/CallScreen';
import { callService } from '@/services/callService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft,
  Search, 
  MessageCircle, 
  Users,
  MoreVertical,
  Camera,
  Loader2,
  X
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

type MessengerTab = 'chats' | 'groups' | 'calls' | 'search' | 'settings';

export default function Messenger() {
  const navigate = useNavigate();
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
    searchUsers,
    fetchConversations,
    fetchGroups,
    fetchCallLogs,
    createGroup
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

  const isArabic = language === 'ar';
  const dir = isArabic ? 'rtl' : 'ltr';

  // Initialize call service and fetch all data on mount
  useEffect(() => {
    if (user?.id) {
      callService.initialize(user.id);
      fetchConversations();
      fetchGroups();
      fetchCallLogs();
    }
  }, [user?.id, fetchConversations, fetchGroups, fetchCallLogs]);

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

  // Handle new chat search
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

  // Start new conversation with a user
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

  // Group messages by date
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

  // Handle send message
  const handleSendMessage = (content: string, files: File[], replyToMsg?: any) => {
    if (!selectedConversation) return;
    sendMessage(selectedConversation.recipient_id, content, files, replyToMsg?.id);
    setReplyTo(null);
  };

  // Handle voice send
  const handleVoiceSend = (audioBlob: Blob, duration: number) => {
    if (!selectedConversation) return;
    const file = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });
    sendMessage(selectedConversation.recipient_id, '', [file], undefined, undefined, 'voice', duration);
  };

  // Handle conversation select
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setSelectedGroup(null);
    setShowChatView(true);
  };

  // Handle group select
  const handleSelectGroup = (group: GroupChat) => {
    setSelectedGroup(group);
    setSelectedConversation(null);
    setShowChatView(true);
  };

  // Handle back from chat
  const handleBackFromChat = () => {
    setShowChatView(false);
    setSelectedConversation(null);
    setSelectedGroup(null);
  };

  // Exit messenger completely
  const handleExitMessenger = () => {
    navigate('/dashboard');
  };

  // Handle voice call
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

  // Handle video call
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

  // Total unread count
  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  if (loading) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center z-[100]" 
        style={{ backgroundColor: WHATSAPP_COLORS.bg }}
      >
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: WHATSAPP_COLORS.accent }} />
      </div>
    );
  }

  // Desktop/Tablet Layout - WhatsApp Web Style
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
          isArabic={isArabic}
        />

        {/* New Chat Dialog */}
        <Dialog open={showNewChat} onOpenChange={(open) => {
          setShowNewChat(open);
          if (!open) {
            setNewChatSearchQuery('');
            setNewChatSearchResults([]);
          }
        }}>
          <DialogContent 
            className="max-w-md border-0 p-0 overflow-hidden z-[200]" 
            style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary }}
          >
            <div className="p-4 flex items-center gap-3" style={{ backgroundColor: WHATSAPP_COLORS.headerBg }}>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowNewChat(false)}>
                <X className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textPrimary }} />
              </Button>
              <h2 className="text-lg font-semibold" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                {isArabic ? 'محادثة جديدة' : 'New Chat'}
              </h2>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: WHATSAPP_COLORS.textMuted }} />
                <Input
                  placeholder={isArabic ? 'البحث عن جهات الاتصال...' : 'Search contacts...'}
                  value={newChatSearchQuery}
                  onChange={(e) => handleNewChatSearch(e.target.value)}
                  className="pl-10 border-0 rounded-lg"
                  style={{ backgroundColor: WHATSAPP_COLORS.inputBg, color: WHATSAPP_COLORS.textPrimary }}
                />
              </div>
              
              <div 
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/5"
                onClick={() => {
                  setShowNewChat(false);
                  setShowCreateGroup(true);
                }}
              >
                <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                  <Users className="h-6 w-6 text-white" />
                </div>
                <span className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                  {isArabic ? 'مجموعة جديدة' : 'New group'}
                </span>
              </div>

              <div className="pt-2">
                <p className="text-xs font-medium mb-2 px-1" style={{ color: WHATSAPP_COLORS.textMuted }}>
                  {newChatSearchQuery.trim().length > 0 
                    ? (isArabic ? 'نتائج البحث' : 'Search results')
                    : (isArabic ? 'المحادثات الأخيرة' : 'Recent chats')}
                </p>
                <ScrollArea className="h-64">
                  {newChatSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" style={{ color: WHATSAPP_COLORS.accent }} />
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
                            <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                              {userResult.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                              {userResult.full_name}
                            </p>
                            <p className="text-xs capitalize" style={{ color: WHATSAPP_COLORS.textMuted }}>
                              {userResult.role}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8" style={{ color: WHATSAPP_COLORS.textMuted }}>
                        {isArabic ? 'لم يتم العثور على مستخدمين' : 'No users found'}
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
                    ))
                  )}
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Group Dialog */}
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

        {/* Forward Dialog */}
        <ForwardDialog
          open={!!forwardMessage}
          onClose={() => setForwardMessage(null)}
          onForward={(recipientIds) => {
            setForwardMessage(null);
          }}
          conversations={conversations}
          groups={groups}
          messagePreview={forwardMessage?.content || ''}
          isArabic={isArabic}
        />

        {/* Call Screen Overlay */}
        <CallScreen isArabic={isArabic} />
      </>
    );
  }

  // Mobile Layout - Original Full Screen Approach
  // Chat View (Full Screen)
  const renderChatView = () => (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.2 }}
      className="fixed inset-0 flex flex-col z-[100]"
      style={{ backgroundColor: WHATSAPP_COLORS.bg }}
      dir={dir}
    >
      {/* Chat Header */}
      <ChatHeader
        conversation={selectedConversation}
        group={selectedGroup}
        onBack={handleBackFromChat}
        onVoiceCall={handleVoiceCall}
        onVideoCall={handleVideoCall}
        isArabic={isArabic}
      />

      {/* Messages Area */}
      <ScrollArea 
        className="flex-1 px-3 py-2"
        style={{ 
          backgroundColor: WHATSAPP_COLORS.light.chatBg,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }}
      >
        <div className="max-w-3xl mx-auto space-y-1">
          {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex justify-center my-3">
                <span 
                  className="px-3 py-1 rounded-lg text-xs font-medium shadow-sm"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    color: WHATSAPP_COLORS.light.textSecondary 
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
    </motion.div>
  );

  // Main Messenger View (Mobile)
  const renderMessengerMain = () => (
    <div 
      className="fixed inset-0 flex flex-col z-[100]" 
      style={{ backgroundColor: WHATSAPP_COLORS.bg }}
      dir={dir}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ 
          backgroundColor: WHATSAPP_COLORS.headerBg,
          paddingTop: 'max(env(safe-area-inset-top), 12px)'
        }}
      >
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-white/10"
            onClick={handleExitMessenger}
          >
            <ArrowLeft className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textPrimary }} />
          </Button>
          <h1 className="text-xl font-bold" style={{ color: WHATSAPP_COLORS.textPrimary }}>
            {activeTab === 'chats' ? (isArabic ? 'المحادثات' : 'Chats') :
             activeTab === 'groups' ? (isArabic ? 'المجموعات' : 'Groups') :
             activeTab === 'calls' ? (isArabic ? 'المكالمات' : 'Calls') :
             activeTab === 'search' ? (isArabic ? 'البحث' : 'Search') :
             (isArabic ? 'الإعدادات' : 'Settings')}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
            <Camera className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-white/10"
            onClick={() => setActiveTab('search')}
          >
            <Search className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
            <MoreVertical className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chats' && (
          <MessengerChatList
            conversations={conversations}
            groups={groups}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSelectConversation={handleSelectConversation}
            onSelectGroup={handleSelectGroup}
            onNewChat={() => setShowNewChat(true)}
            isArabic={isArabic}
          />
        )}

        {activeTab === 'groups' && (
          <MessengerChatList
            conversations={[]}
            groups={groups}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSelectConversation={handleSelectConversation}
            onSelectGroup={handleSelectGroup}
            onNewChat={() => setShowCreateGroup(true)}
            showGroupsOnly
            isArabic={isArabic}
          />
        )}

        {activeTab === 'calls' && (
          <MessengerCalls callLogs={callLogs} isArabic={isArabic} />
        )}

        {activeTab === 'search' && (
          <MessengerSearch
            conversations={conversations}
            groups={groups}
            onSelectConversation={handleSelectConversation}
            onSelectGroup={handleSelectGroup}
            searchUsers={searchUsers}
            isArabic={isArabic}
          />
        )}

        {activeTab === 'settings' && (
          <MessengerSettings profile={profile} isArabic={isArabic} />
        )}
      </div>

      {/* FAB for new chat/group */}
      {(activeTab === 'chats' || activeTab === 'groups') && (
        <Button
          className="fixed right-5 shadow-lg h-14 w-14 rounded-full"
          style={{ 
            backgroundColor: WHATSAPP_COLORS.accent,
            bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))'
          }}
          onClick={() => activeTab === 'groups' ? setShowCreateGroup(true) : setShowNewChat(true)}
        >
          {activeTab === 'groups' ? (
            <Users className="h-6 w-6 text-white" />
          ) : (
            <MessageCircle className="h-6 w-6 text-white" />
          )}
        </Button>
      )}

      {/* Bottom Navigation */}
      <MessengerBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadCount={totalUnread}
        isArabic={isArabic}
      />
    </div>
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {showChatView ? renderChatView() : renderMessengerMain()}
      </AnimatePresence>

      {/* New Chat Dialog */}
      <Dialog open={showNewChat} onOpenChange={(open) => {
        setShowNewChat(open);
        if (!open) {
          setNewChatSearchQuery('');
          setNewChatSearchResults([]);
        }
      }}>
        <DialogContent 
          className="max-w-md border-0 p-0 overflow-hidden z-[200]" 
          style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary }}
        >
          <div className="p-4 flex items-center gap-3" style={{ backgroundColor: WHATSAPP_COLORS.headerBg }}>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowNewChat(false)}>
              <X className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textPrimary }} />
            </Button>
            <h2 className="text-lg font-semibold" style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {isArabic ? 'محادثة جديدة' : 'New Chat'}
            </h2>
          </div>
          
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: WHATSAPP_COLORS.textMuted }} />
              <Input
                placeholder={isArabic ? 'البحث عن جهات الاتصال...' : 'Search contacts...'}
                value={newChatSearchQuery}
                onChange={(e) => handleNewChatSearch(e.target.value)}
                className="pl-10 border-0 rounded-lg"
                style={{ backgroundColor: WHATSAPP_COLORS.inputBg, color: WHATSAPP_COLORS.textPrimary }}
              />
            </div>
            
            <div 
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/5"
              onClick={() => {
                setShowNewChat(false);
                setShowCreateGroup(true);
              }}
            >
              <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                {isArabic ? 'مجموعة جديدة' : 'New group'}
              </span>
            </div>

            <div className="pt-2">
              <p className="text-xs font-medium mb-2 px-1" style={{ color: WHATSAPP_COLORS.textMuted }}>
                {newChatSearchQuery.trim().length > 0 
                  ? (isArabic ? 'نتائج البحث' : 'Search results')
                  : (isArabic ? 'المحادثات الأخيرة' : 'Recent chats')}
              </p>
              <ScrollArea className="h-64">
                {newChatSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: WHATSAPP_COLORS.accent }} />
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
                          <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                            {userResult.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                            {userResult.full_name}
                          </p>
                          <p className="text-xs capitalize" style={{ color: WHATSAPP_COLORS.textMuted }}>
                            {userResult.role}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8" style={{ color: WHATSAPP_COLORS.textMuted }}>
                      {isArabic ? 'لم يتم العثور على مستخدمين' : 'No users found'}
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
                  ))
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Group Dialog */}
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

      {/* Forward Dialog */}
      <ForwardDialog
        open={!!forwardMessage}
        onClose={() => setForwardMessage(null)}
        onForward={(recipientIds) => {
          setForwardMessage(null);
        }}
        conversations={conversations}
        groups={groups}
        messagePreview={forwardMessage?.content || ''}
        isArabic={isArabic}
      />

      {/* Call Screen Overlay */}
      <CallScreen isArabic={isArabic} />
    </>
  );
}
