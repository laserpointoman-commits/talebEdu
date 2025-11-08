import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Image as ImageIcon, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  visibility: string;
  created_at: string;
  student: {
    id: string;
    profile: {
      full_name: string;
      profile_image: string | null;
    };
  };
  post_likes: { id: string; student_id: string }[];
  post_comments: {
    id: string;
    content: string;
    created_at: string;
    student: {
      profile: {
        full_name: string;
      };
    };
  }[];
}

export default function SocialFeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostVisibility, setNewPostVisibility] = useState<'friends' | 'class'>('friends');
  const [loading, setLoading] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchCurrentStudent();
    fetchPosts();
  }, [user]);

  const fetchCurrentStudent = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', user.id)
      .single();
    
    if (!error && data) {
      setCurrentStudentId(data.id);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        student:students!posts_student_id_fkey (
          id,
          profile:profiles!students_profile_id_fkey (
            full_name,
            profile_image
          )
        ),
        post_likes (id, student_id),
        post_comments (
          id,
          content,
          created_at,
          student:students!post_comments_student_id_fkey (
            profile:profiles!students_profile_id_fkey (
              full_name
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPosts(data as unknown as Post[]);
    }
    setLoading(false);
  };

  const createPost = async () => {
    if (!newPostContent.trim() || !currentStudentId) return;

    // Validate post content
    const validatedContent = newPostContent.trim().slice(0, 2000);

    const { error } = await supabase
      .from('posts')
      .insert({
        student_id: currentStudentId,
        content: validatedContent,
        visibility: newPostVisibility
      });

    if (error) {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Failed to create post' : 'فشل في إنشاء المنشور',
        variant: 'destructive'
      });
    } else {
      setNewPostContent('');
      fetchPosts();
      toast({
        title: language === 'en' ? 'Success' : 'نجاح',
        description: language === 'en' ? 'Post created successfully' : 'تم إنشاء المنشور بنجاح'
      });
    }
  };

  const toggleLike = async (postId: string) => {
    if (!currentStudentId) return;

    const existingLike = posts.find(p => p.id === postId)?.post_likes
      .find(l => l.student_id === currentStudentId);

    if (existingLike) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('id', existingLike.id);
    } else {
      await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          student_id: currentStudentId
        });
    }
    
    fetchPosts();
  };

  const addComment = async (postId: string) => {
    const comment = commentInputs[postId];
    if (!comment?.trim() || !currentStudentId) return;

    // Validate comment content
    const validatedComment = comment.trim().slice(0, 1000);

    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        student_id: currentStudentId,
        content: validatedComment
      });

    if (!error) {
      setCommentInputs({ ...commentInputs, [postId]: '' });
      fetchPosts();
    }
  };

  const isLikedByCurrentUser = (post: Post) => {
    return post.post_likes.some(like => like.student_id === currentStudentId);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Create Post */}
      <Card>
        <CardContent className="p-4">
          <Textarea
            placeholder={language === 'en' ? "What's on your mind?" : 'ما الذي يدور في ذهنك؟'}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="mb-3"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <ImageIcon className="h-4 w-4" />
              </Button>
              <select
                value={newPostVisibility}
                onChange={(e) => setNewPostVisibility(e.target.value as 'friends' | 'class')}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="friends">{language === 'en' ? 'Friends' : 'الأصدقاء'}</option>
                <option value="class">{language === 'en' ? 'Class' : 'الصف'}</option>
              </select>
            </div>
            <Button onClick={createPost} disabled={!newPostContent.trim()}>
              {language === 'en' ? 'Post' : 'نشر'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      {loading ? (
        <div className="text-center py-8">
          {language === 'en' ? 'Loading...' : 'جاري التحميل...'}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {language === 'en' ? 'No posts yet. Be the first to share!' : 'لا توجد منشورات بعد. كن أول من يشارك!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        posts.map(post => (
          <Card key={post.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={post.student.profile.profile_image || undefined} />
                  <AvatarFallback>
                    {post.student.profile.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{post.student.profile.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(post.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-secondary rounded">
                  {post.visibility === 'friends' ? '👥' : '🏫'} {post.visibility}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3">{post.content}</p>
              {post.image_url && (
                <img 
                  src={post.image_url} 
                  alt="Post" 
                  className="w-full rounded-lg mb-3"
                />
              )}
              
              {/* Like and Comment Actions */}
              <div className="flex items-center gap-4 mb-3 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleLike(post.id)}
                  className={isLikedByCurrentUser(post) ? 'text-red-500' : ''}
                >
                  <Heart className={`h-4 w-4 mr-1 ${isLikedByCurrentUser(post) ? 'fill-current' : ''}`} />
                  {post.post_likes.length}
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {post.post_comments.length}
                </Button>
              </div>

              {/* Comments Section */}
              {post.post_comments.length > 0 && (
                <div className="space-y-2 mb-3">
                  {post.post_comments.map(comment => (
                    <div key={comment.id} className="bg-secondary/50 rounded p-2">
                      <p className="text-sm font-semibold">
                        {comment.student.profile.full_name}
                      </p>
                      <p className="text-sm">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment */}
              <div className="flex gap-2">
                <Input
                  placeholder={language === 'en' ? 'Write a comment...' : 'اكتب تعليقاً...'}
                  value={commentInputs[post.id] || ''}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                />
                <Button 
                  size="icon"
                  onClick={() => addComment(post.id)}
                  disabled={!commentInputs[post.id]?.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}