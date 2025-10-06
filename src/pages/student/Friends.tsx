import { useState, useEffect } from 'react';
import LogoLoader from '@/components/LogoLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Check, X, Search, MessageCircle, UserCheck, Users, UserX, Clock, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import Messenger from './Messenger';

interface Student {
  id: string;
  profile: {
    full_name: string;
    full_name_ar: string | null;
    profile_image: string | null;
    email: string;
  };
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender?: Student;
  receiver?: Student;
}

interface Friendship {
  id: string;
  student1: Student;
  student2: Student;
}

export default function Friends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [classmates, setClassmates] = useState<Student[]>([]);
  const [friends, setFriends] = useState<Student[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Skip fetching if on mobile
    if (!isMobile && user) {
      fetchCurrentStudent();
    }
  }, [user, isMobile]);

  useEffect(() => {
    // Skip fetching if on mobile
    if (!isMobile && currentStudentId) {
      fetchClassmates();
      fetchFriends();
      fetchFriendRequests();
    }
  }, [currentStudentId, isMobile]);
  
  // On mobile, show the Messenger interface
  if (isMobile) {
    return <Messenger />;
  }

  const fetchCurrentStudent = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, class')
      .eq('profile_id', user?.id)
      .single();
    
    if (!error && data) {
      setCurrentStudentId(data.id);
    }
  };

  const fetchClassmates = async () => {
    setLoading(true);
    const { data: currentStudent } = await supabase
      .from('students')
      .select('class')
      .eq('profile_id', user?.id)
      .single();

    if (currentStudent && currentStudent.class) {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          profile:profiles!students_profile_id_fkey (
            full_name,
            full_name_ar,
            profile_image,
            email
          )
        `)
        .eq('class', currentStudent.class)
        .neq('id', currentStudentId);

      if (!error && data) {
        setClassmates(data as unknown as Student[]);
      }
    }
    setLoading(false);
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
            profile_image,
            email
          )
        ),
        student2:students!friendships_student2_id_fkey (
          id,
          profile:profiles!students_profile_id_fkey (
            full_name,
            full_name_ar,
            profile_image,
            email
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

  const fetchFriendRequests = async () => {
    // Fetch sent requests
    const { data: sent } = await supabase
      .from('friend_requests')
      .select(`
        *,
        receiver:students!friend_requests_receiver_id_fkey (
          id,
          profile:profiles!students_profile_id_fkey (
            full_name,
            full_name_ar,
            profile_image,
            email
          )
        )
      `)
      .eq('sender_id', currentStudentId)
      .eq('status', 'pending');

    if (sent) {
      setSentRequests(sent as unknown as FriendRequest[]);
    }

    // Fetch received requests
    const { data: received } = await supabase
      .from('friend_requests')
      .select(`
        *,
        sender:students!friend_requests_sender_id_fkey (
          id,
          profile:profiles!students_profile_id_fkey (
            full_name,
            full_name_ar,
            profile_image,
            email
          )
        )
      `)
      .eq('receiver_id', currentStudentId)
      .eq('status', 'pending');

    if (received) {
      setReceivedRequests(received as unknown as FriendRequest[]);
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    const { error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: currentStudentId,
        receiver_id: receiverId
      });

    if (error) {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Failed to send friend request' : 'فشل في إرسال طلب الصداقة',
        variant: 'destructive'
      });
    } else {
      toast({
        title: language === 'en' ? 'Success' : 'نجاح',
        description: language === 'en' ? 'Friend request sent' : 'تم إرسال طلب الصداقة'
      });
      fetchFriendRequests();
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    const { data, error } = await supabase
      .rpc('accept_friend_request', { request_id: requestId });

    if (error) {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Failed to accept friend request' : 'فشل في قبول طلب الصداقة',
        variant: 'destructive'
      });
    } else {
      toast({
        title: language === 'en' ? 'Success' : 'نجاح',
        description: language === 'en' ? 'Friend request accepted' : 'تم قبول طلب الصداقة'
      });
      fetchFriends();
      fetchFriendRequests();
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (!error) {
      fetchFriendRequests();
      toast({
        title: language === 'en' ? 'Rejected' : 'مرفوض',
        description: language === 'en' ? 'Friend request rejected' : 'تم رفض طلب الصداقة'
      });
    }
  };

  const cancelFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);

    if (!error) {
      fetchFriendRequests();
      toast({
        title: language === 'en' ? 'Cancelled' : 'ملغى',
        description: language === 'en' ? 'Friend request cancelled' : 'تم إلغاء طلب الصداقة'
      });
    }
  };

  const startChat = async (friendId: string) => {
    const { data, error } = await supabase
      .rpc('get_or_create_conversation', { other_student_id: friendId });

    if (!error && data) {
      navigate(`/dashboard/social/messages/${data}`);
    }
  };

  const isFriend = (studentId: string) => {
    return friends.some(friend => friend.id === studentId);
  };

  const hasPendingRequest = (studentId: string) => {
    return sentRequests.some(req => req.receiver_id === studentId);
  };

  const filteredClassmates = classmates.filter(classmate => {
    const name = language === 'en' 
      ? classmate.profile.full_name 
      : (classmate.profile.full_name_ar || classmate.profile.full_name);
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredFriends = friends.filter(friend => {
    const name = language === 'en' 
      ? friend.profile.full_name 
      : (friend.profile.full_name_ar || friend.profile.full_name);
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const PersonCard = ({ person, type }: { person: Student; type: 'classmate' | 'friend' }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
      <CardContent className="p-0">
        <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/10" />
        <div className="px-4 pb-4 -mt-10">
          <Avatar className="h-20 w-20 border-4 border-card">
            <AvatarImage src={person.profile.profile_image || undefined} />
            <AvatarFallback className="text-xl bg-primary/10">
              {person.profile.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="mt-2">
            <p className="font-bold text-lg">
              {language === 'en' 
                ? person.profile.full_name 
                : (person.profile.full_name_ar || person.profile.full_name)}
            </p>
            <p className="text-sm text-muted-foreground">{person.profile.email}</p>
          </div>
          <div className="mt-4 flex gap-2">
            {type === 'friend' ? (
              <Button 
                className="w-full"
                onClick={() => startChat(person.id)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Message' : 'رسالة'}
              </Button>
            ) : (
              <>
                {isFriend(person.id) ? (
                  <Button variant="secondary" className="w-full" disabled>
                    <UserCheck className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Friends' : 'أصدقاء'}
                  </Button>
                ) : hasPendingRequest(person.id) ? (
                  <Button variant="outline" className="w-full" disabled>
                    <Clock className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Pending' : 'قيد الانتظار'}
                  </Button>
                ) : (
                  <Button 
                    className="w-full"
                    onClick={() => sendFriendRequest(person.id)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Add Friend' : 'إضافة صديق'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );


  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header Section */}
        <div className="bg-card rounded-xl shadow-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {language === 'en' ? 'Social Network' : 'الشبكة الاجتماعية'}
                </h1>
                <p className="text-muted-foreground">
                  {language === 'en' ? 'Connect with your classmates' : 'تواصل مع زملائك في الصف'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="relative">
                <Heart className="h-4 w-4" />
                {receivedRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
                    {receivedRequests.length}
                  </span>
                )}
              </Button>
              <Button onClick={() => navigate('/dashboard/social/feed')}>
                {language === 'en' ? 'News Feed' : 'آخر الأخبار'}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={language === 'en' ? 'Search for friends and classmates...' : 'البحث عن الأصدقاء والزملاء...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="classmates" className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <TabsList className={`grid w-full grid-cols-4 h-14 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <TabsTrigger value="classmates" className="text-sm md:text-base">
              <Users className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Classmates' : 'زملاء الصف'} 
              <Badge variant="secondary" className="ml-2">{classmates.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="friends" className="text-sm md:text-base">
              <UserCheck className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Friends' : 'الأصدقاء'} 
              <Badge variant="secondary" className="ml-2">{friends.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-sm md:text-base">
              <Clock className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Requests' : 'الطلبات'} 
              {receivedRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">{receivedRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="text-sm md:text-base">
              <UserPlus className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Sent' : 'المرسلة'} 
              <Badge variant="secondary" className="ml-2">{sentRequests.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Classmates Tab */}
          <TabsContent value="classmates">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  {language === 'en' ? 'My Classmates' : 'زملائي في الصف'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <LogoLoader />
                  </div>
                ) : classmates.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl font-semibold mb-2">
                      {language === 'en' ? 'No Classmates Found' : 'لم يتم العثور على زملاء'}
                    </p>
                    <p className="text-muted-foreground">
                      {language === 'en' 
                        ? 'You haven\'t been assigned to a class yet.' 
                        : 'لم يتم تعيينك في صف بعد.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredClassmates.map(classmate => (
                      <PersonCard key={classmate.id} person={classmate} type="classmate" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <UserCheck className="h-6 w-6" />
                  {language === 'en' ? 'My Friends' : 'أصدقائي'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friends.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl font-semibold mb-2">
                      {language === 'en' ? 'No Friends Yet' : 'لا يوجد أصدقاء بعد'}
                    </p>
                    <p className="text-muted-foreground mb-4">
                      {language === 'en' 
                        ? 'Start making friends by sending friend requests to your classmates!' 
                        : 'ابدأ بإضافة أصدقاء من خلال إرسال طلبات صداقة لزملائك!'}
                    </p>
                    <Button onClick={() => (document.querySelector('[data-value="classmates"]') as HTMLElement)?.click()}>
                      {language === 'en' ? 'Find Classmates' : 'البحث عن زملاء'}
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredFriends.map(friend => (
                      <PersonCard key={friend.id} person={friend} type="friend" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Friend Requests Tab */}
          <TabsContent value="requests">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Clock className="h-6 w-6" />
                  {language === 'en' ? 'Friend Requests' : 'طلبات الصداقة'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {receivedRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl font-semibold mb-2">
                      {language === 'en' ? 'No Pending Requests' : 'لا توجد طلبات معلقة'}
                    </p>
                    <p className="text-muted-foreground">
                      {language === 'en' 
                        ? 'You don\'t have any friend requests at the moment.' 
                        : 'ليس لديك أي طلبات صداقة في الوقت الحالي.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedRequests.map(request => (
                      <Card key={request.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={request.sender?.profile.profile_image || undefined} />
                              <AvatarFallback>
                                {request.sender?.profile.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">
                                {language === 'en' 
                                  ? request.sender?.profile.full_name 
                                  : (request.sender?.profile.full_name_ar || request.sender?.profile.full_name)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(request.created_at), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => acceptFriendRequest(request.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {language === 'en' ? 'Accept' : 'قبول'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => rejectFriendRequest(request.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              {language === 'en' ? 'Reject' : 'رفض'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sent Requests Tab */}
          <TabsContent value="sent">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <UserPlus className="h-6 w-6" />
                  {language === 'en' ? 'Sent Requests' : 'الطلبات المرسلة'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sentRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl font-semibold mb-2">
                      {language === 'en' ? 'No Sent Requests' : 'لا توجد طلبات مرسلة'}
                    </p>
                    <p className="text-muted-foreground">
                      {language === 'en' 
                        ? 'You haven\'t sent any friend requests yet.' 
                        : 'لم تقم بإرسال أي طلبات صداقة بعد.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentRequests.map(request => (
                      <Card key={request.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={request.receiver?.profile.profile_image || undefined} />
                              <AvatarFallback>
                                {request.receiver?.profile.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">
                                {language === 'en' 
                                  ? request.receiver?.profile.full_name 
                                  : (request.receiver?.profile.full_name_ar || request.receiver?.profile.full_name)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(request.created_at), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelFriendRequest(request.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            {language === 'en' ? 'Cancel' : 'إلغاء'}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}