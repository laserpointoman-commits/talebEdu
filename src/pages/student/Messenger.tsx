import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Users, 
  Phone, 
  Search, 
  MoreVertical,
  Camera,
  Edit,
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
  UserPlus,
  Settings,
  Bell,
  Lock,
  HelpCircle,
  Star,
  Archive,
  Trash2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Conversation {
  id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_image: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  is_online?: boolean;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  is_read: boolean;
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

export default function Messenger() {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('chats');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
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
    if (searchQuery.trim().length > 0) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

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
            unread_count: 0,
            is_online: Math.random() > 0.5 // Simulated online status
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

  const searchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, profile_image, role')
      .ilike('full_name', `%${searchQuery}%`)
      .neq('id', user?.id)
      .limit(10);

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

      // Upload files if any
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
    setSearchQuery('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files.filter(file => file.size <= 10 * 1024 * 1024));
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return t('Yesterday', 'أمس');
    return format(date, 'MM/dd/yy');
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

  if (!user) return null;

  // Chat View
  if (selectedConversation) {
    const messageGroups = groupMessagesByDate(messages);
    
    return (
      <div className="h-full w-full flex flex-col bg-[#0b141a]">
        {/* WhatsApp-style Header */}
        <div className="bg-[#1f2c34] px-2 py-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-[#aebac1] hover:bg-[#2a3942]"
            onClick={() => setSelectedConversation(null)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedConversation.recipient_image || undefined} />
            <AvatarFallback className="bg-[#2a3942] text-[#aebac1]">
              {selectedConversation.recipient_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-[#e9edef] font-medium text-base truncate">
              {selectedConversation.recipient_name}
            </h2>
            <p className="text-[#8696a0] text-xs">
              {selectedConversation.is_online ? t('online', 'متصل') : t('last seen today', 'آخر ظهور اليوم')}
            </p>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-[#aebac1] hover:bg-[#2a3942]">
              <Phone className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-[#aebac1] hover:bg-[#2a3942]">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#233138] border-[#2a3942] text-[#e9edef]">
                <DropdownMenuItem className="hover:bg-[#2a3942]">
                  <Users className="h-4 w-4 mr-2" />
                  {t('View contact', 'عرض جهة الاتصال')}
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-[#2a3942]">
                  <Search className="h-4 w-4 mr-2" />
                  {t('Search', 'بحث')}
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-[#2a3942]">
                  <Bell className="h-4 w-4 mr-2" />
                  {t('Mute notifications', 'كتم الإشعارات')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2a3942]" />
                <DropdownMenuItem className="hover:bg-[#2a3942]">
                  <Archive className="h-4 w-4 mr-2" />
                  {t('Archive chat', 'أرشفة المحادثة')}
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-[#2a3942] text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('Delete chat', 'حذف المحادثة')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages Area with WhatsApp wallpaper pattern */}
        <ScrollArea className="flex-1 bg-[#0b141a]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}>
          <div className="p-3 space-y-1">
            {messageGroups.map(group => (
              <div key={group.date}>
                {/* Date Separator */}
                <div className="flex justify-center my-3">
                  <span className="bg-[#182229] text-[#8696a0] text-xs px-3 py-1.5 rounded-lg shadow">
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
                      <div className={cn(
                        "max-w-[75%] rounded-lg px-3 py-1.5 shadow relative",
                        isOwnMessage 
                          ? "bg-[#005c4b] text-[#e9edef]" 
                          : "bg-[#1f2c34] text-[#e9edef]"
                      )}>
                        {/* Message tail */}
                        <div className={cn(
                          "absolute top-0 w-3 h-3",
                          isOwnMessage 
                            ? "right-0 -mr-1.5 border-t-8 border-l-8 border-transparent border-t-[#005c4b]" 
                            : "left-0 -ml-1.5 border-t-8 border-r-8 border-transparent border-t-[#1f2c34]"
                        )} style={{ display: 'none' }} />
                        
                        {message.content && (
                          <p className="text-sm leading-relaxed break-words">{message.content}</p>
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
                                    className="flex items-center gap-2 text-xs bg-[#0b141a]/30 rounded p-2"
                                  >
                                    <FileText className="h-4 w-4" />
                                    <span className="truncate">{attachment.file_name}</span>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[10px] text-[#8696a0]">
                            {formatChatTime(message.created_at)}
                          </span>
                          {isOwnMessage && (
                            message.is_read 
                              ? <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                              : <Check className="h-3.5 w-3.5 text-[#8696a0]" />
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
        </ScrollArea>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="px-3 py-2 bg-[#1f2c34] border-t border-[#2a3942]">
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-1 bg-[#2a3942] rounded px-2 py-1">
                  {file.type.startsWith('image/') ? <ImageIcon className="h-4 w-4 text-[#8696a0]" /> : <FileText className="h-4 w-4 text-[#8696a0]" />}
                  <span className="text-xs text-[#e9edef] truncate max-w-[100px]">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 text-[#8696a0] hover:text-[#e9edef]"
                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp-style Input */}
        <div className="bg-[#1f2c34] px-2 py-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-[#8696a0] hover:bg-[#2a3942]"
          >
            <Smile className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-[#8696a0] hover:bg-[#2a3942]"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-6 w-6" />
          </Button>
          
          <div className="flex-1">
            <Input
              placeholder={t('Type a message', 'اكتب رسالة')}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="bg-[#2a3942] border-0 text-[#e9edef] placeholder:text-[#8696a0] h-10 rounded-lg focus-visible:ring-0"
            />
          </div>
          
          {newMessage.trim() || selectedFiles.length > 0 ? (
            <Button
              size="icon"
              className="h-10 w-10 bg-[#00a884] hover:bg-[#00a884]/90 rounded-full"
              onClick={handleSendMessage}
              disabled={sending}
            >
              <Send className="h-5 w-5 text-[#111b21]" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-[#8696a0] hover:bg-[#2a3942]"
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
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </div>
      </div>
    );
  }

  // Main Chat List View
  return (
    <div className="h-full w-full flex flex-col bg-[#111b21]">
      {/* WhatsApp-style Header */}
      <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between">
        <h1 className="text-[#e9edef] text-xl font-bold">
          {t('Chats', 'الدردشات')}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 text-[#aebac1] hover:bg-[#2a3942]">
            <Camera className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-[#aebac1] hover:bg-[#2a3942]">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#233138] border-[#2a3942] text-[#e9edef] w-48">
              <DropdownMenuItem className="hover:bg-[#2a3942]" onClick={() => setShowNewChatDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                {t('New chat', 'محادثة جديدة')}
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#2a3942]">
                <Users className="h-4 w-4 mr-2" />
                {t('New group', 'مجموعة جديدة')}
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#2a3942]">
                <Star className="h-4 w-4 mr-2" />
                {t('Starred messages', 'الرسائل المميزة')}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2a3942]" />
              <DropdownMenuItem className="hover:bg-[#2a3942]">
                <Settings className="h-4 w-4 mr-2" />
                {t('Settings', 'الإعدادات')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2 bg-[#111b21]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8696a0]" />
          <Input
            placeholder={t('Search or start new chat', 'ابحث أو ابدأ محادثة جديدة')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#202c33] border-0 text-[#e9edef] placeholder:text-[#8696a0] h-9 rounded-lg focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-[#111b21] border-b border-[#222d34] rounded-none p-0">
          <TabsTrigger 
            value="chats" 
            className="data-[state=active]:bg-transparent data-[state=active]:text-[#00a884] data-[state=active]:border-b-2 data-[state=active]:border-[#00a884] text-[#8696a0] rounded-none h-full"
          >
            {t('Chats', 'الدردشات')}
            {totalUnread > 0 && (
              <Badge className="ml-1 h-5 min-w-[20px] px-1.5 bg-[#00a884] text-[#111b21]">
                {totalUnread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="status" 
            className="data-[state=active]:bg-transparent data-[state=active]:text-[#00a884] data-[state=active]:border-b-2 data-[state=active]:border-[#00a884] text-[#8696a0] rounded-none h-full"
          >
            {t('Status', 'الحالة')}
          </TabsTrigger>
          <TabsTrigger 
            value="calls" 
            className="data-[state=active]:bg-transparent data-[state=active]:text-[#00a884] data-[state=active]:border-b-2 data-[state=active]:border-[#00a884] text-[#8696a0] rounded-none h-full"
          >
            {t('Calls', 'المكالمات')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]"></div>
              </div>
            ) : searchQuery && searchResults.length > 0 ? (
              <div>
                {searchResults.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#202c33] transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.profile_image || undefined} />
                      <AvatarFallback className="bg-[#2a3942] text-[#aebac1]">
                        {user.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-[#e9edef]">{user.full_name}</p>
                      <p className="text-sm text-[#8696a0]">{user.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <MessageCircle className="h-16 w-16 text-[#2a3942] mb-4" />
                <p className="text-[#8696a0]">
                  {t('No conversations yet', 'لا توجد محادثات بعد')}
                </p>
                <p className="text-sm text-[#667781] mt-1">
                  {t('Tap the menu to start a new chat', 'اضغط على القائمة لبدء محادثة جديدة')}
                </p>
              </div>
            ) : (
              <div>
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#202c33] transition-colors border-b border-[#222d34]"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conv.recipient_image || undefined} />
                        <AvatarFallback className="bg-[#2a3942] text-[#aebac1]">
                          {conv.recipient_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conv.is_online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21]" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-[#e9edef] truncate">{conv.recipient_name}</p>
                        <span className={cn(
                          "text-xs",
                          conv.unread_count > 0 ? "text-[#00a884]" : "text-[#8696a0]"
                        )}>
                          {conv.last_message_time && formatMessageTime(conv.last_message_time)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-sm text-[#8696a0] truncate">
                          {conv.last_message || t('No messages yet', 'لا توجد رسائل بعد')}
                        </p>
                        {conv.unread_count > 0 && (
                          <Badge className="h-5 min-w-[20px] px-1.5 bg-[#00a884] text-[#111b21] rounded-full">
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
        </TabsContent>

        <TabsContent value="status" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              {/* My Status */}
              <button className="w-full flex items-center gap-3 mb-6">
                <div className="relative">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={(profile as any)?.profile_image || undefined} />
                    <AvatarFallback className="bg-[#2a3942] text-[#aebac1]">
                      {profile?.full_name?.charAt(0).toUpperCase() || 'M'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#00a884] rounded-full border-2 border-[#111b21] flex items-center justify-center">
                    <Plus className="h-3 w-3 text-[#111b21]" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-[#e9edef]">{t('My status', 'حالتي')}</p>
                  <p className="text-sm text-[#8696a0]">{t('Tap to add status update', 'اضغط لإضافة تحديث الحالة')}</p>
                </div>
              </button>
              
              <p className="text-[#8696a0] text-xs px-4 mb-3">{t('Recent updates', 'التحديثات الأخيرة')}</p>
              
              <div className="text-center py-8 text-[#8696a0]">
                <p className="text-sm">{t('No status updates', 'لا توجد تحديثات للحالة')}</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="calls" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              {/* Create call link */}
              <button className="w-full flex items-center gap-3 mb-4 hover:bg-[#202c33] -mx-4 px-4 py-2 transition-colors">
                <div className="h-12 w-12 bg-[#00a884] rounded-full flex items-center justify-center">
                  <Phone className="h-5 w-5 text-[#111b21]" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-[#e9edef]">{t('Create call link', 'إنشاء رابط مكالمة')}</p>
                  <p className="text-sm text-[#8696a0]">{t('Share a link for your call', 'شارك رابط مكالمتك')}</p>
                </div>
              </button>
              
              <p className="text-[#8696a0] text-xs px-4 mb-3">{t('Recent', 'الأخيرة')}</p>
              
              <div className="text-center py-8 text-[#8696a0]">
                <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('No recent calls', 'لا توجد مكالمات أخيرة')}</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowNewChatDialog(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-[#00a884] hover:bg-[#00a884]/90 shadow-lg"
      >
        <Edit className="h-6 w-6 text-[#111b21]" />
      </Button>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="bg-[#111b21] border-[#2a3942] text-[#e9edef] max-w-md">
          <DialogHeader>
            <DialogTitle>{t('New chat', 'محادثة جديدة')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8696a0]" />
              <Input
                placeholder={t('Search name or email', 'ابحث بالاسم أو البريد')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#202c33] border-0 text-[#e9edef] placeholder:text-[#8696a0]"
              />
            </div>
            
            <ScrollArea className="h-64">
              {searchResults.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-[#202c33] rounded-lg transition-colors"
                >
                  <Avatar>
                    <AvatarImage src={user.profile_image || undefined} />
                    <AvatarFallback className="bg-[#2a3942] text-[#aebac1]">
                      {user.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-[#8696a0]">{user.role}</p>
                  </div>
                </button>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <p className="text-center text-[#8696a0] py-4">
                  {t('No users found', 'لم يتم العثور على مستخدمين')}
                </p>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
