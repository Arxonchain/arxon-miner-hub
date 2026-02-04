import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import arxonLogo from "@/assets/arxon-logo.jpg";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

/**
 * Allows an already-authenticated user to set a new password.
 * Users reach this page after clicking a magic link when they forgot their password.
 */
export default function ChangePassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReset = async (password: string, confirmPassword: string) => {
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      return;
    }

    setUpdating(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: password.trim() });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });

      // Stay logged in and redirect to dashboard
      navigate("/");
    } catch (err: any) {
      console.error("ChangePassword error:", err.message);
      setErrorMessage(err.message || "Failed to update password. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  // Loading state while auth resolves
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in, prompt them to sign in first
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={arxonLogo} alt="ARXON Logo" className="h-16 w-16 rounded-full border-2 border-accent" />
            </div>
            <CardTitle className="text-xl">Not logged in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              You need to be logged in to change your password. If you received a magic link, click it to sign in first.
            </p>
            <button
              onClick={() => navigate("/auth?mode=signin")}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Go to Sign In
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={arxonLogo} alt="ARXON Logo" className="h-16 w-16 rounded-full border-2 border-accent" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="h-6 w-6 text-accent" />
            <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
          </div>

          <CardDescription>
            Enter a new password for your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <ResetPasswordForm updating={updating} errorMessage={errorMessage} onSubmit={handleReset} />

          <div className="text-center text-sm">
            <button
              onClick={() => navigate("/")}
              className="text-primary hover:underline"
            >
              Cancel &amp; go to dashboard
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
