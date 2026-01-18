import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Conversation {
  id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_image: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  is_group: boolean;
  is_online?: boolean;
  last_seen?: string;
  is_typing?: boolean;
}

export interface Message {
  id: string;
  content: string | null;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  is_read: boolean;
  is_delivered: boolean;
  delivered_at: string | null;
  read_at: string | null;
  reply_to_id: string | null;
  forwarded_from_id: string | null;
  is_deleted_for_sender: boolean;
  is_deleted_for_recipient: boolean;
  deleted_for_everyone: boolean;
  message_type: string;
  voice_duration: number | null;
  reply_to?: Message | null;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
}

export interface MessageAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

export interface MessageReaction {
  id: string;
  user_id: string;
  emoji: string;
  user_name?: string;
}

export interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_by: string;
  members: GroupMember[];
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

export interface GroupMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  full_name: string;
  profile_image: string | null;
}

export interface UserSearchResult {
  id: string;
  full_name: string;
  profile_image: string | null;
  role: string;
}

export interface CallLog {
  id: string;
  caller_id: string;
  recipient_id: string | null;
  group_id: string | null;
  call_type: 'voice' | 'video';
  status: 'missed' | 'answered' | 'declined' | 'busy' | 'no_answer';
  started_at: string;
  ended_at: string | null;
  duration: number | null;
  caller_name?: string;
  caller_image?: string;
  recipient_name?: string;
  recipient_image?: string;
}

