import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogIn, LogOut, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface BoardingHistoryProps {
  studentId: string;
  busId?: string;
}

interface BoardingLog {
  id: string;
  action: string;
  location: string;
  timestamp: string;
  bus_id: string;
}

export default function BoardingHistory({ studentId, busId }: BoardingHistoryProps) {
  const { language } = useLanguage();
  const [logs, setLogs] = useState<BoardingLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoardingHistory();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`boarding-history-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bus_boarding_logs',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => {
          if (payload.new) {
            setLogs(prev => [payload.new as BoardingLog, ...prev].slice(0, 10));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const loadBoardingHistory = async () => {
    try {
      let query = supabase
        .from('bus_boarding_logs')
        .select('*')
        .eq('student_id', studentId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (busId) {
        query = query.eq('bus_id', busId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading boarding history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'ar' ? 'سجل الركوب' : 'Boarding History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {language === 'ar' ? 'سجل الركوب' : 'Boarding History'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {language === 'ar' ? 'لا يوجد سجل حتى الآن' : 'No history yet'}
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div
                    className={`mt-1 p-2 rounded-full ${
                      log.action === 'board'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-orange-500/10 text-orange-500'
                    }`}
                  >
                    {log.action === 'board' ? (
                      <LogIn className="h-4 w-4" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={log.action === 'board' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {log.action === 'board'
                          ? language === 'ar' ? 'صعود' : 'Boarded'
                          : language === 'ar' ? 'نزول' : 'Alighted'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), 'MMM dd, h:mm a')}
                      </span>
                    </div>
                    
                    {log.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {log.location}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
