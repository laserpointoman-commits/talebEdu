import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get the user's auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    console.log(`Checking if ${user.email} is a test account...`)

    // Check if this is a test account
    const { data: isTestAccount, error: checkError } = await supabase
      .rpc('is_test_account', { user_email: user.email })
    
    if (checkError) {
      console.error('Error checking test account:', checkError)
      throw checkError
    }

    if (!isTestAccount) {
      console.log(`${user.email} is not a test account, skipping reset`)
      return new Response(
        JSON.stringify({ success: true, message: 'Not a test account, no reset needed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Resetting data for test account: ${user.email}`)

    // Reset the test account data
    const { error: resetError } = await supabase
      .rpc('reset_test_account_data', { test_user_id: user.id })
    
    if (resetError) {
      console.error('Error resetting test account data:', resetError)
      throw resetError
    }

    console.log(`Successfully reset data for test account: ${user.email}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test account data reset successfully',
        email: user.email 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in reset-test-account function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})