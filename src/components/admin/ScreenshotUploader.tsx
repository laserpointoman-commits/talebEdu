import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, Smartphone } from 'lucide-react';

export const ScreenshotUploader = () => {
  const [processing, setProcessing] = useState(false);
  const [framedImage, setFramedImage] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    try {
      // Convert to base64
      const base64 = await fileToBase64(file);

      // Add iPhone 15 frame
      const { data, error } = await supabase.functions.invoke('add-iphone-frame', {
        body: { imageBase64: base64 }
      });

      if (error) throw error;
      if (!data?.framedImageBase64) throw new Error('No framed image returned');

      setFramedImage(data.framedImageBase64);
      
      toast({
        title: 'Success!',
        description: 'Screenshot framed in iPhone 15. Click download to save.',
      });
    } catch (error) {
      console.error('Error framing screenshot:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to frame screenshot',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const downloadFramedImage = () => {
    if (!framedImage) return;

    const link = document.createElement('a');
    link.href = framedImage;
    link.download = `iphone-framed-${Date.now()}.png`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Manual Screenshot Framing
        </CardTitle>
        <CardDescription>
          Upload screenshots (390x844px) to frame them in iPhone 15
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">How to capture screenshots:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Open browser DevTools (F12)</li>
            <li>Click Toggle Device Toolbar (Ctrl+Shift+M)</li>
            <li>Set dimensions to 390x844 (iPhone 15)</li>
            <li>Navigate to your route</li>
            <li>Take screenshot (Ctrl+Shift+P → "Capture screenshot")</li>
            <li>Upload here to add iPhone frame</li>
          </ol>
        </div>

        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="screenshot-upload"
          />
          <label htmlFor="screenshot-upload" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Click to upload screenshot</p>
            <p className="text-xs text-muted-foreground mt-1">PNG or JPG (390x844px recommended)</p>
          </label>
        </div>

        {processing && (
          <p className="text-sm text-center text-muted-foreground">Processing...</p>
        )}

        {framedImage && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/30">
              <img 
                src={framedImage} 
                alt="Framed screenshot" 
                className="mx-auto max-h-96 object-contain"
              />
            </div>
            <Button onClick={downloadFramedImage} className="w-full">
              Download Framed Screenshot
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
