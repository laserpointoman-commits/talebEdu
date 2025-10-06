import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Nfc, MapPin, Phone, User, Home, FileText, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface StudentInfo {
  id: string;
  name: string;
  nameAr: string;
  class: string;
  parentName: string;
  parentPhone: string;
  homeLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  notes: string;
  profileImage: string;
}

const mockStudent: StudentInfo = {
  id: '1',
  name: 'Sara Ahmed',
  nameAr: 'سارة أحمد',
  class: '10-A',
  parentName: 'Mohammed Ali',
  parentPhone: '+968 9234 5678',
  homeLocation: {
    lat: 23.5880,
    lng: 58.3829,
    address: 'Al Khuwair, Building 45, Flat 12, Muscat',
  },
  notes: 'Allergic to peanuts. Requires special attention during sports activities.',
  profileImage: undefined,
};

interface NfcReaderProps {
  showFullProfile?: boolean;
  driverMode?: boolean;
}

export default function NfcReader({ showFullProfile = true, driverMode = false }: NfcReaderProps) {
  const { language } = useLanguage();
  const [isReading, setIsReading] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);

  const handleNfcRead = () => {
    setIsReading(true);
    setStudentInfo(null);
    
    // Simulate NFC reading
    setTimeout(() => {
      setStudentInfo(mockStudent);
      setIsReading(false);
      toast({
        title: language === 'en' ? 'NFC Read Successful' : 'تمت قراءة NFC بنجاح',
        description: `${language === 'en' ? 'Found student:' : 'تم العثور على الطالب:'} ${mockStudent.name}`,
      });
    }, 2000);
  };

  const openInGoogleMaps = () => {
    const { lat, lng } = mockStudent.homeLocation;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <Button onClick={handleNfcRead} variant="outline">
        <Nfc className="h-4 w-4 mr-2" />
        {language === 'en' ? 'Read NFC' : 'قراءة NFC'}
      </Button>

      {/* NFC Reading Dialog */}
      <Dialog open={isReading} onOpenChange={setIsReading}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Reading NFC Card...' : 'قراءة بطاقة NFC...'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <Nfc className="h-16 w-16 text-primary animate-pulse" />
            <p className="mt-4 text-muted-foreground">
              {language === 'en' ? 'Please tap the NFC card' : 'يرجى تقريب بطاقة NFC'}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Info Dialog */}
      {studentInfo && (
        <Dialog open={!!studentInfo} onOpenChange={() => setStudentInfo(null)}>
          <DialogContent className={driverMode ? "max-w-md" : "max-w-2xl"}>
            <DialogHeader>
              <DialogTitle>
                {driverMode 
                  ? (language === 'en' ? 'Student Information' : 'معلومات الطالب')
                  : (language === 'en' ? 'Student Profile' : 'ملف الطالب')
                }
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="flex items-center gap-4">
                {!driverMode && (
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={studentInfo.profileImage} />
                    <AvatarFallback>{studentInfo.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <h3 className="text-xl font-bold">
                    {language === 'en' ? studentInfo.name : studentInfo.nameAr}
                  </h3>
                  {!driverMode && (
                    <p className="text-sm text-muted-foreground">{language === 'en' ? 'Class' : 'الفصل'}: {studentInfo.class}</p>
                  )}
                </div>
              </div>

              {/* Driver Mode - Essential Info Only */}
              {driverMode && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Phone className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Parent Contact' : 'اتصال ولي الأمر'}
                      </p>
                      <p className="font-medium">{studentInfo.parentPhone}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`tel:${studentInfo.parentPhone}`, '_self')}
                    >
                      {language === 'en' ? 'Call' : 'اتصال'}
                    </Button>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-primary" />
                        <p className="text-sm font-medium">
                          {language === 'en' ? 'Home Location' : 'موقع المنزل'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={openInGoogleMaps}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {language === 'en' ? 'Open in Maps' : 'فتح في الخرائط'}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{studentInfo.homeLocation.address}</p>
                  </div>

                  {studentInfo.notes && (
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-warning" />
                        <p className="text-sm font-medium text-warning">
                          {language === 'en' ? 'Important Notes' : 'ملاحظات مهمة'}
                        </p>
                      </div>
                      <p className="text-sm">{studentInfo.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Full Profile Mode */}
              {!driverMode && showFullProfile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {language === 'en' ? 'Contact Information' : 'معلومات الاتصال'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">{language === 'ar' ? 'اسم ولي الأمر' : 'Parent Name'}</Label>
                        <p className="font-medium">{studentInfo.parentName}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{language === 'ar' ? 'هاتف ولي الأمر' : 'Parent Phone'}</Label>
                        <p className="font-medium">{studentInfo.parentPhone}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">{language === 'ar' ? 'عنوان المنزل' : 'Home Address'}</Label>
                        <p className="font-medium">{studentInfo.homeLocation.address}</p>
                        <Button
                          size="sm"
                          variant="link"
                          className="p-0 h-auto mt-1"
                          onClick={openInGoogleMaps}
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          {language === 'en' ? 'View on Map' : 'عرض على الخريطة'}
                        </Button>
                      </div>
                      {studentInfo.notes && (
                        <div className="col-span-2">
                          <Label className="text-muted-foreground">{language === 'en' ? 'Notes' : 'ملاحظات'}</Label>
                          <p className="font-medium">{studentInfo.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}