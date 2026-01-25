import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import {
  TrendingUp,
  Users,
  CheckSquare,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
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
} from "recharts";

const stats = [
  {
    name: "Total Tasks",
    value: "2,847",
    change: "+12.5%",
    trend: "up",
    icon: CheckSquare,
  },
  {
    name: "Active Team Members",
    value: "156",
    change: "+3.2%",
    trend: "up",
    icon: Users,
  },
  {
    name: "Completion Rate",
    value: "94.2%",
    change: "+2.1%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    name: "Avg. Task Duration",
    value: "2.4 days",
    change: "-8.3%",
    trend: "down",
    icon: Clock,
  },
];

const chartData = [
  { name: "Jan", tasks: 400, completed: 380 },
  { name: "Feb", tasks: 520, completed: 490 },
  { name: "Mar", tasks: 480, completed: 450 },
  { name: "Apr", tasks: 620, completed: 580 },
  { name: "May", tasks: 750, completed: 720 },
  { name: "Jun", tasks: 680, completed: 650 },
  { name: "Jul", tasks: 820, completed: 790 },
];

const teamActivity = [
  { name: "Mon", value: 45 },
  { name: "Tue", value: 78 },
  { name: "Wed", value: 65 },
  { name: "Thu", value: 89 },
  { name: "Fri", value: 72 },
  { name: "Sat", value: 34 },
  { name: "Sun", value: 28 },
];

const recentTasks = [
  {
    id: 1,
    title: "Review Q3 marketing strategy",
    status: "in-progress",
    assignee: "Sarah Chen",
    priority: "high",
  },
  {
    id: 2,
    title: "Update customer onboarding flow",
    status: "completed",
    assignee: "Mike Johnson",
    priority: "medium",
  },
  {
    id: 3,
    title: "Prepare monthly analytics report",
    status: "todo",
    assignee: "Emily Davis",
    priority: "high",
  },
  {
    id: 4,
    title: "Deploy production hotfix",
    status: "completed",
    assignee: "Alex Kim",
    priority: "urgent",
  },
  {
    id: 5,
    title: "Conduct team retrospective",
    status: "in-progress",
    assignee: "Jordan Lee",
    priority: "low",
  },
];

const statusColors = {
  todo: "bg-muted text-muted-foreground",
  "in-progress": "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
};

const priorityColors = {
  low: "text-muted-foreground",
  medium: "text-warning",
  high: "text-destructive",
  urgent: "text-destructive font-semibold",
};

export default function DashboardHome() {
  return (
    <div>
      <DashboardHeader
        title="Dashboard"
        subtitle="Welcome back, John. Here's what's happening."
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-card border border-border rounded-xl p-6 card-hover"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="w-4 h-4 text-success" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-success" />
                )}
                <span className="text-sm font-medium text-success">
                  {stat.change}
                </span>
                <span className="text-sm text-muted-foreground">vs last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold">Task Overview</h3>
                <p className="text-sm text-muted-foreground">
                  Monthly task creation vs completion
                </p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
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
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--success))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--success))"
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
                    fill="url(#colorTasks)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="hsl(var(--success))"
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team Activity */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="mb-6">
              <h3 className="font-semibold">Team Activity</h3>
              <p className="text-sm text-muted-foreground">This week</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamActivity}>
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
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Recent Tasks</h3>
              <p className="text-sm text-muted-foreground">
                Latest updates from your team
              </p>
            </div>
            <button className="text-sm font-medium text-primary hover:underline">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Task
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Assignee
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className="font-medium">{task.title}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          statusColors[task.status as keyof typeof statusColors]
                        }`}
                      >
                        {task.status.replace("-", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {task.assignee}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`text-sm capitalize ${
                          priorityColors[task.priority as keyof typeof priorityColors]
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
