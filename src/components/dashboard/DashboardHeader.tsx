import { Button } from "@/components/ui/button";
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
    <header className="sticky top-0 md:top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-14 md:h-16 px-4 md:px-6">
        {/* Title */}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 md:gap-4 ml-4">
          <NotificationBell />
          <Button variant="ghost" size="sm" className="gap-2 px-2 md:px-3" aria-label={`User profile for ${displayName}`}>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center" aria-hidden="true">
              <span className="text-xs md:text-sm font-medium text-primary">{initials}</span>
            </div>
            <span className="hidden lg:inline text-sm font-medium truncate max-w-[120px]">{displayName}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
