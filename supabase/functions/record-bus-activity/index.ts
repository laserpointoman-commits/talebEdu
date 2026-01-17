import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BusActivityRequest {
  studentNfcId?: string;
  studentId?: string;
  busId: string;
  action: 'board' | 'exit';
  location: string;
  latitude?: number;
  longitude?: number;
  nfc_verified?: boolean;
  manual_entry?: boolean;
  manual_entry_by?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    const { studentNfcId, studentId, busId, action, location, latitude, longitude, nfc_verified = true, manual_entry = false, manual_entry_by }: BusActivityRequest = await req.json();

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Rate limiting: max 60 requests per minute per bus
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      p_identifier: busId,
      p_action_type: 'bus_boarding',
      p_max_requests: 60
    });
    
    if (allowed === false) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', retry_after: 60 }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      );
    }

    let student: any = null;
    if (studentId) {
      const { data } = await supabase.from('students').select('id, first_name, last_name, first_name_ar, last_name_ar, parent_id, nfc_id').eq('id', studentId).single();
      student = data;
    }
    if (!student && studentNfcId) {
      const { data } = await supabase.from('students').select('id, first_name, last_name, first_name_ar, last_name_ar, parent_id, nfc_id').eq('nfc_id', studentNfcId).single();
      student = data;
    }

    if (!student) {
      return new Response(JSON.stringify({ error: 'Student not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const today = new Date().toISOString().split('T')[0];
    const dbAction = action === 'board' ? 'boarded' : 'exited';

    // Check last action
    const { data: lastActivity } = await supabase
      .from('bus_boarding_logs')
      .select('action')
      .eq('student_id', student.id)
      .eq('bus_id', busId)
      .gte('timestamp', `${today}T00:00:00`)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (lastActivity?.action === dbAction) {
      return new Response(JSON.stringify({ error: `Already ${dbAction}`, suggestion: action === 'board' ? 'exit' : 'board' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: log, error } = await supabase
      .from('bus_boarding_logs')
      .insert({
        student_id: student.id,
        bus_id: busId,
        action: dbAction,
        location,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
        nfc_verified,
        manual_entry,
        manual_entry_by
      })
      .select()
      .single();

    if (error) throw error;

    const studentName = `${student.first_name} ${student.last_name}`;

    EdgeRuntime.waitUntil((async () => {
      if (student.parent_id) {
        try {
          await supabase.functions.invoke('send-parent-notification', {
            body: {
              parentId: student.parent_id,
              studentId: student.id,
              type: action === 'board' ? 'bus_boarding' : 'bus_exit',
              title: action === 'board' ? 'Student Boarded Bus' : 'Student Exited Bus',
              message: `${studentName} ${dbAction} the bus at ${location}`,
              data: { busId, location, action, timestamp: log.timestamp }
            }
          });
        } catch (e) { console.error('Notification failed:', e); }
      }
    })());

    return new Response(JSON.stringify({
      success: true,
      student: { id: student.id, name: studentName, nfc_id: student.nfc_id },
      boarding: log,
      processingTimeMs: Math.round(performance.now() - startTime)
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
