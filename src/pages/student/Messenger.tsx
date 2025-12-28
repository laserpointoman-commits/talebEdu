import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  MoreHorizontal,
  Camera,
  Check,
  CheckCheck,
  Mic,
  Send,
  Paperclip,
  Smile,
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  X,
  Plus,
  Phone,
  Video,
  Archive,
  Users,
  UserPlus,
  Megaphone,
  Settings,
  Heart,
  Grid3X3,
  Calendar,
  Info,
  Edit3,
  PhoneOutgoing,
  PhoneMissed,
  MessageCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

// WhatsApp Dark Theme Colors
const COLORS = {
  bg: '#0B141A',
  bgSecondary: '#111B21',
  bgTertiary: '#1F2C34',
  headerBg: '#1F2C34',
  inputBg: '#2A3942',
  accent: '#00A884',
  accentLight: '#25D366',
  textPrimary: '#E9EDEF',
  textSecondary: '#8696A0',
  textMuted: '#667781',
  divider: '#222D34',
  messageSent: '#005C4B',
  messageReceived: '#1F2C34',
  unreadBadge: '#25D366',
  missedCall: '#F15C6D',
  blue: '#53BDEB',
};

interface Conversation {
  id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_image: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  is_group?: boolean;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  is_read: boolean;
  is_forwarded?: boolean;
  attachments?: Array<{
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
  }>;
}

interface UserSearchResult {
  id: string;
  full_name: string;
  profile_image: string | null;
  role: string;
}

type TabType = 'updates' | 'calls' | 'tools' | 'chats' | 'settings';

