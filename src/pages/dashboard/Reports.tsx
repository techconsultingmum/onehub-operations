import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Download, Calendar, TrendingUp, Users, CheckSquare, Clock } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { CardGridSkeleton, ErrorState } from "@/components/ui/data-state";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts";

interface ReportData {
  taskStats: { total: number; completed: number; inProgress: number; todo: number };
  teamCount: number;
}

export default function Reports() {
  useDocumentTitle("Reports");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data, isLoading, isError, refetch } = useQuery<ReportData>({
    queryKey: ["reports", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [tasksRes, teamRes] = await Promise.all([
        supabase.from("tasks").select("status").eq("user_id", user!.id),
        supabase.from("team_members").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
      ]);
      if (tasksRes.error) throw tasksRes.error;
      if (teamRes.error) throw teamRes.error;
      const taskList = tasksRes.data ?? [];
      return {
        taskStats: {
          total: taskList.length,
          completed: taskList.filter((t) => t.status === "completed").length,
          inProgress: taskList.filter((t) => t.status === "in-progress").length,
          todo: taskList.filter((t) => t.status === "todo").length,
        },
        teamCount: teamRes.count ?? 0,
      };
    },
  });

  const taskStats = data?.taskStats ?? { total: 0, completed: 0, inProgress: 0, todo: 0 };
  const teamCount = data?.teamCount ?? 0;
  const completionRate = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

  const distributionData = [
    { name: "Completed", value: taskStats.completed, color: "hsl(var(--success))" },
    { name: "In Progress", value: taskStats.inProgress, color: "hsl(var(--info))" },
    { name: "To Do", value: taskStats.todo, color: "hsl(var(--muted))" },
  ].filter((d) => d.value > 0);

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
    toast({ title: "Report Exported", description: "Your report has been downloaded." });
  };

  return (
    <div>
      <DashboardHeader title="Reports" subtitle="Analytics and performance insights" />

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              All Time
            </Button>
          </div>
          <Button onClick={handleExport} className="gap-2" disabled={isLoading || isError}>
            <Download className="w-4 h-4" aria-hidden="true" />
            Export Report
          </Button>
        </div>

        {isLoading ? (
          <CardGridSkeleton count={4} />
        ) : isError ? (
          <ErrorState message="We couldn't load your report data." onRetry={() => refetch()} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                      <span className="text-2xl font-bold">{metric.value}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <metric.icon className="w-5 h-5 text-primary" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {taskStats.total > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Task Distribution</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Completion Progress</h3>
                  <div className="space-y-6">
                    {[
                      { label: "Completed", value: taskStats.completed, color: "bg-success" },
                      { label: "In Progress", value: taskStats.inProgress, color: "bg-info" },
                      { label: "To Do", value: taskStats.todo, color: "bg-muted-foreground/50" },
                    ].map((row) => {
                      const pct = taskStats.total > 0 ? (row.value / taskStats.total) * 100 : 0;
                      return (
                        <div key={row.label}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">{row.label}</span>
                            <span className="text-sm font-medium">{row.value} / {taskStats.total}</span>
                          </div>
                          <div
                            className="h-3 bg-muted rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuenow={Math.round(pct)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${row.label} progress`}
                          >
                            <div className={`h-full ${row.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No data yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Start creating tasks and adding team members to see your analytics and reports here.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
