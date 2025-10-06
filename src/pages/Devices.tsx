import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { School, Bus, Shield, ArrowLeft } from 'lucide-react';

export default function Devices() {
  const navigate = useNavigate();

  const devices = [
    {
      id: 'school-entrance',
      title: 'School Entrance Device',
      description: 'NFC check-in/out system for school entrance. Tracks attendance and processes daily allowances.',
      icon: School,
      route: '/dashboard/devices/school-entrance',
      color: 'from-primary/10 to-secondary/10'
    },
    {
      id: 'bus-device',
      title: 'Bus Tracking Device',
      description: 'NFC system for buses to track student boarding and exit at different stops.',
      icon: Bus,
      route: '/dashboard/devices/bus',
      color: 'from-blue-500/10 to-cyan-500/10'
    },
    {
      id: 'admin',
      title: 'Device Management',
      description: 'Admin panel to manage all devices, view logs, and configure settings.',
      icon: Shield,
      route: '/dashboard',
      color: 'from-purple-500/10 to-pink-500/10'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Device Selection</h1>
          <p className="text-muted-foreground">
            Choose a device interface to access NFC attendance and tracking systems
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => {
            const Icon = device.icon;
            return (
              <Card 
                key={device.id}
                className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(device.route)}
              >
                <CardHeader>
                  <div className={`w-full h-32 rounded-lg bg-gradient-to-br ${device.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                    <Icon className="h-16 w-16 text-foreground/60" />
                  </div>
                  <CardTitle>{device.title}</CardTitle>
                  <CardDescription>{device.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Access Device
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="text-orange-700 dark:text-orange-400">
              ℹ️ How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>School Entrance Device:</strong> Students tap their NFC cards when entering or leaving school. 
              The system automatically records attendance, processes daily allowances on check-in, and sends notifications to parents.
            </p>
            <p>
              <strong>Bus Device:</strong> Installed on school buses to track when students board or exit at various stops. 
              Parents receive real-time notifications about their child's bus location and status.
            </p>
            <p>
              <strong>Integration:</strong> All devices sync with the main system in real-time, updating student records, 
              wallet balances, and sending notifications through the Supabase backend.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}