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
  Signal
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import NfcReader from '@/components/features/NfcReader';

interface Student {
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

export default function Tracking() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<RouteInfo>({
    id: '1',
    name: 'Route A - Morning',
    nameAr: 'المسار أ - الصباح',
    type: 'morning',
    totalStops: 12,
    completedStops: 0,
    estimatedTime: 45,
    status: 'not-started'
  });

  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'Sara Ahmed',
      nameAr: 'سارة أحمد',
      location: 'Al Khuwair 33',
      locationAr: 'الخوير ٣٣',
      pickupTime: '7:15 AM',
      status: 'waiting',
      parentPhone: '+968 9123 4567',
      address: '123 Street, Al Khuwair',
      addressAr: '١٢٣ شارع، الخوير'
    },
    {
      id: '2',
      name: 'Mohammed Ali',
      nameAr: 'محمد علي',
      location: 'Al Ghubra',
      locationAr: 'الغبرة',
      pickupTime: '7:20 AM',
      status: 'waiting',
      parentPhone: '+968 9234 5678',
      address: '456 Avenue, Al Ghubra',
      addressAr: '٤٥٦ شارع، الغبرة'
    },
    {
      id: '3',
      name: 'Fatima Hassan',
      nameAr: 'فاطمة حسن',
      location: 'Al Azaiba',
      locationAr: 'العذيبة',
      pickupTime: '7:25 AM',
      status: 'waiting',
      parentPhone: '+968 9345 6789',
      address: '789 Road, Al Azaiba',
      addressAr: '٧٨٩ طريق، العذيبة'
    },
    {
      id: '4',
      name: 'Omar Khalid',
      nameAr: 'عمر خالد',
      location: 'Al Seeb',
      locationAr: 'السيب',
      pickupTime: '7:30 AM',
      status: 'waiting',
      parentPhone: '+968 9456 7890',
      address: '321 Street, Al Seeb',
      addressAr: '٣٢١ شارع، السيب'
    }
  ]);

  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

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

  const handleStudentPickup = (studentId: string) => {
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, status: 'picked' as const } : s
    ));
    setCurrentRoute({ 
      ...currentRoute, 
      completedStops: currentRoute.completedStops + 1 
    });
    toast({
      title: language === 'en' ? 'Student Picked Up' : 'تم استلام الطالب',
      description: language === 'en' 
        ? 'Student has been marked as picked up'
        : 'تم تسجيل استلام الطالب'
    });
  };

  const handleStudentAbsent = (studentId: string) => {
    setStudents(students.map(s => 
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
                    {language === 'en' ? 'Al Khuwair' : 'الخوير'}
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
                    {language === 'en' ? '15 minutes' : '١٥ دقيقة'}
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
                    {language === 'en' ? 'Driver' : 'السائق'}
                  </p>
                  <p className="text-lg font-semibold">
                    {language === 'en' ? 'Ali Mohammed' : 'علي محمد'}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4" />
                </Button>
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
                  {currentRoute.completedStops}/{currentRoute.totalStops}
                </p>
              </div>
              <div className="w-16">
                <Progress 
                  value={(currentRoute.completedStops / currentRoute.totalStops) * 100} 
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
                  {students.filter(s => s.status === 'picked').length}/{students.length}
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
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {language === 'en' ? 'Student List' : 'قائمة الطلاب'}
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsReportDialogOpen(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Report' : 'تقرير'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {students.map((student) => (
                  <div 
                    key={student.id} 
                    className="p-3 rounded-lg bg-muted/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(student.status)}
                        <div>
                          <p className="font-medium">
                            {language === 'en' ? student.name : student.nameAr}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === 'en' ? student.location : student.locationAr} • {student.pickupTime}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(student.status)}
                    </div>
                    
                    {student.status === 'waiting' && (
                      <div className="flex gap-2 ml-8">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStudentPickup(student.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {language === 'en' ? 'Pick Up' : 'استلام'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStudentAbsent(student.id)}
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {language === 'en' ? 'Absent' : 'غائب'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleCallParent(student.parentPhone)}
                        >
                          <Phone className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'en' ? 'Quick Actions' : 'الإجراءات السريعة'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="w-full">
              <BatteryLow className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Low Fuel Alert' : 'تنبيه انخفاض الوقود'}
            </Button>
            <Button variant="outline" className="w-full">
              <AlertCircle className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Traffic Delay' : 'تأخير المرور'}
            </Button>
            <Button variant="outline" className="w-full">
              <School className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Arrived at School' : 'وصل إلى المدرسة'}
            </Button>
            <Button variant="outline" className="w-full">
              <Phone className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Emergency Contact' : 'اتصال طوارئ'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <Label>{language === 'en' ? 'Report Type' : 'نوع التقرير'}</Label>
              <select className="w-full p-2 border rounded-lg">
                <option value="delay">
                  {language === 'en' ? 'Route Delay' : 'تأخير المسار'}
                </option>
                <option value="incident">
                  {language === 'en' ? 'Incident Report' : 'تقرير حادث'}
                </option>
                <option value="mechanical">
                  {language === 'en' ? 'Mechanical Issue' : 'مشكلة ميكانيكية'}
                </option>
                <option value="other">
                  {language === 'en' ? 'Other' : 'أخرى'}
                </option>
              </select>
            </div>
            <div>
              <Label>{language === 'en' ? 'Message' : 'الرسالة'}</Label>
              <Textarea
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                placeholder={language === 'en' 
                  ? 'Describe the issue...'
                  : 'صف المشكلة...'}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                {language === 'en' ? 'Cancel' : 'إلغاء'}
              </Button>
              <Button onClick={handleSendReport}>
                {language === 'en' ? 'Send Report' : 'إرسال التقرير'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}