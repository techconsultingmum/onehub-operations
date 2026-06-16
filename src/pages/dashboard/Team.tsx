import { useState } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Mail, Loader2, Trash2, Edit, Users } from "lucide-react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CardGridSkeleton, ErrorState } from "@/components/ui/data-state";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  workload: number | null;
  created_at: string;
}

const emailSchema = z.string().email("Please enter a valid email address");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

const roles = [
  "Manager",
  "Developer",
  "Designer",
  "Analyst",
  "Product Manager",
  "Marketing",
  "Sales",
  "Support",
  "Other",
];

const departments = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "Operations",
  "Finance",
  "HR",
  "Other",
];

export default function Team() {
  useDocumentTitle("Team");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; member: TeamMember | null }>({
    open: false,
    member: null,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const teamKey = ["team-members", user?.id] as const;

  const { data: members = [], isLoading, isError, refetch } = useQuery<TeamMember[]>({
    queryKey: teamKey,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("");
    setDepartment("");
    setEditingMember(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setName(member.name);
    setEmail(member.email);
    setRole(member.role);
    setDepartment(member.department || "");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      nameSchema.parse(name);
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: "Validation Error", description: err.errors[0].message, variant: "destructive" });
        return;
      }
    }

    if (!role) {
      toast({ title: "Missing Role", description: "Please select a role.", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    const memberData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      department: department || null,
      user_id: user.id,
    };

    const { error } = editingMember
      ? await supabase.from("team_members").update(memberData).eq("id", editingMember.id)
      : await supabase.from("team_members").insert(memberData);

    setIsSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to save team member.", variant: "destructive" });
    } else {
      toast({
        title: editingMember ? "Member Updated" : "Member Added",
        description: `${name} has been ${editingMember ? "updated" : "added"} to your team.`,
      });
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: teamKey });
    }
  };

  const confirmDelete = (member: TeamMember) => {
    setDeleteConfirm({ open: true, member });
  };

  const deleteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onMutate: async (memberId) => {
      await queryClient.cancelQueries({ queryKey: teamKey });
      const previous = queryClient.getQueryData<TeamMember[]>(teamKey);
      queryClient.setQueryData<TeamMember[]>(teamKey, (old) => (old ?? []).filter((m) => m.id !== memberId));
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(teamKey, ctx.previous);
      toast({ title: "Error", description: "Failed to remove team member.", variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Member Removed", description: `${deleteConfirm.member?.name ?? "Member"} has been removed.` });
    },
    onSettled: () => {
      setDeleteConfirm({ open: false, member: null });
      queryClient.invalidateQueries({ queryKey: teamKey });
    },
  });

  const handleDelete = () => {
    if (deleteConfirm.member) deleteMutation.mutate(deleteConfirm.member.id);
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.department?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  if (isError) {
    return (
      <div>
        <DashboardHeader title="Team" subtitle="Manage your team members" />
        <div className="p-6">
          <ErrorState message="We couldn't load your team members." onRetry={() => refetch()} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader
        title="Team"
        subtitle="Manage your team members and their roles"
      />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingMember ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
                <DialogDescription>
                  {editingMember ? "Update team member details." : "Add a new member to your team."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {roles.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {departments.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingMember ? "Update" : "Add"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Empty State */}
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Start building your team by adding your first member.
            </p>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Add First Member
            </Button>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search query.
            </p>
          </div>
        ) : (
          /* Team Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-card border border-border rounded-xl p-6 card-hover focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                role="article"
                aria-label={`Team member: ${member.name}, ${member.role}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(member)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => confirmDelete(member)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.department && (
                    <div className="text-sm text-muted-foreground">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                        {member.department}
                      </span>
                    </div>
                  )}
                </div>

                {member.workload !== null && (
                  <div className="pt-4 border-t border-border mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Workload</span>
                      <span className="text-sm font-medium">{member.workload}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          member.workload > 80
                            ? "bg-destructive"
                            : member.workload > 60
                            ? "bg-warning"
                            : "bg-success"
                        }`}
                        style={{ width: `${member.workload}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, member: null })}
        title="Remove Team Member"
        description={`Are you sure you want to remove "${deleteConfirm.member?.name}" from your team? This action cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
