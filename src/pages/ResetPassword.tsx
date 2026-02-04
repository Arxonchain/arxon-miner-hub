import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import arxonLogo from "@/assets/arxon-logo.jpg";

/**
 * Parse all possible recovery URL formats from Supabase:
 * 1. Hash fragment: #access_token=xxx&refresh_token=xxx&type=recovery
 * 2. Token hash: ?token_hash=xxx&type=recovery
 * 3. PKCE code: ?code=xxx
 * 4. Legacy token: ?token=xxx&type=recovery
 */
function parseRecoveryParams() {
  const rawHash = window.location.hash || "";
  const hash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  const hashParams = new URLSearchParams(hash);
  const searchParams = new URLSearchParams(window.location.search);

  return {
    type: (hashParams.get("type") || searchParams.get("type") || "").toLowerCase(),
    accessToken: hashParams.get("access_token") || searchParams.get("access_token"),
    refreshToken: hashParams.get("refresh_token") || searchParams.get("refresh_token"),
    code: searchParams.get("code") || hashParams.get("code"),
    tokenHash: searchParams.get("token_hash") || hashParams.get("token_hash") || searchParams.get("token"),
  };
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const recover = async () => {
      console.log("ResetPassword: Attempting to recover session...");
      const params = parseRecoveryParams();

      // Check if we already have a valid session (e.g., from PASSWORD_RECOVERY event)
      const { data: existingSession } = await supabase.auth.getSession();
      if (existingSession.session) {
        console.log("ResetPassword: Session already exists");
        if (!cancelled) {
          setSessionReady(true);
          setLoading(false);
          // Clean URL
          window.history.replaceState(null, "", "/reset-password");
        }
        return;
      }

      // Determine if this looks like a recovery link
      const looksLikeRecovery =
        params.type === "recovery" ||
        Boolean(params.code) ||
        Boolean(params.tokenHash) ||
        Boolean(params.accessToken);

      if (!looksLikeRecovery) {
        // No recovery params - maybe user navigated here directly
        // Check if there's an active session anyway
        if (!cancelled) {
          setErrorMessage("No reset link detected. Please use the link from your email.");
          setLoading(false);
        }
        return;
      }

      try {
        // Try different methods to establish session
        if (params.accessToken && params.refreshToken) {
          // Hash fragment with tokens
          console.log("ResetPassword: Setting session from tokens");
          const { error } = await supabase.auth.setSession({
            access_token: params.accessToken,
            refresh_token: params.refreshToken,
          });
          if (error) throw error;
        } else if (params.code) {
          // PKCE flow
          console.log("ResetPassword: Exchanging code for session");
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) throw error;
        } else if (params.tokenHash) {
          // Token hash (newer Supabase format)
          console.log("ResetPassword: Verifying OTP with token_hash");
          const { error } = await supabase.auth.verifyOtp({
            token_hash: params.tokenHash,
            type: "recovery",
          });
          if (error) throw error;
        }

        // Verify session was established
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          console.log("ResetPassword: Session established successfully");
          if (!cancelled) {
            setSessionReady(true);
            setLoading(false);
            // Clean URL
            window.history.replaceState(null, "", "/reset-password");
          }
        } else {
          throw new Error("Failed to establish session");
        }
      } catch (err: any) {
        console.error("ResetPassword: Recovery error:", err.message);
        if (!cancelled) {
          setErrorMessage("This reset link has expired or is invalid. Please request a new one.");
          setLoading(false);
        }
      }
    };

    // Listen for PASSWORD_RECOVERY event (Supabase may handle it automatically)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      
      if (event === "PASSWORD_RECOVERY" && session) {
        console.log("ResetPassword: PASSWORD_RECOVERY event received");
        setSessionReady(true);
        setLoading(false);
        window.history.replaceState(null, "", "/reset-password");
      }
    });

    recover();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-foreground">Verifying reset link...</p>
      </div>
    );
  }

  if (!sessionReady && errorMessage) {
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
            <p className="text-center text-muted-foreground">{errorMessage}</p>
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
          {errorMessage && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="New password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={updating}
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={updating}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>

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
