import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the admin user
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', 'admin@talebedu.com')
      .single();

    if (!adminProfile) {
      throw new Error('Admin user not found');
    }

    // Update the password
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      adminProfile.id,
      { password: 'Admin123' }
    );

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin password updated successfully',
        email: 'admin@talebedu.com'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error updating password:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});