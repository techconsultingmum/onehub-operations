import { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Loader2, Trash2, Edit, AlertTriangle, CheckCircle2, Clock, AlertCircle, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardGridSkeleton } from "@/components/ui/data-state";

type ComplaintStatus = "open" | "in-progress" | "resolved" | "closed";
type ComplaintPriority = "low" | "medium" | "high" | "urgent";
type ComplaintCategory = "general" | "plumbing" | "electrical" | "structural" | "cleanliness" | "security" | "parking" | "noise" | "amenity" | "other";

interface Complaint {
  id: string;
  title: string;
  description: string | null;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  unit_number: string | null;
  reported_by: string | null;
  assigned_to: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

const categories: { value: ComplaintCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "structural", label: "Structural" },
  { value: "cleanliness", label: "Cleanliness" },
  { value: "security", label: "Security" },
  { value: "parking", label: "Parking" },
  { value: "noise", label: "Noise" },
  { value: "amenity", label: "Amenity" },
  { value: "other", label: "Other" },
];

const statusConfig: Record<ComplaintStatus, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: "Open", color: "bg-warning/10 text-warning border-warning/20", icon: AlertCircle },
  "in-progress": { label: "In Progress", color: "bg-info/10 text-info border-info/20", icon: Clock },
  resolved: { label: "Resolved", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground border-border", icon: CheckCircle2 },
};

const priorityBadges: Record<ComplaintPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
  urgent: "bg-destructive text-destructive-foreground",
};

