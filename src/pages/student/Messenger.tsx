import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import FloatingChat from '@/components/chat/FloatingChat';

export default function Messenger() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('chats');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    const { count } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user?.id)
      .eq('is_read', false);
    
    setUnreadCount(count || 0);
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-3">
        <h1 className="text-lg font-semibold">
          {language === 'en' ? 'Messenger' : 'المراسل'}
        </h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 h-10 rounded-none">
          <TabsTrigger value="chats" className="text-xs">
            <MessageCircle className="h-4 w-4 mr-1" />
            {language === 'en' ? 'Chats' : 'الدردشات'}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 px-1 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contacts" className="text-xs">
            <Users className="h-4 w-4 mr-1" />
            {language === 'en' ? 'Contacts' : 'جهات الاتصال'}
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">
            <Settings className="h-4 w-4 mr-1" />
            {language === 'en' ? 'Settings' : 'الإعدادات'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="flex-1 p-0 mt-0 overflow-hidden">
          <div className="h-full w-full">
            <FloatingChat embedded={true} />
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="flex-1 p-4">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {language === 'en' ? 'Your contacts will appear here' : 'جهات الاتصال الخاصة بك ستظهر هنا'}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-4">
          <div className="space-y-4">
            <div className="text-sm font-medium">
              {language === 'en' ? 'Notification Settings' : 'إعدادات الإشعارات'}
            </div>
            <div className="text-sm text-muted-foreground">
              {language === 'en' ? 'Configure your messaging preferences' : 'قم بتكوين تفضيلات المراسلة الخاصة بك'}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}