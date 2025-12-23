import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import Claim from "./pages/Claim";
import Referrals from "./pages/Referrals";
import Mining from "./pages/Mining";
import Settings from "./pages/Settings";
import Tasks from "./pages/Tasks";
import XProfilePage from "./pages/XProfile";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Admin imports
import AdminLayout from "./components/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMiners from "./pages/admin/AdminMiners";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminControls from "./pages/admin/AdminControls";
import AdminMerkle from "./pages/admin/AdminMerkle";
import AdminClaims from "./pages/admin/AdminClaims";
import AdminAllocations from "./pages/admin/AdminAllocations";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
            <Route path="/leaderboard" element={<DashboardLayout><Leaderboard /></DashboardLayout>} />
            <Route path="/claim" element={<DashboardLayout><Claim /></DashboardLayout>} />
            <Route path="/referrals" element={<DashboardLayout><Referrals /></DashboardLayout>} />
            <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
            <Route path="/tasks" element={<DashboardLayout><Tasks /></DashboardLayout>} />
            <Route path="/x-profile" element={<DashboardLayout><XProfilePage /></DashboardLayout>} />
            <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
            <Route path="/mining" element={<Mining />} />
            
            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="miners" element={<AdminMiners />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="controls" element={<AdminControls />} />
              <Route path="merkle" element={<AdminMerkle />} />
              <Route path="claims" element={<AdminClaims />} />
              <Route path="allocations" element={<AdminAllocations />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
