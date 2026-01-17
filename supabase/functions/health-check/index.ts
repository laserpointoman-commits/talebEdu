import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Health check endpoint for monitoring
// Returns system status and key metrics

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

    // Run health checks in parallel
    const [
      studentsResult,
      todayAttendance,
      todayBusActivity,
      queueStats,
      dbConnectionTest
    ] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }),
      supabase.from('attendance_records').select('id', { count: 'exact', head: true }).eq('date', new Date().toISOString().split('T')[0]),
      supabase.from('bus_boarding_logs').select('id', { count: 'exact', head: true }).gte('timestamp', new Date().toISOString().split('T')[0]),
      supabase.rpc('get_notification_queue_stats'),
      supabase.from('profiles').select('id').limit(1) // Simple connection test
    ]);

    const isHealthy = !dbConnectionTest.error;
    const responseTime = Math.round(performance.now() - startTime);

    const healthData = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTimeMs: responseTime,
      metrics: {
        totalStudents: studentsResult.count || 0,
        todayAttendance: todayAttendance.count || 0,
        todayBusActivity: todayBusActivity.count || 0,
        notificationQueue: queueStats.data?.[0] || {
          pending_count: 0,
          processing_count: 0,
          failed_count: 0,
          sent_today: 0
        }
      },
      database: {
        connected: !dbConnectionTest.error,
        latencyMs: responseTime
      },
      version: '2.0.0-scalable'
    };

    return new Response(
      JSON.stringify(healthData),
      { 
        status: isHealthy ? 200 : 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({ 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
