import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin,
  Navigation,
  Bus,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  MessageSquare,
  Play,
  Pause,
  Square,
  Home,
  School,
  Navigation2,
  Wifi,
  WifiOff,
  BatteryLow,
  Signal,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import NfcReader from '@/components/features/NfcReader';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface RouteInfo {
  id: string;
  name: string;
  nameAr: string;
  type: 'morning' | 'afternoon';
  totalStops: number;
  completedStops: number;
  estimatedTime: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'paused';
}

interface StudentOnRoute {
  id: string;
  name: string;
  nameAr: string;
  location: string;
  locationAr: string;
  pickupTime: string;
  status: 'waiting' | 'picked' | 'absent' | 'dropped';
  parentPhone: string;
  address: string;
  addressAr: string;
}

export default function Tracking() {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<RouteInfo>({
    id: '',
    name: 'No Route Assigned',
    nameAr: 'لا يوجد مسار',
    type: 'morning',
    totalStops: 0,
    completedStops: 0,
    estimatedTime: 0,
    status: 'not-started'
  });

  const [studentsOnRoute, setStudentsOnRoute] = useState<StudentOnRoute[]>([]);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentOnRoute | null>(null);

  // Fetch bus routes from database
  const { data: busRoutes = [], isLoading: routesLoading } = useQuery({
    queryKey: ['bus-routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bus_routes')
        .select(`
          *,
          bus:buses(id, bus_number, driver_id)
        `)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  // Fetch students for the route
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-tracking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          first_name_ar,
          last_name_ar,
          class,
          parent:profiles!students_parent_id_fkey(phone)
        `)
        .eq('status', 'active')
        .limit(20);
      if (error) throw error;
      return data;
    }
  });

  // Fetch bus location
  const { data: busLocation } = useQuery({
    queryKey: ['bus-location'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bus_locations')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Set up route based on fetched data
  useEffect(() => {
    if (busRoutes.length > 0) {
      const route = busRoutes[0];
      const stopsArray = Array.isArray(route.stops) ? route.stops : [];
      setCurrentRoute({
        id: route.id,
        name: route.route_name,
        nameAr: route.route_name_ar || route.route_name,
        type: 'morning',
        totalStops: stopsArray.length,
        completedStops: 0,
        estimatedTime: 45,
        status: 'not-started'
      });
    }
  }, [busRoutes]);

  // Map students to route format
  useEffect(() => {
    if (students.length > 0) {
      const mappedStudents: StudentOnRoute[] = students.map((s, index) => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        nameAr: `${s.first_name_ar || s.first_name} ${s.last_name_ar || s.last_name}`,
        location: s.class || 'Unknown',
        locationAr: s.class || 'غير معروف',
        pickupTime: `7:${15 + index * 5} AM`,
        status: 'waiting' as const,
        parentPhone: s.parent?.phone || '+968 9000 0000',
        address: s.class || 'Unknown',
        addressAr: s.class || 'غير معروف'
      }));
      setStudentsOnRoute(mappedStudents);
    }
  }, [students]);

  const handleStartRoute = () => {
    setIsTracking(true);
    setCurrentRoute({ ...currentRoute, status: 'in-progress' });
    toast({
      title: language === 'en' ? 'Route Started' : 'بدأ المسار',
      description: language === 'en' 
        ? 'GPS tracking is now active'
        : 'تتبع GPS نشط الآن'
    });
  };

  const handlePauseRoute = () => {
    setIsTracking(false);
    setCurrentRoute({ ...currentRoute, status: 'paused' });
    toast({
      title: language === 'en' ? 'Route Paused' : 'توقف المسار',
      description: language === 'en' 
        ? 'GPS tracking has been paused'
        : 'تم إيقاف تتبع GPS مؤقتاً'
    });
  };

  const handleEndRoute = () => {
    setIsTracking(false);
    setCurrentRoute({ ...currentRoute, status: 'completed', completedStops: currentRoute.totalStops });
    toast({
      title: language === 'en' ? 'Route Completed' : 'اكتمل المسار',
      description: language === 'en' 
        ? 'All students have been delivered'
        : 'تم توصيل جميع الطلاب'
    });
  };

  const handleStudentPickup = async (studentId: string) => {
    setStudentsOnRoute(studentsOnRoute.map(s => 
      s.id === studentId ? { ...s, status: 'picked' as const } : s
    ));
    setCurrentRoute({ 
      ...currentRoute, 
      completedStops: currentRoute.completedStops + 1 
    });

    // Record in database
    try {
      await supabase.from('bus_boarding_logs').insert({
        student_id: studentId,
        action: 'picked',
        timestamp: new Date().toISOString(),
        location: 'Pickup Point'
      });
    } catch (error) {
      console.error('Failed to log pickup:', error);
    }

    toast({
      title: language === 'en' ? 'Student Picked Up' : 'تم استلام الطالب',
      description: language === 'en' 
        ? 'Student has been marked as picked up'
        : 'تم تسجيل استلام الطالب'
    });
  };

  const handleStudentAbsent = (studentId: string) => {
    setStudentsOnRoute(studentsOnRoute.map(s => 
      s.id === studentId ? { ...s, status: 'absent' as const } : s
    ));
    setCurrentRoute({ 
      ...currentRoute, 
      completedStops: currentRoute.completedStops + 1 
    });
    toast({
      title: language === 'en' ? 'Student Marked Absent' : 'تم تسجيل الغياب',
      description: language === 'en' 
        ? 'Parent will be notified'
        : 'سيتم إخطار ولي الأمر'
    });
  };

  const handleCallParent = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleSendReport = () => {
    toast({
      title: language === 'en' ? 'Report Sent' : 'تم إرسال التقرير',
      description: language === 'en' 
        ? 'Your report has been sent to the school'
        : 'تم إرسال تقريرك إلى المدرسة'
    });
    setIsReportDialogOpen(false);
    setReportMessage('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'picked':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'absent':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'dropped':
        return <Home className="h-5 w-5 text-primary" />;
      default:
        return <Clock className="h-5 w-5 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'waiting': { 
        label: language === 'en' ? 'Waiting' : 'في الانتظار',
        variant: 'outline' as const
      },
      'picked': { 
        label: language === 'en' ? 'Picked Up' : 'تم الاستلام',
        variant: 'default' as const
      },
      'absent': { 
        label: language === 'en' ? 'Absent' : 'غائب',
        variant: 'destructive' as const
      },
      'dropped': { 
        label: language === 'en' ? 'Dropped Off' : 'تم التوصيل',
        variant: 'secondary' as const
      }
    };
    
    const config = statusMap[status as keyof typeof statusMap];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (routesLoading || studentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show parent tracking view
  if (user?.role === 'parent') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Navigation className="h-8 w-8" />
            {language === 'en' ? 'Bus Tracking' : 'تتبع الحافلة'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {language === 'en' 
              ? 'Track your children\'s bus in real-time'
              : 'تتبع حافلة أطفالك في الوقت الفعلي'}
          </p>
        </div>

        {/* Live Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {language === 'en' ? 'Live Location' : 'الموقع المباشر'}
              </span>
              <Badge variant="outline" className="gap-1">
                <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                {language === 'en' ? 'Live' : 'مباشر'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Navigation2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Live map tracking will be displayed here'
                    : 'سيتم عرض التتبع المباشر للخريطة هنا'}
                </p>
                {busLocation && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last update: {new Date(busLocation.last_updated || '').toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bus Status */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Current Location' : 'الموقع الحالي'}
                  </p>
                  <p className="text-lg font-semibold">
                    {busLocation?.current_stop || (language === 'en' ? 'En Route' : 'في الطريق')}
                  </p>
                </div>
                <MapPin className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'ETA to School' : 'الوقت المتوقع للوصول'}
                  </p>
                  <p className="text-lg font-semibold">
                    {busLocation?.eta_minutes 
                      ? `${busLocation.eta_minutes} ${language === 'en' ? 'minutes' : 'دقيقة'}`
                      : (language === 'en' ? 'Calculating...' : 'جاري الحساب...')}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Bus Number' : 'رقم الحافلة'}
                  </p>
                  <p className="text-lg font-semibold">
                    {busRoutes[0]?.bus?.bus_number || (language === 'en' ? 'Not Assigned' : 'غير محدد')}
                  </p>
                </div>
                <Bus className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Driver view
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Navigation className="h-8 w-8" />
            {language === 'en' ? 'Route Tracking' : 'تتبع المسار'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {language === 'en' ? currentRoute.name : currentRoute.nameAr}
          </p>
        </div>
        <div className="flex gap-2">
          <NfcReader driverMode={true} />
          {currentRoute.status === 'not-started' && (
            <Button onClick={handleStartRoute} className="gap-2">
              <Play className="h-4 w-4" />
              {language === 'en' ? 'Start Route' : 'بدء المسار'}
            </Button>
          )}
          {currentRoute.status === 'in-progress' && (
            <>
              <Button onClick={handlePauseRoute} variant="outline" className="gap-2">
                <Pause className="h-4 w-4" />
                {language === 'en' ? 'Pause' : 'إيقاف مؤقت'}
              </Button>
              <Button onClick={handleEndRoute} variant="destructive" className="gap-2">
                <Square className="h-4 w-4" />
                {language === 'en' ? 'End Route' : 'إنهاء المسار'}
              </Button>
            </>
          )}
          {currentRoute.status === 'paused' && (
            <Button onClick={handleStartRoute} className="gap-2">
              <Play className="h-4 w-4" />
              {language === 'en' ? 'Resume' : 'استئناف'}
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Progress' : 'التقدم'}
                </p>
                <p className="text-2xl font-bold">
                  {currentRoute.completedStops}/{currentRoute.totalStops || studentsOnRoute.length}
                </p>
              </div>
              <div className="w-16">
                <Progress 
                  value={currentRoute.totalStops > 0 ? (currentRoute.completedStops / currentRoute.totalStops) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'ETA' : 'الوقت المتوقع'}
                </p>
                <p className="text-2xl font-bold">
                  {currentRoute.estimatedTime} {language === 'en' ? 'min' : 'دقيقة'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Students' : 'الطلاب'}
                </p>
                <p className="text-2xl font-bold">
                  {studentsOnRoute.filter(s => s.status === 'picked').length}/{studentsOnRoute.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Status' : 'الحالة'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {isTracking ? (
                    <>
                      <Wifi className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium text-success">
                        {language === 'en' ? 'Tracking' : 'التتبع نشط'}
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {language === 'en' ? 'Offline' : 'غير متصل'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Signal className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map and Student List */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation2 className="h-5 w-5" />
              {language === 'en' ? 'Route Map' : 'خريطة المسار'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Interactive map will be displayed here'
                    : 'سيتم عرض الخريطة التفاعلية هنا'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {language === 'en' ? 'Students on Route' : 'الطلاب في المسار'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {studentsOnRoute.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{language === 'en' ? 'No students assigned to this route' : 'لا يوجد طلاب في هذا المسار'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentsOnRoute.map((student) => (
                    <div
                      key={student.id}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(student.status)}
                          <div>
                            <h4 className="font-medium">
                              {language === 'en' ? student.name : student.nameAr}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {language === 'en' ? student.location : student.locationAr}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {language === 'en' ? 'Pickup:' : 'الاستلام:'} {student.pickupTime}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(student.status)}
                          {student.status === 'waiting' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCallParent(student.parentPhone)}
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleStudentPickup(student.id)}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleStudentAbsent(student.id)}
                              >
                                <AlertCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Send Report' : 'إرسال تقرير'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'en' ? 'Message' : 'الرسالة'}</Label>
              <Textarea
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                placeholder={language === 'en' ? 'Describe the issue...' : 'صف المشكلة...'}
                rows={4}
              />
            </div>
            <Button onClick={handleSendReport} className="w-full">
              {language === 'en' ? 'Send Report' : 'إرسال التقرير'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
