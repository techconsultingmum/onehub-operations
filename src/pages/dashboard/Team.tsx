import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: "active" | "away" | "offline";
  avatar?: string;
  tasksCompleted: number;
  workload: number; // percentage
}

const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Sarah Chen",
    email: "sarah.chen@managex.io",
    phone: "+1 (555) 123-4567",
    role: "Product Manager",
    department: "Product",
    status: "active",
    tasksCompleted: 47,
    workload: 85,
  },
  {
    id: 2,
    name: "Mike Johnson",
    email: "mike.j@managex.io",
    phone: "+1 (555) 234-5678",
    role: "Senior Developer",
    department: "Engineering",
    status: "active",
    tasksCompleted: 89,
    workload: 72,
  },
  {
    id: 3,
    name: "Emily Davis",
    email: "emily.d@managex.io",
    phone: "+1 (555) 345-6789",
    role: "Data Analyst",
    department: "Analytics",
    status: "away",
    tasksCompleted: 34,
    workload: 45,
  },
  {
    id: 4,
    name: "Alex Kim",
    email: "alex.kim@managex.io",
    phone: "+1 (555) 456-7890",
    role: "DevOps Engineer",
    department: "Engineering",
    status: "active",
    tasksCompleted: 62,
    workload: 90,
  },
  {
    id: 5,
    name: "Jordan Lee",
    email: "jordan.lee@managex.io",
    phone: "+1 (555) 567-8901",
    role: "UX Designer",
    department: "Design",
    status: "offline",
    tasksCompleted: 28,
    workload: 30,
  },
  {
    id: 6,
    name: "Lisa Wang",
    email: "lisa.w@managex.io",
    phone: "+1 (555) 678-9012",
    role: "Marketing Lead",
    department: "Marketing",
    status: "active",
    tasksCompleted: 53,
    workload: 68,
  },
];

const statusColors = {
  active: "bg-success",
  away: "bg-warning",
  offline: "bg-muted-foreground",
};

export default function Team() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <DashboardHeader
        title="Team"
        subtitle="Manage your team members and their workload"
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
          <Button>
            <Plus className="w-4 h-4" />
            Add Member
          </Button>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-card border border-border rounded-xl p-6 card-hover"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                        statusColors[member.status]
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <button className="p-1 hover:bg-muted rounded transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{member.phone}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
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
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="text-muted-foreground">Tasks Completed</span>
                  <span className="font-medium">{member.tasksCompleted}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
