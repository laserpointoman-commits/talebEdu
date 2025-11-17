import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, deviceType = 'iphone-15' } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Adding ${deviceType} frame to screenshot`);

    // iPhone 15 specifications
    const specs = {
      'iphone-15': {
        deviceWidth: 390,
        deviceHeight: 844,
        screenX: 20,
        screenY: 50,
        screenWidth: 350,
        screenHeight: 744,
        cornerRadius: 47,
        notchHeight: 35,
        outputWidth: 1170, // 3x for retina
        outputHeight: 2532
      }
    };

    const spec = specs[deviceType as keyof typeof specs];

    // In production, this would use canvas/image manipulation libraries
    // to overlay the screenshot onto an iPhone frame template
    // For now, return configuration for client-side processing

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'iPhone frame specifications generated',
        specs: spec,
        note: 'Frame overlay requires image processing library (e.g., Sharp, Canvas)'
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
