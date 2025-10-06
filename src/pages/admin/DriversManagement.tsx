import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Phone, Mail, MapPin, Calendar, Car } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

export interface Driver {
  id: string;
  name: string;
  nameAr: string;
  phone: string;
  email: string;
  address: string;
  licenseNumber: string;
  licenseExpiry: string;
  experience: number;
  status: 'active' | 'inactive' | 'on-leave';
  image: string;
  busId?: string;
  joinDate: string;
}

const mockDrivers: Driver[] = [
  {
    id: '1',
    name: 'Ali Mohammed',
    nameAr: 'علي محمد',
    phone: '+968 9123 4567',
    email: 'ali.mohammed@school.om',
    address: 'Al Khuwair, Muscat',
    licenseNumber: 'DL-12345',
    licenseExpiry: '2025-06-15',
    experience: 8,
    status: 'active',
    image: '',
    busId: 'BUS-001',
    joinDate: '2020-03-15',
  },
  {
    id: '2',
    name: 'Hassan Ibrahim',
    nameAr: 'حسن إبراهيم',
    phone: '+968 9234 5678',
    email: 'hassan.ibrahim@school.om',
    address: 'Qurum, Muscat',
    licenseNumber: 'DL-23456',
    licenseExpiry: '2024-12-20',
    experience: 5,
    status: 'active',
    image: '',
    busId: 'BUS-002',
    joinDate: '2021-01-10',
  },
];

