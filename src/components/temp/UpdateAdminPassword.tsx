import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Key } from 'lucide-react';

export function UpdateAdminPassword() {
  const [loading, setLoading] = useState(false);

  const handleUpdateAdminPassword = async () => {
    setLoading(true);
    try {
      // First, get the admin user
      const { data: adminProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'admin@talebedu.com')
        .single();

      if (profileError || !adminProfile) {
        throw new Error('Admin user not found');
      }

      // Call the edge function to update password
      const { error } = await supabase.functions.invoke('update-user-password', {
        body: {
          userId: adminProfile.id,
          newPassword: 'Admin123'
        }
      });

      if (error) throw error;

      toast.success('Admin password has been reset to: Admin123');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-warning">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning">
          <Key className="h-5 w-5" />
          Quick Password Reset
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will reset the admin@talebedu.com password to "Admin123"
        </p>
        <Button 
          onClick={handleUpdateAdminPassword} 
          disabled={loading}
          variant="destructive"
        >
          {loading ? 'Resetting...' : 'Reset Admin Password'}
        </Button>
      </CardContent>
    </Card>
  );
}