import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, width = 390, height = 844 } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Capturing screenshot of ${url} at ${width}x${height}`);

    // Use Browserless.io or similar service for screenshot capture
    // For now, return a placeholder response that the client can handle
    // In production, you would integrate with a screenshot service

    const screenshotData = {
      url,
      width,
      height,
      timestamp: new Date().toISOString(),
      note: 'Screenshot capture requires integration with a screenshot service (e.g., Browserless, Puppeteer on server)'
    };

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Screenshot capture initiated',
        data: screenshotData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
