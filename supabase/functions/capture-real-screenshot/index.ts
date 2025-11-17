import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { path, language = 'en' } = await req.json();

    if (!path) {
      return new Response(
        JSON.stringify({ error: 'Path is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Capturing real screenshot: ${path} (${language})`);

    // Use the sandbox screenshot API to capture the real running app
    const screenshotUrl = `https://api.lovable.app/screenshot?project=${Deno.env.get('VITE_SUPABASE_PROJECT_ID')}&path=${encodeURIComponent(path)}&width=390&height=844&language=${language}`;
    
    const response = await fetch(screenshotUrl, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Screenshot API returned ${response.status}`);
    }

    // Get the image as buffer
    const imageBuffer = await response.arrayBuffer();
    
    // Convert to base64
    const base64 = btoa(
      new Uint8Array(imageBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    const imageBase64 = `data:image/png;base64,${base64}`;

    console.log('Real screenshot captured successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        imageBase64,
        width: 390 * 3,
        height: 844 * 3
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error capturing screenshot:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
