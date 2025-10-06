import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    const { email, password, role, full_name, phone, full_name_ar, parent_user_id } = await req.json();

    if (!email || !password || !role || !full_name) {
      throw new Error('Email, password, role, and full name are required');
    }

    console.log('Creating user:', email, 'with role:', role);

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    let userId: string;
    let isNewUser = !existingProfile;

    if (existingProfile) {
      console.log('Profile exists, updating');
      userId = existingProfile.id;
      
      await supabaseAdmin
        .from('profiles')
        .update({
          full_name,
          full_name_ar,
          phone,
          role: role as any,
          parent_user_id: parent_user_id || null
        })
        .eq('id', userId);

      // Try updating password
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, { password });
      } catch (e) {
        console.warn('Could not update password');
      }
    } else {
      // Try creating via admin API first
      try {
        console.log('Attempting admin.createUser');
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name, role, full_name_ar, phone }
        });

        if (authError) throw authError;
        userId = authUser.user!.id;
        console.log('Auth user created:', userId);
      } catch (authErr: any) {
        console.error('Admin API failed:', authErr.message);
        // If admin API fails, try the RPC function
        try {
          console.log('Trying RPC fallback');
          const { data: rpcUserId, error: rpcError } = await supabaseAdmin.rpc('create_auth_user', {
            p_email: email,
            p_password: password,
            p_metadata: { full_name, role, full_name_ar, phone }
          });

          if (rpcError) throw rpcError;
          userId = rpcUserId as string;
          console.log('RPC user created:', userId);
        } catch (rpcErr: any) {
          throw new Error('Failed to create auth user: ' + (authErr.message || rpcErr.message));
        }
      }

      // Create or update profile (handle trigger race condition)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email,
          full_name,
          full_name_ar,
          phone,
          role: role as any,
          parent_user_id: parent_user_id || null,
          is_active: true
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (profileError) {
        console.error('Profile creation failed:', profileError);
        throw new Error('Failed to create profile: ' + profileError.message);
      }
      
      console.log('Profile created/updated successfully');
    }

    // Create role-specific records only for roles that need them
    if (role === 'teacher' && isNewUser) {
      console.log('Creating teacher record');
      await supabaseAdmin.from('teachers').upsert({
        id: crypto.randomUUID(),
        profile_id: userId,
        employee_id: 'TCH-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        nfc_id: 'NFC-TCH-' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0'),
        join_date: new Date().toISOString().split('T')[0]
      }, { onConflict: 'profile_id' });
    }

    if (role === 'student' && isNewUser) {
      console.log('Creating student record');
      await supabaseAdmin.from('students').upsert({
        id: crypto.randomUUID(),
        profile_id: userId,
        student_id: 'STD-' + Math.floor(Math.random() * 100000).toString(),
        nfc_id: 'NFC-STD-' + Math.floor(Math.random() * 1000000000).toString(),
        parent_id: parent_user_id || null,
        grade: '10',
        class: '10A',
        gender: 'male',
        nationality: 'Omani',
        status: 'active'
      }, { onConflict: 'profile_id' });
    }

    if (role === 'driver' && isNewUser) {
      console.log('Creating driver record');
      await supabaseAdmin.from('drivers').upsert({
        id: crypto.randomUUID(),
        profile_id: userId,
        employee_id: 'DRV-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        license_number: 'LIC-' + Math.floor(Math.random() * 1000000).toString(),
        status: 'active'
      }, { onConflict: 'profile_id' });
    }
    
    // Note: school_attendance and bus_attendance roles don't need separate entity tables
    console.log('Role-specific records handled for role:', role);

    console.log('User created successfully:', userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        userId,
        role 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
