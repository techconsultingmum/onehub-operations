import {
  Users, 
  LayoutDashboard, 
  CheckSquare, 
  BarChart3,
  FileSpreadsheet,
  Webhook,
  Bell,
  Shield
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "User & Role Management",
    description: "Secure authentication with role-based access control. Admin, Manager, Staff, and custom roles.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: LayoutDashboard,
    title: "Smart Dashboard",
    description: "Industry-agnostic overview with KPIs, charts, and customizable widgets per role.",
    color: "text-info",
    bgColor: "bg-info/10",
  },
  {
    icon: CheckSquare,
    title: "Task Management",
    description: "Create, assign, and track workflows with status tracking, deadlines, and priorities.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Users,
    title: "Team & Resources",
    description: "Manage team profiles, resource allocation, availability, and workload tracking.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: FileSpreadsheet,
    title: "Data Integration",
    description: "Import/export via Google Sheets CSV. Dynamic column mapping during import.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Webhook,
    title: "Webhooks & Automation",
    description: "Trigger external systems on events. Connect to Slack, custom endpoints, and more.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "In-app notifications, activity logs, and webhook-based message delivery.",
    color: "text-info",
    bgColor: "bg-info/10",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "Generate operational reports with filters by date, team, or project.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-background to-muted/30" aria-labelledby="features-heading">
      <div className="container px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-sm font-medium text-primary mb-4">
            Features
          </div>
          <h2 id="features-heading" className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Everything you need to{" "}
            <span className="text-gradient">manage operations</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From small teams to enterprise organizations, ManageX scales with your needs
            and adapts to any industry.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto" role="list">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="group relative p-6 bg-card rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 card-hover"
              style={{ animationDelay: `${index * 0.05}s` }}
              role="listitem"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`} aria-hidden="true">
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
