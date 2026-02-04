import {
  LayoutDashboard,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  FileSpreadsheet,
  Webhook,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Package,
  DollarSign,
  Heart,
  GraduationCap,
  Truck,
  Calendar,
  Utensils,
  FileText,
  Target,
  Building,
  MessageSquare,
  LucideIcon,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getIndustryLabel } from "@/lib/industry-config";

// Base navigation items shown for all users
const baseNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Data Import", href: "/dashboard/import", icon: FileSpreadsheet },
  { name: "Webhooks", href: "/dashboard/webhooks", icon: Webhook },
];

// Additional navigation items for specific management types
const managementNavItems: Record<string, { name: string; href: string; icon: LucideIcon }> = {
  inventory: { name: "Inventory", href: "/dashboard/tasks", icon: Package },
  sales: { name: "Sales", href: "/dashboard/reports", icon: DollarSign },
  patient: { name: "Patients", href: "/dashboard/tasks", icon: Heart },
  student: { name: "Students", href: "/dashboard/tasks", icon: GraduationCap },
  fleet: { name: "Fleet", href: "/dashboard/tasks", icon: Truck },
  booking: { name: "Bookings", href: "/dashboard/tasks", icon: Calendar },
  menu: { name: "Menu", href: "/dashboard/tasks", icon: Utensils },
  document: { name: "Documents", href: "/dashboard/tasks", icon: FileText },
  campaign: { name: "Campaigns", href: "/dashboard/tasks", icon: Target },
  facility: { name: "Facilities", href: "/dashboard/tasks", icon: Building },
  tenant: { name: "Tenants", href: "/dashboard/tasks", icon: Users },
  communication: { name: "Messages", href: "/dashboard/tasks", icon: MessageSquare },
};

const bottomNavigation = [
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onNavigate?: () => void;
}

export function DashboardSidebar({ collapsed, onToggle, isMobile, onNavigate }: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, role, configuration } = useAuth();
  const { toast } = useToast();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  // Build navigation items based on user's configuration
  const navigation = [...baseNavigation];
  
  // Note: Additional management-specific nav items can be added here
  // when those features are fully implemented
  // For now, the base navigation covers all core functionality

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar flex flex-col",
        isMobile ? "w-full" : "fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out",
        !isMobile && (collapsed ? "w-16" : "w-64")
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-lg text-white">ManageX</span>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={onToggle}
            className={cn(
              "p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground",
              collapsed && "mx-auto"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* User Info */}
      {(!collapsed || isMobile) && user && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {user.user_metadata?.full_name || user.email}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {role && (
              <span className="text-xs text-sidebar-foreground/60 capitalize">
                {role}
              </span>
            )}
            {configuration && (
              <span className="text-xs text-sidebar-foreground/40">
                • {getIndustryLabel(configuration.industry)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive(item.href)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || isMobile) && <span>{item.name}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="py-4 px-3 border-t border-sidebar-border">
        <div className="space-y-1">
          {bottomNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive(item.href)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || isMobile) && <span>{item.name}</span>}
            </NavLink>
          ))}
          
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              !isMobile && collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(!collapsed || isMobile) && <span>Log out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
