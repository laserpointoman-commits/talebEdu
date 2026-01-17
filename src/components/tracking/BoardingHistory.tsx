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
  daysToShow?: number; // Default 7 days
}

interface BoardingLog {
  id: string;
  action: string;
  location: string;
  timestamp: string;
  bus_id: string;
  nfc_verified?: boolean;
  manual_entry?: boolean;
}

export default function BoardingHistory({ studentId, busId, daysToShow = 7 }: BoardingHistoryProps) {
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
            setLogs(prev => [payload.new as BoardingLog, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId, daysToShow]);

  const loadBoardingHistory = async () => {
    try {
      // Calculate date range - past X days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToShow);
      const startDateStr = startDate.toISOString();

      let query = supabase
        .from('bus_boarding_logs')
        .select('*')
        .eq('student_id', studentId)
        .gte('timestamp', startDateStr)
        .order('timestamp', { ascending: false });

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

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    const date = format(new Date(log.timestamp), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, BoardingLog[]>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'ar' ? 'سجل الركوب' : language === 'hi' ? 'बोर्डिंग इतिहास' : 'Boarding History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {language === 'ar' ? 'جاري التحميل...' : language === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return language === 'ar' ? 'اليوم' : language === 'hi' ? 'आज' : 'Today';
    }
    if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return language === 'ar' ? 'أمس' : language === 'hi' ? 'कल' : 'Yesterday';
    }
    return format(date, 'EEEE, MMM dd');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {language === 'ar' 
            ? `سجل الركوب (آخر ${daysToShow} أيام)` 
            : language === 'hi' 
            ? `बोर्डिंग इतिहास (पिछले ${daysToShow} दिन)` 
            : `Boarding History (Last ${daysToShow} Days)`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {language === 'ar' ? 'لا يوجد سجل خلال هذه الفترة' : language === 'hi' ? 'इस अवधि में कोई रिकॉर्ड नहीं' : 'No records in this period'}
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedLogs).map(([date, dayLogs]) => (
                <div key={date}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-card py-1">
                    {formatDateHeader(date)}
                  </h4>
                  <div className="space-y-3">
                    {dayLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div
                          className={`mt-1 p-2 rounded-full ${
                            log.action === 'boarded' || log.action === 'board'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-orange-500/10 text-orange-500'
                          }`}
                        >
                          {log.action === 'boarded' || log.action === 'board' ? (
                            <LogIn className="h-4 w-4" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={log.action === 'boarded' || log.action === 'board' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {log.action === 'boarded' || log.action === 'board'
                                  ? language === 'ar' ? 'صعود' : language === 'hi' ? 'बोर्ड किया' : 'Boarded'
                                  : language === 'ar' ? 'نزول' : language === 'hi' ? 'उतरे' : 'Alighted'}
                              </Badge>
                              {log.nfc_verified && (
                                <Badge variant="outline" className="text-xs">
                                  NFC
                                </Badge>
                              )}
                              {log.manual_entry && (
                                <Badge variant="outline" className="text-xs text-amber-600">
                                  {language === 'ar' ? 'يدوي' : language === 'hi' ? 'मैनुअल' : 'Manual'}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.timestamp), 'h:mm a')}
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
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
