import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetPinRequest {
  pin: string;
  nfcId?: string;
  email?: string;
  profileId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pin, nfcId, email, profileId }: SetPinRequest = await req.json();

    // Validate PIN format (4 digits)
    if (!pin || !/^\d{4}$/.test(pin)) {
      return new Response(
        JSON.stringify({ error: 'PIN must be exactly 4 digits' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    let targetProfileId = profileId;

    // If profileId not provided, look up by email or NFC ID
    if (!targetProfileId) {
      if (email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('email', email)
          .single();

        if (!profile) {
          return new Response(
            JSON.stringify({ error: 'Profile not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if user is staff
        const staffRoles = ['admin', 'teacher', 'driver', 'supervisor', 'finance', 'canteen', 'school_attendance'];
        if (!staffRoles.includes(profile.role)) {
          return new Response(
            JSON.stringify({ error: 'NFC PIN is only available for staff accounts' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        targetProfileId = profile.id;
      } else if (nfcId) {
        // Try to find profile by NFC ID across tables
        let foundProfileId: string | null = null;

        const tables = [
          { table: 'employees', column: 'nfc_id' },
          { table: 'supervisors', column: 'nfc_id' },
          { table: 'teachers', column: 'nfc_id' },
          { table: 'drivers', column: 'nfc_id' },
        ];

        for (const { table, column } of tables) {
          const { data } = await supabase
            .from(table)
            .select('profile_id')
            .eq(column, nfcId)
            .single();

          if (data?.profile_id) {
            foundProfileId = data.profile_id;
            break;
          }
        }

        if (!foundProfileId) {
          return new Response(
            JSON.stringify({ error: 'NFC card not recognized' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        targetProfileId = foundProfileId;
      } else {
        return new Response(
          JSON.stringify({ error: 'Either email, nfcId, or profileId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Hash the PIN
    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(pin, salt);

    // Update the profile with the hashed PIN
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ nfc_pin_hash: pinHash })
      .eq('id', targetProfileId);

    if (updateError) {
      console.error('Failed to set PIN:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to set PIN' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`PIN set successfully for profile: ${targetProfileId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'PIN set successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Set PIN error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
