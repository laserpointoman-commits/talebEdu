import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AttendanceRequest {
  studentNfcId?: string;
  studentId?: string;
  deviceId: string;
  location: string;
  action: 'check_in' | 'check_out' | 'entry' | 'exit';
  nfcVerified?: boolean;
  manualEntry?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    const body: AttendanceRequest = await req.json();
    const { studentNfcId, studentId, deviceId, location, action, nfcVerified = true, manualEntry = false } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fast student lookup
    let student: any = null;
    if (studentNfcId) {
      const { data } = await supabase
        .from('students')
        .select('id, first_name, last_name, first_name_ar, last_name_ar, parent_id, nfc_id, class')
        .eq('nfc_id', studentNfcId)
        .single();
      student = data;
    } else if (studentId) {
      const { data } = await supabase
        .from('students')
        .select('id, first_name, last_name, first_name_ar, last_name_ar, parent_id, nfc_id, class')
        .eq('id', studentId)
        .single();
      student = data;
    }

    if (!student) {
      return new Response(
        JSON.stringify({ error: 'Student not found', nfcId: studentNfcId, studentId }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    const normalizedType = (action === 'check_in' || action === 'entry') ? 'entry' : 'exit';
    const idempotencyKey = `${student.id}_${today}_${normalizedType}`;

    // Check for duplicate
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('student_id', student.id)
      .eq('date', today)
      .eq('type', normalizedType)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ 
          error: `Already recorded ${normalizedType} today`, 
          student: { id: student.id, name: `${student.first_name} ${student.last_name}` },
          existingRecord: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert with idempotency
    const { data: record, error: insertError } = await supabase
      .from('attendance_records')
      .insert({
        student_id: student.id,
        date: today,
        time: time,
        type: normalizedType,
        status: 'present',
        method: nfcVerified ? 'nfc' : 'manual',
        location: location,
        nfc_verified: nfcVerified,
        manual_entry: manualEntry,
        recorded_by: deviceId,
        idempotency_key: idempotencyKey
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') { // Unique violation = duplicate
        return new Response(
          JSON.stringify({ error: 'Duplicate request', existingRecord: true }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw insertError;
    }

    const studentName = `${student.first_name} ${student.last_name}`;
    const processingTime = Math.round(performance.now() - startTime);

    // Background tasks
    EdgeRuntime.waitUntil((async () => {
      if (student.parent_id) {
        try {
          await supabase.functions.invoke('send-parent-notification', {
            body: {
              parentId: student.parent_id,
              studentId: student.id,
              type: normalizedType === 'entry' ? 'student_checkin' : 'student_checkout',
              title: normalizedType === 'entry' ? 'Student Checked In' : 'Student Checked Out',
              message: `${studentName} has ${normalizedType === 'entry' ? 'arrived at' : 'left'} school`,
              data: { location, action: normalizedType, timestamp: now.toISOString() }
            }
          });
        } catch (e) { console.error('Notification failed:', e); }
      }
      if (normalizedType === 'entry') {
        try {
          await supabase.functions.invoke('process-daily-allowance', { body: { studentId: student.id } });
        } catch (e) { console.error('Allowance failed:', e); }
      }
    })());

    return new Response(
      JSON.stringify({
        success: true,
        student: {
          id: student.id,
          name: studentName,
          nameAr: `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`,
          class: student.class,
          nfc_id: student.nfc_id,
        },
        attendance: record,
        action: normalizedType,
        processingTimeMs: processingTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
