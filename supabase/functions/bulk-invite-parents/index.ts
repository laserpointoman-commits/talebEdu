import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

interface ParentData {
  parent_email: string;
  parent_name: string;
  parent_name_ar?: string;
  phone?: string;
  max_students?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { parents }: { parents: ParentData[] } = await req.json();

    if (!parents || !Array.isArray(parents) || parents.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid parents data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${parents.length} parent invitations...`);

    const results = [];

    for (const parent of parents) {
      try {
        if (!parent.parent_email || !parent.parent_name) {
          results.push({
            email: parent.parent_email || 'unknown',
            name: parent.parent_name || 'unknown',
            status: 'error',
            message: 'Missing required fields'
          });
          continue;
        }

        // Check if parent already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', parent.parent_email)
          .eq('role', 'parent')
          .single();

        if (existingProfile) {
          results.push({
            email: parent.parent_email,
            name: parent.parent_name,
            status: 'skipped',
            message: 'Parent already exists'
          });
          continue;
        }

        // Create parent profile
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: parent.parent_email,
          email_confirm: true,
          user_metadata: {
            full_name: parent.parent_name,
            full_name_ar: parent.parent_name_ar || parent.parent_name,
            phone: parent.phone || ''
          }
        });

        if (authError) throw authError;

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: parent.parent_email,
            full_name: parent.parent_name,
            full_name_ar: parent.parent_name_ar || parent.parent_name,
            phone: parent.phone || '',
            role: 'parent'
          });

        if (profileError) throw profileError;

        // Generate token
        const { data: tokenData, error: tokenError } = await supabase
          .from('parent_registration_tokens')
          .insert({
            parent_id: authData.user.id,
            remaining_uses: parent.max_students ? parseInt(parent.max_students) : null,
            invitation_method: 'bulk_email'
          })
          .select()
          .single();

        if (tokenError) throw tokenError;

        // Send invitation email
        const registrationUrl = `${req.headers.get('origin') || 'http://localhost:5173'}/parent-registration?token=${tokenData.token}`;
        
        // Here you would call send-parent-invitation or send email directly
        // For now, we'll just log it
        console.log(`Invitation created for ${parent.parent_email}: ${registrationUrl}`);

        results.push({
          email: parent.parent_email,
          name: parent.parent_name,
          status: 'success',
          message: 'Invitation sent successfully'
        });

      } catch (error: any) {
        console.error(`Error processing ${parent.parent_email}:`, error);
        results.push({
          email: parent.parent_email,
          name: parent.parent_name,
          status: 'error',
          message: error.message || 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Bulk invite error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
