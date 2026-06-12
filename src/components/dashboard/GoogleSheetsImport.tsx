import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { validateTaskRow, validateTeamMemberRow } from "@/lib/validation";
import { FileSpreadsheet, Loader2, Eye, Download, AlertTriangle, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

interface PreviewData {
  title: string;
  sheet: string;
  range: string;
  headers: string[];
  rows: string[][];
  total_rows: number;
}

const targets = [
  { value: "tasks", label: "Tasks", columns: ["title", "description", "status", "priority", "due_date"] },
  { value: "team_members", label: "Team Members", columns: ["name", "email", "role", "department"] },
];

export function GoogleSheetsImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [range, setRange] = useState("A1:Z200");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [target, setTarget] = useState("tasks");
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [dryRun, setDryRun] = useState(true);
  const [validationOutcome, setValidationOutcome] = useState<{ valid: number; invalid: number; errors: string[] } | null>(null);
  const [notConnected, setNotConnected] = useState(false);

  const targetCfg = targets.find((t) => t.value === target)!;

  const autoMap = (headers: string[]) => {
    const m: Record<string, string> = {};
    headers.forEach((h) => {
      const norm = h.toLowerCase().replace(/[_\s-]/g, "");
      const match = targetCfg.columns.find((c) => c.toLowerCase().replace(/[_\s-]/g, "") === norm);
      m[h] = match ?? "__skip__";
    });
    setMappings(m);
  };

  const handlePreview = async () => {
    setLoading(true);
    setPreview(null);
    setValidationOutcome(null);
    setNotConnected(false);
    try {
      const { data, error } = await supabase.functions.invoke("sheets-import", {
        body: { spreadsheet_id: url, range },
      });
      if (error) throw error;
      const res = data as PreviewData & { error?: string; message?: string };
      if (res.error === "google_sheets_not_connected") {
        setNotConnected(true);
        return;
      }
      if (res.error) throw new Error(res.message || res.error);
      setPreview(res);
      autoMap(res.headers);
      toast({ title: "Sheet loaded", description: `${res.total_rows} data rows found.` });
    } catch (e) {
      toast({
        title: "Could not load sheet",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildRows = () => {
    if (!preview) return [];
    return preview.rows.map((row, idx) => {
      const obj: Record<string, string> = {};
      preview.headers.forEach((h, i) => {
        const tgt = mappings[h];
        if (tgt && tgt !== "__skip__") obj[tgt] = (row[i] ?? "").toString().slice(0, 1000);
      });
      return { idx, data: obj };
    });
  };

  const runValidation = () => {
    const rows = buildRows();
    const errors: string[] = [];
    let valid = 0;
    rows.forEach(({ idx, data }) => {
      if (Object.keys(data).length === 0) {
        errors.push(`Row ${idx + 2}: no mapped fields`);
        return;
      }
      const result = target === "tasks" ? validateTaskRow(data) : validateTeamMemberRow(data);
      if (result.success) valid++;
      else errors.push(`Row ${idx + 2}: ${result.error.errors.map((e) => e.message).join(", ")}`);
    });
    setValidationOutcome({ valid, invalid: rows.length - valid, errors: errors.slice(0, 20) });
  };

  const handleImport = async () => {
    if (!user || !preview) return;
    runValidation();
    if (dryRun) {
      toast({ title: "Dry-run complete", description: "No data was written." });
      return;
    }
    setImporting(true);
    const rows = buildRows();
    let success = 0;
    let failed = 0;
    for (const { data } of rows) {
      if (Object.keys(data).length === 0) { failed++; continue; }
      const result = target === "tasks" ? validateTaskRow(data) : validateTeamMemberRow(data);
      if (!result.success) { failed++; continue; }
      const row = { user_id: user.id, ...result.data };
      const { error } = await supabase.from(target as "tasks" | "team_members").insert(row as never);
      if (error) failed++; else success++;
    }
    await supabase.from("activity_feed").insert({
      user_id: user.id,
      action: "sheets_import",
      entity_type: target,
      entity_name: preview.title,
      details: { success, failed, total: rows.length },
    });
    setImporting(false);
    toast({
      title: "Import finished",
      description: `${success} imported, ${failed} failed.`,
      variant: failed > 0 ? "destructive" : "default",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Import from Google Sheets
        </CardTitle>
        <CardDescription>Paste a Google Sheets URL, map columns, validate, and import.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {notConnected && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Google Sheets isn't connected to this workspace yet. Ask an admin to link the
              Google Sheets connector from the project's Integrations panel, then try again.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="sheet-url">Sheet URL or ID</Label>
            <Input id="sheet-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sheet-range">Range</Label>
            <Input id="sheet-range" value={range} onChange={(e) => setRange(e.target.value)} placeholder="A1:Z200" />
          </div>
        </div>

        <Button onClick={handlePreview} disabled={!url || loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          Load preview
        </Button>

        {preview && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1"><FileSpreadsheet className="h-3 w-3" />{preview.title}</Badge>
              <Badge variant="outline">{preview.total_rows} rows</Badge>
              <Badge variant="outline">{preview.headers.length} columns</Badge>
            </div>

            <div className="space-y-1.5">
              <Label>Target table</Label>
              <Select value={target} onValueChange={(v) => { setTarget(v); autoMap(preview.headers); }}>
                <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {targets.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Column mapping</Label>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Sheet column</th>
                      <th className="px-3 py-2 w-8"></th>
                      <th className="px-3 py-2 text-left font-medium">Target field</th>
                      <th className="px-3 py-2 text-left font-medium">Sample</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.headers.map((h, i) => (
                      <tr key={h + i} className="border-t border-border">
                        <td className="px-3 py-2"><Badge variant="outline">{h || `(col ${i + 1})`}</Badge></td>
                        <td className="px-3 py-2 text-muted-foreground"><ArrowRight className="h-4 w-4" /></td>
                        <td className="px-3 py-2">
                          <Select value={mappings[h] ?? "__skip__"} onValueChange={(v) => setMappings((m) => ({ ...m, [h]: v }))}>
                            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-background border-border">
                              <SelectItem value="__skip__">Skip</SelectItem>
                              {targetCfg.columns.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-xs">
                          {preview.rows[0]?.[i] ?? ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Dry-run</p>
                <p className="text-xs text-muted-foreground">Validate without writing to the database.</p>
              </div>
              <Switch checked={dryRun} onCheckedChange={setDryRun} aria-label="Toggle dry-run" />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={runValidation} className="gap-2">
                <CheckCircle2 className="h-4 w-4" /> Validate
              </Button>
              <Button onClick={handleImport} disabled={importing} className="gap-2">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {dryRun ? "Dry-run import" : "Import now"}
              </Button>
            </div>

            {validationOutcome && (
              <Alert className={validationOutcome.invalid > 0 ? "border-destructive/50" : "border-success/50"}>
                {validationOutcome.invalid > 0
                  ? <AlertTriangle className="h-4 w-4 text-destructive" />
                  : <CheckCircle2 className="h-4 w-4 text-success" />}
                <AlertDescription className="space-y-1">
                  <p className="font-medium">
                    {validationOutcome.valid} valid, {validationOutcome.invalid} invalid
                  </p>
                  {validationOutcome.errors.length > 0 && (
                    <ul className="text-xs space-y-0.5 max-h-40 overflow-y-auto">
                      {validationOutcome.errors.map((e, i) => <li key={i}>• {e}</li>)}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
