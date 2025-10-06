import { useState, useEffect } from 'react';
import LogoLoader from '@/components/LogoLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  updated_at: string;
  participants: {
    student: {
      id: string;
      profile: {
        full_name: string;
        full_name_ar: string | null;
        profile_image: string | null;
      };
    };
  }[];
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unreadCount: number;
}

export default function MessagesOverview() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchCurrentStudent();
    }
  }, [user]);

  useEffect(() => {
    if (currentStudentId) {
      fetchConversations();
      fetchFriends();
      subscribeToMessages();
    }
  }, [currentStudentId]);

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

  const fetchFriends = async () => {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        student1:students!friendships_student1_id_fkey (
          id,
          profile:profiles!students_profile_id_fkey (
            full_name,
            full_name_ar,
            profile_image
          )
        ),
        student2:students!friendships_student2_id_fkey (
          id,
          profile:profiles!students_profile_id_fkey (
            full_name,
            full_name_ar,
            profile_image
          )
        )
      `)
      .or(`student1_id.eq.${currentStudentId},student2_id.eq.${currentStudentId}`);

    if (!error && data) {
      const friendsList = data.map((friendship: any) => {
        return friendship.student1.id === currentStudentId
          ? friendship.student2
          : friendship.student1;
      });
      setFriends(friendsList);
    }
  };

  const fetchConversations = async () => {
    setLoading(true);
    
    // Get conversations for current student
    const { data: participations, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversation:conversations (
          id,
          updated_at
        )
      `)
      .eq('student_id', currentStudentId);

    if (!error && participations) {
      const conversationIds = participations.map(p => p.conversation_id);
      
      // Get all participants and last messages for each conversation
      const conversationsWithDetails = await Promise.all(
        conversationIds.map(async (convId) => {
          // Get participants
          const { data: participants } = await supabase
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
            .eq('conversation_id', convId);

          // Get last message
          const { data: messages } = await supabase
            .from('chat_messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: false })
            .limit(1);

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convId)
            .eq('is_read', false)
            .neq('sender_id', currentStudentId);

          const conversation = participations.find(p => p.conversation_id === convId)?.conversation;

          return {
            id: convId,
            updated_at: conversation?.updated_at || '',
            participants: participants || [],
            lastMessage: messages?.[0],
            unreadCount: unreadCount || 0
          };
        })
      );

      // Sort by last message date
      conversationsWithDetails.sort((a, b) => {
        const dateA = a.lastMessage?.created_at || a.updated_at;
        const dateB = b.lastMessage?.created_at || b.updated_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      setConversations(conversationsWithDetails);
    }
    
    setLoading(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('conversations-overview')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const startNewChat = async (friendId: string) => {
    const { data, error } = await supabase
      .rpc('get_or_create_conversation', { other_student_id: friendId });

    if (!error && data) {
      navigate(`/dashboard/social/messages/${data}`);
    }
  };

  const openConversation = (conversationId: string) => {
    navigate(`/dashboard/social/messages/${conversationId}`);
  };

  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participants.find(p => p.student.id !== currentStudentId);
    if (!otherParticipant) return false;
    
    const name = language === 'en' 
      ? otherParticipant.student.profile.full_name 
      : (otherParticipant.student.profile.full_name_ar || otherParticipant.student.profile.full_name);
    
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get friends who don't have conversations yet
  const friendsWithoutConversations = friends.filter(friend => {
    return !conversations.some(conv => 
      conv.participants.some(p => p.student.id === friend.id)
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              {language === 'en' ? 'Messages' : 'الرسائل'}
            </CardTitle>
            {friendsWithoutConversations.length > 0 && (
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {language === 'en' ? 'New Chat' : 'محادثة جديدة'}
              </Button>
            )}
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'en' ? 'Search conversations...' : 'البحث في المحادثات...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <LogoLoader />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl font-semibold mb-2">
                {language === 'en' ? 'No Conversations' : 'لا توجد محادثات'}
              </p>
              <p className="text-muted-foreground mb-4">
                {language === 'en' 
                  ? 'Start a conversation with your friends!' 
                  : 'ابدأ محادثة مع أصدقائك!'}
              </p>
              {friendsWithoutConversations.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    {language === 'en' ? 'Start chatting with:' : 'ابدأ الدردشة مع:'}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {friendsWithoutConversations.slice(0, 5).map(friend => (
                      <Button
                        key={friend.id}
                        variant="outline"
                        size="sm"
                        onClick={() => startNewChat(friend.id)}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={friend.profile.profile_image || undefined} />
                          <AvatarFallback className="text-xs">
                            {friend.profile.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {language === 'en' 
                          ? friend.profile.full_name 
                          : (friend.profile.full_name_ar || friend.profile.full_name)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredConversations.map(conversation => {
                  const otherParticipant = conversation.participants.find(
                    p => p.student.id !== currentStudentId
                  );
                  
                  if (!otherParticipant) return null;

                  return (
                    <Card
                      key={conversation.id}
                      className="p-4 hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => openConversation(conversation.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={otherParticipant.student.profile.profile_image || undefined} />
                            <AvatarFallback>
                              {otherParticipant.student.profile.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.unreadCount > 0 && (
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">
                              {language === 'en' 
                                ? otherParticipant.student.profile.full_name 
                                : (otherParticipant.student.profile.full_name_ar || otherParticipant.student.profile.full_name)}
                            </p>
                            {conversation.lastMessage && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(conversation.lastMessage.created_at), 'h:mm a')}
                              </p>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-semibold' : 'text-muted-foreground'}`}>
                              {conversation.lastMessage.sender_id === currentStudentId && (
                                <span className="text-muted-foreground">
                                  {language === 'en' ? 'You: ' : 'أنت: '}
                                </span>
                              )}
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}