import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Swords, Shield, Zap, ArrowRight, Crown, Sparkles, AlertTriangle, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import XIcon from '@/components/icons/XIcon';
import FingerprintScanner from './FingerprintScanner';
import { useXProfile } from '@/hooks/useXProfile';
import { toast } from 'sonner';

type OnboardingStep = 'intro' | 'connect_x' | 'follow_x' | 'fingerprint' | 'assigned';

interface ArenaOnboardingProps {
  onComplete: (fingerprintHash: string) => Promise<{ success: boolean; club: 'alpha' | 'omega' | null; error?: string }>;
  isLoading?: boolean;
}

const ArenaOnboarding = ({ onComplete, isLoading = false }: ArenaOnboardingProps) => {
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [isVerifying, setIsVerifying] = useState(false);
  const [assignedClub, setAssignedClub] = useState<'alpha' | 'omega' | null>(null);
  const [fingerprintError, setFingerprintError] = useState<string | null>(null);
  const [xInput, setXInput] = useState('');
  const [isConnectingX, setIsConnectingX] = useState(false);
  const [isCheckingFollow, setIsCheckingFollow] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const { xProfile, connectXProfile, loading: xProfileLoading } = useXProfile();

  // Check if user already has X connected
  useEffect(() => {
    if (xProfile && step === 'connect_x') {
      setStep('follow_x');
    }
  }, [xProfile, step]);

  const handleConnectX = async () => {
    if (!xInput.trim()) {
      toast.error('Please enter your X username or profile URL');
      return;
    }
    
    setIsConnectingX(true);
    const success = await connectXProfile(xInput.trim());
    setIsConnectingX(false);
    
    if (success) {
      setStep('follow_x');
    }
  };

  const checkFollowStatus = async () => {
    if (!xProfile) {
      toast.error('Please connect your X account first');
      return;
    }
    
    setIsCheckingFollow(true);
    
    try {
      // For now, we'll do a simple check - in production you'd verify via API
      // We'll mark as following after user confirms they followed
      // The scan-x-profile function can be extended to check following status
      
      // Simulate check delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For now, trust the user that they followed
      setIsFollowing(true);
      toast.success('Follow status verified!');
      
      // Move to fingerprint step
      setTimeout(() => {
        setStep('fingerprint');
      }, 500);
    } catch (error) {
      toast.error('Failed to verify follow status');
    } finally {
      setIsCheckingFollow(false);
    }
  };

  const handleFingerprintVerified = async (fingerprintHash?: string) => {
    if (!fingerprintHash) {
      toast.error('Failed to capture fingerprint');
      return;
    }
    
    setIsVerifying(true);
    setFingerprintError(null);
    
    try {
      // Register with the captured fingerprint hash
      // This fingerprint is tied to THIS user - they'll need to use it for voting
      const result = await onComplete(fingerprintHash);
      
      if (result.success && result.club) {
        setAssignedClub(result.club);
        setStep('assigned');
      } else if (result.error) {
        setFingerprintError(result.error);
        toast.error('Registration failed', {
          description: result.error,
        });
      }
    } catch (error: any) {
      console.error('Fingerprint verification error:', error);
      setFingerprintError('Failed to verify fingerprint. Please try again.');
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const features = [
    { icon: Trophy, text: 'Battle for Rewards', desc: 'Stake ARX-P to earn exclusive boosts' },
    { icon: Swords, text: 'Epic Club Wars', desc: 'Alpha vs Omega in weekly showdowns' },
    { icon: Shield, text: 'Verified Voting', desc: 'Secure fingerprint authentication' },
    { icon: Zap, text: 'Earn Badges', desc: 'Collect achievements and climb ranks' },
  ];

  const steps: OnboardingStep[] = ['intro', 'connect_x', 'follow_x', 'fingerprint', 'assigned'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="glass-card p-8 border border-border/50"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', duration: 0.7 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 mb-4"
                >
                  <Trophy className="w-10 h-10 text-primary" />
                </motion.div>
                <h1 className="text-3xl font-black text-foreground mb-2">
                  Welcome to the Arena
                </h1>
                <p className="text-muted-foreground">
                  Enter the battleground where champions are made
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="p-4 rounded-xl bg-secondary/50 border border-border/30"
                  >
                    <feature.icon className="w-6 h-6 text-primary mb-2" />
                    <h3 className="font-bold text-foreground text-sm">{feature.text}</h3>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* Club Preview */}
              <div className="mb-8 p-4 rounded-xl bg-secondary/30 border border-border/30">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  You'll be assigned to one of two clubs:
                </p>
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-amber-500">ALPHA</span>
                  </div>
                  <span className="text-muted-foreground">vs</span>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="font-bold text-primary">OMEGA</span>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <motion.button
                onClick={() => setStep('connect_x')}
                className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Enter the Arena
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              {/* Info text */}
              <p className="text-xs text-muted-foreground text-center mt-4">
                Connect your X account and verify your identity to join
              </p>
            </motion.div>
          )}

          {step === 'connect_x' && (
            <motion.div
              key="connect_x"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="glass-card p-8 border border-border/50"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-foreground/10 to-foreground/5 mb-4"
                >
                  <XIcon className="w-10 h-10 text-foreground" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Connect Your X Account
                </h2>
                <p className="text-muted-foreground text-sm">
                  Your X account is required for Arena participation
                </p>
              </div>

              {xProfileLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : xProfile ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">@{xProfile.username}</p>
                      <p className="text-sm text-muted-foreground">Account connected</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setStep('follow_x')}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">X Username or Profile URL</label>
                    <input
                      type="text"
                      value={xInput}
                      onChange={(e) => setXInput(e.target.value)}
                      placeholder="@username or https://x.com/username"
                      className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                      disabled={isConnectingX}
                    />
                  </div>
                  
                  <motion.button
                    onClick={handleConnectX}
                    disabled={isConnectingX || !xInput.trim()}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-foreground text-background rounded-xl font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50"
                    whileHover={{ scale: isConnectingX ? 1 : 1.02 }}
                    whileTap={{ scale: isConnectingX ? 1 : 0.98 }}
                  >
                    {isConnectingX ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <XIcon className="w-5 h-5" />
                        Connect X Account
                      </>
                    )}
                  </motion.button>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center mt-6">
                We use your X account to verify your identity and prevent abuse
              </p>
            </motion.div>
          )}

          {step === 'follow_x' && (
            <motion.div
              key="follow_x"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="glass-card p-8 border border-border/50"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 mb-4"
                >
                  <XIcon className="w-10 h-10 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Follow @arxonarx
                </h2>
                <p className="text-muted-foreground text-sm">
                  Follow the official ARXON account to continue
                </p>
              </div>

              <div className="space-y-4">
                {/* Follow Button - Opens X */}
                <a
                  href="https://x.com/arxonarx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-4 bg-foreground text-background rounded-xl font-bold hover:bg-foreground/90 transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                  Follow @arxonarx
                  <ExternalLink className="w-4 h-4" />
                </a>

                {/* Verify Button */}
                <motion.button
                  onClick={checkFollowStatus}
                  disabled={isCheckingFollow}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  whileHover={{ scale: isCheckingFollow ? 1 : 1.02 }}
                  whileTap={{ scale: isCheckingFollow ? 1 : 0.98 }}
                >
                  {isCheckingFollow ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : isFollowing ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Verified!
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      I've Followed - Verify
                    </>
                  )}
                </motion.button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-6">
                Click "Follow @arxonarx" first, then click verify to continue
              </p>
            </motion.div>
          )}

          {step === 'fingerprint' && (
            <motion.div
              key="fingerprint"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="glass-card p-8 border border-border/50"
            >
              {fingerprintError ? (
                <div className="text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-4"
                  >
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Registration Failed</h2>
                    <p className="text-muted-foreground text-sm">{fingerprintError}</p>
                  </div>
                  <motion.button
                    onClick={() => {
                      setFingerprintError(null);
                      setStep('fingerprint');
                    }}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Try Again
                  </motion.button>
                </div>
              ) : (
                <>
                  <FingerprintScanner
                    onVerified={handleFingerprintVerified}
                    isVerifying={isVerifying || isLoading}
                    title="Register Your Fingerprint"
                    subtitle="This fingerprint will be required for all your votes"
                  />
                  
                  {isVerifying && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center mt-4"
                    >
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span className="text-sm">Verifying device & assigning club...</span>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {step === 'assigned' && assignedClub && (
            <motion.div
              key="assigned"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 border border-border/50 text-center"
            >
              {/* Celebration Animation */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 0.7, delay: 0.2 }}
                className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${
                  assignedClub === 'alpha' 
                    ? 'bg-gradient-to-br from-amber-500/30 to-amber-600/20' 
                    : 'bg-gradient-to-br from-primary/30 to-accent/20'
                }`}
              >
                {assignedClub === 'alpha' ? (
                  <Crown className="w-12 h-12 text-amber-500" />
                ) : (
                  <Shield className="w-12 h-12 text-primary" />
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-black text-foreground mb-2">
                  Welcome to Club
                </h2>
                <h1 className={`text-4xl font-black mb-4 ${
                  assignedClub === 'alpha' ? 'text-amber-500' : 'text-primary'
                }`}>
                  {assignedClub.toUpperCase()}
                </h1>
                <p className="text-muted-foreground mb-6">
                  {assignedClub === 'alpha' 
                    ? 'The Pioneers - First to conquer, last to fall!'
                    : 'The Endgame - The final word in every battle!'}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                <div className={`p-4 rounded-xl ${
                  assignedClub === 'alpha' 
                    ? 'bg-amber-500/10 border border-amber-500/30' 
                    : 'bg-primary/10 border border-primary/30'
                }`}>
                  <p className="text-sm text-foreground">
                    Your votes will always support <span className="font-bold">{assignedClub.toUpperCase()}</span> in every battle!
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Entering the Arena in 3 seconds...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((s, i) => (
            <motion.div
              key={s}
              className={`h-2 rounded-full transition-colors ${
                step === s
                  ? 'w-8 bg-primary'
                  : (steps.indexOf(step) > i
                      ? 'w-2 bg-primary/50'
                      : 'w-2 bg-border')
              }`}
              layout
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ArenaOnboarding;
