import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  image_url: string | null;
  sender_id: string;
  created_at: string;
  sender: {
    profile: {
      full_name: string;
      profile_image: string | null;
    };
  };
}

interface Participant {
  student: {
    id: string;
    profile: {
      full_name: string;
      full_name_ar: string | null;
      profile_image: string | null;
    };
  };
}

export default function SocialMessages() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchCurrentStudent();
    }
  }, [user]);

  useEffect(() => {
    if (conversationId && currentStudentId) {
      fetchMessages();
      fetchParticipants();
      subscribeToMessages();
    }
  }, [conversationId, currentStudentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchCurrentStudent = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', user?.id)
      .single();
    
    if (!error && data) {
      setCurrentStudentId(data.id);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:students!chat_messages_sender_id_fkey (
          profile:profiles!students_profile_id_fkey (
            full_name,
            profile_image
          )
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as unknown as Message[]);
    }
    setLoading(false);
  };

  const fetchParticipants = async () => {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        student:students!conversation_participants_student_id_fkey (
          id,
          profile:profiles!students_profile_id_fkey (
            full_name,
            full_name_ar,
            profile_image
          )
        )
      `)
      .eq('conversation_id', conversationId);

    if (!error && data) {
      setParticipants(data as unknown as Participant[]);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentStudentId) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentStudentId,
        content: newMessage
      });

    if (!error) {
      setNewMessage('');
      // Update last read
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('student_id', currentStudentId);
    }
  };

  const otherParticipant = participants.find(p => p.student.id !== currentStudentId);

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard/social/friends')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {otherParticipant && (
              <>
                <Avatar>
                  <AvatarImage src={otherParticipant.student.profile.profile_image || undefined} />
                  <AvatarFallback>
                    {otherParticipant.student.profile.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {language === 'en' 
                      ? otherParticipant.student.profile.full_name 
                      : (otherParticipant.student.profile.full_name_ar || otherParticipant.student.profile.full_name)}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-4">
            {loading ? (
              <div className="text-center py-8">
                {language === 'en' ? 'Loading messages...' : 'جاري تحميل الرسائل...'}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'en' ? 'No messages yet. Start the conversation!' : 'لا توجد رسائل بعد. ابدأ المحادثة!'}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(message => {
                  const isOwnMessage = message.sender_id === currentStudentId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        {!isOwnMessage && (
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={message.sender.profile.profile_image || undefined} />
                              <AvatarFallback className="text-xs">
                                {message.sender.profile.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {message.sender.profile.full_name}
                            </span>
                          </div>
                        )}
                        <div
                          className={`rounded-lg px-3 py-2 ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          {message.image_url && (
                            <img
                              src={message.image_url}
                              alt="Message attachment"
                              className="mt-2 rounded max-w-full"
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(message.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder={language === 'en' ? 'Type a message...' : 'اكتب رسالة...'}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button 
              size="icon"
              onClick={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}