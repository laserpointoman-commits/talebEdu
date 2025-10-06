import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  Image, 
  Download, 
  X,
  Paperclip,
  File
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface MessageAttachmentsProps {
  messageId?: string;
  onUploadComplete?: (attachments: MessageAttachment[]) => void;
  attachments?: MessageAttachment[];
  isUploadMode?: boolean;
}

export default function MessageAttachments({
  messageId,
  onUploadComplete,
  attachments = [],
  isUploadMode = false
}: MessageAttachmentsProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(
          language === 'en' 
            ? `${file.name} is too large. Maximum size is 10MB.`
            : `${file.name} حجمه كبير جداً. الحد الأقصى 10 ميجابايت.`
        );
        return false;
      }
      return true;
    });

    setSelectedFiles(validFiles);
  };

  const uploadFiles = async () => {
    if (!user || !messageId || selectedFiles.length === 0) return;
    
    setUploading(true);
    const uploadedAttachments: MessageAttachment[] = [];
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
        
        // Create unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('message-attachments')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('message-attachments')
          .getPublicUrl(fileName);
        
        // Save attachment record
        const { data: attachment, error: dbError } = await supabase
          .from('message_attachments')
          .insert({
            message_id: messageId,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size
          })
          .select()
          .single();
        
        if (dbError) throw dbError;
        
        uploadedAttachments.push(attachment);
      }
      
      toast.success(
        language === 'en'
          ? 'Files uploaded successfully!'
          : 'تم رفع الملفات بنجاح!'
      );
      
      if (onUploadComplete) {
        onUploadComplete(uploadedAttachments);
      }
      
      setShowUploadDialog(false);
      setSelectedFiles([]);
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error(
        language === 'en'
          ? 'Failed to upload files'
          : 'فشل رفع الملفات'
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (attachment: MessageAttachment) => {
    try {
      const response = await fetch(attachment.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error(
        language === 'en'
          ? 'Failed to download file'
          : 'فشل تحميل الملف'
      );
    }
  };

  if (isUploadMode) {
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowUploadDialog(true)}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'en' ? 'Attach Files' : 'إرفاق ملفات'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload">
                  {language === 'en' ? 'Select Files' : 'اختر الملفات'}
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'en'
                    ? 'Maximum file size: 10MB. Supported: Images, PDF, Word, Excel, Text'
                    : 'الحد الأقصى للملف: 10 ميجابايت. المدعوم: الصور، PDF، Word، Excel، النص'}
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <ScrollArea className="h-48 border rounded-lg p-2">
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.type)}
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-center text-muted-foreground">
                    {language === 'en'
                      ? `Uploading... ${Math.round(uploadProgress)}%`
                      : `جاري الرفع... ${Math.round(uploadProgress)}%`}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                  disabled={uploading}
                >
                  {language === 'en' ? 'Cancel' : 'إلغاء'}
                </Button>
                <Button
                  onClick={uploadFiles}
                  disabled={uploading || selectedFiles.length === 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'Upload' : 'رفع'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Display mode for existing attachments
  if (attachments.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center justify-between p-2 bg-muted rounded-lg"
        >
          <div className="flex items-center gap-2">
            {getFileIcon(attachment.file_type)}
            <div>
              <p className="text-sm font-medium">{attachment.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.file_size)}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDownload(attachment)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}