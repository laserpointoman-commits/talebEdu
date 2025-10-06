import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bus, MapPin, Phone, Users, Clock, Edit, Activity, UserPlus, Car, Route, Settings } from 'lucide-react';
import { toast } from 'sonner';
import AddDriverForm from '@/components/forms/AddDriverForm';
import { supabase } from '@/integrations/supabase/client';
import LogoLoader from '@/components/LogoLoader';
import { formatDistanceToNow } from 'date-fns';

interface BusInfo {
  id: string;
  busNumber: string;
  driverName: string;
  driverNameAr: string;
  driverPhone: string;
  driverImage: string;
  capacity: number;
  currentStudents: number;
  route: string;
  routeName: string;
  status: 'active' | 'inactive' | 'maintenance';
  lastLocation: string;
  lastUpdate: string;
}

export default function Transport() {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [buses, setBuses] = useState<BusInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState<BusInfo | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDriverDialogOpen, setIsAddDriverDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<BusInfo | null>(null);

  useEffect(() => {
    loadBuses();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('buses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'buses'
        },
        () => {
          loadBuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadBuses = async () => {
    try {
      // Get buses with driver info
      const { data: busesData, error: busesError } = await supabase
        .from('buses')
        .select(`
          *,
          drivers!inner(
            profile_id,
            profiles!inner(full_name, full_name_ar, phone, avatar_url)
          )
        `)
        .order('bus_number');

      if (busesError) throw busesError;

      // For each bus, get student count and latest location
      const busesWithData = await Promise.all(
        (busesData || []).map(async (bus) => {
          // Get student count
          const { count } = await supabase
            .from('student_bus_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('bus_id', bus.id)
            .eq('is_active', true);

          // Get latest location
          const { data: location } = await supabase
            .from('bus_locations')
            .select('*')
            .eq('bus_id', bus.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get route info
          const { data: route } = await supabase
            .from('bus_routes')
            .select('route_name, route_name_ar')
            .eq('bus_id', bus.id)
            .eq('is_active', true)
            .maybeSingle();

          const driver = bus.drivers?.profiles;

          return {
            id: bus.id,
            busNumber: bus.bus_number,
            driverName: driver?.full_name || 'No Driver',
            driverNameAr: driver?.full_name_ar || driver?.full_name || 'لا يوجد سائق',
            driverPhone: driver?.phone || 'N/A',
            driverImage: driver?.avatar_url || '',
            capacity: bus.capacity || 0,
            currentStudents: count || 0,
            route: route?.route_name || 'No Route',
            routeName: language === 'ar' ? (route?.route_name_ar || route?.route_name || 'لا يوجد مسار') : (route?.route_name || 'No Route'),
            status: bus.status || 'active',
            lastLocation: location?.current_stop || 'Unknown',
            lastUpdate: location?.timestamp 
              ? formatDistanceToNow(new Date(location.timestamp), { addSuffix: true })
              : 'No data'
          } as BusInfo;
        })
      );

      setBuses(busesWithData);
    } catch (error) {
      console.error('Error loading buses:', error);
      toast.error(language === 'ar' ? 'فشل تحميل الحافلات' : 'Failed to load buses');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bus: BusInfo) => {
    setEditForm(bus);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    
    try {
      const { error } = await supabase
        .from('buses')
        .update({
          bus_number: editForm.busNumber,
          capacity: editForm.capacity,
          status: editForm.status
        })
        .eq('id', editForm.id);

      if (error) throw error;

      toast.success(language === 'ar' ? 'تم تحديث معلومات الحافلة بنجاح' : 'Bus information updated successfully');
      setIsEditDialogOpen(false);
      loadBuses();
    } catch (error) {
      console.error('Error updating bus:', error);
      toast.error(language === 'ar' ? 'فشل تحديث الحافلة' : 'Failed to update bus');
    }
  };

  const handleCreateDriverEmail = () => {
    toast.success(language === 'ar' ? 'تم إنشاء حساب البريد الإلكتروني' : 'Email Account Created');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      case 'maintenance':
        return 'bg-warning/10 text-warning';
      default:
        return '';
    }
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  const activeBuses = buses.filter(bus => bus.status === 'active');
  const totalCapacity = buses.reduce((sum, bus) => sum + bus.capacity, 0);
  const totalStudents = buses.reduce((sum, bus) => sum + bus.currentStudents, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.transport')}</h2>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Manage school transportation and buses' : 'إدارة النقل المدرسي والحافلات'}
          </p>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'developer') && (
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => navigate('/dashboard/admin/drivers')}>
              <UserPlus className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Manage Drivers' : 'إدارة السائقين'}
            </Button>
            <Button onClick={() => navigate('/dashboard/admin/buses')}>
              <Bus className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Manage Buses' : 'إدارة الحافلات'}
            </Button>
            <Button onClick={() => navigate('/dashboard/admin/routes')}>
              <Route className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Manage Routes' : 'إدارة المسارات'}
            </Button>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Total Buses' : 'إجمالي الحافلات'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Active Buses' : 'الحافلات النشطة'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{activeBuses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Total Capacity' : 'السعة الإجمالية'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Current Students' : 'الطلاب الحاليون'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bus List */}
      {buses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {language === 'ar' ? 'لا توجد حافلات' : 'No buses available'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {buses.map((bus) => (
          <Card key={bus.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bus className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{bus.busNumber}</CardTitle>
                  {bus.status === 'active' && (
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  )}
                </div>
                <Badge className={getStatusColor(bus.status)}>
                  {bus.status === 'active' && <Activity className="h-3 w-3 mr-1" />}
                  {bus.status === 'active' ? (language === 'ar' ? 'نشط' : 'active') :
                   bus.status === 'inactive' ? (language === 'ar' ? 'غير نشط' : 'inactive') :
                   (language === 'ar' ? 'صيانة' : 'maintenance')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={bus.driverImage} />
                  <AvatarFallback>{bus.driverName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {language === 'en' ? bus.driverName : bus.driverNameAr}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {bus.driverPhone}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {language === 'en' ? 'Students' : 'الطلاب'}
                  </span>
                  <span className="font-medium">
                    {bus.currentStudents}/{bus.capacity}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {language === 'en' ? 'Last Location' : 'آخر موقع'}
                  </span>
                  <span className="font-medium text-xs">{bus.lastLocation}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {language === 'en' ? 'Updated' : 'تحديث'}
                  </span>
                  <span className="text-xs">{bus.lastUpdate}</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  {language === 'en' ? 'Route' : 'المسار'}
                </p>
                <p className="text-sm font-medium">{bus.routeName}</p>
              </div>

              {(profile?.role === 'admin' || profile?.role === 'developer') && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEdit(bus)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    {language === 'en' ? 'Edit' : 'تعديل'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={handleCreateDriverEmail}
                  >
                    {language === 'en' ? 'Create Email' : 'إنشاء بريد'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Edit Bus Information' : 'تعديل معلومات الحافلة'}
            </DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="busNumber">{language === 'ar' ? 'رقم الحافلة' : 'Bus Number'}</Label>
                <Input
                  id="busNumber"
                  value={editForm.busNumber}
                  onChange={(e) => setEditForm({ ...editForm, busNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="driverName">{language === 'ar' ? 'اسم السائق' : 'Driver Name'}</Label>
                <Input
                  id="driverName"
                  value={editForm.driverName}
                  onChange={(e) => setEditForm({ ...editForm, driverName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="driverPhone">{language === 'ar' ? 'هاتف السائق' : 'Driver Phone'}</Label>
                <Input
                  id="driverPhone"
                  value={editForm.driverPhone}
                  onChange={(e) => setEditForm({ ...editForm, driverPhone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="route">{language === 'ar' ? 'المسار' : 'Route'}</Label>
                <Input
                  id="route"
                  value={editForm.route}
                  onChange={(e) => setEditForm({ ...editForm, route: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Driver Dialog */}
      <AddDriverForm 
        isOpen={isAddDriverDialogOpen} 
        onClose={() => setIsAddDriverDialogOpen(false)} 
      />
    </div>
  );
}