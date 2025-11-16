import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalRequest {
  studentId: string;
  approved: boolean;
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentId, approved, rejectionReason }: ApprovalRequest = await req.json();

    console.log(`${approved ? 'Approving' : 'Rejecting'} student:`, studentId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user (admin)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid authorization");
    }

    // Verify user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get student and approval record
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*, pending_student_approvals!inner(*)")
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: "Student not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newStatus = approved ? "approved" : "rejected";

    // Generate unique NFC ID if approving
    let nfcId = null;
    if (approved) {
      // Generate NFC ID format: NFC-YYYYMMDD-XXXX (where XXXX is random)
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      nfcId = `NFC-${dateStr}-${randomStr}`;

      // Ensure uniqueness
      const { data: existingNfc } = await supabase
        .from("students")
        .select("id")
        .eq("nfc_id", nfcId)
        .single();

      // If collision (very rare), generate new one
      if (existingNfc) {
        const newRandomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        nfcId = `NFC-${dateStr}-${newRandomStr}`;
      }
    }

    // Update student record
    const { error: updateError } = await supabase
      .from("students")
      .update({
        approval_status: newStatus,
        visible_to_parent: approved,
        nfc_id: nfcId,
      })
      .eq("id", studentId);

    if (updateError) {
      console.error("Error updating student:", updateError);
      throw new Error("Failed to update student status");
    }

    // Update approval record
    const { error: approvalUpdateError } = await supabase
      .from("pending_student_approvals")
      .update({
        status: newStatus,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        rejection_reason: rejectionReason || null,
      })
      .eq("student_id", studentId);

    if (approvalUpdateError) {
      console.error("Error updating approval record:", approvalUpdateError);
    }

    // Send notification to parent
    const notificationTitle = approved 
      ? "Student Registration Approved!" 
      : "Student Registration Needs Attention";
    
    const notificationMessage = approved
      ? `Great news! ${student.full_name}'s registration has been approved. You can now access their profile and all features.`
      : `${student.full_name}'s registration requires additional information. ${rejectionReason || 'Please contact administration.'}`;

    await supabase.from("notification_history").insert({
      user_id: student.parent_id,
      notification_type: approved ? "system_announcements" : "system_announcements",
      title: notificationTitle,
      message: notificationMessage,
      read: false,
      data: {
        student_id: studentId,
        student_name: student.full_name,
        approved,
        rejection_reason: rejectionReason,
      },
    });

    console.log(`Student ${approved ? 'approved' : 'rejected'} successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Student ${approved ? 'approved' : 'rejected'} successfully`,
        studentId,
        status: newStatus,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in approve-student:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