export default function Messenger() {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogSearchQuery, setDialogSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [chatFilter, setChatFilter] = useState<'all' | 'unread' | 'favorites' | 'groups'>('all');
  const [archivedCount] = useState(2);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isArabic = language === 'ar';

  const t = (en: string, ar: string) => isArabic ? ar : en;

  useEffect(() => {
    if (user) {
      fetchConversations();
      const unsubscribe = subscribeToMessages();
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      markMessagesAsRead(selectedConversation.recipient_id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const total = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
    setTotalUnread(total);
  }, [conversations]);

  useEffect(() => {
    if (dialogSearchQuery.trim().length > 0) {
      searchUsers(dialogSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [dialogSearchQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    setLoading(true);
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
      .order('created_at', { ascending: false });

    if (!error && messages) {
      const userIds = new Set<string>();
      messages.forEach(msg => {
        if (msg.sender_id !== user?.id) userIds.add(msg.sender_id);
        if (msg.recipient_id !== user?.id) userIds.add(msg.recipient_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, profile_image')
        .in('id', Array.from(userIds));

      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      const conversationMap = new Map<string, Conversation>();
      messages.forEach(msg => {
        const isRecipient = msg.recipient_id === user?.id;
        const otherUserId = isRecipient ? msg.sender_id : msg.recipient_id;
        const otherUser = profileMap.get(otherUserId);
        
        if (otherUser && !conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            recipient_id: otherUserId,
            recipient_name: otherUser.full_name || 'Unknown User',
            recipient_image: otherUser.profile_image,
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: 0
          });
        }
        
        if (isRecipient && !msg.is_read && conversationMap.has(otherUserId)) {
          const conv = conversationMap.get(otherUserId)!;
          conv.unread_count++;
        }
      });
      
      setConversations(Array.from(conversationMap.values()));
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;
    
    const { data, error } = await supabase
      .from('direct_messages')
      .select(`
        *,
        message_attachments (
          id,
          file_name,
          file_url,
          file_type,
          file_size
        )
      `)
      .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${selectedConversation.recipient_id}),and(sender_id.eq.${selectedConversation.recipient_id},recipient_id.eq.${user?.id})`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const formattedMessages = data.map(msg => ({
        ...msg,
        attachments: msg.message_attachments || []
      }));
      setMessages(formattedMessages as Message[]);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('whatsapp-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${user?.id}`
        },
        () => {
          fetchConversations();
          if (selectedConversation) {
            fetchMessages();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages'
        },
        (payload) => {
          if (selectedConversation) {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, is_read: payload.new.is_read }
                : msg
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const searchUsers = async (query: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, profile_image, role')
      .ilike('full_name', `%${query}%`)
      .neq('id', user?.id)
      .limit(20);

    if (!error && data) {
      setSearchResults(data as UserSearchResult[]);
    }
  };

  const markMessagesAsRead = async (senderId: string) => {
    await supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('recipient_id', user?.id);
    
    setConversations(prev => 
      prev.map(conv => 
        conv.recipient_id === senderId 
          ? { ...conv, unread_count: 0 }
          : conv
      )
    );
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || sending || !selectedConversation) return;

    setSending(true);
    const { data: messageData, error: messageError } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user?.id,
        recipient_id: selectedConversation.recipient_id,
        content: newMessage.trim() || null
      })
      .select()
      .single();

    if (!messageError && messageData) {
      const newMsg: Message = {
        id: messageData.id,
        content: messageData.content || '',
        sender_id: messageData.sender_id,
        recipient_id: messageData.recipient_id,
        created_at: messageData.created_at,
        is_read: false,
        attachments: []
      };

      if (selectedFiles.length > 0) {
        const uploadedAttachments: any[] = [];
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user?.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('message-attachments')
            .upload(fileName, file);

          if (!uploadError && uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('message-attachments')
              .getPublicUrl(fileName);

            await supabase
              .from('message_attachments')
              .insert({
                message_id: messageData.id,
                file_name: file.name,
                file_url: publicUrl,
                file_type: file.type,
                file_size: file.size
              });

            uploadedAttachments.push({
              id: crypto.randomUUID(),
              file_name: file.name,
              file_url: publicUrl,
              file_type: file.type,
              file_size: file.size
            });
          }
        }
        newMsg.attachments = uploadedAttachments;
      }

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      setSelectedFiles([]);
      setTimeout(scrollToBottom, 100);
    }
    setSending(false);
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setSearchQuery('');
  };

  const handleSelectUser = async (userResult: UserSearchResult) => {
    const newConversation: Conversation = {
      id: userResult.id,
      recipient_id: userResult.id,
      recipient_name: userResult.full_name,
      recipient_image: userResult.profile_image,
      last_message: null,
      last_message_time: null,
      unread_count: 0
    };
    setSelectedConversation(newConversation);
    setShowNewChatDialog(false);
    setDialogSearchQuery('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files.filter(file => file.size <= 10 * 1024 * 1024));
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return t('Yesterday', 'أمس');
    return format(date, 'dd/MM/yyyy');
  };

  const formatChatTime = (dateStr: string) => format(new Date(dateStr), 'h:mm a');

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    
    messages.forEach(msg => {
      const msgDate = format(new Date(msg.created_at), 'yyyy-MM-dd');
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    
    return groups;
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return t('Today', 'اليوم');
    if (isYesterday(date)) return t('Yesterday', 'أمس');
    return format(date, 'MMMM d, yyyy');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!user) return null;

  // Chat View - WhatsApp Dark Theme
  if (selectedConversation) {
    const messageGroups = groupMessagesByDate(messages);
    
    return (
      <div className="h-full w-full flex flex-col" style={{ backgroundColor: COLORS.bg }}>
        {/* Header */}
        <div className="px-2 py-2 flex items-center gap-2" style={{ backgroundColor: COLORS.headerBg }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-white/10"
            style={{ color: COLORS.textPrimary }}
            onClick={() => setSelectedConversation(null)}
          >
            <ArrowLeft className="h-5 w-5" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -left-1 text-xs font-bold" style={{ color: COLORS.textPrimary }}>
                {totalUnread}
              </span>
            )}
          </Button>
          
          <Avatar className="h-10 w-10 border-2" style={{ borderColor: COLORS.divider }}>
            <AvatarImage src={selectedConversation.recipient_image || undefined} />
            <AvatarFallback style={{ backgroundColor: COLORS.accent, color: 'white' }}>
              {selectedConversation.recipient_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-medium text-base truncate" style={{ color: COLORS.textPrimary }}>
              {selectedConversation.recipient_name}
            </h2>
          </div>
          
          <div className="flex items-center gap-0">
            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/10" style={{ color: COLORS.textPrimary }}>
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/10" style={{ color: COLORS.textPrimary }}>
              <Phone className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: COLORS.bg }}
        >
          <div className="p-3 space-y-1 min-h-full">
            {messageGroups.map(group => (
              <div key={group.date}>
                {/* Date Separator */}
                <div className="flex justify-center my-3">
                  <span 
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: COLORS.bgTertiary, color: COLORS.textSecondary }}
                  >
                    {getDateLabel(group.date)}
                  </span>
                </div>
                
                {/* Messages */}
                {group.messages.map(message => {
                  const isOwnMessage = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex mb-1",
                        isOwnMessage ? "justify-end" : "justify-start"
                      )}
                    >
                      <div 
                        className="max-w-[75%] rounded-lg px-3 py-1.5 relative"
                        style={{ 
                          backgroundColor: isOwnMessage ? COLORS.messageSent : COLORS.messageReceived 
                        }}
                      >
                        {message.is_forwarded && (
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs italic" style={{ color: COLORS.textMuted }}>
                              ↗ {t('Forwarded', 'محول')}
                            </span>
                          </div>
                        )}
                        
                        {message.content && (
                          <p className="text-sm leading-relaxed break-words" style={{ color: COLORS.textPrimary }}>
                            {message.content}
                          </p>
                        )}
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {message.attachments.map(attachment => (
                              <div key={attachment.id}>
                                {attachment.file_type.startsWith('image/') ? (
                                  <img
                                    src={attachment.file_url}
                                    alt={attachment.file_name}
                                    className="rounded max-w-full"
                                  />
                                ) : (
                                  <a
                                    href={attachment.file_url}
                                    download={attachment.file_name}
                                    className="flex items-center gap-2 text-xs rounded p-2"
                                    style={{ backgroundColor: COLORS.bgTertiary }}
                                  >
                                    <div 
                                      className="w-10 h-10 rounded flex items-center justify-center"
                                      style={{ backgroundColor: COLORS.missedCall }}
                                    >
                                      <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="truncate block" style={{ color: COLORS.textPrimary }}>
                                        {attachment.file_name}
                                      </span>
                                      <span style={{ color: COLORS.textMuted }}>
                                        {formatFileSize(attachment.file_size)} • {attachment.file_type.split('/')[1]?.toUpperCase()}
                                      </span>
                                    </div>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                            {formatChatTime(message.created_at)}
                          </span>
                          {isOwnMessage && (
                            message.is_read 
                              ? <CheckCheck className="h-4 w-4" style={{ color: COLORS.blue }} />
                              : <Check className="h-4 w-4" style={{ color: COLORS.textMuted }} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="px-3 py-2" style={{ backgroundColor: COLORS.bgSecondary, borderTopColor: COLORS.divider, borderTopWidth: 1 }}>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-1 rounded-full px-3 py-1"
                  style={{ backgroundColor: COLORS.bgTertiary }}
                >
                  {file.type.startsWith('image/') ? <ImageIcon className="h-4 w-4" style={{ color: COLORS.textSecondary }} /> : <FileText className="h-4 w-4" style={{ color: COLORS.textSecondary }} />}
                  <span className="text-xs truncate max-w-[100px]" style={{ color: COLORS.textSecondary }}>{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:text-red-500"
                    style={{ color: COLORS.textSecondary }}
                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="px-2 py-2 flex items-center gap-2" style={{ backgroundColor: COLORS.bg }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-white/10"
            style={{ color: COLORS.textSecondary }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="h-6 w-6" />
          </Button>
          
          <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: COLORS.inputBg }}>
            <Input
              placeholder={t('Message', 'رسالة')}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="flex-1 bg-transparent border-0 text-sm focus-visible:ring-0 p-0 h-auto"
              style={{ color: COLORS.textPrimary }}
            />
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0" style={{ color: COLORS.textSecondary }}>
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-white/10"
            style={{ color: COLORS.textSecondary }}
          >
            <Camera className="h-6 w-6" />
          </Button>
          
          {newMessage.trim() || selectedFiles.length > 0 ? (
            <Button
              size="icon"
              className="h-10 w-10 rounded-full"
              style={{ backgroundColor: COLORS.accent }}
              onClick={handleSendMessage}
              disabled={sending}
            >
              <Send className="h-5 w-5 text-white" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-white/10"
              style={{ color: COLORS.textSecondary }}
            >
              <Mic className="h-6 w-6" />
            </Button>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,video/*"
          />
        </div>
      </div>
    );
  }

  // Main View with Bottom Tabs
  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: COLORS.bg }}>
      {/* Tab Content */}
      {activeTab === 'chats' && (
        <>
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: COLORS.bg }}>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" style={{ backgroundColor: COLORS.bgTertiary, color: COLORS.textSecondary }}>
              <MoreHorizontal className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
              {t('Chats', 'الدردشات')}
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" style={{ backgroundColor: COLORS.bgTertiary, color: COLORS.textSecondary }}>
                <Camera className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full"
                style={{ backgroundColor: COLORS.bgTertiary, color: COLORS.textSecondary }}
                onClick={() => setShowNewChatDialog(true)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: COLORS.textMuted }} />
              <Input
                placeholder={t('Search', 'بحث')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 rounded-lg border-0 text-sm"
                style={{ backgroundColor: COLORS.inputBg, color: COLORS.textPrimary }}
              />
            </div>
          </div>

          {/* Chat Filters */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto">
            {(['all', 'unread', 'favorites', 'groups'] as const).map((filter) => (
              <Button
                key={filter}
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-full h-8 px-4 text-sm font-medium whitespace-nowrap",
                  chatFilter === filter ? "bg-opacity-100" : "bg-opacity-0"
                )}
                style={{ 
                  backgroundColor: chatFilter === filter ? COLORS.bgTertiary : 'transparent',
                  color: COLORS.textPrimary
                }}
                onClick={() => setChatFilter(filter)}
              >
                {filter === 'all' && t('All', 'الكل')}
                {filter === 'unread' && t('Unread', 'غير مقروءة')}
                {filter === 'favorites' && t('Favorites', 'المفضلة')}
                {filter === 'groups' && t('Groups', 'المجموعات')}
              </Button>
            ))}
          </div>

          {/* Archived Section */}
          {archivedCount > 0 && (
            <button 
              className="w-full px-4 py-3 flex items-center gap-4 hover:opacity-80 transition-opacity"
              style={{ borderBottomWidth: 1, borderColor: COLORS.divider }}
            >
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLORS.bgTertiary }}
              >
                <Archive className="h-5 w-5" style={{ color: COLORS.textSecondary }} />
              </div>
              <span className="font-medium" style={{ color: COLORS.textPrimary }}>
                {t('Archived', 'الأرشيف')}
              </span>
              <span className="ml-auto" style={{ color: COLORS.accent }}>
                {archivedCount}
              </span>
            </button>
          )}

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: COLORS.accent }}></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: COLORS.bgTertiary }}
                >
                  <MessageCircle className="w-10 h-10" style={{ color: COLORS.accent }} />
                </div>
                <p className="text-lg font-medium" style={{ color: COLORS.textPrimary }}>
                  {t('No conversations yet', 'لا توجد محادثات بعد')}
                </p>
                <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
                  {t('Start chatting with your contacts', 'ابدأ الدردشة مع جهات اتصالك')}
                </p>
              </div>
            ) : (
              <div>
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:opacity-80 transition-opacity"
                    style={{ borderBottomWidth: 1, borderColor: COLORS.divider }}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.recipient_image || undefined} />
                      <AvatarFallback style={{ backgroundColor: COLORS.accent, color: 'white' }}>
                        {conv.recipient_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate" style={{ color: COLORS.textPrimary }}>
                          {conv.recipient_name}
                        </p>
                        <span 
                          className="text-xs flex-shrink-0"
                          style={{ color: conv.unread_count > 0 ? COLORS.accent : COLORS.textMuted }}
                        >
                          {conv.last_message_time && formatMessageTime(conv.last_message_time)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-sm truncate flex items-center gap-1" style={{ color: COLORS.textSecondary }}>
                          {conv.last_message ? (
                            <>
                              <CheckCheck className="h-4 w-4 flex-shrink-0" style={{ color: COLORS.blue }} />
                              <span className="truncate">{conv.last_message}</span>
                            </>
                          ) : (
                            t('No messages yet', 'لا توجد رسائل بعد')
                          )}
                        </p>
                        {conv.unread_count > 0 && (
                          <Badge 
                            className="h-5 min-w-[20px] px-1.5 rounded-full text-xs text-white"
                            style={{ backgroundColor: COLORS.unreadBadge }}
                          >
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </>
      )}

      {activeTab === 'updates' && (
        <>
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: COLORS.bg }}>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" style={{ backgroundColor: COLORS.bgTertiary, color: COLORS.textSecondary }}>
              <MoreHorizontal className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
              {t('Updates', 'التحديثات')}
            </h1>
            <div className="h-9 w-9" />
          </div>

          {/* Search Bar */}
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: COLORS.textMuted }} />
              <Input
                placeholder={t('Search', 'بحث')}
                className="pl-10 h-9 rounded-lg border-0 text-sm"
                style={{ backgroundColor: COLORS.inputBg, color: COLORS.textPrimary }}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {/* Status Section */}
            <div className="p-4">
              <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.textPrimary }}>
                {t('Status', 'الحالة')}
              </h2>
              
              {/* Add Status */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div 
                    className="h-14 w-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#5E3C58' }}
                  >
                    <Users className="h-7 w-7" style={{ color: '#E966A0' }} />
                  </div>
                  <div 
                    className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: COLORS.accent }}
                  >
                    <Plus className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium" style={{ color: COLORS.textPrimary }}>
                    {t('Add status', 'أضف حالة')}
                  </p>
                  <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                    {t('Disappears after 24 hours', 'تختفي بعد 24 ساعة')}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" style={{ backgroundColor: COLORS.bgTertiary, color: COLORS.textSecondary }}>
                  <Camera className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" style={{ backgroundColor: COLORS.bgTertiary, color: COLORS.textSecondary }}>
                  <Edit3 className="h-5 w-5" />
                </Button>
              </div>

              {/* Recent Updates */}
              <p className="text-sm mb-3" style={{ color: COLORS.accent }}>
                {t('Recent updates', 'التحديثات الأخيرة')}
              </p>
              
              {[1, 2].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div 
                    className="h-14 w-14 rounded-full p-0.5"
                    style={{ background: `linear-gradient(45deg, ${COLORS.accent}, ${COLORS.accentLight})` }}
                  >
                    <Avatar className="h-full w-full border-2" style={{ borderColor: COLORS.bg }}>
                      <AvatarFallback style={{ backgroundColor: COLORS.bgTertiary, color: COLORS.textPrimary }}>
                        {String.fromCharCode(65 + i)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: COLORS.textPrimary }}>
                      {t('Contact', 'جهة اتصال')} {i + 1}
                    </p>
                    <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                      {21 + i}h ago
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Channels Section */}
            <div className="p-4 mt-4">
              <h2 className="text-lg font-bold mb-2" style={{ color: COLORS.textPrimary }}>
                {t('Channels', 'القنوات')}
              </h2>
              <p className="text-sm mb-4" style={{ color: COLORS.textSecondary }}>
                {t('Stay updated on topics that matter to you. Find channels to follow below.', 'ابق على اطلاع بالمواضيع التي تهمك.')}
              </p>
              
              <button className="flex items-center justify-between w-full py-2">
                <span style={{ color: COLORS.accent }}>
                  {t('Find channels to follow', 'اعثر على قنوات للمتابعة')}
                </span>
                <span style={{ color: COLORS.textSecondary }}>^</span>
              </button>
            </div>
          </ScrollArea>
        </>
      )}

      {activeTab === 'calls' && (
        <>
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: COLORS.bg }}>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" style={{ backgroundColor: COLORS.bgTertiary, color: COLORS.textSecondary }}>
              <MoreHorizontal className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
              {t('Calls', 'المكالمات')}
            </h1>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" style={{ backgroundColor: COLORS.bgTertiary, color: COLORS.textSecondary }}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: COLORS.textMuted }} />
              <Input
                placeholder={t('Search', 'بحث')}
                className="pl-10 h-9 rounded-lg border-0 text-sm"
                style={{ backgroundColor: COLORS.inputBg, color: COLORS.textPrimary }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-4 flex justify-around">
            {[
              { icon: Phone, label: t('Call', 'اتصال') },
              { icon: Calendar, label: t('Schedule', 'جدولة') },
              { icon: Grid3X3, label: t('Keypad', 'لوحة') },
              { icon: Heart, label: t('Favorites', 'المفضلة') }
            ].map((item, i) => (
              <button key={i} className="flex flex-col items-center gap-2">
                <div 
                  className="h-14 w-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: COLORS.bgTertiary }}
                >
                  <item.icon className="h-6 w-6" style={{ color: COLORS.textSecondary }} />
                </div>
                <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Recent Calls */}
          <ScrollArea className="flex-1">
            <div className="px-4">
              <h3 className="font-bold mb-3" style={{ color: COLORS.textPrimary }}>
                {t('Recent', 'الأخيرة')}
              </h3>
              
              {[
                { name: 'Contact 1', type: 'missed', date: 'Yesterday' },
                { name: 'Contact 2', type: 'outgoing', date: '21/12/2025' },
                { name: 'Contact 3', type: 'missed', date: '18/12/2025' },
              ].map((call, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottomWidth: 1, borderColor: COLORS.divider }}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback style={{ backgroundColor: COLORS.accent, color: 'white' }}>
                      {call.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p 
                      className="font-medium"
                      style={{ color: call.type === 'missed' ? COLORS.missedCall : COLORS.textPrimary }}
                    >
                      {call.name}
                    </p>
                    <div className="flex items-center gap-1">
                      {call.type === 'missed' ? (
                        <PhoneMissed className="h-4 w-4" style={{ color: COLORS.missedCall }} />
                      ) : (
                        <PhoneOutgoing className="h-4 w-4" style={{ color: COLORS.textSecondary }} />
                      )}
                      <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                        {call.type === 'missed' ? t('Missed', 'فائتة') : t('Outgoing', 'صادرة')}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                    {call.date}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" style={{ color: COLORS.textSecondary }}>
                    <Info className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {activeTab === 'tools' && (
        <>
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: COLORS.bg }}>
            <div className="h-9 w-9" />
            <h1 className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
              {t('Tools', 'الأدوات')}
            </h1>
            <div className="h-9 w-9" />
          </div>

          <ScrollArea className="flex-1 p-4">
            <p className="text-center" style={{ color: COLORS.textSecondary }}>
              {t('Tools coming soon', 'الأدوات قريباً')}
            </p>
          </ScrollArea>
        </>
      )}

      {activeTab === 'settings' && (
        <>
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: COLORS.bg }}>
            <div className="h-9 w-9" />
            <h1 className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
              {t('Settings', 'الإعدادات')}
            </h1>
            <div className="h-9 w-9" />
          </div>

          <ScrollArea className="flex-1">
            {/* Profile */}
            <div className="px-4 py-4 flex items-center gap-4" style={{ borderBottomWidth: 1, borderColor: COLORS.divider }}>
              <Avatar className="h-16 w-16">
                <AvatarImage src={(profile as any)?.profile_image || undefined} />
                <AvatarFallback style={{ backgroundColor: COLORS.accent, color: 'white' }}>
                  {(profile as any)?.full_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-lg" style={{ color: COLORS.textPrimary }}>
                  {(profile as any)?.full_name || t('User', 'مستخدم')}
                </p>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Settings Options */}
            {[
              { icon: Users, label: t('Account', 'الحساب') },
              { icon: MessageCircle, label: t('Chats', 'الدردشات') },
              { icon: Archive, label: t('Storage', 'التخزين') },
            ].map((item, i) => (
              <button
                key={i}
                className="w-full px-4 py-4 flex items-center gap-4"
                style={{ borderBottomWidth: 1, borderColor: COLORS.divider }}
              >
                <item.icon className="h-6 w-6" style={{ color: COLORS.textSecondary }} />
                <span style={{ color: COLORS.textPrimary }}>{item.label}</span>
              </button>
            ))}
          </ScrollArea>
        </>
      )}

      {/* Bottom Navigation */}
      <div 
        className="flex items-center justify-around py-2 border-t"
        style={{ backgroundColor: COLORS.bg, borderColor: COLORS.divider }}
      >
        {[
          { id: 'updates' as TabType, icon: MessageCircle, label: t('Updates', 'التحديثات'), badge: 0 },
          { id: 'calls' as TabType, icon: Phone, label: t('Calls', 'المكالمات'), badge: 0 },
          { id: 'tools' as TabType, icon: Calendar, label: t('Tools', 'الأدوات'), badge: 0 },
          { id: 'chats' as TabType, icon: MessageCircle, label: t('Chats', 'الدردشات'), badge: totalUnread },
          { id: 'settings' as TabType, icon: Settings, label: t('Settings', 'الإعدادات'), badge: 1 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center gap-1 py-1 px-3 relative"
          >
            <div className="relative">
              <tab.icon 
                className="h-6 w-6" 
                style={{ color: activeTab === tab.id ? COLORS.textPrimary : COLORS.textSecondary }} 
              />
              {tab.badge > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 h-4 min-w-[16px] px-1 text-[10px] rounded-full text-white border-0"
                  style={{ backgroundColor: COLORS.accent }}
                >
                  {tab.badge}
                </Badge>
              )}
            </div>
            <span 
              className="text-[10px]"
              style={{ color: activeTab === tab.id ? COLORS.textPrimary : COLORS.textSecondary }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent 
          className="max-w-full h-[80vh] p-0 border-0"
          style={{ backgroundColor: COLORS.bgSecondary }}
        >
          <div className="flex flex-col h-full">
            {/* Dialog Header */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottomWidth: 1, borderColor: COLORS.divider }}>
              <h2 className="text-lg font-medium" style={{ color: COLORS.textPrimary }}>
                {t('New chat', 'محادثة جديدة')}
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                style={{ color: COLORS.textSecondary }}
                onClick={() => setShowNewChatDialog(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Search */}
            <div className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: COLORS.textMuted }} />
                <Input
                  placeholder={t('Search name or number', 'ابحث عن الاسم أو الرقم')}
                  value={dialogSearchQuery}
                  onChange={(e) => setDialogSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-lg border-0"
                  style={{ backgroundColor: COLORS.inputBg, color: COLORS.textPrimary }}
                />
              </div>
            </div>

            {/* Options */}
            <div style={{ borderBottomWidth: 1, borderColor: COLORS.divider }}>
              {[
                { icon: Users, label: t('New group', 'مجموعة جديدة') },
                { icon: UserPlus, label: t('New contact', 'جهة اتصال جديدة') },
                { icon: Megaphone, label: t('New broadcast', 'بث جديد') }
              ].map((item, i) => (
                <button
                  key={i}
                  className="w-full px-4 py-3 flex items-center gap-4 hover:opacity-80"
                >
                  <item.icon className="h-5 w-5" style={{ color: COLORS.textSecondary }} />
                  <span style={{ color: COLORS.textPrimary }}>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Contacts List */}
            <ScrollArea className="flex-1">
              {searchResults.length > 0 ? (
                <>
                  <p className="px-4 py-2 text-sm" style={{ color: COLORS.accent }}>
                    {t('Search results', 'نتائج البحث')}
                  </p>
                  {searchResults.map(userResult => (
                    <button
                      key={userResult.id}
                      onClick={() => handleSelectUser(userResult)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:opacity-80"
                      style={{ borderBottomWidth: 1, borderColor: COLORS.divider }}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={userResult.profile_image || undefined} />
                        <AvatarFallback style={{ backgroundColor: COLORS.accent, color: 'white' }}>
                          {userResult.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium" style={{ color: COLORS.textPrimary }}>{userResult.full_name}</p>
                        <p className="text-sm" style={{ color: COLORS.textSecondary }}>{userResult.role}</p>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <p className="px-4 py-4 text-sm text-center" style={{ color: COLORS.textSecondary }}>
                  {dialogSearchQuery ? t('No contacts found', 'لا توجد جهات اتصال') : t('Search for contacts', 'ابحث عن جهات اتصال')}
                </p>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
