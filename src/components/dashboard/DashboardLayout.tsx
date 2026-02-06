import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border z-50 flex items-center px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
              <VisuallyHidden>
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>Main navigation menu for the dashboard</SheetDescription>
              </VisuallyHidden>
              <DashboardSidebar
                collapsed={false}
                onToggle={() => setMobileOpen(false)}
                isMobile
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-white">ManageX</span>
          </div>
        </header>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <DashboardSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      )}
      
      <main
        id="main-content"
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen",
          isMobile ? "ml-0 pt-14" : (collapsed ? "ml-16" : "ml-64")
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
