import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Wallet,
  Save,
  ArrowDownToLine,
  Zap,
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LogoLoader from '@/components/LogoLoader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AllowanceSettings {
  id?: string;
  auto_deduct_on_entry: boolean;
  entry_allowance_amount: number;
}

export default function StudentWalletControl() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [studentWalletBalance, setStudentWalletBalance] = useState(0);
  const [parentWalletBalance, setParentWalletBalance] = useState(0);
  const [transferAmount, setTransferAmount] = useState('');
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [settings, setSettings] = useState<AllowanceSettings>({
    auto_deduct_on_entry: false,
    entry_allowance_amount: 1.000
  });

  useEffect(() => {
    if (studentId && user) {
      loadData();
    }
  }, [studentId, user]);

  const loadData = async () => {
    try {
      // Verify parent owns this student
      const { data: studentData, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .eq('parent_id', user?.id)
        .single();

      if (error || !studentData) {
        navigate('/dashboard');
        return;
      }

      setStudent(studentData);

      // Load student wallet balance
      const { data: studentWallet } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', studentId)
        .maybeSingle();
      
      setStudentWalletBalance(studentWallet?.balance || 0);

      // Load parent wallet balance
      const { data: parentWallet } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      setParentWalletBalance(parentWallet?.balance || 0);

      // Load existing allowance settings
      const { data: existingSettings } = await supabase
        .from('allowance_settings')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (existingSettings) {
        setSettings({
          id: existingSettings.id,
          auto_deduct_on_entry: existingSettings.auto_deduct_on_entry || false,
          entry_allowance_amount: existingSettings.entry_allowance_amount || 1.000
        });
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsData = {
        student_id: studentId,
        parent_id: user?.id,
        auto_deduct_on_entry: settings.auto_deduct_on_entry,
        entry_allowance_amount: settings.entry_allowance_amount
      };

      if (settings.id) {
        await supabase
          .from('allowance_settings')
          .update(settingsData)
          .eq('id', settings.id);
      } else {
        await supabase
          .from('allowance_settings')
          .insert(settingsData);
      }

      toast.success(language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(language === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      toast.error(language === 'ar' ? 'أدخل مبلغًا صحيحًا' : 'Enter a valid amount');
      return;
    }

    if (amount > parentWalletBalance) {
      toast.error(language === 'ar' ? 'رصيد غير كافي' : 'Insufficient balance');
      return;
    }

    setTransferring(true);
    try {
      // Deduct from parent wallet
      const { error: parentError } = await supabase
        .from('wallet_balances')
        .update({ balance: parentWalletBalance - amount })
        .eq('user_id', user?.id);

      if (parentError) throw parentError;

      // Check if student has a wallet, create if not
      const { data: existingWallet } = await supabase
        .from('wallet_balances')
        .select('id, balance')
        .eq('user_id', studentId)
        .maybeSingle();

      if (existingWallet) {
        // Update existing wallet
        await supabase
          .from('wallet_balances')
          .update({ balance: existingWallet.balance + amount })
          .eq('user_id', studentId);
      } else {
        // Create new wallet for student
        await supabase
          .from('wallet_balances')
          .insert({ user_id: studentId, balance: amount });
      }

      // Record transactions
      const newParentBalance = parentWalletBalance - amount;
      const newStudentBalance = (existingWallet?.balance || 0) + amount;
      
      await supabase.from('wallet_transactions').insert([
        {
          user_id: user?.id,
          amount: -amount,
          balance_after: newParentBalance,
          type: 'transfer',
          description: language === 'ar' 
            ? `تحويل إلى ${student?.first_name}` 
            : `Transfer to ${student?.first_name}`
        },
        {
          user_id: studentId,
          amount: amount,
          balance_after: newStudentBalance,
          type: 'transfer',
          description: language === 'ar' ? 'تحويل من ولي الأمر' : 'Transfer from parent'
        }
      ]);

      toast.success(language === 'ar' ? 'تم التحويل بنجاح' : 'Transfer successful');
      setTransferAmount('');
      setShowTransferDialog(false);
      loadData();
    } catch (error) {
      console.error('Error transferring:', error);
      toast.error(language === 'ar' ? 'فشل التحويل' : 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  const studentName = language === 'ar' 
    ? `${student?.first_name_ar || student?.first_name} ${student?.last_name_ar || student?.last_name}`
    : `${student?.first_name} ${student?.last_name}`;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">
            {language === 'ar' ? 'إدارة المحفظة' : 'Wallet Management'}
          </h1>
          <p className="text-sm text-muted-foreground">{studentName}</p>
        </div>
      </div>

      {/* Student Wallet Balance */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Wallet className="h-12 w-12" />
            <div>
              <p className="text-sm opacity-80">
                {language === 'ar' ? 'رصيد الطالب' : 'Student Balance'}
              </p>
              <p className="text-3xl font-bold">
                {studentWalletBalance.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parent Wallet Balance */}
      <Card className="bg-accent/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-full">
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'رصيدك' : 'Your Balance'}
                </p>
                <p className="font-bold">
                  {parentWalletBalance.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                </p>
              </div>
            </div>
            <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'شحن' : 'Charge'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {language === 'ar' ? 'شحن محفظة الطالب' : 'Charge Student Wallet'}
                  </DialogTitle>
                  <DialogDescription>
                    {language === 'ar' 
                      ? `تحويل من رصيدك إلى محفظة ${student?.first_name}`
                      : `Transfer from your balance to ${student?.first_name}'s wallet`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>{language === 'ar' ? 'المبلغ (ر.ع)' : 'Amount (OMR)'}</Label>
                    <Input
                      type="number"
                      step="0.100"
                      min="0.100"
                      max={parentWalletBalance}
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0.000"
                      className="text-lg"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === 'ar' ? 'المتاح:' : 'Available:'} {parentWalletBalance.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                    </p>
                  </div>
                  {/* Quick amounts */}
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 5, 10].map((amt) => (
                      <Button
                        key={amt}
                        variant="outline"
                        size="sm"
                        onClick={() => setTransferAmount(amt.toString())}
                        disabled={amt > parentWalletBalance}
                      >
                        {amt.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                      </Button>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button onClick={handleTransfer} disabled={transferring}>
                    {transferring 
                      ? (language === 'ar' ? 'جاري التحويل...' : 'Transferring...')
                      : (language === 'ar' ? 'تحويل' : 'Transfer')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Auto Deduct on Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {language === 'ar' ? 'المصروف التلقائي' : 'Auto Allowance'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'خصم المصروف تلقائياً من محفظتك وإضافته لمحفظة الطالب عند دخول المدرسة'
              : 'Automatically deduct from your wallet and add to student wallet on school entry'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <ArrowDownToLine className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">
                  {language === 'ar' ? 'خصم تلقائي عند الدخول' : 'Auto-deduct on Entry'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? 'عند مسح بطاقة NFC عند بوابة المدرسة'
                    : 'When NFC card is scanned at school gate'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.auto_deduct_on_entry}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_deduct_on_entry: checked }))}
            />
          </div>

          {settings.auto_deduct_on_entry && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <Label className="text-primary">
                {language === 'ar' ? 'مبلغ المصروف اليومي (ر.ع)' : 'Daily Allowance Amount (OMR)'}
              </Label>
              <Input
                type="number"
                step="0.100"
                min="0.100"
                value={settings.entry_allowance_amount}
                onChange={(e) => setSettings(prev => ({ ...prev, entry_allowance_amount: parseFloat(e.target.value) || 0 }))}
                className="mt-2 text-lg"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {language === 'ar' 
                  ? 'سيتم خصم هذا المبلغ من محفظتك وإضافته لمحفظة الطالب يومياً عند الدخول'
                  : 'This amount will be deducted from your wallet and added to student wallet daily on entry'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button 
        className="w-full h-14 text-lg" 
        onClick={saveSettings}
        disabled={saving}
      >
        <Save className="mr-2 h-5 w-5" />
        {saving 
          ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
          : (language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings')}
      </Button>
    </div>
  );
}