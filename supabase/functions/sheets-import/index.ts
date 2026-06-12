// Fetches a Google Sheet preview via the Lovable connector gateway.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GOOGLE_SHEETS_API_KEY = Deno.env.get("GOOGLE_SHEETS_API_KEY");

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

interface RequestBody {
  spreadsheet_id?: string;
  range?: string;
}

function extractId(input: string): string | null {
  const trimmed = input.trim();
  const m = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return trimmed;
  return null;
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

    if (!LOVABLE_API_KEY || !GOOGLE_SHEETS_API_KEY) {
      return json({
        error: "google_sheets_not_connected",
        message: "Google Sheets connector is not linked to this project.",
      }, 412);
    }

    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const idOrUrl = body.spreadsheet_id;
    if (!idOrUrl || typeof idOrUrl !== "string") {
      return json({ error: "spreadsheet_id (or URL) required" }, 400);
    }
    const id = extractId(idOrUrl);
    if (!id) return json({ error: "Invalid Google Sheets URL or ID" }, 400);
    const range = (body.range && typeof body.range === "string" ? body.range : "A1:Z200").trim();

    const headers = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_SHEETS_API_KEY,
    };

    // Get sheet metadata first
    const metaRes = await fetch(`${GATEWAY}/spreadsheets/${id}?fields=properties.title,sheets.properties`, { headers });
    if (!metaRes.ok) {
      const text = await metaRes.text();
      return json({ error: `Gateway error ${metaRes.status}`, detail: text.slice(0, 500) }, metaRes.status);
    }
    const meta = await metaRes.json();
    const title = meta?.properties?.title ?? "Untitled";
    const firstSheet = meta?.sheets?.[0]?.properties?.title ?? "Sheet1";
    const finalRange = range.includes("!") ? range : `${firstSheet}!${range}`;

    const valuesRes = await fetch(`${GATEWAY}/spreadsheets/${id}/values/${finalRange}`, { headers });
    if (!valuesRes.ok) {
      const text = await valuesRes.text();
      return json({ error: `Gateway error ${valuesRes.status}`, detail: text.slice(0, 500) }, valuesRes.status);
    }
    const valuesData = await valuesRes.json();
    const values: string[][] = valuesData?.values ?? [];
    const [headerRow = [], ...rows] = values;

    return json({
      title,
      sheet: firstSheet,
      range: finalRange,
      headers: headerRow,
      rows: rows.slice(0, 100),
      total_rows: rows.length,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
