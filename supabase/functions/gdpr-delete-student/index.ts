import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GDPRDeletePayload {
  studentId: string;
  confirmDeletion: boolean;
  reason?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Only admins can perform GDPR deletions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const payload: GDPRDeletePayload = await req.json();
    
    if (!payload.studentId) {
      return new Response(
        JSON.stringify({ error: "studentId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!payload.confirmDeletion) {
      return new Response(
        JSON.stringify({ error: "Must confirm deletion by setting confirmDeletion to true" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get student info before deletion for audit
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*, profiles:profile_id(email, full_name)")
      .eq("id", payload.studentId)
      .single();
    
    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: "Student not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`GDPR deletion requested for student ${payload.studentId} by admin ${user.id}`);
    
    // Perform GDPR deletion
    const { data: result, error: deleteError } = await supabase
      .rpc("gdpr_delete_student_data", {
        p_student_id: payload.studentId,
        p_deleted_by: user.id,
      });
    
    if (deleteError) {
      console.error("GDPR deletion error:", deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("GDPR deletion complete:", result);
    
    // Send confirmation to admin
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Student data has been permanently deleted in compliance with GDPR",
        deletedStudent: {
          id: payload.studentId,
          originalName: `${student.first_name} ${student.last_name}`,
        },
        deletionDetails: result,
        deletedBy: adminProfile?.email,
        deletedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in gdpr-delete-student:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
