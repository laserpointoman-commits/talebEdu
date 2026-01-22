import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NfcPinLoginRequest {
  nfcId: string;
  pin: string;
  email?: string;
}

function normalizeNfcId(raw: string): string {
  const cleaned = (raw ?? '')
    .replace(/\u0000/g, '')
    .replace(/^NFC\s*[:\-]\s*/i, '')
    .trim();

  const compact = cleaned.replace(/[^0-9a-fA-F]/g, '');
  const looksLikeHexUid = compact.length >= 8 && compact.length <= 32 && /^[0-9a-fA-F]+$/.test(compact);
  return looksLikeHexUid ? compact.toUpperCase() : cleaned;
}

function buildNfcCandidates(raw: string): string[] {
  const base = normalizeNfcId(raw);
  const candidates = new Set<string>();
  candidates.add(base);
  candidates.add(base.toLowerCase());
  candidates.add(base.toUpperCase());

  const compact = base.replace(/[^0-9a-fA-F]/g, '');
  if (compact) {
    candidates.add(compact);
    candidates.add(compact.toUpperCase());
    candidates.add(compact.toLowerCase());
  }

  // CM30/Android sometimes returns IDs like "FC243848647" while DB stores
  // staff cards as "NFC-243848647" / "TCH-243848647".
  const fcMatch = base.match(/^FC\s*([0-9]+)$/i);
  const numericRaw = fcMatch?.[1] ?? base.replace(/\D/g, '');
  if (numericRaw && numericRaw.length >= 6) {
    const paddedVariants = new Set<string>([numericRaw]);
    if (numericRaw.length < 9) paddedVariants.add(numericRaw.padStart(9, '0'));
    if (numericRaw.length < 10) paddedVariants.add(numericRaw.padStart(10, '0'));

    for (const num of paddedVariants) {
      candidates.add(num);
      candidates.add(`NFC-${num}`);
      candidates.add(`TCH-${num}`);
      candidates.add(`nfc-${num}`);
      candidates.add(`tch-${num}`);
    }
  }
  return Array.from(candidates).filter(Boolean);
}

// Convert Uint8Array to hex string
function toHexString(bytes: Uint8Array): string {
  return new TextDecoder().decode(hexEncode(bytes));
}

// Verify PIN against stored hash
async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  try {
    const [saltHex, originalHashHex] = storedHash.split(':');
    if (!saltHex || !originalHashHex) return false;
    
    // Combine salt and pin
    const encoder = new TextEncoder();
    const data = encoder.encode(saltHex + pin);
    
    // Hash the combined data
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = toHexString(new Uint8Array(hashBuffer));
    
    // Compare hashes
    return hashHex === originalHashHex;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nfcId: rawNfcId, pin, email: providedEmail }: NfcPinLoginRequest = await req.json();
    const nfcId = normalizeNfcId(rawNfcId);
    const nfcCandidates = buildNfcCandidates(rawNfcId);

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

    let userEmail = providedEmail;
    let profileId: string | null = null;

    // If email not provided, look up by NFC ID
    if (!userEmail) {
      // NOTE: supervisors/drivers tables do NOT have nfc_id in this database.
      // NFC mapping is stored in employees.nfc_id (and teachers.nfc_id).
      const { data: employee } = await supabase
        .from('employees')
        .select('profile_id')
        .in('nfc_id', nfcCandidates.length ? nfcCandidates : [nfcId])
        .maybeSingle();

      if (employee?.profile_id) {
        profileId = employee.profile_id;
      } else {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('profile_id')
          .in('nfc_id', nfcCandidates.length ? nfcCandidates : [nfcId])
          .maybeSingle();

        if (teacher?.profile_id) {
          profileId = teacher.profile_id;
        }
      }

      if (!profileId) {
        return new Response(
          JSON.stringify({ error: 'NFC card not recognized', found: false, reason: 'not_recognized' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get email from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, nfc_pin_hash, role')
        .eq('id', profileId)
        .single();

      if (!profile) {
        return new Response(
          JSON.stringify({ error: 'Profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is staff (not parent or student)
      const staffRoles = ['admin', 'teacher', 'driver', 'supervisor', 'finance', 'canteen', 'school_attendance'];
      if (!staffRoles.includes(profile.role)) {
        return new Response(
          JSON.stringify({ error: 'NFC login is only available for staff accounts' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userEmail = profile.email;

      // Check if PIN is set
      if (!profile.nfc_pin_hash) {
        return new Response(
          JSON.stringify({ error: 'PIN not set', needsSetup: true, email: userEmail, profileId }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify PIN using SHA-256
      const pinValid = await verifyPin(pin, profile.nfc_pin_hash);
      if (!pinValid) {
        return new Response(
          JSON.stringify({ error: 'Incorrect PIN' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Email provided, get profile and verify PIN
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, nfc_pin_hash, role')
        .eq('email', userEmail)
        .single();

      if (!profile) {
        return new Response(
          JSON.stringify({ error: 'Profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      profileId = profile.id;

      // Check if user is staff
      const staffRoles = ['admin', 'teacher', 'driver', 'supervisor', 'finance', 'canteen', 'school_attendance'];
      if (!staffRoles.includes(profile.role)) {
        return new Response(
          JSON.stringify({ error: 'NFC login is only available for staff accounts' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!profile.nfc_pin_hash) {
        return new Response(
          JSON.stringify({ error: 'PIN not set', needsSetup: true, email: userEmail, profileId }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const pinValid = await verifyPin(pin, profile.nfc_pin_hash);
      if (!pinValid) {
        return new Response(
          JSON.stringify({ error: 'Incorrect PIN' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // PIN verified! Generate magic link and create session
    console.log(`Generating session for user: ${userEmail}`);

    const { data: magicLink, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail!,
    });

    if (linkError || !magicLink?.properties?.hashed_token) {
      console.error('Failed to generate magic link:', linkError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use verifyOtp to create session from the hashed token
    const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: magicLink.properties.hashed_token,
      type: 'email',
    });

    if (verifyError || !sessionData?.session) {
      console.error('Failed to verify OTP:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Session created successfully for: ${userEmail}`);

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
          expires_in: sessionData.session.expires_in,
          expires_at: sessionData.session.expires_at,
          user: sessionData.session.user,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('NFC PIN login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
