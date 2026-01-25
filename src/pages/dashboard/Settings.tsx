import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div>
      <DashboardHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <div className="p-6 max-w-3xl">
        {/* Profile Section */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Profile</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">JD</span>
              </div>
              <Button variant="outline">Change Avatar</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john.doe@managex.io" />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about your tasks
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about important updates
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Digest</p>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly summary of your progress
                </p>
              </div>
              <Switch />
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
            <Button variant="destructive">Delete Account</Button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
