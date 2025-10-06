import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Bus, Clock, LogIn, LogOut, Calendar as CalendarIcon, Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import LogoLoader from "@/components/LogoLoader";

export default function BusTracking() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [studentData, setStudentData] = useState<any>(null);

  // Support developer role testing
  const effectiveRole = profile?.role === 'developer'
    ? (sessionStorage.getItem('developerViewRole') as any) || 'developer'
    : profile?.role;

  useEffect(() => {
    loadData();
  }, [user, profile]);

  const loadData = async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    try {
      if (effectiveRole === 'parent') {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('parent_id', user.id);

        if (error) throw error;
        setChildren(data || []);
      } else if (effectiveRole === 'student') {
        const { data, error } = await supabase
          .from('students')
          .select('id')
          .eq('profile_id', user.id)
          .single();

        if (error) throw error;
        setStudentData(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  if (effectiveRole !== 'parent' && effectiveRole !== 'student') {
    return (
      <div className="p-6">
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium mb-1">
                  {language === 'ar' ? 'غير متاح' : 'Not Available'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? 'تتبع الحافلة متاح فقط للطلاب وأولياء الأمور'
                    : 'Bus tracking is only available for students and parents'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'ar' ? 'تتبع الحافلة' : 'Bus Tracking'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'تتبع موقع الحافلة المدرسية مباشرة' : 'Track school bus location in real-time'}
        </p>
      </div>

      {effectiveRole === 'parent' && (
        <>
          {children.length > 0 ? (
            children.map((child) => (
              <BusCard
                key={child.id}
                studentId={child.id}
                studentName={`${child.first_name} ${child.last_name}`}
                language={language}
                userId={user!.id}
                showQuickActions={true}
              />
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  {language === 'ar' ? 'لا يوجد أطفال مسجلين' : 'No children registered'}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {effectiveRole === 'student' && studentData && (
        <BusCard
          studentId={studentData.id}
          studentName=""
          language={language}
          userId={user!.id}
          showQuickActions={false}
        />
      )}

      {effectiveRole === 'student' && !studentData && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {language === 'ar' ? 'لا توجد بيانات طالب' : 'No student data found'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface BusCardProps {
  studentId: string;
  studentName: string;
  language: string;
  userId: string;
  showQuickActions: boolean;
}

function BusCard({ studentId, studentName, language, userId, showQuickActions }: BusCardProps) {
  const [busInfo, setBusInfo] = useState<any>(null);
  const [busLocation, setBusLocation] = useState<any>(null);
  const [boardingLogs, setBoardingLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState<string>('');
  const [requestDate, setRequestDate] = useState<Date>(new Date());
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadBusData();

    const channel = supabase
      .channel(`bus-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bus_locations'
        },
        (payload) => {
          if (payload.new.bus_id === busInfo?.bus_id) {
            setBusLocation(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const loadBusData = async () => {
    try {
      const { data: assignment, error: assignmentError } = await supabase
        .from('student_bus_assignments')
        .select('*, buses(bus_number)')
        .eq('student_id', studentId)
        .eq('is_active', true)
        .maybeSingle();

      if (assignmentError) throw assignmentError;

      if (assignment) {
        setBusInfo({
          bus_id: assignment.bus_id,
          busNumber: assignment.buses?.bus_number
        });

        const { data: location } = await supabase
          .from('bus_locations')
          .select('*')
          .eq('bus_id', assignment.bus_id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (location) {
          setBusLocation(location);
        }

        const { data: logs } = await supabase
          .from('bus_boarding_logs')
          .select('*')
          .eq('student_id', studentId)
          .order('timestamp', { ascending: false })
          .limit(10);

        if (logs) {
          setBoardingLogs(logs);
        }
      }
    } catch (error) {
      console.error('Error loading bus data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async () => {
    if (!requestType) {
      toast.error(language === 'ar' ? 'يرجى اختيار نوع الطلب' : 'Please select request type');
      return;
    }

    if (!reason.trim()) {
      toast.error(language === 'ar' ? 'يرجى تقديم سبب' : 'Please provide a reason');
      return;
    }

    try {
      const { error } = await supabase
        .from('transport_requests')
        .insert({
          student_id: studentId,
          parent_id: userId,
          request_type: requestType,
          request_date: format(requestDate, 'yyyy-MM-dd'),
          reason: reason,
          status: 'pending'
        });

      if (error) throw error;

      toast.success(language === 'ar' ? 'تم إرسال الطلب بنجاح' : 'Request submitted successfully');
      setIsRequestDialogOpen(false);
      setRequestType('');
      setReason('');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(language === 'ar' ? 'فشل إرسال الطلب' : 'Failed to submit request');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!busInfo) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            {language === 'ar' ? 'لا توجد حافلة مخصصة' : 'No bus assigned'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            {studentName && <span>{studentName}</span>}
            {!studentName && <span>{language === 'ar' ? 'تتبع الحافلة' : 'Bus Tracking'}</span>}
          </div>
          <Badge variant="secondary">
            {language === 'ar' ? 'حافلة' : 'Bus'} #{busInfo.busNumber}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ETA & Location Display */}
        <div className="relative h-[200px] bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBvcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
          <div className="relative z-10 text-center space-y-3">
            <motion.div
              animate={{
                y: [0, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Bus className="h-12 w-12 text-primary mx-auto" />
            </motion.div>
            <div>
              <p className="text-sm font-medium">
                {busLocation?.current_stop || (language === 'ar' ? 'في الطريق' : 'En Route')}
              </p>
              {busLocation?.eta_minutes ? (
                <p className="text-2xl font-bold text-primary mt-2">
                  {busLocation.eta_minutes} {language === 'ar' ? 'دقيقة' : 'min'}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  {language === 'ar' ? 'لا توجد بيانات متاحة' : 'No live data available'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Boarding History */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {language === 'ar' ? 'سجل الصعود والنزول' : 'Boarding History'}
          </h3>
          <ScrollArea className="h-[200px] rounded-lg border p-3">
            {boardingLogs.length > 0 ? (
              <div className="space-y-2">
                {boardingLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2 bg-accent/5 rounded">
                    <div className="flex items-center gap-2">
                      {log.action === 'boarded' ? (
                        <LogIn className="h-4 w-4 text-green-600" />
                      ) : (
                        <LogOut className="h-4 w-4 text-orange-600" />
                      )}
                      <span className="text-sm font-medium">
                        {log.action === 'boarded' 
                          ? (language === 'ar' ? 'صعد إلى الحافلة' : 'Boarded Bus')
                          : (language === 'ar' ? 'نزل من الحافلة' : 'Exited Bus')
                        }
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                      </div>
                      {log.location && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {log.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                {language === 'ar' ? 'لا يوجد سجل حتى الآن' : 'No boarding history yet'}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Quick Actions (Parents Only) */}
        {showQuickActions && (
          <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2">
                <CalendarIcon className="h-4 w-4" />
                {language === 'ar' ? 'طلب نقل خاص' : 'Request Transport Change'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'طلب تغيير النقل' : 'Transport Change Request'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>{language === 'ar' ? 'نوع الطلب' : 'Request Type'}</Label>
                  <Select value={requestType} onValueChange={setRequestType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={language === 'ar' ? 'اختر نوع الطلب' : 'Select request type'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="absent">
                        {language === 'ar' ? 'غياب - لن يحضر' : 'Absent - Will not come'}
                      </SelectItem>
                      <SelectItem value="no_morning_bus">
                        {language === 'ar' ? 'لن يستخدم حافلة الصباح' : 'No morning bus'}
                      </SelectItem>
                      <SelectItem value="no_afternoon_bus">
                        {language === 'ar' ? 'لن يستخدم حافلة المساء' : 'No afternoon bus'}
                      </SelectItem>
                      <SelectItem value="parent_pickup">
                        {language === 'ar' ? 'استلام من قبل ولي الأمر' : 'Parent pickup'}
                      </SelectItem>
                      <SelectItem value="parent_dropoff">
                        {language === 'ar' ? 'توصيل من قبل ولي الأمر' : 'Parent dropoff'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{language === 'ar' ? 'التاريخ' : 'Date'}</Label>
                  <Calendar
                    mode="single"
                    selected={requestDate}
                    onSelect={(date) => date && setRequestDate(date)}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border mt-2"
                  />
                </div>

                <div>
                  <Label>{language === 'ar' ? 'السبب' : 'Reason'}</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={language === 'ar' ? 'يرجى تقديم سبب...' : 'Please provide a reason...'}
                    className="mt-2"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleRequestSubmit}>
                  <Send className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'إرسال' : 'Submit'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
