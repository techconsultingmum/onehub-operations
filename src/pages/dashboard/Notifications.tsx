import { useDocumentTitle } from "@/hooks/useDocumentTitle";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/ui/data-state";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Info,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Users,
  ListTodo,
  Clock,
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
  info: <Info className="h-4 w-4 text-info" aria-hidden="true" />,
  success: <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />,
  error: <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />,
  task: <ListTodo className="h-4 w-4 text-primary" aria-hidden="true" />,
  team: <Users className="h-4 w-4 text-accent-foreground" aria-hidden="true" />,
};

const actionLabels: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  completed: "Completed",
  assigned: "Assigned",
};

const defaultPrefs: NotificationPreferences = {
  email_notifications: true,
  push_notifications: true,
  task_updates: true,
  team_updates: true,
  weekly_digest: false,
};

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function Notifications() {
  useDocumentTitle("Notifications");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const notifKey = ["notifications", user?.id];
  const activityKey = ["activity-feed", user?.id];
  const prefsKey = ["notification-prefs", user?.id];

  const notificationsQuery = useQuery({
    queryKey: notifKey,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Notification[];
    },
  });

  const activityQuery = useQuery({
    queryKey: activityKey,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_feed")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as ActivityItem[];
    },
  });

  const prefsQuery = useQuery({
    queryKey: prefsKey,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as NotificationPreferences;
      await supabase
        .from("notification_preferences")
        .insert({ user_id: user!.id, ...defaultPrefs });
      return defaultPrefs;
    },
  });

  const notifications = notificationsQuery.data ?? [];
  const activities = activityQuery.data ?? [];
  const preferences = prefsQuery.data;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notifKey });
      const previous = queryClient.getQueryData<Notification[]>(notifKey);
      queryClient.setQueryData<Notification[]>(notifKey, (old) =>
        (old ?? []).map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(notifKey, ctx.previous);
      toast({ title: "Error", description: "Failed to mark as read.", variant: "destructive" });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user!.id)
        .eq("read", false);
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notifKey });
      const previous = queryClient.getQueryData<Notification[]>(notifKey);
      queryClient.setQueryData<Notification[]>(notifKey, (old) =>
        (old ?? []).map((n) => ({ ...n, read: true }))
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(notifKey, ctx.previous);
      toast({ title: "Error", description: "Failed to mark all as read.", variant: "destructive" });
    },
    onSuccess: () =>
      toast({ title: "All Marked as Read", description: "All notifications have been marked as read." }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notifKey });
      const previous = queryClient.getQueryData<Notification[]>(notifKey);
      queryClient.setQueryData<Notification[]>(notifKey, (old) =>
        (old ?? []).filter((n) => n.id !== id)
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(notifKey, ctx.previous);
      toast({ title: "Error", description: "Failed to delete notification.", variant: "destructive" });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").delete().eq("user_id", user!.id);
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notifKey });
      const previous = queryClient.getQueryData<Notification[]>(notifKey);
      queryClient.setQueryData<Notification[]>(notifKey, []);
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(notifKey, ctx.previous);
      toast({ title: "Error", description: "Failed to clear notifications.", variant: "destructive" });
    },
    onSuccess: () =>
      toast({ title: "Notifications Cleared", description: "All notifications have been deleted." }),
  });

  const prefMutation = useMutation({
    mutationFn: async ({ key, value }: { key: keyof NotificationPreferences; value: boolean }) => {
      const { error } = await supabase
        .from("notification_preferences")
        .update({ [key]: value })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: prefsKey });
      const previous = queryClient.getQueryData<NotificationPreferences>(prefsKey);
      queryClient.setQueryData<NotificationPreferences>(prefsKey, (old) =>
        old ? { ...old, [key]: value } : old
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(prefsKey, ctx.previous);
      toast({ title: "Error", description: "Failed to update preferences.", variant: "destructive" });
    },
  });

  const isLoading =
    notificationsQuery.isLoading || activityQuery.isLoading || prefsQuery.isLoading;
  const isError = notificationsQuery.isError || activityQuery.isError || prefsQuery.isError;

  return (
    <div>
      <DashboardHeader
        title="Notifications"
        subtitle="View and manage your notifications and activity"
      />

      <div className="p-6">
        {isLoading ? (
          <CardGridSkeleton count={4} />
        ) : isError ? (
          <ErrorState
            onRetry={() => {
              notificationsQuery.refetch();
              activityQuery.refetch();
              prefsQuery.refetch();
            }}
          />
        ) : (
          <Tabs defaultValue="notifications" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="notifications" className="gap-2">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge
                      variant="default"
                      className="ml-1 px-1.5 py-0.5 text-xs"
                      aria-label={`${unreadCount} unread`}
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-2">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Activity Feed
                </TabsTrigger>
                <TabsTrigger value="preferences" className="gap-2">
                  <BellOff className="h-4 w-4" aria-hidden="true" />
                  Preferences
                </TabsTrigger>
              </TabsList>

              {notifications.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending || unreadCount === 0}
                    className="gap-2"
                  >
                    <CheckCheck className="h-4 w-4" aria-hidden="true" />
                    Mark All Read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearAllMutation.mutate()}
                    disabled={clearAllMutation.isPending}
                    className="gap-2 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Clear All
                  </Button>
                </div>
              )}
            </div>

            <TabsContent value="notifications" className="space-y-4">
              {notifications.length === 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <EmptyState
                      icon={<Bell className="w-7 h-7" aria-hidden="true" />}
                      title="No Notifications"
                      description="You're all caught up! New notifications will appear here."
                    />
                  </CardContent>
                </Card>
              ) : (
                <ul className="space-y-2" aria-live="polite">
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <Card
                        className={`transition-colors ${
                          !notification.read ? "bg-primary/5 border-primary/20" : ""
                        }`}
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
                                  onClick={() => markAsReadMutation.mutate(notification.id)}
                                  aria-label={`Mark "${notification.title}" as read`}
                                >
                                  <Check className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMutation.mutate(notification.id)}
                                className="text-destructive hover:text-destructive"
                                aria-label={`Delete "${notification.title}"`}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              {activities.length === 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <EmptyState
                      icon={<Clock className="w-7 h-7" aria-hidden="true" />}
                      title="No Activity Yet"
                      description="Your activity history will appear here."
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <ul className="divide-y divide-border">
                      {activities.map((activity) => (
                        <li key={activity.id} className="p-4 flex items-center gap-4">
                          <div
                            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                            aria-hidden="true"
                          >
                            {activity.entity_type === "task" && <ListTodo className="h-4 w-4" />}
                            {activity.entity_type === "team_member" && <Users className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">
                                {actionLabels[activity.action] || activity.action}
                              </span>{" "}
                              <span className="text-muted-foreground">
                                {activity.entity_type.replace("_", " ")}
                              </span>
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
                        </li>
                      ))}
                    </ul>
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
                      {(
                        [
                          {
                            key: "email_notifications" as const,
                            label: "Email Notifications",
                            desc: "Receive email updates about your tasks and team",
                          },
                          {
                            key: "push_notifications" as const,
                            label: "Push Notifications",
                            desc: "Get notified about important updates in your browser",
                          },
                          {
                            key: "task_updates" as const,
                            label: "Task Updates",
                            desc: "Notify when tasks are created, updated, or completed",
                          },
                          {
                            key: "team_updates" as const,
                            label: "Team Updates",
                            desc: "Notify when team members are added or modified",
                          },
                          {
                            key: "weekly_digest" as const,
                            label: "Weekly Digest",
                            desc: "Receive a weekly summary of your progress",
                          },
                        ] as const
                      ).map((p, idx, arr) => (
                        <div key={p.key}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <Label htmlFor={`pref-${p.key}`} className="font-medium">
                                {p.label}
                              </Label>
                              <p className="text-sm text-muted-foreground">{p.desc}</p>
                            </div>
                            <Switch
                              id={`pref-${p.key}`}
                              checked={preferences[p.key]}
                              onCheckedChange={(v) => prefMutation.mutate({ key: p.key, value: v })}
                              disabled={prefMutation.isPending}
                              aria-label={p.label}
                            />
                          </div>
                          {idx < arr.length - 1 && <Separator className="mt-6" />}
                        </div>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
