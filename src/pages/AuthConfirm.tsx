import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck, TriangleAlert, Lock } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import arxonLogo from "@/assets/arxon-logo.jpg";

function sanitizeNext(nextRaw: string | null): string {
  if (!nextRaw) return "/";

  if (nextRaw.startsWith("/")) return nextRaw;

  try {
    const url = new URL(nextRaw);
    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}` || "/";
    }
  } catch {}

  return "/";
}

export default function AuthConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verified, setVerified] = useState(false);

  const next = useMemo(() => sanitizeNext(searchParams.get("next")), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      console.log("[AUTH CONFIRM] === PAGE LOADED ===");
      console.log("[AUTH CONFIRM] URL:", window.location.href);
      console.log("[AUTH CONFIRM] Params:", Object.fromEntries(searchParams.entries()));

      const rawToken = searchParams.get("token");
      const rawTokenHash = searchParams.get("token_hash");
      const rawType = searchParams.get("type");

      const token = rawToken || rawTokenHash;
      const type = rawType?.toLowerCase() as EmailOtpType | null;

      console.log("[AUTH CONFIRM] Parsed:", { token: token ? token.substring(0, 10) + '...' : null, type });

      if (!token || !type) {
        console.log("[AUTH CONFIRM] Missing token or type");
        setErrorMessage("Missing recovery token or type.");
        setLoading(false);
        return;
      }

      console.log("[AUTH CONFIRM] Calling verifyOtp");

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type,
        });

        console.log("[AUTH CONFIRM] verifyOtp result:", {
          data: data ? JSON.stringify(data) : 'null',
          error: error ? error.message : 'null'
        });

        // Success if NO error (even if data is empty/null - common for recovery)
        if (error) {
          console.log("[AUTH CONFIRM] verifyOtp ERROR:", error.message);
          setErrorMessage(error.message || "Invalid or expired link.");
          toast({
            title: "Verification Failed",
            description: error.message || "Request a new link.",
            variant: "destructive",
          });
        } else {
          console.log("[AUTH CONFIRM] verifyOtp SUCCESS (no error)");
          setVerified(true);
          setSuccessMessage("Link verified! Set your new password.");
        }
      } catch (e: any) {
        console.error("[AUTH CONFIRM] verifyOtp EXCEPTION:", e.message || e);
        setErrorMessage("Unexpected verification error.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [searchParams, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
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

    setLoading(true);

    try {
      console.log("[AUTH CONFIRM] updateUser called");
      const { error } = await supabase.auth.updateUser({
        password: password.trim(),
      });

      if (error) throw error;

      console.log("[AUTH CONFIRM] updateUser SUCCESS");
      toast({
        title: "Success",
        description: "Password reset complete. Sign in now.",
      });

      navigate("/auth?mode=signin", { replace: true });
    } catch (err: any) {
      console.error("[AUTH CONFIRM] updateUser error:", err.message);
      setErrorMessage(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src={arxonLogo}
              alt="ARXON Logo"
              className="h-16 w-16 rounded-full border-2 border-accent"
            />
          </div>

          {errorMessage ? (
            <div className="flex items-center justify-center gap-2 mb-2">
              <TriangleAlert className="h-6 w-6 text-destructive" />
              <CardTitle className="text-2xl font-bold">Link Error</CardTitle>
            </div>
          ) : verified ? (
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="h-6 w-6 text-accent" />
              <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="h-6 w-6 text-accent" />
              <CardTitle className="text-2xl font-bold">Verifying Link</CardTitle>
            </div>
          )}

          <CardDescription>
            {errorMessage
              ? "We couldn't verify this reset link."
              : verified
              ? "Your link is valid. Choose a strong new password."
              : successMessage || "Hang tight—verifying your reset link..."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {errorMessage ? (
            <>
              <p className="text-sm text-destructive text-center">{errorMessage}</p>
              <Button onClick={() => navigate("/auth?mode=forgot")} className="w-full">
                Request a new reset link
              </Button>
              <button
                type="button"
                onClick={() => navigate("/auth?mode=signin")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center block"
              >
                Back to Sign In
              </button>
            </>
          ) : verified ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
              <p className="text-muted-foreground">Verifying your reset link...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}