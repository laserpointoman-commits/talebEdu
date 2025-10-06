import { Outlet } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, MessageCircle, Bell } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

export default function SocialHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [unreadCount, setUnreadCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchCounts();
      subscribeToUpdates();
    }
  }, [user]);

  const fetchCounts = async () => {
    // Fetch unread messages count
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', user?.id)
      .single();

    if (student) {
      // Fetch friend requests count
      const { count: requests } = await supabase
        .from('friend_requests')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', student.id)
        .eq('status', 'pending');
      
      setRequestCount(requests || 0);

      // Fetch unread messages count
      const { data: conversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('student_id', student.id);

      if (conversations) {
        const conversationIds = conversations.map(c => c.conversation_id);
        const { count: unread } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .eq('is_read', false)
          .neq('sender_id', student.id);
        
        setUnreadCount(unread || 0);
      }
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('social-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests'
        },
        () => {
          fetchCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/social/feed')) return 'feed';
    if (path.includes('/social/friends')) return 'friends';
    if (path.includes('/social/messages')) return 'messages';
    return 'feed';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Facebook-style Navigation Bar */}
      <div className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="w-full px-0 md:max-w-7xl md:mx-auto md:px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {language === 'en' ? 'Social Book' : 'كتاب اجتماعي'}
            </h1>
            
            <Tabs value={getActiveTab()} className="h-full">
              <TabsList className="h-full bg-transparent border-none">
                <TabsTrigger 
                  value="feed" 
                  className="h-full px-8 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  onClick={() => navigate('/dashboard/social/feed')}
                >
                  <Home className="h-5 w-5 mr-2" />
                  {language === 'en' ? 'Feed' : 'الأخبار'}
                </TabsTrigger>
                
                <TabsTrigger 
                  value="friends" 
                  className="h-full px-8 rounded-none border-b-2 border-transparent data-[state=active]:border-primary relative"
                  onClick={() => navigate('/dashboard/social/friends')}
                >
                  <Users className="h-5 w-5 mr-2" />
                  {language === 'en' ? 'Friends' : 'الأصدقاء'}
                  {requestCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                      {requestCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full px-0 py-0 md:max-w-7xl md:mx-auto md:px-4 md:py-6">
        <Outlet />
      </div>
    </div>
  );
}