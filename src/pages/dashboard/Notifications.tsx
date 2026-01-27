import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Bell, 
  BellOff,
  Check, 
  CheckCheck,
  Trash2, 
  Loader2,
  Info,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Users,
  ListTodo,
  Clock
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_name: string | null;
  created_at: string;
}

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  task_updates: boolean;
  team_updates: boolean;
  weekly_digest: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
  task: <ListTodo className="h-4 w-4 text-primary" />,
  team: <Users className="h-4 w-4 text-purple-500" />,
};

const actionLabels: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  completed: "Completed",
  assigned: "Assigned",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [notifResult, activityResult, prefResult] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("activity_feed")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    setNotifications(notifResult.data || []);
    setActivities(activityResult.data || []);
    
    if (prefResult.data) {
      setPreferences(prefResult.data);
    } else {
      // Create default preferences
      const defaultPrefs: NotificationPreferences = {
        email_notifications: true,
        push_notifications: true,
        task_updates: true,
        team_updates: true,
        weekly_digest: false,
      };
      setPreferences(defaultPrefs);
      await supabase.from("notification_preferences").insert({
        user_id: user.id,
        ...defaultPrefs,
      });
    }
    
    setIsLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    toast({
      title: "All Marked as Read",
      description: "All notifications have been marked as read.",
    });
  };

  const deleteNotification = async (id: string) => {
    await supabase
      .from("notifications")
      .delete()
      .eq("id", id);
    
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    
    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);
    
    setNotifications([]);
    
    toast({
      title: "Notifications Cleared",
      description: "All notifications have been deleted.",
    });
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user || !preferences) return;
    
    setIsSavingPrefs(true);
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);

    const { error } = await supabase
      .from("notification_preferences")
      .update({ [key]: value })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences.",
        variant: "destructive",
      });
      setPreferences(prev => prev ? { ...prev, [key]: !value } : null);
    }
    
    setIsSavingPrefs(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
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
        title="Notifications"
        subtitle="View and manage your notifications and activity"
      />

      <div className="p-6">
        <Tabs defaultValue="notifications" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="default" className="ml-1 px-1.5 py-0.5 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <Clock className="h-4 w-4" />
                Activity Feed
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <BellOff className="h-4 w-4" />
                Preferences
              </TabsTrigger>
            </TabsList>
            
            {notifications.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2">
                  <CheckCheck className="h-4 w-4" />
                  Mark All Read
                </Button>
                <Button variant="outline" size="sm" onClick={clearAllNotifications} className="gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="notifications" className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                  <p className="text-muted-foreground text-center">
                    You're all caught up! New notifications will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {notifications.map(notification => (
                  <Card 
                    key={notification.id} 
                    className={`transition-colors ${!notification.read ? "bg-primary/5 border-primary/20" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {typeIcons[notification.type] || typeIcons.info}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium">{notification.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsRead(notification.id)}
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-destructive hover:text-destructive"
                            title="Delete"
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
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            {activities.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
                  <p className="text-muted-foreground text-center">
                    Your activity history will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {activities.map(activity => (
                      <div key={activity.id} className="p-4 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {activity.entity_type === "task" && <ListTodo className="h-4 w-4" />}
                          {activity.entity_type === "team_member" && <Users className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{actionLabels[activity.action] || activity.action}</span>
                            {" "}
                            <span className="text-muted-foreground">{activity.entity_type.replace("_", " ")}</span>
                            {activity.entity_name && (
                              <>
                                {": "}
                                <span className="font-medium">{activity.entity_name}</span>
                              </>
                            )}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {preferences && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email updates about your tasks and team
                        </p>
                      </div>
                      <Switch
                        checked={preferences.email_notifications}
                        onCheckedChange={(v) => updatePreference("email_notifications", v)}
                        disabled={isSavingPrefs}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about important updates in your browser
                        </p>
                      </div>
                      <Switch
                        checked={preferences.push_notifications}
                        onCheckedChange={(v) => updatePreference("push_notifications", v)}
                        disabled={isSavingPrefs}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Task Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when tasks are created, updated, or completed
                        </p>
                      </div>
                      <Switch
                        checked={preferences.task_updates}
                        onCheckedChange={(v) => updatePreference("task_updates", v)}
                        disabled={isSavingPrefs}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Team Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when team members are added or modified
                        </p>
                      </div>
                      <Switch
                        checked={preferences.team_updates}
                        onCheckedChange={(v) => updatePreference("team_updates", v)}
                        disabled={isSavingPrefs}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Weekly Digest</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive a weekly summary of your progress
                        </p>
                      </div>
                      <Switch
                        checked={preferences.weekly_digest}
                        onCheckedChange={(v) => updatePreference("weekly_digest", v)}
                        disabled={isSavingPrefs}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}