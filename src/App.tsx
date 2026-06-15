import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { toast } from "@/hooks/use-toast";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Tasks from "./pages/dashboard/Tasks";
import Team from "./pages/dashboard/Team";
import Reports from "./pages/dashboard/Reports";
import SettingsPage from "./pages/dashboard/Settings";
import DataImport from "./pages/dashboard/DataImport";
import Webhooks from "./pages/dashboard/Webhooks";
import Notifications from "./pages/dashboard/Notifications";
import Complaints from "./pages/dashboard/Complaints";
import SetupWizard from "./pages/dashboard/SetupWizard";
import ActivityLog from "./pages/dashboard/ActivityLog";
import NotFound from "./pages/NotFound";

// Don't retry auth/permission errors — they won't fix themselves
const NON_RETRYABLE_STATUS = new Set([400, 401, 403, 404, 422]);

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only surface errors for queries that have already rendered data once,
      // so first-load failures stay scoped to the page's own error UI.
      if (query.state.data !== undefined) {
        toast({
          title: "Couldn't refresh data",
          description: error instanceof Error ? error.message : "Please check your connection.",
          variant: "destructive",
        });
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error: unknown) => {
        const status = (error as { status?: number; code?: string })?.status;
        if (status && NON_RETRYABLE_STATUS.has(status)) return false;
        return failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
    mutations: {
      retry: 0,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <DashboardLayout />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardHome />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="team" element={<Team />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="import" element={<DataImport />} />
                <Route path="webhooks" element={<Webhooks />} />
                <Route path="complaints" element={<Complaints />} />
                <Route path="setup" element={<SetupWizard />} />
                <Route path="activity" element={<ActivityLog />} />
                <Route path="notifications" element={<Notifications />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
