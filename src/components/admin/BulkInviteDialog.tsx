import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, Download, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface InviteResult {
  email: string;
  name: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
}

interface BulkInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkInviteDialog({ open, onOpenChange, onSuccess }: BulkInviteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<InviteResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResults([]);
      setShowResults(false);
    } else {
      toast.error("Please select a valid CSV file");
    }
  };

  const downloadTemplate = () => {
    const template = "parent_email,parent_name,parent_name_ar,phone,max_students\njohn@example.com,John Smith,جون سميث,+96812345678,2\nmary@example.com,Mary Johnson,ماري جونسون,+96812345679,";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parent_invitations_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

    setLoading(true);

    try {
      const text = await file.text();
      const parents = parseCSV(text);

      if (parents.length === 0) {
        toast.error("No valid data found in CSV");
        setLoading(false);
        return;
      }

      // Call bulk invite edge function
      const { data, error } = await supabase.functions.invoke('bulk-invite-parents', {
        body: { parents }
      });

      if (error) throw error;

      setResults(data.results);
      setShowResults(true);

      const successCount = data.results.filter((r: InviteResult) => r.status === 'success').length;
      toast.success(`${successCount} invitations sent successfully`);
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error processing bulk invitations:', error);
      toast.error(error.message || "Failed to process invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResults([]);
    setShowResults(false);
    onOpenChange(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: 'default',
      error: 'destructive',
      skipped: 'secondary'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (showResults) {
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Bulk Invitation Results</DialogTitle>
            <DialogDescription>
              {successCount} successful, {errorCount} failed, {skippedCount} skipped
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{result.email}</TableCell>
                    <TableCell>{result.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        {getStatusBadge(result.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {result.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button onClick={handleClose} className="w-full">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Invite Parents</DialogTitle>
          <DialogDescription>
            Upload a CSV file with parent information to send multiple invitations at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV Template
          </Button>

          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                {file ? file.name : "Click to upload CSV file"}
              </p>
              <p className="text-xs text-muted-foreground">
                CSV file with parent information
              </p>
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Send Invitations"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
