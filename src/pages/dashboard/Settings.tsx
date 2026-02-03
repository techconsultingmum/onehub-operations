import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, X, Building2, Settings2, Save } from "lucide-react";
import { 
  industries, 
  managementTypes,
  getManagementTypesForIndustry,
  getIndustryLabel,
  getManagementTypeLabel 
} from "@/lib/industry-config";

export default function SettingsPage() {
  const { user, configuration, updateAdditionalManagementTypes } = useAuth();
  const { toast } = useToast();
  
  const [additionalTypes, setAdditionalTypes] = useState<string[]>(
    configuration?.additional_management_types || []
  );
  const [showAdditional, setShowAdditional] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_notifications: true,
    push_notifications: true,
    weekly_digest: false,
  });

  useEffect(() => {
    if (configuration?.additional_management_types) {
      setAdditionalTypes(configuration.additional_management_types);
    }
    fetchNotificationPrefs();
    
    // Initialize profile name from user metadata
    const displayName = user?.user_metadata?.full_name || "";
    const parts = displayName.split(" ");
    if (parts.length > 1) {
      setProfileFirstName(parts[0]);
      setProfileLastName(parts.slice(1).join(" "));
    } else {
      setProfileFirstName(displayName);
      setProfileLastName("");
    }
  }, [configuration, user]);

  const fetchNotificationPrefs = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("notification_preferences")
      .select("email_notifications, push_notifications, weekly_digest")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setNotificationPrefs(data);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSavingProfile(true);
    const fullName = `${profileFirstName.trim()} ${profileLastName.trim()}`.trim();
    
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    });

    // Also update the profiles table
    if (!error) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", user.id);
    }

    setIsSavingProfile(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    }
  };

  const handleAdditionalTypeToggle = (type: string) => {
    if (type === configuration?.management_type) return;
    
    setAdditionalTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const removeAdditionalType = (type: string) => {
    setAdditionalTypes(prev => prev.filter(t => t !== type));
  };

  const saveManagementTypes = async () => {
    setIsSaving(true);
    const { error } = await updateAdditionalManagementTypes(additionalTypes);
    setIsSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update management types.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saved",
        description: "Your management types have been updated.",
      });
      setShowAdditional(false);
    }
  };

  const updateNotificationPref = async (key: string, value: boolean) => {
    if (!user) return;

    setNotificationPrefs(prev => ({ ...prev, [key]: value }));

    const { error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: user.id,
        ...notificationPrefs,
        [key]: value,
      }, {
        onConflict: "user_id",
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preferences.",
        variant: "destructive",
      });
      setNotificationPrefs(prev => ({ ...prev, [key]: !value }));
    }
  };

  const initials = `${profileFirstName.slice(0, 1)}${profileLastName.slice(0, 1)}`.toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || "U";

  const currentIndustry = industries.find(i => i.value === configuration?.industry);
  const currentPrimaryType = managementTypes.find(t => t.value === configuration?.management_type);
  
  // Filter management types to only those valid for the user's industry
  const industryManagementTypes = configuration?.industry 
    ? getManagementTypesForIndustry(configuration.industry)
    : managementTypes;
    
  const availableAdditionalTypes = industryManagementTypes.filter(
    t => t.value !== configuration?.management_type && !additionalTypes.includes(t.value)
  );

  const hasProfileChanges = (() => {
    const displayName = user?.user_metadata?.full_name || "";
    const parts = displayName.split(" ");
    const originalFirst = parts.length > 1 ? parts[0] : displayName;
    const originalLast = parts.length > 1 ? parts.slice(1).join(" ") : "";
    return profileFirstName !== originalFirst || profileLastName !== originalLast;
  })();

  return (
    <div>
      <DashboardHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <div className="p-6 max-w-3xl space-y-6">
        {/* Profile Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Profile</h3>
            {hasProfileChanges && (
              <Button 
                size="sm" 
                onClick={handleSaveProfile} 
                disabled={isSavingProfile}
                className="gap-2"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{initials}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  value={profileFirstName}
                  onChange={(e) => setProfileFirstName(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={profileLastName}
                  onChange={(e) => setProfileLastName(e.target.value)}
                  maxLength={50}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user?.email || ""} disabled />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
          </div>
        </div>

        {/* Industry & Management Configuration */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Industry & Management
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Industry</p>
                <p className="text-sm text-muted-foreground">
                  {currentIndustry?.label || "Not set"}
                </p>
              </div>
              <Badge variant="secondary">{currentIndustry?.label}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Primary Management Type</p>
                <p className="text-sm text-muted-foreground">
                  {currentPrimaryType?.label || "Not set"}
                </p>
              </div>
              <Badge>{currentPrimaryType?.label}</Badge>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    Additional Management Types
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add more management modules to your dashboard
                  </p>
                </div>
                {!showAdditional && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdditional(true)}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add More
                  </Button>
                )}
              </div>

              {/* Current Additional Types */}
              {additionalTypes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {additionalTypes.map(type => {
                    const typeInfo = managementTypes.find(t => t.value === type);
                    return (
                      <Badge 
                        key={type} 
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {typeInfo?.label}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 hover:bg-transparent"
                          onClick={() => removeAdditionalType(type)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Additional Types Selection */}
              {showAdditional && (
                <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Select additional types</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {availableAdditionalTypes.map(type => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`add-${type.value}`}
                          checked={additionalTypes.includes(type.value)}
                          onCheckedChange={() => handleAdditionalTypeToggle(type.value)}
                        />
                        <label
                          htmlFor={`add-${type.value}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={saveManagementTypes} 
                      disabled={isSaving}
                      size="sm"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowAdditional(false);
                        setAdditionalTypes(configuration?.additional_management_types || []);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about your tasks
                </p>
              </div>
              <Switch 
                checked={notificationPrefs.email_notifications}
                onCheckedChange={(v) => updateNotificationPref("email_notifications", v)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about important updates
                </p>
              </div>
              <Switch 
                checked={notificationPrefs.push_notifications}
                onCheckedChange={(v) => updateNotificationPref("push_notifications", v)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Digest</p>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly summary of your progress
                </p>
              </div>
              <Switch 
                checked={notificationPrefs.weekly_digest}
                onCheckedChange={(v) => updateNotificationPref("weekly_digest", v)}
              />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-card border border-destructive/20 rounded-xl p-6">
          <h3 className="font-semibold text-destructive mb-4">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button 
              variant="destructive"
              onClick={() => setDeleteAccountConfirm(true)}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation */}
      <ConfirmDialog
        open={deleteAccountConfirm}
        onOpenChange={setDeleteAccountConfirm}
        title="Delete Account"
        description="Are you absolutely sure you want to delete your account? This action is permanent and will delete all your data including tasks, team members, and settings. This cannot be undone."
        confirmLabel="Delete My Account"
        onConfirm={() => {
          toast({
            title: "Account Deletion",
            description: "Please contact support to delete your account.",
          });
          setDeleteAccountConfirm(false);
        }}
        variant="destructive"
      />
    </div>
  );
}