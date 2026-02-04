import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirming your email...");

  useEffect(() => {
    const confirmEmail = async () => {
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const code = searchParams.get("code");
      const next = searchParams.get("next") || "/";

      // Handle PKCE code exchange
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setStatus("error");
            setMessage(error.message || "Failed to confirm. Please try again.");
            return;
          }
          
          // Check if this is a recovery flow
          if (type === "recovery") {
            setStatus("success");
            setMessage("Link verified! Redirecting to password reset...");
            setTimeout(() => navigate("/reset-password"), 1500);
            return;
          }
          
          setStatus("success");
          setMessage("Email confirmed successfully! Redirecting...");
          setTimeout(() => navigate(next), 2000);
          return;
        } catch (err) {
          setStatus("error");
          setMessage("An unexpected error occurred. Please try again.");
          return;
        }
      }

      // Handle token_hash verification
      if (!token_hash || !type) {
        setStatus("error");
        setMessage("Invalid confirmation link. Please request a new one.");
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as "signup" | "email" | "recovery" | "invite",
        });

        if (error) {
          setStatus("error");
          setMessage(error.message || "Failed to confirm email. Please try again.");
          return;
        }
        
        // If this is a recovery/password reset, redirect to reset page
        if (type === "recovery") {
          setStatus("success");
          setMessage("Link verified! Redirecting to password reset...");
          setTimeout(() => navigate("/reset-password"), 1500);
          return;
        }
        
        setStatus("success");
        setMessage("Email confirmed successfully! Redirecting...");
        setTimeout(() => navigate(next), 2000);
      } catch (err) {
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again.");
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">{message}</h1>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">{message}</h1>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">{message}</h1>
            <button
              onClick={() => navigate("/auth")}
              className="text-primary hover:underline"
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthConfirm;
