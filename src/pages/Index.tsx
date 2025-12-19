import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Dashboard from "./Dashboard";
import AuthDialog from "@/components/auth/AuthDialog";

const Index = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Show auth dialog when the page loads (user visits the domain)
  useEffect(() => {
    setShowAuthDialog(true);
  }, []);

  return (
    <DashboardLayout>
      <Dashboard />
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </DashboardLayout>
  );
};

export default Index;
