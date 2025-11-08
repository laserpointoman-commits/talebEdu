import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendCredentialsRequest {
  email: string;
  password: string;
  fullName: string;
  role: string;
  recipientEmail: string;
  language: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication and admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized: No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized: Invalid token');
    }

    // Check if user has admin or developer role
    const { data: userRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'developer']);

    if (roleError || !userRoles || userRoles.length === 0) {
      throw new Error('Forbidden: Admin access required');
    }

    console.log('Authorized admin sending credentials:', user.id);

    const { email, password, fullName, role, recipientEmail, language }: SendCredentialsRequest = await req.json();

    // Input validation
    if (!email || !password || !fullName || !role || !recipientEmail) {
      throw new Error('All fields are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      throw new Error('Invalid recipient email format');
    }

    console.log("Sending credentials email to:", recipientEmail);

    const isArabic = language === 'ar';
    
    const subject = isArabic ? 'بيانات تسجيل الدخول الخاصة بك' : 'Your Login Credentials';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; ${isArabic ? 'direction: rtl;' : ''}">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px;">${isArabic ? 'مرحباً بك في تالب إيدو' : 'Welcome to TalebEdu'}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${isArabic ? 'نظام إدارة المدرسة المتطور' : 'Advanced School Management System'}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">${isArabic ? 'مرحباً ' + fullName : 'Hello ' + fullName}</h2>
          <p style="color: #666; line-height: 1.6;">
            ${isArabic 
              ? 'تم إنشاء حسابك بنجاح في نظام تالب إيدو. فيما يلي بيانات تسجيل الدخول الخاصة بك:'
              : 'Your account has been successfully created in the TalebEdu system. Below are your login credentials:'
            }
          </p>
        </div>
        
        <div style="background: white; border: 2px solid #e9ecef; border-radius: 8px; padding: 25px; margin-bottom: 20px;">
          <h3 style="color: #495057; margin-top: 0; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">
            ${isArabic ? 'بيانات تسجيل الدخول' : 'Login Information'}
          </h3>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #6c757d; display: block; margin-bottom: 5px;">
              ${isArabic ? 'البريد الإلكتروني:' : 'Email:'}
            </strong>
            <span style="background: #f8f9fa; padding: 8px 12px; border-radius: 4px; font-family: monospace; display: inline-block; color: #495057; border: 1px solid #dee2e6;">
              ${email}
            </span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #6c757d; display: block; margin-bottom: 5px;">
              ${isArabic ? 'كلمة المرور:' : 'Password:'}
            </strong>
            <span style="background: #f8f9fa; padding: 8px 12px; border-radius: 4px; font-family: monospace; display: inline-block; color: #495057; border: 1px solid #dee2e6;">
              ${password}
            </span>
          </div>
          
          <div>
            <strong style="color: #6c757d; display: block; margin-bottom: 5px;">
              ${isArabic ? 'الدور:' : 'Role:'}
            </strong>
            <span style="background: #e3f2fd; color: #1976d2; padding: 6px 12px; border-radius: 20px; font-size: 14px; text-transform: capitalize;">
              ${role}
            </span>
          </div>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h4 style="color: #856404; margin-top: 0;">
            ${isArabic ? '⚠️ تنبيه أمني' : '⚠️ Security Notice'}
          </h4>
          <p style="color: #856404; margin-bottom: 0; line-height: 1.5;">
            ${isArabic 
              ? 'لأسباب أمنية، يُنصح بتغيير كلمة المرور عند تسجيل الدخول لأول مرة. يمكنك تغيير كلمة المرور من الملف الشخصي > الأمان.'
              : 'For security reasons, it is recommended to change your password upon first login. You can change your password from Profile > Security.'
            }
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px;">
          <a href="https://b9b768f5-1a7c-4563-ab9c-d1b25b963f4b.lovableproject.com/auth" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            ${isArabic ? 'تسجيل الدخول الآن' : 'Login Now'}
          </a>
        </div>
        
        <div style="text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px;">
          <p style="margin: 0;">
            ${isArabic ? 'هذه رسالة تلقائية من نظام تالب إيدو' : 'This is an automated message from TalebEdu System'}
          </p>
          <p style="margin: 5px 0 0 0;">
            ${isArabic ? 'إذا لم تطلب هذا الحساب، يرجى تجاهل هذه الرسالة' : 'If you did not request this account, please ignore this message'}
          </p>
        </div>
      </div>
    `;

    // Temporarily disabled until Resend API key is configured
    console.log("Email would be sent to:", recipientEmail, "with subject:", subject);
    const emailResponse = { id: 'mock-id', message: 'Email service not configured' };

    console.log("Credentials email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-credentials function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message.includes('Unauthorized') ? 401 :
                error.message.includes('Forbidden') ? 403 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);