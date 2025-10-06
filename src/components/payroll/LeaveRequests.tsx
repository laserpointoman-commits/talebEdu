import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Check, X } from 'lucide-react';

export default function LeaveRequests() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('leave_requests')
      .select(`*, teacher:teachers!leave_requests_teacher_id_fkey(*, profile:profiles!teachers_profile_id_fkey(*))`)
      .order('created_at', { ascending: false });
    setRequests(data || []);
  };

  const handleApprove = async (id: string) => {
    await supabase.from('leave_requests').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', id);
    toast({ title: t('Leave request approved') });
    fetchRequests();
  };

  const handleReject = async (id: string) => {
    await supabase.from('leave_requests').update({ status: 'rejected' }).eq('id', id);
    toast({ title: t('Leave request rejected') });
    fetchRequests();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Leave Requests')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Teacher')}</TableHead>
              <TableHead>{t('Type')}</TableHead>
              <TableHead>{t('Duration')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.teacher?.profile?.full_name}</TableCell>
                <TableCell>{t(request.leave_type)}</TableCell>
                <TableCell>
                  {format(new Date(request.start_date), 'dd/MM/yyyy')} - 
                  {format(new Date(request.end_date), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>
                  <Badge variant={request.status === 'approved' ? 'secondary' : request.status === 'rejected' ? 'destructive' : 'default'}>
                    {t(request.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(request.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(request.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}