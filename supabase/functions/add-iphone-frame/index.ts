import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Adding iPhone 15 frame to screenshot');

    // iPhone 15 frame SVG with transparent background, rounded corners, Dynamic Island
    const frameWidth = 1280; // Extra space for frame + shadow
    const frameHeight = 2640;
    const screenWidth = 1170; // 3x scale of 390px
    const screenHeight = 2532; // 3x scale of 844px
    const offsetX = (frameWidth - screenWidth) / 2;
    const offsetY = (frameHeight - screenHeight) / 2;
    const cornerRadius = 141; // 47px * 3
    const dynamicIslandWidth = 375; // 125px * 3
    const dynamicIslandHeight = 111; // 37px * 3

    // Create SVG with embedded screenshot
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${frameWidth}" height="${frameHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="30"/>
      <feOffset dx="0" dy="20" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <clipPath id="screenClip">
      <rect x="${offsetX}" y="${offsetY}" width="${screenWidth}" height="${screenHeight}" rx="${cornerRadius}" ry="${cornerRadius}"/>
    </clipPath>
    <clipPath id="dynamicIsland">
      <ellipse cx="${frameWidth / 2}" cy="${offsetY + 60}" rx="${dynamicIslandWidth / 2}" ry="${dynamicIslandHeight / 2}"/>
    </clipPath>
  </defs>
  
  <!-- Drop shadow -->
  <rect x="${offsetX - 10}" y="${offsetY - 10}" width="${screenWidth + 20}" height="${screenHeight + 20}" rx="${cornerRadius + 10}" fill="#000" opacity="0.1" filter="url(#shadow)"/>
  
  <!-- Device bezel (black frame) -->
  <rect x="${offsetX - 15}" y="${offsetY - 15}" width="${screenWidth + 30}" height="${screenHeight + 30}" rx="${cornerRadius + 15}" fill="#1a1a1a"/>
  
  <!-- Screenshot with rounded corners -->
  <image href="${imageBase64}" x="${offsetX}" y="${offsetY}" width="${screenWidth}" height="${screenHeight}" clip-path="url(#screenClip)"/>
  
  <!-- Dynamic Island cutout (black) -->
  <ellipse cx="${frameWidth / 2}" cy="${offsetY + 60}" rx="${dynamicIslandWidth / 2}" ry="${dynamicIslandHeight / 2}" fill="#000"/>
  
  <!-- Subtle reflection effect -->
  <rect x="${offsetX}" y="${offsetY}" width="${screenWidth}" height="${screenHeight / 2}" rx="${cornerRadius}" fill="url(#reflection)" clip-path="url(#screenClip)" opacity="0.05"/>
  <defs>
    <linearGradient id="reflection" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#fff;stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:#fff;stop-opacity:0"/>
    </linearGradient>
  </defs>
</svg>`;

    // Convert SVG to base64
    const svgBase64 = btoa(svg);
    const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

    console.log('iPhone 15 frame applied successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        framedImageBase64: svgDataUrl,
        width: frameWidth,
        height: frameHeight,
        note: 'SVG-based frame with transparent background, rounded corners, and Dynamic Island'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error adding frame:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
