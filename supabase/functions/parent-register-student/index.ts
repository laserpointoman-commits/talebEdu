import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, studentData } = await req.json();

    if (!token || !studentData) {
      return new Response(
        JSON.stringify({ error: "Token and student data are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Registering student with token:", token.substring(0, 10) + "...");

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from("parent_registration_tokens")
      .select("id, parent_id, used, expires_at")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      console.error("Invalid token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tokenData.used) {
      return new Response(
        JSON.stringify({ error: "Token has already been used" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ error: "Token has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate student ID if not provided
    const studentId = studentData.student_id || 
      `STU-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create student record
    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert({
        student_id: studentId,
        first_name: studentData.firstName,
        last_name: studentData.lastName,
        first_name_ar: studentData.firstNameAr,
        last_name_ar: studentData.lastNameAr,
        date_of_birth: studentData.dateOfBirth,
        gender: studentData.gender,
        grade: studentData.grade,
        class: studentData.class,
        nationality: studentData.nationality,
        blood_type: studentData.bloodType,
        address: studentData.address,
        phone: studentData.phone,
        parent_id: tokenData.parent_id,
        parent_name: studentData.parentName,
        parent_phone: studentData.parentPhone,
        parent_email: studentData.parentEmail,
        emergency_contact: studentData.emergencyContact,
        emergency_phone: studentData.emergencyPhone,
        medical_conditions: studentData.medicalConditions,
        allergies: studentData.allergies,
        nfc_id: studentData.nfcId,
        transportation_agreement: studentData.transportationAgreement || false,
        status: "active",
      })
      .select()
      .single();

    if (studentError) {
      console.error("Error creating student:", studentError);
      return new Response(
        JSON.stringify({ error: "Failed to create student record", details: studentError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Student created successfully:", student.id);

    // Mark token as used
    const { error: updateError } = await supabase
      .from("parent_registration_tokens")
      .update({
        used: true,
        student_registered_id: student.id,
      })
      .eq("id", tokenData.id);

    if (updateError) {
      console.error("Error updating token:", updateError);
    }

    // Upload profile photo if provided
    if (studentData.profileImage && studentData.profileImage.startsWith("data:image")) {
      try {
        const base64Data = studentData.profileImage.split(",")[1];
        const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const fileName = `${student.id}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(fileName, buffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("profile-photos")
            .getPublicUrl(fileName);

          await supabase
            .from("students")
            .update({ profile_image: publicUrl })
            .eq("id", student.id);

          console.log("Profile photo uploaded successfully");
        }
      } catch (photoError) {
        console.error("Error uploading photo:", photoError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        student: student,
        message: "Student registered successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in parent-register-student:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
