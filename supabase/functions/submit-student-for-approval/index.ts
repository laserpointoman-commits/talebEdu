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

    // Check if parent has remaining slots (only when expected_students_count is configured)
    const expectedCountRaw = profile.expected_students_count;
    const expectedCount = typeof expectedCountRaw === "number" && expectedCountRaw > 0 ? expectedCountRaw : null;
    const registeredCount = profile.registered_students_count ?? 0;

    if (expectedCount !== null && registeredCount >= expectedCount) {
      return new Response(
        JSON.stringify({ error: "You have reached the maximum number of students allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate full_name from form data
    const fullName = studentData.full_name || 
      `${studentData.firstName || studentData.first_name || ''} ${studentData.lastName || studentData.last_name || ''}`.trim();

    // Create student record with pending status
    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert({
        first_name: studentData.firstName || studentData.first_name || '',
        last_name: studentData.lastName || studentData.last_name || '',
        first_name_ar: studentData.firstNameAr || studentData.first_name_ar || '',
        last_name_ar: studentData.lastNameAr || studentData.last_name_ar || '',
        date_of_birth: studentData.dateOfBirth || studentData.date_of_birth,
        gender: studentData.gender,
        grade: studentData.grade,
        class: studentData.class,
        nationality: studentData.nationality,
        blood_group: studentData.bloodType || studentData.blood_group,
        allergies: studentData.allergies,
        medical_conditions: studentData.medicalConditions || studentData.medical_conditions,
        parent_id: user.id,
        parent_name: studentData.parentName || studentData.parent_name,
        parent_phone: studentData.parentPhone || studentData.parent_phone,
        parent_email: studentData.parentEmail || studentData.parent_email,
        emergency_contact_name: studentData.emergencyContact || studentData.emergency_contact_name,
        emergency_contact: studentData.emergencyPhone || studentData.emergency_contact,
        address: studentData.address,
        phone: studentData.phone,
        // Home location fields
        home_latitude: studentData.homeLatitude || studentData.home_latitude || null,
        home_longitude: studentData.homeLongitude || studentData.home_longitude || null,
        home_area: studentData.homeArea || studentData.home_area || null,
        home_area_ar: studentData.homeAreaAr || studentData.home_area_ar || null,
        student_id: `STU-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
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
    const nextRegisteredCount = registeredCount + 1;
    await supabase
      .from("profiles")
      .update({
        registered_students_count: nextRegisteredCount,
      })
      .eq("id", user.id);

    // Get all admin users for notifications
    const { data: admins } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin");

    // Get parent name
    const { data: parentProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const studentFullName = `${student.first_name} ${student.last_name}`;

    // Create notifications for admins
    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        notification_type: "system_announcements",
        title: "New Student Registration Pending Approval",
        message: `${studentFullName} has been submitted by ${parentProfile?.full_name || 'a parent'} for approval`,
        read: false,
        data: {
          student_id: student.id,
          student_name: studentFullName,
          parent_id: user.id,
        },
      }));

      await supabase.from("notification_history").insert(notifications);
    }

    const remainingSlots = expectedCount !== null ? (expectedCount - nextRegisteredCount) : null;

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
