import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

type TaskStatus = "todo" | "in-progress" | "completed";

interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
}

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Review Q3 marketing strategy",
    description: "Analyze and provide feedback on the proposed marketing strategy",
    status: "in-progress",
    assignee: "Sarah Chen",
    priority: "high",
    dueDate: "2024-02-15",
  },
  {
    id: 2,
    title: "Update customer onboarding flow",
    description: "Redesign the welcome email sequence",
    status: "completed",
    assignee: "Mike Johnson",
    priority: "medium",
    dueDate: "2024-02-10",
  },
  {
    id: 3,
    title: "Prepare monthly analytics report",
    description: "Compile data from all departments for the monthly review",
    status: "todo",
    assignee: "Emily Davis",
    priority: "high",
    dueDate: "2024-02-20",
  },
  {
    id: 4,
    title: "Deploy production hotfix",
    description: "Critical bug fix for payment processing",
    status: "completed",
    assignee: "Alex Kim",
    priority: "urgent",
    dueDate: "2024-02-08",
  },
  {
    id: 5,
    title: "Conduct team retrospective",
    description: "Quarterly sprint retrospective meeting",
    status: "todo",
    assignee: "Jordan Lee",
    priority: "low",
    dueDate: "2024-02-25",
  },
  {
    id: 6,
    title: "Design new dashboard widgets",
    description: "Create mockups for analytics dashboard improvements",
    status: "in-progress",
    assignee: "Lisa Wang",
    priority: "medium",
    dueDate: "2024-02-18",
  },
];

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: "todo", title: "To Do", color: "bg-muted" },
  { id: "in-progress", title: "In Progress", color: "bg-info/10" },
  { id: "completed", title: "Completed", color: "bg-success/10" },
];

const priorityBadges = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
  urgent: "bg-destructive text-destructive-foreground",
};

export default function Tasks() {
  const [tasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter(
      (task) =>
        task.status === status &&
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div>
      <DashboardHeader
        title="Tasks"
        subtitle="Manage and track your team's work"
      />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          <Button>
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map((column) => (
            <div key={column.id} className="space-y-4">
              {/* Column Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", column.color)} />
                  <h3 className="font-semibold">{column.title}</h3>
                  <span className="text-sm text-muted-foreground">
                    ({getTasksByStatus(column.id).length})
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {getTasksByStatus(column.id).map((task) => (
                  <div
                    key={task.id}
                    className="bg-card border border-border rounded-xl p-4 card-hover cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize",
                          priorityBadges[task.priority]
                        )}
                      >
                        {task.priority}
                      </span>
                      <button className="p-1 hover:bg-muted rounded transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <h4 className="font-medium mb-1">{task.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {task.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {task.assignee
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {task.assignee}
                        </span>
                      </div>
                      <span className="text-muted-foreground">{task.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
