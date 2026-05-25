import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.106.1";

const corsHeadersBase = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowListValue = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  const allowList = allowListValue
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOrigin =
    origin && (allowList.length === 0 || allowList.includes(origin))
      ? origin
      : allowList[0] ?? "*";

  return {
    ...corsHeadersBase,
    "Access-Control-Allow-Origin": allowedOrigin,
    Vary: "Origin",
  };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // 1. Authentifier l'expéditeur via son token
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { sender_id, receiver_id, content } = await req.json();

    if (!sender_id || !receiver_id || !content) {
      return new Response(
        JSON.stringify({ error: "sender_id, receiver_id, and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Vérifier l'identité de l'expéditeur avec le client de sécurité
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user || user.id !== sender_id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized sender" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Initialiser le client Admin (Service Role) pour interroger auth.users
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Récupérer les profils et l'email du destinataire en parallèle
    const [senderProfileRes, receiverProfileRes, receiverUserRes] = await Promise.all([
      supabase.from("profiles").select("full_name, username").eq("id", sender_id).maybeSingle(),
      supabase.from("profiles").select("full_name").eq("id", receiver_id).maybeSingle(),
      supabase.auth.admin.getUserById(receiver_id),
    ]);

    const senderProfile = senderProfileRes.data;
    const receiverProfile = receiverProfileRes.data;
    const receiverEmail = receiverUserRes.data?.user?.email;

    if (!receiverEmail) {
      return new Response(
        JSON.stringify({ error: "Receiver email not found in auth.users" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const senderName = senderProfile?.full_name || "Un développeur";
    const senderUsername = senderProfile?.username || "inconnu";
    const receiverName = receiverProfile?.full_name || "Contributeur";

    // 4. Envoyer l'email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY is not set. Skipping email dispatch.");
      return new Response(
        JSON.stringify({ success: false, warning: "RESEND_API_KEY not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
    
    // Contenu HTML soigné et esthétique (Rich design)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b0f19;
            color: #f3f4f6;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 580px;
            margin: 0 auto;
            background: rgba(17, 24, 39, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          }
          .header {
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding-bottom: 20px;
            margin-bottom: 25px;
            text-align: center;
          }
          .logo {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
            background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
          }
          .greeting {
            font-size: 16px;
            line-height: 24px;
            color: #d1d5db;
            margin-bottom: 15px;
          }
          .message-box {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
            font-style: italic;
            color: #e5e7eb;
            font-size: 15px;
            line-height: 24px;
            border-left: 4px solid #10b981;
          }
          .btn-container {
            text-align: center;
            margin: 30px 0 15px 0;
          }
          .btn {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 30px;
            font-weight: 600;
            font-size: 14px;
            border-radius: 9999px;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            transition: all 0.2s ease;
          }
          .footer {
            margin-top: 35px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            padding-top: 20px;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
            line-height: 18px;
          }
          .footer a {
            color: #10b981;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="logo">TechMap Congo</span>
          </div>
          
          <div class="greeting">
            Bonjour <strong>${receiverName}</strong>,
          </div>
          
          <div class="greeting">
            Vous avez reçu un nouveau message privé de la part de <strong>${senderName}</strong> (@${senderUsername}) sur TechMap Congo :
          </div>
          
          <div class="message-box">
            "${content}"
          </div>
          
          <div class="btn-container">
            <a href="https://techmapcongo.com/messages" class="btn">Répondre sur TechMap</a>
          </div>
          
          <div class="footer">
            Cet email vous a été envoyé automatiquement par <a href="https://techmapcongo.com">TechMap Congo</a>.<br>
            La cartographie et le réseau de la communauté tech congolaise.
          </div>
        </div>
      </body>
      </html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `TechMap Congo <${fromEmail}>`,
        to: receiverEmail,
        subject: `💬 Nouveau message de ${senderName} sur TechMap Congo`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error("Resend API returned error:", resendError);
      return new Response(
        JSON.stringify({ error: "Failed to dispatch email via Resend" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendResult = await resendResponse.json();

    return new Response(
      JSON.stringify({ success: true, emailId: resendResult.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Internal edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
