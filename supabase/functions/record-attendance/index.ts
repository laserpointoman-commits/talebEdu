import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  try {
    const body: AttendanceRequest = await req.json();
    const { studentNfcId, studentId, deviceId, location, action, nfcVerified = true, manualEntry = false } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Recording attendance: ${action} for ${studentNfcId || studentId} at ${location}`);

    // Find student by NFC ID or student ID
    let student;
    if (studentNfcId) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('nfc_id', studentNfcId)
        .single();
      
      if (error || !data) {
        console.error('Student not found by NFC ID:', error);
        return new Response(
          JSON.stringify({ error: 'Student not found', nfcId: studentNfcId }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      student = data;
    } else if (studentId) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (error || !data) {
        console.error('Student not found by ID:', error);
        return new Response(
          JSON.stringify({ error: 'Student not found', studentId }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      student = data;
    } else {
      return new Response(
        JSON.stringify({ error: 'Either studentNfcId or studentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];

    // Normalize action to entry/exit format
    const normalizedType = (action === 'check_in' || action === 'entry') ? 'entry' : 'exit';

    // Check for duplicate actions (same student, same action, same day)
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('student_id', student.id)
      .eq('date', today)
      .eq('type', normalizedType)
      .single();

    if (existingRecord) {
      console.log(`Student already has ${normalizedType} record today`);
      return new Response(
        JSON.stringify({ 
          error: `Already recorded ${normalizedType} today`, 
          student: {
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
          },
          existingRecord: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert attendance record
    const { data: attendanceRecord, error: attendanceError } = await supabase
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
        recorded_by: deviceId
      })
      .select()
      .single();

    if (attendanceError) {
      console.error('Error recording attendance:', attendanceError);
      return new Response(
        JSON.stringify({ error: 'Failed to record attendance', details: attendanceError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Attendance recorded successfully:', attendanceRecord.id);

    // Send notification to parent
    const studentName = `${student.first_name} ${student.last_name}`;
    const notificationTitle = normalizedType === 'entry' 
      ? 'Student Checked In' 
      : 'Student Checked Out';
    const notificationMessage = normalizedType === 'entry'
      ? `${studentName} has arrived at school at ${location}`
      : `${studentName} has left school from ${location}`;

    if (student.parent_id) {
      try {
        await supabase.functions.invoke('send-parent-notification', {
          body: {
            parentId: student.parent_id,
            studentId: student.id,
            type: normalizedType === 'entry' ? 'student_checkin' : 'student_checkout',
            title: notificationTitle,
            message: notificationMessage,
            data: {
              location: location,
              action: normalizedType,
              timestamp: attendanceRecord.created_at,
            },
          },
        });
        console.log('Parent notification sent');
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    // Process daily allowance on check-in
    if (normalizedType === 'entry') {
      try {
        await supabase.functions.invoke('process-daily-allowance', {
          body: { studentId: student.id }
        });
        console.log('Daily allowance processed');
      } catch (allowanceError) {
        console.error('Error processing allowance:', allowanceError);
        // Don't fail the request if allowance processing fails
      }
    }

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
        attendance: attendanceRecord,
        action: normalizedType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
