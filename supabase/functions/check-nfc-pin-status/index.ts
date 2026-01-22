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

function normalizeNfcId(raw: string): string {
  const cleaned = (raw ?? '')
    .replace(/\u0000/g, '')
    .replace(/^NFC\s*[:\-]\s*/i, '')
    .trim();

  // If it looks like a hex UID, canonicalize to uppercase without separators.
  const compact = cleaned.replace(/[^0-9a-fA-F]/g, '');
  const looksLikeHexUid = compact.length >= 8 && compact.length <= 32 && /^[0-9a-fA-F]+$/.test(compact);
  return looksLikeHexUid ? compact.toUpperCase() : cleaned;
}

function buildNfcCandidates(nfcId: string): string[] {
  const base = normalizeNfcId(nfcId);
  const candidates = new Set<string>();
  candidates.add(base);
  candidates.add(base.toLowerCase());
  candidates.add(base.toUpperCase());

  // Also try a compact variant (strip separators) in case DB stored it differently.
  const compact = base.replace(/[^0-9a-fA-F]/g, '');
  if (compact) {
    candidates.add(compact);
    candidates.add(compact.toUpperCase());
    candidates.add(compact.toLowerCase());
  }

  // CM30/Android sometimes returns a proprietary format like "FC243848647"
  // while the DB stores staff cards as "NFC-243848647" or "TCH-243848647".
  // Extract the numeric portion and try those prefixed variants.
  const fcMatch = base.match(/^FC\s*([0-9]+)$/i);
  const numericRaw = fcMatch?.[1] ?? base.replace(/\D/g, '');
  if (numericRaw && numericRaw.length >= 6) {
    const paddedVariants = new Set<string>([numericRaw]);
    // Try common fixed lengths (keep minimal to avoid false positives)
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nfcId: rawNfcId, email }: CheckPinRequest = await req.json();
    const nfcId = rawNfcId ? normalizeNfcId(rawNfcId) : undefined;
    const nfcCandidates = rawNfcId ? buildNfcCandidates(rawNfcId) : [];

    console.log('[check-nfc-pin-status] request', {
      hasEmail: !!email,
      rawNfcId: rawNfcId ?? null,
      nfcId: nfcId ?? null,
      candidates: nfcCandidates,
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    let profileId: string | null = null;
    let userEmail: string | null = email || null;

    // If NFC ID provided, look up the profile
    if (nfcId && !email) {
      // Try employees first (this is where NFC mapping lives for most staff)
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('profile_id')
        .in('nfc_id', nfcCandidates.length ? nfcCandidates : [nfcId])
        .maybeSingle();

      if (employeeError) {
        console.error('[check-nfc-pin-status] employees lookup error', employeeError);
      }

      if (employee?.profile_id) {
        profileId = employee.profile_id;
      } else {
        // supervisors/drivers tables do NOT have nfc_id in this database.
        // Teachers may have their own nfc_id.
        const { data: teacher, error: teacherError } = await supabase
          .from('teachers')
          .select('profile_id')
          .in('nfc_id', nfcCandidates.length ? nfcCandidates : [nfcId])
          .maybeSingle();

        if (teacherError) {
          console.error('[check-nfc-pin-status] teachers lookup error', teacherError);
        }

        if (teacher?.profile_id) {
          profileId = teacher.profile_id;
        }
      }

      if (!profileId) {
        // IMPORTANT: return 200 so clients don't treat "unknown card" as a transport error
        // (which shows "Failed to verify card").
        return new Response(
          JSON.stringify({ found: false, reason: 'not_recognized' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
