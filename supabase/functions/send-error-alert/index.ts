import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ErrorAlertPayload {
  checkOnly?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check for error spikes in the last hour
    const { data: recentErrors, error: errorsError } = await supabase
      .from("error_logs")
      .select("*")
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .eq("resolved", false);
    
    if (errorsError) {
      console.error("Error fetching error logs:", errorsError);
      return new Response(
        JSON.stringify({ error: errorsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const errorCount = recentErrors?.length || 0;
    const errorThreshold = 10; // Alert if more than 10 errors in an hour
    
    // Get notification queue stats
    const { data: queueStats } = await supabase
      .rpc("get_notification_queue_stats");
    
    // Get system health
    const { data: healthData } = await supabase
      .from("system_health_dashboard")
      .select("*")
      .single();
    
    const alerts: string[] = [];
    
    if (errorCount >= errorThreshold) {
      alerts.push(`🚨 Error Spike: ${errorCount} errors in the last hour`);
    }
    
    if (queueStats?.failed_count > 50) {
      alerts.push(`📬 Notification Queue: ${queueStats.failed_count} failed notifications`);
    }
    
    if (queueStats?.pending_count > 1000) {
      alerts.push(`⏳ Notification Backlog: ${queueStats.pending_count} pending notifications`);
    }
    
    // Group errors by type
    const errorsByType: Record<string, number> = {};
    recentErrors?.forEach((err: any) => {
      errorsByType[err.error_type] = (errorsByType[err.error_type] || 0) + 1;
    });
    
    const payload: ErrorAlertPayload = await req.json().catch(() => ({}));
    
    if (payload.checkOnly) {
      return new Response(
        JSON.stringify({
          errorCount,
          errorsByType,
          queueStats,
          healthData,
          alertsTriggered: alerts.length > 0,
          alerts,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Send email alert if there are critical issues
    if (alerts.length > 0 && resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      // Get admin emails
      const { data: admins } = await supabase
        .from("profiles")
        .select("email")
        .eq("role", "admin")
        .limit(5);
      
      const adminEmails = admins?.map((a: any) => a.email).filter(Boolean) || [];
      
      if (adminEmails.length > 0) {
        const emailHtml = `
          <h1>🚨 TalebEdu System Alert</h1>
          <p>The following issues require your attention:</p>
          <ul>
            ${alerts.map(alert => `<li>${alert}</li>`).join("")}
          </ul>
          <h2>Error Breakdown</h2>
          <ul>
            ${Object.entries(errorsByType).map(([type, count]) => 
              `<li><strong>${type}</strong>: ${count} occurrences</li>`
            ).join("")}
          </ul>
          <h2>System Health</h2>
          <ul>
            <li>Active Students: ${healthData?.active_students || 0}</li>
            <li>Today's Attendance: ${healthData?.today_attendance || 0}</li>
            <li>Pending Notifications: ${healthData?.pending_notifications || 0}</li>
            <li>Failed Notifications: ${healthData?.failed_notifications || 0}</li>
          </ul>
          <p><a href="https://talebedu.lovable.app/admin/system-health">View Dashboard</a></p>
          <p style="color: #666; font-size: 12px;">This is an automated alert from TalebEdu System Monitoring</p>
        `;
        
        try {
          await resend.emails.send({
            from: "TalebEdu Alerts <alerts@talebedu.app>",
            to: adminEmails,
            subject: `🚨 TalebEdu Alert: ${alerts.length} issue(s) detected`,
            html: emailHtml,
          });
          
          console.log("Alert email sent to:", adminEmails);
          
          // Log the alert
          await supabase.rpc("log_audit_event", {
            p_user_id: null,
            p_action: "system_alert_sent",
            p_table_name: "system",
            p_record_id: null,
            p_old_data: null,
            p_new_data: { alerts, errorCount, recipients: adminEmails.length },
            p_metadata: {},
          });
        } catch (emailError) {
          console.error("Failed to send alert email:", emailError);
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        errorCount,
        alertsSent: alerts.length > 0,
        alerts,
        queueStats,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-error-alert:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
