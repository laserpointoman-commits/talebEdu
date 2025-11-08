import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple validation helpers (Zod not available in Deno by default)
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const validatePassword = (password: string): boolean => {
  return password.length >= 8 && password.length <= 100;
};

const validateRole = (role: string): boolean => {
  const validRoles = ['admin', 'teacher', 'student', 'parent', 'driver', 'finance', 'developer', 'canteen', 'school_attendance', 'bus_attendance'];
  return validRoles.includes(role);
};

const validatePhone = (phone: string | undefined): boolean => {
  if (!phone) return true;
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
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

    // Verify authentication and admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized: No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized: Invalid token');
    }

    // Check if user has admin role
    const { data: userRoles, error: roleError } = await supabaseAdmin
      .from('user_role_assignments')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (roleError || !userRoles || userRoles.length === 0) {
      throw new Error('Forbidden: Admin access required');
    }

    console.log('Authorized user:', user.id, 'with roles:', userRoles.map(r => r.role));

    const { email, password, role, full_name, phone, full_name_ar, parent_user_id } = await req.json();

    // Input validation
    if (!email || !password || !role || !full_name) {
      throw new Error('Email, password, role, and full name are required');
    }

    if (!validateEmail(email)) {
      throw new Error('Invalid email format or email too long (max 255 characters)');
    }

    if (!validatePassword(password)) {
      throw new Error('Password must be between 8 and 100 characters');
    }

    if (!validateRole(role)) {
      throw new Error('Invalid role specified');
    }

    if (full_name.length > 100) {
      throw new Error('Full name must be less than 100 characters');
    }

    if (full_name_ar && full_name_ar.length > 100) {
      throw new Error('Arabic name must be less than 100 characters');
    }

    if (!validatePhone(phone)) {
      throw new Error('Invalid phone number format');
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

      // Update user role in user_role_assignments table
      await supabaseAdmin
        .from('user_role_assignments')
        .upsert({
          user_id: userId,
          role: role as any
        }, { onConflict: 'user_id,role' });
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

      // Create user role
      const { error: roleInsertError } = await supabaseAdmin
        .from('user_role_assignments')
        .insert({
          user_id: userId,
          role: role as any
        });

      if (roleInsertError) {
        console.error('Role creation failed:', roleInsertError);
        throw new Error('Failed to create user role: ' + roleInsertError.message);
      }
      
      console.log('Profile and role created successfully');
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
    
    console.log('User created successfully:', userId);

    // If creating a parent account, generate registration token and send invitation email
    if (role === 'parent' && isNewUser) {
      console.log('Creating parent registration token');
      try {
        const { data: tokenData, error: tokenError } = await supabaseAdmin
          .from('parent_registration_tokens')
          .insert({
            parent_id: userId,
          })
          .select()
          .single();

        if (tokenError) {
          console.error('Failed to create token:', tokenError);
        } else if (tokenData) {
          console.log('Token created, sending invitation email');
          // Send invitation email
          const { error: emailError } = await supabaseAdmin.functions.invoke('send-parent-invitation', {
            body: {
              parentEmail: email,
              parentName: full_name,
              token: tokenData.token,
              loginEmail: email,
              loginPassword: password,
            }
          });

          if (emailError) {
            console.error('Failed to send invitation email:', emailError);
          } else {
            console.log('Invitation email sent successfully');
          }
        }
      } catch (tokenErr) {
        console.error('Error in parent registration flow:', tokenErr);
      }
    }

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
        status: error instanceof Error && error.message.includes('Unauthorized') ? 401 :
                error instanceof Error && error.message.includes('Forbidden') ? 403 : 400,
      }
    );
  }
});