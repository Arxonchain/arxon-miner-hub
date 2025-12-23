import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, Sparkles, Zap, ArrowRight, Gift, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialReferralCode?: string;
}

const AuthDialog = ({ open, onOpenChange, initialReferralCode = "" }: AuthDialogProps) => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialReferralCode) {
      setReferralCode(initialReferralCode);
      setMode("signup");
    }
  }, [initialReferralCode]);

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

  // Store referral code to process after signup confirmation
  const pendingReferralCodeRef = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl overflow-hidden p-0">
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
              <User className="h-8 w-8 text-accent animate-pulse" />
              <Sparkles 
                className="absolute -top-2 -right-2 h-4 w-4 text-primary"
                style={{ animation: 'spin 4s linear infinite' }}
              />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              {mode === "signin" ? "Welcome Back" : "Join ARXON"}
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
              : "Create an account to join the mining revolution"}
          </p>

          {/* Toggle tabs */}
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

          {/* Form */}
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
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50 focus:border-accent"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
            </div>

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
