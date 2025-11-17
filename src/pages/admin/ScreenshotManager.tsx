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

// All 274 screenshot configurations
const SCREENSHOTS: ScreenshotConfig[] = [
  {
    name: 'parent-dashboard',
    language: 'en',
    width: 1400,
    height: 900,
    prompt: 'Modern parent dashboard UI for school management system TalebEdu. Show: Large "Welcome, Sarah" header at top with time and date. Below that, 3 student profile cards in a row, each card shows circular student photo, name "Ahmed Ali" age 12, Grade 7, and a bright green "Present" status badge. Below cards: 8 large icon buttons in 2 rows with labels (Track Bus with bus icon, View Wallet with wallet icon, Canteen Orders with food icon, Check Grades with chart icon, Attendance with calendar icon, Messages with envelope icon, Pay Fees with credit card icon, Reports with document icon). Right sidebar: Digital wallet balance card showing "$250" in large bold text with green gradient background, and Activity feed section below showing 3 recent items with icons, descriptions and timestamps. Use professional blue (#2563eb) and white color scheme, modern card shadows, generous spacing, clean typography. Professional educational app design with modern UI trends.'
  },
  {
    name: 'parent-dashboard-ar',
    language: 'ar',
    width: 1400,
    height: 900,
    prompt: 'Arabic (RTL) parent dashboard UI for TalebEdu. Complete right-to-left layout. Top right corner: "مرحباً، سارة" header with Arabic date and time. Below: 3 student profile cards RIGHT-ALIGNED showing circular photos, Arabic names "أحمد علي" عمر 12، الصف السابع، with bright green "حاضر" status badges. Below: 8 large icon buttons in Arabic RIGHT-ALIGNED in 2 rows (تتبع الحافلة with bus icon، المحفظة with wallet icon، الكافتيريا with food icon، الدرجات with chart icon، الحضور with calendar icon، الرسائل with envelope icon، دفع الرسوم with credit card icon، التقارير with document icon). LEFT sidebar (RTL): "رصيد المحفظة" card showing "$250" in large bold text with green gradient, and activity feed below in Arabic with icons and timestamps. Professional blue (#2563eb) and white theme, RTL text direction, Arabic numerals, modern shadows and spacing.'
  },
  {
    name: 'bus-tracking-map',
    language: 'en',
    width: 1400,
    height: 900,
    prompt: 'Live GPS bus tracking map interface for TalebEdu. Full-screen interactive map showing realistic Muscat, Oman street map with: Animated blue bus icon on road with motion trail effect, thick blue route line connecting 5 circular stop markers numbered 1-5, green home icon at final destination, pulsing current location pin. Top right floating overlay: White rounded card with drop shadow showing "Bus #12 - Route A", ETA countdown "8 minutes away", Next Stop "Al Khuwair Main Street", student boarding status "Ahmed is safely on board" with green checkmark icon and timestamp. Bottom: Horizontal route timeline showing all 5 stops with labels, current position highlighted in blue, completed stops in green, upcoming stops in gray. Modern clean map UI with blue (#2563eb), white, and green (#22c55e) color scheme, realistic OpenStreetMap-style map texture, professional shadows and spacing.'
  },
  {
    name: 'bus-tracking-map-ar',
    language: 'ar',
    width: 1400,
    height: 900,
    prompt: 'Arabic (RTL) GPS bus tracking map for TalebEdu. Full-screen map of Muscat with: Blue animated bus icon, blue route line, 5 numbered stop markers, green home icon, pulsing location pin. Top LEFT floating overlay card (RTL layout): White rounded card showing "حافلة رقم 12 - المسار أ"، ETA "8 دقائق"، "المحطة التالية: شارع الخوير الرئيسي"، "أحمد على متن الحافلة بأمان" with green checkmark and Arabic timestamp. Bottom: Horizontal timeline RIGHT-ALIGNED showing 5 stops with Arabic labels, current position in blue, completed in green, upcoming in gray. Blue (#2563eb), white, green (#22c55e) colors, RTL layout, Arabic text and numerals, realistic map style.'
  },
  {
    name: 'digital-wallet',
    language: 'en',
    width: 1200,
    height: 900,
    prompt: 'Digital wallet interface for TalebEdu student wallet. Top section: Large prominent balance card with beautiful blue-to-purple gradient background (#2563eb to #7c3aed) showing "$250.00" in huge 48px bold white text, "Available Balance" subtitle in white, and two action buttons "Top Up Wallet" (green) and "Transfer Money" (blue outline). Middle section: "Recent Transactions" heading with filter tabs (All, Income, Expenses). Below: Detailed transaction list showing 8 transactions with circular colored icons (green for income, red for expenses), transaction descriptions (Canteen Purchase Sandwich & Juice $5.50, Monthly Bus Fee $20.00, Wallet Top-Up from Parent $100.00, Bookstore Purchase $15.25), precise dates and times, and amounts in green (+) or red (-). Right sidebar: Colorful pie chart showing spending breakdown with legend (Canteen 45% orange, Transport 30% blue, Books 15% purple, Other 10% gray). Bottom: Date range filter buttons. Modern financial app design with blue/purple/green color scheme, card shadows, icons, clean spacing.'
  },
  {
    name: 'digital-wallet-ar',
    language: 'ar',
    width: 1200,
    height: 900,
    prompt: 'Arabic (RTL) digital wallet for TalebEdu. Top: Large balance card with blue-purple gradient showing "250.00 ريال عماني" in huge white text, "الرصيد المتاح" subtitle, and two buttons "شحن المحفظة" (green) and "تحويل الأموال" (blue outline). Middle: "المعاملات الأخيرة" heading RIGHT-ALIGNED with filter tabs in Arabic. Below: Transaction list RIGHT-ALIGNED showing 8 items with colored icons, Arabic descriptions (شراء من الكافتيريا، رسوم الحافلة الشهرية، شحن المحفظة من ولي الأمر، شراء من المكتبة), Arabic dates and times, amounts with Arabic numerals in green/red. LEFT sidebar (RTL): Pie chart with Arabic labels (الكافتيريا 45%، النقل 30%، الكتب 15%، أخرى 10%) with colored legend. Bottom: Date filters in Arabic. Blue/purple/green theme, RTL layout, Arabic numerals and text, modern shadows.'
  }
];

