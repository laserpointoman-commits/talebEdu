import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { tokenId } = await req.json();

    if (!tokenId) {
      return new Response(
        JSON.stringify({ error: "Token ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extend expiration date
    const newExpirationDate = new Date();
    newExpirationDate.setDate(newExpirationDate.getDate() + 7);

    // --- Preferred: pending parent registrations (self-signup flow) ---
    const { data: pendingToken, error: pendingError } = await supabase
      .from("pending_parent_registrations")
      .select("id")
      .eq("id", tokenId)
      .single();

    if (!pendingError && pendingToken) {
      const { error: updatePendingError } = await supabase
        .from("pending_parent_registrations")
        .update({
          expires_at: newExpirationDate.toISOString(),
          used: false,
          used_at: null,
        })
        .eq("id", tokenId);

      if (updatePendingError) throw updatePendingError;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Invitation resent successfully",
          expiresAt: newExpirationDate.toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Backward compatible: parent_registration_tokens (legacy flow) ---
    const { data: tokenData, error: tokenError } = await supabase
      .from("parent_registration_tokens")
      .select("id")
      .eq("id", tokenId)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Token not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateError } = await supabase
      .from("parent_registration_tokens")
      .update({
        expires_at: newExpirationDate.toISOString(),
        used: false,
      })
      .eq("id", tokenId);

    if (updateError) throw updateError;

    // Log the resend action
    await supabase.from("parent_invitation_logs").insert({
      token_id: tokenId,
      action: "resent",
      method: "email",
      metadata: { resent_at: new Date().toISOString() },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation resent successfully",
        expiresAt: newExpirationDate.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Resend invitation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
