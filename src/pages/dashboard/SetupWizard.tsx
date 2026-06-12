import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { industries, getManagementTypesForIndustry } from "@/lib/industry-config";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, X, Building2, Users, Sparkles } from "lucide-react";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  role: z.enum(["admin", "manager", "staff", "viewer"]),
});

type Invite = z.infer<typeof inviteSchema>;

const STORAGE_KEY = "managex_setup_wizard_state";

interface WizardState {
  step: number;
  workspaceName: string;
  workspaceSlug: string;
  invites: Invite[];
  industry: string;
  managementType: string;
}

const initialState: WizardState = {
  step: 1,
  workspaceName: "",
  workspaceSlug: "",
  invites: [],
  industry: "",
  managementType: "",
};

function loadState(): WizardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialState, ...JSON.parse(raw) };
  } catch { /* noop */ }
  return initialState;
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

export default function SetupWizard() {
  useDocumentTitle("Setup Wizard");
  const navigate = useNavigate();
  const { user, saveConfiguration } = useAuth();
  const { toast } = useToast();

  const [state, setState] = useState<WizardState>(loadState);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Invite["role"]>("staff");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (patch: Partial<WizardState>) => {
    setState((s) => {
      const next = { ...s, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const progress = (state.step / 3) * 100;
  const availableTypes = state.industry ? getManagementTypesForIndustry(state.industry) : [];

  const canContinue = () => {
    if (state.step === 1) return state.workspaceName.trim().length >= 2;
    if (state.step === 2) return true; // invites optional
    if (state.step === 3) return state.industry && state.managementType;
    return false;
  };

  const addInvite = () => {
    const parsed = inviteSchema.safeParse({ email: inviteEmail, role: inviteRole });
    if (!parsed.success) {
      setInviteError(parsed.error.errors[0].message);
      return;
    }
    if (state.invites.some((i) => i.email.toLowerCase() === parsed.data.email.toLowerCase())) {
      setInviteError("This email is already invited");
      return;
    }
    if (state.invites.length >= 25) {
      setInviteError("Maximum 25 invites at a time");
      return;
    }
    update({ invites: [...state.invites, parsed.data] });
    setInviteEmail("");
    setInviteError(null);
  };

  const removeInvite = (email: string) =>
    update({ invites: state.invites.filter((i) => i.email !== email) });

  const finish = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Save industry/management config
      const { error: cfgErr } = await saveConfiguration(state.industry, state.managementType);
      if (cfgErr) throw cfgErr;

      // Save workspace name to profile
      await supabase.from("profiles").update({ full_name: state.workspaceName.trim() ? undefined : undefined }).eq("user_id", user.id);

      // Insert team members
      if (state.invites.length > 0) {
        const rows = state.invites.map((i) => ({
          user_id: user.id,
          email: i.email,
          name: i.email.split("@")[0],
          role: i.role,
          department: null,
          status: "invited",
        }));
        const { error: tmErr } = await supabase.from("team_members").insert(rows);
        if (tmErr) throw tmErr;
      }

      // Log activity
      await supabase.from("activity_feed").insert({
        user_id: user.id,
        action: "setup_completed",
        entity_type: "workspace",
        entity_name: state.workspaceName,
        details: {
          industry: state.industry,
          management_type: state.managementType,
          invites: state.invites.length,
        },
      });

      localStorage.removeItem(STORAGE_KEY);
      toast({ title: "Setup complete!", description: "Your workspace is ready." });
      navigate("/dashboard");
    } catch (e) {
      toast({
        title: "Setup failed",
        description: e instanceof Error ? e.message : "Could not complete setup.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <DashboardHeader title="Setup Wizard" subtitle="Get your workspace ready in three steps" />
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {state.step} of 3</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} aria-label="Setup progress" />
        </div>

        {state.step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Create your workspace
              </CardTitle>
              <CardDescription>Name your workspace and pick a URL slug.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ws-name">Workspace name</Label>
                <Input
                  id="ws-name"
                  value={state.workspaceName}
                  onChange={(e) => update({ workspaceName: e.target.value, workspaceSlug: slugify(e.target.value) })}
                  placeholder="Acme Inc."
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-slug">URL slug</Label>
                <Input
                  id="ws-slug"
                  value={state.workspaceSlug}
                  onChange={(e) => update({ workspaceSlug: slugify(e.target.value) })}
                  placeholder="acme"
                />
                <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, and hyphens.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {state.step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Invite your team
              </CardTitle>
              <CardDescription>Add teammates by email. You can skip and invite later.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                  placeholder="teammate@example.com"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInvite())}
                  aria-invalid={!!inviteError}
                />
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Invite["role"])}>
                  <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addInvite} className="gap-2"><Plus className="h-4 w-4" />Add</Button>
              </div>
              {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}

              {state.invites.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                  No invites yet. You can skip this step.
                </p>
              ) : (
                <ul className="space-y-2">
                  {state.invites.map((i) => (
                    <li key={i.email} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-medium truncate">{i.email}</span>
                        <Badge variant="outline" className="capitalize">{i.role}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeInvite(i.email)} aria-label={`Remove ${i.email}`}>
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {state.step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Pick an industry template
              </CardTitle>
              <CardDescription>We'll tailor your dashboard to match.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Industry</Label>
                <Select value={state.industry} onValueChange={(v) => update({ industry: v, managementType: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select your industry" /></SelectTrigger>
                  <SelectContent className="bg-background border-border max-h-72">
                    {industries.map((i) => (
                      <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {state.industry && (
                <div className="space-y-2">
                  <Label>Primary focus</Label>
                  <Select value={state.managementType} onValueChange={(v) => update({ managementType: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose a focus area" /></SelectTrigger>
                    <SelectContent className="bg-background border-border max-h-72">
                      {availableTypes.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            disabled={state.step === 1 || submitting}
            onClick={() => update({ step: state.step - 1 })}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {state.step < 3 ? (
            <Button onClick={() => update({ step: state.step + 1 })} disabled={!canContinue()} className="gap-2">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={!canContinue() || submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Finish setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
