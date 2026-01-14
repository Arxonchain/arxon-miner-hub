import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Swords, Shield, Zap, ArrowRight } from 'lucide-react';
import FingerprintScanner from './FingerprintScanner';
import ClubSelection from './ClubSelection';

type OnboardingStep = 'intro' | 'fingerprint' | 'club';

interface ArenaOnboardingProps {
  onComplete: (club: 'alpha' | 'omega', fingerprintHash: string) => void;
  isLoading?: boolean;
}

const ArenaOnboarding = ({ onComplete, isLoading = false }: ArenaOnboardingProps) => {
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [fingerprintHash, setFingerprintHash] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleFingerprintVerified = async () => {
    setIsVerifying(true);
    // Generate a unique fingerprint hash based on timestamp and random data
    const hash = `fp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    setFingerprintHash(hash);
    setTimeout(() => {
      setIsVerifying(false);
      setStep('club');
    }, 1000);
  };

  const handleClubSelected = (club: 'alpha' | 'omega') => {
    if (fingerprintHash) {
      setIsSelecting(true);
      onComplete(club, fingerprintHash);
    }
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
                You'll need to verify your identity and choose a club to continue
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
                isVerifying={isVerifying}
                title="Secure Your Identity"
                subtitle="Hold your thumb on the scanner for 2 seconds"
              />
            </motion.div>
          )}

          {step === 'club' && (
            <motion.div
              key="club"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="glass-card p-6 border border-border/50"
            >
              <ClubSelection 
                onClubSelected={handleClubSelected} 
                isSelecting={isSelecting || isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {(['intro', 'fingerprint', 'club'] as OnboardingStep[]).map((s, i) => (
            <motion.div
              key={s}
              className={`h-2 rounded-full transition-colors ${
                step === s
                  ? 'w-8 bg-primary'
                  : (['intro', 'fingerprint', 'club'].indexOf(step) > i
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
