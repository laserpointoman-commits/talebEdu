import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AllowanceRequest {
  studentId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentId }: AllowanceRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Processing daily allowance for student: ${studentId}`);

    // Get student with parent info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, first_name, last_name, parent_id, daily_allowance')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      console.error('Student not found:', studentError);
      return new Response(
        JSON.stringify({ error: 'Student not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if allowance already given today
    const { data: existingAllowance } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('user_id', student.parent_id)
      .eq('type', 'daily_allowance')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .eq('description', `Daily allowance for ${student.first_name} ${student.last_name}`)
      .single();

    if (existingAllowance) {
      console.log('Allowance already processed today');
      return new Response(
        JSON.stringify({ error: 'Allowance already processed today', student }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allowanceAmount = student.daily_allowance || 5.0;

    // Get current wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallet_balances')
      .select('balance')
      .eq('user_id', student.parent_id)
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      console.error('Error fetching wallet:', walletError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch wallet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentBalance = wallet?.balance || 0;
    const newBalance = Number(currentBalance) + Number(allowanceAmount);

    // Update or insert wallet balance
    const { error: walletUpdateError } = await supabase
      .from('wallet_balances')
      .upsert({
        user_id: student.parent_id,
        balance: newBalance,
        currency: 'OMR',
        updated_at: new Date().toISOString(),
      });

    if (walletUpdateError) {
      console.error('Error updating wallet:', walletUpdateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update wallet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: student.parent_id,
        type: 'daily_allowance',
        amount: allowanceAmount,
        balance_after: newBalance,
        description: `Daily allowance for ${student.first_name} ${student.last_name}`,
        description_ar: `مصروف يومي لـ ${student.first_name} ${student.last_name}`,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return new Response(
        JSON.stringify({ error: 'Failed to record transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Daily allowance processed successfully:', transaction.id);

    return new Response(
      JSON.stringify({
        success: true,
        amount: allowanceAmount,
        newBalance: newBalance,
        transaction: transaction,
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
