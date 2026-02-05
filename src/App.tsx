import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Create browser router with future flags to eliminate deprecation warnings
const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Landing />,
    },
    {
      path: "/auth",
      element: <Auth />,
    },
    {
      path: "/onboarding",
      element: (
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      ),
    },
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <ErrorBoundary>
            <DashboardLayout />
          </ErrorBoundary>
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <DashboardHome /> },
        { path: "tasks", element: <Tasks /> },
        { path: "team", element: <Team /> },
        { path: "reports", element: <Reports /> },
        { path: "settings", element: <SettingsPage /> },
        { path: "import", element: <DataImport /> },
        { path: "webhooks", element: <Webhooks /> },
        { path: "notifications", element: <Notifications /> },
      ],
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
