// Sends a signed test payload to a user's webhook URL and logs the result.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  const [a, b, c, d] = parts;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 127) return true; // 127.0.0.0/8
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 169 && b === 254) return true; // 169.254.0.0/16
  if (a === 192 && b === 0 && c === 0) return true; // 192.0.0.0/24
  if (a === 192 && b === 0 && c === 2) return true; // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 88 && c === 99) return true; // 192.88.99.0/24
  if (a === 198 && b >= 18 && b <= 19) return true; // 198.18.0.0/15
  if (a === 198 && b === 51 && c === 100) return true; // 198.51.100.0/24 (TEST-NET-2)
  if (a === 203 && b === 0 && c === 113) return true; // 203.0.113.0/24 (TEST-NET-3)
  if (a >= 224) return true; // 224.0.0.0+ (multicast, reserved, broadcast)
  // 100.64.0.0/10 (CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7
  if (lower.startsWith("fe80")) return true; // fe80::/10
  if (lower.startsWith("ff")) return true; // multicast ff00::/8
  if (lower.startsWith("::ffff:7f")) return true; // IPv4-mapped loopback 127.x
  if (lower.startsWith("::ffff:0:7f")) return true; // IPv4-mapped loopback variant
  if (lower.startsWith("::ffff:a")) return true; // IPv4-mapped 10.x
  if (lower.startsWith("::ffff:ac1")) return true; // IPv4-mapped 172.16-31
  if (lower.startsWith("::ffff:c0a8")) return true; // IPv4-mapped 192.168
  return false;
}

function looksLikeIP(host: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) || /^[0-9a-fA-F:]+$/.test(host);
}

async function resolveAndCheckPrivate(host: string): Promise<boolean> {
  try {
    const records = await Deno.resolveDns(host, "A");
    if (records.some((ip) => isPrivateIPv4(ip))) return true;
  } catch { /* ignore */ }
  try {
    const records = await Deno.resolveDns(host, "AAAA");
    if (records.some((ip) => isPrivateIPv6(ip))) return true;
  } catch { /* ignore */ }
  return false;
}

async function isBlockedHost(host: string): Promise<boolean> {
  const lower = host.toLowerCase();
  const blockedNames = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
  if (blockedNames.includes(lower)) return true;
  if (lower.endsWith(".local")) return true;
  if (looksLikeIP(lower)) {
    if (isPrivateIPv4(lower)) return true;
    if (isPrivateIPv6(lower)) return true;
  }
  return await resolveAndCheckPrivate(lower);
}

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
    if (await isBlockedHost(host)) {
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
