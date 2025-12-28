import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Check, Send } from 'lucide-react';
import { useMessengerTheme } from '@/contexts/MessengerThemeContext';
import { getMessengerColors } from './MessengerThemeColors';
import { Conversation, GroupChat } from '@/hooks/useMessenger';
import { cn } from '@/lib/utils';

interface ForwardDialogProps {
  open: boolean;
  onClose: () => void;
  onForward: (recipientIds: string[]) => void;
  conversations: Conversation[];
  groups: GroupChat[];
  messagePreview: string;
  isArabic?: boolean;
}

export function ForwardDialog({
  open,
  onClose,
  onForward,
  conversations,
  groups,
  messagePreview,
  isArabic = false
}: ForwardDialogProps) {
  const { isDark } = useMessengerTheme();
  const colors = getMessengerColors(isDark);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const t = (en: string, ar: string) => isArabic ? ar : en;

  const filteredConversations = conversations.filter(c =>
    c.recipient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleForward = () => {
    if (selectedIds.length > 0) {
      onForward(selectedIds);
      setSelectedIds([]);
      setSearchQuery('');
      onClose();
    }
  };

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setSearchQuery('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md p-0 border-0 overflow-hidden z-[250]"
        style={{ backgroundColor: colors.bg }}
      >
        <DialogHeader 
          className="p-4 border-b"
          style={{ borderColor: colors.divider, backgroundColor: colors.headerBg }}
        >
          <DialogTitle style={{ color: colors.textPrimary }}>
            {t('Forward to...', 'إعادة توجيه إلى...')}
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="p-3 border-b" style={{ borderColor: colors.divider }}>
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" 
              style={{ color: colors.textMuted }} 
            />
            <Input
              placeholder={t('Search contacts and groups', 'البحث في جهات الاتصال والمجموعات')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-0"
              style={{ 
                backgroundColor: colors.inputBg, 
                color: colors.textPrimary 
              }}
            />
          </div>
        </div>

        {/* Selected chips */}
        {selectedIds.length > 0 && (
          <div 
            className="px-3 py-2 flex flex-wrap gap-2 border-b"
            style={{ borderColor: colors.divider }}
          >
            {selectedIds.map(id => {
              const conv = conversations.find(c => c.recipient_id === id);
              const group = groups.find(g => g.id === id);
              const name = conv?.recipient_name || group?.name || 'Unknown';
              
              return (
                <div 
                  key={id}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-sm"
                  style={{ backgroundColor: colors.accent }}
                >
                  <span className="text-white">{name}</span>
                  <button 
                    className="ml-1 hover:opacity-80"
                    onClick={() => toggleSelection(id)}
                  >
                    <span className="text-white">×</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Message preview */}
        <div 
          className="mx-3 mt-3 p-2 rounded-lg border-l-4"
          style={{ 
            backgroundColor: colors.bgTertiary,
            borderLeftColor: colors.accent
          }}
        >
          <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
            {messagePreview}
          </p>
        </div>

        {/* Contacts list */}
        <ScrollArea className="h-64">
          <div className="p-2">
            {/* Groups */}
            {filteredGroups.length > 0 && (
              <>
                <p 
                  className="text-xs font-medium px-3 py-2"
                  style={{ color: colors.accent }}
                >
                  {t('Groups', 'المجموعات')}
                </p>
                {filteredGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => toggleSelection(group.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:opacity-80 rounded-lg"
                    style={{ 
                      backgroundColor: selectedIds.includes(group.id) 
                        ? colors.bgTertiary 
                        : 'transparent'
                    }}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={group.image_url || undefined} />
                      <AvatarFallback style={{ backgroundColor: colors.accent }}>
                        {group.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-left" style={{ color: colors.textPrimary }}>
                      {group.name}
                    </span>
                    {selectedIds.includes(group.id) && (
                      <div 
                        className="h-5 w-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colors.accent }}
                      >
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </>
            )}

            {/* Contacts */}
            {filteredConversations.length > 0 && (
              <>
                <p 
                  className="text-xs font-medium px-3 py-2 mt-2"
                  style={{ color: colors.accent }}
                >
                  {t('Contacts', 'جهات الاتصال')}
                </p>
                {filteredConversations.map(conv => (
                  <button
                    key={conv.recipient_id}
                    onClick={() => toggleSelection(conv.recipient_id)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:opacity-80 rounded-lg"
                    style={{ 
                      backgroundColor: selectedIds.includes(conv.recipient_id) 
                        ? colors.bgTertiary 
                        : 'transparent'
                    }}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conv.recipient_image || undefined} />
                      <AvatarFallback style={{ backgroundColor: colors.accent }}>
                        {conv.recipient_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-left" style={{ color: colors.textPrimary }}>
                      {conv.recipient_name}
                    </span>
                    {selectedIds.includes(conv.recipient_id) && (
                      <div 
                        className="h-5 w-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colors.accent }}
                      >
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Forward button */}
        {selectedIds.length > 0 && (
          <div className="p-3 flex justify-end">
            <Button
              className="rounded-full px-6"
              style={{ backgroundColor: colors.accent }}
              onClick={handleForward}
            >
              <Send className="h-4 w-4 mr-2" />
              {t('Forward', 'إعادة توجيه')} ({selectedIds.length})
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
