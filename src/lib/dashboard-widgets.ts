// Dashboard Widget Configuration
// Defines which widgets to show for each management type

import { 
  CheckSquare, Users, TrendingUp, Clock, Package, 
  DollarSign, BarChart3, FileText, Truck, Calendar,
  UserCheck, GraduationCap, Utensils, Building, Heart,
  MessageSquare, Target, ShieldCheck, Briefcase, Settings,
  LucideIcon
} from "lucide-react";

export interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  type: "stats" | "chart" | "list" | "action";
  size: "sm" | "md" | "lg";
}

// Widget definitions
export const widgetDefinitions: Record<string, DashboardWidget> = {
  // Task & Project widgets
  tasks_overview: {
    id: "tasks_overview",
    title: "Tasks Overview",
    description: "View and manage your tasks",
    icon: CheckSquare,
    type: "stats",
    size: "md",
  },
  project_progress: {
    id: "project_progress",
    title: "Project Progress",
    description: "Track project milestones",
    icon: TrendingUp,
    type: "chart",
    size: "lg",
  },
  
  // Team widgets
  team_overview: {
    id: "team_overview",
    title: "Team Members",
    description: "Your team at a glance",
    icon: Users,
    type: "stats",
    size: "md",
  },
  team_workload: {
    id: "team_workload",
    title: "Team Workload",
    description: "Workload distribution",
    icon: BarChart3,
    type: "chart",
    size: "lg",
  },
  
  // Resource widgets
  resource_allocation: {
    id: "resource_allocation",
    title: "Resource Allocation",
    description: "Track resource usage",
    icon: Settings,
    type: "chart",
    size: "lg",
  },
  
  // Inventory widgets
  inventory_levels: {
    id: "inventory_levels",
    title: "Inventory Levels",
    description: "Stock levels and alerts",
    icon: Package,
    type: "stats",
    size: "md",
  },
  low_stock_alerts: {
    id: "low_stock_alerts",
    title: "Low Stock Alerts",
    description: "Items needing restock",
    icon: Package,
    type: "list",
    size: "md",
  },
  
  // Sales & CRM widgets
  sales_metrics: {
    id: "sales_metrics",
    title: "Sales Metrics",
    description: "Revenue and sales data",
    icon: DollarSign,
    type: "stats",
    size: "md",
  },
  customer_overview: {
    id: "customer_overview",
    title: "Customer Overview",
    description: "Customer relationships",
    icon: Users,
    type: "stats",
    size: "md",
  },
  sales_pipeline: {
    id: "sales_pipeline",
    title: "Sales Pipeline",
    description: "Deal stages and conversion",
    icon: TrendingUp,
    type: "chart",
    size: "lg",
  },
  
  // Finance widgets
  financial_summary: {
    id: "financial_summary",
    title: "Financial Summary",
    description: "Revenue and expenses",
    icon: DollarSign,
    type: "stats",
    size: "md",
  },
  cash_flow: {
    id: "cash_flow",
    title: "Cash Flow",
    description: "Income vs expenses",
    icon: TrendingUp,
    type: "chart",
    size: "lg",
  },
  
  // Operations widgets
  operations_status: {
    id: "operations_status",
    title: "Operations Status",
    description: "Daily operations overview",
    icon: Settings,
    type: "stats",
    size: "md",
  },
  
  // Quality widgets
  quality_metrics: {
    id: "quality_metrics",
    title: "Quality Metrics",
    description: "Quality control stats",
    icon: ShieldCheck,
    type: "stats",
    size: "md",
  },
  
  // Compliance widgets
  compliance_status: {
    id: "compliance_status",
    title: "Compliance Status",
    description: "Regulatory compliance",
    icon: ShieldCheck,
    type: "stats",
    size: "md",
  },
  
  // Supply chain widgets
  supply_chain_status: {
    id: "supply_chain_status",
    title: "Supply Chain",
    description: "Logistics overview",
    icon: Truck,
    type: "stats",
    size: "md",
  },
  
  // Vendor widgets
  vendor_performance: {
    id: "vendor_performance",
    title: "Vendor Performance",
    description: "Supplier metrics",
    icon: Briefcase,
    type: "chart",
    size: "md",
  },
  
  // Facility widgets
  facility_status: {
    id: "facility_status",
    title: "Facility Status",
    description: "Building and equipment",
    icon: Building,
    type: "stats",
    size: "md",
  },
  
  // Time widgets
  time_tracking: {
    id: "time_tracking",
    title: "Time Tracking",
    description: "Hours and attendance",
    icon: Clock,
    type: "stats",
    size: "md",
  },
  attendance_summary: {
    id: "attendance_summary",
    title: "Attendance Summary",
    description: "Team attendance",
    icon: UserCheck,
    type: "chart",
    size: "md",
  },
  
  // Performance widgets
  performance_metrics: {
    id: "performance_metrics",
    title: "Performance Metrics",
    description: "Team performance",
    icon: Target,
    type: "chart",
    size: "lg",
  },
  
  // Document widgets
  recent_documents: {
    id: "recent_documents",
    title: "Recent Documents",
    description: "Latest files",
    icon: FileText,
    type: "list",
    size: "md",
  },
  
  // Communication widgets
  recent_messages: {
    id: "recent_messages",
    title: "Recent Messages",
    description: "Team communications",
    icon: MessageSquare,
    type: "list",
    size: "md",
  },
  
  // Healthcare widgets
  patient_overview: {
    id: "patient_overview",
    title: "Patient Overview",
    description: "Patient statistics",
    icon: Heart,
    type: "stats",
    size: "md",
  },
  appointments_today: {
    id: "appointments_today",
    title: "Today's Appointments",
    description: "Scheduled appointments",
    icon: Calendar,
    type: "list",
    size: "md",
  },
  
  // Education widgets
  student_overview: {
    id: "student_overview",
    title: "Student Overview",
    description: "Student statistics",
    icon: GraduationCap,
    type: "stats",
    size: "md",
  },
  curriculum_progress: {
    id: "curriculum_progress",
    title: "Curriculum Progress",
    description: "Course completion",
    icon: TrendingUp,
    type: "chart",
    size: "lg",
  },
  
  // Fleet widgets
  fleet_status: {
    id: "fleet_status",
    title: "Fleet Status",
    description: "Vehicle tracking",
    icon: Truck,
    type: "stats",
    size: "md",
  },
  
  // Booking widgets
  bookings_today: {
    id: "bookings_today",
    title: "Today's Bookings",
    description: "Reservations",
    icon: Calendar,
    type: "list",
    size: "md",
  },
  
  // Menu widgets
  menu_items: {
    id: "menu_items",
    title: "Menu Items",
    description: "Active menu items",
    icon: Utensils,
    type: "stats",
    size: "md",
  },
  
  // Content widgets
  content_overview: {
    id: "content_overview",
    title: "Content Overview",
    description: "Published content",
    icon: FileText,
    type: "stats",
    size: "md",
  },
  
  // Campaign widgets
  campaign_performance: {
    id: "campaign_performance",
    title: "Campaign Performance",
    description: "Marketing metrics",
    icon: Target,
    type: "chart",
    size: "lg",
  },
  
  // Tenant widgets
  tenant_overview: {
    id: "tenant_overview",
    title: "Tenant Overview",
    description: "Property tenants",
    icon: Users,
    type: "stats",
    size: "md",
  },
  lease_status: {
    id: "lease_status",
    title: "Lease Status",
    description: "Active leases",
    icon: FileText,
    type: "list",
    size: "md",
  },
};

