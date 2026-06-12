// Sends a signed test payload to a user's webhook URL and logs the result.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RequestBody {
  webhook_id?: string;
  payload?: unknown;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Missing auth" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = (await req.json().catch(() => ({}))) as RequestBody;
    if (!body.webhook_id || typeof body.webhook_id !== "string") {
      return json({ error: "webhook_id required" }, 400);
    }
    if (!body.payload || typeof body.payload !== "object") {
      return json({ error: "payload must be an object" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: webhook, error: whErr } = await admin
      .from("webhooks")
      .select("id, url, name, user_id, is_active")
      .eq("id", body.webhook_id)
      .maybeSingle();

    if (whErr || !webhook) return json({ error: "Webhook not found" }, 404);
    if (webhook.user_id !== userId) return json({ error: "Forbidden" }, 403);

    // Validate URL — must be https and not point at private network
    let parsed: URL;
    try { parsed = new URL(webhook.url); } catch { return json({ error: "Invalid webhook URL" }, 400); }
    if (parsed.protocol !== "https:") return json({ error: "Only https:// URLs allowed" }, 400);
    const host = parsed.hostname.toLowerCase();
    const blocked = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
    if (blocked.includes(host) || host.endsWith(".local") || host.startsWith("169.254.")) {
      return json({ error: "URL points to a non-public host" }, 400);
    }

    const bodyStr = JSON.stringify({ ...body.payload, test: true, sent_at: new Date().toISOString() });

    const start = performance.now();
    let status: number | null = null;
    let responseBody = "";
    let ok = false;
    let error: string | undefined;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "ManageX-Webhook-Tester/1.0",
          "X-ManageX-Event": "test",
          "X-ManageX-Webhook-Id": webhook.id,
        },
        body: bodyStr,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      status = res.status;
      ok = res.ok;
      responseBody = (await res.text()).slice(0, 2000);
    } catch (e) {
      error = e instanceof Error ? e.message : "Request failed";
    }

    const latency = Math.round(performance.now() - start);

    // Log delivery
    await admin.from("webhook_logs").insert({
      user_id: userId,
      webhook_id: webhook.id,
      event_type: "test",
      payload: body.payload as Record<string, unknown>,
      success: ok,
      response_status: status,
      response_body: responseBody.slice(0, 1000),
      error_message: error ?? null,
    });

    // Update webhook last_triggered_at
    if (ok) {
      await admin.from("webhooks").update({ last_triggered_at: new Date().toISOString() }).eq("id", webhook.id);
    }

    return json({ status, ok, body: responseBody, error, latency_ms: latency });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
