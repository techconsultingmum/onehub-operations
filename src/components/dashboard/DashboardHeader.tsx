import { Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const { user } = useAuth();
  
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Title */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-64 pl-9 bg-muted/50 border-transparent focus:border-border"
              aria-label="Search"
            />
          </div>

          {/* Notifications */}
          <NotificationBell />

          {/* User */}
          <Button variant="ghost" className="gap-2" aria-label={`User profile for ${displayName}`}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center" aria-hidden="true">
              <span className="text-sm font-medium text-primary">{initials}</span>
            </div>
            <span className="hidden md:inline text-sm font-medium">{displayName}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
