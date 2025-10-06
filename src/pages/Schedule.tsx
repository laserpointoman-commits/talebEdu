import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Users, BookOpen, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function Schedule() {
  const { user } = useAuth();
  const { t, language, dir } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const todaySchedule = [
    { 
      time: '08:00 - 08:45', 
      subject: t('schedule.mathematics'), 
      teacher: language === 'en' ? 'Ahmed Hassan' : 'أحمد حسن', 
      room: `${t('schedule.room')} 201`, 
      class: '10-A' 
    },
    { 
      time: '08:45 - 09:30', 
      subject: t('schedule.physics'), 
      teacher: language === 'en' ? 'Ahmed Hassan' : 'أحمد حسن', 
      room: `${t('schedule.lab')} 1`, 
      class: '10-A' 
    },
    { 
      time: '09:45 - 10:30', 
      subject: t('schedule.english'), 
      teacher: language === 'en' ? 'Fatima Al-Said' : 'فاطمة السعيد', 
      room: `${t('schedule.room')} 201`, 
      class: '10-A' 
    },
    { 
      time: '10:30 - 11:15', 
      subject: t('schedule.arabic'), 
      teacher: language === 'en' ? 'Mohammed Al-Rashdi' : 'محمد الراشدي', 
      room: `${t('schedule.room')} 201`, 
      class: '10-A' 
    },
    { 
      time: '11:30 - 12:15', 
      subject: t('schedule.chemistry'), 
      teacher: language === 'en' ? 'Ahmed Hassan' : 'أحمد حسن', 
      room: `${t('schedule.lab')} 2`, 
      class: '10-A' 
    },
    { 
      time: '12:15 - 13:00', 
      subject: t('schedule.break'), 
      teacher: '-', 
      room: t('schedule.cafeteria'), 
      class: '-' 
    },
    { 
      time: '13:00 - 13:45', 
      subject: t('schedule.history'), 
      teacher: language === 'en' ? 'Sara Ibrahim' : 'سارة إبراهيم', 
      room: `${t('schedule.room')} 105`, 
      class: '10-A' 
    },
    { 
      time: '13:45 - 14:30', 
      subject: t('schedule.pe'), 
      teacher: language === 'en' ? 'Ali Mohammed' : 'علي محمد', 
      room: t('schedule.sportsHall'), 
      class: '10-A' 
    },
  ];

  const downloadClassSchedule = () => {
    // Create CSV content
    const headers = language === 'en' 
      ? ['Time', 'Subject', 'Teacher', 'Room', 'Class']
      : ['الوقت', 'المادة', 'المدرس', 'القاعة', 'الصف'];
    
    const csvContent = [
      headers.join(','),
      ...todaySchedule.map(item => 
        [item.time, item.subject, item.teacher, item.room, item.class].join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `class_schedule_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success(language === 'en' ? 'Class schedule downloaded successfully' : 'تم تنزيل جدول الحصص بنجاح');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.schedule')}</h2>
          <p className="text-muted-foreground">
            {t('schedule.manageSchedules')}
          </p>
        </div>
        <Button onClick={downloadClassSchedule} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t('schedule.downloadSchedule')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('schedule.todaySchedule')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" dir={dir}>
              {todaySchedule.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`flex items-center gap-4 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                    <div className="flex flex-col items-center">
                      <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                      <span className="text-xs font-medium">{item.time.split(' - ')[0]}</span>
                      <span className="text-xs text-muted-foreground">{item.time.split(' - ')[1]}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.subject}</p>
                      {item.teacher !== '-' && (
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {item.teacher}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.room}
                          </span>
                          {user?.role === 'teacher' && item.class !== '-' && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {item.class}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                   {item.subject === t('schedule.break') ? (
                     <Badge className="bg-info/10 text-info">{t('schedule.break')}</Badge>
                  ) : (
                    <Badge variant="outline">{item.subject}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('common.calendar')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">
                {t('schedule.scheduleSummary')}
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('schedule.classes')}</span>
                  <span className="font-medium">7</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('schedule.break')}</span>
                  <span className="font-medium">45 {t('time.min')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('schedule.totalHours')}</span>
                  <span className="font-medium">6.5 {t('time.hrs')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}