import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  read: boolean;
  data: any;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('notification_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data as AppNotification[]);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    }
    setLoading(false);
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase
      .from('notification_history')
      .update({ read: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    await supabase
      .from('notification_history')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_history',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          setNotifications(prev => [newNotif, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);

          // Play notification sound
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkZqTi4J8eXx/goiOj42KhoKAgH+Bg4eLjY+PjouIhYKBgIGDhYiLjY+PjouIhYOBgIGDhYiKjI6OjIqHhYOBgYKEhoiKjI2MioiGhIOCgoOFh4mLjIyLiYeGhIODhIWHiYqLi4qIh4WEhIOEhYeJiouLioiHhYSEhISGh4iKi4qJiIaFhISEhYaHiYqKiomHhoWEhISFhoeJioqJiIeGhYSEhYaHiImKiYiHhoWFhIWFhoiJiYmIh4aFhYWFhoaIiYmIiIeGhYWFhYaHiIiJiIeHhoWFhYWGh4iIiIiHhoaFhYWGhoeIiIiHh4aGhYWFhoeHiIiIh4eGhoWFhYaGh4iIh4eHhoaFhYaGh4eIiIeHh4aGhYWGhoeHiIeHh4eGhoaGhoeHiIeHh4eGhoaGhoeHh4eHh4eHhoaGhoeHh4eHh4eHhoaGhoeHh4eHh4eHh4aGhoeHh4eHh4eHhoaGh4eHh4eHh4eHhoaHh4eHh4eHh4eHhoaHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eH');
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch (e) {}

          // Show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotif.title, {
              body: newNotif.message,
              icon: '/favicon.ico',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
