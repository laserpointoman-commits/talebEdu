import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Search, Check, ArrowRight, Camera, X, Users } from 'lucide-react';
import { WHATSAPP_COLORS } from './WhatsAppTheme';
import { UserSearchResult } from '@/hooks/useMessenger';
import { cn } from '@/lib/utils';

interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, memberIds: string[]) => void;
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
  const [step, setStep] = useState<'members' | 'details'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<UserSearchResult[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searching, setSearching] = useState(false);

  const t = (en: string, ar: string) => isArabic ? ar : en;

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

  const toggleMember = (user: UserSearchResult) => {
    setSelectedMembers(prev =>
      prev.some(m => m.id === user.id)
        ? prev.filter(m => m.id !== user.id)
        : [...prev, user]
    );
    setSearchResults(prev => prev.filter(r => r.id !== user.id));
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== userId));
  };

  const handleNext = () => {
    if (selectedMembers.length > 0) {
      setStep('details');
    }
  };

  const handleCreate = () => {
    if (groupName.trim() && selectedMembers.length > 0) {
      onCreate(groupName, groupDescription, selectedMembers.map(m => m.id));
      handleClose();
    }
  };

  const handleClose = () => {
    setStep('members');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedMembers([]);
    setGroupName('');
    setGroupDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-md p-0 border-0 overflow-hidden"
        style={{ backgroundColor: WHATSAPP_COLORS.bg }}
      >
        <DialogHeader 
          className="p-4 border-b"
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
          <>
            {/* Selected members */}
            {selectedMembers.length > 0 && (
              <div 
                className="px-3 py-2 flex flex-wrap gap-2 border-b"
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
                        {member.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                      {member.full_name}
                    </span>
                    <button 
                      className="ml-1 hover:opacity-80"
                      onClick={() => removeMember(member.id)}
                    >
                      <X className="h-4 w-4" style={{ color: WHATSAPP_COLORS.textMuted }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="p-3 border-b" style={{ borderColor: WHATSAPP_COLORS.divider }}>
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

            {/* Search results */}
            <ScrollArea className="h-64">
              <div className="p-2">
                {searching ? (
                  <div className="flex items-center justify-center py-8">
                    <div 
                      className="animate-spin rounded-full h-6 w-6 border-b-2"
                      style={{ borderColor: WHATSAPP_COLORS.accent }}
                    />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => toggleMember(user)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:opacity-80 rounded-lg"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profile_image || undefined} />
                        <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                          {user.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p style={{ color: WHATSAPP_COLORS.textPrimary }}>{user.full_name}</p>
                        <p className="text-xs capitalize" style={{ color: WHATSAPP_COLORS.textMuted }}>
                          {user.role}
                        </p>
                      </div>
                    </button>
                  ))
                ) : searchQuery.length > 0 ? (
                  <p className="text-center py-8" style={{ color: WHATSAPP_COLORS.textMuted }}>
                    {t('No contacts found', 'لم يتم العثور على جهات اتصال')}
                  </p>
                ) : (
                  <p className="text-center py-8" style={{ color: WHATSAPP_COLORS.textMuted }}>
                    {t('Search for contacts to add', 'ابحث عن جهات اتصال لإضافتها')}
                  </p>
                )}
              </div>
            </ScrollArea>

            {/* Next button */}
            {selectedMembers.length > 0 && (
              <div className="p-3 flex justify-end">
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  style={{ backgroundColor: WHATSAPP_COLORS.accent }}
                  onClick={handleNext}
                >
                  <ArrowRight className="h-5 w-5 text-white" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Group details */}
            <div className="p-4 space-y-4">
              {/* Group image placeholder */}
              <div className="flex justify-center">
                <div 
                  className="h-20 w-20 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
                >
                  <Camera className="h-8 w-8" style={{ color: WHATSAPP_COLORS.textMuted }} />
                </div>
              </div>

              {/* Group name */}
              <div>
                <Input
                  placeholder={t('Group name', 'اسم المجموعة')}
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="border-0 border-b rounded-none focus-visible:ring-0"
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
                        {member.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            </div>

            {/* Create button */}
            <div className="p-3 flex justify-end">
              <Button
                size="icon"
                className="h-12 w-12 rounded-full"
                style={{ backgroundColor: WHATSAPP_COLORS.accent }}
                onClick={handleCreate}
                disabled={!groupName.trim()}
              >
                <Check className="h-5 w-5 text-white" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
