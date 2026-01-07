import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  invitationEmail: string;
  maxStudents: number;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitationEmail, maxStudents, notes }: InvitationRequest = await req.json();

    console.log("Sending registration invitation to:", invitationEmail);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the admin user who is sending the invitation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid authorization");
    }

    // Create registration token
    const { data: tokenData, error: tokenError } = await supabase
      .from("pending_parent_registrations")
      .insert({
        email: invitationEmail,
        invited_by: user.id,
        max_students: maxStudents,
      })
      .select()
      .single();

    if (tokenError) {
      console.error("Error creating registration token:", tokenError);
      throw new Error("Failed to create registration token");
    }

    // Construct registration URL
    // Prefer the calling app origin to avoid misconfigured APP_URL sending parents to external/incorrect pages.
    const appUrl = req.headers.get("origin") || Deno.env.get("APP_URL") || "http://localhost:8080";
    const registrationUrl = new URL("/register", appUrl);
    registrationUrl.searchParams.set("token", tokenData.token);

    console.log("Registration URL:", registrationUrl.toString());

    // Send email
    const emailResponse = await resend.emails.send({
      from: "TalebEdu <onboarding@resend.dev>",
      to: [invitationEmail],
      subject: "Register Your Parent Account - TalebEdu",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Welcome to TalebEdu</h1>
              <p>School Management System</p>
            </div>
            <div class="content">
              <h2>Dear Parent,</h2>
              
              <p>You're invited to join TalebEdu School Management System! We're excited to have you and your family as part of our community.</p>
              
              <div class="info-box">
                <strong>📝 Registration Details:</strong>
                <ul>
                  <li>You can register up to <strong>${maxStudents}</strong> student${maxStudents > 1 ? 's' : ''}</li>
                  <li>This invitation link expires in 7 days</li>
                  <li>You'll create your own secure password during registration</li>
                </ul>
              </div>

              ${notes ? `<div class="info-box"><strong>📌 Note from Admin:</strong><p>${notes}</p></div>` : ''}
              
              <div style="text-align: center;">
                <a href="${registrationUrl}" class="button">Create Your Account</a>
              </div>
              
              <p><strong>What happens next?</strong></p>
              <ol>
                <li>Click the button above to create your account</li>
                <li>Choose your preferred language (English/Arabic)</li>
                <li>Set up your account with your personal information</li>
                <li>Confirm your email address</li>
                <li>Register your student(s) for approval</li>
              </ol>
              
              <p>If you have any questions, please don't hesitate to contact the school administration.</p>
              
              <div class="footer">
                <p>© 2024 TalebEdu. All rights reserved.</p>
                <p>This is an automated email. Please do not reply directly to this message.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        registrationUrl: registrationUrl.toString(),
        tokenId: tokenData.id,
        expiresAt: tokenData.expires_at,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-registration-invitation:", error);
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
