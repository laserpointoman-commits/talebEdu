import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Search, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ChatConversation from './ChatConversation';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_image: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

interface UserSearchResult {
  id: string;
  full_name: string;
  profile_image: string | null;
  role: string;
}

interface FloatingChatProps {
  embedded?: boolean;
}

export default function FloatingChat({ embedded = false }: FloatingChatProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user && isOpen) {
      fetchConversations();
      subscribeToMessages();
    }
  }, [user, isOpen]);

  // Search for users when query changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    // Calculate total unread messages
    const total = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
    setTotalUnread(total);
  }, [conversations]);

  const fetchConversations = async () => {
    setLoading(true);
    
    // Get all messages to/from current user
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
      .order('created_at', { ascending: false });

    if (!error && messages) {
      // Get unique user IDs we need profiles for
      const userIds = new Set<string>();
      messages.forEach(msg => {
        if (msg.sender_id !== user?.id) userIds.add(msg.sender_id);
        if (msg.recipient_id !== user?.id) userIds.add(msg.recipient_id);
      });

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, profile_image')
        .in('id', Array.from(userIds));

      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Group messages by conversation
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
        
        // Count unread messages
        if (isRecipient && !msg.is_read && conversationMap.has(otherUserId)) {
          const conv = conversationMap.get(otherUserId)!;
          conv.unread_count++;
        }
      });
      
      setConversations(Array.from(conversationMap.values()));
    }
    setLoading(false);
  };

  const searchUsers = async () => {
    if (searchQuery.trim().length === 0) return;
    
    setIsSearching(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, profile_image, role')
      .ilike('full_name', `%${searchQuery}%`)
      .neq('id', user?.id)
      .limit(10);

    if (!error && data) {
      // Filter out users we already have conversations with
      const existingConvIds = new Set(conversations.map(c => c.recipient_id));
      const filteredUsers = data.filter(u => !existingConvIds.has(u.id));
      setSearchResults(filteredUsers as UserSearchResult[]);
    }
    setIsSearching(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('floating-chat-messages')
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSelectedConversation(null);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setSearchQuery(''); // Clear search when selecting conversation
    // Mark messages as read
    markMessagesAsRead(conv.recipient_id);
  };

  const handleSelectUser = async (userResult: UserSearchResult) => {
    // Create a new conversation with this user
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
    setSearchQuery(''); // Clear search
  };

  const markMessagesAsRead = async (senderId: string) => {
    await supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('recipient_id', user?.id);
    
    // Update local state
    setConversations(prev => 
      prev.map(conv => 
        conv.recipient_id === senderId 
          ? { ...conv, unread_count: 0 }
          : conv
      )
    );
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setSearchQuery(''); // Clear search when going back
    fetchConversations(); // Refresh conversations list
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv =>
    conv.recipient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  // For embedded mode, render without the floating wrapper
  if (embedded) {
    return (
      <div className="h-full w-full flex flex-col bg-background">
        {selectedConversation ? (
          <div className="h-full">
            <ChatConversation
              conversation={selectedConversation}
              onBack={handleBackToList}
            />
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            {/* Search Bar */}
            <div className="p-3 border-b bg-background">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'en' ? 'Search conversations or users...' : 'البحث في المحادثات أو المستخدمين...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            
            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : searchQuery && (searchResults.length > 0 || isSearching) ? (
                <div className="p-2">
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-accent rounded-lg transition-colors"
                    >
                      <Avatar>
                        <AvatarImage src={user.profile_image || undefined} />
                        <AvatarFallback>
                          {user.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-sm">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                      </div>
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {language === 'en' ? 'No conversations yet' : 'لا توجد محادثات بعد'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'en' ? 'Search for users to start chatting' : 'ابحث عن المستخدمين لبدء الدردشة'}
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredConversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-accent rounded-lg transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.recipient_image || undefined} />
                        <AvatarFallback>
                          {conv.recipient_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{conv.recipient_name}</p>
                          {conv.unread_count > 0 && (
                            <Badge variant="destructive" className="h-5 min-w-[20px] px-1">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.last_message}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <div className={cn(
        "fixed z-50",
        isMobile ? "bottom-4 right-4" : "bottom-6 right-6"
      )}>
        {!isOpen && (
          <Button
            onClick={handleToggleChat}
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg hover:scale-105 transition-transform relative"
          >
            <MessageCircle className="h-6 w-6" />
            {totalUnread > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-destructive text-destructive-foreground"
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "fixed z-50 shadow-2xl transition-all duration-300",
          isMobile ? "h-[calc(100vh-8rem)] w-[calc(100vw-2rem)] bottom-4 right-4 left-4" : "h-[500px] w-96 bottom-6 right-6"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">
                {language === 'en' ? 'Messages' : 'الرسائل'}
              </span>
              {totalUnread > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {totalUnread}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={handleToggleChat}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
              {selectedConversation ? (
                <ChatConversation
                  conversation={selectedConversation}
                  onBack={handleBackToList}
                />
              ) : (
                <div className="flex flex-col h-[440px]">
                  {/* Search Bar */}
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={language === 'en' ? 'Search conversations or users...' : 'البحث عن المحادثات أو المستخدمين...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>

                  {/* Conversations/Search Results List */}
                  <ScrollArea className="flex-1">
                    {loading || isSearching ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">
                          {language === 'en' ? 'Loading...' : 'جاري التحميل...'}
                        </p>
                      </div>
                    ) : searchQuery.trim() ? (
                      <div className="p-2">
                        {/* Show filtered conversations */}
                        {filteredConversations.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground px-3 py-2">
                              {language === 'en' ? 'Conversations' : 'المحادثات'}
                            </p>
                            {filteredConversations.map(conv => (
                              <button
                                key={conv.id}
                                onClick={() => handleSelectConversation(conv)}
                                className="w-full p-3 flex items-center gap-3 hover:bg-accent rounded-lg transition-colors"
                              >
                                <Avatar>
                                  <AvatarImage src={conv.recipient_image || undefined} />
                                  <AvatarFallback>
                                    {conv.recipient_name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-left">
                                  <div className="flex items-center justify-between">
                                    <p className="font-semibold text-sm">{conv.recipient_name}</p>
                                    {conv.unread_count > 0 && (
                                      <Badge variant="destructive" className="h-5 min-w-[20px] px-1">
                                        {conv.unread_count}
                                      </Badge>
                                    )}
                                  </div>
                                  {conv.last_message && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {conv.last_message}
                                    </p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Show search results for new users */}
                        {searchResults.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground px-3 py-2">
                              {language === 'en' ? 'Start new conversation' : 'بدء محادثة جديدة'}
                            </p>
                            {searchResults.map(userResult => (
                              <button
                                key={userResult.id}
                                onClick={() => handleSelectUser(userResult)}
                                className="w-full p-3 flex items-center gap-3 hover:bg-accent rounded-lg transition-colors"
                              >
                                <Avatar>
                                  <AvatarImage src={userResult.profile_image || undefined} />
                                  <AvatarFallback>
                                    {userResult.full_name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-left">
                                  <p className="font-semibold text-sm">{userResult.full_name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{userResult.role}</p>
                                </div>
                                <UserPlus className="h-4 w-4 text-muted-foreground" />
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* No results found */}
                        {filteredConversations.length === 0 && searchResults.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-32 text-center">
                            <p className="text-muted-foreground text-sm">
                              {language === 'en' ? 'No results found' : 'لم يتم العثور على نتائج'}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          {language === 'en' ? 'No conversations yet' : 'لا توجد محادثات بعد'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'en' ? 'Search for users to start chatting' : 'ابحث عن المستخدمين لبدء الدردشة'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2">
                        {conversations.map(conv => (
                          <button
                            key={conv.id}
                            onClick={() => handleSelectConversation(conv)}
                            className="w-full p-3 flex items-center gap-3 hover:bg-accent rounded-lg transition-colors"
                          >
                            <Avatar>
                              <AvatarImage src={conv.recipient_image || undefined} />
                              <AvatarFallback>
                                {conv.recipient_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-sm">{conv.recipient_name}</p>
                                {conv.unread_count > 0 && (
                                  <Badge variant="destructive" className="h-5 min-w-[20px] px-1">
                                    {conv.unread_count}
                                  </Badge>
                                )}
                              </div>
                              {conv.last_message && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {conv.last_message}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>
        </Card>
      )}
    </>
  );
}