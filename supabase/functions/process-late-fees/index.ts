import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Processing late fees for overdue payments');

    // Get active late fee configs
    const { data: configs, error: configError } = await supabase
      .from('late_fee_config')
      .select('*')
      .eq('is_active', true);

    if (configError) throw configError;

    // Get overdue fees that haven't had late fees applied yet
    const today = new Date().toISOString().split('T')[0];
    const { data: overdueFees, error: feesError } = await supabase
      .from('student_fees')
      .select('*')
      .lt('due_date', today)
      .neq('status', 'paid')
      .eq('late_fee_amount', 0);

    if (feesError) throw feesError;

    console.log(`Found ${overdueFees?.length || 0} overdue fees to process`);

    let processedCount = 0;

    for (const fee of overdueFees || []) {
      // Find matching config
      const config = configs?.find(c => c.fee_type === fee.fee_type);
      if (!config) continue;

      // Calculate days overdue
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(fee.due_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Apply grace period
      if (daysOverdue <= config.grace_days) continue;

      // Calculate late fee
      let lateFee = 0;
      if (config.late_fee_amount) {
        lateFee = config.late_fee_amount;
      } else if (config.late_fee_percentage) {
        const remaining = fee.total_amount - fee.paid_amount;
        lateFee = remaining * (config.late_fee_percentage / 100);
      }

      if (lateFee > 0) {
        // Update fee with late fee
        const { error: updateError } = await supabase
          .from('student_fees')
          .update({
            late_fee_amount: lateFee,
            total_amount: fee.total_amount + lateFee,
            status: 'overdue'
          })
          .eq('id', fee.id);

        if (!updateError) {
          processedCount++;
          console.log(`Applied late fee of ${lateFee} OMR to fee ${fee.id}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        total_overdue: overdueFees?.length || 0
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in process-late-fees:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
