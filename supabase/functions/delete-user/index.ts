import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create admin client for authentication check
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Authenticate the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user has admin role
    const { data: callerRoles } = await supabaseAdmin
      .from('user_role_assignments')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')

    if (!callerRoles || callerRoles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Admin role required.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user role from user_role_assignments
    const { data: targetRoles } = await supabaseAdmin
      .from('user_role_assignments')
      .select('role')
      .eq('user_id', userId)

    // Check if user exists in profiles
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!targetProfile) {
      return new Response(
        JSON.stringify({ error: 'User not found in profiles' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const targetRole = targetRoles && targetRoles.length > 0 ? targetRoles[0].role : null
    console.log('Deleting user with role:', targetRole)

    // Delete role assignment
    await supabaseAdmin
      .from('user_role_assignments')
      .delete()
      .eq('user_id', userId)

    // First, manually delete related records based on role
    if (targetRole === 'student') {
      // Delete student record (will cascade to related tables)
      const { error: studentError } = await supabaseAdmin
        .from('students')
        .delete()
        .eq('profile_id', userId)
      
      if (studentError) {
        console.error('Error deleting student record:', studentError)
      }
    } else if (targetRole === 'teacher') {
      // Delete teacher record
      const { error: teacherError } = await supabaseAdmin
        .from('teachers')
        .delete()
        .eq('profile_id', userId)
      
      if (teacherError) {
        console.error('Error deleting teacher record:', teacherError)
      }
    } else if (targetRole === 'driver') {
      // Delete driver record
      const { error: driverError } = await supabaseAdmin
        .from('drivers')
        .delete()
        .eq('profile_id', userId)
      
      if (driverError) {
        console.error('Error deleting driver record:', driverError)
      }
    }

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user profile: ' + profileError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Try to delete from auth, but don't fail if there's an issue
    // (Supabase auth sometimes has scanning issues with corrupted records)
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (authError) {
        console.warn('Warning: Could not delete from auth.users, but profile deleted:', authError.message)
        // Still return success since profile is deleted
      }
    } catch (authException) {
      console.warn('Exception deleting from auth.users:', authException)
      // Continue - profile deletion is what matters
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in delete-user function:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
