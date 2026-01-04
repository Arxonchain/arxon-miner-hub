import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, Sparkles, Zap, ArrowRight, Gift, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validatePassword } from "@/lib/passwordValidation";
import PasswordStrengthMeter from "./PasswordStrengthMeter";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialReferralCode?: string;
}

const AuthDialog = ({ open, onOpenChange, initialReferralCode = "" }: AuthDialogProps) => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const withTimeout = async <T,>(promise: Promise<T>, ms = 12_000): Promise<T> => {
    let timeoutId: number | null = null;
    const timeout = new Promise<T>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error('Request timed out. Please try again.')), ms);
    });

    try {
      return await Promise.race([promise, timeout]);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    if (initialReferralCode) {
      setReferralCode(initialReferralCode);
      setMode("signup");
    }
  }, [initialReferralCode]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        }),
        12_000
      );

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check Your Email",
          description: "We've sent you a password reset link. Please check your inbox.",
        });
        setMode("signin");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error)?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processReferral = async (referredUserId: string, code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;

    try {
      const { data: referrerProfile, error: profileError } = await withTimeout(
        supabase.from('profiles').select('user_id').eq('referral_code', normalized).maybeSingle(),
        12_000
      );

      if (profileError || !referrerProfile?.user_id) return;
      if (referrerProfile.user_id === referredUserId) return;

      const { data: existingReferral } = await withTimeout(
        supabase.from('referrals').select('id').eq('referred_id', referredUserId).maybeSingle(),
        12_000
      );

      if (existingReferral) return;

      // Insert only the referral record. Rewards/boosts are handled securely on the backend.
      await withTimeout(
        supabase.from('referrals').insert({
          referrer_id: referrerProfile.user_id,
          referred_id: referredUserId,
          referral_code_used: normalized,
          points_awarded: 100,
        }),
        12_000
      );
    } catch {
      // Silent: referral processing should never block signup.
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password strength for signup
    if (mode === "signup") {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        toast({
          title: "Weak Password",
          description: passwordValidation.errors[0],
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await withTimeout(signIn(email, password), 12_000);
        if (error) {
          toast({
            title: "Sign In Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You're now signed in",
          });
          onOpenChange(false);
        }
      } else {
        const codeToUse = referralCode.trim();
        const { error, user: newUser } = await withTimeout(signUp(email, password), 12_000);

        if (error) {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account Created!",
            description: "Welcome to ARXON! Start mining to earn rewards.",
          });

          onOpenChange(false);

          // Fire-and-forget: never block the user on referral processing.
          if (newUser && codeToUse) {
            window.setTimeout(() => {
              void processReferral(newUser.id, codeToUse);
            }, 0);
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error)?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl overflow-hidden p-0">
        <DialogDescription className="sr-only">
          Sign in or create an account to access ARXON mining features
        </DialogDescription>
        
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute -top-20 -left-20 w-40 h-40 rounded-full opacity-30"
            style={{
              background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
              animation: 'pulse-glow 3s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
              animation: 'pulse-glow 3s ease-in-out infinite 1.5s',
            }}
          />
        </div>

        <div className="relative z-10 p-6">
          {/* Header with animated icons */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              {mode === "forgot" ? (
                <KeyRound className="h-8 w-8 text-accent animate-pulse" />
              ) : (
                <User className="h-8 w-8 text-accent animate-pulse" />
              )}
              <Sparkles 
                className="absolute -top-2 -right-2 h-4 w-4 text-primary"
                style={{ animation: 'spin 4s linear infinite' }}
              />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              {mode === "signin" ? "Welcome Back" : mode === "signup" ? "Join ARXON" : "Reset Password"}
            </DialogTitle>
            <Zap 
              className="h-5 w-5 text-primary"
              style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
            />
          </div>

          {/* Subtitle */}
          <p className="text-center text-muted-foreground mb-6">
            {mode === "signin" 
              ? "Sign in to start mining and earn ARX tokens" 
              : mode === "signup"
              ? "Create an account to join the mining revolution"
              : "Enter your email and we'll send you a reset link"}
          </p>

          {/* Toggle tabs - hide on forgot password */}
          {mode !== "forgot" && (
            <div className="flex bg-secondary/50 rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  mode === "signin"
                    ? "bg-accent text-accent-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  mode === "signup"
                    ? "bg-accent text-accent-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Form */}
          {mode === "forgot" ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-secondary/50 border-border/50 focus:border-accent"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-5 group"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setMode("signin")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-secondary/50 border-border/50 focus:border-accent"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === "signup" ? "Create a strong password" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-secondary/50 border-border/50 focus:border-accent"
                    required
                    minLength={mode === "signup" ? 12 : 6}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Password strength meter for signup */}
                {mode === "signup" && <PasswordStrengthMeter password={password} />}
              </div>

              {/* Forgot password link - only show on signin */}
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm text-accent hover:text-accent/80 transition-colors"
                >
                  Forgot your password?
                </button>
              )}

              {/* Referral code input - only show on signup */}
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="referral" className="text-foreground flex items-center gap-2">
                    <Gift className="h-4 w-4 text-accent" />
                    Referral Code (Optional)
                  </Label>
                  <div className="relative">
                    <Input
                      id="referral"
                      type="text"
                      placeholder="Enter a friend's referral code"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="bg-secondary/50 border-border/50 focus:border-accent uppercase"
                      disabled={loading}
                    />
                  </div>
                  {referralCode && (
                    <p className="text-xs text-accent">
                      Your friend will receive bonus points and a mining boost!
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-5 group"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === "signin" ? "Start Mining" : "Create Account"}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to ARXON's Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        <style>{`
          @keyframes pulse-glow {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.2); opacity: 0.5; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
