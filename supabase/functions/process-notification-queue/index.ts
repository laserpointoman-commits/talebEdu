import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process queued notifications in batches
// Can be triggered by cron job or realtime subscription

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get batch of pending notifications (limit to prevent timeout)
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50); // Process 50 at a time

    if (fetchError) {
      console.error('Error fetching pending notifications:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notifications' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No pending notifications' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${pendingNotifications.length} notifications`);

    let successCount = 0;
    let failCount = 0;

    // Process each notification
    for (const notification of pendingNotifications) {
      try {
        // Mark as processing
        await supabase
          .from('notification_queue')
          .update({ 
            status: 'processing',
            last_attempt_at: new Date().toISOString(),
            attempts: notification.attempts + 1
          })
          .eq('id', notification.id);

        // Send the actual notification
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
        console.error(`Failed to process notification ${notification.id}:`, error);
        
        // Mark as failed (will be retried if under max attempts)
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

    // Also process failed notifications that are ready for retry
    const { data: retryNotifications } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'failed')
      .lt('attempts', 3)
      .lt('last_attempt_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 5 min cooldown
      .limit(10);

    if (retryNotifications && retryNotifications.length > 0) {
      console.log(`Retrying ${retryNotifications.length} failed notifications`);
      
      // Reset status to pending for retry
      await supabase
        .from('notification_queue')
        .update({ status: 'pending' })
        .in('id', retryNotifications.map(n => n.id));
    }

    return new Response(
      JSON.stringify({
        processed: pendingNotifications.length,
        success: successCount,
        failed: failCount,
        retry_queued: retryNotifications?.length || 0
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
