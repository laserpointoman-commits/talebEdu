import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, UserCircle } from 'lucide-react';
import { getMessengerColors } from './MessengerThemeColors';
import { useMessengerTheme } from '@/contexts/MessengerThemeContext';

interface Contact {
  id: string;
  full_name: string;
  profile_image: string | null;
  role: string;
}

interface MessengerContactsProps {
  onSelectContact: (contact: Contact) => void;
  isArabic?: boolean;
}

export function MessengerContacts({ onSelectContact, isArabic }: MessengerContactsProps) {
  const { user, profile } = useAuth();
  const { isDark } = useMessengerTheme();
  const colors = getMessengerColors(isDark);
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const currentRole = profile?.role;

      // Admin can see ALL registered accounts
      if (currentRole === 'admin') {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, profile_image, role')
          .neq('id', user.id)
          .order('full_name', { ascending: true });
        
        setContacts(data || []);
      }
      // Teacher can see: admins, other teachers, and parents whose kids are in their classes
      else if (currentRole === 'teacher') {
        // Get teacher record to find assigned classes
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id')
          .eq('profile_id', user.id)
          .single();

        // Get classes assigned to this teacher
        const { data: assignedClasses } = await supabase
          .from('classes')
          .select('id')
          .eq('class_teacher_id', teacherData?.id || '');

        const classIds = assignedClasses?.map(c => c.id) || [];

        // Get students in those classes
        const { data: studentsInClasses } = classIds.length > 0 
          ? await supabase
              .from('students')
              .select('parent_id')
              .in('class_id', classIds)
          : { data: [] };

        const parentIds = [...new Set(studentsInClasses?.map(s => s.parent_id).filter(Boolean) || [])];

        // Get admins and teachers
        const { data: adminsAndTeachers } = await supabase
          .from('profiles')
          .select('id, full_name, profile_image, role')
          .neq('id', user.id)
          .in('role', ['admin', 'teacher'])
          .order('full_name', { ascending: true });

        // Get parents whose kids are in teacher's classes
        let relevantParents: Contact[] = [];
        if (parentIds.length > 0) {
          const { data: parentsData } = await supabase
            .from('profiles')
            .select('id, full_name, profile_image, role')
            .in('id', parentIds)
            .order('full_name', { ascending: true });
          
          relevantParents = (parentsData || []) as Contact[];
        }

        // Combine results and remove duplicates
        const allContacts = [...(adminsAndTeachers || []), ...relevantParents];
        const uniqueContacts = Array.from(
          new Map(allContacts.map(item => [item.id, item])).values()
        );

        setContacts(uniqueContacts as Contact[]);
      }
      // Default for other roles
      else {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, profile_image, role')
          .neq('id', user.id)
          .not('role', 'in', '(device,school_gate)')
          .order('full_name', { ascending: true });
        
        setContacts(data || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [user, profile?.role]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const filteredContacts = contacts.filter(contact =>
    contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group contacts by role
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const role = contact.role || 'other';
    if (!acc[role]) acc[role] = [];
    acc[role].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  const roleLabels: Record<string, { en: string; ar: string }> = {
    admin: { en: 'Administrators', ar: 'المسؤولون' },
    teacher: { en: 'Teachers', ar: 'المعلمون' },
    parent: { en: 'Parents', ar: 'أولياء الأمور' },
    supervisor: { en: 'Supervisors', ar: 'المشرفون' },
    driver: { en: 'Drivers', ar: 'السائقون' },
    finance: { en: 'Finance', ar: 'المالية' },
    canteen: { en: 'Canteen', ar: 'المقصف' },
    other: { en: 'Others', ar: 'آخرون' },
  };

  const roleOrder = ['admin', 'teacher', 'parent', 'supervisor', 'driver', 'finance', 'canteen', 'other'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.accent }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="px-4 py-3 shrink-0" style={{ backgroundColor: colors.bgSecondary }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.textMuted }} />
          <Input
            placeholder={isArabic ? 'البحث في جهات الاتصال...' : 'Search contacts...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-0 rounded-xl h-10"
            style={{ backgroundColor: colors.inputBg, color: colors.textPrimary }}
          />
        </div>
      </div>

      {/* Contacts Count */}
      <div className="px-4 py-2 shrink-0" style={{ backgroundColor: colors.bgSecondary }}>
        <p className="text-sm" style={{ color: colors.textMuted }}>
          {filteredContacts.length} {isArabic ? 'جهة اتصال' : 'contacts'}
        </p>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        {roleOrder.map((role) => {
          const roleContacts = groupedContacts[role];
          if (!roleContacts || roleContacts.length === 0) return null;

          return (
            <div key={role}>
              {/* Role Header */}
              <div 
                className="sticky top-0 px-4 py-2 text-xs font-semibold uppercase tracking-wider z-10"
                style={{ backgroundColor: colors.bgTertiary, color: colors.textMuted }}
              >
                {roleLabels[role]?.[isArabic ? 'ar' : 'en'] || role}
              </div>

              {/* Contacts in this role */}
              {roleContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors active:bg-white/10 hover:bg-white/5"
                  style={{ borderBottom: `1px solid ${colors.divider}` }}
                  onClick={() => onSelectContact(contact)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={contact.profile_image || undefined} />
                    <AvatarFallback style={{ backgroundColor: colors.accent }}>
                      {contact.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: colors.textPrimary }}>
                      {contact.full_name}
                    </p>
                    <Badge 
                      variant="secondary" 
                      className="text-xs capitalize mt-0.5"
                      style={{ backgroundColor: colors.bgTertiary, color: colors.textSecondary }}
                    >
                      {contact.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {/* Empty state */}
        {filteredContacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div 
              className="h-20 w-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: colors.bgTertiary }}
            >
              <UserCircle className="h-10 w-10" style={{ color: colors.textMuted }} />
            </div>
            <p className="text-center" style={{ color: colors.textSecondary }}>
              {searchTerm 
                ? (isArabic ? 'لم يتم العثور على جهات اتصال' : 'No contacts found')
                : (isArabic ? 'لا توجد جهات اتصال' : 'No contacts available')}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
