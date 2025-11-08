import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import LogoLoader from '@/components/LogoLoader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Search, Users, CreditCard, Calendar, RefreshCw, CheckCircle, XCircle, Edit, Trash2, Mail, Share2, MessageSquare, Printer, Eye, EyeOff, Ban, UserCheck, Lock, Key, Wifi, ExternalLink, Link2, Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import NfcProgramming from '@/components/features/NfcProgramming';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  full_name_ar?: string;
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'driver' | 'developer' | 'finance' | 'canteen' | 'school_attendance' | 'bus_attendance';
  phone?: string;
  address?: string;
  created_at: string;
  linked_entity_id?: string;
  linked_entity_type?: 'student' | 'teacher' | 'driver';
  is_active: boolean; // Now required and will default to true
  last_password?: string; // For developer mode only
}

export default function UserManagement() {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const isDeveloper = profile?.role === 'developer';
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [viewPasswordUserId, setViewPasswordUserId] = useState<string | null>(null);
  const [shareData, setShareData] = useState<{email: string, password: string, fullName: string, role: string} | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isResendDialogOpen, setIsResendDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<UserProfile | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('none');
  const [entityDropdownOpen, setEntityDropdownOpen] = useState(false);
  const [entitySearchQuery, setEntitySearchQuery] = useState('');
  const [userPasswords, setUserPasswords] = useState<{[key: string]: string}>({});
  const [isNfcDialogOpen, setIsNfcDialogOpen] = useState(false);
  const [selectedUserForNfc, setSelectedUserForNfc] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    full_name_ar: '',
    role: 'student' as UserProfile['role'],
    phone: '',
    address: '',
    is_active: true,
  });

  useEffect(() => {
    fetchUsers();
    fetchStudents();
    fetchTeachers();
    fetchDrivers();
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type the data properly, handling the linked_entity_type field
      const typedData = (data || []).map(user => ({
        ...user,
        linked_entity_type: user.linked_entity_type as 'student' | 'teacher' | 'driver' | undefined,
        is_active: (user as any).is_active !== false // Default to true if not set
      })) as UserProfile[];
      
      setUsers(typedData);

      // Password storage removed for security - passwords should never be stored client-side
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          profiles:profiles!students_profile_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched students:', data);
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          *,
          profiles:profiles!teachers_profile_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched teachers:', data);
      setTeachers(data || []);
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to fetch teachers');
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          profiles:profiles!drivers_profile_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched drivers:', data);
      setDrivers(data || []);
    } catch (error: any) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to fetch drivers');
    }
  };

  const generateEmailFromName = (fullName: string): string => {
    // Remove special characters and convert to lowercase
    const cleanName = fullName
      .toLowerCase()
      .replace(/[^a-z\s]/gi, '')
      .replace(/\s+/g, '.');
    
    return `${cleanName}@talebedu.com`;
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();
      
      return !error && !!data;
    } catch {
      return false;
    }
  };

  const generateUniqueEmail = async (fullName: string): Promise<string> => {
    let baseEmail = generateEmailFromName(fullName);
    let finalEmail = baseEmail;
    let counter = 1;

    // Check if base email exists, if so, add numbers
    while (await checkEmailExists(finalEmail)) {
      const [emailPart, domain] = baseEmail.split('@');
      finalEmail = `${emailPart}${counter}@${domain}`;
      counter++;
    }

    return finalEmail;
  };

  const handleShareCredentials = (email: string, password: string, fullName: string, role: string) => {
    setShareData({ email, password, fullName, role });
    setIsShareDialogOpen(true);
  };

  const handleResendRegistration = (user: UserProfile) => {
    setSelectedParent(user);
    setIsResendDialogOpen(true);
  };

  const getRegistrationLink = async (parentEmail: string): Promise<string | null> => {
    try {
      // First get the parent's profile ID
      const { data: parentProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', parentEmail)
        .single();

      if (!parentProfile) {
        toast.error(language === 'en' ? 'Parent not found' : 'لم يتم العثور على ولي الأمر');
        return null;
      }

      const { data: tokenData, error: tokenError } = await supabase
        .from('parent_registration_tokens')
        .select('token, expires_at')
        .eq('parent_id', parentProfile.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let registrationToken = tokenData?.token;

      if (!registrationToken || tokenError) {
        const newToken = crypto.randomUUID().replace(/-/g, '');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const { error: insertError } = await supabase
          .from('parent_registration_tokens')
          .insert({
            parent_id: parentProfile.id,
            token: newToken,
            expires_at: expiresAt.toISOString(),
          });

        if (insertError) throw insertError;
        registrationToken = newToken;
      }

      return `${window.location.origin}/parent-registration?token=${registrationToken}`;
    } catch (error) {
      console.error('Error getting registration link:', error);
      toast.error(language === 'en' ? 'Failed to generate registration link' : 'فشل في إنشاء رابط التسجيل');
      return null;
    }
  };

  const sendRegistrationEmail = async () => {
    if (!selectedParent) return;

    try {
      const registrationLink = await getRegistrationLink(selectedParent.email);
      if (!registrationLink) return;

      // Extract token from the registration link
      const urlParams = new URLSearchParams(registrationLink.split('?')[1]);
      const token = urlParams.get('token');

      if (!token) {
        toast.error(language === 'en' ? 'Invalid token' : 'رمز غير صالح');
        return;
      }

      const { error } = await supabase.functions.invoke('send-parent-invitation', {
        body: {
          parentEmail: selectedParent.email,
          parentName: selectedParent.full_name,
          token: token,
          loginEmail: selectedParent.email,
          loginPassword: userPasswords[selectedParent.id] || 'Not available',
        },
      });

      if (error) throw error;

      toast.success(language === 'en' ? 'Registration email sent successfully' : 'تم إرسال بريد التسجيل بنجاح');
      setIsResendDialogOpen(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(language === 'en' ? 'Failed to send registration email' : 'فشل في إرسال بريد التسجيل');
    }
  };

  const sendViaWhatsApp = async () => {
    if (!selectedParent) return;

    const registrationLink = await getRegistrationLink(selectedParent.email);
    if (!registrationLink) return;

    const message = `Hello ${selectedParent.full_name},\n\nYou have been invited to register your student.\n\nRegistration Link: ${registrationLink}\n\nThank you!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setIsResendDialogOpen(false);
  };

  const copyRegistrationLink = async () => {
    if (!selectedParent) return;

    const registrationLink = await getRegistrationLink(selectedParent.email);
    if (!registrationLink) return;

    try {
      await navigator.clipboard.writeText(registrationLink);
      toast.success(language === 'en' ? 'Registration link copied to clipboard' : 'تم نسخ رابط التسجيل');
      setIsResendDialogOpen(false);
    } catch (error) {
      toast.error(language === 'en' ? 'Failed to copy link' : 'فشل في نسخ الرابط');
    }
  };

  const handleNfcProgramming = async (user: UserProfile) => {
    try {
      // Get the NFC ID from the teacher or student record
      let nfcId = '';
      let entityId = '';
      
      if (user.role === 'teacher') {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('id, nfc_id, employee_id')
          .eq('profile_id', user.id)
          .single();
        
        if (teacher) {
          nfcId = teacher.nfc_id || '';
          entityId = teacher.employee_id;
        }
      } else if (user.role === 'student') {
        const { data: student } = await supabase
          .from('students')
          .select('id, nfc_id, student_id')
          .eq('profile_id', user.id)
          .single();
        
        if (student) {
          nfcId = student.nfc_id || '';
          entityId = student.student_id;
        }
      }
      
      setSelectedUserForNfc({
        id: user.id,
        name: user.full_name,
        nameAr: user.full_name_ar,
        role: user.role,
        nfcId: nfcId,
        email: user.email,
        entityId: entityId
      });
      setIsNfcDialogOpen(true);
    } catch (error) {
      console.error('Error fetching NFC data:', error);
      toast.error(language === 'en' ? 'Failed to fetch NFC data' : 'فشل في جلب بيانات NFC');
    }
  };

  const handleNfcSuccess = async (nfcId: string) => {
    if (!selectedUserForNfc) return;
    
    try {
      // Update the NFC ID in the database
      if (selectedUserForNfc.role === 'teacher') {
        await supabase
          .from('teachers')
          .update({ nfc_id: nfcId })
          .eq('profile_id', selectedUserForNfc.id);
      } else if (selectedUserForNfc.role === 'student') {
        await supabase
          .from('students')
          .update({ nfc_id: nfcId })
          .eq('profile_id', selectedUserForNfc.id);
      }
      
      toast.success(
        language === 'en' 
          ? 'NFC card programmed successfully!' 
          : 'تم برمجة بطاقة NFC بنجاح!'
      );
      
      setIsNfcDialogOpen(false);
      setSelectedUserForNfc(null);
    } catch (error) {
      console.error('Error updating NFC ID:', error);
      toast.error(language === 'en' ? 'Failed to update NFC ID' : 'فشل في تحديث معرف NFC');
    }
  };

  const shareViaEmail = async () => {
    if (!shareData || !recipientEmail) {
      toast.error(language === 'en' ? 'Please enter recipient email' : 'يرجى إدخال البريد الإلكتروني للمستلم');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('send-credentials', {
        body: {
          email: shareData.email,
          password: shareData.password,
          fullName: shareData.fullName,
          role: shareData.role,
          recipientEmail: recipientEmail,
          language: language
        }
      });

      if (error) throw error;

      toast.success(language === 'en' ? 'Credentials sent via email!' : 'تم إرسال بيانات الاعتماد عبر البريد الإلكتروني!');
      setIsShareDialogOpen(false);
      setRecipientEmail('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const shareViaWhatsApp = () => {
    if (!shareData) return;
    
    const message = language === 'en' 
      ? `🎓 TalebEdu Login Credentials\n\nHello ${shareData.fullName}!\n\nYour account has been created:\n📧 Email: ${shareData.email}\n🔑 Password: ${shareData.password}\n👤 Role: ${shareData.role}\n\n🌐 Login at: https://b9b768f5-1a7c-4563-ab9c-d1b25b963f4b.lovableproject.com/auth\n\n⚠️ Please change your password after first login for security.`
      : `🎓 بيانات تسجيل الدخول TalebEdu\n\nمرحباً ${shareData.fullName}!\n\nتم إنشاء حسابك:\n📧 البريد الإلكتروني: ${shareData.email}\n🔑 كلمة المرور: ${shareData.password}\n👤 الدور: ${shareData.role}\n\n🌐 تسجيل الدخول: https://b9b768f5-1a7c-4563-ab9c-d1b25b963f4b.lovableproject.com/auth\n\n⚠️ يرجى تغيير كلمة المرور بعد أول تسجيل دخول للأمان.`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setIsShareDialogOpen(false);
  };

  const shareViaSMS = () => {
    if (!shareData) return;
    
    const message = language === 'en'
      ? `TalebEdu Login: Email: ${shareData.email}, Password: ${shareData.password}, Role: ${shareData.role}. Login: https://b9b768f5-1a7c-4563-ab9c-d1b25b963f4b.lovableproject.com/auth`
      : `تسجيل دخول TalebEdu: البريد: ${shareData.email}، كلمة المرور: ${shareData.password}، الدور: ${shareData.role}. الرابط: https://b9b768f5-1a7c-4563-ab9c-d1b25b963f4b.lovableproject.com/auth`;
    
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
    setIsShareDialogOpen(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.id }
      });

      if (error) throw error;

      toast.success(
        language === 'en' 
          ? 'User deleted successfully' 
          : 'تم حذف المستخدم بنجاح'
      );
      
      // Refresh users list
      fetchUsers();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(
        language === 'en' 
          ? `Failed to delete user: ${error.message}` 
          : `فشل في حذف المستخدم: ${error.message}`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteUser = (user: UserProfile) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const printCredentials = () => {
    if (!shareData) return;
    
    const printContent = `
      <html>
        <head>
          <title>${language === 'en' ? 'Login Credentials' : 'بيانات تسجيل الدخول'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; ${language === 'ar' ? 'direction: rtl;' : ''} }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .credentials { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; color: #333; }
            .value { background: white; padding: 8px; border-radius: 4px; margin-left: 10px; font-family: monospace; }
            .footer { margin-top: 40px; text-align: center; color: #666; border-top: 1px solid #ccc; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎓 ${language === 'en' ? 'TalebEdu System' : 'نظام TalebEdu'}</h1>
            <h2>${language === 'en' ? 'Login Credentials' : 'بيانات تسجيل الدخول'}</h2>
          </div>
          
          <div class="credentials">
            <h3>${language === 'en' ? 'Account Information for:' : 'معلومات الحساب لـ:'} ${shareData.fullName}</h3>
            
            <div class="field">
              <span class="label">${language === 'en' ? 'Email:' : 'البريد الإلكتروني:'}</span>
              <span class="value">${shareData.email}</span>
            </div>
            
            <div class="field">
              <span class="label">${language === 'en' ? 'Password:' : 'كلمة المرور:'}</span>
              <span class="value">${shareData.password}</span>
            </div>
            
            <div class="field">
              <span class="label">${language === 'en' ? 'Role:' : 'الدور:'}</span>
              <span class="value">${shareData.role}</span>
            </div>
          </div>
          
          <div style="margin: 30px 0; padding: 20px; background: #fff3cd; border-radius: 8px;">
            <h4>${language === 'en' ? '🌐 Login URL:' : '🌐 رابط تسجيل الدخول:'}</h4>
            <p style="font-family: monospace; background: white; padding: 10px; border-radius: 4px;">
              https://b9b768f5-1a7c-4563-ab9c-d1b25b963f4b.lovableproject.com/auth
            </p>
          </div>
          
          <div style="margin: 30px 0; padding: 20px; background: #f8d7da; border-radius: 8px; color: #721c24;">
            <h4>⚠️ ${language === 'en' ? 'Security Notice' : 'تنبيه أمني'}</h4>
            <p>${language === 'en' 
              ? 'Please change your password after first login for security reasons.' 
              : 'يرجى تغيير كلمة المرور بعد أول تسجيل دخول لأسباب أمنية.'}</p>
          </div>
          
          <div class="footer">
            <p>${language === 'en' ? 'Generated on:' : 'تم الإنشاء في:'} ${new Date().toLocaleString()}</p>
            <p>${language === 'en' ? 'TalebEdu - School Management System' : 'TalebEdu - نظام إدارة المدرسة'}</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
    setIsShareDialogOpen(false);
  };

  const handleGenerateEmail = async () => {
    if (!formData.full_name.trim()) {
      toast.error(
        language === 'en' 
          ? 'Please enter a full name first' 
          : 'يرجى إدخال الاسم الكامل أولاً'
      );
      return;
    }

    try {
      const email = await generateUniqueEmail(formData.full_name);
      setFormData({ ...formData, email });
      toast.success(
        language === 'en' 
          ? 'Email generated successfully' 
          : 'تم إنشاء البريد الإلكتروني بنجاح'
      );
    } catch (error) {
      toast.error(
        language === 'en' 
          ? 'Failed to generate email' 
          : 'فشل في إنشاء البريد الإلكتروني'
      );
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  // Filter entities based on search query
  const getFilteredEntities = () => {
    const searchLower = entitySearchQuery.toLowerCase();
    
    if (formData.role === 'student') {
      return students.filter(s => {
        const fullName = s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim();
        const nameMatch = fullName && fullName.toLowerCase().includes(searchLower);
        const idMatch = s.student_id && s.student_id.toLowerCase().includes(searchLower);
        const classMatch = s.class && s.class.toLowerCase().includes(searchLower);
        return nameMatch || idMatch || classMatch;
      });
    } else if (formData.role === 'teacher') {
      return teachers.filter(t => {
        let nameMatch = false;
        
        // Check profiles first
        if (t.profiles) {
          const profileName = t.profiles.full_name || t.profiles.email || '';
          nameMatch = profileName.toLowerCase().includes(searchLower);
        }
        
        // Check employees if no match in profiles
        if (!nameMatch && t.employees) {
          const employeeName = `${t.employees.first_name || ''} ${t.employees.last_name || ''}`.trim();
          nameMatch = employeeName.toLowerCase().includes(searchLower);
        }
        
        const idMatch = t.employee_id && t.employee_id.toLowerCase().includes(searchLower);
        return nameMatch || idMatch;
      });
    } else if (formData.role === 'driver') {
      return drivers.filter(d => {
        let nameMatch = false;
        
        // Check profiles first
        if (d.profiles) {
          const profileName = d.profiles.full_name || d.profiles.email || '';
          nameMatch = profileName.toLowerCase().includes(searchLower);
        }
        
        // Check employees if no match in profiles
        if (!nameMatch && d.employees) {
          const employeeName = `${d.employees.first_name || ''} ${d.employees.last_name || ''}`.trim();
          nameMatch = employeeName.toLowerCase().includes(searchLower);
        }
        
        const idMatch = d.employee_id && d.employee_id.toLowerCase().includes(searchLower);
        const licenseMatch = d.license_number && d.license_number.toLowerCase().includes(searchLower);
        return nameMatch || idMatch || licenseMatch;
      });
    }
    return [];
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    // Get stored password for developer mode
    const storedPassword = isDeveloper && userPasswords[user.id] ? userPasswords[user.id] : '';
    console.log('Editing user:', user.email, 'Stored password:', storedPassword); // Debug log
    setFormData({
      email: user.email,
      password: storedPassword,
      full_name: user.full_name,
      full_name_ar: user.full_name_ar || '',
      role: user.role,
      phone: user.phone || '',
      address: user.address || '',
      is_active: user.is_active !== false,
    });
    setShowEditPassword(false); // Reset password visibility
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setLoading(true);
    try {
      // Update profile
      const profileUpdate: any = {
        full_name: formData.full_name,
        full_name_ar: formData.full_name_ar,
        role: formData.role,
        phone: formData.phone,
        address: formData.address,
      };

      // Add is_active field for developer mode
      if (isDeveloper) {
        (profileUpdate as any).is_active = formData.is_active;
      }

      const { error } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', editingUser.id);

      if (error) throw error;

      // Update password if provided and in developer mode
      if (formData.password && isDeveloper) {
        // Update password via edge function
        const { error: passwordError } = await supabase.functions.invoke('update-user-password', {
          body: {
            userId: editingUser.id,
            newPassword: formData.password
          }
        });

        if (!passwordError) {
          // Store password in memory for current session only (not persisted to localStorage)
          const updatedPasswords = { ...userPasswords, [editingUser.id]: formData.password };
          setUserPasswords(updatedPasswords);
        } else {
          console.error('Password update error:', passwordError);
        }
      }

      toast.success(
        language === 'en' ? 'User updated successfully!' : 'تم تحديث المستخدم بنجاح!'
      );

      setIsEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingUser) {
        toast.error(
          language === 'en' 
            ? `A user with email ${formData.email} already exists (Role: ${existingUser.role}). Please use a different email.`
            : `المستخدم بالبريد الإلكتروني ${formData.email} موجود بالفعل (الدور: ${existingUser.role}). يرجى استخدام بريد إلكتروني آخر.`
        );
        setLoading(false);
        return;
      }

      // Use the edge function to create user - this handles teachers properly
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          role: formData.role,
          full_name: formData.full_name,
          full_name_ar: formData.full_name_ar,
          phone: formData.phone,
          parent_user_id: selectedEntityId && selectedEntityId !== 'none' && formData.role === 'student' ? selectedEntityId : null
        }
      });

      if (error) {
        console.error('User creation error:', error);
        throw new Error(error.message || 'Failed to create user');
      }

      if (!data || !data.userId) {
        throw new Error('User creation failed - no user ID returned');
      }

      // Store password in memory for current session only (not persisted to localStorage)
      if (isDeveloper) {
        const updatedPasswords = { ...userPasswords, [data.userId]: formData.password };
        setUserPasswords(updatedPasswords);
      }

      // Handle teacher class assignments
      if (formData.role === 'teacher' && selectedClasses.length > 0) {
        // Get the teacher record
        const { data: teacher } = await supabase
          .from('teachers')
          .select('id')
          .eq('profile_id', data.userId)
          .single();

        if (teacher) {
          // Assign classes to teacher
          const classAssignments = selectedClasses.map(classId => ({
            teacher_id: teacher.id,
            class_id: classId
          }));

          const { error: assignError } = await supabase
            .from('teacher_classes')
            .insert(classAssignments);

          if (assignError) console.error('Error assigning classes:', assignError);
        }
      }

      // Handle parent-student linking
      if (formData.role === 'parent' && selectedEntityId && selectedEntityId !== 'none') {
        // Update the student's parent_id
        const { error: studentUpdateError } = await supabase
          .from('students')
          .update({ parent_id: data.userId })
          .eq('id', selectedEntityId);

        if (studentUpdateError) {
          console.error('Error linking parent to student:', studentUpdateError);
          toast.error(
            language === 'en' 
              ? 'Failed to link parent to student' 
              : 'فشل في ربط ولي الأمر بالطالب'
          );
        }
      }

      toast.success(
        language === 'en'
          ? 'User created successfully! Billing: 10 OMR per semester'
          : 'تم إنشاء المستخدم بنجاح! الفوترة: 10 ريال عماني لكل فصل دراسي'
      );

      // Show share options for the newly created user
      handleShareCredentials(formData.email, formData.password, formData.full_name, formData.role);

      setIsCreateDialogOpen(false);
      fetchUsers();
      resetForm();
      setSelectedClasses([]);
    } catch (error: any) {
      console.error('Full error details:', error);
      
      // Handle specific error messages
      let errorMessage = error.message || 'Failed to create user';
      
      if (errorMessage.includes('already been registered')) {
        errorMessage = language === 'en'
          ? `This email is already registered. Please use a different email or contact the administrator.`
          : `هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد إلكتروني آخر أو الاتصال بالمسؤول.`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive } as any)
        .eq('id', userId);

      if (error) throw error;

      toast.success(
        language === 'en' 
          ? `User ${!isActive ? 'activated' : 'deactivated'} successfully`
          : `تم ${!isActive ? 'تفعيل' : 'إلغاء تفعيل'} المستخدم بنجاح`
      );

      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      full_name_ar: '',
      role: 'student',
      phone: '',
      address: '',
      is_active: true,
    });
    setSelectedRoles([]);
    setSelectedEntityId('none');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      case 'parent': return 'bg-purple-100 text-purple-800';
      case 'driver': return 'bg-yellow-100 text-yellow-800';
      case 'finance': return 'bg-emerald-100 text-emerald-800';
      case 'canteen': return 'bg-orange-100 text-orange-800';
      case 'developer': return 'bg-gray-100 text-gray-800';
      case 'school_attendance': return 'bg-cyan-100 text-cyan-800';
      case 'bus_attendance': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const activeUsersCount = users.filter(u => u.is_active !== false).length;
  const inactiveUsersCount = users.filter(u => u.is_active === false).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'en' ? 'User Management' : 'إدارة المستخدمين'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Manage system users and permissions' : 'إدارة مستخدمي النظام والصلاحيات'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/admin/parent-invitations'}
          >
            <Mail className="mr-2 h-4 w-4" />
            {language === 'en' ? 'Parent Invitations' : 'دعوات أولياء الأمور'}
          </Button>
          <Button onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            {language === 'en' ? 'Create User' : 'إنشاء مستخدم'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Total Users' : 'إجمالي المستخدمين'}
                </p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Active Users' : 'المستخدمون النشطون'}
                </p>
                <p className="text-2xl font-bold">{activeUsersCount}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Inactive Users' : 'المستخدمون غير النشطين'}
                </p>
                <p className="text-2xl font-bold">{inactiveUsersCount}</p>
              </div>
              <Ban className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Billing (10 OMR/user)' : 'الفوترة (10 ريال/مستخدم)'}
                </p>
                <p className="text-2xl font-bold">{users.length * 10} OMR</p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="mx-3 md:mx-0">
        <CardHeader className="p-3 md:p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
            <CardTitle className="text-base md:text-xl">{language === 'en' ? 'Users List' : 'قائمة المستخدمين'}</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'en' ? 'Search...' : 'بحث...'}
                  className="pl-7 md:pl-8 w-full sm:w-48 md:w-64 text-xs md:text-sm h-8 md:h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  dir="ltr"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full sm:w-32 md:w-40 h-8 md:h-10 text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'en' ? 'All Roles' : 'جميع الأدوار'}</SelectItem>
                  <SelectItem value="admin">{language === 'en' ? 'Admin' : 'مدير'}</SelectItem>
                  <SelectItem value="teacher">{language === 'en' ? 'Teacher' : 'معلم'}</SelectItem>
                  <SelectItem value="student">{language === 'en' ? 'Student' : 'طالب'}</SelectItem>
                  <SelectItem value="parent">{language === 'en' ? 'Parent' : 'ولي أمر'}</SelectItem>
                  <SelectItem value="driver">{language === 'en' ? 'Driver' : 'سائق'}</SelectItem>
                  <SelectItem value="finance">{language === 'en' ? 'Finance' : 'مالية'}</SelectItem>
                  <SelectItem value="canteen">{language === 'en' ? 'Canteen' : 'مقصف'}</SelectItem>
                  <SelectItem value="school_attendance">{language === 'en' ? 'School Attendance' : 'حضور المدرسة'}</SelectItem>
                  <SelectItem value="bus_attendance">{language === 'en' ? 'Bus Attendance' : 'حضور الحافلة'}</SelectItem>
                  {isDeveloper && <SelectItem value="developer">Developer</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {/* Mobile View - Cards */}
          <div className="md:hidden">
            <div className="divide-y">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge className={cn("text-[10px] ml-2 flex-shrink-0", getRoleColor(user.role))}>{user.role}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant={user.is_active !== false ? "default" : "secondary"} className="text-[10px]">
                      {user.is_active !== false ? (language === 'en' ? 'Active' : 'نشط') : (language === 'en' ? 'Inactive' : 'غير نشط')}
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditUser(user)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {(user.role === 'teacher' || user.role === 'student') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleNfcProgramming(user)}
                          className="h-7 w-7 p-0"
                        >
                          <Wifi className="h-3 w-3" />
                        </Button>
                      )}
                      {isDeveloper && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleUserStatus(user.id, user.is_active !== false)}
                          className="h-7 w-7 p-0"
                        >
                          {user.is_active !== false ? <Ban className="h-3 w-3 text-red-500" /> : <UserCheck className="h-3 w-3 text-green-500" />}
                        </Button>
                      )}
                      {userPasswords[user.id] && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleShareCredentials(user.email, userPasswords[user.id], user.full_name, user.role)}
                          className="h-7 w-7 p-0"
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => confirmDeleteUser(user)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {isDeveloper && userPasswords[user.id] && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <span className="text-[10px] text-muted-foreground">Pass:</span>
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          type={viewPasswordUserId === user.id ? "text" : "password"}
                          value={userPasswords[user.id] || '••••••••'}
                          readOnly
                          className="h-6 text-[10px] flex-1"
                          dir="ltr"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewPasswordUserId(viewPasswordUserId === user.id ? null : user.id)}
                          className="h-6 w-6 p-0"
                        >
                          {viewPasswordUserId === user.id ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block overflow-x-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className={`p-3 md:p-4 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs md:text-sm font-medium`}>{language === 'en' ? 'Name' : 'الاسم'}</th>
                  <th className={`p-3 md:p-4 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs md:text-sm font-medium`}>{language === 'en' ? 'Email' : 'البريد الإلكتروني'}</th>
                  {isDeveloper && (
                    <th className={`p-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{language === 'en' ? 'Password' : 'كلمة المرور'}</th>
                  )}
                  <th className={`p-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{language === 'en' ? 'Role' : 'الدور'}</th>
                  <th className={`p-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{language === 'en' ? 'Status' : 'الحالة'}</th>
                  <th className={`p-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{language === 'en' ? 'Actions' : 'الإجراءات'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">{user.full_name}</td>
                    <td className="p-4">{user.email}</td>
                    {isDeveloper && (
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Input
                            type={viewPasswordUserId === user.id ? "text" : "password"}
                            value={userPasswords[user.id] || '••••••••'}
                            readOnly
                            className="w-32"
                            dir="ltr"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewPasswordUserId(viewPasswordUserId === user.id ? null : user.id)}
                          >
                            {viewPasswordUserId === user.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    )}
                    <td className="p-4">
                      <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.is_active !== false ? "default" : "secondary"}>
                        {user.is_active !== false ? (language === 'en' ? 'Active' : 'نشط') : (language === 'en' ? 'Inactive' : 'غير نشط')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditUser(user)}
                          title={language === 'en' ? 'Edit' : 'تعديل'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {(user.role === 'teacher' || user.role === 'student') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleNfcProgramming(user)}
                            title={language === 'en' ? 'Program NFC Card' : 'برمجة بطاقة NFC'}
                          >
                            <Wifi className="h-4 w-4" />
                          </Button>
                        )}
                        {isDeveloper && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleUserStatus(user.id, user.is_active !== false)}
                          >
                            {user.is_active !== false ? <Ban className="h-4 w-4 text-red-500" /> : <UserCheck className="h-4 w-4 text-green-500" />}
                          </Button>
                        )}
                        {userPasswords[user.id] && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleShareCredentials(user.email, userPasswords[user.id], user.full_name, user.role)}
                            title={language === 'en' ? 'Share Credentials' : 'مشاركة بيانات الدخول'}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        )}
                        {user.role === 'parent' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResendRegistration(user)}
                            title={language === 'en' ? 'Resend Registration Link' : 'إعادة إرسال رابط التسجيل'}
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => confirmDeleteUser(user)}
                          title={language === 'en' ? 'Delete User' : 'حذف المستخدم'}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleUpdateUser}>
            <DialogHeader>
              <DialogTitle>{language === 'en' ? 'Edit User' : 'تعديل المستخدم'}</DialogTitle>
              <DialogDescription>
                {language === 'en' ? 'Update user information' : 'تحديث معلومات المستخدم'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Full Name' : 'الاسم الكامل'}</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Full Name (Arabic)' : 'الاسم الكامل (بالعربية)'}</Label>
                  <Input
                    value={formData.full_name_ar}
                    onChange={(e) => setFormData({ ...formData, full_name_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === 'en' ? 'Email' : 'البريد الإلكتروني'}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="bg-muted"
                />
              </div>

              {isDeveloper && (
                <>
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Password' : 'كلمة المرور'}</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showEditPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={language === 'en' ? 'Enter new password or leave empty' : 'أدخل كلمة مرور جديدة أو اتركها فارغة'}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                        >
                          {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button type="button" variant="outline" onClick={generatePassword}>
                        {language === 'en' ? 'Generate' : 'إنشاء'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <Label>{language === 'en' ? 'Account Status' : 'حالة الحساب'}</Label>
                      <div className="text-sm text-muted-foreground">
                        {language === 'en' 
                          ? 'Deactivating will prevent user from logging in' 
                          : 'إلغاء التفعيل سيمنع المستخدم من تسجيل الدخول'}
                      </div>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Phone' : 'الهاتف'}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Role' : 'الدور'}</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserProfile['role'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{language === 'en' ? 'Admin' : 'مدير'}</SelectItem>
                      <SelectItem value="teacher">{language === 'en' ? 'Teacher' : 'معلم'}</SelectItem>
                      <SelectItem value="student">{language === 'en' ? 'Student' : 'طالب'}</SelectItem>
                      <SelectItem value="parent">{language === 'en' ? 'Parent' : 'ولي أمر'}</SelectItem>
                      <SelectItem value="driver">{language === 'en' ? 'Driver' : 'سائق'}</SelectItem>
                      <SelectItem value="finance">{language === 'en' ? 'Finance' : 'مالية'}</SelectItem>
                      <SelectItem value="canteen">{language === 'en' ? 'Canteen' : 'مقصف'}</SelectItem>
                      <SelectItem value="school_attendance">{language === 'en' ? 'School Attendance' : 'حضور المدرسة'}</SelectItem>
                      <SelectItem value="bus_attendance">{language === 'en' ? 'Bus Attendance' : 'حضور الحافلة'}</SelectItem>
                      {isDeveloper && <SelectItem value="developer">Developer</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === 'en' ? 'Address' : 'العنوان'}</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {language === 'en' ? 'Cancel' : 'إلغاء'}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="mr-2 inline-flex">
                    <LogoLoader size="small" text={false} />
                  </div>
                ) : null}
                {language === 'en' ? 'Update User' : 'تحديث المستخدم'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Share Credentials' : 'مشاركة بيانات الدخول'}</DialogTitle>
            <DialogDescription>
              {language === 'en' ? 'Share user credentials via email, WhatsApp, SMS, or print.' : 'مشاركة بيانات المستخدم عبر البريد الإلكتروني، واتساب، الرسائل النصية، أو الطباعة.'}
            </DialogDescription>
          </DialogHeader>

          {shareData && (
            <div className="space-y-4">
              <div>
                <p><strong>{language === 'en' ? 'Email:' : 'البريد الإلكتروني:'}</strong> {shareData.email}</p>
                <p><strong>{language === 'en' ? 'Password:' : 'كلمة المرور:'}</strong> {shareData.password}</p>
                <p><strong>{language === 'en' ? 'Role:' : 'الدور:'}</strong> {shareData.role}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientEmail">{language === 'en' ? 'Recipient Email' : 'البريد الإلكتروني للمستلم'}</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder={language === 'en' ? 'Enter recipient email' : 'أدخل البريد الإلكتروني للمستلم'}
                />
              </div>

              <div className="flex justify-between">
                <Button onClick={shareViaEmail}>{language === 'en' ? 'Send Email' : 'إرسال بريد'}</Button>
                <Button onClick={shareViaWhatsApp}>{language === 'en' ? 'WhatsApp' : 'واتساب'}</Button>
                <Button onClick={shareViaSMS}>{language === 'en' ? 'SMS' : 'رسالة نصية'}</Button>
                <Button onClick={printCredentials}>{language === 'en' ? 'Print' : 'طباعة'}</Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              {language === 'en' ? 'Close' : 'إغلاق'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
            <DialogTitle>{language === 'en' ? 'Create User' : 'إنشاء مستخدم'}</DialogTitle>
            <DialogDescription>
              {language === 'en' ? 'Fill in the details to create a new user' : 'املأ التفاصيل لإنشاء مستخدم جديد'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateUser} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              <div className="space-y-4">
                {/* Role Selection - MOVED TO TOP */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">{language === 'en' ? 'Select Role' : 'اختر الدور'}</Label>
                  <Select value={formData.role} onValueChange={(value) => {
                    setFormData({ ...formData, role: value as UserProfile['role'] });
                    setSelectedEntityId('none'); // Reset entity selection when role changes
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={language === 'en' ? 'Choose a role...' : 'اختر دور...'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{language === 'en' ? 'Admin' : 'مدير'}</SelectItem>
                      <SelectItem value="teacher">{language === 'en' ? 'Teacher' : 'معلم'}</SelectItem>
                      <SelectItem value="student">{language === 'en' ? 'Student' : 'طالب'}</SelectItem>
                      <SelectItem value="parent">{language === 'en' ? 'Parent' : 'ولي أمر'}</SelectItem>
                      <SelectItem value="driver">{language === 'en' ? 'Driver' : 'سائق'}</SelectItem>
                      <SelectItem value="finance">{language === 'en' ? 'Finance' : 'مالية'}</SelectItem>
                      <SelectItem value="canteen">{language === 'en' ? 'Canteen' : 'مقصف'}</SelectItem>
                      <SelectItem value="school_attendance">{language === 'en' ? 'School Attendance' : 'حضور المدرسة'}</SelectItem>
                      <SelectItem value="bus_attendance">{language === 'en' ? 'Bus Attendance' : 'حضور الحافلة'}</SelectItem>
                      {isDeveloper && <SelectItem value="developer">Developer</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Class Selection for Teachers */}
                {formData.role === 'teacher' && (
                  <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="text-purple-900 dark:text-purple-100 font-semibold text-base">
                        {language === 'en' ? '📚 Assign Classes' : '📚 تعيين الفصول'}
                      </Label>
                      <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900">
                        {language === 'en' ? 'Required' : 'مطلوب'}
                      </Badge>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {language === 'en' 
                        ? 'Select the classes this teacher will be teaching'
                        : 'حدد الفصول التي سيدرسها هذا المعلم'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-white dark:bg-gray-900 rounded-lg">
                      {classes.map((cls) => (
                        <div key={cls.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`class-${cls.id}`}
                            checked={selectedClasses.includes(cls.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedClasses([...selectedClasses, cls.id]);
                              } else {
                                setSelectedClasses(selectedClasses.filter(id => id !== cls.id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`class-${cls.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {cls.name} - {language === 'en' ? `Grade ${cls.grade}` : `الصف ${cls.grade}`}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Full Name' : 'الاسم الكامل'}</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Full Name (Arabic)' : 'الاسم الكامل (بالعربية)'}</Label>
                    <Input
                      value={formData.full_name_ar}
                      onChange={(e) => setFormData({ ...formData, full_name_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Email' : 'البريد الإلكتروني'}</Label>
                  <div className="flex gap-2">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value})}
                    required
                    dir="ltr"
                  />
                    <Button type="button" onClick={handleGenerateEmail}>
                      {language === 'en' ? 'Generate' : 'إنشاء'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Password (min 8 characters)' : 'كلمة المرور (8 أحرف على الأقل)'}</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={8}
                      maxLength={100}
                      dir="ltr"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button type="button" variant="outline" onClick={generatePassword}>
                      {language === 'en' ? 'Generate' : 'إنشاء'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Phone' : 'الهاتف'}</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Address' : 'العنوان'}</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>


              </div>
            </div>

            <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-background">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {language === 'en' ? 'Cancel' : 'إلغاء'}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="mr-2 inline-flex">
                    <LogoLoader size="small" text={false} />
                  </div>
                ) : null}
                {language === 'en' ? 'Create User' : 'إنشاء مستخدم'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* NFC Programming Dialog */}
      {selectedUserForNfc && (
        <NfcProgramming
          isOpen={isNfcDialogOpen}
          onClose={() => {
            setIsNfcDialogOpen(false);
            setSelectedUserForNfc(null);
          }}
          userData={selectedUserForNfc}
          onSuccess={handleNfcSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {language === 'en' ? 'Delete User' : 'حذف المستخدم'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Are you sure you want to delete this user? This action cannot be undone and will permanently remove all associated data.' 
                : 'هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء وسيؤدي إلى إزالة جميع البيانات المرتبطة نهائياً.'}
            </DialogDescription>
          </DialogHeader>
          
          {userToDelete && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{language === 'en' ? 'Name:' : 'الاسم:'}</span>
                  <span>{userToDelete.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{language === 'en' ? 'Email:' : 'البريد:'}</span>
                  <span>{userToDelete.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{language === 'en' ? 'Role:' : 'الدور:'}</span>
                  <Badge className={getRoleColor(userToDelete.role)}>{userToDelete.role}</Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting 
                ? (language === 'en' ? 'Deleting...' : 'جاري الحذف...') 
                : (language === 'en' ? 'Delete User' : 'حذف المستخدم')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resend Registration Link Dialog */}
      <Dialog open={isResendDialogOpen} onOpenChange={setIsResendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Resend Registration Link' : 'إعادة إرسال رابط التسجيل'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === 'en' 
                ? `Send registration link to ${selectedParent?.full_name} (${selectedParent?.email})`
                : `إرسال رابط التسجيل إلى ${selectedParent?.full_name} (${selectedParent?.email})`
              }
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={sendRegistrationEmail}
                className="w-full justify-start"
                variant="outline"
              >
                <Mail className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Send via Email' : 'إرسال عبر البريد الإلكتروني'}
              </Button>
              <Button
                onClick={sendViaWhatsApp}
                className="w-full justify-start"
                variant="outline"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Send via WhatsApp' : 'إرسال عبر واتساب'}
              </Button>
              <Button
                onClick={copyRegistrationLink}
                className="w-full justify-start"
                variant="outline"
              >
                <Copy className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Copy Link' : 'نسخ الرابط'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
