import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet as WalletIcon, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  CreditCard 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Wallet() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [topUpAmount, setTopUpAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTopUp = async () => {
    if (!topUpAmount || Number(topUpAmount) <= 0) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'الرجاء إدخال مبلغ صحيح' : 'Please enter a valid amount',
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      toast({
        title: language === 'ar' ? 'تم الشحن بنجاح' : 'Top-up Successful',
        description: language === 'ar' 
          ? `تم إضافة ${topUpAmount} ريال عماني` 
          : `${topUpAmount} OMR added successfully`
      });
      setTopUpAmount("");
      setLoading(false);
    }, 2000);
  };

  const transactions = [
    { 
      type: 'top_up', 
      amount: 50.00, 
      desc: 'Wallet Top-up', 
      descAr: 'شحن المحفظة',
      date: '2025-01-04 10:30' 
    },
    { 
      type: 'purchase', 
      amount: -5.50, 
      desc: 'Cafeteria Purchase', 
      descAr: 'شراء من المقصف',
      date: '2025-01-04 09:15' 
    },
    { 
      type: 'purchase', 
      amount: -3.00, 
      desc: 'Store Purchase', 
      descAr: 'شراء من المتجر',
      date: '2025-01-03 14:20' 
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'ar' ? 'المحفظة الرقمية' : 'Digital Wallet'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'إدارة رصيد الطالب' : 'Manage student balance'}
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5" />
            {language === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold mb-2">
            41.50 {language === 'ar' ? 'ريال' : 'OMR'}
          </div>
          <p className="text-primary-foreground/80">
            {language === 'ar' ? 'متاح للإنفاق' : 'Available to spend'}
          </p>
        </CardContent>
      </Card>

      {/* Top Up Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {language === 'ar' ? 'شحن المحفظة' : 'Top Up Wallet'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'أضف أموال إلى محفظة الطالب'
              : 'Add money to student wallet'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[10, 20, 50, 100].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => setTopUpAmount(amount.toString())}
                className="h-16 text-lg"
              >
                {amount} {language === 'ar' ? 'ريال' : 'OMR'}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-amount">
              {language === 'ar' ? 'مبلغ مخصص' : 'Custom Amount'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="custom-amount"
                type="number"
                placeholder={language === 'ar' ? 'أدخل المبلغ' : 'Enter amount'}
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                min="1"
                step="0.5"
              />
              <Button 
                onClick={handleTopUp}
                disabled={loading}
                className="px-8"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {loading 
                  ? (language === 'ar' ? 'جاري الدفع...' : 'Processing...') 
                  : (language === 'ar' ? 'ادفع' : 'Pay')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'ar' ? 'سجل المعاملات' : 'Transaction History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((tx, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    tx.type === 'top_up' ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    {tx.type === 'top_up' ? (
                      <ArrowDownRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {language === 'ar' ? tx.descAr : tx.desc}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tx.date}
                    </div>
                  </div>
                </div>
                <Badge variant={tx.amount > 0 ? 'default' : 'secondary'} className="text-base px-3">
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} OMR
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}