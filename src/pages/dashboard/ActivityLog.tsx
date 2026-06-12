import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Filter, Loader2, History } from "lucide-react";

interface ActivityRow {
  id: string;
  action: string;
  entity_type: string;
  entity_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

function toCSV(rows: ActivityRow[]): string {
  const headers = ["created_at", "action", "entity_type", "entity_name", "details"];
  const escape = (v: unknown) => {
    const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape((r as unknown as Record<string, unknown>)[h])).join(",")),
  ].join("\n");
}

export default function ActivityLog() {
  useDocumentTitle("Activity Log");
  const { user } = useAuth();
  const { toast } = useToast();

  const [action, setAction] = useState<string>("all");
  const [entityType, setEntityType] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["activity-feed", user?.id, action, entityType, from, to],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("activity_feed")
        .select("id, action, entity_type, entity_name, details, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(500);
      if (action !== "all") q = q.eq("action", action);
      if (entityType !== "all") q = q.eq("entity_type", entityType);
      if (from) q = q.gte("created_at", new Date(from).toISOString());
      if (to) q = q.lte("created_at", new Date(`${to}T23:59:59`).toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ActivityRow[];
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const s = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.action.toLowerCase().includes(s) ||
        r.entity_type.toLowerCase().includes(s) ||
        (r.entity_name?.toLowerCase().includes(s) ?? false),
    );
  }, [rows, search]);

  const actionOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.action))).sort(),
    [rows],
  );
  const entityOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.entity_type))).sort(),
    [rows],
  );

  const handleExport = () => {
    if (filtered.length === 0) {
      toast({ title: "Nothing to export", description: "No activity matches the current filters." });
      return;
    }
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity_log_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${filtered.length} rows downloaded.` });
  };

  return (
    <div>
      <DashboardHeader title="Activity Log" subtitle="Audit changes across your workspace" />
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Filters
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="search">Search</Label>
                <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
              </div>
              <div className="space-y-1.5">
                <Label>Action</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border-border max-h-72">
                    <SelectItem value="all">All actions</SelectItem>
                    {actionOptions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Entity</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border-border max-h-72">
                    <SelectItem value="all">All entities</SelectItem>
                    {entityOptions.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="from">From</Label>
                <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to">To</Label>
                <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "entry" : "entries"}</p>
              <Button onClick={handleExport} variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No activity matches your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">When</th>
                      <th className="py-2 pr-4 font-medium">Action</th>
                      <th className="py-2 pr-4 font-medium">Entity</th>
                      <th className="py-2 pr-4 font-medium">Name</th>
                      <th className="py-2 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-muted/40">
                        <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4"><Badge variant="outline">{r.action}</Badge></td>
                        <td className="py-2 pr-4 capitalize">{r.entity_type}</td>
                        <td className="py-2 pr-4">{r.entity_name ?? "—"}</td>
                        <td className="py-2 max-w-md">
                          <code className="text-xs text-muted-foreground truncate block">
                            {r.details && Object.keys(r.details).length > 0 ? JSON.stringify(r.details) : "—"}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
