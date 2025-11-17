import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const APP_URL = Deno.env.get('VITE_SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com') || 'https://b9b768f5-1a7c-4563-ab9c-d1b25b963f4b.lovableproject.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let browser;
  try {
    const { route, language = 'en', width = 390, height = 844 } = await req.json();

    if (!route) {
      return new Response(
        JSON.stringify({ error: 'Route is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Capturing screenshot for route: ${route} (${language})`);

    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    // Set mobile viewport (iPhone 15 dimensions)
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 3, // iPhone 15 has 3x retina display
      isMobile: true,
      hasTouch: true
    });

    // Set language preference
    await page.evaluateOnNewDocument((lang) => {
      localStorage.setItem('language', lang);
    }, language);

    // Navigate to the route
    const fullUrl = `${APP_URL}${route}`;
    console.log(`Navigating to: ${fullUrl}`);
    
    await page.goto(fullUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait a bit more for animations and dynamic content
    await page.waitForTimeout(2000);

    // Capture screenshot as base64
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      encoding: 'binary'
    });

    // Convert to base64
    const base64Image = btoa(
      new Uint8Array(screenshotBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    const imageBase64 = `data:image/png;base64,${base64Image}`;

    console.log(`Screenshot captured successfully for ${route}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        imageBase64,
        width: width * 3,
        height: height * 3,
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
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});
