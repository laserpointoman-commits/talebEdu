import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, width = 390, height = 844, deviceScaleFactor = 3 } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Capturing screenshot of ${url} at ${width}x${height} (${deviceScaleFactor}x scale)`);

    // Launch browser with Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set iPhone 15 viewport
    await page.setViewport({
      width,
      height,
      deviceScaleFactor, // 3x for retina (1170x2532px actual)
      isMobile: true,
      hasTouch: true
    });

    // Navigate to URL and wait for network to be idle
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait extra 2 seconds for animations/loading
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Capture screenshot as base64
    const screenshot = await page.screenshot({
      type: 'png',
      encoding: 'base64',
      fullPage: false // Only capture visible viewport
    });

    await browser.close();

    console.log(`Screenshot captured successfully: ${screenshot.length} bytes`);

    return new Response(
      JSON.stringify({ 
        success: true,
        imageBase64: `data:image/png;base64,${screenshot}`,
        width: width * deviceScaleFactor,
        height: height * deviceScaleFactor,
        timestamp: new Date().toISOString()
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
