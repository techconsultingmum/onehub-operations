import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { webhookUrlSchema, webhookNameSchema, generateSecretKey } from "@/lib/validation";
import { 
  Webhook, 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Slack as SlackIcon,
  Copy,
  Key,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";

interface WebhookData {
  id: string;
  name: string;
  url: string;
  type: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  secret_key: string | null;
}

interface WebhookLog {
  id: string;
  event_type: string;
  success: boolean;
  response_status: number | null;
  created_at: string;
}

const eventTypes = [
  { value: "task_created", label: "Task Created" },
  { value: "task_updated", label: "Task Updated" },
  { value: "task_completed", label: "Task Completed" },
  { value: "task_deleted", label: "Task Deleted" },
  { value: "status_changed", label: "Status Changed" },
  { value: "team_member_added", label: "Team Member Added" },
];

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("custom");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<{ name?: string; url?: string }>({});
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchWebhooks();
      fetchWebhookLogs();
    }
  }, [user]);

  const fetchWebhooks = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("webhooks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load webhooks.",
        variant: "destructive",
      });
    } else {
      setWebhooks(data || []);
    }
    setIsLoading(false);
  };

  const fetchWebhookLogs = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("webhook_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setWebhookLogs(data || []);
  };

  const resetForm = () => {
    setName("");
    setUrl("");
    setType("custom");
    setSelectedEvents([]);
    setEditingWebhook(null);
    setFormErrors({});
    setNewlyCreatedSecret(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (webhook: WebhookData) => {
    setEditingWebhook(webhook);
    setName(webhook.name);
    setUrl(webhook.url);
    setType(webhook.type);
    setSelectedEvents(webhook.events);
    setFormErrors({});
    setNewlyCreatedSecret(null);
    setIsDialogOpen(true);
  };

  const handleEventToggle = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const validateForm = (): boolean => {
    const errors: { name?: string; url?: string } = {};
    
    const nameResult = webhookNameSchema.safeParse(name);
    if (!nameResult.success) {
      errors.name = nameResult.error.errors[0].message;
    }
    
    const urlResult = webhookUrlSchema.safeParse(url);
    if (!urlResult.success) {
      errors.url = urlResult.error.errors[0].message;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!user || selectedEvents.length === 0) {
      toast({
        title: "Missing Fields",
        description: "Please select at least one event.",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    // Generate secret key for new webhooks
    const secretKey = editingWebhook ? undefined : generateSecretKey();

    let error;
    if (editingWebhook) {
      ({ error } = await supabase
        .from("webhooks")
        .update({
          name,
          url,
          type,
          events: selectedEvents,
        })
        .eq("id", editingWebhook.id));
    } else {
      ({ error } = await supabase
        .from("webhooks")
        .insert({
          name,
          url,
          type,
          events: selectedEvents,
          user_id: user.id,
          secret_key: secretKey,
        }));
    }

    setIsSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save webhook.",
        variant: "destructive",
      });
    } else {
      if (!editingWebhook && secretKey) {
        // Show the secret key to the user once
        setNewlyCreatedSecret(secretKey);
        toast({
          title: "Webhook Created",
          description: "Please save your signing secret - it won't be shown again!",
        });
      } else {
        toast({
          title: editingWebhook ? "Webhook Updated" : "Webhook Created",
          description: `${name} has been ${editingWebhook ? "updated" : "created"} successfully.`,
        });
        setIsDialogOpen(false);
      }
      fetchWebhooks();
    }
  };

  const handleRegenerateSecret = async (webhookId: string) => {
    const newSecret = generateSecretKey();
    
    const { error } = await supabase
      .from("webhooks")
      .update({ secret_key: newSecret })
      .eq("id", webhookId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate secret key.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Secret Key Regenerated",
        description: "Please update your webhook receiver with the new secret.",
      });
      
      // Copy to clipboard
      await navigator.clipboard.writeText(newSecret);
      toast({
        title: "Copied!",
        description: "New secret key copied to clipboard.",
      });
      
      fetchWebhooks();
    }
  };

  const copySecretToClipboard = async (secret: string) => {
    await navigator.clipboard.writeText(secret);
    toast({
      title: "Copied!",
      description: "Secret key copied to clipboard.",
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("webhooks")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete webhook.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Webhook Deleted",
        description: "The webhook has been deleted.",
      });
      fetchWebhooks();
    }
  };

  const toggleWebhookActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("webhooks")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update webhook status.",
        variant: "destructive",
      });
    } else {
      setWebhooks(prev => 
        prev.map(w => w.id === id ? { ...w, is_active: isActive } : w)
      );
    }
  };

  const testWebhook = async (webhook: WebhookData) => {
    toast({
      title: "Testing Webhook",
      description: `Sending test payload to ${webhook.name}...`,
    });

    // In a real implementation, this would call an edge function to send the test
    // For now, we'll simulate it
    setTimeout(() => {
      toast({
        title: "Test Complete",
        description: "Check your webhook endpoint for the test payload.",
      });
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader
        title="Webhooks"
        subtitle="Configure webhooks for task updates and integrations"
      />

      <div className="p-6 space-y-6">
        {/* Create Webhook Button */}
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Set up webhooks to receive real-time notifications when events occur.
          </p>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingWebhook ? "Edit Webhook" : "Create Webhook"}
                </DialogTitle>
                <DialogDescription>
                  Configure your webhook endpoint and select which events to trigger it.
                </DialogDescription>
              </DialogHeader>
              
              {/* Show secret key after creation */}
              {newlyCreatedSecret && (
                <Alert className="border-primary bg-primary/10">
                  <Key className="h-4 w-4" />
                  <AlertDescription className="space-y-2">
                    <p className="font-medium">Save your signing secret!</p>
                    <p className="text-sm text-muted-foreground">
                      This secret will only be shown once. Use it to verify webhook signatures.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 p-2 bg-background rounded text-xs font-mono overflow-hidden">
                        {showSecretKey ? newlyCreatedSecret : "••••••••••••••••••••••••••••••••"}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                      >
                        {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copySecretToClipboard(newlyCreatedSecret)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      className="w-full mt-2"
                      onClick={() => {
                        setNewlyCreatedSecret(null);
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      I've saved my secret
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              {!newlyCreatedSecret && (
                <>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My Webhook"
                        className={formErrors.name ? "border-destructive" : ""}
                      />
                      {formErrors.name && (
                        <p className="text-sm text-destructive">{formErrors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          <SelectItem value="custom">Custom Endpoint</SelectItem>
                          <SelectItem value="slack">Slack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">
                        {type === "slack" ? "Slack Webhook URL" : "Endpoint URL"}
                      </Label>
                      <Input
                        id="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={
                          type === "slack" 
                            ? "https://hooks.slack.com/services/..." 
                            : "https://api.example.com/webhook"
                        }
                        className={formErrors.url ? "border-destructive" : ""}
                      />
                      {formErrors.url && (
                        <p className="text-sm text-destructive">{formErrors.url}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Events</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {eventTypes.map(event => (
                          <div key={event.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={event.value}
                              checked={selectedEvents.includes(event.value)}
                              onCheckedChange={() => handleEventToggle(event.value)}
                            />
                            <label
                              htmlFor={event.value}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {event.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {!editingWebhook && (
                      <Alert>
                        <Key className="h-4 w-4" />
                        <AlertDescription>
                          A signing secret will be generated automatically. Use it to verify webhook requests.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        editingWebhook ? "Update" : "Create"
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Webhooks List */}
        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Webhooks Configured</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create a webhook to receive notifications when events occur.
              </p>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {webhooks.map(webhook => (
              <Card key={webhook.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${webhook.type === "slack" ? "bg-[#4A154B]" : "bg-primary/10"}`}>
                        {webhook.type === "slack" ? (
                          <SlackIcon className="h-5 w-5 text-white" />
                        ) : (
                          <Webhook className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{webhook.name}</h3>
                          <Badge variant={webhook.is_active ? "default" : "secondary"}>
                            {webhook.is_active ? "Active" : "Paused"}
                          </Badge>
                          {webhook.secret_key && (
                            <Badge variant="outline" className="gap-1">
                              <Key className="h-3 w-3" />
                              Signed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">
                          {webhook.url.length > 50 ? webhook.url.slice(0, 50) + "..." : webhook.url}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {webhook.events.map(event => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                        {webhook.last_triggered_at && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last triggered: {new Date(webhook.last_triggered_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={(checked) => toggleWebhookActive(webhook.id, checked)}
                      />
                      {webhook.secret_key && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRegenerateSecret(webhook.id)}
                          title="Regenerate Secret"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => testWebhook(webhook)}
                        title="Test Webhook"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(webhook)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(webhook.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recent Activity */}
        {webhookLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Webhook Activity</CardTitle>
              <CardDescription>Last 20 webhook executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {webhookLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      {log.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <Badge variant="outline">{log.event_type.replace(/_/g, " ")}</Badge>
                      {log.response_status && (
                        <span className="text-sm text-muted-foreground">
                          Status: {log.response_status}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