export default function DriversManagement() {
  const { t, language } = useLanguage();
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<Driver>>({
    status: 'active',
  });
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  
  // Confirmation dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<string | null>(null);

  const handleAddDriver = () => {
    const newDriver: Driver = {
      id: `d-${Date.now()}`,
      name: formData.name || '',
      nameAr: formData.nameAr || '',
      phone: formData.phone || '',
      email: formData.email || '',
      address: formData.address || '',
      licenseNumber: formData.licenseNumber || '',
      licenseExpiry: formData.licenseExpiry || '',
      experience: formData.experience || 0,
      status: formData.status as 'active' | 'inactive' | 'on-leave',
      image: '',
      joinDate: new Date().toISOString().split('T')[0],
    };
    
    setDrivers([...drivers, newDriver]);
    setIsAddDialogOpen(false);
    setFormData({ status: 'active' });
    
    toast({
      variant: 'success',
      title: language === 'ar' ? 'تمت الإضافة بنجاح' : 'Added Successfully',
      description: language === 'ar' ? 'تمت إضافة السائق بنجاح' : 'Driver has been added successfully',
    });
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData(driver);
    setIsEditDialogOpen(true);
  };

  const handleUpdateDriver = () => {
    if (!editingDriver) return;
    
    setDrivers(drivers.map(d => 
      d.id === editingDriver.id 
        ? { ...d, ...formData } as Driver
        : d
    ));
    
    setIsEditDialogOpen(false);
    setEditingDriver(null);
    setFormData({ status: 'active' });
    
    toast({
      variant: 'success',
      title: language === 'ar' ? 'تم التحديث بنجاح' : 'Updated Successfully',
      description: language === 'ar' ? 'تم تحديث معلومات السائق بنجاح' : 'Driver information has been updated successfully',
    });
  };

  const handleDeleteDriver = (id: string) => {
    setDriverToDelete(id);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = () => {
    if (driverToDelete) {
      setDrivers(drivers.filter(d => d.id !== driverToDelete));
      setSelectedDrivers(prev => prev.filter(driverId => driverId !== driverToDelete));
      
      toast({
        variant: 'success',
        title: language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted Successfully',
        description: language === 'ar' ? 'تم حذف السائق بنجاح' : 'Driver has been deleted successfully',
      });
      
      setDriverToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const handleBulkDelete = () => {
    setBulkDeleteConfirmOpen(true);
  };
  
  const confirmBulkDelete = () => {
    setDrivers(drivers.filter(d => !selectedDrivers.includes(d.id)));
    const count = selectedDrivers.length;
    setSelectedDrivers([]);
    
    toast({
      variant: 'success',
      title: language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted Successfully',
      description: language === 'ar' 
        ? `تم حذف ${count} سائق بنجاح` 
        : `${count} drivers have been deleted successfully`,
    });
    
    setBulkDeleteConfirmOpen(false);
  };

  const toggleDriverSelection = (driverId: string) => {
    setSelectedDrivers(prev =>
      prev.includes(driverId)
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDrivers.length === drivers.length) {
      setSelectedDrivers([]);
    } else {
      setSelectedDrivers(drivers.map(d => d.id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      case 'on-leave':
        return 'bg-warning/10 text-warning';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {language === 'en' ? 'Drivers Management' : 'إدارة السائقين'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Manage all bus drivers information' : 'إدارة معلومات جميع سائقي الحافلات'}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedDrivers.length > 0 && (
            <Button onClick={handleBulkDelete} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              {language === 'en' 
                ? `Delete (${selectedDrivers.length})` 
                : `حذف (${selectedDrivers.length})`}
            </Button>
          )}
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Add Driver' : 'إضافة سائق'}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Total Drivers' : 'إجمالي السائقين'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Active Drivers' : 'السائقون النشطون'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {drivers.filter(d => d.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'On Leave' : 'في إجازة'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {drivers.filter(d => d.status === 'on-leave').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Avg Experience' : 'متوسط الخبرة'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(drivers.reduce((sum, d) => sum + d.experience, 0) / drivers.length).toFixed(1)} {language === 'en' ? 'years' : 'سنوات'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'en' ? 'All Drivers' : 'جميع السائقين'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedDrivers.length === drivers.length && drivers.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>{language === 'en' ? 'Driver' : 'السائق'}</TableHead>
                <TableHead>{language === 'en' ? 'Contact' : 'التواصل'}</TableHead>
                <TableHead>{language === 'en' ? 'License' : 'الرخصة'}</TableHead>
                <TableHead>{language === 'en' ? 'Experience' : 'الخبرة'}</TableHead>
                <TableHead>{language === 'en' ? 'Bus' : 'الحافلة'}</TableHead>
                <TableHead>{language === 'en' ? 'Status' : 'الحالة'}</TableHead>
                <TableHead>{language === 'en' ? 'Actions' : 'الإجراءات'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedDrivers.includes(driver.id)}
                      onCheckedChange={() => toggleDriverSelection(driver.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={driver.image} />
                        <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {language === 'en' ? driver.name : driver.nameAr}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'en' ? 'Since' : 'منذ'} {driver.joinDate}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs">
                        <Phone className="h-3 w-3" />
                        {driver.phone}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Mail className="h-3 w-3" />
                        {driver.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{driver.licenseNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'en' ? 'Expires' : 'تنتهي'}: {driver.licenseExpiry}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{driver.experience} {language === 'en' ? 'years' : 'سنوات'}</p>
                  </TableCell>
                  <TableCell>
                    {driver.busId ? (
                      <Badge variant="outline">
                        <Car className="h-3 w-3 mr-1" />
                        {driver.busId}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {language === 'en' ? 'Not Assigned' : 'غير مخصص'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(driver.status)}>
                      {driver.status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') :
                       driver.status === 'inactive' ? (language === 'ar' ? 'غير نشط' : 'Inactive') :
                       (language === 'ar' ? 'في إجازة' : 'On Leave')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditDriver(driver)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteDriver(driver.id)}
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

      {/* Add Driver Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Add New Driver' : 'إضافة سائق جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{language === 'en' ? 'Name (English)' : 'الاسم (إنجليزي)'}</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="nameAr">{language === 'en' ? 'Name (Arabic)' : 'الاسم (عربي)'}</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr || ''}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">{language === 'en' ? 'Phone' : 'الهاتف'}</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">{language === 'en' ? 'Email' : 'البريد الإلكتروني'}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">{language === 'en' ? 'Address' : 'العنوان'}</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseNumber">{language === 'en' ? 'License Number' : 'رقم الرخصة'}</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber || ''}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="licenseExpiry">{language === 'en' ? 'License Expiry' : 'انتهاء الرخصة'}</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={formData.licenseExpiry || ''}
                  onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="experience">{language === 'en' ? 'Experience (years)' : 'الخبرة (سنوات)'}</Label>
              <Input
                id="experience"
                type="number"
                value={formData.experience || ''}
                onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddDriver}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Edit Driver' : 'تعديل السائق'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">{language === 'en' ? 'Name (English)' : 'الاسم (إنجليزي)'}</Label>
                <Input
                  id="edit-name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-nameAr">{language === 'en' ? 'Name (Arabic)' : 'الاسم (عربي)'}</Label>
                <Input
                  id="edit-nameAr"
                  value={formData.nameAr || ''}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">{language === 'en' ? 'Phone' : 'الهاتف'}</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">{language === 'en' ? 'Email' : 'البريد الإلكتروني'}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-address">{language === 'en' ? 'Address' : 'العنوان'}</Label>
              <Input
                id="edit-address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-licenseNumber">{language === 'en' ? 'License Number' : 'رقم الرخصة'}</Label>
                <Input
                  id="edit-licenseNumber"
                  value={formData.licenseNumber || ''}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-licenseExpiry">{language === 'en' ? 'License Expiry' : 'انتهاء الرخصة'}</Label>
                <Input
                  id="edit-licenseExpiry"
                  type="date"
                  value={formData.licenseExpiry || ''}
                  onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-experience">{language === 'en' ? 'Experience (years)' : 'الخبرة (سنوات)'}</Label>
              <Input
                id="edit-experience"
                type="number"
                value={formData.experience || ''}
                onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdateDriver}>{t('common.save')}</Button>
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
                ? 'Are you sure you want to delete this driver? This action cannot be undone.'
                : 'هل أنت متأكد من حذف هذا السائق؟ لا يمكن التراجع عن هذا الإجراء.'}
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
                ? `Are you sure you want to delete ${selectedDrivers.length} selected drivers? This action cannot be undone.`
                : `هل أنت متأكد من حذف ${selectedDrivers.length} سائق محدد؟ لا يمكن التراجع عن هذا الإجراء.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'en' ? 'Cancel' : 'إلغاء'}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'en' ? `Delete ${selectedDrivers.length} Drivers` : `حذف ${selectedDrivers.length} سائق`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}