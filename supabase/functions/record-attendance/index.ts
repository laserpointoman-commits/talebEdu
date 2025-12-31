import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AttendanceRequest {
  studentNfcId: string;
  deviceId: string;
  location: string;
  action: 'check_in' | 'check_out';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentNfcId, deviceId, location, action }: AttendanceRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Recording attendance: ${action} for NFC ${studentNfcId} at ${location}`);

    // Query student by NFC ID
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('nfc_id', studentNfcId)
      .single();

    if (studentError || !student) {
      console.error('Student not found:', studentError);
      return new Response(
        JSON.stringify({ error: 'Student not found', nfcId: studentNfcId }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];

    // Check for duplicate actions
    if (action === 'check_in') {
      const { data: existingCheckIn } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('student_id', student.id)
        .eq('date', today)
        .eq('type', 'check_in')
        .single();

      if (existingCheckIn) {
        console.log('Student already checked in today');
        return new Response(
          JSON.stringify({ error: 'Already checked in today', student }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert attendance record
    const { data: attendanceRecord, error: attendanceError } = await supabase
      .from('attendance_records')
      .insert({
        student_id: student.id,
        date: today,
        time: time,
        type: action,
        status: 'present',
        method: 'nfc',
        location: location,
      })
      .select()
      .single();

    if (attendanceError) {
      console.error('Error recording attendance:', attendanceError);
      return new Response(
        JSON.stringify({ error: 'Failed to record attendance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Attendance recorded successfully:', attendanceRecord.id);

    // Send notification to parent
    const notificationTitle = action === 'check_in' 
      ? 'Student Checked In' 
      : 'Student Checked Out';
    const notificationMessage = action === 'check_in'
      ? `${student.first_name} ${student.last_name} has arrived at school`
      : `${student.first_name} ${student.last_name} has left school`;

    if (student.parent_id) {
      await supabase.functions.invoke('send-parent-notification', {
        body: {
          parentId: student.parent_id,
          studentId: student.id,
          type: action === 'check_in' ? 'student_checkin' : 'student_checkout',
          title: notificationTitle,
          message: notificationMessage,
          data: {
            location: location,
            action: action,
            timestamp: attendanceRecord.created_at,
          },
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        student: {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          class: student.class,
          nfc_id: student.nfc_id,
        },
        attendance: attendanceRecord,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
