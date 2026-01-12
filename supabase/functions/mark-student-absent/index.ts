import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarkAbsentRequest {
  studentId: string;
  busId: string;
  tripType: 'pickup' | 'dropoff';
  supervisorId: string;
  reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentId, busId, tripType, supervisorId, reason }: MarkAbsentRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Marking student ${studentId} as absent from bus ${busId}`);

    // Get student info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, first_name, last_name, first_name_ar, last_name_ar, parent_id, class')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: 'Student not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert absence record in bus_boarding_logs with action 'absent'
    const { data: absentLog, error: logError } = await supabase
      .from('bus_boarding_logs')
      .insert({
        student_id: studentId,
        bus_id: busId,
        action: 'absent',
        location: tripType === 'pickup' ? 'Did not board at home' : 'Did not board at school',
        timestamp: new Date().toISOString(),
        nfc_verified: false,
        manual_entry: true,
        manual_entry_by: supervisorId,
      })
      .select()
      .single();

    if (logError) {
      console.error('Error recording absence:', logError);
      return new Response(
        JSON.stringify({ error: 'Failed to record absence' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notification to parent
    const studentName = `${student.first_name} ${student.last_name}`;
    const studentNameAr = `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`;
    
    const notificationMessage = tripType === 'pickup'
      ? `${studentName} did not board the school bus this morning. Please ensure your child's safety.`
      : `${studentName} did not board the return bus from school.`;
    
    const notificationMessageAr = tripType === 'pickup'
      ? `${studentNameAr} لم يصعد إلى حافلة المدرسة هذا الصباح. يرجى التأكد من سلامة طفلك.`
      : `${studentNameAr} لم يصعد إلى حافلة العودة من المدرسة.`;

    try {
      await supabase.functions.invoke('send-parent-notification', {
        body: {
          parentId: student.parent_id,
          studentId: student.id,
          type: 'bus_absent',
          title: 'Student Bus Absence',
          titleAr: 'غياب عن الحافلة',
          message: notificationMessage,
          messageAr: notificationMessageAr,
          data: {
            busId,
            tripType,
            reason: reason || 'No show',
            timestamp: absentLog.timestamp,
          },
        },
      });
    } catch (notifError) {
      console.warn('Failed to send parent notification:', notifError);
    }

    // Log for admin dashboard
    console.log(`Student ${studentName} marked absent from bus ${busId} - ${tripType} trip`);

    return new Response(
      JSON.stringify({
        success: true,
        student: {
          id: student.id,
          name: studentName,
          nameAr: studentNameAr,
          class: student.class,
        },
        absence: absentLog,
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
