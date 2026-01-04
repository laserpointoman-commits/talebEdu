import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserPlus, X, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  first_name_ar: string | null;
  last_name_ar: string | null;
  grade: string;
  class: string;
}

interface BusStudentAssignmentProps {
  busId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function BusStudentAssignment({ busId, isOpen, onClose, onSave }: BusStudentAssignmentProps) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && busId) {
      loadData();
    }
  }, [isOpen, busId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all approved students
      const { data: students } = await supabase
        .from('students')
        .select('id, first_name, last_name, first_name_ar, last_name_ar, grade, class')
        .eq('approval_status', 'approved')
        .order('first_name');

      setAllStudents(students || []);

      // Load current assignments for this bus
      const { data: assignments } = await supabase
        .from('student_bus_assignments')
        .select('student_id')
        .eq('bus_id', busId)
        .eq('is_active', true);

      setAssignedStudents(assignments?.map(a => a.student_id) || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setAssignedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const saveAssignments = async () => {
    setSaving(true);
    try {
      // Deactivate all current assignments for this bus
      await supabase
        .from('student_bus_assignments')
        .update({ is_active: false })
        .eq('bus_id', busId);

      // Create new assignments
      if (assignedStudents.length > 0) {
        const assignments = assignedStudents.map(studentId => ({
          student_id: studentId,
          bus_id: busId,
          pickup_stop: 'To be assigned',
          dropoff_stop: 'To be assigned',
          is_active: true
        }));

        const { error } = await supabase
          .from('student_bus_assignments')
          .insert(assignments);
        
        if (error && error.code !== '23505') { // Ignore duplicate key errors
          throw error;
        }
      }

      toast.success(language === 'ar' ? 'تم حفظ التعيينات' : 'Assignments saved');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast.error(language === 'ar' ? 'فشل حفظ التعيينات' : 'Failed to save assignments');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = allStudents.filter(student => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const fullNameAr = `${student.first_name_ar || ''} ${student.last_name_ar || ''}`.toLowerCase();
    return fullName.includes(query) || fullNameAr.includes(query) || 
           student.grade.toLowerCase().includes(query) || 
           student.class.toLowerCase().includes(query);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'تعيين الطلاب للحافلة' : 'Assign Students to Bus'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'ar' ? 'بحث عن طالب...' : 'Search for student...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected Count */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {assignedStudents.length} {language === 'ar' ? 'طالب محدد' : 'students selected'}
            </Badge>
            {assignedStudents.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setAssignedStudents([])}>
                <X className="h-4 w-4 mr-1" />
                {language === 'ar' ? 'مسح الكل' : 'Clear all'}
              </Button>
            )}
          </div>

          {/* Student List */}
          <ScrollArea className="h-[400px] border rounded-lg">
            <div className="p-2 space-y-1">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  {language === 'ar' ? 'لا يوجد طلاب' : 'No students found'}
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const isAssigned = assignedStudents.includes(student.id);
                  const studentName = language === 'ar' 
                    ? `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`
                    : `${student.first_name} ${student.last_name}`;

                  return (
                    <div
                      key={student.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isAssigned ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleStudent(student.id)}
                    >
                      <Checkbox checked={isAssigned} />
                      <div className="flex-1">
                        <p className="font-medium">{studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.grade} - {student.class}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={saveAssignments} disabled={saving}>
            <UserPlus className="mr-2 h-4 w-4" />
            {saving 
              ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
              : (language === 'ar' ? 'حفظ التعيينات' : 'Save Assignments')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}