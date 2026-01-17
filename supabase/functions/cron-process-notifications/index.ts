import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// This function processes the notification queue
// Should be called by a cron job every minute
// POST /cron-process-notifications with Authorization header

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Unstick any stuck notifications
    const { data: unstuck } = await supabase.rpc('unstick_notifications');
    if (unstuck && unstuck > 0) {
      console.log(`Unstuck ${unstuck} notifications`);
    }

    // 2. Get pending notifications (batch of 50)
    const { data: notifications, error: fetchError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      // 3. Cleanup rate limits while we're here
      await supabase.rpc('cleanup_rate_limits');
      
      return new Response(
        JSON.stringify({ 
          processed: 0, 
          message: 'No pending notifications',
          processingTimeMs: Math.round(performance.now() - startTime)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Mark as processing
    const ids = notifications.map(n => n.id);
    await supabase
      .from('notification_queue')
      .update({ 
        status: 'processing',
        processing_started_at: new Date().toISOString(),
        attempts: notifications[0].attempts + 1
      })
      .in('id', ids);

    let successCount = 0;
    let failCount = 0;

    // 5. Process each notification
    for (const notification of notifications) {
      try {
        const { error: sendError } = await supabase.functions.invoke('send-parent-notification', {
          body: {
            parentId: notification.parent_id,
            studentId: notification.student_id,
            type: notification.notification_type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
          },
        });

        if (sendError) {
          throw sendError;
        }

        // Mark as sent
        await supabase
          .from('notification_queue')
          .update({ 
            status: 'sent',
            processed_at: new Date().toISOString()
          })
          .eq('id', notification.id);

        successCount++;
      } catch (error) {
        console.error(`Failed notification ${notification.id}:`, error);
        
        const newStatus = notification.attempts + 1 >= notification.max_attempts ? 'failed' : 'pending';
        
        await supabase
          .from('notification_queue')
          .update({ 
            status: newStatus,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            last_attempt_at: new Date().toISOString()
          })
          .eq('id', notification.id);

        failCount++;
      }
    }

    // 6. Cleanup old rate limits
    await supabase.rpc('cleanup_rate_limits');

    // 7. Get stats
    const { data: stats } = await supabase.rpc('get_notification_queue_stats');

    return new Response(
      JSON.stringify({
        processed: notifications.length,
        success: successCount,
        failed: failCount,
        unstuck: unstuck || 0,
        queue_stats: stats?.[0] || null,
        processingTimeMs: Math.round(performance.now() - startTime)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cron error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
