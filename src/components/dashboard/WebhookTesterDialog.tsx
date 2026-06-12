import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

interface WebhookInfo {
  id: string;
  name: string;
  url: string;
}

interface TestResult {
  attempt: number;
  status: number | null;
  ok: boolean;
  latency_ms: number;
  response_body: string;
  error?: string;
}

const sampleEvents: Record<string, Record<string, unknown>> = {
  "task.created": {
    event: "task.created",
    data: { id: "tsk_demo", title: "Sample task", status: "open", priority: "medium" },
  },
  "task.updated": {
    event: "task.updated",
    data: { id: "tsk_demo", changes: { status: "in_progress" } },
  },
  "complaint.created": {
    event: "complaint.created",
    data: { id: "cmp_demo", title: "Leaking tap", priority: "high", status: "open" },
  },
  custom: { event: "custom.test", data: { hello: "world" } },
};

interface Props {
  webhook: WebhookInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookTesterDialog({ webhook, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [eventKey, setEventKey] = useState("task.created");
  const [payload, setPayload] = useState<string>(JSON.stringify(sampleEvents["task.created"], null, 2));
  const [payloadError, setPayloadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const onEventChange = (key: string) => {
    setEventKey(key);
    setPayload(JSON.stringify(sampleEvents[key], null, 2));
    setPayloadError(null);
  };

  const validate = (): unknown | null => {
    try {
      const parsed = JSON.parse(payload);
      setPayloadError(null);
      return parsed;
    } catch (e) {
      setPayloadError(e instanceof Error ? e.message : "Invalid JSON");
      return null;
    }
  };

  const sendOnce = async (attempt: number): Promise<TestResult> => {
    const start = performance.now();
    const body = validate();
    if (!webhook || body == null) {
      return { attempt, status: null, ok: false, latency_ms: 0, response_body: "", error: "Invalid payload" };
    }
    try {
      const { data, error } = await supabase.functions.invoke("webhook-test", {
        body: { webhook_id: webhook.id, payload: body },
      });
      const latency = Math.round(performance.now() - start);
      if (error) {
        return { attempt, status: null, ok: false, latency_ms: latency, response_body: "", error: error.message };
      }
      const res = data as { status?: number; ok?: boolean; body?: string; error?: string };
      return {
        attempt,
        status: res.status ?? null,
        ok: !!res.ok,
        latency_ms: latency,
        response_body: (res.body ?? "").slice(0, 1000),
        error: res.error,
      };
    } catch (e) {
      return {
        attempt,
        status: null,
        ok: false,
        latency_ms: Math.round(performance.now() - start),
        response_body: "",
        error: e instanceof Error ? e.message : "Network error",
      };
    }
  };

  const handleSend = async () => {
    if (!validate()) return;
    setSending(true);
    setResults([]);
    const first = await sendOnce(1);
    setResults([first]);
    setSending(false);
    if (!first.ok) {
      toast({ title: "Delivery failed", description: first.error ?? `Status ${first.status}`, variant: "destructive" });
    } else {
      toast({ title: "Delivered", description: `Status ${first.status} in ${first.latency_ms}ms` });
    }
  };

  const handleRetry = async () => {
    if (sending) return;
    const next = results.length + 1;
    if (next > 4) return;
    setSending(true);
    const delay = Math.pow(2, next - 1) * 250;
    await new Promise((r) => setTimeout(r, delay));
    const res = await sendOnce(next);
    setResults((prev) => [...prev, res]);
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setResults([]); } }}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test webhook: {webhook?.name}</DialogTitle>
          <DialogDescription className="truncate">{webhook?.url}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Sample event</Label>
            <Select value={eventKey} onValueChange={onEventChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="task.created">task.created</SelectItem>
                <SelectItem value="task.updated">task.updated</SelectItem>
                <SelectItem value="complaint.created">complaint.created</SelectItem>
                <SelectItem value="custom">custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payload">Payload (JSON)</Label>
            <Textarea
              id="payload"
              value={payload}
              onChange={(e) => { setPayload(e.target.value); setPayloadError(null); }}
              rows={10}
              className="font-mono text-xs"
              aria-invalid={!!payloadError}
            />
            {payloadError && <p className="text-sm text-destructive">{payloadError}</p>}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSend} disabled={sending} className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send test
            </Button>
            {results.length > 0 && (
              <Button variant="outline" onClick={handleRetry} disabled={sending || results.length >= 4} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Retry ({results.length}/3)
              </Button>
            )}
          </div>

          {results.length > 0 && (
            <div className="space-y-2">
              <Label>Delivery results</Label>
              <div className="space-y-2">
                {results.map((r) => (
                  <Alert key={r.attempt} className={r.ok ? "border-success/50" : "border-destructive/50"}>
                    <div className="flex items-start gap-3">
                      {r.ok
                        ? <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        : <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />}
                      <AlertDescription className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">Attempt {r.attempt}</Badge>
                          <Badge variant={r.ok ? "secondary" : "destructive"}>
                            {r.status ? `HTTP ${r.status}` : "No response"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{r.latency_ms}ms</span>
                        </div>
                        {r.error && <p className="text-xs text-destructive">{r.error}</p>}
                        {r.response_body && (
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto max-h-40">
                            {r.response_body}
                          </pre>
                        )}
                      </AlertDescription>
                    </div>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