// Mapping of management types to their widgets
export const managementTypeWidgets: Record<string, string[]> = {
  project: ["tasks_overview", "project_progress", "team_overview", "recent_documents"],
  task: ["tasks_overview", "team_overview", "time_tracking"],
  team: ["team_overview", "team_workload", "performance_metrics", "time_tracking"],
  resource: ["resource_allocation", "team_workload", "operations_status"],
  inventory: ["inventory_levels", "low_stock_alerts", "supply_chain_status", "vendor_performance"],
  crm: ["customer_overview", "sales_pipeline", "recent_messages", "tasks_overview"],
  sales: ["sales_metrics", "sales_pipeline", "customer_overview", "performance_metrics"],
  finance: ["financial_summary", "cash_flow", "compliance_status"],
  operations: ["operations_status", "team_overview", "tasks_overview", "time_tracking"],
  quality: ["quality_metrics", "compliance_status", "tasks_overview"],
  compliance: ["compliance_status", "recent_documents", "quality_metrics"],
  "supply-chain": ["supply_chain_status", "inventory_levels", "vendor_performance", "fleet_status"],
  vendor: ["vendor_performance", "compliance_status", "recent_documents"],
  facility: ["facility_status", "tasks_overview", "inventory_levels"],
  time: ["time_tracking", "attendance_summary", "team_overview"],
  performance: ["performance_metrics", "team_overview", "tasks_overview"],
  document: ["recent_documents", "tasks_overview"],
  communication: ["recent_messages", "team_overview"],
  patient: ["patient_overview", "appointments_today", "team_overview", "compliance_status"],
  staff: ["team_overview", "time_tracking", "attendance_summary", "performance_metrics"],
  student: ["student_overview", "curriculum_progress", "performance_metrics"],
  curriculum: ["curriculum_progress", "student_overview", "recent_documents"],
  fleet: ["fleet_status", "operations_status", "compliance_status"],
  booking: ["bookings_today", "customer_overview", "sales_metrics"],
  menu: ["menu_items", "inventory_levels", "sales_metrics"],
  content: ["content_overview", "campaign_performance", "recent_documents"],
  campaign: ["campaign_performance", "customer_overview", "sales_metrics"],
  tenant: ["tenant_overview", "lease_status", "financial_summary", "facility_status"],
};

// Get widgets for a management type
export function getWidgetsForManagementType(managementType: string): DashboardWidget[] {
  const widgetIds = managementTypeWidgets[managementType] || ["tasks_overview", "team_overview"];
  return widgetIds
    .map(id => widgetDefinitions[id])
    .filter(Boolean);
}

// Get widgets for multiple management types (with deduplication)
export function getWidgetsForManagementTypes(types: string[]): DashboardWidget[] {
  const widgetSet = new Set<string>();
  
  types.forEach(type => {
    const widgetIds = managementTypeWidgets[type] || [];
    widgetIds.forEach(id => widgetSet.add(id));
  });
  
  return Array.from(widgetSet)
    .map(id => widgetDefinitions[id])
    .filter(Boolean);
}
