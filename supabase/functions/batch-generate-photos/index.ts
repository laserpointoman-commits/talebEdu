import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users without avatars
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .is('avatar_url', null)
      .in('email', [
        'student1@student.edu.om', 'student2@student.edu.om', 'student3@student.edu.om',
        'student4@student.edu.om', 'student5@student.edu.om', 'student6@student.edu.om',
        'student7@student.edu.om', 'student8@student.edu.om', 'student9@student.edu.om',
        'student10@student.edu.om',
        'teacher1@school.edu.om', 'teacher2@school.edu.om', 'teacher3@school.edu.om',
        'teacher4@school.edu.om', 'teacher5@school.edu.om', 'teacher6@school.edu.om',
        'teacher7@school.edu.om', 'teacher8@school.edu.om', 'teacher9@school.edu.om',
        'teacher10@school.edu.om'
      ]);

    if (profilesError) {
      throw profilesError;
    }

    // Get student gender information
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('profile_id, gender');

    if (studentsError) {
      throw studentsError;
    }

    const studentGenderMap = new Map(students?.map(s => [s.profile_id, s.gender]) || []);

    const results = [];
    
    // Process each profile
    for (const profile of profiles || []) {
      try {
        const gender = profile.role === 'student' 
          ? studentGenderMap.get(profile.id) 
          : undefined;

        // Call the generate-profile-photo function
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-profile-photo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: profile.id,
            name: profile.full_name,
            role: profile.role,
            gender: gender
          })
        });

        if (response.ok) {
          const data = await response.json();
          results.push({
            userId: profile.id,
            name: profile.full_name,
            success: true,
            avatarUrl: data.avatarUrl
          });
          console.log(`Generated photo for ${profile.full_name}`);
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          const error = await response.text();
          results.push({
            userId: profile.id,
            name: profile.full_name,
            success: false,
            error: error
          });
          console.error(`Failed for ${profile.full_name}:`, error);
        }
      } catch (error) {
        results.push({
          userId: profile.id,
          name: profile.full_name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`Error processing ${profile.full_name}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: results.length,
        results: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});