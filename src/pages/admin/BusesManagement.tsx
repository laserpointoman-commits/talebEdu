import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudents } from '@/contexts/StudentsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit, Trash2, Bus, Users, Activity, Wrench, Calendar, UserPlus, X, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Driver } from './DriversManagement';

export interface Student {
  id: string;
  name: string;
  nameAr: string;
  grade: string;
  class: string;
  address: string;
  parentPhone: string;
  transportationAgreement?: boolean;
}

export interface Bus {
  id: string;
  busNumber: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  currentStudents: number;
  studentIds: string[];
  driverId?: string;
  supervisorId?: string;
  routeId?: string;
  status: 'active' | 'inactive' | 'maintenance';
  lastMaintenance: string;
  nextMaintenance: string;
  fuelType: string;
  color: string;
}

export const mockBuses: Bus[] = [
  {
    id: 'BUS-001',
    busNumber: 'BUS-001',
    plateNumber: 'AB-1234',
    make: 'Mercedes',
    model: 'Sprinter',
    year: 2020,
    capacity: 50,
    currentStudents: 42,
    studentIds: ['s1', 's2', 's3', 's4', 's5'],
    driverId: '1',
    supervisorId: 't1',
    routeId: 'r1',
    status: 'active',
    lastMaintenance: '2024-01-15',
    nextMaintenance: '2024-04-15',
    fuelType: 'Diesel',
    color: 'Yellow',
  },
  {
    id: 'BUS-002',
    busNumber: 'BUS-002',
    plateNumber: 'CD-5678',
    make: 'Volvo',
    model: 'B8R',
    year: 2021,
    capacity: 45,
    currentStudents: 38,
    studentIds: ['s6', 's7', 's8'],
    driverId: '2',
    supervisorId: 't2',
    routeId: 'r2',
    status: 'active',
    lastMaintenance: '2024-02-01',
    nextMaintenance: '2024-05-01',
    fuelType: 'Diesel',
    color: 'Yellow',
  },
];


// Mock drivers data for selection
export const mockDrivers: Driver[] = [
  {
    id: '1',
    name: 'Ali Mohammed',
    nameAr: 'علي محمد',
    phone: '+968 9123 4567',
    email: 'ali@school.om',
    address: 'Muscat',
    licenseNumber: 'DL-12345',
    licenseExpiry: '2025-06-15',
    experience: 8,
    status: 'active',
    image: '',
    joinDate: '2020-03-15',
  },
  {
    id: '2',
    name: 'Hassan Ibrahim',
    nameAr: 'حسن إبراهيم',
    phone: '+968 9234 5678',
    email: 'hassan@school.om',
    address: 'Muscat',
    licenseNumber: 'DL-23456',
    licenseExpiry: '2024-12-20',
    experience: 5,
    status: 'active',
    image: '',
    joinDate: '2021-01-10',
  },
  {
    id: '3',
    name: 'Omar Said',
    nameAr: 'عمر سعيد',
    phone: '+968 9345 6789',
    email: 'omar@school.om',
    address: 'Muscat',
    licenseNumber: 'DL-34567',
    licenseExpiry: '2025-08-30',
    experience: 10,
    status: 'active',
    image: '',
    joinDate: '2019-05-20',
  },
];

// Mock teachers for supervisor selection
export const mockTeachers = [
  { id: 't1', name: 'Sarah Ahmed', nameAr: 'سارة أحمد' },
  { id: 't2', name: 'Fatima Ali', nameAr: 'فاطمة علي' },
  { id: 't3', name: 'Maryam Hassan', nameAr: 'مريم حسن' },
];