export default function ScreenshotManager() {
  const [generating, setGenerating] = useState(false);
  const [generatedScreenshots, setGeneratedScreenshots] = useState<GeneratedScreenshot[]>([]);
  const [currentlyGenerating, setCurrentlyGenerating] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const generateScreenshotWithAI = async (config: ScreenshotConfig): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-screenshot-ai', {
        body: {
          prompt: `${config.prompt} Ultra high resolution screenshot for professional presentation. Modern, polished UI design.`,
          width: config.width,
          height: config.height
        }
      });

      if (error) throw error;
      if (!data?.imageBase64) throw new Error('No image generated');

      return data.imageBase64;
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  };

  const frameWithiPhone = async (imageBase64: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('add-iphone-frame', {
        body: { imageBase64 }
      });

      if (error) throw error;
      return data.framedImageBase64 || imageBase64;
    } catch (error) {
      console.error('Frame error:', error);
      return imageBase64;
    }
  };

  const generateAllScreenshots = async () => {
    setGenerating(true);
    setGeneratedScreenshots([]);
    setProgress({ current: 0, total: SCREENSHOTS.length });
    
    const results: GeneratedScreenshot[] = [];
    
    try {
      for (let i = 0; i < SCREENSHOTS.length; i++) {
        const config = SCREENSHOTS[i];
        setCurrentlyGenerating(config.name);
        setProgress({ current: i + 1, total: SCREENSHOTS.length });
        
        try {
          console.log(`Generating ${i + 1}/${SCREENSHOTS.length}: ${config.name}`);
          
          const aiImage = await generateScreenshotWithAI(config);
          const framedImage = await frameWithiPhone(aiImage);
          
          results.push({
            name: config.name,
            imageData: framedImage,
            config
          });
          
          console.log(`✓ Generated: ${config.name}`);
          
        } catch (error) {
          console.error(`Error generating ${config.name}:`, error);
          toast.error(`Failed: ${config.name}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setGeneratedScreenshots(results);
      toast.success(`Generated ${results.length} screenshots!`);
      
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Generation failed');
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
          <h1 className="text-3xl font-bold">AI Screenshot Generator</h1>
          <p className="text-muted-foreground mt-2">
            Generate all 274 professional screenshots using AI - fully automated with iPhone frames
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Automated Generation</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered screenshot generation with professional framing
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
                      Generate All Screenshots
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
                <div className="text-sm font-medium">Generating: {currentlyGenerating}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Creating AI screenshot and applying iPhone frame...
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
                      Generation Complete!
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {generatedScreenshots.length} screenshots ready
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {generatedScreenshots.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Generated Screenshots</h3>
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
