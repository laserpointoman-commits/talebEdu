import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  try {
    const { 
      studentNfcId, 
      studentId,
      busId, 
      action, 
      location, 
      latitude, 
      longitude,
      nfc_verified = true,
      manual_entry = false,
      manual_entry_by
    }: BusActivityRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Recording bus activity: ${action} for ${studentNfcId || studentId} on bus ${busId} (manual: ${manual_entry})`);

    let student: any = null;

    // Query student by ID or NFC ID
    if (studentId) {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, first_name_ar, last_name_ar, parent_id, nfc_id')
        .eq('id', studentId)
        .single();
      
      if (!error && data) {
        student = data;
      }
    }
    
    if (!student && studentNfcId) {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, first_name_ar, last_name_ar, parent_id, nfc_id')
        .eq('nfc_id', studentNfcId)
        .single();
      
      if (!error && data) {
        student = data;
      }
    }

    if (!student) {
      console.error('Student not found');
      return new Response(
        JSON.stringify({ error: 'Student not found', studentId, studentNfcId }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate boarding today
    const today = new Date().toISOString().split('T')[0];
    if (action === 'board') {
      const { data: existingBoard } = await supabase
        .from('bus_boarding_logs')
        .select('id, action')
        .eq('student_id', student.id)
        .eq('bus_id', busId)
        .gte('timestamp', `${today}T00:00:00`)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (existingBoard && existingBoard.action === 'boarded') {
        console.log('Student already boarded today on this bus');
        return new Response(
          JSON.stringify({ 
            error: 'Student already boarded', 
            student: { id: student.id, name: `${student.first_name} ${student.last_name}` }
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Map action values to match database constraint (board -> boarded, exit -> exited)
    const dbAction = action === 'board' ? 'boarded' : 'exited';

    // Insert bus boarding log
    const { data: boardingLog, error: boardingError } = await supabase
      .from('bus_boarding_logs')
      .insert({
        student_id: student.id,
        bus_id: busId,
        action: dbAction,
        location: location,
        latitude: latitude,
        longitude: longitude,
        timestamp: new Date().toISOString(),
        nfc_verified: nfc_verified,
        manual_entry: manual_entry,
        manual_entry_by: manual_entry_by,
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

    try {
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
            manual_entry: manual_entry,
          },
        },
      });
    } catch (notifError) {
      console.warn('Failed to send parent notification:', notifError);
      // Don't fail the whole request if notification fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        student: {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          nameAr: `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`,
          nfc_id: student.nfc_id,
        },
        boarding: boardingLog,
        manual_entry: manual_entry,
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
