import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Swords, Shield, Zap, ArrowRight, Crown, Sparkles } from 'lucide-react';
import FingerprintScanner from './FingerprintScanner';

type OnboardingStep = 'intro' | 'fingerprint' | 'assigned';

interface ArenaOnboardingProps {
  onComplete: (fingerprintHash: string) => Promise<{ success: boolean; club: 'alpha' | 'omega' | null }>;
  isLoading?: boolean;
}

const ArenaOnboarding = ({ onComplete, isLoading = false }: ArenaOnboardingProps) => {
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [isVerifying, setIsVerifying] = useState(false);
  const [assignedClub, setAssignedClub] = useState<'alpha' | 'omega' | null>(null);

  const handleFingerprintVerified = async () => {
    setIsVerifying(true);
    // Generate a unique fingerprint hash
    const hash = `fp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Register and get auto-assigned club
    const result = await onComplete(hash);
    
    if (result.success && result.club) {
      setAssignedClub(result.club);
      setStep('assigned');
    }
    setIsVerifying(false);
  };

  const features = [
    { icon: Trophy, text: 'Battle for Rewards', desc: 'Stake ARX-P to earn exclusive boosts' },
    { icon: Swords, text: 'Epic Club Wars', desc: 'Alpha vs Omega in weekly showdowns' },
    { icon: Shield, text: 'Verified Voting', desc: 'Secure fingerprint authentication' },
    { icon: Zap, text: 'Earn Badges', desc: 'Collect achievements and climb ranks' },
  ];

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
                onClick={() => setStep('fingerprint')}
                className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Enter the Arena
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              {/* Info text */}
              <p className="text-xs text-muted-foreground text-center mt-4">
                Verify your identity to receive your club assignment
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
              <FingerprintScanner
                onVerified={handleFingerprintVerified}
                isVerifying={isVerifying || isLoading}
                title="Secure Your Identity"
                subtitle="Hold your thumb on the scanner for 2 seconds"
              />
              
              {isVerifying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center mt-4"
                >
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="text-sm">Assigning your club...</span>
                  </div>
                </motion.div>
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
          {(['intro', 'fingerprint', 'assigned'] as OnboardingStep[]).map((s, i) => (
            <motion.div
              key={s}
              className={`h-2 rounded-full transition-colors ${
                step === s
                  ? 'w-8 bg-primary'
                  : (['intro', 'fingerprint', 'assigned'].indexOf(step) > i
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
