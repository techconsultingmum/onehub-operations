import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Download, Calendar, TrendingUp, Users, CheckSquare, Clock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
}

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [taskStats, setTaskStats] = useState<TaskStats>({ total: 0, completed: 0, inProgress: 0, todo: 0 });
  const [teamCount, setTeamCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user]);

  const fetchReportData = async () => {
    if (!user) return;

    try {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("status")
        .eq("user_id", user.id);

      const { count } = await supabase
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const taskList = tasks || [];
      setTaskStats({
        total: taskList.length,
        completed: taskList.filter(t => t.status === "completed").length,
        inProgress: taskList.filter(t => t.status === "in-progress").length,
        todo: taskList.filter(t => t.status === "todo").length,
      });
      setTeamCount(count || 0);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load report data.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const completionRate = taskStats.total > 0 
    ? Math.round((taskStats.completed / taskStats.total) * 100) 
    : 0;

  const avgCompletionTime = taskStats.total > 0 ? "2.3 days" : "N/A";

  const distributionData = [
    { name: "Completed", value: taskStats.completed, color: "hsl(var(--success))" },
    { name: "In Progress", value: taskStats.inProgress, color: "hsl(var(--info))" },
    { name: "To Do", value: taskStats.todo, color: "hsl(var(--muted))" },
  ].filter(d => d.value > 0);

  const metrics = [
    { label: "Total Tasks", value: taskStats.total.toString(), icon: CheckSquare },
    { label: "Completion Rate", value: `${completionRate}%`, icon: TrendingUp },
    { label: "In Progress", value: taskStats.inProgress.toString(), icon: Clock },
    { label: "Team Members", value: teamCount.toString(), icon: Users },
  ];

  const handleExport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      tasks: taskStats,
      completionRate: `${completionRate}%`,
      teamMembers: teamCount,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      description: "Your report has been downloaded.",
    });
  };

  if (isLoading) {
    return (
      <div>
        <DashboardHeader title="Reports" subtitle="Analytics and performance insights" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader
        title="Reports"
        subtitle="Analytics and performance insights"
      />

      <div className="p-6 space-y-6">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              All Time
            </Button>
          </div>
          <Button onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                  <span className="text-2xl font-bold">{metric.value}</span>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <metric.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        {taskStats.total > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Distribution */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Task Distribution</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value) => (
                        <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
                      )}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Completion Progress */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Completion Progress</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="text-sm font-medium">{taskStats.completed} / {taskStats.total}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-success rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">In Progress</span>
                    <span className="text-sm font-medium">{taskStats.inProgress} / {taskStats.total}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-info rounded-full transition-all duration-500"
                      style={{ width: `${taskStats.total > 0 ? (taskStats.inProgress / taskStats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">To Do</span>
                    <span className="text-sm font-medium">{taskStats.todo} / {taskStats.total}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-muted-foreground/50 rounded-full transition-all duration-500"
                      style={{ width: `${taskStats.total > 0 ? (taskStats.todo / taskStats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No data yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Start creating tasks and adding team members to see your analytics and reports here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
