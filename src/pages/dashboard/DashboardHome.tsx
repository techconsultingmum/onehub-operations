import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIndustryLabel, getManagementTypeLabel } from "@/lib/industry-config";
import { getWidgetsForManagementTypes, type DashboardWidget } from "@/lib/dashboard-widgets";
import {
  TrendingUp,
  Users,
  CheckSquare,
  Clock,
  Building2,
  Settings2,
  Plus,
  Loader2,
  Package,
  DollarSign,
  FileText,
  Calendar,
  Target,
  Heart,
  GraduationCap,
  Truck,
  MessageSquare,
  Utensils,
  ShieldCheck,
  Briefcase,
  Building,
  UserCheck,
  Settings,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  teamMembers: number;
}

interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  "in-progress": "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
};

const priorityColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-warning",
  high: "text-destructive",
  urgent: "text-destructive font-semibold",
};

// Sample data for charts
const sampleChartData = [
  { name: "Mon", value: 12 },
  { name: "Tue", value: 19 },
  { name: "Wed", value: 15 },
  { name: "Thu", value: 22 },
  { name: "Fri", value: 18 },
  { name: "Sat", value: 8 },
  { name: "Sun", value: 5 },
];

const pieColors = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckSquare,
  Users,
  TrendingUp,
  Clock,
  Package,
  DollarSign,
  BarChart3,
  FileText,
  Truck,
  Calendar,
  UserCheck,
  GraduationCap,
  Utensils,
  Building,
  Heart,
  MessageSquare,
  Target,
  ShieldCheck,
  Briefcase,
  Settings,
};

export default function DashboardHome() {
  const { user, configuration, role } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    teamMembers: 0,
  });
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  // Get dynamic widgets based on configuration
  useEffect(() => {
    if (configuration) {
      const allTypes = [
        configuration.management_type,
        ...(configuration.additional_management_types || []),
      ];
      const dynamicWidgets = getWidgetsForManagementTypes(allTypes);
      setWidgets(dynamicWidgets);
    }
  }, [configuration]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, status, priority, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch team members count
      const { count: teamCount } = await supabase
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const taskList = tasks || [];
      
      setStats({
        totalTasks: taskList.length,
        completedTasks: taskList.filter(t => t.status === "completed").length,
        inProgressTasks: taskList.filter(t => t.status === "in-progress").length,
        teamMembers: teamCount || 0,
      });

      setRecentTasks(taskList.slice(0, 5));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  // Render a widget based on its type
  const renderWidget = (widget: DashboardWidget) => {
    const Icon = widget.icon;
    
    switch (widget.type) {
      case "stats":
        return (
          <Card key={widget.id} className="card-hover">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {widget.title}
                </CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {widget.id === "tasks_overview" && stats.totalTasks}
                {widget.id === "team_overview" && stats.teamMembers}
                {widget.id === "time_tracking" && `${Math.floor(Math.random() * 40 + 120)}h`}
                {!["tasks_overview", "team_overview", "time_tracking"].includes(widget.id) && "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{widget.description}</p>
            </CardContent>
          </Card>
        );

      case "chart":
        return (
          <Card key={widget.id} className="col-span-1 md:col-span-2 card-hover">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sampleChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary)/0.2)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{widget.description}</p>
            </CardContent>
          </Card>
        );

      case "list":
        return (
          <Card key={widget.id} className="card-hover">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {widget.id === "recent_documents" ? (
                  <>
                    <div className="flex items-center gap-2 text-sm py-1 border-b border-border">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate">Project Report Q1.pdf</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm py-1 border-b border-border">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate">Team Guidelines.docx</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm py-1">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate">Meeting Notes.md</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No items yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div>
        <DashboardHeader
          title="Dashboard"
          subtitle={`Welcome back, ${userName}. Here's what's happening.`}
        />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader
        title="Dashboard"
        subtitle={`Welcome back, ${userName}. Here's what's happening.`}
      />

      <div className="p-6 space-y-6">
        {/* Configuration Badge */}
        {configuration && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-foreground font-medium">
                {getIndustryLabel(configuration.industry)}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent border border-border text-sm">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium">
                {getManagementTypeLabel(configuration.management_type)}
              </span>
            </div>
            {configuration.additional_management_types && configuration.additional_management_types.length > 0 && (
              configuration.additional_management_types.map(type => (
                <div 
                  key={type}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-sm"
                >
                  <span className="text-muted-foreground font-medium">
                    {getManagementTypeLabel(type)}
                  </span>
                </div>
              ))
            )}
            {role && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 text-sm">
                <span className="text-success font-medium capitalize">{role}</span>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Widgets Grid */}
        {widgets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {widgets.slice(0, 8).map(widget => renderWidget(widget))}
          </div>
        )}

        {/* Completion Rate */}
        {stats.totalTasks > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Completion Rate</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.completedTasks} of {stats.totalTasks} tasks completed
                </p>
              </div>
              <span className="text-2xl font-bold text-primary">{completionRate}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Actions & Recent Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link to="/dashboard/tasks">
                  <CheckSquare className="w-5 h-5" />
                  <span>View Tasks</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link to="/dashboard/team">
                  <Users className="w-5 h-5" />
                  <span>Team Members</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link to="/dashboard/import">
                  <Plus className="w-5 h-5" />
                  <span>Import Data</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link to="/dashboard/reports">
                  <TrendingUp className="w-5 h-5" />
                  <span>Reports</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Tasks</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/tasks">View all</Link>
              </Button>
            </div>
            
            {recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckSquare className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No tasks yet</p>
                <Button size="sm" asChild>
                  <Link to="/dashboard/tasks">Create your first task</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            statusColors[task.status] || statusColors.todo
                          }`}
                        >
                          {task.status.replace("-", " ")}
                        </span>
                        <span
                          className={`text-xs capitalize ${
                            priorityColors[task.priority] || priorityColors.medium
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
