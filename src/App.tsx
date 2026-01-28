import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PointsProvider } from "@/hooks/usePoints";
import BackendHealthBanner from "@/components/system/BackendHealthBanner";
import SessionRecovery from "@/components/system/SessionRecovery";
import MaintenanceBanner from "@/components/system/MaintenanceBanner";
import ErrorBoundary from "@/components/system/ErrorBoundary";
import { BackendUnavailableError } from "@/lib/backendHealth";
import Index from "./pages/Index";
import DashboardLayout from "./components/layout/DashboardLayout";
import PublicLeaderboard from "./pages/PublicLeaderboard";
import Claim from "./pages/Claim";
import Referrals from "./pages/Referrals";
import Mining from "./pages/Mining";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Arena from "./pages/Arena";
import WalletPage from "./pages/Wallet";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import Auth from "./pages/Auth";

// Admin imports
import AdminLayout from "./components/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminControls from "./pages/admin/AdminControls";
import AdminSignups from "./pages/admin/AdminSignups";
import AdminReconciliation from "./pages/admin/AdminReconciliation";
import AdminArena from "./pages/admin/AdminArena";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof BackendUnavailableError) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex, error) => {
        if (error instanceof BackendUnavailableError) return error.retryAfterMs;
        return Math.min(1000 * 2 ** attemptIndex, 30_000);
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 5_000,
    },
    mutations: {
      retry: (failureCount, error) => {
        if (error instanceof BackendUnavailableError) return false;
        return failureCount < 1;
      },
      retryDelay: (attemptIndex, error) => {
        if (error instanceof BackendUnavailableError) return error.retryAfterMs;
        return Math.min(1000 * 2 ** attemptIndex, 15_000);
      },
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PointsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BackendHealthBanner />
            <MaintenanceBanner />
            <SessionRecovery />
            <BrowserRouter>
              <Routes>
                {/* Landing/Dashboard - shows Landing for unauthenticated, Dashboard for authenticated */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/leaderboard" element={<PublicLeaderboard />} />
                <Route path="/claim" element={<DashboardLayout><Claim /></DashboardLayout>} />
                <Route path="/referrals" element={<DashboardLayout><Referrals /></DashboardLayout>} />
                <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
                <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
                <Route path="/mining" element={<Mining />} />
                <Route path="/arena" element={<Arena />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Admin routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="signups" element={<AdminSignups />} />
                  <Route path="controls" element={<AdminControls />} />
                  <Route path="arena" element={<AdminArena />} />
                  <Route path="reconciliation" element={<AdminReconciliation />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </PointsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
