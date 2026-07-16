const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const recipientEmail = "info@neptunelogistics.lk";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL") || "Neptune Logistics <noreply@neptunelogistics.lk>";

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const html = `
      <h2>New Neptune Logistics Website Enquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(body.name)}</p>
      <p><strong>Company:</strong> ${escapeHtml(body.company)}</p>
      <p><strong>Email:</strong> ${escapeHtml(body.email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(body.phone)}</p>
      <p><strong>Service:</strong> ${escapeHtml(body.service)}</p>
      <p><strong>Origin:</strong> ${escapeHtml(body.origin)}</p>
      <p><strong>Destination:</strong> ${escapeHtml(body.destination)}</p>
      <p><strong>Cargo Details:</strong> ${escapeHtml(body.cargo_details)}</p>
      <p><strong>Urgency:</strong> ${escapeHtml(body.urgency)}</p>
      <p><strong>Message:</strong><br>${escapeHtml(body.message).replace(/\n/g, "<br>")}</p>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipientEmail,
        reply_to: body.email,
        subject: `Neptune Logistics Enquiry from ${body.name || "Website"}`,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(errorText);
    }

    return new Response(JSON.stringify({ success: true, sendTo: recipientEmail }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unable to send enquiry",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
