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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, MapPin, Clock, Users, Bus, ChevronRight, Eye, X, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Driver {
  id: string;
  name: string;
  nameAr: string;
}

interface BusData {
  id: string;
  busNumber: string;
}

interface Teacher {
  id: string;
  name: string;
  nameAr: string;
}

interface RouteStop {
  lat?: number;
  lng?: number;
  name: string;
  name_ar?: string;
  time?: string;
}

export interface Route {
  id: string;
  name: string;
  nameAr: string;
  busId?: string;
  driverId?: string;
  supervisorId?: string;
  stops: (string | RouteStop)[];
  studentIds: string[];
  departureTime: string;
  arrivalTime: string;
  distance: string;
  status: 'active' | 'inactive';
  description?: string;
}

export default function RoutesManagement() {
  const { t, language } = useLanguage();
  const { students } = useStudents();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [supervisors, setSupervisors] = useState<{ id: string; name: string; nameAr: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  
  // Confirmation dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);
  const [stops, setStops] = useState<(string | RouteStop)[]>([]);
  const [newStop, setNewStop] = useState('');

  // Duplicate assignment dialog state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    type: 'student' | 'driver' | 'supervisor';
    name: string;
    routeName: string;
    busNumber: string;
  } | null>(null);

  // Helper function to get stop name from string or RouteStop object
  const getStopName = (stop: string | RouteStop, lang: string = language): string => {
    if (typeof stop === 'string') return stop;
    return lang === 'ar' && stop.name_ar ? stop.name_ar : stop.name;
  };
  const [formData, setFormData] = useState<Partial<Route>>({
    status: 'active',
    stops: [],
    studentIds: [],
  });
  
  // Search states
  const [studentSearch, setStudentSearch] = useState('');
  const [busSearch, setBusSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [supervisorSearch, setSupervisorSearch] = useState('');

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch routes with bus info (including driver and supervisor)
        const { data: routesData } = await supabase
          .from('bus_routes')
          .select(`
            *,
            buses:bus_id (driver_id, supervisor_id)
          `);
        
        // Fetch all student bus assignments to map students to routes
        const { data: assignmentsData } = await supabase
          .from('student_bus_assignments')
          .select('student_id, bus_id, route_id')
          .eq('is_active', true);
        
        // Create a map of route_id -> student_ids (primary) and bus_id -> student_ids (fallback)
        const routeStudentMap: Record<string, string[]> = {};
        const busStudentMap: Record<string, string[]> = {};
        if (assignmentsData) {
          assignmentsData.forEach(a => {
            // Map by route_id (preferred)
            if (a.route_id) {
              if (!routeStudentMap[a.route_id]) {
                routeStudentMap[a.route_id] = [];
              }
              routeStudentMap[a.route_id].push(a.student_id);
            }
            // Also map by bus_id as fallback
            if (a.bus_id) {
              if (!busStudentMap[a.bus_id]) {
                busStudentMap[a.bus_id] = [];
              }
              busStudentMap[a.bus_id].push(a.student_id);
            }
          });
        }
        
        if (routesData) {
          setRoutes(routesData.map(r => ({
            id: r.id,
            name: r.route_name,
            nameAr: r.route_name_ar || r.route_name,
            busId: r.bus_id || undefined,
            driverId: (r.buses as any)?.driver_id || undefined,
            supervisorId: (r.buses as any)?.supervisor_id || undefined,
            stops: Array.isArray(r.stops) ? r.stops as string[] : [],
            // Use route_id map first, then fall back to bus_id map
            studentIds: routeStudentMap[r.id] || (r.bus_id ? busStudentMap[r.bus_id] : []) || [],
            departureTime: (r.morning_schedule as any)?.departure || '06:30',
            arrivalTime: (r.morning_schedule as any)?.arrival || '07:30',
            distance: '25 km',
            status: r.is_active ? 'active' : 'inactive',
          })));
        }

        // Fetch drivers
        const { data: driversData } = await supabase
          .from('drivers')
          .select(`
            id,
            profile_id,
            profiles:profile_id (full_name, full_name_ar)
          `);
        
        if (driversData) {
          setDrivers(driversData.map(d => ({
            id: d.id,
            name: (d.profiles as any)?.full_name || 'Unknown',
            nameAr: (d.profiles as any)?.full_name_ar || (d.profiles as any)?.full_name || 'غير معروف',
          })));
        }

        // Fetch buses
        const { data: busesData } = await supabase
          .from('buses')
          .select('id, bus_number');
        
        if (busesData) {
          setBuses(busesData.map(b => ({
            id: b.id,
            busNumber: b.bus_number,
          })));
        }

        // Fetch teachers
        const { data: teachersData } = await supabase
          .from('teachers')
          .select(`
            id,
            profile_id,
            profiles:profile_id (full_name, full_name_ar)
          `);
        
        if (teachersData) {
          setTeachers(teachersData.map(t => ({
            id: t.id,
            name: (t.profiles as any)?.full_name || 'Unknown',
            nameAr: (t.profiles as any)?.full_name_ar || (t.profiles as any)?.full_name || 'غير معروف',
          })));
        }
        
        // Fetch supervisors from profiles table with their current bus assignment
        const { data: supervisorsData } = await supabase
          .from('profiles')
          .select(`
            id, 
            full_name, 
            full_name_ar,
            supervisors:supervisors(bus_id, buses:bus_id(bus_number))
          `)
          .eq('role', 'supervisor');
        
        if (supervisorsData) {
          setSupervisors(supervisorsData.map(s => {
            const supervisorRecord = (s.supervisors as any)?.[0];
            const currentBus = supervisorRecord?.buses?.bus_number;
            return {
              id: s.id,
              name: s.full_name + (currentBus ? ` (${currentBus})` : ''),
              nameAr: (s.full_name_ar || s.full_name) + (currentBus ? ` (${currentBus})` : ''),
            };
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddRoute = async () => {
    const newRoute: Route = {
      id: `r-${Date.now()}`,
      name: formData.name || '',
      nameAr: formData.nameAr || '',
      busId: formData.busId,
      driverId: formData.driverId,
      supervisorId: formData.supervisorId,
      stops: stops,
      studentIds: selectedStudents,
      departureTime: formData.departureTime || '',
      arrivalTime: formData.arrivalTime || '',
      distance: formData.distance || '',
      status: formData.status as 'active' | 'inactive',
      description: formData.description,
    };
    
    // Save route to database
    try {
      const { data: savedRoute, error: routeError } = await supabase
        .from('bus_routes')
        .insert({
          route_name: newRoute.name,
          route_name_ar: newRoute.nameAr,
          bus_id: newRoute.busId || null,
          stops: JSON.parse(JSON.stringify(stops)),
          is_active: newRoute.status === 'active',
          morning_schedule: { departure: newRoute.departureTime, arrival: newRoute.arrivalTime },
        })
        .select()
        .single();
      
      if (routeError) throw routeError;
      
      // Update bus with driver and supervisor if assigned
      if (newRoute.busId) {
        await supabase
          .from('buses')
          .update({
            driver_id: newRoute.driverId || null,
            supervisor_id: newRoute.supervisorId || null,
          })
          .eq('id', newRoute.busId);
        
        // Also update supervisors table if supervisor is assigned
        if (newRoute.supervisorId) {
          await supabase
            .from('supervisors')
            .update({ bus_id: newRoute.busId })
            .eq('profile_id', newRoute.supervisorId);
        }
      }
      
      // Create student bus assignments if students are selected
      if (selectedStudents.length > 0) {
        // First, deactivate any existing active assignments for these students
        await supabase
          .from('student_bus_assignments')
          .update({ is_active: false })
          .in('student_id', selectedStudents);
        
        // Insert new assignments
        const assignmentInserts = selectedStudents.map(studentId => ({
          student_id: studentId,
          bus_id: newRoute.busId || null,
          route_id: savedRoute.id,
          pickup_stop: 'Home',
          dropoff_stop: 'School',
          is_active: true,
        }));
        
        const { error: assignError } = await supabase
          .from('student_bus_assignments')
          .insert(assignmentInserts);
        
        if (assignError) {
          console.error('Error creating student assignments:', assignError);
          toast({
            variant: 'destructive',
            title: language === 'ar' ? 'تحذير' : 'Warning',
            description: language === 'ar' ? 'تم حفظ المسار لكن فشل تعيين بعض الطلاب' : 'Route saved but some student assignments failed',
          });
        }
      }
      
      // Update local state with saved route ID
      newRoute.id = savedRoute.id;
      setRoutes([...routes, newRoute]);
      
      toast({
        variant: 'success',
        title: language === 'ar' ? 'تمت الإضافة بنجاح' : 'Added Successfully',
        description: language === 'ar' ? 'تم إضافة المسار بنجاح' : 'Route has been added successfully',
      });
    } catch (error) {
      console.error('Error saving route:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في حفظ المسار' : 'Failed to save route',
      });
    }
    
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditRoute = async () => {
    if (!selectedRoute) return;
    
    try {
      // Update route in database
      const { error: routeError } = await supabase
        .from('bus_routes')
        .update({
          route_name: formData.name,
          route_name_ar: formData.nameAr,
          bus_id: formData.busId || null,
          stops: JSON.parse(JSON.stringify(stops)),
          is_active: formData.status === 'active',
          morning_schedule: { departure: formData.departureTime, arrival: formData.arrivalTime },
        })
        .eq('id', selectedRoute.id);
      
      if (routeError) throw routeError;
      
      // Update bus with driver and supervisor if bus is assigned
      if (formData.busId) {
        await supabase
          .from('buses')
          .update({
            driver_id: formData.driverId || null,
            supervisor_id: formData.supervisorId || null,
          })
          .eq('id', formData.busId);
        
        // Also update supervisors table if supervisor is assigned
        if (formData.supervisorId) {
          await supabase
            .from('supervisors')
            .update({ bus_id: formData.busId })
            .eq('profile_id', formData.supervisorId);
        }
      }
      
      // Handle student bus assignments
      const previousStudentIds = selectedRoute.studentIds || [];
      const newStudentIds = selectedStudents;
      
      // Students to remove (were assigned but now aren't)
      const studentsToRemove = previousStudentIds.filter(id => !newStudentIds.includes(id));
      
      // Students to add (weren't assigned but now are)
      const studentsToAdd = newStudentIds.filter(id => !previousStudentIds.includes(id));
      
      // Deactivate assignments for removed students
      if (studentsToRemove.length > 0) {
        await supabase
          .from('student_bus_assignments')
          .update({ is_active: false })
          .in('student_id', studentsToRemove)
          .eq('route_id', selectedRoute.id);
      }
      
      // Add new assignments for new students
      if (studentsToAdd.length > 0) {
        // First deactivate any existing active assignments for these students
        await supabase
          .from('student_bus_assignments')
          .update({ is_active: false })
          .in('student_id', studentsToAdd);
        
        // Insert new assignments
        const assignmentInserts = studentsToAdd.map(studentId => ({
          student_id: studentId,
          bus_id: formData.busId || null,
          route_id: selectedRoute.id,
          pickup_stop: 'Home',
          dropoff_stop: 'School',
          is_active: true,
        }));
        
        const { error: assignError } = await supabase
          .from('student_bus_assignments')
          .insert(assignmentInserts);
        
        if (assignError) {
          console.error('Error adding student assignments:', assignError);
        }
      }
      
      // Update existing assignments if bus changed
      if (formData.busId !== selectedRoute.busId) {
        const studentsToUpdate = newStudentIds.filter(id => previousStudentIds.includes(id));
        if (studentsToUpdate.length > 0) {
          await supabase
            .from('student_bus_assignments')
            .update({ bus_id: formData.busId || null })
            .in('student_id', studentsToUpdate)
            .eq('route_id', selectedRoute.id);
        }
      }
      
      // Update local state
      setRoutes(routes.map(r => 
        r.id === selectedRoute.id 
          ? { ...r, ...formData, stops, studentIds: selectedStudents } as Route
          : r
      ));
      
      toast({
        variant: 'success',
        title: language === 'ar' ? 'تم التحديث بنجاح' : 'Updated Successfully',
        description: language === 'ar' ? 'تم تحديث المسار بنجاح' : 'Route has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating route:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحديث المسار' : 'Failed to update route',
      });
    }
    
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDeleteRoute = (id: string) => {
    setRouteToDelete(id);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = async () => {
    if (routeToDelete) {
      try {
        // Delete student assignments for this route
        await supabase
          .from('student_bus_assignments')
          .delete()
          .eq('route_id', routeToDelete);
        
        // Delete route from database
        const { error } = await supabase
          .from('bus_routes')
          .delete()
          .eq('id', routeToDelete);
        
        if (error) throw error;
        
        setRoutes(routes.filter(r => r.id !== routeToDelete));
        setSelectedRoutes(prev => prev.filter(routeId => routeId !== routeToDelete));
        
        toast({
          variant: 'success',
          title: language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted Successfully',
          description: language === 'ar' ? 'تم حذف المسار بنجاح' : 'Route has been deleted successfully',
        });
      } catch (error) {
        console.error('Error deleting route:', error);
        toast({
          variant: 'destructive',
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: language === 'ar' ? 'فشل في حذف المسار' : 'Failed to delete route',
        });
      }
      
      setRouteToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const handleBulkDelete = () => {
    setBulkDeleteConfirmOpen(true);
  };
  
  const confirmBulkDelete = async () => {
    try {
      // Delete student assignments for all selected routes
      await supabase
        .from('student_bus_assignments')
        .delete()
        .in('route_id', selectedRoutes);
      
      // Delete routes from database
      const { error } = await supabase
        .from('bus_routes')
        .delete()
        .in('id', selectedRoutes);
      
      if (error) throw error;
      
      const count = selectedRoutes.length;
      setRoutes(routes.filter(r => !selectedRoutes.includes(r.id)));
      setSelectedRoutes([]);
      
      toast({
        variant: 'success',
        title: language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted Successfully',
        description: language === 'ar' 
          ? `تم حذف ${count} مسار بنجاح` 
          : `${count} routes have been deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting routes:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في حذف المسارات' : 'Failed to delete routes',
      });
    }
    
    setBulkDeleteConfirmOpen(false);
  };

  const toggleRouteSelection = (routeId: string) => {
    setSelectedRoutes(prev =>
      prev.includes(routeId)
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
  };

  const toggleSelectAllRoutes = () => {
    if (selectedRoutes.length === routes.length) {
      setSelectedRoutes([]);
    } else {
      setSelectedRoutes(routes.map(r => r.id));
    }
  };

  const handleViewRoute = (route: Route) => {
    console.log('Opening view dialog for route:', route.id);
    setSelectedRoute(route);
    setIsViewDialogOpen(true);
  };

  const handleOpenEdit = (route: Route) => {
    console.log('Opening edit dialog for route:', route.id);
    setSelectedRoute(route);
    setFormData(route);
    setSelectedStudents(route.studentIds || []);
    setStops(route.stops || []);
    setIsEditDialogOpen(true);
    setIsViewDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({ status: 'active', stops: [], studentIds: [] });
    setSelectedStudents([]);
    setStops([]);
    setNewStop('');
    setSelectedRoute(null);
  };

  const toggleStudentSelection = (studentId: string) => {
    // Check if trying to add (not remove)
    if (!selectedStudents.includes(studentId)) {
      const assignment = getStudentAssignment(studentId);
      if (assignment) {
        const student = students.find(s => s.id === studentId);
        const studentName = student 
          ? (language === 'en' ? `${student.firstName} ${student.lastName}` : `${student.firstNameAr} ${student.lastNameAr}`)
          : '';
        setDuplicateInfo({
          type: 'student',
          name: studentName,
          routeName: assignment.routeName,
          busNumber: assignment.busNumber,
        });
        setDuplicateDialogOpen(true);
        return;
      }
      
      // Auto-add stop based on student's home area
      const student = students.find(s => s.id === studentId);
      if (student?.homeArea) {
        const stopExists = stops.some(stop => {
          const stopName = typeof stop === 'string' ? stop : stop.name;
          return stopName === student.homeArea;
        });
        
        if (!stopExists) {
          const newStopObj: RouteStop = {
            name: student.homeArea,
            name_ar: student.homeAreaAr,
            lat: student.homeLatitude,
            lng: student.homeLongitude,
          };
          setStops(prev => [...prev, newStopObj]);
          toast({
            title: language === 'ar' ? 'تمت إضافة المحطة' : 'Stop Added',
            description: language === 'ar' 
              ? `تمت إضافة "${student.homeAreaAr || student.homeArea}" كمحطة`
              : `"${student.homeArea}" added as a stop`,
          });
        }
      }
    }
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const addStop = () => {
    if (newStop.trim()) {
      setStops([...stops, newStop.trim()]);
      setNewStop('');
    }
  };

  const removeStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const getDriverName = (driverId?: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? (language === 'en' ? driver.name : driver.nameAr) : (language === 'en' ? 'Not Assigned' : 'غير مخصص');
  };

  const getBusNumber = (busId?: string) => {
    const bus = buses.find(b => b.id === busId);
    return bus ? bus.busNumber : (language === 'en' ? 'Not Assigned' : 'غير مخصص');
  };

  const getSupervisorName = (supervisorId?: string) => {
    const supervisor = supervisors.find(s => s.id === supervisorId);
    return supervisor ? (language === 'en' ? supervisor.name : supervisor.nameAr) : (language === 'en' ? 'Not Assigned' : 'غير مخصص');
  };

  // Check if student is already assigned to another route
  const getStudentAssignment = (studentId: string): { routeName: string; busNumber: string } | null => {
    const currentRouteId = selectedRoute?.id;
    for (const route of routes) {
      if (route.id !== currentRouteId && route.studentIds.includes(studentId)) {
        return {
          routeName: language === 'en' ? route.name : route.nameAr,
          busNumber: getBusNumber(route.busId)
        };
      }
    }
    return null;
  };

  // Check if driver is already assigned to another route
  const getDriverAssignment = (driverId: string): { routeName: string; busNumber: string } | null => {
    const currentRouteId = selectedRoute?.id;
    for (const route of routes) {
      if (route.id !== currentRouteId && route.driverId === driverId) {
        return {
          routeName: language === 'en' ? route.name : route.nameAr,
          busNumber: getBusNumber(route.busId)
        };
      }
    }
    return null;
  };

  // Check if supervisor is already assigned to another route
  const getSupervisorAssignment = (supervisorId: string): { routeName: string; busNumber: string } | null => {
    const currentRouteId = selectedRoute?.id;
    for (const route of routes) {
      if (route.id !== currentRouteId && route.supervisorId === supervisorId) {
        return {
          routeName: language === 'en' ? route.name : route.nameAr,
          busNumber: getBusNumber(route.busId)
        };
      }
    }
    return null;
  };

  const getStudentNames = (studentIds: string[]) => {
    const filteredStudents = students.filter(s => studentIds.includes(s.id));
    if (filteredStudents.length === 0) return language === 'en' ? 'No students' : 'لا يوجد طلاب';
    if (filteredStudents.length <= 2) {
      return filteredStudents.map(s => language === 'en' ? `${s.firstName} ${s.lastName}` : `${s.firstNameAr} ${s.lastNameAr}`).join(', ');
    }
    return `${filteredStudents.length} ${language === 'en' ? 'students' : 'طلاب'}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {language === 'en' ? 'Routes Management' : 'إدارة المسارات'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Manage all bus routes' : 'إدارة جميع مسارات الحافلات'}
          </p>
        </div>
        <Button onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Opening Add Route dialog');
          resetForm();
          setIsAddDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          {language === 'en' ? 'Add Route' : 'إضافة مسار'}
        </Button>
      </div>

      {/* Routes List */}
      <div className="grid gap-4">
        {routes.map((route) => (
          <Card 
            key={route.id} 
            className="hover:shadow-lg transition-all cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleViewRoute(route);
            }}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {language === 'en' ? route.name : route.nameAr}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={route.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>
                    {route.status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Bus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{getBusNumber(route.busId)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{route.departureTime} - {route.arrivalTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{route.distance}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{getStudentNames(route.studentIds)}</span>
                </div>
              </div>
              {route.stops && route.stops.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === 'en' ? 'Stops' : 'المحطات'}:
                  </p>
                  <p className="text-sm">{route.stops.map(s => getStopName(s)).join(' → ')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Route Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
        console.log('View dialog open change:', open);
        setIsViewDialogOpen(open);
        if (!open) {
          setSelectedRoute(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{language === 'en' ? 'Route Details' : 'تفاصيل المسار'}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Edit button clicked for route:', selectedRoute?.id);
                    if (selectedRoute) {
                      handleOpenEdit(selectedRoute);
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {language === 'en' ? 'Edit' : 'تعديل'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Delete button clicked for route:', selectedRoute?.id);
                    if (selectedRoute) {
                      handleDeleteRoute(selectedRoute.id);
                      setIsViewDialogOpen(false);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {language === 'en' ? 'Delete' : 'حذف'}
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedRoute && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Route Name' : 'اسم المسار'}</Label>
                  <p className="font-medium">{language === 'en' ? selectedRoute.name : selectedRoute.nameAr}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Status' : 'الحالة'}</Label>
                  <Badge className={selectedRoute.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>
                    {selectedRoute.status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Bus' : 'الحافلة'}</Label>
                  <p className="font-medium">{getBusNumber(selectedRoute.busId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Driver' : 'السائق'}</Label>
                  <p className="font-medium">{getDriverName(selectedRoute.driverId)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Supervisor' : 'المشرف'}</Label>
                  <p className="font-medium">{getSupervisorName(selectedRoute.supervisorId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Distance' : 'المسافة'}</Label>
                  <p className="font-medium">{selectedRoute.distance}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Departure Time' : 'وقت المغادرة'}</Label>
                  <p className="font-medium">{selectedRoute.departureTime}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Arrival Time' : 'وقت الوصول'}</Label>
                  <p className="font-medium">{selectedRoute.arrivalTime}</p>
                </div>
              </div>
              
              {selectedRoute.description && (
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Description' : 'الوصف'}</Label>
                  <p className="font-medium">{selectedRoute.description}</p>
                </div>
              )}
              
              <div>
                <Label className="text-muted-foreground mb-2 block">{language === 'en' ? 'Stops' : 'المحطات'}</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedRoute.stops.map((stop, index) => (
                    <Badge key={index} variant="outline">
                      {getStopName(stop)}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground mb-2 block">
                  {language === 'en' ? 'Students' : 'الطلاب'} ({selectedRoute.studentIds.length})
                </Label>
                <ScrollArea className="h-32 border rounded-md p-3">
                  <div className="space-y-2">
                    {students
                      .filter(s => selectedRoute.studentIds.includes(s.id))
                      .map((student) => (
                        <div key={student.id} className="flex justify-between items-center text-sm">
                          <span>{language === 'en' ? `${student.firstName} ${student.lastName}` : `${student.firstNameAr} ${student.lastNameAr}`}</span>
                          <span className="text-muted-foreground">
                            {student.grade}-{student.class}
                          </span>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Route Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        console.log('Add/Edit dialog open change:', open, 'isEdit:', isEditDialogOpen, 'isAdd:', isAddDialogOpen);
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen 
                ? (language === 'en' ? 'Edit Route' : 'تعديل المسار')
                : (language === 'en' ? 'Add New Route' : 'إضافة مسار جديد')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'en' ? 'Route Name (English)' : 'اسم المسار (إنجليزي)'}</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>{language === 'en' ? 'Route Name (Arabic)' : 'اسم المسار (عربي)'}</Label>
                <Input
                  value={formData.nameAr || ''}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'en' ? 'Departure Time' : 'وقت المغادرة'}</Label>
                <Input
                  type="time"
                  value={formData.departureTime || ''}
                  onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                />
              </div>
              <div>
                <Label>{language === 'en' ? 'Arrival Time' : 'وقت الوصول'}</Label>
                <Input
                  type="time"
                  value={formData.arrivalTime || ''}
                  onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label>{language === 'en' ? 'Distance' : 'المسافة'}</Label>
              <Input
                value={formData.distance || ''}
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                placeholder="e.g., 25 km"
              />
            </div>
            
            <div>
              <Label>{language === 'en' ? 'Description' : 'الوصف'}</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={language === 'en' ? 'Enter route description...' : 'أدخل وصف المسار...'}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{language === 'en' ? 'Assign Bus' : 'تعيين حافلة'}</Label>
                <Select
                  value={formData.busId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, busId: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'en' ? 'Select a bus' : 'اختر حافلة'} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={language === 'en' ? 'Search buses...' : 'البحث عن الحافلات...'}
                          value={busSearch}
                          onChange={(e) => setBusSearch(e.target.value)}
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <SelectItem value="none">
                      {language === 'en' ? 'No Bus' : 'بدون حافلة'}
                    </SelectItem>
                    {buses
                      .filter(bus => 
                        bus.busNumber.toLowerCase().includes(busSearch.toLowerCase())
                      )
                      .map((bus) => (
                        <SelectItem key={bus.id} value={bus.id}>
                          {bus.busNumber}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>{language === 'en' ? 'Assign Driver' : 'تعيين سائق'}</Label>
                <Select
                  value={formData.driverId || 'none'}
                  onValueChange={(value) => {
                    if (value !== 'none') {
                      const assignment = getDriverAssignment(value);
                      if (assignment) {
                        const driver = drivers.find(d => d.id === value);
                        const driverName = driver 
                          ? (language === 'en' ? driver.name : driver.nameAr)
                          : '';
                        setDuplicateInfo({
                          type: 'driver',
                          name: driverName,
                          routeName: assignment.routeName,
                          busNumber: assignment.busNumber,
                        });
                        setDuplicateDialogOpen(true);
                        return;
                      }
                    }
                    setFormData({ ...formData, driverId: value === 'none' ? undefined : value });
                  }}
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
                    {drivers
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
                <Label>{language === 'en' ? 'Assign Supervisor' : 'تعيين مشرف'}</Label>
                <Select
                  value={formData.supervisorId || 'none'}
                  onValueChange={(value) => {
                    if (value !== 'none') {
                      const assignment = getSupervisorAssignment(value);
                      if (assignment) {
                        const supervisor = teachers.find(t => t.id === value);
                        const supervisorName = supervisor 
                          ? (language === 'en' ? supervisor.name : supervisor.nameAr)
                          : '';
                        setDuplicateInfo({
                          type: 'supervisor',
                          name: supervisorName,
                          routeName: assignment.routeName,
                          busNumber: assignment.busNumber,
                        });
                        setDuplicateDialogOpen(true);
                        return;
                      }
                    }
                    setFormData({ ...formData, supervisorId: value === 'none' ? undefined : value });
                  }}
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
                    {teachers
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
            
            {/* Stops Management */}
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Route Stops' : 'محطات المسار'}</Label>
              <div className="flex gap-2">
                <Input
                  value={newStop}
                  onChange={(e) => setNewStop(e.target.value)}
                  placeholder={language === 'en' ? 'Enter stop name' : 'أدخل اسم المحطة'}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addStop();
                    }
                  }}
                />
                <Button type="button" onClick={addStop}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {stops.map((stop, index) => (
                  <Badge key={index} variant="secondary" className="py-1">
                    {getStopName(stop)}
                    <button
                      onClick={() => removeStop(index)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Students Selection */}
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Select Students' : 'اختر الطلاب'}</Label>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {selectedStudents.length} {language === 'en' ? 'students selected' : 'طلاب محددون'}
                </span>
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
              <ScrollArea className="h-48 border rounded-md p-3">
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
                        id={`route-student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudentSelection(student.id)}
                      />
                      <label
                        htmlFor={`route-student-${student.id}`}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={isEditDialogOpen ? handleEditRoute : handleAddRoute}>
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
                ? 'Are you sure you want to delete this route? This action cannot be undone.'
                : 'هل أنت متأكد من حذف هذا المسار؟ لا يمكن التراجع عن هذا الإجراء.'}
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
                ? `Are you sure you want to delete ${selectedRoutes.length} selected routes? This action cannot be undone.`
                : `هل أنت متأكد من حذف ${selectedRoutes.length} مسار محدد؟ لا يمكن التراجع عن هذا الإجراء.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'en' ? 'Cancel' : 'إلغاء'}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'en' ? `Delete ${selectedRoutes.length} Routes` : `حذف ${selectedRoutes.length} مسار`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Assignment Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {language === 'ar' ? 'تعيين مكرر' : 'Duplicate Assignment'}
            </DialogTitle>
          </DialogHeader>
          {duplicateInfo && (
            <div className="space-y-4 py-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-destructive">
                    {duplicateInfo.type === 'student' && (language === 'ar' ? 'الطالب:' : 'Student:')}
                    {duplicateInfo.type === 'driver' && (language === 'ar' ? 'السائق:' : 'Driver:')}
                    {duplicateInfo.type === 'supervisor' && (language === 'ar' ? 'المشرف:' : 'Supervisor:')}
                  </span>
                  <span className="font-bold">{duplicateInfo.name}</span>
                </div>
                
                <div className="border-t border-destructive/20 pt-3 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'معين حالياً في:' : 'Currently assigned to:'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{language === 'ar' ? 'المسار:' : 'Route:'}</span>
                      <span className="font-medium">{duplicateInfo.routeName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bus className="h-4 w-4 text-muted-foreground" />
                      <span>{language === 'ar' ? 'الحافلة:' : 'Bus:'}</span>
                      <span className="font-medium">{duplicateInfo.busNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                {duplicateInfo.type === 'student' && (language === 'ar' 
                  ? 'لا يمكن تعيين الطالب في أكثر من مسار واحد.'
                  : 'A student cannot be assigned to more than one route.')}
                {duplicateInfo.type === 'driver' && (language === 'ar' 
                  ? 'لا يمكن تعيين السائق في أكثر من مسار واحد.'
                  : 'A driver cannot be assigned to more than one route.')}
                {duplicateInfo.type === 'supervisor' && (language === 'ar' 
                  ? 'لا يمكن تعيين المشرف في أكثر من مسار واحد.'
                  : 'A supervisor cannot be assigned to more than one route.')}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDuplicateDialogOpen(false)} className="w-full">
              {language === 'ar' ? 'حسناً' : 'OK'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}