import { useState } from 'react';
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
import { toast } from '@/hooks/use-toast';
import AddDriverForm from '@/components/forms/AddDriverForm';

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
  status: 'active' | 'inactive' | 'maintenance';
  lastLocation: string;
  lastUpdate: string;
}

const mockBuses: BusInfo[] = [
  {
    id: '1',
    busNumber: 'BUS-001',
    driverName: 'Ali Mohammed',
    driverNameAr: 'علي محمد',
    driverPhone: '+968 9123 4567',
    driverImage: '',
    capacity: 50,
    currentStudents: 42,
    route: 'Al Khuwair - Ruwi - Al Seeb',
    status: 'active',
    lastLocation: 'Al Khuwair',
    lastUpdate: '2 minutes ago',
  },
  {
    id: '2',
    busNumber: 'BUS-002',
    driverName: 'Hassan Ibrahim',
    driverNameAr: 'حسن إبراهيم',
    driverPhone: '+968 9234 5678',
    driverImage: '',
    capacity: 45,
    currentStudents: 38,
    route: 'Qurum - Al Ghubra - Al Azaiba',
    status: 'active',
    lastLocation: 'Qurum',
    lastUpdate: '5 minutes ago',
  },
  {
    id: '3',
    busNumber: 'BUS-003',
    driverName: 'Khalid Ahmed',
    driverNameAr: 'خالد أحمد',
    driverPhone: '+968 9345 6789',
    driverImage: '',
    capacity: 50,
    currentStudents: 0,
    route: 'Bousher - Al Amerat',
    status: 'maintenance',
    lastLocation: 'School Garage',
    lastUpdate: '1 hour ago',
  },
  {
    id: '4',
    busNumber: 'BUS-004',
    driverName: 'Said Al-Habsi',
    driverNameAr: 'سعيد الحبسي',
    driverPhone: '+968 9456 7890',
    driverImage: '',
    capacity: 48,
    currentStudents: 35,
    route: 'Al Hail - Al Mawaleh',
    status: 'active',
    lastLocation: 'Al Hail',
    lastUpdate: '1 minute ago',
  },
];

export default function Transport() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [selectedBus, setSelectedBus] = useState<BusInfo | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDriverDialogOpen, setIsAddDriverDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<BusInfo | null>(null);
  
  // Add debug logging
  console.log('Transport component rendered, navigate function:', typeof navigate);

  const handleEdit = (bus: BusInfo) => {
    setEditForm(bus);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    toast({
      title: t('common.save'),
      description: language === 'ar' ? 'تم تحديث معلومات الحافلة بنجاح' : 'Bus information updated successfully',
    });
    setIsEditDialogOpen(false);
  };

  const handleCreateDriverEmail = () => {
    toast({
      title: language === 'ar' ? 'تم إنشاء حساب البريد الإلكتروني' : 'Email Account Created',
      description: language === 'ar' ? 'تم إنشاء حساب البريد الإلكتروني للسائق بنجاح' : 'Driver email account has been created successfully',
    });
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

  const activeBuses = mockBuses.filter(bus => bus.status === 'active');
  const totalCapacity = mockBuses.reduce((sum, bus) => sum + bus.capacity, 0);
  const totalStudents = mockBuses.reduce((sum, bus) => sum + bus.currentStudents, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.transport')}</h2>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Manage school transportation and buses' : 'إدارة النقل المدرسي والحافلات'}
          </p>
        </div>
        {user?.role === 'admin' && (
          <div className="flex gap-2 flex-wrap">
            <Link to="/dashboard/transport/drivers">
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Manage Drivers' : 'إدارة السائقين'}
              </Button>
            </Link>
            <Link to="/dashboard/transport/buses">
              <Button>
                <Bus className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Manage Buses' : 'إدارة الحافلات'}
              </Button>
            </Link>
            <Link to="/dashboard/transport/routes">
              <Button>
                <Route className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Manage Routes' : 'إدارة المسارات'}
              </Button>
            </Link>
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
            <div className="text-2xl font-bold">{mockBuses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Active Buses' : 'الحافلات النشطة'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{activeBuses.length}</div>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockBuses.map((bus) => (
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
                <p className="text-sm font-medium">{bus.route}</p>
              </div>

              {user?.role === 'admin' && (
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