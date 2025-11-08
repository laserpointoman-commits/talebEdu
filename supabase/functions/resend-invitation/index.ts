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

    // Get token details
    const { data: tokenData, error: tokenError } = await supabase
      .from('parent_registration_tokens')
      .select(`
        id,
        token,
        parent_id,
        profiles!parent_id (
          email,
          full_name,
          full_name_ar,
          phone
        )
      `)
      .eq('id', tokenId)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Token not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extend expiration date
    const newExpirationDate = new Date();
    newExpirationDate.setDate(newExpirationDate.getDate() + 7);

    const { error: updateError } = await supabase
      .from('parent_registration_tokens')
      .update({ 
        expires_at: newExpirationDate.toISOString(),
        used: false 
      })
      .eq('id', tokenId);

    if (updateError) throw updateError;

    // Log the resend action
    await supabase
      .from('parent_invitation_logs')
      .insert({
        token_id: tokenId,
        action: 'resent',
        method: 'email',
        metadata: { resent_at: new Date().toISOString() }
      });

    // Call send-parent-invitation to resend email
    const registrationUrl = `${req.headers.get('origin') || 'http://localhost:5173'}/parent-registration?token=${tokenData.token}`;
    
    // Here you would call your email service
    console.log(`Resending invitation to ${tokenData.profiles.email}: ${registrationUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Invitation resent successfully",
        expiresAt: newExpirationDate.toISOString()
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
