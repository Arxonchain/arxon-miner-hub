import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import arxonLogo from "@/assets/arxon-logo.jpg";

function sanitizeNext(nextRaw: string | null): string {
  if (!nextRaw) return "/reset-password";

  // Prefer relative paths.
  if (nextRaw.startsWith("/")) return nextRaw;

  // Allow absolute URLs only if they match our current origin.
  try {
    const url = new URL(nextRaw);
    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}` || "/reset-password";
    }
  } catch {
    // ignore
  }

  return "/reset-password";
}

export default function AuthConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const next = useMemo(() => sanitizeNext(searchParams.get("next")), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const token_hash = searchParams.get("token_hash");
      const type = (searchParams.get("type") || "") as EmailOtpType;

      if (!token_hash || !type) {
        if (cancelled) return;
        setErrorMessage("Missing recovery token. Please request a new reset link.");
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type,
        });

        if (error) {
          if (cancelled) return;
          setErrorMessage(error.message || "Invalid or expired link. Please request a new one.");
          toast({
            title: "Invalid or Expired Link",
            description: "Please request a new password reset link.",
            variant: "destructive",
          });
          return;
        }

        if (cancelled) return;
        navigate(next, { replace: true });
      } catch (e) {
        if (cancelled) return;
        setErrorMessage("Something went wrong verifying the link. Please request a new reset link.");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate, next, searchParams, toast]);

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
          ) : (
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="h-6 w-6 text-accent" />
              <CardTitle className="text-2xl font-bold">Verifying Link</CardTitle>
            </div>
          )}

          <CardDescription>
            {errorMessage
              ? "We couldn't verify this reset link."
              : "Hang tight—redirecting you to reset your password."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMessage ? (
            <>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <Button onClick={() => navigate("/auth?mode=forgot")} className="w-full">
                Request a new reset link
              </Button>
              <button
                type="button"
                onClick={() => navigate("/auth?mode=signin")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to Sign In
              </button>
            </>
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
