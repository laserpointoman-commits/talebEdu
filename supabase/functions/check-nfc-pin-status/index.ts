import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckPinRequest {
  nfcId?: string;
  email?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nfcId, email }: CheckPinRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    let profileId: string | null = null;
    let userEmail: string | null = email || null;

    // If NFC ID provided, look up the profile
    if (nfcId && !email) {
      // Try employees first
      const { data: employee } = await supabase
        .from('employees')
        .select('profile_id')
        .eq('nfc_id', nfcId)
        .single();

      if (employee?.profile_id) {
        profileId = employee.profile_id;
      } else {
        // Try supervisors
        const { data: supervisor } = await supabase
          .from('supervisors')
          .select('profile_id')
          .eq('nfc_id', nfcId)
          .single();

        if (supervisor?.profile_id) {
          profileId = supervisor.profile_id;
        } else {
          // Try teachers
          const { data: teacher } = await supabase
            .from('teachers')
            .select('profile_id')
            .eq('nfc_id', nfcId)
            .single();

          if (teacher?.profile_id) {
            profileId = teacher.profile_id;
          } else {
            // Try drivers
            const { data: driver } = await supabase
              .from('drivers')
              .select('profile_id')
              .eq('nfc_id', nfcId)
              .single();

            if (driver?.profile_id) {
              profileId = driver.profile_id;
            }
          }
        }
      }

      if (!profileId) {
        return new Response(
          JSON.stringify({ error: 'NFC card not recognized', found: false }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get profile data
    let query = supabase
      .from('profiles')
      .select('id, email, full_name, full_name_ar, role, nfc_pin_hash');

    if (profileId) {
      query = query.eq('id', profileId);
    } else if (email) {
      query = query.eq('email', email);
    } else {
      return new Response(
        JSON.stringify({ error: 'Either nfcId or email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile, error } = await query.single();

    if (error || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found', found: false }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is staff
    const staffRoles = ['admin', 'teacher', 'driver', 'supervisor', 'finance', 'canteen', 'school_attendance'];
    if (!staffRoles.includes(profile.role)) {
      return new Response(
        JSON.stringify({ 
          error: 'NFC login is only available for staff accounts',
          found: true,
          isStaff: false,
          role: profile.role
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        found: true,
        isStaff: true,
        hasPinSet: !!profile.nfc_pin_hash,
        email: profile.email,
        name: profile.full_name,
        nameAr: profile.full_name_ar,
        role: profile.role,
        profileId: profile.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Check PIN status error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
