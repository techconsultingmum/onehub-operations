import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";
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

const performanceData = [
  { name: "Week 1", tasks: 145, hours: 320 },
  { name: "Week 2", tasks: 178, hours: 380 },
  { name: "Week 3", tasks: 156, hours: 350 },
  { name: "Week 4", tasks: 192, hours: 420 },
];

const departmentData = [
  { name: "Engineering", value: 35, color: "hsl(var(--primary))" },
  { name: "Product", value: 25, color: "hsl(var(--info))" },
  { name: "Marketing", value: 20, color: "hsl(var(--success))" },
  { name: "Design", value: 12, color: "hsl(var(--warning))" },
  { name: "Analytics", value: 8, color: "hsl(var(--destructive))" },
];

const metrics = [
  { label: "Total Tasks Completed", value: "1,247", change: "+18%" },
  { label: "Average Completion Time", value: "2.3 days", change: "-12%" },
  { label: "Team Productivity", value: "94%", change: "+5%" },
  { label: "On-time Delivery", value: "89%", change: "+3%" },
];

export default function Reports() {
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
            <Button variant="outline">
              <Calendar className="w-4 h-4" />
              Last 30 days
            </Button>
          </div>
          <Button>
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
              <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{metric.value}</span>
                <span className="text-sm font-medium text-success">
                  {metric.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Weekly Performance</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tasks"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorPerf)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Distribution */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Task Distribution by Department</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
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
        </div>
      </div>
    </div>
  );
}
