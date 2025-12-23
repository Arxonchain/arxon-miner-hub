import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Dashboard from "./Dashboard";
import AuthDialog from "@/components/auth/AuthDialog";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  // Check for referral code in URL and show auth dialog for non-logged-in users
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
    
    // Show auth dialog if not logged in
    if (!loading && !user) {
      setShowAuthDialog(true);
    }
  }, [searchParams, user, loading]);

  return (
    <DashboardLayout>
      <Dashboard />
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
        initialReferralCode={referralCode}
      />
    </DashboardLayout>
  );
};

export default Index;
