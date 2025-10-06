import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera } from 'lucide-react';
import LogoLoader from '@/components/LogoLoader';
import { Progress } from '@/components/ui/progress';

export default function GeneratePhotos() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const generatePhotos = async () => {
    setIsGenerating(true);
    setProgress(0);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-all-photos');
      
      if (error) {
        throw error;
      }

      if (data?.results) {
        setResults(data.results);
        const successful = data.results.filter((r: any) => r.success).length;
        
        toast({
          title: "Photo Generation Complete",
          description: `Successfully generated ${successful} out of ${data.results.length} photos.`,
        });
      }
    } catch (error) {
      console.error('Error generating photos:', error);
      toast({
        title: "Error",
        description: "Failed to generate photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(100);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Generate Profile Photos
          </CardTitle>
          <CardDescription>
            Generate AI profile photos for all students and teachers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={generatePhotos}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <div className="flex items-center">
                <div className="mr-2">
                  <LogoLoader size="small" text={false} />
                </div>
                Generating Photos...
              </div>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Generate All Photos
              </>
            )}
          </Button>

          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                This may take a few minutes...
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Results:</h3>
              <div className="max-h-96 overflow-y-auto space-y-1">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm ${
                      result.success 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {result.name}: {result.success ? '✓ Success' : `✗ Failed: ${result.error}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}