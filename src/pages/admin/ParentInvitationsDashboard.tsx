import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InviteParentDialog } from "@/components/admin/InviteParentDialog";
import { BulkInviteDialog } from "@/components/admin/BulkInviteDialog";
import { toast } from "sonner";
import { Mail, Users, Copy, RefreshCw, Trash2, QrCode, Search, Download } from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ParentInvitationsDashboard() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invitations, isLoading, refetch } = useQuery({
    queryKey: ['parent-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parent_registration_tokens')
        .select(`
          id,
          token,
          used,
          expires_at,
          created_at,
          students_registered,
          remaining_uses,
          invitation_method,
          notes,
          parent_id,
          profiles!parent_id (
            full_name,
            full_name_ar,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const getStatus = (invitation: any) => {
    if (invitation.students_registered > 0) return 'completed';
    if (new Date(invitation.expires_at) < new Date()) return 'expired';
    if (invitation.used) return 'used';
    return 'pending';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: 'default',
      pending: 'secondary',
      expired: 'destructive',
      used: 'outline'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filteredInvitations = invitations?.filter(inv => {
    const matchesSearch = 
      inv.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const status = getStatus(inv);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invitations?.length || 0,
    pending: invitations?.filter(inv => getStatus(inv) === 'pending').length || 0,
    completed: invitations?.filter(inv => getStatus(inv) === 'completed').length || 0,
    expired: invitations?.filter(inv => getStatus(inv) === 'expired').length || 0,
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/parent-registration?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Registration link copied!");
  };

  const handleResend = async (invitation: any) => {
    try {
      const { error } = await supabase.functions.invoke('resend-invitation', {
        body: { tokenId: invitation.id }
      });

      if (error) throw error;
      toast.success("Invitation resent successfully!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to resend invitation");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invitation?")) return;

    try {
      const { error } = await supabase
        .from('parent_registration_tokens')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Invitation deleted");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete invitation");
    }
  };

  const showQRCode = (invitation: any) => {
    setSelectedToken(invitation);
    setQrDialogOpen(true);
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-${selectedToken?.profiles?.email || 'invitation'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR code downloaded");
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Parent Invitations</h1>
            <p className="text-muted-foreground">Manage parent registration invitations</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setBulkDialogOpen(true)} variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Bulk Invite
            </Button>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Invite Parent
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invitations</CardTitle>
            <CardDescription>View and manage all parent invitations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="expired">Expired</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parent</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : filteredInvitations?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">No invitations found</TableCell>
                      </TableRow>
                    ) : (
                      filteredInvitations?.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{invitation.profiles?.full_name}</div>
                              {invitation.profiles?.full_name_ar && (
                                <div className="text-xs text-muted-foreground" dir="rtl">
                                  {invitation.profiles.full_name_ar}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {invitation.profiles?.email}
                          </TableCell>
                          <TableCell>{getStatusBadge(getStatus(invitation))}</TableCell>
                          <TableCell>
                            {invitation.students_registered || 0}
                            {invitation.remaining_uses && ` / ${invitation.remaining_uses}`}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(invitation.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(invitation.expires_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopyLink(invitation.token)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => showQRCode(invitation)}
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleResend(invitation)}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(invitation.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <InviteParentDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          onSuccess={refetch}
        />

        <BulkInviteDialog
          open={bulkDialogOpen}
          onOpenChange={setBulkDialogOpen}
          onSuccess={refetch}
        />

        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>QR Code - Registration Link</DialogTitle>
            </DialogHeader>
            {selectedToken && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm font-medium mb-2">{selectedToken.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground mb-4">{selectedToken.profiles?.email}</p>
                  <div className="flex justify-center bg-white p-4 rounded-lg">
                    <QRCodeSVG
                      id="qr-code-svg"
                      value={`${window.location.origin}/parent-registration?token=${selectedToken.token}`}
                      size={256}
                      level="H"
                      includeMargin
                    />
                  </div>
                </div>
                <Button onClick={downloadQR} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
