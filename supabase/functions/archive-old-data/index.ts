import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ArchivePayload {
  daysOld?: number;
  dryRun?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const payload: ArchivePayload = await req.json().catch(() => ({}));
    const daysOld = payload.daysOld || 365;
    const dryRun = payload.dryRun || false;
    
    console.log(`Starting archival process: ${daysOld} days old, dryRun: ${dryRun}`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    if (dryRun) {
      // Count records that would be archived
      const { count: attendanceCount } = await supabase
        .from("attendance_records")
        .select("*", { count: "exact", head: true })
        .lt("date", cutoffDate.toISOString().split("T")[0]);
      
      const { count: transactionsCount } = await supabase
        .from("wallet_transactions")
        .select("*", { count: "exact", head: true })
        .lt("created_at", cutoffDate.toISOString());
      
      const { count: boardingCount } = await supabase
        .from("bus_boarding_logs")
        .select("*", { count: "exact", head: true })
        .lt("timestamp", cutoffDate.toISOString());
      
      return new Response(
        JSON.stringify({
          dryRun: true,
          cutoffDate: cutoffDate.toISOString(),
          wouldArchive: {
            attendance_records: attendanceCount || 0,
            wallet_transactions: transactionsCount || 0,
            bus_boarding_logs: boardingCount || 0,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Run the archival function
    const { data: archiveResult, error: archiveError } = await supabase
      .rpc("archive_old_records", { p_days_old: daysOld });
    
    if (archiveError) {
      console.error("Archive error:", archiveError);
      return new Response(
        JSON.stringify({ error: archiveError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Archival complete:", archiveResult);
    
    return new Response(
      JSON.stringify({
        success: true,
        cutoffDate: cutoffDate.toISOString(),
        archived: archiveResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in archive-old-data:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
