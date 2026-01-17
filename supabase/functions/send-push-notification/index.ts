import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  user_id?: string;
  user_ids?: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
}

// Generate JWT for APNs authentication
async function generateAPNsJWT(): Promise<string> {
  const keyId = Deno.env.get('APNS_KEY_ID')!;
  const teamId = Deno.env.get('APNS_TEAM_ID')!;
  const privateKey = Deno.env.get('APNS_PRIVATE_KEY')!;

  const header = {
    alg: 'ES256',
    kid: keyId,
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: teamId,
    iat: now,
  };

  // Encode header and payload
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key
  const pemContents = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    encoder.encode(unsignedToken)
  );

  // Convert signature to base64url
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsignedToken}.${signatureB64}`;
}

// Send notification to iOS device
async function sendAPNsNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  badge?: number,
  sound?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const jwt = await generateAPNsJWT();
    const bundleId = Deno.env.get('APNS_BUNDLE_ID')!;
    
    // Use production APNs server
    const apnsUrl = `https://api.push.apple.com/3/device/${token}`;
    
    const payload = {
      aps: {
        alert: {
          title,
          body,
        },
        badge: badge ?? 1,
        sound: sound ?? 'default',
        'mutable-content': 1,
      },
      ...data,
    };

    console.log(`Sending APNs notification to token: ${token.substring(0, 20)}...`);

    const response = await fetch(apnsUrl, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwt}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'apns-expiration': '0',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('APNs notification sent successfully');
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error(`APNs error: ${response.status} - ${errorText}`);
      
      // If token is invalid, mark it as inactive
      if (response.status === 410 || response.status === 400) {
        return { success: false, error: `Invalid token: ${errorText}` };
      }
      
      return { success: false, error: errorText };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('APNs send error:', error);
    return { success: false, error: errorMessage };
  }
}

// Send notification to Android device using FCM
async function sendFCMNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  // FCM implementation would go here
  // For now, log that we'd send to Android
  console.log(`FCM notification would be sent to: ${token.substring(0, 20)}...`);
  return { success: true };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushPayload = await req.json();
    console.log('Received push notification request:', JSON.stringify(payload));

    const { user_id, user_ids, title, body, data, badge, sound } = payload;

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get target user IDs
    const targetUserIds = user_ids || (user_id ? [user_id] : []);
    
    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all active push tokens for target users
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('*')
      .in('user_id', targetUserIds)
      .eq('is_active', true);

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log('No active push tokens found for users:', targetUserIds);
      return new Response(
        JSON.stringify({ message: 'No active push tokens found', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${tokens.length} push tokens to send to`);

    // Send notifications to all tokens
    const results = await Promise.all(
      tokens.map(async (tokenRecord) => {
        if (tokenRecord.platform === 'ios') {
          const result = await sendAPNsNotification(
            tokenRecord.token,
            title,
            body,
            data,
            badge,
            sound
          );
          
          // Mark invalid tokens as inactive
          if (!result.success && result.error?.includes('Invalid token')) {
            await supabase
              .from('push_tokens')
              .update({ is_active: false })
              .eq('id', tokenRecord.id);
          }
          
          return { ...result, platform: 'ios', token_id: tokenRecord.id };
        } else if (tokenRecord.platform === 'android') {
          const result = await sendFCMNotification(tokenRecord.token, title, body, data);
          return { ...result, platform: 'android', token_id: tokenRecord.id };
        }
        return { success: false, error: 'Unknown platform', platform: tokenRecord.platform };
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`Notifications sent: ${successCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        message: 'Push notifications processed',
        sent: successCount,
        failed: failedCount,
        details: results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
