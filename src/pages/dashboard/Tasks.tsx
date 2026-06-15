import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorState, CardGridSkeleton } from "@/components/ui/data-state";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Loader2, Trash2, Edit, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskStatus = "todo" | "in-progress" | "completed";
type TaskPriority = "low" | "medium" | "high" | "urgent";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: "todo", title: "To Do", color: "bg-muted" },
  { id: "in-progress", title: "In Progress", color: "bg-info/20" },
  { id: "completed", title: "Completed", color: "bg-success/20" },
];

const priorityBadges = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
  urgent: "bg-destructive text-destructive-foreground",
};

export default function Tasks() {
  useDocumentTitle("Tasks");
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; task: Task | null }>({
    open: false,
    task: null,
  });

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");

  const tasksKey = ["tasks", user?.id] as const;

  const { data: tasks = [], isLoading, isError, refetch } = useQuery({
    queryKey: tasksKey,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueDate("");
    setEditingTask(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.due_date || "");
    setIsDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        due_date: dueDate || null,
        user_id: user.id,
      };
      if (editingTask) {
        const { error } = await supabase.from("tasks").update(taskData).eq("id", editingTask.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tasks").insert(taskData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: editingTask ? "Task updated" : "Task created",
        description: `"${title}" has been ${editingTask ? "updated" : "created"}.`,
      });
      setIsDialogOpen(false);
      resetForm();
      qc.invalidateQueries({ queryKey: tasksKey });
    },
    onError: (e) => {
      toast({
        title: "Couldn't save task",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (task: Task) => {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      if (error) throw error;
    },
    onMutate: async (task) => {
      await qc.cancelQueries({ queryKey: tasksKey });
      const prev = qc.getQueryData<Task[]>(tasksKey);
      qc.setQueryData<Task[]>(tasksKey, (curr = []) => curr.filter((t) => t.id !== task.id));
      return { prev };
    },
    onError: (e, _task, ctx) => {
      if (ctx?.prev) qc.setQueryData(tasksKey, ctx.prev);
      toast({
        title: "Couldn't delete task",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({ title: "Task deleted" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: tasksKey });
      setDeleteConfirm({ open: false, task: null });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: TaskStatus }) => {
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, newStatus }) => {
      await qc.cancelQueries({ queryKey: tasksKey });
      const prev = qc.getQueryData<Task[]>(tasksKey);
      qc.setQueryData<Task[]>(tasksKey, (curr = []) =>
        curr.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(tasksKey, ctx.prev);
      toast({
        title: "Couldn't update status",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: tasksKey }),
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Missing title", description: "Please enter a task title.", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  const getTasksByStatus = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return (taskStatus: TaskStatus) =>
      tasks.filter((task) => task.status === taskStatus && task.title.toLowerCase().includes(q));
  }, [tasks, searchQuery]);

  return (
    <div>
      <DashboardHeader title="Tasks" subtitle="Manage and track your team's work" />

      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search tasks"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" aria-hidden="true" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingTask ? "Edit Task" : "Create Task"}</DialogTitle>
                <DialogDescription>
                  {editingTask ? "Update your task details." : "Add a new task to your board."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter task title" maxLength={200} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter task description" rows={3} maxLength={2000} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status-select">Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                      <SelectTrigger id="status-select"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority-select">Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                      <SelectTrigger id="priority-select"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Saving...</>
                  ) : (editingTask ? "Update" : "Create")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <CardGridSkeleton count={6} />
        ) : isError ? (
          <ErrorState
            title="Couldn't load tasks"
            message="There was a problem fetching your tasks."
            onRetry={() => refetch()}
          />
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <CheckSquare className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">Create your first task to start organizing your work.</p>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="w-4 h-4" aria-hidden="true" />
              Create First Task
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {columns.map((column) => {
              const colTasks = getTasksByStatus(column.id);
              return (
                <section key={column.id} className="space-y-4" aria-label={`${column.title} column`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", column.color)} aria-hidden="true" />
                      <h3 className="font-semibold">{column.title}</h3>
                      <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{colTasks.length}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`Add task to ${column.title}`}
                      onClick={() => {
                        resetForm();
                        setStatus(column.id);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </div>

                  <div className="space-y-3 min-h-[120px]">
                    {colTasks.length === 0 ? (
                      <div className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-xl">
                        <p className="text-sm text-muted-foreground">No tasks</p>
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <article
                          key={task.id}
                          className="bg-card border border-border rounded-xl p-4 card-hover focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                          aria-label={`Task: ${task.title}, ${task.priority} priority, ${task.status.replace("-", " ")}`}
                        >
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize", priorityBadges[task.priority])}>
                              {task.priority}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(task)} aria-label={`Edit ${task.title}`}>
                                <Edit className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setDeleteConfirm({ open: true, task })}
                                aria-label={`Delete ${task.title}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                            </div>
                          </div>
                          <h4 className="font-medium mb-1 break-words">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            {task.due_date ? (
                              <div className="text-xs text-muted-foreground">Due: {new Date(task.due_date).toLocaleDateString()}</div>
                            ) : <span />}
                            <Select
                              value={task.status}
                              onValueChange={(v) => statusMutation.mutate({ id: task.id, newStatus: v as TaskStatus })}
                            >
                              <SelectTrigger
                                className="h-7 w-[130px] text-xs"
                                aria-label={`Change status of ${task.title}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border">
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, task: open ? deleteConfirm.task : null })}
        title="Delete Task"
        description={`Are you sure you want to delete "${deleteConfirm.task?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm.task && deleteMutation.mutate(deleteConfirm.task)}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
