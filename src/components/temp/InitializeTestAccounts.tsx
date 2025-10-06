import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function InitializeTestAccounts() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const createTestAccounts = async () => {
    setLoading(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('create-test-accounts');

      if (error) throw error;

      if (data?.results) {
        setResults(data.results);
        const created = data.results.filter((r: any) => r.status === 'created_successfully').length;
        const existing = data.results.filter((r: any) => r.status === 'already_exists').length;
        
        if (created > 0) {
          toast.success(`Successfully created ${created} test account(s)`);
        }
        if (existing > 0) {
          toast.info(`${existing} account(s) already exist`);
        }
      }
    } catch (error: any) {
      console.error('Error creating test accounts:', error);
      toast.error('Failed to create test accounts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Initialize Test Accounts
        </CardTitle>
        <CardDescription>
          Create the test accounts for investors to try different user roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This will create the following test accounts:
            <ul className="mt-2 space-y-1 text-sm">
              <li>• admin@talebschool.com (Admin)</li>
              <li>• teacher@talebschool.com (Teacher)</li>
              <li>• student@talebschool.com (Student)</li>
              <li>• parent@talebschool.com (Parent)</li>
              <li>• driver@talebschool.com (Driver)</li>
              <li>• finance@talebschool.com (Finance)</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Button 
          onClick={createTestAccounts} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Creating accounts...' : 'Create Test Accounts'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {result.status === 'created_successfully' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : result.status === 'already_exists' ? (
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>{result.email}: {result.status.replace(/_/g, ' ')}</span>
                {result.error && (
                  <span className="text-red-600 text-xs">({result.error})</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}