import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const studentData = await req.json();

    console.log("Submitting student for approval:", studentData.full_name);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid authorization");
    }

    // Get parent profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("expected_students_count, registered_students_count")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Parent profile not found");
    }

    // Check if parent has remaining slots
    if (profile.registered_students_count >= (profile.expected_students_count || 0)) {
      return new Response(
        JSON.stringify({ error: "You have reached the maximum number of students allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create student record with pending status
    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert({
        ...studentData,
        parent_id: user.id,
        approval_status: "pending",
        visible_to_parent: false,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (studentError) {
      console.error("Error creating student:", studentError);
      throw new Error("Failed to create student record");
    }

    console.log("Student created with ID:", student.id);

    // Create approval record
    const { error: approvalError } = await supabase
      .from("pending_student_approvals")
      .insert({
        student_id: student.id,
        parent_id: user.id,
        status: "pending",
      });

    if (approvalError) {
      console.error("Error creating approval record:", approvalError);
      // Cleanup student record
      await supabase.from("students").delete().eq("id", student.id);
      throw new Error("Failed to create approval record");
    }

    // Increment parent's registered students count
    await supabase
      .from("profiles")
      .update({
        registered_students_count: profile.registered_students_count + 1,
      })
      .eq("id", user.id);

    // Get all admin users for notifications
    const { data: admins } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin");

    // Create notifications for admins
    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        notification_type: "system_announcements",
        title: "New Student Registration Pending Approval",
        message: `${studentData.full_name} has been submitted by ${profile} for approval`,
        read: false,
        data: {
          student_id: student.id,
          student_name: studentData.full_name,
          parent_id: user.id,
        },
      }));

      await supabase.from("notification_history").insert(notifications);
    }

    const remainingSlots = (profile.expected_students_count || 0) - (profile.registered_students_count + 1);

    console.log("Student submitted for approval successfully");

    return new Response(
      JSON.stringify({
        success: true,
        studentId: student.id,
        remainingSlots,
        message: "Student submitted for approval successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in submit-student-for-approval:", error);
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
