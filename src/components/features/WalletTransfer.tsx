import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Send, User, DollarSign, FileText } from 'lucide-react';

export default function WalletTransfer() {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchUsers = async (term: string) => {
    if (term.length < 2) {
      setUsers([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
        .neq('id', currentUser.user?.id)
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error searching users:', error);
      toast.error(language === 'en' ? 'Failed to search users' : language === 'hi' ? 'उपयोगकर्ताओं की खोज विफल' : 'فشل البحث عن المستخدمين');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedUser || !amount || parseFloat(amount) <= 0) {
      toast.error(language === 'en' ? 'Please fill all required fields' : language === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें' : 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('process_wallet_transfer', {
        p_to_user_id: selectedUser.id,
        p_amount: parseFloat(amount),
        p_notes: notes || null
      });

      if (error) throw error;

      toast.success(
        language === 'en' 
          ? `Successfully transferred ${amount} OMR to ${selectedUser.full_name}` 
          : language === 'hi'
          ? `${selectedUser.full_name} को ${amount} OMR सफलतापूर्वक ट्रांसफर किया गया`
          : `تم تحويل ${amount} ر.ع بنجاح إلى ${selectedUser.full_name}`
      );

      // Reset form
      setSelectedUser(null);
      setAmount('');
      setNotes('');
      setSearchTerm('');
      setUsers([]);
      setOpen(false);

      // Trigger a refresh of wallet balance
      window.dispatchEvent(new CustomEvent('wallet-update'));
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast.error(
        error.message || (language === 'en' ? 'Transfer failed' : language === 'hi' ? 'ट्रांसफर विफल' : 'فشل التحويل')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Send className="h-4 w-4" />
          {language === 'en' ? 'Transfer Money' : language === 'hi' ? 'पैसे ट्रांसफर करें' : 'تحويل الأموال'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {language === 'en' ? 'Transfer Money' : language === 'hi' ? 'पैसे ट्रांसफर करें' : 'تحويل الأموال'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en' 
              ? 'Send money to another user\'s wallet' 
              : language === 'hi'
              ? 'किसी अन्य उपयोगकर्ता के वॉलेट में पैसे भेजें'
              : 'إرسال الأموال إلى محفظة مستخدم آخر'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {language === 'en' ? 'Recipient' : language === 'hi' ? 'प्राप्तकर्ता' : 'المستلم'}
            </Label>
            <Input
              placeholder={language === 'en' ? 'Search by name or email...' : language === 'hi' ? 'नाम या ईमेल से खोजें...' : 'البحث بالاسم أو البريد الإلكتروني...'}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchUsers(e.target.value);
              }}
            />
            
            {/* Search Results */}
            {users.length > 0 && !selectedUser && (
              <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setSearchTerm(user.full_name);
                      setUsers([]);
                    }}
                    className="w-full text-left p-3 hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected User */}
            {selectedUser && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{selectedUser.full_name}</div>
                      <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedUser(null);
                        setSearchTerm('');
                      }}
                    >
                      {language === 'en' ? 'Change' : language === 'hi' ? 'बदलें' : 'تغيير'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {language === 'en' ? 'Amount (OMR)' : language === 'hi' ? 'राशि (OMR)' : 'المبلغ (ر.ع)'}
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              dir="ltr"
              className="number-display"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {language === 'en' ? 'Notes (Optional)' : language === 'hi' ? 'नोट्स (वैकल्पिक)' : 'ملاحظات (اختياري)'}
            </Label>
            <Textarea
              placeholder={language === 'en' ? 'Add a note...' : language === 'hi' ? 'एक नोट जोड़ें...' : 'أضف ملاحظة...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {language === 'en' ? 'Cancel' : language === 'hi' ? 'रद्द करें' : 'إلغاء'}
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={loading || !selectedUser || !amount}
            >
              {loading
                ? (language === 'en' ? 'Processing...' : language === 'hi' ? 'प्रोसेस हो रहा है...' : 'جاري المعالجة...')
                : (language === 'en' ? 'Transfer' : language === 'hi' ? 'ट्रांसफर' : 'تحويل')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}