export function useMessenger() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { data: messagesData, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('is_deleted_for_sender', false)
        .eq('is_deleted_for_recipient', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = new Set<string>();
      messagesData?.forEach(msg => {
        if (msg.sender_id !== user.id) userIds.add(msg.sender_id);
        if (msg.recipient_id !== user.id) userIds.add(msg.recipient_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, profile_image')
        .in('id', Array.from(userIds));

      const { data: presenceData } = await supabase
        .from('user_presence')
        .select('*')
        .in('user_id', Array.from(userIds));

      const profileMap = new Map();
      profiles?.forEach(profile => profileMap.set(profile.id, profile));
      
      const presenceMap = new Map();
      presenceData?.forEach(p => presenceMap.set(p.user_id, p));

      const conversationMap = new Map<string, Conversation>();
      messagesData?.forEach(msg => {
        const isRecipient = msg.recipient_id === user.id;
        const otherUserId = isRecipient ? msg.sender_id : msg.recipient_id;
        const otherUser = profileMap.get(otherUserId);
        const presence = presenceMap.get(otherUserId);
        
        if (otherUser && !conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            recipient_id: otherUserId,
            recipient_name: otherUser.full_name || 'Unknown User',
            recipient_image: otherUser.profile_image,
            last_message: msg.deleted_for_everyone ? 'This message was deleted' : msg.content,
            last_message_time: msg.created_at,
            unread_count: 0,
            is_group: false,
            is_online: presence?.is_online || false,
            last_seen: presence?.last_seen,
            is_typing: presence?.typing_to === user.id
          });
        }
        
        if (isRecipient && !msg.is_read && conversationMap.has(otherUserId)) {
          const conv = conversationMap.get(otherUserId)!;
          conv.unread_count++;
        }
      });
      
      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (recipientId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          message_attachments (id, file_name, file_url, file_type, file_size),
          message_reactions (id, user_id, emoji)
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filter out deleted messages on client side
      const filteredData = data?.filter(msg => {
        // Skip messages deleted for everyone
        if (msg.deleted_for_everyone) return false;
        // Skip messages deleted for current user
        if (msg.sender_id === user.id && msg.is_deleted_for_sender) return false;
        if (msg.recipient_id === user.id && msg.is_deleted_for_recipient) return false;
        return true;
      }) || [];

      // Fetch reply messages
      const replyIds = filteredData.filter(m => m.reply_to_id).map(m => m.reply_to_id) || [];
      let replyMap = new Map<string, Message>();
      
      if (replyIds.length > 0) {
        const { data: replies } = await supabase
          .from('direct_messages')
          .select('*')
          .in('id', replyIds);
        
        replies?.forEach(r => replyMap.set(r.id, r as any));
      }

      const formattedMessages = filteredData.map(msg => ({
        ...msg,
        attachments: msg.message_attachments || [],
        reactions: msg.message_reactions || [],
        reply_to: msg.reply_to_id ? replyMap.get(msg.reply_to_id) : null
      })) as Message[];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user]);

  // Send message
  const sendMessage = useCallback(async (
    recipientId: string,
    content: string,
    files: File[] = [],
    replyToId?: string,
    forwardedFromId?: string,
    messageType: string = 'text',
    voiceDuration?: number
  ): Promise<Message | null> => {
    if (!user) return null;
    
    try {
      // For voice messages, set a placeholder content since the actual audio is in attachments
      const messageContent = messageType === 'voice' 
        ? `🎤 Voice message (${voiceDuration || 0}s)` 
        : (content || '');
      
      const { data: messageData, error: messageError } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: messageContent,
          reply_to_id: replyToId || null,
          forwarded_from_id: forwardedFromId || null,
          message_type: messageType,
          voice_duration: voiceDuration || null
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Optimistically append the message so it appears instantly (WhatsApp-like)
      const localObjectUrls: string[] = [];
      const optimisticAttachments: MessageAttachment[] = files.map((file, index) => {
        const url = URL.createObjectURL(file);
        localObjectUrls.push(url);
        return {
          id: `local-${messageData.id}-${index}`,
          file_name: file.name,
          file_url: url,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
        };
      });

      const optimisticMessage = {
        ...messageData,
        attachments: optimisticAttachments,
        reactions: [],
        reply_to: null,
      } as Message;

      setMessages((prev) => (prev.some((m) => m.id === messageData.id) ? prev : [...prev, optimisticMessage]));

      const uploadedAttachments: MessageAttachment[] = [];
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('message-attachments')
          .upload(fileName, file);

        if (!uploadError) {
          // Use signed URL for private bucket (valid for 1 hour, will be refreshed on playback)
          const { data: signedData } = await supabase.storage
            .from('message-attachments')
            .createSignedUrl(fileName, 3600);
          
          const fileUrl = signedData?.signedUrl || '';

          const { data: attachmentData } = await supabase
            .from('message_attachments')
            .insert({
              message_id: messageData.id,
              file_name: fileName, // Store the path, not the signed URL
              file_url: fileUrl, // This is now a signed URL
              file_type: file.type,
              file_size: file.size
            })
            .select()
            .single();

          if (attachmentData) {
            uploadedAttachments.push(attachmentData);
          }
        }
      }

      if (uploadedAttachments.length > 0) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageData.id ? { ...m, attachments: uploadedAttachments } : m))
        );
        // Replace local object URLs with remote URLs (avoid leaks)
        localObjectUrls.forEach((u) => URL.revokeObjectURL(u));
      }

      return {
        ...messageData,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : optimisticAttachments,
        reactions: [],
        reply_to: null
      } as Message;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }, [user]);

  // Mark messages as read
  const markAsRead = useCallback(async (senderId: string) => {
    if (!user) return;
    
    await supabase
      .from('direct_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('sender_id', senderId)
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    setConversations(prev => 
      prev.map(conv => 
        conv.recipient_id === senderId 
          ? { ...conv, unread_count: 0 }
          : conv
      )
    );
  }, [user]);

  // Mark messages as delivered
  const markAsDelivered = useCallback(async (senderId: string) => {
    if (!user) return;
    
    await supabase
      .from('direct_messages')
      .update({ is_delivered: true, delivered_at: new Date().toISOString() })
      .eq('sender_id', senderId)
      .eq('recipient_id', user.id)
      .eq('is_delivered', false);
  }, [user]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string, forEveryone: boolean = false) => {
    if (!user) return;
    
    if (forEveryone) {
      await supabase
        .from('direct_messages')
        .update({ 
          deleted_for_everyone: true, 
          deleted_at: new Date().toISOString(),
          content: null
        })
        .eq('id', messageId)
        .eq('sender_id', user.id);
    } else {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        const field = message.sender_id === user.id ? 'is_deleted_for_sender' : 'is_deleted_for_recipient';
        await supabase
          .from('direct_messages')
          .update({ [field]: true })
          .eq('id', messageId);
      }
    }

    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, [user, messages]);

  // Add reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('message_reactions')
      .upsert({
        message_id: messageId,
        user_id: user.id,
        emoji
      }, { onConflict: 'message_id,user_id' })
      .select()
      .single();

    if (!error && data) {
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { 
              ...m, 
              reactions: [...(m.reactions?.filter(r => r.user_id !== user.id) || []), data]
            }
          : m
      ));
    }
  }, [user]);

  // Remove reaction
  const removeReaction = useCallback(async (messageId: string) => {
    if (!user) return;
    
    await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id);

    setMessages(prev => prev.map(m => 
      m.id === messageId 
        ? { ...m, reactions: m.reactions?.filter(r => r.user_id !== user.id) }
        : m
    ));
  }, [user]);

  // Update typing status
  const setTyping = useCallback(async (recipientId: string, isTyping: boolean) => {
    if (!user) return;
    
    await supabase
      .from('user_presence')
      .upsert({
        user_id: user.id,
        typing_to: isTyping ? recipientId : null,
        typing_started_at: isTyping ? new Date().toISOString() : null,
        is_online: true,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
  }, [user]);

  // Update online status
  const updatePresence = useCallback(async (isOnline: boolean) => {
    if (!user) return;
    
    await supabase
      .from('user_presence')
      .upsert({
        user_id: user.id,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
  }, [user]);

  // Search users - for admin show all accounts, for teachers show relevant contacts
  // When query is empty, return initial contacts list
  const searchUsers = useCallback(async (query: string): Promise<UserSearchResult[]> => {
    if (!user) return [];
    
    // Get current user role
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const currentRole = currentProfile?.role;

    // Admin can see ALL registered accounts
    if (currentRole === 'admin') {
      const baseQuery = supabase
        .from('profiles')
        .select('id, full_name, profile_image, role')
        .neq('id', user.id)
        .neq('role', 'bus_attendance')
        .neq('role', 'school_attendance')
        .order('full_name')
        .limit(50);

      // Apply search filter if query provided
      const { data, error } = query.trim() 
        ? await baseQuery.ilike('full_name', `%${query}%`)
        : await baseQuery;
      
      return error ? [] : (data as UserSearchResult[]);
    }

    // Teacher can see: admins, other teachers, and parents whose kids are in their classes
    if (currentRole === 'teacher') {
      // Get teacher record to find assigned classes
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      // Get classes assigned to this teacher
      const { data: assignedClasses } = await supabase
        .from('classes')
        .select('id')
        .eq('class_teacher_id', teacherData?.id || '');

      const classIds = assignedClasses?.map(c => c.id) || [];

      // Get students in those classes
      const { data: studentsInClasses } = classIds.length > 0 
        ? await supabase
            .from('students')
            .select('parent_id')
            .in('class_id', classIds)
        : { data: [] };

      const parentIds = [...new Set(studentsInClasses?.map(s => s.parent_id).filter(Boolean) || [])];

      // Get admins, teachers, and relevant parents
      const adminsQuery = supabase
        .from('profiles')
        .select('id, full_name, profile_image, role')
        .neq('id', user.id)
        .in('role', ['admin', 'teacher'])
        .order('full_name')
        .limit(30);

      const { data: adminsAndTeachers } = query.trim()
        ? await adminsQuery.ilike('full_name', `%${query}%`)
        : await adminsQuery;

      // Get parents whose kids are in teacher's classes
      let relevantParents: UserSearchResult[] = [];
      if (parentIds.length > 0) {
        const parentsQuery = supabase
          .from('profiles')
          .select('id, full_name, profile_image, role')
          .in('id', parentIds)
          .order('full_name')
          .limit(20);

        const { data: parentsData } = query.trim()
          ? await parentsQuery.ilike('full_name', `%${query}%`)
          : await parentsQuery;
        
        relevantParents = (parentsData || []) as UserSearchResult[];
      }

      // Combine results and remove duplicates
      const allResults = [...(adminsAndTeachers || []), ...relevantParents];
      const uniqueResults = Array.from(
        new Map(allResults.map(item => [item.id, item])).values()
      );

      return uniqueResults.slice(0, 50) as UserSearchResult[];
    }

    // Default for other roles
    const baseQuery = supabase
      .from('profiles')
      .select('id, full_name, profile_image, role')
      .neq('id', user.id)
      .neq('role', 'bus_attendance')
      .neq('role', 'school_attendance')
      .order('full_name')
      .limit(50);

    const { data, error } = query.trim()
      ? await baseQuery.ilike('full_name', `%${query}%`)
      : await baseQuery;

    return error ? [] : (data as UserSearchResult[]);
  }, [user]);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: memberData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (!memberData?.length) return;

      const groupIds = memberData.map(m => m.group_id);
      
      const { data: groupsData } = await supabase
        .from('group_chats')
        .select('*')
        .in('id', groupIds);

      // Get members for each group
      const { data: allMembers } = await supabase
        .from('group_members')
        .select('*')
        .in('group_id', groupIds);

      const memberUserIds = [...new Set(allMembers?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, profile_image')
        .in('id', memberUserIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const groupsWithMembers: GroupChat[] = (groupsData || []).map(group => ({
        ...group,
        members: (allMembers?.filter(m => m.group_id === group.id) || []).map(m => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role as 'admin' | 'member',
          full_name: profileMap.get(m.user_id)?.full_name || 'Unknown',
          profile_image: profileMap.get(m.user_id)?.profile_image || null
        })),
        unread_count: 0
      }));

      setGroups(groupsWithMembers);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  }, [user]);

  // Create group
  const createGroup = useCallback(async (
    name: string, 
    description: string, 
    memberIds: string[]
  ): Promise<GroupChat | null> => {
    if (!user) return null;
    
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('group_chats')
        .insert({
          name,
          description,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin
      await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'admin'
        });

      // Add other members
      for (const memberId of memberIds) {
        await supabase
          .from('group_members')
          .insert({
            group_id: groupData.id,
            user_id: memberId,
            role: 'member'
          });
      }

      await fetchGroups();
      return {
        ...groupData,
        members: [],
        unread_count: 0
      } as GroupChat;
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  }, [user, fetchGroups]);

  // Fetch call logs
  const fetchCallLogs = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .or(`caller_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const userIds = new Set<string>();
      data?.forEach(call => {
        if (call.caller_id) userIds.add(call.caller_id);
        if (call.recipient_id) userIds.add(call.recipient_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, profile_image')
        .in('id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const callsWithProfiles: CallLog[] = (data || []).map(call => ({
        ...call,
        call_type: call.call_type as 'voice' | 'video',
        status: call.status as 'missed' | 'answered' | 'declined' | 'busy' | 'no_answer',
        caller_name: profileMap.get(call.caller_id)?.full_name || 'Unknown',
        caller_image: profileMap.get(call.caller_id)?.profile_image,
        recipient_name: call.recipient_id ? profileMap.get(call.recipient_id)?.full_name : undefined,
        recipient_image: call.recipient_id ? profileMap.get(call.recipient_id)?.profile_image : undefined
      }));

      setCallLogs(callsWithProfiles);
    } catch (error) {
      console.error('Error fetching call logs:', error);
    }
  }, [user]);

  // Subscribe to real-time updates with optimized performance
  useEffect(() => {
    if (!user) return;

    // Debounce conversation fetches to avoid hammering the API
    let fetchTimeout: NodeJS.Timeout | null = null;
    const debouncedFetchConversations = () => {
      if (fetchTimeout) clearTimeout(fetchTimeout);
      fetchTimeout = setTimeout(() => {
        fetchConversations();
      }, 300);
    };

    const messagesChannel = supabase
      .channel('messenger-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as any;
          
          // Optimistically add the message to the current view
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, {
              ...newMessage,
              attachments: [],
              reactions: [],
              reply_to: null
            }];
          });
          
          // Mark as delivered immediately
          markAsDelivered(newMessage.sender_id);
          
          // Update conversations list
          debouncedFetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          setMessages(prev => prev.map(m => 
            m.id === payload.new.id ? { ...m, ...payload.new } : m
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${user.id}`
        },
        (payload) => {
          // Update read/delivered status instantly (WhatsApp blue ticks)
          setMessages(prev => prev.map(m => 
            m.id === payload.new.id 
              ? { ...m, is_read: payload.new.is_read, is_delivered: payload.new.is_delivered, read_at: payload.new.read_at, delivered_at: payload.new.delivered_at }
              : m
          ));
        }
      )
      .subscribe();

    const presenceChannel = supabase
      .channel('messenger-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          const presence = payload.new as any;
          if (presence.typing_to === user.id) {
            setTypingUsers(prev => new Map(prev).set(presence.user_id, presence.user_id));
            setConversations(prev => prev.map(c => 
              c.recipient_id === presence.user_id ? { ...c, is_typing: true } : c
            ));
          } else {
            setTypingUsers(prev => {
              const newMap = new Map(prev);
              newMap.delete(presence.user_id);
              return newMap;
            });
            setConversations(prev => prev.map(c => 
              c.recipient_id === presence.user_id 
                ? { ...c, is_typing: false, is_online: presence.is_online, last_seen: presence.last_seen }
                : c
            ));
          }
        }
      )
      .subscribe();

    const reactionsChannel = supabase
      .channel('messenger-reactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions'
        },
        (payload) => {
          const reaction = payload.new as any;
          setMessages(prev => prev.map(m => 
            m.id === reaction.message_id 
              ? { ...m, reactions: [...(m.reactions || []), reaction] }
              : m
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'message_reactions'
        },
        (payload) => {
          const reaction = payload.old as any;
          setMessages(prev => prev.map(m => 
            m.id === reaction.message_id 
              ? { ...m, reactions: (m.reactions || []).filter(r => r.id !== reaction.id) }
              : m
          ));
        }
      )
      .subscribe();

    // Set online status
    updatePresence(true);

    // Handle page visibility
    const handleVisibilityChange = () => {
      updatePresence(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle beforeunload
    const handleBeforeUnload = () => {
      updatePresence(false);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (fetchTimeout) clearTimeout(fetchTimeout);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(reactionsChannel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updatePresence(false);
    };
  }, [user, fetchConversations, markAsDelivered, updatePresence]);

  // Archive chat - persisted in DB
  const archiveChat = useCallback(async (recipientId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('archived_chats')
        .upsert({
          user_id: user.id,
          contact_id: recipientId
        }, { onConflict: 'user_id,contact_id' });
      
      if (error) throw error;
      
      setConversations(prev => prev.filter(c => c.recipient_id !== recipientId));
      return true;
    } catch (error) {
      console.error('Error archiving chat:', error);
      return false;
    }
  }, [user]);

  // Pin/Unpin chat - persisted in DB
  const pinChat = useCallback(async (contactId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Check if already pinned
      const { data: existing } = await supabase
        .from('pinned_chats')
        .select('id')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .maybeSingle();
      
      if (existing) {
        // Unpin
        await supabase.from('pinned_chats').delete().eq('id', existing.id);
      } else {
        // Pin
        await supabase.from('pinned_chats').insert({ user_id: user.id, contact_id: contactId });
      }
      return true;
    } catch (error) {
      console.error('Error pinning chat:', error);
      return false;
    }
  }, [user]);

  // Fetch pinned chats
  const fetchPinnedChats = useCallback(async (): Promise<Set<string>> => {
    if (!user) return new Set();
    try {
      const { data } = await supabase
        .from('pinned_chats')
        .select('contact_id, group_id')
        .eq('user_id', user.id);
      
      const ids = new Set<string>();
      data?.forEach(p => {
        if (p.contact_id) ids.add(p.contact_id);
        if (p.group_id) ids.add(p.group_id);
      });
      return ids;
    } catch (error) {
      console.error('Error fetching pinned chats:', error);
      return new Set();
    }
  }, [user]);

  // Fetch archived chats
  const fetchArchivedChats = useCallback(async (): Promise<Set<string>> => {
    if (!user) return new Set();
    try {
      const { data } = await supabase
        .from('archived_chats')
        .select('contact_id, group_id')
        .eq('user_id', user.id);
      
      const ids = new Set<string>();
      data?.forEach(a => {
        if (a.contact_id) ids.add(a.contact_id);
        if (a.group_id) ids.add(a.group_id);
      });
      return ids;
    } catch (error) {
      console.error('Error fetching archived chats:', error);
      return new Set();
    }
  }, [user]);

  // Delete chat (soft delete - marks messages as deleted for user)
  const deleteChat = useCallback(async (recipientId: string) => {
    if (!user) return;
    
    try {
      // Mark all messages in this conversation as deleted for the current user
      await supabase
        .from('direct_messages')
        .update({ is_deleted_for_sender: true })
        .eq('sender_id', user.id)
        .eq('recipient_id', recipientId);
      
      await supabase
        .from('direct_messages')
        .update({ is_deleted_for_recipient: true })
        .eq('sender_id', recipientId)
        .eq('recipient_id', user.id);
      
      setConversations(prev => prev.filter(c => c.recipient_id !== recipientId));
      return true;
    } catch (error) {
      console.error('Error deleting chat:', error);
      return false;
    }
  }, [user]);

  // Star message (stored locally for now - can be extended to DB)
  const starMessage = useCallback(async (messageId: string): Promise<boolean> => {
    // For now, we'll manage starred messages in local state
    // This could be extended to store in a starred_messages table
    return true;
  }, []);

  // Forward message
  const forwardMessage = useCallback(async (
    messageId: string,
    recipientIds: string[]
  ): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const originalMessage = messages.find(m => m.id === messageId);
      if (!originalMessage) return false;
      
      for (const recipientId of recipientIds) {
        await supabase
          .from('direct_messages')
          .insert({
            sender_id: user.id,
            recipient_id: recipientId,
            content: originalMessage.content,
            forwarded_from_id: messageId,
            message_type: originalMessage.message_type
          });
      }
      
      return true;
    } catch (error) {
      console.error('Error forwarding message:', error);
      return false;
    }
  }, [user, messages]);

  // Get call history for a specific contact
  const getCallHistoryForContact = useCallback((contactId: string): CallLog[] => {
    return callLogs.filter(call => 
      call.caller_id === contactId || call.recipient_id === contactId
    );
  }, [callLogs]);

  // Toggle notifications for a chat (local state for now)
  const toggleChatNotifications = useCallback(async (contactId: string, enabled: boolean) => {
    // This would typically be stored in a chat_settings table
    // For now, we return success
    return true;
  }, []);

  // Block/unblock a user
  const blockUser = useCallback(async (contactId: string): Promise<boolean> => {
    if (!user) return false;
    // This would typically insert into a blocked_users table
    // For now, we just return success
    console.log('Blocking user:', contactId);
    return true;
  }, [user]);

  const unblockUser = useCallback(async (contactId: string): Promise<boolean> => {
    if (!user) return false;
    console.log('Unblocking user:', contactId);
    return true;
  }, [user]);

  return {
    conversations,
    groups,
    messages,
    callLogs,
    loading,
    typingUsers,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    markAsDelivered,
    deleteMessage,
    addReaction,
    removeReaction,
    setTyping,
    updatePresence,
    searchUsers,
    fetchGroups,
    createGroup,
    fetchCallLogs,
    setMessages,
    archiveChat,
    deleteChat,
    starMessage,
    forwardMessage,
    getCallHistoryForContact,
    toggleChatNotifications,
    blockUser,
    unblockUser,
    pinChat,
    fetchPinnedChats,
    fetchArchivedChats
  };
}
