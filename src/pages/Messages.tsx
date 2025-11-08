import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Search, 
  User, 
  Users, 
  GraduationCap,
  DollarSign,
  Car,
  Shield,
  Loader2,
  Check,
  CheckCheck,
  Paperclip,
  Image,
  FileText,
  Download,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MessageAttachments from '@/components/messages/MessageAttachments';

interface Contact {
  id: string;
  full_name: string;
  full_name_ar?: string;
  email: string;
  role: string;
  phone?: string;
  student_class?: string;
  teacher_id?: string;
  lastMessage?: {
    content: string;
    created_at: string;
    is_read: boolean;
  };
  unreadCount?: number;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    role: string;
  };
  recipient?: {
    full_name: string;
    role: string;
  };
  attachments?: Array<{
    id: string;
    message_id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    created_at: string;
  }>;
}

export default function Messages() {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [newRecipient, setNewRecipient] = useState<Contact | null>(null);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [newMessageSubject, setNewMessageSubject] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available contacts based on user role
  useEffect(() => {
    if (!user) return;
    fetchContacts();
    setupRealtimeSubscription();
  }, [user]);

  // Fetch messages when a contact is selected
  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
      markMessagesAsRead(selectedContact.id);
    }
  }, [selectedContact]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      
      // Fetch available contacts from the view
      const { data: availableContacts, error } = await supabase
        .from('available_contacts')
        .select('*')
        .order('full_name');

      if (error) throw error;

      // Fetch recent conversations to get last messages
      const { data: recentMessages, error: msgError } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      // Process contacts with their last messages
      const contactsWithMessages = (availableContacts || []).map(contact => {
        const contactMessages = recentMessages?.filter(msg => 
          msg.sender_id === contact.id || msg.recipient_id === contact.id
        ) || [];
        
        const lastMessage = contactMessages[0];
        const unreadCount = contactMessages.filter(msg => 
          msg.sender_id === contact.id && !msg.is_read
        ).length;

        return {
          ...contact,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            created_at: lastMessage.created_at,
            is_read: lastMessage.is_read
          } : undefined,
          unreadCount
        };
      });

      // Sort by last message time
      contactsWithMessages.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
      });

      setContacts(contactsWithMessages);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast.error(language === 'en' ? 'Failed to load contacts' : 'فشل تحميل جهات الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (contactId: string) => {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user!.id},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${user!.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Fetch attachments for all messages
      const messageIds = (data || []).map(msg => msg.id);
      const { data: attachments } = await supabase
        .from('message_attachments')
        .select('*')
        .in('message_id', messageIds);
      
      // Map the messages with sender/recipient info from contacts and attachments
      const messagesWithProfiles = (data || []).map(msg => ({
        ...msg,
        sender: contacts.find(c => c.id === msg.sender_id) || { full_name: 'Unknown', role: 'unknown' },
        recipient: contacts.find(c => c.id === msg.recipient_id) || { full_name: 'Unknown', role: 'unknown' },
        attachments: attachments?.filter(att => att.message_id === msg.id) || []
      }));
      
      setMessages(messagesWithProfiles);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error(language === 'en' ? 'Failed to load messages' : 'فشل تحميل الرسائل');
    }
  };

  const markMessagesAsRead = async (contactId: string) => {
    try {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', contactId)
        .eq('recipient_id', user!.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(sender_id=eq.${user!.id},recipient_id=eq.${user!.id})`
        },
        () => {
          fetchContacts();
          if (selectedContact) {
            fetchMessages(selectedContact.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if ((!messageContent.trim() && selectedFiles.length === 0) || !selectedContact) return;
    
    setSending(true);
    setUploadingFiles(selectedFiles.length > 0);
    
    try {
      // Send the message first
      // Validate message content
      const validatedContent = (messageContent.trim() || (selectedFiles.length > 0 ? '📎 Files attached' : '')).slice(0, 5000);
      
      const { data: messageData, error: messageError } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user!.id,
          recipient_id: selectedContact.id,
          content: validatedContent
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Upload files if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          // Create unique file path
          const fileExt = file.name.split('.').pop();
          const fileName = `${user!.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('message-attachments')
            .upload(fileName, file);
          
          if (uploadError) throw uploadError;
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('message-attachments')
            .getPublicUrl(fileName);
          
          // Save attachment record
          const { error: dbError } = await supabase
            .from('message_attachments')
            .insert({
              message_id: messageData.id,
              file_name: file.name,
              file_url: publicUrl,
              file_type: file.type,
              file_size: file.size
            });
          
          if (dbError) throw dbError;
        }
      }

      setMessageContent('');
      setSelectedFiles([]);
      toast.success(language === 'en' ? 'Message sent' : 'تم إرسال الرسالة');
      
      // Refresh messages to show the new one with attachments
      fetchMessages(selectedContact.id);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(language === 'en' ? 'Failed to send message' : 'فشل إرسال الرسالة');
    } finally {
      setSending(false);
      setUploadingFiles(false);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(
          language === 'en' 
            ? `${file.name} is too large. Maximum size is 10MB.`
            : `${file.name} حجمه كبير جداً. الحد الأقصى 10 ميجابايت.`
        );
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const handleSendNewMessage = async () => {
    if (!newMessageContent.trim() || !newRecipient) return;
    
    setSending(true);
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user!.id,
          recipient_id: newRecipient.id,
          subject: newMessageSubject.trim() || null,
          content: newMessageContent.trim()
        });

      if (error) throw error;

      setNewMessageContent('');
      setNewMessageSubject('');
      setIsNewMessageOpen(false);
      setSelectedContact(newRecipient);
      toast.success(language === 'en' ? 'Message sent' : 'تم إرسال الرسالة');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(language === 'en' ? 'Failed to send message' : 'فشل إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'teacher': return <Users className="h-4 w-4" />;
      case 'student': return <GraduationCap className="h-4 w-4" />;
      case 'parent': return <User className="h-4 w-4" />;
      case 'driver': return <Car className="h-4 w-4" />;
      case 'finance': return <DollarSign className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-purple-100 text-purple-800';
      case 'parent': return 'bg-green-100 text-green-800';
      case 'driver': return 'bg-orange-100 text-orange-800';
      case 'finance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (days === 1) {
      return language === 'en' ? 'Yesterday' : 'أمس';
    } else if (days < 7) {
      return language === 'en' ? `${days} days ago` : `منذ ${days} أيام`;
    } else {
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'ar-SA');
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group contacts by role
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    if (!acc[contact.role]) {
      acc[contact.role] = [];
    }
    acc[contact.role].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-10rem)]">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div>
          <h2 className="text-xl md:text-3xl font-bold tracking-tight">{t('dashboard.messages')}</h2>
          <p className="text-xs md:text-base text-muted-foreground">
            {language === 'en' ? 'Communicate with school community' : 'التواصل مع مجتمع المدرسة'}
          </p>
        </div>
        <Button onClick={() => setIsNewMessageOpen(true)} className="gap-1 md:gap-2 text-xs md:text-sm">
          <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">{language === 'en' ? 'New Message' : 'رسالة جديدة'}</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 h-[calc(100%-5rem)]">
        {/* Contacts List */}
        <Card className="lg:col-span-4 h-full overflow-hidden">
          <CardHeader className="pb-3 p-3 md:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 md:h-4 md:w-4" />
              <Input
                placeholder={language === 'en' ? 'Search contacts...' : 'البحث عن جهات الاتصال...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 md:pl-10 h-8 md:h-10 text-xs md:text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-18rem)] lg:h-[calc(100vh-20rem)]">
              <div className="p-2">
                {Object.entries(groupedContacts).map(([role, roleContacts]) => (
                  <div key={role} className="mb-4">
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                      {getRoleIcon(role)}
                      <span>{role.charAt(0).toUpperCase() + role.slice(1)}s</span>
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {roleContacts.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {roleContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedContact?.id === contact.id ? 'bg-muted' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedContact(contact)}
                        >
                          <Avatar className="h-8 w-8 md:h-10 md:w-10">
                            <AvatarFallback className={getRoleColor(contact.role)}>
                              {contact.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-xs md:text-sm truncate">
                                {language === 'en' ? contact.full_name : contact.full_name_ar || contact.full_name}
                              </p>
                              {contact.lastMessage && (
                                <span className="text-[10px] md:text-xs text-muted-foreground">
                                  {formatTimestamp(contact.lastMessage.created_at)}
                                </span>
                              )}
                            </div>
                            {contact.student_class && (
                              <p className="text-[10px] md:text-xs text-muted-foreground">
                                Class: {contact.student_class}
                              </p>
                            )}
                            {contact.lastMessage && (
                              <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                                {contact.lastMessage.content}
                              </p>
                            )}
                          </div>
                          {contact.unreadCount! > 0 && (
                            <Badge className="bg-primary text-white rounded-full px-1.5 py-0 text-[10px] md:text-xs">
                              {contact.unreadCount}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-8 h-full flex flex-col overflow-hidden">
          {selectedContact ? (
            <>
              <CardHeader className="border-b p-3 md:p-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <Avatar className="h-8 w-8 md:h-10 md:w-10">
                    <AvatarFallback className={getRoleColor(selectedContact.role)}>
                      {selectedContact.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm md:text-lg">
                      {language === 'en' ? selectedContact.full_name : selectedContact.full_name_ar || selectedContact.full_name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] md:text-xs">
                        {selectedContact.role}
                      </Badge>
                      {selectedContact.student_class && (
                        <span className="text-[10px] md:text-xs text-muted-foreground">
                          Class {selectedContact.student_class}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[calc(100%-8rem)] p-3 md:p-4">
                  <div className="space-y-3 md:space-y-4">
                    {messages.map((message) => {
                      const isSent = message.sender_id === user!.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-2 md:gap-3 ${isSent ? 'flex-row-reverse' : ''}`}
                        >
                          {!isSent && (
                            <Avatar className="h-6 w-6 md:h-8 md:w-8">
                              <AvatarFallback className={getRoleColor(selectedContact.role)}>
                                {selectedContact.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[70%] ${isSent ? 'text-right' : ''}`}>
                            <div
                              className={`p-2 md:p-3 rounded-lg text-xs md:text-sm ${
                                isSent
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {message.subject && (
                                <p className="font-medium mb-1">{message.subject}</p>
                              )}
                              <p className="whitespace-pre-wrap">{message.content}</p>
                              
                              {/* Display attachments */}
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {message.attachments.map((attachment) => (
                                    <div
                                      key={attachment.id}
                                      className={`flex items-center gap-2 p-1.5 rounded ${
                                        isSent ? 'bg-primary-foreground/10' : 'bg-background/50'
                                      }`}
                                    >
                                      {getFileIcon(attachment.file_type)}
                                      <span className="text-xs truncate flex-1">
                                        {attachment.file_name}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => window.open(attachment.file_url, '_blank')}
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <p className="text-[10px] md:text-xs text-muted-foreground">
                                {formatTimestamp(message.created_at)}
                              </p>
                              {isSent && (
                                <span className="text-muted-foreground">
                                  {message.is_read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <div className="p-3 md:p-4 border-t space-y-2">
                  {/* File preview area */}
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-lg">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-1 bg-background p-1 rounded text-xs">
                          {getFileIcon(file.type)}
                          <span className="max-w-[100px] truncate">{file.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0"
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <div className="flex-1 flex gap-2">
                      <Textarea
                        placeholder={language === 'en' ? 'Type your message...' : 'اكتب رسالتك...'}
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        className="min-h-[50px] md:min-h-[60px] max-h-[100px] md:max-h-[120px] text-xs md:text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        disabled={sending || uploadingFiles}
                      />
                    </div>
                    
                    {/* File attachment button */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || uploadingFiles}
                      className="h-8 w-8 md:h-10 md:w-10"
                    >
                      <Paperclip className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={sending || uploadingFiles || (!messageContent.trim() && selectedFiles.length === 0)}
                      size="icon"
                      className="h-8 w-8 md:h-10 md:w-10"
                    >
                      {sending || uploadingFiles ? (
                        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3 md:h-4 md:w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
              <MessageSquare className="h-12 w-12 md:h-16 md:w-16 mb-4 opacity-50" />
              <p className="text-sm md:text-base text-center">
                {language === 'en' ? 'Select a contact to start messaging' : 'اختر جهة اتصال للبدء في المراسلة'}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* New Message Dialog */}
      <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'New Message' : 'رسالة جديدة'}</DialogTitle>
            <DialogDescription>
              {language === 'en' ? 'Send a message to an available contact' : 'إرسال رسالة إلى جهة اتصال متاحة'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {language === 'en' ? 'Recipient' : 'المستلم'}
              </label>
              <Tabs defaultValue={Object.keys(groupedContacts)[0]} className="mt-2">
                <TabsList className="grid grid-cols-3 lg:grid-cols-6">
                  {Object.keys(groupedContacts).map(role => (
                    <TabsTrigger key={role} value={role} className="text-xs">
                      {role}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(groupedContacts).map(([role, roleContacts]) => (
                  <TabsContent key={role} value={role}>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {roleContacts.map(contact => (
                          <div
                            key={contact.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              newRecipient?.id === contact.id ? 'bg-muted' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setNewRecipient(contact)}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={getRoleColor(contact.role)}>
                                {contact.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {language === 'en' ? contact.full_name : contact.full_name_ar || contact.full_name}
                              </p>
                              <p className="text-xs text-muted-foreground">{contact.email}</p>
                            </div>
                            {newRecipient?.id === contact.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
            <div>
              <label className="text-sm font-medium">
                {language === 'en' ? 'Subject (Optional)' : 'الموضوع (اختياري)'}
              </label>
              <Input
                placeholder={language === 'en' ? 'Enter subject...' : 'أدخل الموضوع...'}
                value={newMessageSubject}
                onChange={(e) => setNewMessageSubject(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {language === 'en' ? 'Message' : 'الرسالة'}
              </label>
              <Textarea
                placeholder={language === 'en' ? 'Type your message...' : 'اكتب رسالتك...'}
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                className="mt-2 min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewMessageOpen(false)}>
                {language === 'en' ? 'Cancel' : 'إلغاء'}
              </Button>
              <Button 
                onClick={handleSendNewMessage}
                disabled={sending || !newRecipient || !newMessageContent.trim()}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {language === 'en' ? 'Send' : 'إرسال'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}