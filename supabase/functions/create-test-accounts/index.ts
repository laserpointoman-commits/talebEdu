import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      }
    });

    // Test accounts to create - using emails without dots to avoid issues
    const testAccounts = [
      { email: 'admin@talebschool.com', password: 'Admin123!', role: 'admin', full_name: 'Test Admin' },
      { email: 'teacher@talebschool.com', password: 'Teacher123!', role: 'teacher', full_name: 'Test Teacher' },
      { email: 'student@talebschool.com', password: 'Student123!', role: 'student', full_name: 'Test Student' },
      { email: 'parent@talebschool.com', password: 'Parent123!', role: 'parent', full_name: 'Test Parent' },
      { email: 'driver@talebschool.com', password: 'Driver123!', role: 'driver', full_name: 'Test Driver' },
      { email: 'finance@talebschool.com', password: 'Finance123!', role: 'finance', full_name: 'Test Finance' }
    ];

    const results = [];

  for (const account of testAccounts) {
    try {
      // Special handling for teacher account due to corruption issues
      if (account.email === 'teacher@talebschool.com') {
        // First, try to delete any existing teacher account
        const { data: userData } = await supabase.auth.admin.listUsers();
        const existingTeacher = userData?.users?.find(u => u.email === 'teacher@talebschool.com');
        
        if (existingTeacher) {
          // Delete the existing teacher account completely
          await supabase.auth.admin.deleteUser(existingTeacher.id);
        }
        
        // Create fresh teacher account
        const { data: newTeacher, error: createError } = await supabase.auth.admin.createUser({
          email: 'teacher@talebschool.com',
          password: 'Teacher123!',
          email_confirm: true,
          user_metadata: {
            full_name: 'Test Teacher',
            role: 'teacher'
          }
        });
        
        if (createError) {
          console.error('Failed to create teacher account:', createError);
          results.push({ email: account.email, status: 'error', error: createError.message });
        } else if (newTeacher?.user) {
          // Create profile for teacher
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ 
              id: newTeacher.user.id,
              email: 'teacher@talebschool.com',
              role: 'teacher' as any,
              full_name: 'Test Teacher'
            })
            .select()
            .single();
            
          if (profileError) {
            console.error('Teacher profile error:', profileError);
            results.push({ email: account.email, status: 'profile_error', error: profileError.message });
          } else {
            results.push({ email: account.email, status: 'created_successfully' });
          }
        }
      } else {
        // Handle other accounts normally
        const { data: userData } = await supabase.auth.admin.listUsers();
        const existingUser = userData?.users?.find(u => u.email === account.email);
        
        if (existingUser) {
          // Update password
          const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
            password: account.password,
            email_confirm: true
          });

          if (updateError) {
            console.error(`Password update error for ${account.email}:`, updateError);
            results.push({ email: account.email, status: 'password_update_failed', error: updateError.message });
          } else {
            // Upsert profile
            await supabase
              .from('profiles')
              .upsert({ 
                id: existingUser.id,
                email: account.email,
                role: account.role as any,
                full_name: account.full_name
              });
            
            results.push({ email: account.email, status: 'password_updated' });
          }
        } else {
          // Create new user
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: account.email,
            password: account.password,
            email_confirm: true,
            user_metadata: {
              full_name: account.full_name,
              role: account.role
            }
          });

          if (authError) {
            console.error(`User creation error for ${account.email}:`, authError);
            results.push({ email: account.email, status: 'error', error: authError.message });
          } else if (authData?.user) {
            // Upsert profile
            await supabase
              .from('profiles')
              .upsert({ 
                id: authData.user.id,
                email: account.email,
                role: account.role as any,
                full_name: account.full_name
              });
              
            results.push({ email: account.email, status: 'created_successfully' });
          }
        }
      }
    } catch (err) {
      console.error(`Error processing ${account.email}:`, err);
      results.push({ email: account.email, status: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  }

    return new Response(
      JSON.stringify({ success: true, results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error creating test accounts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});