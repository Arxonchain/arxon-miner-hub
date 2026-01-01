import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, Sparkles, Zap, ArrowRight, Gift, Loader2, Shield, KeyRound, Eye, EyeOff, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReCAPTCHA from "react-google-recaptcha";
import { validatePassword } from "@/lib/passwordValidation";
import PasswordStrengthMeter from "./PasswordStrengthMeter";

// reCAPTCHA configuration
const RECAPTCHA_SITE_KEY = "6Let5DwsAAAAAE_wALyFUT98IrbfJvL6YGBQjtKX";
const CAPTCHA_ENABLED = true;

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

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaStatus, setCaptchaStatus] = useState<"idle" | "verified" | "error" | "expired">("idle");
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const captchaSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialReferralCode) {
      setReferralCode(initialReferralCode);
      setMode("signup");
    }
  }, [initialReferralCode]);

  // Reset captcha when mode changes
  useEffect(() => {
    setCaptchaToken(null);
    setCaptchaStatus("idle");
    setCaptchaError(null);
    recaptchaRef.current?.reset();
  }, [mode]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Check Your Email",
          description: "We've sent you a password reset link. Please check your inbox.",
        });
        setMode("signin");
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

  const processReferral = async (referredUserId: string, code: string) => {
    if (!code.trim()) return;

    try {
      // Find the referrer by code
      const { data: referrerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('referral_code', code.toUpperCase())
        .maybeSingle();

      if (profileError || !referrerProfile) {
        console.log('Invalid referral code:', code);
        return;
      }

      if (referrerProfile.user_id === referredUserId) {
        console.log('Cannot use own referral code');
        return;
      }

      // Check if referral already exists
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', referredUserId)
        .maybeSingle();

      if (existingReferral) {
        console.log('Referral already exists for this user');
        return;
      }

      // Create the referral record
      const { error: insertError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerProfile.user_id,
          referred_id: referredUserId,
          referral_code_used: code.toUpperCase(),
          points_awarded: 100
        });

      if (insertError) {
        console.error('Failed to create referral:', insertError);
        return;
      }

      console.log('Referral created successfully');

      // Award bonus points and mining boost to the referrer
      const { data: referrerPoints } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', referrerProfile.user_id)
        .maybeSingle();

      if (referrerPoints) {
        // Add 100 referral points and 5% mining boost
        await supabase
          .from('user_points')
          .update({
            referral_points: referrerPoints.referral_points + 100,
            total_points: referrerPoints.total_points + 100,
            referral_bonus_percentage: Math.min((referrerPoints.referral_bonus_percentage || 0) + 5, 50)
          })
          .eq('user_id', referrerProfile.user_id);
      } else {
        // Create points record for referrer
        await supabase
          .from('user_points')
          .insert({
            user_id: referrerProfile.user_id,
            referral_points: 100,
            total_points: 100,
            referral_bonus_percentage: 5
          });
      }

      toast({
        title: "Referral Applied! 🎉",
        description: "Your friend will receive bonus points and mining boost!",
      });
    } catch (error) {
      console.error('Error processing referral:', error);
    }
  };

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);

    if (token) {
      setCaptchaStatus("verified");
      setCaptchaError(null);
    } else {
      setCaptchaStatus("idle");
    }
  };

  const handleCaptchaErrored = () => {
    setCaptchaToken(null);
    setCaptchaStatus("error");

    const msg =
      "CAPTCHA didn't load/verify. If you're using Brave/ad-blockers, disable Shields for this site and refresh.";
    setCaptchaError(msg);
    toast({ title: "CAPTCHA blocked", description: msg, variant: "destructive" });
  };

  const handleCaptchaExpired = () => {
    setCaptchaToken(null);
    setCaptchaStatus("expired");

    const msg = "Verification expired. Please complete the CAPTCHA again.";
    setCaptchaError(msg);
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
          variant: "destructive"
        });
        return;
      }
    }
    
    // Validate captcha for signup (only if enabled)
    if (mode === "signup" && CAPTCHA_ENABLED && !captchaToken) {
      const msg = "Please complete the CAPTCHA verification.";
      setCaptchaStatus("error");
      setCaptchaError(msg);

      // Bring the CAPTCHA into view so users can act immediately
      captchaSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

      toast({
        title: "Verification Required",
        description: msg,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Sign In Failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You're now signed in",
          });
          onOpenChange(false);
        }
      } else {
        // Store referral code before signup
        const codeToUse = referralCode.trim();
        
        const { error, user: newUser } = await signUp(email, password);
        if (error) {
          // Reset captcha on error
          recaptchaRef.current?.reset();
          setCaptchaToken(null);
          
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          // Process referral if we have a user and a code
          if (newUser && codeToUse) {
            // Small delay to ensure profile is created by trigger
            await new Promise(resolve => setTimeout(resolve, 1000));
            await processReferral(newUser.id, codeToUse);
          }
          
          toast({
            title: "Account Created!",
            description: "Welcome to ARXON! Start mining to earn rewards.",
          });
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      // Reset captcha on error
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
      
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
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
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
                <>
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

                  {/* CAPTCHA for signup - only show if enabled */}
                  {CAPTCHA_ENABLED && RECAPTCHA_SITE_KEY && (
                    <div className="space-y-2" ref={captchaSectionRef}>
                      <div className="flex items-center justify-between gap-3">
                        <Label className="text-foreground flex items-center gap-2">
                          <Shield className="h-4 w-4 text-accent" />
                          Security Verification
                        </Label>

                        <button
                          type="button"
                          onClick={() => {
                            recaptchaRef.current?.reset();
                            setCaptchaToken(null);
                            setCaptchaStatus("idle");
                            setCaptchaError(null);
                          }}
                          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reload
                        </button>
                      </div>

                      <div className="flex justify-center">
                        <ReCAPTCHA
                          ref={recaptchaRef}
                          sitekey={RECAPTCHA_SITE_KEY}
                          onChange={handleCaptchaChange}
                          onErrored={handleCaptchaErrored}
                          onExpired={handleCaptchaExpired}
                          theme="dark"
                        />
                      </div>

                      <div className="min-h-[1.25rem]">
                        {captchaStatus === "verified" ? (
                          <p className="text-xs text-accent flex items-center justify-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verification complete
                          </p>
                        ) : captchaError ? (
                          <p className="text-xs text-destructive flex items-center justify-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {captchaError}
                          </p>
                        ) : null}
                      </div>

                      {captchaStatus === "error" && (
                        <p className="text-[11px] text-muted-foreground text-center">
                          Current site domain: <span className="font-medium">{window.location.hostname}</span>
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-5 group"
                disabled={loading || (mode === "signup" && CAPTCHA_ENABLED && captchaStatus !== "verified")}
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
