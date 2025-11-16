import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Play, 
  MapPin, 
  Bus, 
  LogIn, 
  LogOut, 
  Bell,
  RefreshCw,
  Trash2,
  Activity
} from "lucide-react";

export default function DeviceTesting() {
  const { language } = useLanguage();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [activities, setActivities] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    subscribeToChanges();
  }, []);

  const loadData = async () => {
    // Load students
    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .not('nfc_id', 'is', null)
      .limit(50);
    setStudents(studentsData || []);

    // Load recent activities
    loadActivities();

    // Load buses
    const { data: busesData } = await supabase
      .from('buses')
      .select('*');
    setBuses(busesData || []);

    // Load recent notifications
    const { data: notificationsData } = await supabase
      .from('notification_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(notificationsData || []);
  };

  const loadActivities = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('*, students(first_name, last_name)')
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: busLogs } = await supabase
      .from('bus_boarding_logs')
      .select('*, students(first_name, last_name)')
      .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    const combined = [
      ...(attendance || []).map(a => ({
        id: a.id,
        type: 'attendance',
        student: `${(a.students as any)?.first_name} ${(a.students as any)?.last_name}`,
        action: a.type,
        location: a.location,
        timestamp: a.created_at
      })),
      ...(busLogs || []).map(b => ({
        id: b.id,
        type: 'bus',
        student: `${(b.students as any)?.first_name} ${(b.students as any)?.last_name}`,
        action: b.action,
        location: b.location,
        timestamp: b.created_at
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setActivities(combined.slice(0, 30));
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('admin-testing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => {
        loadActivities();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bus_boarding_logs' }, () => {
        loadActivities();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notification_history' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const simulateAction = async (action: string) => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    setLoading(true);
    try {
      const student = students.find(s => s.id === selectedStudent);
      if (!student || !student.nfc_id) {
        toast.error('Student NFC ID not found');
        return;
      }

      switch (action) {
        case 'check_in':
          await supabase.functions.invoke('record-attendance', {
            body: {
              studentNfcId: student.nfc_id,
              deviceId: 'TEST-DEVICE-001',
              location: 'Main Entrance',
              action: 'check_in'
            }
          });
          await supabase.functions.invoke('process-daily-allowance', {
            body: { studentId: student.id }
          });
          break;

        case 'check_out':
          await supabase.functions.invoke('record-attendance', {
            body: {
              studentNfcId: student.nfc_id,
              deviceId: 'TEST-DEVICE-001',
              location: 'Main Entrance',
              action: 'check_out'
            }
          });
          break;

        case 'bus_board':
          await supabase.functions.invoke('record-bus-activity', {
            body: {
              studentId: student.id,
              busId: 'BUS-001',
              action: 'board',
              location: 'Bus Stop A',
              latitude: 23.5880,
              longitude: 58.3829
            }
          });
          break;

        case 'bus_exit':
          await supabase.functions.invoke('record-bus-activity', {
            body: {
              studentId: student.id,
              busId: 'BUS-001',
              action: 'exit',
              location: 'School',
              latitude: 23.5900,
              longitude: 58.3850
            }
          });
          break;
      }

      await supabase.functions.invoke('send-parent-notification', {
        body: {
          parentId: student.parent_id,
          studentId: student.id,
          type: action.includes('bus') ? 'child_bus_location' : 'child_attendance',
          title: `Test: ${action.replace('_', ' ')}`,
          message: `Simulated ${action} for ${student.first_name} ${student.last_name}`,
          data: { action, timestamp: new Date().toISOString() }
        }
      });

      toast.success(`${action} simulated successfully`);
      loadActivities();
    } catch (error: any) {
      console.error('Simulation error:', error);
      toast.error(error.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const simulateFullDay = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    setLoading(true);
    const actions = ['bus_board', 'bus_exit', 'check_in', 'check_out', 'bus_board', 'bus_exit'];
    
    for (const action of actions) {
      await simulateAction(action);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setLoading(false);
    toast.success('Full day simulation completed');
  };

  const resetStudentDay = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await supabase
        .from('attendance_records')
        .delete()
        .eq('student_id', selectedStudent)
        .eq('date', today);

      await supabase
        .from('bus_boarding_logs')
        .delete()
        .eq('student_id', selectedStudent)
        .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());

      toast.success('Student day reset successfully');
      loadActivities();
    } catch (error: any) {
      toast.error(error.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'ar' ? 'اختبار الأجهزة' : 'Device Testing'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'اختبار وظائف الأجهزة والإشعارات' : 'Test device functionality and notifications'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'اختيار الطالب' : 'Select Student'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder={language === 'ar' ? 'اختر طالباً' : 'Select a student'} />
            </SelectTrigger>
            <SelectContent>
              {students.map(student => (
                <SelectItem key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} ({student.nfc_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button onClick={() => simulateAction('check_in')} disabled={loading} variant="outline">
              <LogIn className="w-4 h-4 mr-2" />
              Check In
            </Button>
            <Button onClick={() => simulateAction('check_out')} disabled={loading} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Check Out
            </Button>
            <Button onClick={() => simulateAction('bus_board')} disabled={loading} variant="outline">
              <Bus className="w-4 h-4 mr-2" />
              Bus Board
            </Button>
            <Button onClick={() => simulateAction('bus_exit')} disabled={loading} variant="outline">
              <Bus className="w-4 h-4 mr-2" />
              Bus Exit
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={simulateFullDay} disabled={loading} className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              Simulate Full Day
            </Button>
            <Button onClick={resetStudentDay} disabled={loading} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Reset Day
            </Button>
            <Button onClick={loadActivities} disabled={loading} variant="outline">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="activities" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activities">
            <Activity className="w-4 h-4 mr-2" />
            Activities
          </TabsTrigger>
          <TabsTrigger value="buses">
            <Bus className="w-4 h-4 mr-2" />
            Buses
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {activity.type === 'attendance' ? (
                          activity.action === 'check_in' ? <LogIn className="w-4 h-4 text-green-500" /> : <LogOut className="w-4 h-4 text-orange-500" />
                        ) : (
                          <Bus className="w-4 h-4 text-blue-500" />
                        )}
                        <div>
                          <p className="font-medium">{activity.student}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.action} - {activity.location}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buses">
          <Card>
            <CardHeader>
              <CardTitle>Active Buses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {buses.map(bus => (
                  <div key={bus.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{bus.bus_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          Capacity: {bus.capacity} | Status: {bus.status}
                        </p>
                      </div>
                      <Badge>{bus.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {notifications.map(notif => (
                    <div key={notif.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{notif.title}</p>
                          <p className="text-sm text-muted-foreground">{notif.message}</p>
                          <Badge variant="outline" className="mt-1">{notif.notification_type}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notif.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
