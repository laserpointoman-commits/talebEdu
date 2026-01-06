import { useState, useEffect } from 'react';
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
import { Plus, Edit, Trash2, Bus, Users, Activity, Wrench, Calendar, UserPlus, X, Search, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BusData {
  id: string;
  bus_number: string;
  capacity: number;
  model: string | null;
  year: number | null;
  status: string | null;
  driver_id: string | null;
  supervisor_id: string | null;
}

interface DriverData {
  id: string;
  employee_id: string;
  license_number: string;
  profile: {
    id: string;
    full_name: string;
    full_name_ar: string | null;
  } | null;
}

interface TeacherData {
  id: string;
  employee_id: string;
  profile: {
    id: string;
    full_name: string;
    full_name_ar: string | null;
  } | null;
}

export default function BusesManagement() {
  const { t, language } = useLanguage();
  const { students } = useStudents();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedBuses, setSelectedBuses] = useState<string[]>([]);
  const [formData, setFormData] = useState<{
    bus_number: string;
    capacity: number;
    model: string;
    year: number;
    status: string;
    driver_id: string;
    supervisor_id: string;
  }>({
    bus_number: '',
    capacity: 50,
    model: '',
    year: new Date().getFullYear(),
    status: 'active',
    driver_id: '',
    supervisor_id: '',
  });
  const [editingBus, setEditingBus] = useState<BusData | null>(null);
  
  const [studentSearch, setStudentSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [busToDelete, setBusToDelete] = useState<string | null>(null);

  // Fetch buses from database
  const { data: buses = [], isLoading: busesLoading } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .order('bus_number');
      if (error) throw error;
      return data as BusData[];
    }
  });

  // Fetch drivers from database
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers-for-buses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id,
          employee_id,
          license_number,
          profile:profiles!drivers_profile_id_fkey(id, full_name, full_name_ar)
        `)
        .eq('status', 'active');
      if (error) throw error;
      return data as DriverData[];
    }
  });

  // Fetch supervisors (teachers and employees who can supervise)
  const { data: supervisors = [] } = useQuery({
    queryKey: ['supervisors-for-buses'],
    queryFn: async () => {
      // Get profiles with supervisor role or teachers
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, full_name_ar, role')
        .in('role', ['supervisor', 'teacher', 'admin']);
      if (error) throw error;
      return profiles || [];
    }
  });

  // Add bus mutation
  const addBusMutation = useMutation({
    mutationFn: async (busData: typeof formData) => {
      const { data, error } = await supabase
        .from('buses')
        .insert({
          bus_number: busData.bus_number,
          capacity: busData.capacity,
          model: busData.model || null,
          year: busData.year || null,
          status: busData.status,
          driver_id: busData.driver_id || null,
          supervisor_id: busData.supervisor_id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        variant: 'success',
        title: language === 'ar' ? 'تمت الإضافة بنجاح' : 'Added Successfully',
        description: language === 'ar' ? 'تمت إضافة الحافلة بنجاح' : 'Bus has been added successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    }
  });

  // Update bus mutation
  const updateBusMutation = useMutation({
    mutationFn: async ({ id, busData }: { id: string; busData: typeof formData }) => {
      const { data, error } = await supabase
        .from('buses')
        .update({
          bus_number: busData.bus_number,
          capacity: busData.capacity,
          model: busData.model || null,
          year: busData.year || null,
          status: busData.status,
          driver_id: busData.driver_id || null,
          supervisor_id: busData.supervisor_id || null,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      setIsEditDialogOpen(false);
      setEditingBus(null);
      resetForm();
      toast({
        variant: 'success',
        title: language === 'ar' ? 'تم التحديث بنجاح' : 'Updated Successfully',
        description: language === 'ar' ? 'تم تحديث معلومات الحافلة بنجاح' : 'Bus information has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    }
  });

  // Delete bus mutation
  const deleteBusMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('buses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      setBusToDelete(null);
      setDeleteConfirmOpen(false);
      toast({
        variant: 'success',
        title: language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted Successfully',
        description: language === 'ar' ? 'تم حذف الحافلة بنجاح' : 'Bus has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    }
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('buses')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      const count = selectedBuses.length;
      setSelectedBuses([]);
      setBulkDeleteConfirmOpen(false);
      toast({
        variant: 'success',
        title: language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted Successfully',
        description: language === 'ar' 
          ? `تم حذف ${count} حافلة بنجاح` 
          : `${count} buses have been deleted successfully`,
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    }
  });

  const resetForm = () => {
    setFormData({
      bus_number: '',
      capacity: 50,
      model: '',
      year: new Date().getFullYear(),
      status: 'active',
      driver_id: '',
      supervisor_id: '',
    });
    setSelectedStudents([]);
  };

  const handleAddBus = () => {
    addBusMutation.mutate(formData);
  };

  const handleEditBus = (bus: BusData) => {
    setEditingBus(bus);
    setFormData({
      bus_number: bus.bus_number,
      capacity: bus.capacity,
      model: bus.model || '',
      year: bus.year || new Date().getFullYear(),
      status: bus.status || 'active',
      driver_id: bus.driver_id || '',
      supervisor_id: bus.supervisor_id || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateBus = () => {
    if (!editingBus) return;
    updateBusMutation.mutate({ id: editingBus.id, busData: formData });
  };

  const handleDeleteBus = (id: string) => {
    setBusToDelete(id);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = () => {
    if (busToDelete) {
      deleteBusMutation.mutate(busToDelete);
    }
  };

  const handleBulkDelete = () => {
    setBulkDeleteConfirmOpen(true);
  };
  
  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedBuses);
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

  const getStatusColor = (status: string | null) => {
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

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return language === 'en' ? 'Not Assigned' : 'غير مخصص';
    const driver = drivers.find(d => d.id === driverId);
    if (!driver?.profile) return language === 'en' ? 'Unknown' : 'غير معروف';
    return language === 'en' 
      ? (driver.profile.full_name || 'Unknown') 
      : (driver.profile.full_name_ar || driver.profile.full_name || 'غير معروف');
  };

  const getSupervisorName = (supervisorId: string | null) => {
    if (!supervisorId) return language === 'en' ? 'Not Assigned' : 'غير مخصص';
    const supervisor = supervisors.find(s => s.id === supervisorId);
    if (!supervisor) return language === 'en' ? 'Unknown' : 'غير معروف';
    return language === 'en' 
      ? (supervisor.full_name || 'Unknown') 
      : (supervisor.full_name_ar || supervisor.full_name || 'غير معروف');
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

  const filteredDrivers = drivers.filter(d => {
    if (!driverSearch) return true;
    const name = d.profile?.full_name?.toLowerCase() || '';
    const nameAr = d.profile?.full_name_ar?.toLowerCase() || '';
    return name.includes(driverSearch.toLowerCase()) || nameAr.includes(driverSearch.toLowerCase());
  });

  if (busesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
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
              {language === 'en' ? 'In Maintenance' : 'في الصيانة'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {buses.filter(b => b.status === 'maintenance').length}
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
          {buses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{language === 'en' ? 'No buses found. Add your first bus!' : 'لا توجد حافلات. أضف أول حافلة!'}</p>
            </div>
          ) : (
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
                  <TableHead>{language === 'en' ? 'Capacity' : 'السعة'}</TableHead>
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
                          <span className="font-medium">{bus.bus_number}</span>
                        </div>
                        {bus.model && (
                          <p className="text-xs text-muted-foreground">
                            {bus.model} {bus.year && `(${bus.year})`}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{getDriverName(bus.driver_id)}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="text-sm">{bus.capacity}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(bus.status)}>
                        {bus.status === 'active' 
                          ? (language === 'en' ? 'Active' : 'نشط')
                          : bus.status === 'maintenance'
                          ? (language === 'en' ? 'Maintenance' : 'صيانة')
                          : (language === 'en' ? 'Inactive' : 'غير نشط')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEditBus(bus)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteBus(bus.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Bus Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Add New Bus' : 'إضافة حافلة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'en' ? 'Bus Number' : 'رقم الحافلة'}</Label>
                <Input
                  value={formData.bus_number}
                  onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
                  placeholder="BUS-001"
                />
              </div>
              <div>
                <Label>{language === 'en' ? 'Capacity' : 'السعة'}</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'en' ? 'Model' : 'الموديل'}</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Mercedes Sprinter"
                />
              </div>
              <div>
                <Label>{language === 'en' ? 'Year' : 'السنة'}</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'en' ? 'Status' : 'الحالة'}</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{language === 'en' ? 'Active' : 'نشط'}</SelectItem>
                    <SelectItem value="inactive">{language === 'en' ? 'Inactive' : 'غير نشط'}</SelectItem>
                    <SelectItem value="maintenance">{language === 'en' ? 'Maintenance' : 'صيانة'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'en' ? 'Driver' : 'السائق'}</Label>
                <Select value={formData.driver_id} onValueChange={(v) => setFormData({ ...formData, driver_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'en' ? 'Select driver' : 'اختر السائق'} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDrivers.map(driver => {
                      const driverName = driver.profile?.full_name || `Driver ${driver.employee_id || driver.id.slice(0, 6)}`;
                      const driverNameAr = driver.profile?.full_name_ar || driver.profile?.full_name || `سائق ${driver.employee_id || driver.id.slice(0, 6)}`;
                      return (
                        <SelectItem key={driver.id} value={driver.id}>
                          {language === 'en' ? driverName : driverNameAr}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{language === 'en' ? 'Supervisor' : 'المشرف'}</Label>
              <Select value={formData.supervisor_id} onValueChange={(v) => setFormData({ ...formData, supervisor_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Select supervisor' : 'اختر المشرف'} />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map(supervisor => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      {language === 'en' ? supervisor.full_name : (supervisor.full_name_ar || supervisor.full_name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button onClick={handleAddBus} disabled={addBusMutation.isPending}>
              {addBusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {language === 'en' ? 'Add Bus' : 'إضافة حافلة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bus Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Edit Bus' : 'تعديل الحافلة'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'en' ? 'Bus Number' : 'رقم الحافلة'}</Label>
                <Input
                  value={formData.bus_number}
                  onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
                />
              </div>
              <div>
                <Label>{language === 'en' ? 'Capacity' : 'السعة'}</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'en' ? 'Model' : 'الموديل'}</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
              <div>
                <Label>{language === 'en' ? 'Year' : 'السنة'}</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'en' ? 'Status' : 'الحالة'}</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{language === 'en' ? 'Active' : 'نشط'}</SelectItem>
                    <SelectItem value="inactive">{language === 'en' ? 'Inactive' : 'غير نشط'}</SelectItem>
                    <SelectItem value="maintenance">{language === 'en' ? 'Maintenance' : 'صيانة'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'en' ? 'Driver' : 'السائق'}</Label>
                <Select value={formData.driver_id} onValueChange={(v) => setFormData({ ...formData, driver_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'en' ? 'Select driver' : 'اختر السائق'} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDrivers.map(driver => {
                      const driverName = driver.profile?.full_name || `Driver ${driver.employee_id || driver.id.slice(0, 6)}`;
                      const driverNameAr = driver.profile?.full_name_ar || driver.profile?.full_name || `سائق ${driver.employee_id || driver.id.slice(0, 6)}`;
                      return (
                        <SelectItem key={driver.id} value={driver.id}>
                          {language === 'en' ? driverName : driverNameAr}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
            </div>
            <div>
              <Label>{language === 'en' ? 'Supervisor' : 'المشرف'}</Label>
              <Select value={formData.supervisor_id} onValueChange={(v) => setFormData({ ...formData, supervisor_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Select supervisor' : 'اختر المشرف'} />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map(supervisor => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      {language === 'en' ? supervisor.full_name : (supervisor.full_name_ar || supervisor.full_name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button onClick={handleUpdateBus} disabled={updateBusMutation.isPending}>
              {updateBusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {language === 'en' ? 'Update Bus' : 'تحديث الحافلة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'en' ? 'Delete Bus' : 'حذف الحافلة'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en' 
                ? 'Are you sure you want to delete this bus? This action cannot be undone.'
                : 'هل أنت متأكد أنك تريد حذف هذه الحافلة؟ لا يمكن التراجع عن هذا الإجراء.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'en' ? 'Cancel' : 'إلغاء'}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {language === 'en' ? 'Delete' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'en' ? 'Delete Selected Buses' : 'حذف الحافلات المحددة'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en' 
                ? `Are you sure you want to delete ${selectedBuses.length} buses? This action cannot be undone.`
                : `هل أنت متأكد أنك تريد حذف ${selectedBuses.length} حافلات؟ لا يمكن التراجع عن هذا الإجراء.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'en' ? 'Cancel' : 'إلغاء'}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete}>
              {language === 'en' ? 'Delete All' : 'حذف الكل'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
