import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Search, Check, ArrowRight, ArrowLeft, Camera, X, Users, Loader2 } from 'lucide-react';
import { WHATSAPP_COLORS } from './WhatsAppTheme';
import { UserSearchResult } from '@/hooks/useMessenger';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, memberIds: string[], imageUrl?: string) => void;
  searchUsers: (query: string) => Promise<UserSearchResult[]>;
  isArabic?: boolean;
}

export function CreateGroupDialog({
  open,
  onClose,
  onCreate,
  searchUsers,
  isArabic = false
}: CreateGroupDialogProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'members' | 'details'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [initialContacts, setInitialContacts] = useState<UserSearchResult[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<UserSearchResult[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupImage, setGroupImage] = useState<string | null>(null);
  const [groupImageFile, setGroupImageFile] = useState<File | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [creating, setCreating] = useState(false);

  const t = (en: string, ar: string) => isArabic ? ar : en;

  // Load initial contacts when dialog opens
  useEffect(() => {
    const loadInitialContacts = async () => {
      if (!open || !user) return;
      
      setLoadingContacts(true);
      try {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const currentRole = currentProfile?.role;
        let contacts: UserSearchResult[] = [];

        if (currentRole === 'admin') {
          const { data } = await supabase
            .from('profiles')
            .select('id, full_name, profile_image, role')
            .neq('id', user.id)
            .neq('role', 'bus_attendance')
            .neq('role', 'school_attendance')
            .order('full_name')
            .limit(50);
          contacts = (data || []) as UserSearchResult[];
        } else if (currentRole === 'teacher') {
          const { data } = await supabase
            .from('profiles')
            .select('id, full_name, profile_image, role')
            .neq('id', user.id)
            .in('role', ['admin', 'teacher'])
            .order('full_name')
            .limit(50);
          contacts = (data || []) as UserSearchResult[];
        } else {
          const { data } = await supabase
            .from('profiles')
            .select('id, full_name, profile_image, role')
            .neq('id', user.id)
            .neq('role', 'bus_attendance')
            .neq('role', 'school_attendance')
            .order('full_name')
            .limit(50);
          contacts = (data || []) as UserSearchResult[];
        }

        setInitialContacts(contacts);
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        setLoadingContacts(false);
      }
    };

    loadInitialContacts();
  }, [open, user]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    const results = await searchUsers(query);
    setSearchResults(results.filter(r => !selectedMembers.some(m => m.id === r.id)));
    setSearching(false);
  };

  const displayedContacts = searchQuery.trim().length >= 2 
    ? searchResults 
    : initialContacts.filter(c => !selectedMembers.some(m => m.id === c.id));

  const toggleMember = (contact: UserSearchResult) => {
    setSelectedMembers(prev =>
      prev.some(m => m.id === contact.id)
        ? prev.filter(m => m.id !== contact.id)
        : [...prev, contact]
    );
    setSearchResults(prev => prev.filter(r => r.id !== contact.id));
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== userId));
  };

  const handleNext = () => {
    if (selectedMembers.length > 0) {
      setStep('details');
    }
  };

  const handleBack = () => {
    setStep('members');
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('Image must be less than 5MB', 'يجب أن تكون الصورة أقل من 5 ميجابايت'));
        return;
      }
      setGroupImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setGroupImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadGroupImage = async (): Promise<string | null> => {
    if (!groupImageFile || !user) return null;
    
    try {
      const fileExt = groupImageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('group-images')
        .upload(fileName, groupImageFile);
      
      if (uploadError) {
        console.error('Error uploading group image:', uploadError);
        return null;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('group-images')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    
    setCreating(true);
    try {
      let imageUrl: string | undefined;
      
      if (groupImageFile) {
        const uploadedUrl = await uploadGroupImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      await onCreate(groupName, groupDescription, selectedMembers.map(m => m.id), imageUrl);
      toast.success(t('Group created successfully', 'تم إنشاء المجموعة بنجاح'));
      handleClose();
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error(t('Failed to create group', 'فشل في إنشاء المجموعة'));
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setStep('members');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedMembers([]);
    setGroupName('');
    setGroupDescription('');
    setGroupImage(null);
    setGroupImageFile(null);
    setInitialContacts([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <DialogContent 
        className="max-w-md p-0 border-0 overflow-hidden z-[9999] flex flex-col max-h-[90vh]"
        style={{ backgroundColor: WHATSAPP_COLORS.bg }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        <DialogHeader 
          className="p-4 border-b shrink-0"
          style={{ borderColor: WHATSAPP_COLORS.divider, backgroundColor: WHATSAPP_COLORS.headerBg }}
        >
          <DialogTitle style={{ color: WHATSAPP_COLORS.textPrimary }}>
            {step === 'members' 
              ? t('Add group participants', 'إضافة أعضاء المجموعة')
              : t('New group', 'مجموعة جديدة')
            }
          </DialogTitle>
        </DialogHeader>

        {step === 'members' ? (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Selected members */}
            {selectedMembers.length > 0 && (
              <div 
                className="px-3 py-2 flex flex-wrap gap-2 border-b shrink-0"
                style={{ borderColor: WHATSAPP_COLORS.divider }}
              >
                {selectedMembers.map(member => (
                  <div 
                    key={member.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-full"
                    style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.profile_image || undefined} />
                      <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent, fontSize: '10px' }}>
                        {(member.full_name?.charAt(0) || '?').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                      {member.full_name || 'Unknown'}
                    </span>
                    <button 
                      className="ml-1 hover:opacity-80"
                      onClick={() => removeMember(member.id)}
                      type="button"
                    >
                      <X className="h-4 w-4" style={{ color: WHATSAPP_COLORS.textMuted }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="p-3 border-b shrink-0" style={{ borderColor: WHATSAPP_COLORS.divider }}>
              <div className="relative">
                <Search 
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" 
                  style={{ color: WHATSAPP_COLORS.textMuted }} 
                />
                <Input
                  placeholder={t('Search contacts', 'البحث في جهات الاتصال')}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 border-0"
                  style={{ 
                    backgroundColor: WHATSAPP_COLORS.inputBg, 
                    color: WHATSAPP_COLORS.textPrimary 
                  }}
                />
              </div>
            </div>

            {/* Contacts list */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-2">
                {(searching || loadingContacts) ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 
                      className="h-6 w-6 animate-spin"
                      style={{ color: WHATSAPP_COLORS.accent }}
                    />
                  </div>
                ) : displayedContacts.length > 0 ? (
                  displayedContacts.map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => toggleMember(contact)}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2 hover:opacity-80 rounded-lg"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.profile_image || undefined} />
                        <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                          {((contact.full_name?.charAt(0) || '?').toUpperCase())}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p style={{ color: WHATSAPP_COLORS.textPrimary }}>{contact.full_name || t('Unknown', 'غير معروف')}</p>
                        <p className="text-xs capitalize" style={{ color: WHATSAPP_COLORS.textMuted }}>
                          {contact.role}
                        </p>
                      </div>
                      {selectedMembers.some(m => m.id === contact.id) && (
                        <Check className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
                      )}
                    </button>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <p className="text-center py-8" style={{ color: WHATSAPP_COLORS.textMuted }}>
                    {t('No contacts found', 'لم يتم العثور على جهات اتصال')}
                  </p>
                ) : (
                  <p className="text-center py-8" style={{ color: WHATSAPP_COLORS.textMuted }}>
                    {t('No contacts available', 'لا توجد جهات اتصال متاحة')}
                  </p>
                )}
              </div>
            </ScrollArea>

            {/* Bottom navigation - LTR fixed */}
            <div 
              className="p-3 border-t flex items-center justify-between shrink-0"
              style={{ borderColor: WHATSAPP_COLORS.divider, backgroundColor: WHATSAPP_COLORS.headerBg }}
              dir="ltr"
            >
              <Button
                variant="ghost"
                className="h-12 px-6 rounded-full"
                style={{ color: WHATSAPP_COLORS.textSecondary }}
                onClick={handleClose}
                type="button"
              >
                {t('Cancel', 'إلغاء')}
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: WHATSAPP_COLORS.textMuted }}>
                  {selectedMembers.length} {t('selected', 'محدد')}
                </span>
                <Button
                  className="h-12 px-6 rounded-full"
                  style={{ 
                    backgroundColor: selectedMembers.length > 0 ? WHATSAPP_COLORS.accent : WHATSAPP_COLORS.bgTertiary,
                    color: selectedMembers.length > 0 ? 'white' : WHATSAPP_COLORS.textMuted
                  }}
                  onClick={handleNext}
                  disabled={selectedMembers.length === 0}
                  type="button"
                >
                  {t('Next', 'التالي')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Group details content */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 space-y-4">
                {/* Group image */}
                <div className="flex justify-center">
                  <button
                    onClick={handleImageSelect}
                    type="button"
                    className="h-24 w-24 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 relative overflow-hidden"
                    style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
                  >
                    {groupImage ? (
                      <img src={groupImage} alt="Group" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-8 w-8" style={{ color: WHATSAPP_COLORS.textMuted }} />
                    )}
                    <div 
                      className="absolute bottom-0 left-0 right-0 py-1 text-xs text-center"
                      style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
                    >
                      {t('Add photo', 'إضافة صورة')}
                    </div>
                  </button>
                </div>

                {/* Group name */}
                <div>
                  <Input
                    placeholder={t('Group name', 'اسم المجموعة')}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="border-0 border-b rounded-none focus-visible:ring-0 text-base"
                    style={{ 
                      backgroundColor: 'transparent', 
                      color: WHATSAPP_COLORS.textPrimary,
                      borderColor: WHATSAPP_COLORS.divider
                    }}
                  />
                </div>

                {/* Group description */}
                <div>
                  <Textarea
                    placeholder={t('Group description (optional)', 'وصف المجموعة (اختياري)')}
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="border-0 rounded-lg resize-none"
                    rows={3}
                    style={{ 
                      backgroundColor: WHATSAPP_COLORS.inputBg, 
                      color: WHATSAPP_COLORS.textPrimary
                    }}
                  />
                </div>

                {/* Members preview */}
                <div>
                  <p className="text-sm mb-2" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                    {t('Participants:', 'المشاركون:')} {selectedMembers.length}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map(member => (
                      <Avatar key={member.id} className="h-10 w-10">
                        <AvatarImage src={member.profile_image || undefined} />
                        <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                          {(member.full_name?.charAt(0) || '?').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Bottom navigation - LTR fixed */}
            <div 
              className="p-3 border-t flex items-center justify-between shrink-0"
              style={{ borderColor: WHATSAPP_COLORS.divider, backgroundColor: WHATSAPP_COLORS.headerBg }}
              dir="ltr"
            >
              <Button
                variant="ghost"
                className="h-12 px-6 rounded-full"
                style={{ color: WHATSAPP_COLORS.textSecondary }}
                onClick={handleBack}
                type="button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('Back', 'رجوع')}
              </Button>
              
              <Button
                className="h-12 px-6 rounded-full"
                style={{ 
                  backgroundColor: groupName.trim() ? WHATSAPP_COLORS.accent : WHATSAPP_COLORS.bgTertiary,
                  color: groupName.trim() ? 'white' : WHATSAPP_COLORS.textMuted
                }}
                onClick={handleCreate}
                disabled={!groupName.trim() || creating}
                type="button"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {t('Create', 'إنشاء')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}