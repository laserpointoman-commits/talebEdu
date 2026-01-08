import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupRequest {
  token: string;
  email: string;
  password: string;
  fullName: string;
  fullNameAr?: string;
  phone?: string;
  expectedStudentsCount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, email, password, fullName, fullNameAr, phone, expectedStudentsCount }: SignupRequest = await req.json();

    console.log("Parent self-signup for email:", email);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate registration token
    const { data: tokenData, error: tokenError } = await supabase
      .from("pending_parent_registrations")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      console.error("Invalid token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired registration token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tokenData.used) {
      return new Response(
        JSON.stringify({ error: "This registration token has already been used" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This registration token has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the email matches the invited email
    if (tokenData.email.toLowerCase() !== email.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Email does not match the invitation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists in auth but not in profiles (orphaned user)
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;

    if (existingAuthUser) {
      console.log("Found existing auth user:", existingAuthUser.id);
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", existingAuthUser.id)
        .single();

      if (existingProfile) {
        // User has both auth and profile - they should login instead
        return new Response(
          JSON.stringify({ error: "An account with this email already exists. Please login instead." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Auth user exists but no profile - update password and use this user
      console.log("Auth user exists without profile, updating and creating profile");
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingAuthUser.id, {
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          full_name_ar: fullNameAr,
          phone,
          role: 'parent',
        },
      });

      if (updateError) {
        console.error("Error updating existing auth user:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to setup account. Please contact support." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = existingAuthUser.id;
    } else {
      // Create new auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          full_name_ar: fullNameAr,
          phone,
          role: 'parent',
        },
      });

      if (authError) {
        console.error("Error creating auth user:", authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = authData.user.id;
    }

    console.log("Using user ID:", userId);

    // Create profile with email auto-confirmed
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email,
        full_name: fullName,
        full_name_ar: fullNameAr,
        phone,
        role: "parent",
        email_confirmed: true,
        expected_students_count: expectedStudentsCount,
        registered_students_count: 0,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Only try to delete user if we just created them (not existing orphan)
      if (!existingAuthUser) {
        await supabase.auth.admin.deleteUser(userId);
      }
      throw new Error("Failed to create profile");
    }

    // Mark token as used
    await supabase
      .from("pending_parent_registrations")
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq("id", tokenData.id);

    console.log("Parent signup successful, user ID:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        userId: userId,
        message: "Account created successfully! You can now login.",
        expectedStudentsCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in parent-self-signup:", error);
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
