import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Copy, Mail } from "lucide-react";

interface InviteParentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InviteParentDialog({ open, onOpenChange, onSuccess }: InviteParentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    fullNameAr: "",
    phone: "",
    notes: "",
    maxStudents: "",
  });
  const [registrationLink, setRegistrationLink] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.fullName) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);

    try {
      // Call the send-parent-invitation edge function
      const { data, error } = await supabase.functions.invoke('send-parent-invitation', {
        body: {
          parentEmail: formData.email,
          parentName: formData.fullName,
          parentNameAr: formData.fullNameAr || formData.fullName,
          phone: formData.phone,
          notes: formData.notes,
          maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
        }
      });

      if (error) throw error;

      setRegistrationLink(data.registrationUrl);
      setShowSuccess(true);
      toast.success("Invitation sent successfully!");
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationLink);
    toast.success("Registration link copied!");
  };

  const handleClose = () => {
    setFormData({
      email: "",
      fullName: "",
      fullNameAr: "",
      phone: "",
      notes: "",
      maxStudents: "",
    });
    setRegistrationLink("");
    setShowSuccess(false);
    onOpenChange(false);
  };

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Invitation Sent Successfully!
            </DialogTitle>
            <DialogDescription>
              The parent will receive an email with instructions. You can also share this registration link directly:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={registrationLink} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button onClick={handleCopyLink} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Parent</DialogTitle>
          <DialogDescription>
            Send a registration invitation to a parent. They will register their students themselves.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Parent Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="parent@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="John Smith"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullNameAr">Full Name (Arabic)</Label>
            <Input
              id="fullNameAr"
              value={formData.fullNameAr}
              onChange={(e) => setFormData({ ...formData, fullNameAr: e.target.value })}
              placeholder="جون سميث"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+968 1234 5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxStudents">Maximum Students (Optional)</Label>
            <Input
              id="maxStudents"
              type="number"
              min="1"
              value={formData.maxStudents}
              onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
              placeholder="Leave empty for unlimited"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Internal)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
