import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePasswordRecoverySession } from "@/hooks/usePasswordRecoverySession";
import { looksLikeRecoveryLink } from "@/lib/auth/recoveryUrl";
import arxonLogo from "@/assets/arxon-logo.jpg";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import RecoveryEmailVerifyForm from "@/components/auth/RecoveryEmailVerifyForm";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const { checking, isValidSession, establishError, params, requiresEmail, verifyTokenWithEmail } =
    usePasswordRecoverySession();
  const looksLikeRecovery = useMemo(() => (params ? looksLikeRecoveryLink(params) : false), [params]);

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
      console.log("ResetPassword: Updating password...");
      const { error } = await supabase.auth.updateUser({
        password: password.trim(),
      });

      if (error) throw error;

      console.log("ResetPassword: Password updated successfully");

      // Refresh session after password change
      await supabase.auth.refreshSession();

      // Sign out to clear recovery session
      await supabase.auth.signOut();

      toast({
        title: "Password Reset Complete",
        description: "Your password has been updated. Please sign in with your new password.",
      });

      navigate("/auth?mode=signin");
    } catch (err: any) {
      console.error("ResetPassword: Update error:", err.message);
      setErrorMessage(err.message || "Failed to reset password. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (checking && !requiresEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-foreground">Verifying reset link...</p>
      </div>
    );
  }

  if (!isValidSession) {
    if (requiresEmail && params?.token) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img src={arxonLogo} alt="ARXON Logo" className="h-16 w-16 rounded-full border-2 border-accent" />
              </div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <Lock className="h-6 w-6 text-accent" />
                <CardTitle className="text-2xl font-bold">Confirm Email</CardTitle>
              </div>
              <CardDescription>
                This reset link requires your email address to verify. After verification, you can set a new password.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <RecoveryEmailVerifyForm
                verifying={checking}
                errorMessage={establishError}
                onVerify={verifyTokenWithEmail}
              />

              <details className="rounded-md border border-border/60 bg-secondary/30 p-3 text-sm">
                <summary className="cursor-pointer select-none text-foreground">Details</summary>
                <div className="mt-2 space-y-2 text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Detected params:</span>{" "}
                    {JSON.stringify(
                      {
                        type: params?.type,
                        hasCode: Boolean(params?.code),
                        hasTokenHash: Boolean(params?.tokenHash),
                        hasToken: Boolean(params?.token),
                        hasAccessToken: Boolean(params?.accessToken),
                      },
                      null,
                      2
                    )}
                  </p>
                </div>
              </details>

              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate("/auth?mode=forgot")} className="w-full">
                  Request New Reset Link
                </Button>
                <Button variant="outline" onClick={() => navigate("/auth?mode=signin")} className="w-full">
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    const primaryError =
      errorMessage ||
      (looksLikeRecovery
        ? (establishError || "This reset link has expired or is invalid. Please request a new one.")
        : "No reset link detected. Please use the link from your email.");

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={arxonLogo} alt="ARXON Logo" className="h-16 w-16 rounded-full border-2 border-accent" />
            </div>
            <CardTitle className="text-xl text-destructive">Reset Link Invalid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">{primaryError}</p>

            {(establishError || looksLikeRecovery) && (
              <details className="rounded-md border border-border/60 bg-secondary/30 p-3 text-sm">
                <summary className="cursor-pointer select-none text-foreground">Details</summary>
                <div className="mt-2 space-y-2 text-muted-foreground">
                  {establishError && (
                    <p>
                      <span className="font-medium text-foreground">Auth error:</span> {establishError}
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-foreground">Detected params:</span>{" "}
                    {JSON.stringify(
                      {
                        type: params?.type,
                        hasCode: Boolean(params?.code),
                        hasTokenHash: Boolean(params?.tokenHash),
                        hasToken: Boolean(params?.token),
                        hasAccessToken: Boolean(params?.accessToken),
                      },
                      null,
                      2
                    )}
                  </p>
                </div>
              </details>
            )}

            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/auth?mode=forgot")} className="w-full">
                Request New Reset Link
              </Button>
              <Button variant="outline" onClick={() => navigate("/auth?mode=signin")} className="w-full">
                Back to Sign In
              </Button>
            </div>
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
            <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
          </div>

          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <ResetPasswordForm updating={updating} errorMessage={errorMessage} onSubmit={handleReset} />

          <div className="text-center text-sm">
            <button
              onClick={() => navigate("/auth?mode=signin")}
              className="text-primary hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
