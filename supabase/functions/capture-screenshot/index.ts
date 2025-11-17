import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

// This edge function is deprecated - screenshot capture now happens client-side
// Kept for backwards compatibility
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ 
      error: 'This endpoint is deprecated. Please use client-side screenshot capture instead.' 
    }),
    { 
      status: 410, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
