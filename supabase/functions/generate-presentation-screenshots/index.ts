import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCREENSHOTS: Record<string, any> = {
  'parent-dashboard': {
    name: 'parent-dashboard',
    width: 1400,
    height: 900,
    prompt: 'Modern parent dashboard UI for school management system. Large Welcome Sarah header at top. Below: 3 student cards showing circular photos, names, grades, Present badges. 8 icon buttons in 2 rows. Right sidebar: Wallet balance $250, Activity feed. Blue/white theme, modern shadows, clean spacing.'
  },
  'bus-tracking-map': {
    name: 'bus-tracking-map',
    width: 1400,
    height: 900,
    prompt: 'Live bus tracking map. Large map with blue bus icon, blue route line, 5 stops, green home icon. Top right card: Bus #12, ETA 8 minutes, Next Stop Al Khuwair Street. Bottom: Route timeline. Modern map UI, blue/white/green colors.'
  },
  'digital-wallet': {
    name: 'digital-wallet',
    width: 1200,
    height: 900,
    prompt: 'Digital wallet interface. Top: Large balance $250.00 in huge text, Top Up and Transfer buttons. Below: Recent Transactions list with 6 items showing icons, amounts in green/red. Right: Pie chart showing spending breakdown. Modern financial app design.'
  },
  'canteen-menu': {
    name: 'canteen-menu',
    width: 1400,
    height: 900,
    prompt: 'School canteen menu. Top: Canteen Menu header with cart icon showing 3 items. 2x4 grid of food cards with photos, prices, calories, Add buttons. Right sidebar: Cart summary, total $10.50, Checkout button. Modern food ordering app.'
  },
  'grades-dashboard': {
    name: 'grades-dashboard',
    width: 1400,
    height: 900,
    prompt: 'Student grades dashboard. Top: Academic Performance header. 3x2 grid of subject cards showing grades, progress bars, mini charts. Right panel: GPA 3.8/4.0 in circle, class rank 5th/45, radar chart. Academic blue/purple theme.'
  },
  'admin-dashboard': {
    name: 'admin-dashboard',
    width: 1400,
    height: 900,
    prompt: 'School admin dashboard. Top: 4 KPI cards showing Total Students 1248, Teachers 58, Attendance 94%, Revenue $45200. Middle: 3 charts for attendance, revenue, distribution. Bottom: Quick action buttons. Professional admin interface.'
  },
  'notifications-center': {
    name: 'notifications-center',
    width: 1200,
    height: 900,
    prompt: 'Notifications center. Top: Notifications header with unread badge 5. Tabs: All, Attendance, Payments, Grades, Messages. List of 8 notifications with colored icons, titles, timestamps, action buttons. Modern notification UI.'
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { screenshotName } = await req.json();
    const config = SCREENSHOTS[screenshotName];
    
    if (!config) {
      return new Response(
        JSON.stringify({ error: 'Screenshot not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: config.prompt,
        size: `${config.width}x${config.height}`,
        quality: 'high',
        output_format: 'png',
        n: 1,
      }),
    });

    const data = await response.json();
    const imageData = data.data?.[0];
    const imageUrl = imageData?.b64_json ? `data:image/png;base64,${imageData.b64_json}` : imageData?.url;

    return new Response(
      JSON.stringify({ imageUrl, name: config.name }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to generate', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
