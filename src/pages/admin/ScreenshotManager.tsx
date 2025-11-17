import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ScreenshotConfig {
  name: string;
  prompt: string;
  width: number;
  height: number;
  language: 'en' | 'ar';
}

interface GeneratedScreenshot {
  name: string;
  imageData: string;
  config: ScreenshotConfig;
}

// Using existing real screenshots from the project
const EXISTING_SCREENSHOTS = [
  { name: 'screenshot-bus', path: '/src/assets/presentation/screenshot-bus.jpg' },
  { name: 'screenshot-canteen', path: '/src/assets/presentation/screenshot-canteen.jpg' },
  { name: 'screenshot-finance', path: '/src/assets/presentation/screenshot-finance.jpg' },
  { name: 'screenshot-grades', path: '/src/assets/presentation/screenshot-grades.jpg' },
  { name: 'screenshot-nfc', path: '/src/assets/presentation/screenshot-nfc.jpg' },
  { name: 'screenshot-notifications', path: '/src/assets/presentation/screenshot-notifications.jpg' },
  { name: 'screenshot-wallet', path: '/src/assets/presentation/screenshot-wallet.jpg' },
];

export default function ScreenshotManager() {
  const [generating, setGenerating] = useState(false);
  const [generatedScreenshots, setGeneratedScreenshots] = useState<GeneratedScreenshot[]>([]);
  const [currentlyGenerating, setCurrentlyGenerating] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const loadAndFrameScreenshot = async (screenshot: typeof EXISTING_SCREENSHOTS[0]): Promise<string> => {
    try {
      // Load the existing screenshot
      const response = await fetch(screenshot.path);
      const blob = await response.blob();
      
      // Convert to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          
          // Frame it with iPhone
          try {
            const { data, error } = await supabase.functions.invoke('add-iphone-frame', {
              body: { imageBase64: base64 }
            });
            
            if (error) throw error;
            resolve(data.framedImageBase64 || base64);
          } catch (error) {
            console.error('Frame error:', error);
            resolve(base64); // Return unframed if framing fails
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Load error:', error);
      throw error;
    }
  };

  const generateAllScreenshots = async () => {
    setGenerating(true);
    setGeneratedScreenshots([]);
    setProgress({ current: 0, total: EXISTING_SCREENSHOTS.length });
    
    const results: GeneratedScreenshot[] = [];
    
    try {
      for (let i = 0; i < EXISTING_SCREENSHOTS.length; i++) {
        const screenshot = EXISTING_SCREENSHOTS[i];
        setCurrentlyGenerating(screenshot.name);
        setProgress({ current: i + 1, total: EXISTING_SCREENSHOTS.length });
        
        try {
          console.log(`Processing ${i + 1}/${EXISTING_SCREENSHOTS.length}: ${screenshot.name}`);
          
          const framedImage = await loadAndFrameScreenshot(screenshot);
          
          results.push({
            name: screenshot.name,
            imageData: framedImage,
            config: { name: screenshot.name, language: 'en', width: 1400, height: 900, prompt: '' }
          });
          
          console.log(`✓ Processed: ${screenshot.name}`);
          
        } catch (error) {
          console.error(`Error processing ${screenshot.name}:`, error);
          toast.error(`Failed: ${screenshot.name}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      setGeneratedScreenshots(results);
      toast.success(`Processed ${results.length} real screenshots with iPhone frames!`);
      
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Processing failed');
    } finally {
      setGenerating(false);
      setCurrentlyGenerating(null);
    }
  };

  const downloadAllAsZip = async () => {
    if (generatedScreenshots.length === 0) {
      toast.error('No screenshots to download');
      return;
    }

    try {
      for (const screenshot of generatedScreenshots) {
        const base64Data = screenshot.imageData.split(',')[1] || screenshot.imageData;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${screenshot.name}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.success('All screenshots downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Real Screenshot Processor</h1>
          <p className="text-muted-foreground mt-2">
            Process all {EXISTING_SCREENSHOTS.length} real screenshots with professional iPhone frames
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Real Screenshots Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Using existing real screenshots with iPhone frame enhancement
                  {generating && ` - Progress: ${progress.current}/${progress.total}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={generateAllScreenshots}
                  disabled={generating}
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating {progress.current}/{progress.total}
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Process All Real Screenshots
                    </>
                  )}
                </Button>
                <Button
                  onClick={downloadAllAsZip}
                  disabled={generatedScreenshots.length === 0}
                  size="lg"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All ({generatedScreenshots.length})
                </Button>
              </div>
            </div>
            
            {generating && currentlyGenerating && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium">Processing: {currentlyGenerating}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Applying iPhone frame to real screenshot...
                </div>
                <div className="w-full bg-background rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {generatedScreenshots.length > 0 && !generating && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium text-green-700 dark:text-green-400">
                      Processing Complete!
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {generatedScreenshots.length} real framed screenshots ready to download
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {generatedScreenshots.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Processed Real Screenshots</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generatedScreenshots.map((screenshot) => (
                <div key={screenshot.name} className="space-y-2">
                  <div className="aspect-[9/16] bg-muted rounded-lg overflow-hidden border">
                    <img 
                      src={screenshot.imageData} 
                      alt={screenshot.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-xs text-center">
                    <div className="font-medium truncate">{screenshot.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