export default function Complaints() {
  useDocumentTitle("Complaints & Maintenance");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; complaint: Complaint | null; isDeleting: boolean }>({
    open: false,
    complaint: null,
    isDeleting: false,
  });

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>("general");
  const [priority, setPriority] = useState<ComplaintPriority>("medium");
  const [status, setStatus] = useState<ComplaintStatus>("open");
  const [unitNumber, setUnitNumber] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchComplaints();
  }, [user]);

  const fetchComplaints = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load complaints.", variant: "destructive" });
    } else {
      setComplaints((data as Complaint[]) || []);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("general");
    setPriority("medium");
    setStatus("open");
    setUnitNumber("");
    setReportedBy("");
    setAssignedTo("");
    setResolutionNotes("");
    setEditingComplaint(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (complaint: Complaint) => {
    setEditingComplaint(complaint);
    setTitle(complaint.title);
    setDescription(complaint.description || "");
    setCategory(complaint.category);
    setPriority(complaint.priority);
    setStatus(complaint.status);
    setUnitNumber(complaint.unit_number || "");
    setReportedBy(complaint.reported_by || "");
    setAssignedTo(complaint.assigned_to || "");
    setResolutionNotes(complaint.resolution_notes || "");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !title.trim()) {
      toast({ title: "Missing Title", description: "Please enter a complaint title.", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    const complaintData = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      priority,
      status,
      unit_number: unitNumber.trim() || null,
      reported_by: reportedBy.trim() || null,
      assigned_to: assignedTo.trim() || null,
      resolution_notes: resolutionNotes.trim() || null,
      resolved_at: status === "resolved" || status === "closed" ? new Date().toISOString() : null,
      user_id: user.id,
    };

    let error;
    if (editingComplaint) {
      ({ error } = await supabase.from("complaints").update(complaintData).eq("id", editingComplaint.id));
    } else {
      ({ error } = await supabase.from("complaints").insert(complaintData));
    }

    setIsSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to save complaint.", variant: "destructive" });
    } else {
      toast({
        title: editingComplaint ? "Complaint Updated" : "Complaint Created",
        description: `"${title}" has been ${editingComplaint ? "updated" : "created"}.`,
      });
      setIsDialogOpen(false);
      resetForm();
      fetchComplaints();
    }
  };

  const confirmDelete = (complaint: Complaint) => {
    setDeleteConfirm({ open: true, complaint, isDeleting: false });
  };

  const handleDelete = async () => {
    if (!deleteConfirm.complaint) return;
    setDeleteConfirm(prev => ({ ...prev, isDeleting: true }));
    const { error } = await supabase.from("complaints").delete().eq("id", deleteConfirm.complaint.id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete complaint.", variant: "destructive" });
    } else {
      toast({ title: "Complaint Deleted", description: "The complaint has been removed." });
      setComplaints(complaints.filter(c => c.id !== deleteConfirm.complaint!.id));
    }
    setDeleteConfirm({ open: false, complaint: null, isDeleting: false });
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (c.unit_number?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: complaints.length,
    open: complaints.filter(c => c.status === "open").length,
    "in-progress": complaints.filter(c => c.status === "in-progress").length,
    resolved: complaints.filter(c => c.status === "resolved").length,
    closed: complaints.filter(c => c.status === "closed").length,
  };

  if (isLoading) {
    return (
      <div>
        <DashboardHeader title="Complaints & Maintenance" subtitle="Track and resolve complaints and service requests" />
        <div className="p-6">
          <CardGridSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader title="Complaints & Maintenance" subtitle="Track and resolve complaints and service requests" />

      <div className="p-6 space-y-6">
        {/* Status Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["open", "in-progress", "resolved", "closed"] as ComplaintStatus[]).map(s => {
            const config = statusConfig[s];
            const Icon = config.icon;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border transition-all",
                  statusFilter === s ? "ring-2 ring-primary" : "hover:border-primary/30",
                  "bg-card border-border"
                )}
              >
                <div className={cn("p-2 rounded-lg", config.color.split(" ")[0])}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">{statusCounts[s]}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {statusFilter !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setStatusFilter("all")} className="gap-1">
                <Filter className="w-3 h-3" />
                Clear filter
              </Button>
            )}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                New Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingComplaint ? "Edit Complaint" : "New Complaint"}</DialogTitle>
                <DialogDescription>
                  {editingComplaint ? "Update complaint details." : "Submit a new complaint or maintenance request."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="complaint-title">Title *</Label>
                  <Input id="complaint-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief summary of the issue" maxLength={200} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complaint-desc">Description</Label>
                  <Textarea id="complaint-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description of the issue" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as ComplaintCategory)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as ComplaintPriority)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {editingComplaint && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as ComplaintStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit-number">Unit / Flat No.</Label>
                    <Input id="unit-number" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} placeholder="e.g. A-101" maxLength={20} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reported-by">Reported By</Label>
                    <Input id="reported-by" value={reportedBy} onChange={(e) => setReportedBy(e.target.value)} placeholder="Name" maxLength={100} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned-to">Assigned To</Label>
                  <Input id="assigned-to" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Person or team responsible" maxLength={100} />
                </div>
                {editingComplaint && (
                  <div className="space-y-2">
                    <Label htmlFor="resolution-notes">Resolution Notes</Label>
                    <Textarea id="resolution-notes" value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="Notes about how the issue was resolved" rows={2} />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : editingComplaint ? "Update" : "Submit"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Complaints List */}
        {complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No complaints yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Submit your first complaint or maintenance request to start tracking issues.
            </p>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              New Complaint
            </Button>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComplaints.map(complaint => {
              const sConfig = statusConfig[complaint.status];
              const StatusIcon = sConfig.icon;
              return (
                <div
                  key={complaint.id}
                  className="bg-card border border-border rounded-xl p-5 card-hover focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                  role="article"
                  aria-label={`Complaint: ${complaint.title}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h4 className="font-semibold truncate">{complaint.title}</h4>
                        <Badge variant="outline" className={cn("text-xs capitalize", sConfig.color)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {sConfig.label}
                        </Badge>
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize", priorityBadges[complaint.priority])}>
                          {complaint.priority}
                        </span>
                        <Badge variant="secondary" className="text-xs capitalize">{complaint.category}</Badge>
                      </div>
                      {complaint.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{complaint.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {complaint.unit_number && <span>Unit: <strong>{complaint.unit_number}</strong></span>}
                        {complaint.reported_by && <span>By: <strong>{complaint.reported_by}</strong></span>}
                        {complaint.assigned_to && <span>Assigned: <strong>{complaint.assigned_to}</strong></span>}
                        <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                      </div>
                      {complaint.resolution_notes && (
                        <div className="mt-2 p-2 rounded-lg bg-success/5 border border-success/10">
                          <p className="text-xs text-success"><strong>Resolution:</strong> {complaint.resolution_notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(complaint)} aria-label={`Edit ${complaint.title}`}>
                        <Edit className="w-4 h-4" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => confirmDelete(complaint)} aria-label={`Delete ${complaint.title}`}>
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, complaint: null, isDeleting: false })}
        title="Delete Complaint"
        description={`Are you sure you want to delete "${deleteConfirm.complaint?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteConfirm.isDeleting}
        variant="destructive"
      />
    </div>
  );
}
