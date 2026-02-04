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

    console.log("ResetPassword loaded:", { token: token ? token.substring(0, 10) + '...' : null, type });

    if (!token || type !== "recovery") {
      setErrorMessage("Invalid reset link parameters.");
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        console.log("verifyOtp called with token:", token.substring(0, 10) + '...');
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "recovery",
        });

        console.log("verifyOtp result:", { data, error: error ? error.message : null });

        // Key fix: no error = success for recovery flow
        if (error) {
          setErrorMessage(error.message || "Invalid or expired link.");
          toast({
            title: "Verification Failed",
            description: error.message || "Request a new link.",
            variant: "destructive",
          });
        } else {
          setVerified(true);
          setSuccessMessage("Link verified! Set your new password.");
        }
      } catch (e) {
        console.error("verifyOtp exception:", e);
        setErrorMessage("Verification error.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [searchParams, toast]);

  const handleReset = async (e) => {
    e.preventDefault();

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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset. Sign in now.",
      });

      navigate("/auth?mode=signin");
    } catch (err) {
      setErrorMessage("Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">Verifying...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{errorMessage}</p>
            <Button onClick={() => navigate("/auth?mode=forgot")} className="w-full mt-4">
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
                  placeholder="New password"
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