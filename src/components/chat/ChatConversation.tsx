import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, FileText, Download, X, Check, CheckCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
// Message attachments are handled inline in this component
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_image: string | null;
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

interface ChatConversationProps {
  conversation: Conversation;
  onBack: () => void;
}

export default function ChatConversation({ conversation, onBack }: ChatConversationProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const unsubscribe = subscribeToMessages();
    return () => {
      unsubscribe();
    };
  }, [conversation.recipient_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
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
      .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${conversation.recipient_id}),and(sender_id.eq.${conversation.recipient_id},recipient_id.eq.${user?.id})`)
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
      .channel(`chat-${conversation.recipient_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(and(sender_id.eq.${user?.id},recipient_id.eq.${conversation.recipient_id}),and(sender_id.eq.${conversation.recipient_id},recipient_id.eq.${user?.id}))`
        },
        (payload) => {
          // Add the new message to the state when received
          if (payload.new && payload.new.id) {
            const newMsg = payload.new as any;
            // Only add if message doesn't already exist
            setMessages(prev => {
              const exists = prev.some(m => m.id === newMsg.id);
              if (!exists) {
                return [...prev, {
                  ...newMsg,
                  attachments: []
                }];
              }
              return prev;
            });
            scrollToBottom();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(and(sender_id.eq.${user?.id},recipient_id.eq.${conversation.recipient_id}),and(sender_id.eq.${conversation.recipient_id},recipient_id.eq.${user?.id}))`
        },
        (payload) => {
          // Update message read status
          if (payload.new && payload.new.id) {
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

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || sending) return;

    setSending(true);
    setUploadingFiles(true);

    // Insert message
    const { data: messageData, error: messageError } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user?.id,
        recipient_id: conversation.recipient_id,
        content: newMessage.trim() || null
      })
      .select()
      .single();

    if (!messageError && messageData) {
      // Add the message to the local state immediately for instant feedback
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

            const attachment = {
              id: crypto.randomUUID(),
              file_name: file.name,
              file_url: publicUrl,
              file_type: file.type,
              file_size: file.size
            };

            await supabase
              .from('message_attachments')
              .insert({
                message_id: messageData.id,
                file_name: file.name,
                file_url: publicUrl,
                file_type: file.type,
                file_size: file.size
              });

            uploadedAttachments.push(attachment);
          }
        }
        
        newMsg.attachments = uploadedAttachments;
      }

      // Add message to local state immediately
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      setSelectedFiles([]);
      
      // Scroll to bottom after adding message
      setTimeout(scrollToBottom, 100);
    }

    setSending(false);
    setUploadingFiles(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
    setSelectedFiles(validFiles);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getMessageStatus = (message: Message) => {
    const isOwnMessage = message.sender_id === user?.id;
    if (!isOwnMessage) return null;
    
    if (message.is_read) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    } else {
      return <Check className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={conversation.recipient_image || undefined} />
          <AvatarFallback className="text-xs">
            {conversation.recipient_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold text-sm">{conversation.recipient_name}</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.map(message => {
            const isOwnMessage = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  isOwnMessage ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[70%] rounded-lg px-3 py-2",
                  isOwnMessage 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary"
                )}>
                  {message.content && (
                    <p className="text-sm">{message.content}</p>
                  )}
                  
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
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
                              className="flex items-center gap-2 text-xs hover:underline"
                            >
                              {getFileIcon(attachment.file_type)}
                              <span className="truncate">{attachment.file_name}</span>
                              <Download className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-xs opacity-70">
                      {format(new Date(message.created_at), 'h:mm a')}
                    </p>
                    {isOwnMessage && (
                      <span className="ml-1">
                        {getMessageStatus(message)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="px-3 py-2 border-t">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-1 bg-secondary rounded px-2 py-1">
                {getFileIcon(file.type)}
                <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  onClick={() => removeSelectedFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploadingFiles}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder={language === 'en' ? 'Type a message...' : 'اكتب رسالة...'}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            className="h-9"
            disabled={sending}
          />
          <Button
            size="icon"
            className="h-9 w-9"
            onClick={handleSendMessage}
            disabled={sending || uploadingFiles || (!newMessage.trim() && selectedFiles.length === 0)}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
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