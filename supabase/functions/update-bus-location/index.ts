import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LocationUpdate {
  busId: string;
  latitude: number;
  longitude: number;
  currentStop?: string;
  nextStop?: string;
  etaMinutes?: number;
  speed?: number;
  heading?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { busId, latitude, longitude, currentStop, nextStop, etaMinutes, speed, heading }: LocationUpdate = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Updating location for bus: ${busId}`);

    // Insert new location record
    const { data: location, error: locationError } = await supabase
      .from('bus_locations')
      .insert({
        bus_id: busId,
        latitude: latitude,
        longitude: longitude,
        current_stop: currentStop,
        next_stop: nextStop,
        eta_minutes: etaMinutes,
        speed: speed,
        heading: heading,
        timestamp: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (locationError) {
      console.error('Error updating bus location:', locationError);
      return new Response(
        JSON.stringify({ error: 'Failed to update location' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Bus location updated successfully:', location.id);

    return new Response(
      JSON.stringify({
        success: true,
        location: location,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
