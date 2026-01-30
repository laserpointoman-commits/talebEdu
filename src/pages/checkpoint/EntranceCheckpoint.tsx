import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Wifi, 
  WifiOff, 
  Shield, 
  CheckCircle, 
  XCircle,
  Clock,
  Users,
  LogIn,
  LogOut,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CheckpointConfig {
  location: string;
  deviceId: string;
  mode: 'entrance' | 'exit' | 'both';
}

interface StudentRecord {
  id: string;
  nfcId: string;
  name: string;
  grade: string;
  class: string;
  photo?: string;
  parentPhone?: string;
}

interface CheckpointLog {
  studentId: string;
  studentName: string;
  action: 'check-in' | 'check-out';
  timestamp: Date;
  location: string;
}

export default function EntranceCheckpoint() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isScanning, setIsScanning] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<StudentRecord | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [logs, setLogs] = useState<CheckpointLog[]>([]);
  const [todayStats, setTodayStats] = useState({ checkIns: 0, checkOuts: 0 });
  const [config, setConfig] = useState<CheckpointConfig>({
    location: 'Main Entrance',
    deviceId: `CP-${Date.now()}`,
    mode: 'both'
  });
  const [showSettings, setShowSettings] = useState(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load configuration and logs from database
  useEffect(() => {
    loadDeviceConfig();
    loadCheckpointLogs();
  }, []);

  const loadDeviceConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('device_configs')
        .select('*')
        .eq('device_id', config.deviceId)
        .single();

      if (data) {
        setConfig({
          location: data.location,
          deviceId: data.device_id,
          mode: data.mode as 'entrance' | 'exit' | 'both'
        });
      }
    } catch (error) {
      console.error('Error loading device config:', error);
    }
  };

  const loadCheckpointLogs = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('checkpoint_logs')
        .select('*')
        .eq('device_id', config.deviceId)
        .gte('timestamp', today.toISOString())
        .order('timestamp', { ascending: false });

      if (data) {
        const mappedLogs = data.map(log => ({
          studentId: log.student_id,
          studentName: log.student_name,
          action: log.type as 'check-in' | 'check-out',
          timestamp: new Date(log.timestamp),
          location: log.location
        }));
        setLogs(mappedLogs);
        updateStats(mappedLogs);
      }
    } catch (error) {
      console.error('Error loading checkpoint logs:', error);
    }
  };

  const updateStats = (logsList: CheckpointLog[]) => {
    const today = new Date().toDateString();
    const todayLogs = logsList.filter(
      log => new Date(log.timestamp).toDateString() === today
    );
    
    const checkIns = todayLogs.filter(log => log.action === 'check-in').length;
    const checkOuts = todayLogs.filter(log => log.action === 'check-out').length;
    
    setTodayStats({ checkIns, checkOuts });
  };

  const simulateNFCScan = async (nfcId: string) => {
    setIsScanning(true);
    
    try {
      // Look up student in database by NFC ID
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('nfc_id', nfcId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (student) {
        const studentRecord: StudentRecord = {
          id: student.id,
          nfcId: student.nfc_id,
          name: student.first_name_ar && student.last_name_ar 
            ? `${student.first_name_ar} ${student.last_name_ar}`
            : `${student.first_name} ${student.last_name}`,
          grade: student.grade || '',
          class: student.class || '',
          photo: student.profile_image,
          parentPhone: student.parent_phone
        };
        setCurrentStudent(studentRecord);
        processCheckpoint(studentRecord);
      } else {
        toast({
          title: "Unknown Card",
          description: "This NFC card is not registered",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error looking up student:', error);
      toast({
        title: "Error",
        description: "Failed to look up student",
        variant: "destructive"
      });
    }
    
    setIsScanning(false);
  };

  const processCheckpoint = async (student: StudentRecord) => {
    const lastLog = logs.find(log => log.studentId === student.id);
    const action: 'check-in' | 'check-out' = 
      (!lastLog || lastLog.action === 'check-out') ? 'check-in' : 'check-out';
    
    const newLog: CheckpointLog = {
      studentId: student.id,
      studentName: student.name,
      action,
      timestamp: new Date(),
      location: config.location
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    updateStats(updatedLogs);
    
    // Save to database
    try {
      const { error } = await supabase
        .from('checkpoint_logs')
        .insert({
          device_id: config.deviceId,
          student_id: student.id,
          student_name: student.name,
          nfc_id: student.nfcId,
          timestamp: newLog.timestamp.toISOString(),
          type: action === 'check-in' ? 'entry' : 'exit',
          location: config.location,
          synced: isOnline
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving checkpoint log:', error);
      // Queue for sync if offline
      if (!isOnline) {
        await queueForSync(newLog);
      }
    }
    
    setShowStudentModal(true);
    
    // Auto-close modal after 3 seconds
    setTimeout(() => {
      setShowStudentModal(false);
      setCurrentStudent(null);
    }, 3000);
    
    // Show notification
    toast({
      title: action === 'check-in' ? 'Student Checked In' : 'Student Checked Out',
      description: `${student.name} - ${new Date().toLocaleTimeString()}`
    });
  };

  const syncWithBackend = async (log: CheckpointLog) => {
    try {
      const { error } = await supabase
        .from('checkpoint_logs')
        .update({ synced: true })
        .eq('device_id', config.deviceId)
        .eq('student_id', log.studentId)
        .eq('timestamp', log.timestamp.toISOString());

      if (error) throw error;
    } catch (error) {
      console.error('Error syncing with backend:', error);
    }
  };

  const queueForSync = async (log: CheckpointLog) => {
    try {
      const { error } = await supabase
        .from('offline_scans')
        .insert({
          device_id: config.deviceId,
          scan_data: log as any,
          timestamp: log.timestamp.toISOString(),
          synced: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error queuing for sync:', error);
    }
  };

  const saveConfig = async () => {
    try {
      const { error } = await supabase
        .from('device_configs')
        .upsert({
          device_id: config.deviceId,
          device_type: 'checkpoint',
          location: config.location,
          mode: config.mode,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'device_id'
        });

      if (error) throw error;

      setShowSettings(false);
      toast({
        title: "Settings Saved",
        description: "Checkpoint configuration updated"
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-[100dvh] overflow-y-auto overscroll-none bg-gradient-to-br from-primary/5 to-secondary/5 p-4" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Header */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Entrance Checkpoint</h1>
                <p className="text-muted-foreground">{config.location} • {config.deviceId}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={isOnline ? "default" : "destructive"}>
                {isOnline ? (
                  <><Wifi className="h-3 w-3 mr-1" /> Online</>
                ) : (
                  <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
                )}
              </Badge>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Scanner Area */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-8">
            <div className="text-center space-y-6">
              <div className="relative mx-auto w-48 h-48">
                <div className={`absolute inset-0 rounded-full ${
                  isScanning ? 'animate-pulse bg-primary/20' : 'bg-muted'
                }`} />
                <div className="absolute inset-4 rounded-full bg-background flex items-center justify-center">
                  <Shield className={`h-16 w-16 ${
                    isScanning ? 'text-primary animate-bounce' : 'text-muted-foreground'
                  }`} />
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {isScanning ? 'Scanning...' : 'Ready to Scan'}
                </h2>
                <p className="text-muted-foreground">
                  Place the student NFC card near the reader
                </p>
              </div>

              {/* Test buttons */}
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => simulateNFCScan('NFC001')}
                  disabled={isScanning}
                >
                  Test Student 1
                </Button>
                <Button 
                  onClick={() => simulateNFCScan('NFC002')}
                  disabled={isScanning}
                  variant="outline"
                >
                  Test Student 2
                </Button>
              </div>
            </div>
          </Card>

          {/* Today's Stats */}
          <Card className="mt-6 p-6">
            <h3 className="text-lg font-semibold mb-4">Today's Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <LogIn className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{todayStats.checkIns}</p>
                  <p className="text-sm text-muted-foreground">Check-ins</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <LogOut className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{todayStats.checkOuts}</p>
                  <p className="text-sm text-muted-foreground">Check-outs</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {logs.slice(0, 10).map((log, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {log.action === 'check-in' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{log.studentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <Badge variant={log.action === 'check-in' ? 'default' : 'secondary'}>
                  {log.action === 'check-in' ? 'IN' : 'OUT'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Student Modal */}
      <Dialog open={showStudentModal} onOpenChange={setShowStudentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {currentStudent && logs[0]?.action === 'check-in' ? 
                '✅ Student Checked In' : 
                '👋 Student Checked Out'
              }
            </DialogTitle>
          </DialogHeader>
          {currentStudent && (
            <div className="text-center space-y-4">
              <img 
                src={currentStudent.photo} 
                alt={currentStudent.name}
                className="w-32 h-32 rounded-full mx-auto"
              />
              <div>
                <h3 className="text-xl font-bold">{currentStudent.name}</h3>
                <p className="text-muted-foreground">
                  Grade {currentStudent.grade} - Class {currentStudent.class}
                </p>
                <p className="text-lg mt-2">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkpoint Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Location Name</label>
              <input
                type="text"
                value={config.location}
                onChange={(e) => setConfig({...config, location: e.target.value})}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Device ID</label>
              <input
                type="text"
                value={config.deviceId}
                onChange={(e) => setConfig({...config, deviceId: e.target.value})}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mode</label>
              <select
                value={config.mode}
                onChange={(e) => setConfig({...config, mode: e.target.value as any})}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="both">Entrance & Exit</option>
                <option value="entrance">Entrance Only</option>
                <option value="exit">Exit Only</option>
              </select>
            </div>
            <Button onClick={saveConfig} className="w-full">
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}