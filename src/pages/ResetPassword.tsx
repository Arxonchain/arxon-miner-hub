import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2, CheckCircle, Eye, EyeOff, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import arxonLogo from "@/assets/arxon-logo.jpg";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasCheckedUrl, setHasCheckedUrl] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Check if we have recovery tokens in the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');
    
    console.log('URL hash type:', type, 'Has tokens:', !!accessToken);

    // If we have recovery tokens in URL, set the session
    if (accessToken && type === 'recovery') {
      console.log('Recovery tokens found, setting session...');
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      }).then(({ data, error }) => {
        if (!mounted) return;
        
        if (error) {
          console.error('Error setting recovery session:', error);
          setChecking(false);
          setHasCheckedUrl(true);
          toast({
            title: "Invalid or Expired Link",
            description: "Please request a new password reset link.",
            variant: "destructive"
          });
        } else if (data.session) {
          console.log('Recovery session set successfully');
          setIsValidSession(true);
          setChecking(false);
          setHasCheckedUrl(true);
          // Clear the hash from URL for cleaner look
          window.history.replaceState(null, '', window.location.pathname);
        }
      });
      return;
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log('Auth event:', event, 'Session:', !!session);
        
        if (event === 'PASSWORD_RECOVERY') {
          setIsValidSession(true);
          setChecking(false);
          setHasCheckedUrl(true);
        } else if (event === 'SIGNED_IN' && session && !hasCheckedUrl) {
          // User might have been redirected with a valid recovery session
          setIsValidSession(true);
          setChecking(false);
          setHasCheckedUrl(true);
        }
      }
    );

    // Also check for existing session after a delay
    const checkSession = async () => {
      if (!mounted) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !hasCheckedUrl) {
        // Check if this looks like a password recovery flow
        // The session will be valid if we came from a recovery link
        setIsValidSession(true);
      }
      setChecking(false);
      setHasCheckedUrl(true);
    };
    
    // Give time for auth state to process
    const timer = setTimeout(checkSession, 1500);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Show error only after all checks complete and no valid session
  useEffect(() => {
    if (!checking && hasCheckedUrl && !isValidSession && !success) {
      toast({
        title: "Invalid or Expired Link",
        description: "Please request a new password reset link.",
        variant: "destructive"
      });
      // Redirect to auth page with forgot mode
      navigate("/auth?mode=forgot");
    }
  }, [checking, hasCheckedUrl, isValidSession, success, navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setSuccess(true);
        toast({
          title: "Password Updated!",
          description: "Your password has been successfully reset.",
        });
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={arxonLogo} 
              alt="ARXON Logo" 
              className="h-16 w-16 rounded-full border-2 border-accent"
            />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <KeyRound className="h-6 w-6 text-accent" />
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          </div>
          <CardDescription>
            {success 
              ? "Your password has been successfully updated!"
              : "Enter your new password below"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {checking ? (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
              <p className="text-muted-foreground">Verifying your reset link...</p>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500 animate-pulse" />
              </div>
              <p className="text-muted-foreground">
                Redirecting you to the home page...
              </p>
            </div>
          ) : isValidSession ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-secondary/50 border-border/50 focus:border-accent"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 bg-secondary/50 border-border/50 focus:border-accent"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-5"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Update Password"
                )}
              </Button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Home
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Redirecting...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
