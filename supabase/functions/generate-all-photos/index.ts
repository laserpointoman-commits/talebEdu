import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Predefined photo prompts for each user
const userPhotos = {
  'student1@student.edu.om': { name: 'Ahmed Hassan Al-Rashdi', gender: 'male', role: 'student' },
  'student2@student.edu.om': { name: 'Fatima Ali Al-Busaidi', gender: 'female', role: 'student' },
  'student3@student.edu.om': { name: 'Mohammed Said Al-Habsi', gender: 'male', role: 'student' },
  'student4@student.edu.om': { name: 'Aisha Khalid Al-Wahaibi', gender: 'female', role: 'student' },
  'student5@student.edu.om': { name: 'Omar Nasser Al-Kindi', gender: 'male', role: 'student' },
  'student6@student.edu.om': { name: 'Mariam Salim Al-Zadjali', gender: 'female', role: 'student' },
  'student7@student.edu.om': { name: 'Yousuf Ibrahim Al-Lawati', gender: 'male', role: 'student' },
  'student8@student.edu.om': { name: 'Sara Abdullah Al-Balushi', gender: 'female', role: 'student' },
  'student9@student.edu.om': { name: 'Khalil Rashid Al-Mamari', gender: 'male', role: 'student' },
  'student10@student.edu.om': { name: 'Zainab Hassan Al-Farsi', gender: 'female', role: 'student' },
  'teacher1@school.edu.om': { name: 'Dr. Khalid Mohammed Al-Harthy', gender: 'male', role: 'teacher' },
  'teacher2@school.edu.om': { name: 'Sarah Ahmed Al-Rawahi', gender: 'female', role: 'teacher' },
  'teacher3@school.edu.om': { name: 'Mohammed Salim Al-Sabti', gender: 'male', role: 'teacher' },
  'teacher4@school.edu.om': { name: 'Layla Hassan Al-Busaidi', gender: 'female', role: 'teacher' },
  'teacher5@school.edu.om': { name: 'Ahmed Nasser Al-Zadjali', gender: 'male', role: 'teacher' },
  'teacher6@school.edu.om': { name: 'Noura Ali Al-Balushi', gender: 'female', role: 'teacher' },
  'teacher7@school.edu.om': { name: 'Yousuf Ibrahim Al-Wahaibi', gender: 'male', role: 'teacher' },
  'teacher8@school.edu.om': { name: 'Maryam Said Al-Kindi', gender: 'female', role: 'teacher' },
  'teacher9@school.edu.om': { name: 'Hassan Rashid Al-Farsi', gender: 'male', role: 'teacher' },
  'teacher10@school.edu.om': { name: 'Amal Khalifa Al-Habsi', gender: 'female', role: 'teacher' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = [];
    
    // Process each user
    for (const [email, userData] of Object.entries(userPhotos)) {
      try {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (profileError || !profile) {
          results.push({ email, success: false, error: 'Profile not found' });
          continue;
        }

        // Skip if already has avatar
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', profile.id)
          .single();

        if (existingProfile?.avatar_url) {
          results.push({ email, success: true, message: 'Already has avatar' });
          continue;
        }

        // Generate prompt based on role and gender
        let prompt = '';
        if (userData.role === 'student') {
          if (userData.gender === 'female') {
            prompt = `Professional passport-style school photo of an Omani teenage girl student, age 14-16, wearing white Omani school uniform with white hijab, neutral light blue background, formal school photo style, friendly expression, high quality portrait photography`;
          } else {
            prompt = `Professional passport-style school photo of an Omani teenage boy student, age 14-16, wearing white Omani school dishdasha uniform, neutral light blue background, formal school photo style, friendly expression, high quality portrait photography`;
          }
        } else {
          if (userData.gender === 'female') {
            prompt = `Professional portrait photo of an Omani female teacher, age 30-45, wearing traditional Omani hijab and modest professional attire, neutral office background, professional expression, high quality portrait photography`;
          } else {
            prompt = `Professional portrait photo of an Omani male teacher, age 30-45, wearing traditional white Omani dishdasha and kumma (cap), neutral office background, professional expression, high quality portrait photography`;
          }
        }

        console.log(`Generating photo for ${email}`);

        // Call Lovable AI to generate image
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            modalities: ['image', 'text']
          })
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`Failed to generate image for ${email}:`, error);
          results.push({ email, success: false, error: 'Image generation failed' });
          continue;
        }

        const data = await response.json();
        const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (!imageData) {
          results.push({ email, success: false, error: 'No image generated' });
          continue;
        }

        // Extract base64 data
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload to Supabase Storage
        const fileName = `${profile.id}/${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload error for ${email}:`, uploadError);
          results.push({ email, success: false, error: 'Upload failed' });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);

        // Update user profile with avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`Profile update error for ${email}:`, updateError);
          results.push({ email, success: false, error: 'Profile update failed' });
          continue;
        }

        results.push({ 
          email, 
          success: true, 
          avatarUrl: publicUrl 
        });
        
        console.log(`Successfully generated photo for ${email}`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`Error processing ${email}:`, error);
        results.push({ 
          email, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
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