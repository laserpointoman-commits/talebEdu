import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { fee_id } = await req.json();

    console.log('Sending payment reminder for fee:', fee_id);

    // Fetch fee details
    const { data: fee, error: feeError } = await supabase
      .from('student_fees')
      .select(`
        *,
        student:students(
          full_name,
          class,
          parent:profiles!parent_id(full_name, email)
        )
      `)
      .eq('id', fee_id)
      .single();

    if (feeError) throw feeError;
    if (!fee || !fee.student || !fee.student.parent) {
      throw new Error('Fee or parent data not found');
    }

    const daysUntilDue = Math.ceil(
      (new Date(fee.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    const isOverdue = daysUntilDue < 0;
    const remaining = fee.total_amount - fee.paid_amount;

    const reminderType = isOverdue ? 'overdue' : 'before_due';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .alert { 
      background: ${isOverdue ? '#fee2e2' : '#fef3c7'}; 
      border-left: 4px solid ${isOverdue ? '#dc2626' : '#f59e0b'}; 
      padding: 15px; 
      margin: 20px 0; 
      border-radius: 4px;
    }
    .amount { 
      font-size: 32px; 
      font-weight: bold; 
      color: ${isOverdue ? '#dc2626' : '#f59e0b'}; 
      text-align: center; 
      margin: 20px 0; 
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .info-table td { padding: 10px; border-bottom: 1px solid #e0e0e0; }
    .info-table td:first-child { font-weight: bold; color: #666; }
    .arabic { direction: rtl; text-align: right; margin-top: 30px; padding-top: 30px; border-top: 2px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 ${isOverdue ? 'Payment Overdue Notice' : 'Payment Reminder'}</h1>
    </div>
    <div class="content">
      <div class="alert">
        <strong>${isOverdue ? '⚠️ OVERDUE PAYMENT' : '📅 Upcoming Payment Due'}</strong>
        <p style="margin: 5px 0 0 0;">
          ${isOverdue 
            ? `This payment is ${Math.abs(daysUntilDue)} days overdue. Please make the payment as soon as possible.`
            : `Payment is due in ${daysUntilDue} days. Please ensure timely payment.`
          }
        </p>
      </div>

      <p>Dear ${fee.student.parent.full_name},</p>
      <p>This is a ${isOverdue ? 'reminder that payment is overdue' : 'friendly reminder about an upcoming payment due'} for your child's school fees.</p>

      <table class="info-table">
        <tr>
          <td>Student Name:</td>
          <td>${fee.student.full_name}</td>
        </tr>
        <tr>
          <td>Class:</td>
          <td>${fee.student.class}</td>
        </tr>
        <tr>
          <td>Fee Type:</td>
          <td>${fee.fee_type}</td>
        </tr>
        <tr>
          <td>Due Date:</td>
          <td>${new Date(fee.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
        <tr>
          <td>Total Amount:</td>
          <td>${fee.total_amount.toFixed(3)} OMR</td>
        </tr>
        <tr>
          <td>Paid Amount:</td>
          <td>${fee.paid_amount.toFixed(3)} OMR</td>
        </tr>
      </table>

      <div class="amount">
        Outstanding: ${remaining.toFixed(3)} OMR
      </div>

      <div style="text-align: center;">
        <a href="${supabaseUrl}/dashboard" class="button">
          Pay Now
        </a>
      </div>

      <p>You can make the payment through your parent portal using your wallet balance.</p>

      ${isOverdue ? `
        <div class="alert">
          <strong>Late Fee Notice:</strong>
          <p style="margin: 5px 0 0 0;">Please note that late fees may be applied to overdue payments as per school policy.</p>
        </div>
      ` : ''}

      <div class="arabic">
        <h2>تذكير بالدفع</h2>
        <p>عزيزي ${fee.student.parent.full_name}،</p>
        <p>هذا تذكير ${isOverdue ? 'بأن الدفع متأخر' : 'بموعد الدفع القادم'} لرسوم طفلك الدراسية.</p>
        <table class="info-table">
          <tr>
            <td>${fee.student.full_name}</td>
            <td>اسم الطالب:</td>
          </tr>
          <tr>
            <td>${remaining.toFixed(3)} ر.ع</td>
            <td>المبلغ المستحق:</td>
          </tr>
          <tr>
            <td>${new Date(fee.due_date).toLocaleDateString('ar-SA')}</td>
            <td>تاريخ الاستحقاق:</td>
          </tr>
        </table>
      </div>

      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        This is an automated reminder from TalebEdu School Management System.<br>
        For questions, please contact the school administration.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email
    await resend.emails.send({
      from: "TalebEdu <onboarding@resend.dev>",
      to: [fee.student.parent.email],
      subject: isOverdue 
        ? `⚠️ Overdue Payment - ${fee.fee_type}`
        : `Payment Reminder - ${fee.fee_type}`,
      html: htmlContent
    });

    // Record reminder
    await supabase.from('payment_reminders').insert([{
      fee_id: fee_id,
      reminder_type: reminderType,
      parent_notified: true,
      notification_method: 'email'
    }]);

    // Update fee record
    await supabase
      .from('student_fees')
      .update({
        reminder_sent_at: new Date().toISOString(),
        last_reminder_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', fee_id);

    return new Response(
      JSON.stringify({ success: true, message: 'Reminder sent successfully' }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-payment-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
