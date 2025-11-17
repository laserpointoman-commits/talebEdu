import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentReceiptRequest {
  payment_id: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { payment_id }: PaymentReceiptRequest = await req.json();

    console.log('Generating receipt for payment:', payment_id);

    // Fetch payment details with related data
    const { data: payment, error: paymentError } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        parent:profiles!parent_id(full_name, email),
        fee:student_fees!fee_id(
          fee_type,
          total_amount,
          student:students(full_name, class)
        )
      `)
      .eq('id', payment_id)
      .single();

    if (paymentError) throw paymentError;
    if (!payment || !payment.parent || !payment.fee) {
      throw new Error('Payment data not found');
    }

    const receiptNumber = payment.receipt_number || `RCP-${Date.now()}`;
    const remaining = payment.fee.total_amount - (payment.fee.paid_amount || 0) - payment.amount;

    // Generate beautiful HTML email
    const htmlContent = `
<!DOCTYPE html>
<html dir="auto" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container { 
      max-width: 600px; 
      margin: 20px auto; 
      background: white; 
      padding: 0;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .receipt-number {
      background: rgba(255,255,255,0.2);
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      margin-top: 10px;
      font-size: 14px;
    }
    .content {
      padding: 30px;
    }
    .success-icon {
      text-align: center;
      font-size: 60px;
      color: #10b981;
      margin: 20px 0;
    }
    .info-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #666;
      font-weight: 500;
    }
    .info-value {
      font-weight: 600;
      color: #333;
    }
    .amount-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .amount-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    .amount-value {
      font-size: 36px;
      font-weight: bold;
      margin: 10px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 12px;
      background: #f8f9fa;
    }
    .arabic-section {
      direction: rtl;
      text-align: right;
      border-top: 2px solid #e0e0e0;
      margin-top: 30px;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Payment Receipt</h1>
      <div class="receipt-number">Receipt #${receiptNumber}</div>
    </div>

    <div class="content">
      <div class="success-icon">✓</div>
      <h2 style="text-align: center; color: #10b981; margin: 0;">Payment Successful!</h2>
      <p style="text-align: center; color: #666;">Thank you for your payment. Here are the details:</p>

      <div class="amount-section">
        <div class="amount-label">Amount Paid</div>
        <div class="amount-value">${payment.amount.toFixed(3)} OMR</div>
        <div class="amount-label">Payment Date: ${new Date(payment.payment_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</div>
      </div>

      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Student Name</span>
          <span class="info-value">${payment.fee.student.full_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Class</span>
          <span class="info-value">${payment.fee.student.class}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Fee Type</span>
          <span class="info-value">${payment.fee.fee_type}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method</span>
          <span class="info-value">${payment.payment_method}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Transaction Reference</span>
          <span class="info-value">${payment.transaction_reference || 'N/A'}</span>
        </div>
      </div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #667eea;">Payment Summary</h3>
        <div class="info-row">
          <span class="info-label">Total Fee Amount</span>
          <span class="info-value">${payment.fee.total_amount.toFixed(3)} OMR</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount Paid Today</span>
          <span class="info-value" style="color: #10b981;">-${payment.amount.toFixed(3)} OMR</span>
        </div>
        <div class="info-row">
          <span class="info-label">Remaining Balance</span>
          <span class="info-value" style="color: ${remaining > 0 ? '#ef4444' : '#10b981'}; font-size: 18px;">
            ${remaining.toFixed(3)} OMR
          </span>
        </div>
      </div>

      <!-- Arabic Section -->
      <div class="arabic-section">
        <h2 style="text-align: center; color: #667eea;">إيصال الدفع</h2>
        <div class="info-section">
          <div class="info-row">
            <span class="info-value">${payment.fee.student.full_name}</span>
            <span class="info-label">اسم الطالب</span>
          </div>
          <div class="info-row">
            <span class="info-value">${payment.fee.student.class}</span>
            <span class="info-label">الصف</span>
          </div>
          <div class="info-row">
            <span class="info-value">${payment.amount.toFixed(3)} ر.ع</span>
            <span class="info-label">المبلغ المدفوع</span>
          </div>
          <div class="info-row">
            <span class="info-value">${remaining.toFixed(3)} ر.ع</span>
            <span class="info-label">الرصيد المتبقي</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>TalebEdu School Management System</strong></p>
      <p>This is an automated receipt. Please keep it for your records.</p>
      <p>For any questions, please contact the school administration.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "TalebEdu <onboarding@resend.dev>",
      to: [payment.parent.email],
      subject: `Payment Receipt - ${receiptNumber}`,
      html: htmlContent
    });

    console.log("Email sent successfully:", emailResponse);

    // Update payment record
    await supabase
      .from('payment_transactions')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        receipt_number: receiptNumber
      })
      .eq('id', payment_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        receipt_number: receiptNumber,
        email_id: emailResponse.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-payment-receipt:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
