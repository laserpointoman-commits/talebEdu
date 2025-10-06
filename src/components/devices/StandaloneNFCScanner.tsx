import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard,
  CheckCircle,
  XCircle,
  WifiIcon,
  WifiOffIcon,
  School,
  Calendar,
  Clock
} from 'lucide-react';

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  firstNameAr: string;
  lastNameAr: string;
  grade: string;
  class: string;
  profileImage?: string;
  nfcId: string;
  action?: 'check_in' | 'check_out';
}

interface StandaloneNFCProps {
  deviceType: 'entrance' | 'bus';
  deviceId?: string;
  location?: string;
}

export default function StandaloneNFCScanner({ 
  deviceType = 'entrance',
  deviceId = `${deviceType.toUpperCase()}-${Date.now().toString().slice(-6)}`,
  location = 'Main Entrance'
}: StandaloneNFCProps) {
  const { language } = useLanguage();
  const [isOnline, setIsOnline] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<StudentData | null>(null);
  const [todayCount, setTodayCount] = useState({ checkIn: 0, checkOut: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check online status
  useEffect(() => {
    const checkOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);
    
    const interval = setInterval(checkOnline, 5000);
    
    return () => {
      window.removeEventListener('online', checkOnline);
      window.removeEventListener('offline', checkOnline);
      clearInterval(interval);
    };
  }, []);

  // Mock student data for testing
  const mockStudents: StudentData[] = [
    {
      id: '1',
      firstName: 'Ahmed',
      lastName: 'Al-Said',
      firstNameAr: 'أحمد',
      lastNameAr: 'السعيد',
      grade: '5',
      class: '5A',
      profileImage: undefined,
      nfcId: 'NFC123456'
    },
    {
      id: '2',
      firstName: 'Fatima',
      lastName: 'Al-Rashid',
      firstNameAr: 'فاطمة',
      lastNameAr: 'الرشيد',
      grade: '7',
      class: '7B',
      profileImage: undefined,
      nfcId: 'NFC789012'
    },
    {
      id: '3',
      firstName: 'Mohammed',
      lastName: 'Al-Hassan',
      firstNameAr: 'محمد',
      lastNameAr: 'الحسن',
      grade: '3',
      class: '3C',
      profileImage: undefined,
      nfcId: 'NFC345678'
    }
  ];

  const handleNFCScan = async (nfcId?: string) => {
    setIsScanning(true);
    
    // Simulate NFC scan delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For testing, randomly select a student
    const testNfcId = nfcId || mockStudents[Math.floor(Math.random() * mockStudents.length)].nfcId;
    const student = mockStudents.find(s => s.nfcId === testNfcId);
    
    if (student) {
      // Determine action based on time of day or previous scans
      const hour = new Date().getHours();
      const action: 'check_in' | 'check_out' = hour < 12 ? 'check_in' : 'check_out';
      
      const studentWithAction = { ...student, action };
      setCurrentStudent(studentWithAction);
      setShowStudentModal(true);
      
      // Update counters
      if (action === 'check_in') {
        setTodayCount(prev => ({ ...prev, checkIn: prev.checkIn + 1 }));
      } else {
        setTodayCount(prev => ({ ...prev, checkOut: prev.checkOut + 1 }));
      }
      
      // Auto-close modal after 3 seconds
      setTimeout(() => {
        setShowStudentModal(false);
        setCurrentStudent(null);
      }, 3000);
      
      // Send to backend (when connected to Supabase)
      if (isOnline) {
        await sendToBackend(studentWithAction);
      } else {
        // Store locally for later sync
        storeOffline(studentWithAction);
      }
    } else {
      toast({
        title: language === 'en' ? "Unknown Card" : "بطاقة غير معروفة",
        description: language === 'en' ? "This NFC card is not registered" : "هذه البطاقة غير مسجلة",
        variant: "destructive"
      });
    }
    
    setIsScanning(false);
  };

  const sendToBackend = async (data: StudentData) => {
    try {
      await supabase
        .from('checkpoint_logs')
        .insert({
          device_id: deviceId,
          student_id: data.id,
          student_name: `${data.firstName} ${data.lastName}`,
          nfc_id: data.nfcId,
          timestamp: new Date().toISOString(),
          type: data.action === 'check_in' ? 'entry' : 'exit',
          location: location,
          synced: true
        });
    } catch (error) {
      console.error('Error sending to backend:', error);
      throw error;
    }
  };

  const storeOffline = async (data: StudentData) => {
    try {
      await supabase
        .from('offline_scans')
        .insert({
          device_id: deviceId,
          scan_data: data as any,
          timestamp: new Date().toISOString(),
          synced: false
        });
      
      toast({
        title: language === 'en' ? "Stored Offline" : "حفظ محلياً",
        description: language === 'en' ? "Data will sync when connection is restored" : "سيتم مزامنة البيانات عند استعادة الاتصال",
      });
    } catch (error) {
      console.error('Error storing offline data:', error);
    }
  };

  // Native NFC handler (for real devices)
  useEffect(() => {
    if ('NDEFReader' in window) {
      const reader = new (window as any).NDEFReader();
      
      const startNFC = async () => {
        try {
          await reader.scan();
          reader.addEventListener("reading", ({ message }: any) => {
            // Extract NFC ID from the message
            const decoder = new TextDecoder();
            for (const record of message.records) {
              if (record.recordType === "text") {
                const nfcId = decoder.decode(record.data);
                handleNFCScan(nfcId);
              }
            }
          });
        } catch (error) {
          console.log("NFC not available on this device");
        }
      };
      
      startNFC();
      
      return () => {
        reader.removeEventListener("reading", () => {});
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex flex-col">
      {/* Header */}
      <div className="bg-background border-b p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <School className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">
                {deviceType === 'entrance' ? (language === 'en' ? 'School Entrance' : 'مدخل المدرسة') : (language === 'en' ? 'Bus Scanner' : 'ماسح الحافلة')}
              </h1>
              <p className="text-sm text-muted-foreground">{location}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold">
                {currentTime.toLocaleTimeString(language === 'en' ? 'en-US' : 'ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentTime.toLocaleDateString(language === 'en' ? 'en-US' : 'ar-SA', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
            
            <Badge variant={isOnline ? "default" : "destructive"} className="gap-1">
              {isOnline ? <WifiIcon className="h-3 w-3" /> : <WifiOffIcon className="h-3 w-3" />}
              {isOnline ? (language === 'en' ? 'Online' : 'متصل') : (language === 'en' ? 'Offline' : 'غير متصل')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Scanner Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-8">
              {/* NFC Animation */}
              <div className="relative mx-auto w-64 h-64">
                <div className={`absolute inset-0 rounded-full bg-primary/10 ${isScanning ? 'animate-ping' : ''}`} />
                <div className={`absolute inset-4 rounded-full bg-primary/20 ${isScanning ? 'animate-ping animation-delay-200' : ''}`} />
                <div className={`absolute inset-8 rounded-full bg-primary/30 ${isScanning ? 'animate-ping animation-delay-400' : ''}`} />
                <div className="absolute inset-12 rounded-full bg-background flex items-center justify-center">
                  <CreditCard className={`h-24 w-24 ${isScanning ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                </div>
              </div>

              {/* Status Text */}
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {isScanning ? (language === 'en' ? 'Scanning...' : 'جاري المسح...') : (language === 'en' ? 'Ready to Scan' : 'جاهز للمسح')}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {language === 'en' ? 'Place student NFC card near the reader' : 'ضع بطاقة الطالب بالقرب من القارئ'}
                </p>
              </div>

              {/* Test Button */}
              <Button 
                size="lg"
                onClick={() => handleNFCScan()} 
                disabled={isScanning}
                className="w-full max-w-xs mx-auto"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                {language === 'en' ? 'Test NFC Scan' : 'اختبار مسح NFC'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Stats */}
      <div className="bg-background border-t p-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{todayCount.checkIn}</p>
                <p className="text-sm text-muted-foreground">{language === 'en' ? 'Checked In Today' : 'تم تسجيل الدخول اليوم'}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <XCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{todayCount.checkOut}</p>
                <p className="text-sm text-muted-foreground">{language === 'en' ? 'Checked Out Today' : 'تم تسجيل الخروج اليوم'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Student Popup Modal */}
      <Dialog open={showStudentModal} onOpenChange={setShowStudentModal}>
        <DialogContent className="max-w-md">
          {currentStudent && (
            <div className="text-center space-y-6 py-6">
              {/* Success Icon */}
              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                {currentStudent.action === 'check_in' ? (
                  <CheckCircle className="h-12 w-12 text-green-600" />
                ) : (
                  <XCircle className="h-12 w-12 text-orange-600" />
                )}
              </div>

              {/* Student Photo */}
              <Avatar className="w-32 h-32 mx-auto">
                <AvatarImage src={currentStudent.profileImage} />
                <AvatarFallback className="text-2xl">
                  {currentStudent.firstName[0]}{currentStudent.lastName[0]}
                </AvatarFallback>
              </Avatar>

              {/* Student Info */}
              <div>
                <h3 className="text-2xl font-bold">
                  {currentStudent.firstName} {currentStudent.lastName}
                </h3>
                <p className="text-lg text-muted-foreground mt-1">
                  {currentStudent.firstNameAr} {currentStudent.lastNameAr}
                </p>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <Badge variant="secondary">{language === 'en' ? 'Grade' : 'الصف'} {currentStudent.grade}</Badge>
                  <Badge variant="secondary">{language === 'en' ? 'Class' : 'الفصل'} {currentStudent.class}</Badge>
                </div>
              </div>

              {/* Action Status */}
              <div className={`text-xl font-semibold ${
                currentStudent.action === 'check_in' ? 'text-green-600' : 'text-orange-600'
              }`}>
                {currentStudent.action === 'check_in' ? '✓ Checked In' : '✓ Checked Out'}
              </div>

              {/* Time */}
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit' 
                })}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}