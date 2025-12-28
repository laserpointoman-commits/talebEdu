import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  MoreVertical,
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
  Lock
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

  // Chat View - WhatsApp Style
  if (selectedConversation) {
    const messageGroups = groupMessagesByDate(messages);
    
    return (
      <div className="h-full w-full flex flex-col">
        {/* WhatsApp Teal Header */}
        <div className="bg-[#075E54] px-2 py-2 flex items-center gap-2 shadow-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white hover:bg-white/10"
            onClick={() => setSelectedConversation(null)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarImage src={selectedConversation.recipient_image || undefined} />
            <AvatarFallback className="bg-[#128C7E] text-white">
              {selectedConversation.recipient_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-medium text-base truncate">
              {selectedConversation.recipient_name}
            </h2>
            <p className="text-white/70 text-xs">
              {t('online', 'متصل')}
            </p>
          </div>
          
          <div className="flex items-center gap-0">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
              <Phone className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>{t('View contact', 'عرض جهة الاتصال')}</DropdownMenuItem>
                <DropdownMenuItem>{t('Media, links, docs', 'الوسائط والروابط')}</DropdownMenuItem>
                <DropdownMenuItem>{t('Search', 'بحث')}</DropdownMenuItem>
                <DropdownMenuItem>{t('Mute notifications', 'كتم الإشعارات')}</DropdownMenuItem>
                <DropdownMenuItem>{t('Wallpaper', 'خلفية')}</DropdownMenuItem>
                <DropdownMenuItem className="text-red-500">{t('Clear chat', 'مسح المحادثة')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages Area - WhatsApp tan/beige wallpaper */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{
            backgroundColor: '#ECE5DD',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4cdc4' fill-opacity='0.3'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z'/%3E%3C/g%3E%3C/svg%3E")`
          }}
        >
          <div className="p-3 space-y-1 min-h-full">
            {/* Encryption Notice */}
            <div className="flex justify-center mb-4">
              <div className="bg-[#FDF4C5] rounded-lg px-4 py-2 max-w-[85%] text-center shadow-sm">
                <div className="flex items-center justify-center gap-1 text-[#54656F] text-xs">
                  <Lock className="h-3 w-3" />
                  <span>{t('Messages and calls are end-to-end encrypted. No one outside of this chat can read them.', 'الرسائل والمكالمات مشفرة. لا أحد خارج هذه المحادثة يمكنه قراءتها.')}</span>
                </div>
              </div>
            </div>

            {messageGroups.map(group => (
              <div key={group.date}>
                {/* Date Separator */}
                <div className="flex justify-center my-3">
                  <span className="bg-[#E1F2FB] text-[#54656F] text-xs px-3 py-1.5 rounded-lg shadow-sm">
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
                        "max-w-[75%] rounded-lg px-3 py-1.5 shadow-sm relative",
                        isOwnMessage 
                          ? "bg-[#DCF8C6]" // Light green for own messages
                          : "bg-white" // White for received messages
                      )}>
                        {/* Message tail */}
                        <div 
                          className={cn(
                            "absolute top-0 w-0 h-0",
                            isOwnMessage 
                              ? "-right-2 border-l-8 border-l-[#DCF8C6] border-t-8 border-t-[#DCF8C6] border-r-8 border-r-transparent border-b-8 border-b-transparent" 
                              : "-left-2 border-r-8 border-r-white border-t-8 border-t-white border-l-8 border-l-transparent border-b-8 border-b-transparent"
                          )}
                          style={{
                            clipPath: isOwnMessage 
                              ? 'polygon(0 0, 100% 0, 0 100%)' 
                              : 'polygon(100% 0, 0 0, 100% 100%)',
                            width: '12px',
                            height: '12px',
                            background: isOwnMessage ? '#DCF8C6' : 'white'
                          }}
                        />
                        
                        {message.content && (
                          <p className="text-sm text-[#303030] leading-relaxed break-words">{message.content}</p>
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
                                    className="flex items-center gap-2 text-xs bg-black/5 rounded p-2"
                                  >
                                    <FileText className="h-4 w-4 text-[#54656F]" />
                                    <span className="truncate text-[#54656F]">{attachment.file_name}</span>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[10px] text-[#667781]">
                            {formatChatTime(message.created_at)}
                          </span>
                          {isOwnMessage && (
                            message.is_read 
                              ? <CheckCheck className="h-4 w-4 text-[#53BDEB]" />
                              : <Check className="h-4 w-4 text-[#667781]" />
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
          <div className="px-3 py-2 bg-[#F0F2F5] border-t">
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-1 bg-white rounded-full px-3 py-1 shadow-sm">
                  {file.type.startsWith('image/') ? <ImageIcon className="h-4 w-4 text-[#54656F]" /> : <FileText className="h-4 w-4 text-[#54656F]" />}
                  <span className="text-xs text-[#54656F] truncate max-w-[100px]">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 text-[#54656F] hover:text-red-500 p-0"
                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp Input Bar */}
        <div className="bg-[#F0F2F5] px-2 py-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-[#54656F] hover:bg-[#E9EDEF] rounded-full"
          >
            <Smile className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-[#54656F] hover:bg-[#E9EDEF] rounded-full"
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
              className="bg-white border-0 text-[#303030] placeholder:text-[#667781] h-10 rounded-full px-4 focus-visible:ring-0 shadow-sm"
            />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-[#54656F] hover:bg-[#E9EDEF] rounded-full"
          >
            <Camera className="h-6 w-6" />
          </Button>
          
          {newMessage.trim() || selectedFiles.length > 0 ? (
            <Button
              size="icon"
              className="h-12 w-12 bg-[#00A884] hover:bg-[#00A884]/90 rounded-full shadow-md"
              onClick={handleSendMessage}
              disabled={sending}
            >
              <Send className="h-5 w-5 text-white" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-12 w-12 bg-[#00A884] hover:bg-[#00A884]/90 rounded-full shadow-md"
            >
              <Mic className="h-5 w-5 text-white" />
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

  // Chat List View - WhatsApp Style
  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* WhatsApp Header */}
      <div className="bg-[#075E54] px-4 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-white text-xl font-bold">
          WhatsApp
        </h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
            <Camera className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
            <Search className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowNewChatDialog(true)}>{t('New chat', 'محادثة جديدة')}</DropdownMenuItem>
              <DropdownMenuItem>{t('New group', 'مجموعة جديدة')}</DropdownMenuItem>
              <DropdownMenuItem>{t('Linked devices', 'الأجهزة المرتبطة')}</DropdownMenuItem>
              <DropdownMenuItem>{t('Starred messages', 'الرسائل المميزة')}</DropdownMenuItem>
              <DropdownMenuItem>{t('Settings', 'الإعدادات')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#54656F]" />
          <Input
            placeholder={t('Search or start new chat', 'ابحث أو ابدأ محادثة جديدة')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#F0F2F5] border-0 text-[#303030] placeholder:text-[#667781] h-9 rounded-lg focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Chat Filters */}
      <div className="px-3 py-2 flex gap-2 border-b bg-white">
        <Button variant="secondary" size="sm" className="rounded-full bg-[#E7FCE3] text-[#008069] hover:bg-[#D9F8D3] h-8 px-4 text-xs font-medium">
          {t('All', 'الكل')}
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full text-[#54656F] hover:bg-[#F0F2F5] h-8 px-4 text-xs font-medium">
          {t('Unread', 'غير مقروءة')}
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full text-[#54656F] hover:bg-[#F0F2F5] h-8 px-4 text-xs font-medium">
          {t('Groups', 'المجموعات')}
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A884]"></div>
          </div>
        ) : searchQuery && searchResults.length > 0 ? (
          <div>
            {searchResults.map(userResult => (
              <button
                key={userResult.id}
                onClick={() => handleSelectUser(userResult)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#F5F6F6] transition-colors border-b border-[#E9EDEF]"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={userResult.profile_image || undefined} />
                  <AvatarFallback className="bg-[#DFE5E7] text-[#54656F]">
                    {userResult.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-medium text-[#111B21]">{userResult.full_name}</p>
                  <p className="text-sm text-[#667781]">{userResult.role}</p>
                </div>
              </button>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-32 h-32 rounded-full bg-[#00A884]/10 flex items-center justify-center mb-4">
              <svg viewBox="0 0 212 212" className="w-20 h-20 text-[#00A884]">
                <path fill="currentColor" d="M106.251.5C164.653.5 212 47.846 212 106.25S164.653 212 106.25 212C47.846 212 .5 164.654.5 106.25S47.846.5 106.251.5z"/>
                <path fill="#fff" d="M173.561 171.615a62.767 62.767 0 0 0-2.065-2.955 67.7 67.7 0 0 0-2.608-3.299 70.112 70.112 0 0 0-3.184-3.527 71.097 71.097 0 0 0-5.924-5.47 72.458 72.458 0 0 0-10.204-7.026 75.2 75.2 0 0 0-5.98-3.055c-.062-.028-.118-.059-.18-.087-9.792-4.44-22.106-7.529-37.416-7.529s-27.624 3.089-37.416 7.529c-.338.153-.653.318-.985.474a75.37 75.37 0 0 0-6.229 3.298 72.589 72.589 0 0 0-9.15 6.395 71.243 71.243 0 0 0-5.924 5.47 70.064 70.064 0 0 0-3.184 3.527 67.142 67.142 0 0 0-2.609 3.299 63.292 63.292 0 0 0-2.065 2.955 56.33 56.33 0 0 0-1.447 2.324c-.033.056-.073.119-.104.174a47.92 47.92 0 0 0-1.07 1.926c-.559 1.068-.818 1.678-.818 1.678v.398c18.285 17.927 43.322 28.985 70.945 28.985 27.678 0 52.761-11.103 71.055-29.095v-.289s-.619-1.45-1.992-3.778a58.346 58.346 0 0 0-1.446-2.322zM106.002 125.5c2.645 0 5.212-.253 7.68-.737a38.272 38.272 0 0 0 3.624-.896 37.124 37.124 0 0 0 5.12-1.958 36.307 36.307 0 0 0 6.15-3.67 35.923 35.923 0 0 0 9.489-10.48 36.558 36.558 0 0 0 2.422-4.84 37.051 37.051 0 0 0 1.716-5.25c.299-1.208.542-2.443.725-3.701.275-1.887.417-3.827.417-5.811s-.142-3.925-.417-5.811a38.734 38.734 0 0 0-1.215-5.494 36.68 36.68 0 0 0-3.648-8.298 35.923 35.923 0 0 0-9.489-10.48 36.347 36.347 0 0 0-6.15-3.67 37.124 37.124 0 0 0-5.12-1.958 37.67 37.67 0 0 0-3.624-.896 39.875 39.875 0 0 0-7.68-.737c-21.162 0-37.345 16.183-37.345 37.345 0 21.159 16.183 37.342 37.345 37.342z"/>
              </svg>
            </div>
            <p className="text-[#54656F] text-lg font-medium">
              {t('No conversations yet', 'لا توجد محادثات بعد')}
            </p>
            <p className="text-sm text-[#667781] mt-1">
              {t('Start chatting with your contacts', 'ابدأ الدردشة مع جهات اتصالك')}
            </p>
          </div>
        ) : (
          <div>
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#F5F6F6] transition-colors border-b border-[#E9EDEF]"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conv.recipient_image || undefined} />
                  <AvatarFallback className="bg-[#DFE5E7] text-[#54656F]">
                    {conv.recipient_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[#111B21] truncate">{conv.recipient_name}</p>
                    <span className={cn(
                      "text-xs flex-shrink-0",
                      conv.unread_count > 0 ? "text-[#00A884]" : "text-[#667781]"
                    )}>
                      {conv.last_message_time && formatMessageTime(conv.last_message_time)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-sm text-[#667781] truncate flex items-center gap-1">
                      {conv.last_message ? (
                        <>
                          <CheckCheck className="h-4 w-4 text-[#53BDEB] flex-shrink-0" />
                          <span className="truncate">{conv.last_message}</span>
                        </>
                      ) : (
                        t('No messages yet', 'لا توجد رسائل بعد')
                      )}
                    </p>
                    {conv.unread_count > 0 && (
                      <Badge className="h-5 min-w-[20px] px-1.5 bg-[#25D366] text-white rounded-full text-xs">
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

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowNewChatDialog(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-[#00A884] hover:bg-[#00A884]/90 shadow-lg z-10"
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('New chat', 'محادثة جديدة')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#54656F]" />
              <Input
                placeholder={t('Search contacts', 'ابحث في جهات الاتصال')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <ScrollArea className="h-64">
              {searchResults.map(userResult => (
                <button
                  key={userResult.id}
                  onClick={() => handleSelectUser(userResult)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <Avatar>
                    <AvatarImage src={userResult.profile_image || undefined} />
                    <AvatarFallback>
                      {userResult.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{userResult.full_name}</p>
                    <p className="text-sm text-muted-foreground">{userResult.role}</p>
                  </div>
                </button>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  {t('No contacts found', 'لم يتم العثور على جهات اتصال')}
                </p>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