export default function BusesManagement() {
  const { t, language } = useLanguage();
  const { students } = useStudents();
  const [buses, setBuses] = useState<Bus[]>(mockBuses);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedBuses, setSelectedBuses] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<Bus>>({
    status: 'active',
    capacity: 50,
    currentStudents: 0,
    year: new Date().getFullYear(),
    studentIds: [],
  });
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  
  // Search states
  const [studentSearch, setStudentSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [supervisorSearch, setSupervisorSearch] = useState('');
  
  // Confirmation dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [busToDelete, setBusToDelete] = useState<string | null>(null);

  const handleAddBus = () => {
    const newBus: Bus = {
      id: `BUS-${String(buses.length + 1).padStart(3, '0')}`,
      busNumber: formData.busNumber || `BUS-${String(buses.length + 1).padStart(3, '0')}`,
      plateNumber: formData.plateNumber || '',
      make: formData.make || '',
      model: formData.model || '',
      year: formData.year || new Date().getFullYear(),
      capacity: formData.capacity || 50,
      currentStudents: selectedStudents.length,
      studentIds: selectedStudents,
      driverId: formData.driverId,
      supervisorId: formData.supervisorId,
      status: formData.status as 'active' | 'inactive' | 'maintenance',
      lastMaintenance: formData.lastMaintenance || '',
      nextMaintenance: formData.nextMaintenance || '',
      fuelType: formData.fuelType || 'Diesel',
      color: formData.color || 'Yellow',
    };
    
    setBuses([...buses, newBus]);
    setIsAddDialogOpen(false);
    setSelectedStudents([]);
    setFormData({ status: 'active', capacity: 50, currentStudents: 0, year: new Date().getFullYear(), studentIds: [] });
    
    toast({
      variant: 'success',
      title: language === 'ar' ? 'تمت الإضافة بنجاح' : 'Added Successfully',
      description: language === 'ar' ? 'تمت إضافة الحافلة بنجاح' : 'Bus has been added successfully',
    });
  };

  const handleEditBus = (bus: Bus) => {
    setEditingBus(bus);
    setFormData(bus);
    setSelectedStudents(bus.studentIds || []);
    setIsEditDialogOpen(true);
  };

  const handleUpdateBus = () => {
    if (!editingBus) return;
    
    setBuses(buses.map(b => 
      b.id === editingBus.id 
        ? { ...b, ...formData, studentIds: selectedStudents, currentStudents: selectedStudents.length } as Bus
        : b
    ));
    
    setIsEditDialogOpen(false);
    setEditingBus(null);
    setSelectedStudents([]);
    setFormData({ status: 'active', capacity: 50, currentStudents: 0, year: new Date().getFullYear(), studentIds: [] });
    
    toast({
      variant: 'success',
      title: language === 'ar' ? 'تم التحديث بنجاح' : 'Updated Successfully',
      description: language === 'ar' ? 'تم تحديث معلومات الحافلة بنجاح' : 'Bus information has been updated successfully',
    });
  };

  const handleDeleteBus = (id: string) => {
    setBusToDelete(id);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = () => {
    if (busToDelete) {
      setBuses(buses.filter(b => b.id !== busToDelete));
      setSelectedBuses(prev => prev.filter(busId => busId !== busToDelete));
      
      toast({
        variant: 'success',
        title: language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted Successfully',
        description: language === 'ar' ? 'تم حذف الحافلة بنجاح' : 'Bus has been deleted successfully',
      });
      
      setBusToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const handleBulkDelete = () => {
    setBulkDeleteConfirmOpen(true);
  };
  
  const confirmBulkDelete = () => {
    setBuses(buses.filter(b => !selectedBuses.includes(b.id)));
    const count = selectedBuses.length;
    setSelectedBuses([]);
    
    toast({
      variant: 'success',
      title: language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted Successfully',
      description: language === 'ar' 
        ? `تم حذف ${count} حافلة بنجاح` 
        : `${count} buses have been deleted successfully`,
    });
    
    setBulkDeleteConfirmOpen(false);
  };

  const toggleBusSelection = (busId: string) => {
    setSelectedBuses(prev =>
      prev.includes(busId)
        ? prev.filter(id => id !== busId)
        : [...prev, busId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBuses.length === buses.length) {
      setSelectedBuses([]);
    } else {
      setSelectedBuses(buses.map(b => b.id));
    }
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

  const getDriverName = (driverId?: string) => {
    const driver = mockDrivers.find(d => d.id === driverId);
    return driver ? (language === 'en' ? driver.name : driver.nameAr) : (language === 'en' ? 'Not Assigned' : 'غير مخصص');
  };

  const getSupervisorName = (supervisorId?: string) => {
    const supervisor = mockTeachers.find(t => t.id === supervisorId);
    return supervisor ? (language === 'en' ? supervisor.name : supervisor.nameAr) : (language === 'en' ? 'Not Assigned' : 'غير مخصص');
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const getSelectedStudentsNames = () => {
    const selected = students.filter(s => selectedStudents.includes(s.id));
    if (selected.length === 0) return language === 'en' ? 'No students selected' : 'لا يوجد طلاب محددون';
    if (selected.length <= 3) {
      return selected.map(s => language === 'en' ? `${s.firstName} ${s.lastName}` : `${s.firstNameAr} ${s.lastNameAr}`).join(', ');
    }
    return `${selected.length} ${language === 'en' ? 'students selected' : 'طلاب محددون'}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {language === 'en' ? 'Buses Management' : 'إدارة الحافلات'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Manage all school buses information' : 'إدارة معلومات جميع الحافلات المدرسية'}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedBuses.length > 0 && (
            <Button 
              onClick={handleBulkDelete}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {language === 'en' 
                ? `Delete (${selectedBuses.length})` 
                : `حذف (${selectedBuses.length})`}
            </Button>
          )}
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Opening Add Bus dialog');
              setSelectedStudents([]);
              setFormData({ status: 'active', capacity: 50, currentStudents: 0, year: new Date().getFullYear(), studentIds: [] });
              setIsAddDialogOpen(true);
              console.log('Dialog state:', true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Add Bus' : 'إضافة حافلة'}
          </Button>
        </div>
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
            <div className="text-2xl font-bold text-success">
              {buses.filter(b => b.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Total Capacity' : 'السعة الإجمالية'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {buses.reduce((sum, b) => sum + b.capacity, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Total Students' : 'إجمالي الطلاب'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {buses.reduce((sum, b) => sum + b.currentStudents, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buses Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'en' ? 'All Buses' : 'جميع الحافلات'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedBuses.length === buses.length && buses.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>{language === 'en' ? 'Bus Details' : 'تفاصيل الحافلة'}</TableHead>
                <TableHead>{language === 'en' ? 'Driver' : 'السائق'}</TableHead>
                <TableHead>{language === 'en' ? 'Supervisor' : 'المشرف'}</TableHead>
                <TableHead>{language === 'en' ? 'Capacity' : 'السعة'}</TableHead>
                <TableHead>{language === 'en' ? 'Maintenance' : 'الصيانة'}</TableHead>
                <TableHead>{language === 'en' ? 'Status' : 'الحالة'}</TableHead>
                <TableHead>{language === 'en' ? 'Actions' : 'الإجراءات'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buses.map((bus) => (
                <TableRow key={bus.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedBuses.includes(bus.id)}
                      onCheckedChange={() => toggleBusSelection(bus.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-primary" />
                        <span className="font-medium">{bus.busNumber}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {language === 'en' ? 'Plate' : 'اللوحة'}: {bus.plateNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bus.make} {bus.model} ({bus.year})
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{getDriverName(bus.driverId)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{getSupervisorName(bus.supervisorId)}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="text-sm">{bus.currentStudents}/{bus.capacity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-xs">
                        {language === 'en' ? 'Last' : 'آخر'}: {bus.lastMaintenance}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'en' ? 'Next' : 'التالي'}: {bus.nextMaintenance}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(bus.status)}>
                      {bus.status === 'active' && <Activity className="h-3 w-3 mr-1" />}
                      {bus.status === 'maintenance' && <Wrench className="h-3 w-3 mr-1" />}
                      {bus.status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') :
                       bus.status === 'inactive' ? (language === 'ar' ? 'غير نشط' : 'Inactive') :
                       (language === 'ar' ? 'صيانة' : 'Maintenance')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditBus(bus)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteBus(bus.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Bus Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          setSelectedStudents([]);
          setFormData({ status: 'active', capacity: 50, currentStudents: 0, year: new Date().getFullYear(), studentIds: [] });
          setStudentSearch('');
          setDriverSearch('');
          setSupervisorSearch('');
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Add New Bus' : 'إضافة حافلة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="busNumber">{language === 'en' ? 'Bus Number' : 'رقم الحافلة'}</Label>
                <Input
                  id="busNumber"
                  value={formData.busNumber || ''}
                  onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="plateNumber">{language === 'en' ? 'Plate Number' : 'رقم اللوحة'}</Label>
                <Input
                  id="plateNumber"
                  value={formData.plateNumber || ''}
                  onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="make">{language === 'en' ? 'Make' : 'الصانع'}</Label>
                <Input
                  id="make"
                  value={formData.make || ''}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="model">{language === 'en' ? 'Model' : 'الطراز'}</Label>
                <Input
                  id="model"
                  value={formData.model || ''}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="year">{language === 'en' ? 'Year' : 'السنة'}</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year || ''}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity">{language === 'en' ? 'Capacity' : 'السعة'}</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity || ''}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="fuelType">{language === 'en' ? 'Fuel Type' : 'نوع الوقود'}</Label>
                <Input
                  id="fuelType"
                  value={formData.fuelType || ''}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="driver">{language === 'en' ? 'Assign Driver' : 'تعيين سائق'}</Label>
                <Select
                  value={formData.driverId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, driverId: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'en' ? 'Select a driver' : 'اختر سائق'} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={language === 'en' ? 'Search drivers...' : 'البحث عن السائقين...'}
                          value={driverSearch}
                          onChange={(e) => setDriverSearch(e.target.value)}
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <SelectItem value="none">
                      {language === 'en' ? 'No Driver' : 'بدون سائق'}
                    </SelectItem>
                    {mockDrivers
                      .filter(driver => 
                        driver.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
                        driver.nameAr.includes(driverSearch)
                      )
                      .map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {language === 'en' ? driver.name : driver.nameAr}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="supervisor">{language === 'en' ? 'Assign Supervisor' : 'تعيين مشرف'}</Label>
                <Select
                  value={formData.supervisorId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, supervisorId: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'en' ? 'Select a supervisor' : 'اختر مشرف'} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={language === 'en' ? 'Search supervisors...' : 'البحث عن المشرفين...'}
                          value={supervisorSearch}
                          onChange={(e) => setSupervisorSearch(e.target.value)}
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <SelectItem value="none">
                      {language === 'en' ? 'No Supervisor' : 'بدون مشرف'}
                    </SelectItem>
                    {mockTeachers
                      .filter(teacher => 
                        teacher.name.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
                        teacher.nameAr.includes(supervisorSearch)
                      )
                      .map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {language === 'en' ? teacher.name : teacher.nameAr}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Students Selection */}
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Select Students' : 'اختر الطلاب'}</Label>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{getSelectedStudentsNames()}</span>
                <Badge variant="outline">
                  {selectedStudents.length}/{formData.capacity || 50}
                </Badge>
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'en' ? 'Search students...' : 'البحث عن الطلاب...'}
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>
              <ScrollArea className="h-40 border rounded-md p-3">
                <div className="space-y-2">
                  {students
                    .filter(student => {
                      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
                      const fullNameAr = `${student.firstNameAr} ${student.lastNameAr}`;
                      const search = studentSearch.toLowerCase();
                      return (
                        fullName.includes(search) ||
                        fullNameAr.includes(studentSearch) ||
                        student.grade.includes(studentSearch) ||
                        student.class.includes(studentSearch) ||
                        student.address.toLowerCase().includes(search)
                      );
                    })
                    .map((student) => (
                      <div key={student.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`student-${student.id}`}
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                          disabled={!selectedStudents.includes(student.id) && selectedStudents.length >= (formData.capacity || 50)}
                        />
                        <label
                          htmlFor={`student-${student.id}`}
                          className="flex-1 text-sm cursor-pointer"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">
                                {language === 'en' ? `${student.firstName} ${student.lastName}` : `${student.firstNameAr} ${student.lastNameAr}`}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {student.grade}-{student.class}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {student.address}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lastMaintenance">{language === 'en' ? 'Last Maintenance' : 'آخر صيانة'}</Label>
                <Input
                  id="lastMaintenance"
                  type="date"
                  value={formData.lastMaintenance || ''}
                  onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="nextMaintenance">{language === 'en' ? 'Next Maintenance' : 'الصيانة التالية'}</Label>
                <Input
                  id="nextMaintenance"
                  type="date"
                  value={formData.nextMaintenance || ''}
                  onChange={(e) => setFormData({ ...formData, nextMaintenance: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsAddDialogOpen(false);
                setSelectedStudents([]);
                setStudentSearch('');
                setDriverSearch('');
                setSupervisorSearch('');
                setFormData({ status: 'active', capacity: 50, currentStudents: 0, year: new Date().getFullYear(), studentIds: [] });
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddBus();
                setStudentSearch('');
                setDriverSearch('');
                setSupervisorSearch('');
              }}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bus Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingBus(null);
          setSelectedStudents([]);
          setFormData({ status: 'active', capacity: 50, currentStudents: 0, year: new Date().getFullYear(), studentIds: [] });
          setStudentSearch('');
          setDriverSearch('');
          setSupervisorSearch('');
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Edit Bus' : 'تعديل الحافلة'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-busNumber">{language === 'en' ? 'Bus Number' : 'رقم الحافلة'}</Label>
                <Input
                  id="edit-busNumber"
                  value={formData.busNumber || ''}
                  onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-plateNumber">{language === 'en' ? 'Plate Number' : 'رقم اللوحة'}</Label>
                <Input
                  id="edit-plateNumber"
                  value={formData.plateNumber || ''}
                  onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-make">{language === 'en' ? 'Make' : 'الصانع'}</Label>
                <Input
                  id="edit-make"
                  value={formData.make || ''}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-model">{language === 'en' ? 'Model' : 'الطراز'}</Label>
                <Input
                  id="edit-model"
                  value={formData.model || ''}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-year">{language === 'en' ? 'Year' : 'السنة'}</Label>
                <Input
                  id="edit-year"
                  type="number"
                  value={formData.year || ''}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-capacity">{language === 'en' ? 'Capacity' : 'السعة'}</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={formData.capacity || ''}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="edit-fuelType">{language === 'en' ? 'Fuel Type' : 'نوع الوقود'}</Label>
                <Input
                  id="edit-fuelType"
                  value={formData.fuelType || ''}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-driver">{language === 'en' ? 'Assign Driver' : 'تعيين سائق'}</Label>
                <Select
                  value={formData.driverId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, driverId: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'en' ? 'Select a driver' : 'اختر سائق'} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={language === 'en' ? 'Search drivers...' : 'البحث عن السائقين...'}
                          value={driverSearch}
                          onChange={(e) => setDriverSearch(e.target.value)}
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <SelectItem value="none">
                      {language === 'en' ? 'No Driver' : 'بدون سائق'}
                    </SelectItem>
                    {mockDrivers
                      .filter(driver => 
                        driver.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
                        driver.nameAr.includes(driverSearch)
                      )
                      .map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {language === 'en' ? driver.name : driver.nameAr}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-supervisor">{language === 'en' ? 'Assign Supervisor' : 'تعيين مشرف'}</Label>
                <Select
                  value={formData.supervisorId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, supervisorId: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'en' ? 'Select a supervisor' : 'اختر مشرف'} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={language === 'en' ? 'Search supervisors...' : 'البحث عن المشرفين...'}
                          value={supervisorSearch}
                          onChange={(e) => setSupervisorSearch(e.target.value)}
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <SelectItem value="none">
                      {language === 'en' ? 'No Supervisor' : 'بدون مشرف'}
                    </SelectItem>
                    {mockTeachers
                      .filter(teacher => 
                        teacher.name.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
                        teacher.nameAr.includes(supervisorSearch)
                      )
                      .map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {language === 'en' ? teacher.name : teacher.nameAr}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Students Selection for Edit */}
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Select Students' : 'اختر الطلاب'}</Label>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{getSelectedStudentsNames()}</span>
                <Badge variant="outline">
                  {selectedStudents.length}/{formData.capacity || 50}
                </Badge>
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'en' ? 'Search students...' : 'البحث عن الطلاب...'}
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>
              <ScrollArea className="h-40 border rounded-md p-3">
                <div className="space-y-2">
                  {students
                    .filter(student => {
                      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
                      const fullNameAr = `${student.firstNameAr} ${student.lastNameAr}`;
                      const search = studentSearch.toLowerCase();
                      return (
                        fullName.includes(search) ||
                        fullNameAr.includes(studentSearch) ||
                        student.grade.includes(studentSearch) ||
                        student.class.includes(studentSearch) ||
                        student.address.toLowerCase().includes(search)
                      );
                    })
                    .map((student) => (
                      <div key={student.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-student-${student.id}`}
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                          disabled={!selectedStudents.includes(student.id) && selectedStudents.length >= (formData.capacity || 50)}
                        />
                        <label
                          htmlFor={`edit-student-${student.id}`}
                          className="flex-1 text-sm cursor-pointer"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">
                                {language === 'en' ? `${student.firstName} ${student.lastName}` : `${student.firstNameAr} ${student.lastNameAr}`}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {student.grade}-{student.class}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {student.address}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-lastMaintenance">{language === 'en' ? 'Last Maintenance' : 'آخر صيانة'}</Label>
                <Input
                  id="edit-lastMaintenance"
                  type="date"
                  value={formData.lastMaintenance || ''}
                  onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-nextMaintenance">{language === 'en' ? 'Next Maintenance' : 'الصيانة التالية'}</Label>
                <Input
                  id="edit-nextMaintenance"
                  type="date"
                  value={formData.nextMaintenance || ''}
                  onChange={(e) => setFormData({ ...formData, nextMaintenance: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingBus(null);
                setSelectedStudents([]);
                setStudentSearch('');
                setDriverSearch('');
                setSupervisorSearch('');
                setFormData({ status: 'active', capacity: 50, currentStudents: 0, year: new Date().getFullYear(), studentIds: [] });
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={() => {
                handleUpdateBus();
                setStudentSearch('');
                setDriverSearch('');
                setSupervisorSearch('');
              }}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Confirm Deletion' : 'تأكيد الحذف'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en' 
                ? 'Are you sure you want to delete this bus? This action cannot be undone.'
                : 'هل أنت متأكد من حذف هذه الحافلة؟ لا يمكن التراجع عن هذا الإجراء.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'en' ? 'Cancel' : 'إلغاء'}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'en' ? 'Delete' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Confirm Bulk Deletion' : 'تأكيد الحذف الجماعي'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en' 
                ? `Are you sure you want to delete ${selectedBuses.length} selected buses? This action cannot be undone.`
                : `هل أنت متأكد من حذف ${selectedBuses.length} حافلة محددة؟ لا يمكن التراجع عن هذا الإجراء.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'en' ? 'Cancel' : 'إلغاء'}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'en' ? `Delete ${selectedBuses.length} Buses` : `حذف ${selectedBuses.length} حافلة`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}