import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BusActivityRequest {
  studentNfcId: string;
  busId: string;
  action: 'board' | 'exit';
  location: string;
  latitude?: number;
  longitude?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentNfcId, busId, action, location, latitude, longitude }: BusActivityRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Recording bus activity: ${action} for NFC ${studentNfcId} on bus ${busId}`);

    // Query student by NFC ID
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, first_name, last_name, parent_id, nfc_id')
      .eq('nfc_id', studentNfcId)
      .single();

    if (studentError || !student) {
      console.error('Student not found:', studentError);
      return new Response(
        JSON.stringify({ error: 'Student not found', nfcId: studentNfcId }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate actions
    if (action === 'board') {
      const { data: onBoard } = await supabase
        .from('bus_boarding_logs')
        .select('id')
        .eq('student_id', student.id)
        .eq('action', 'board')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (onBoard) {
        // Check if there's a corresponding exit
        const { data: exitLog } = await supabase
          .from('bus_boarding_logs')
          .select('id')
          .eq('student_id', student.id)
          .eq('action', 'exit')
          .gt('timestamp', (await supabase.from('bus_boarding_logs').select('timestamp').eq('id', onBoard.id).single()).data?.timestamp || '')
          .single();

        if (!exitLog) {
          console.log('Student already on board');
          return new Response(
            JSON.stringify({ error: 'Student already on board', student }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Insert bus boarding log
    const { data: boardingLog, error: boardingError } = await supabase
      .from('bus_boarding_logs')
      .insert({
        student_id: student.id,
        bus_id: busId,
        action: action,
        location: location,
        latitude: latitude,
        longitude: longitude,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (boardingError) {
      console.error('Error recording bus activity:', boardingError);
      return new Response(
        JSON.stringify({ error: 'Failed to record bus activity' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Bus activity recorded successfully:', boardingLog.id);

    // Send notification to parent
    const notificationTitle = action === 'board' 
      ? 'Student Boarded Bus' 
      : 'Student Exited Bus';
    const notificationMessage = action === 'board'
      ? `${student.first_name} ${student.last_name} boarded the bus at ${location}`
      : `${student.first_name} ${student.last_name} exited the bus at ${location}`;

    await supabase.functions.invoke('send-parent-notification', {
      body: {
        parentId: student.parent_id,
        studentId: student.id,
        type: action === 'board' ? 'bus_boarding' : 'bus_exit',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          busId: busId,
          location: location,
          action: action,
          timestamp: boardingLog.timestamp,
        },
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        student: {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          nfc_id: student.nfc_id,
        },
        boarding: boardingLog,
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
