import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Cleaning up orphaned canteen profiles...');
    
    // Delete all broken canteen user profiles
    const { error: deleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .in('email', [
        'canteen@talebedu.com',
        'cashier@talebedu.com',
        'canteen-staff@talebedu.com',
        'pos-cashier@talebedu.com',
        'khalid@talebedu.com'
      ]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
    }

    console.log('Creating fresh canteen user via RPC...');
    
    // Create auth user via RPC
    const { data: userId, error: rpcError } = await supabaseAdmin.rpc('create_auth_user', {
      p_email: 'canteen@talebedu.com',
      p_password: 'Canteen123!',
      p_metadata: {
        full_name: 'Canteen Staff',
        role: 'canteen'
      }
    });

    if (rpcError) {
      throw new Error('RPC failed: ' + rpcError.message);
    }

    console.log('Auth user created:', userId);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: 'canteen@talebedu.com',
        full_name: 'Canteen Staff',
        full_name_ar: 'موظف الكانتين',
        role: 'canteen'
      });

    if (profileError) {
      throw new Error('Profile creation failed: ' + profileError.message);
    }

    console.log('Profile created successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Canteen user created',
        email: 'canteen@talebedu.com',
        password: 'Canteen123!',
        userId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
