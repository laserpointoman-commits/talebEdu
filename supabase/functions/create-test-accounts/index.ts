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
    // Create admin client with service role key - this bypasses RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
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

  // Get all existing users first
  const { data: userData } = await supabase.auth.admin.listUsers();
  const existingUsers = userData?.users || [];
  
  console.log(`Found ${existingUsers.length} existing users`);

  for (const account of testAccounts) {
    try {
      const existingUser = existingUsers.find(u => u.email === account.email);
      
      if (existingUser) {
        console.log(`User ${account.email} already exists with ID: ${existingUser.id}`);
        
        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password: account.password,
          email_confirm: true,
          user_metadata: {
            full_name: account.full_name,
            role: account.role
          }
        });

        if (updateError) {
          console.error(`Password update error for ${account.email}:`, updateError);
        } else {
          console.log(`Password updated for ${account.email}`);
        }

        // Ensure profile exists - delete and recreate to avoid RLS issues
        console.log(`Checking profile for ${account.email} with role ${account.role}`);
        
        // Delete existing profile if it exists
        await supabase
          .from('profiles')
          .delete()
          .eq('id', existingUser.id);
        
        // Insert new profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({ 
            id: existingUser.id,
            email: account.email,
            role: account.role as any,
            full_name: account.full_name
          })
          .select()
          .single();
          
        if (profileError) {
          console.error(`Profile error for ${account.email}:`, profileError);
          results.push({ email: account.email, status: 'profile_error', error: profileError.message, user_id: existingUser.id });
        } else {
          console.log(`Profile created successfully for ${account.email}`, profileData);
          results.push({ email: account.email, status: 'updated', user_id: existingUser.id });
        }
      } else {
        console.log(`Creating new user ${account.email}`);
        
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
          console.log(`User created successfully: ${account.email} with ID: ${authData.user.id}`);
          
          // Create profile
          console.log(`Creating profile for new user ${account.email}`);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({ 
              id: authData.user.id,
              email: account.email,
              role: account.role as any,
              full_name: account.full_name
            })
            .select()
            .single();
            
          if (profileError) {
            console.error(`Profile creation error for ${account.email}:`, profileError);
            results.push({ email: account.email, status: 'profile_error', error: profileError.message, user_id: authData.user.id });
          } else {
            console.log(`Profile created successfully for ${account.email}`, profileData);
            results.push({ email: account.email, status: 'created', user_id: authData.user.id });
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