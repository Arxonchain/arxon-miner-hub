import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck, TriangleAlert, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import arxonLogo from "@/assets/arxon-logo.jpg";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const type = searchParams.get("type")?.toLowerCase();

    console.log("ResetPassword page loaded with params:", { token, type });

    if (!token || type !== "recovery") {
      setErrorMessage("Invalid reset link. Please request a new one.");
      setLoading(false);
      return;
    }

    const verifyLink = async () => {
      try {
        console.log("Calling verifyOtp...");
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "recovery",
        });

        if (error) {
          console.log("verifyOtp error:", error.message);
          setErrorMessage(error.message || "Invalid or expired link.");
          toast({
            title: "Verification Failed",
            description: error.message || "Please request a new link.",
            variant: "destructive",
          });
        } else {
          console.log("verifyOtp success");
          setVerified(true);
        }
      } catch (e) {
        console.error("verifyOtp exception:", e);
        setErrorMessage("Verification error. Try a new link.");
      } finally {
        setLoading(false);
      }
    };

    verifyLink();
  }, [searchParams, toast]);

  const handleReset = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password too short (min 8 characters)");
      return;
    }

    setLoading(true);

    try {
      console.log("Calling updateUser...");
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      console.log("Password reset success");
      toast({
        title: "Success",
        description: "Password reset complete. Sign in now.",
      });

      navigate("/auth?mode=signin");
    } catch (err) {
      console.error("updateUser error:", err);
      setErrorMessage("Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
        <p className="ml-4 text-lg">Verifying your reset link...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Link Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-destructive">{errorMessage}</p>
            <Button onClick={() => navigate("/auth?mode=forgot")} className="w-full">
              Request New Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Set New Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (min 8 chars)"
                />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm"
                />
              </div>
              {errorMessage && <p className="text-destructive">{errorMessage}</p>}
              <Button type="submit" className="w-full">
                Reset Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}