import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

/**
 * Handles all auth callbacks from email links (confirmation, recovery, magic links).
 * This page processes the tokens and redirects appropriately.
 */
const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing...");

  useEffect(() => {
    const processAuthCallback = async () => {
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const code = searchParams.get("code");
      const next = searchParams.get("next") || "/";

      // Handle hash fragment tokens (implicit flow)
      const hash = window.location.hash.slice(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashType = hashParams.get("type");

      console.log("AuthConfirm: Processing callback", { 
        hasTokenHash: !!token_hash, 
        type, 
        hasCode: !!code, 
        hasAccessToken: !!accessToken,
        hashType
      });

      // 1. Handle hash-based tokens (access_token + refresh_token in hash)
      if (accessToken && refreshToken) {
        try {
          setMessage("Verifying your credentials...");
          
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("AuthConfirm: setSession error:", error);
            setStatus("error");
            setMessage(error.message || "Failed to verify. Please try again.");
            return;
          }

          // Check if this is a recovery flow
          if ((type || hashType)?.toLowerCase() === "recovery") {
            setStatus("success");
            setMessage("Verified! Redirecting to password reset...");
            setTimeout(() => navigate("/reset-password"), 800);
            return;
          }

          setStatus("success");
          setMessage("Verified! Redirecting...");
          setTimeout(() => navigate(next), 1000);
          return;
        } catch (err) {
          console.error("AuthConfirm: Hash token error:", err);
          setStatus("error");
          setMessage("An error occurred. Please try again.");
          return;
        }
      }

      // 2. Handle PKCE code exchange
      if (code) {
        try {
          setMessage("Exchanging code...");
          
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error("AuthConfirm: Code exchange error:", error);
            setStatus("error");
            setMessage(error.message || "Failed to verify. Please try again.");
            return;
          }

          // Check if this is a recovery flow
          if (type?.toLowerCase() === "recovery") {
            setStatus("success");
            setMessage("Verified! Redirecting to password reset...");
            setTimeout(() => navigate("/reset-password"), 800);
            return;
          }

          setStatus("success");
          setMessage("Verified! Redirecting...");
          setTimeout(() => navigate(next), 1000);
          return;
        } catch (err) {
          console.error("AuthConfirm: Code exchange error:", err);
          setStatus("error");
          setMessage("An error occurred. Please try again.");
          return;
        }
      }

      // 3. Handle token_hash verification
      if (token_hash && type) {
        try {
          setMessage("Verifying link...");
          
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as "signup" | "email" | "recovery" | "invite",
          });

          if (error) {
            console.error("AuthConfirm: verifyOtp error:", error);
            setStatus("error");
            setMessage(error.message || "Failed to verify. Please try again.");
            return;
          }

          // Check if this is a recovery flow
          if (type.toLowerCase() === "recovery") {
            setStatus("success");
            setMessage("Verified! Redirecting to password reset...");
            setTimeout(() => navigate("/reset-password"), 800);
            return;
          }

          setStatus("success");
          setMessage("Email confirmed! Redirecting...");
          setTimeout(() => navigate(next), 1500);
          return;
        } catch (err) {
          console.error("AuthConfirm: verifyOtp exception:", err);
          setStatus("error");
          setMessage("An error occurred. Please try again.");
          return;
        }
      }

      // 4. No valid params found - check if we have an existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Already have a session, just redirect
        if (type?.toLowerCase() === "recovery") {
          setStatus("success");
          setMessage("Session found! Redirecting to password reset...");
          setTimeout(() => navigate("/reset-password"), 500);
          return;
        }
        
        setStatus("success");
        setMessage("Already signed in! Redirecting...");
        setTimeout(() => navigate(next), 500);
        return;
      }

      // No valid parameters and no session
      setStatus("error");
      setMessage("Invalid or expired link. Please request a new one.");
    };

    processAuthCallback();
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
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">{message}</h1>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">{message}</h1>
            <button
              onClick={() => navigate("/auth?mode=forgot")}
              className="text-primary hover:underline"
            >
              Request a new link
            </button>
            <br />
            <button
              onClick={() => navigate("/auth")}
              className="text-muted-foreground hover:underline text-sm"
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
