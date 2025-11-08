import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParentInvitationRequest {
  parentEmail: string;
  parentName: string;
  token: string;
  loginEmail: string;
  loginPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { parentEmail, parentName, token, loginEmail, loginPassword }: ParentInvitationRequest = await req.json();

    console.log("Sending parent invitation to:", parentEmail);

    const registrationUrl = `https://talebedu.com/parent-registration?token=${token}`;

    const emailResponse = await resend.emails.send({
      from: "TalebEdu <onboarding@resend.dev>",
      to: [parentEmail],
      subject: "Welcome to TalebEdu - Register Your Child | مرحباً بك في TalebEdu",
      html: `
        <!DOCTYPE html>
        <html dir="ltr" lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #333333; font-size: 20px; margin-bottom: 15px; }
            .section p { color: #666666; line-height: 1.6; margin: 10px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .credentials-box { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .credentials-box strong { color: #333333; }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #999999; font-size: 14px; }
            .arabic { direction: rtl; text-align: right; font-family: 'Arial', 'Tahoma', sans-serif; }
            .divider { height: 1px; background-color: #e0e0e0; margin: 30px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TalebEdu School Management</h1>
            </div>
            
            <div class="content">
              <!-- English Section -->
              <div class="section">
                <h2>Welcome, ${parentName}!</h2>
                <p>Your parent account has been successfully created in the TalebEdu School Management System.</p>
                <p>To complete the registration process, please register your child by clicking the button below:</p>
                <div style="text-align: center;">
                  <a href="${registrationUrl}" class="button">Register Your Child</a>
                </div>
                <p style="font-size: 14px; color: #999999;">⏰ This link will expire in 7 days</p>
              </div>

              <div class="credentials-box">
                <strong>Your Login Credentials:</strong><br><br>
                <strong>Email:</strong> ${loginEmail}<br>
                <strong>Password:</strong> ${loginPassword}<br>
                <strong>Portal:</strong> <a href="https://talebedu.com">https://talebedu.com</a>
              </div>

              <div class="divider"></div>

              <!-- Arabic Section -->
              <div class="section arabic">
                <h2>مرحباً، ${parentName}!</h2>
                <p>تم إنشاء حساب ولي الأمر الخاص بك بنجاح في نظام TalebEdu لإدارة المدرسة.</p>
                <p>لإكمال عملية التسجيل، يرجى تسجيل طفلك بالنقر على الزر أدناه:</p>
                <div style="text-align: center;">
                  <a href="${registrationUrl}" class="button">تسجيل الطالب</a>
                </div>
                <p style="font-size: 14px; color: #999999;">⏰ سينتهي صلاحية هذا الرابط في 7 أيام</p>
              </div>

              <div class="credentials-box arabic">
                <strong>بيانات تسجيل الدخول:</strong><br><br>
                <strong>البريد الإلكتروني:</strong> ${loginEmail}<br>
                <strong>كلمة المرور:</strong> ${loginPassword}<br>
                <strong>البوابة:</strong> <a href="https://talebedu.com">https://talebedu.com</a>
              </div>
            </div>

            <div class="footer">
              <p>If you have any questions, please contact the school administration.</p>
              <p style="margin-top: 5px;">إذا كان لديك أي أسئلة، يرجى الاتصال بإدارة المدرسة.</p>
              <p style="margin-top: 20px;">&copy; 2024 TalebEdu. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending parent invitation:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
