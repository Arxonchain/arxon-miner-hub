import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Crown, Shield, Fingerprint, CheckCircle, Zap, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { ArenaBattle, ArenaVote } from '@/hooks/useArena';
import FingerprintScanner from './FingerprintScanner';

interface VotePanelProps {
  battle: ArenaBattle | null;
  userClub: 'alpha' | 'omega';
  userVote: ArenaVote | null;
  availablePoints: number;
  onVote: (amount: number) => Promise<boolean>;
  isVoting: boolean;
  /** The user's registered fingerprint hash from arena_members */
  storedFingerprintHash?: string | null;
}

const VotePanel = ({ 
  battle, 
  userClub, 
  userVote, 
  availablePoints, 
  onVote, 
  isVoting,
  storedFingerprintHash
}: VotePanelProps) => {
  const [stakeAmount, setStakeAmount] = useState(0);
  const [showFingerprint, setShowFingerprint] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);

  // Calculate potential returns based on current pool sizes
  const potentialReturns = useMemo(() => {
    if (!battle || stakeAmount === 0) return null;

    const userSide = userClub === 'alpha' ? 'a' : 'b';
    const myPool = userSide === 'a' ? battle.side_a_power : battle.side_b_power;
    const theirPool = userSide === 'a' ? battle.side_b_power : battle.side_a_power;
    
    // Simulate adding user's stake to their pool
    const newMyPool = myPool + stakeAmount;
    const totalPool = newMyPool + theirPool;

    // Calculate multiplier if we win
    let multiplier: number;
    if (newMyPool >= theirPool) {
      // Favorites - lower multiplier
      const ratio = theirPool / newMyPool;
      multiplier = Math.min(2 + (ratio * 3), 5);
    } else {
      // Underdogs - max multiplier
      multiplier = 5;
    }

    // Calculate potential winnings
    const stakeReturn = stakeAmount;
    const stakeBonus = stakeAmount * (multiplier - 1);
    const loserPoolShare = (stakeAmount / newMyPool) * theirPool;
    const totalWinnings = stakeReturn + stakeBonus + loserPoolShare;

    // Calculate loss (you lose everything)
    const totalLoss = stakeAmount;

    const isUnderdog = newMyPool < theirPool;

    return {
      multiplier,
      totalWinnings: Math.round(totalWinnings),
      returnPercentage: Math.round((totalWinnings / stakeAmount) * 100),
      totalLoss,
      isUnderdog,
      myPoolPercentage: Math.round((newMyPool / totalPool) * 100),
    };
  }, [battle, stakeAmount, userClub]);

  if (!battle) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-muted-foreground">No active battle to vote on</p>
      </div>
    );
  }

  const stakeTiers = [
    { label: '10%', value: Math.floor(availablePoints * 0.1) },
    { label: '25%', value: Math.floor(availablePoints * 0.25) },
    { label: '50%', value: Math.floor(availablePoints * 0.5) },
    { label: 'MAX', value: availablePoints },
  ];

  const handleConfirmVote = () => {
    if (stakeAmount >= 100) {
      setPendingAmount(stakeAmount);
      setShowFingerprint(true);
    }
  };

  const handleFingerprintVerified = async (fingerprintHash?: string) => {
    const success = await onVote(pendingAmount);
    if (success) {
      setShowFingerprint(false);
      setStakeAmount(0);
      setPendingAmount(0);
    }
  };

  const handleFingerprintFailed = () => {
    toast.error("Fingerprint mismatch! This isn't your registered fingerprint.", {
      description: "You can only vote with the same fingerprint you used when joining the Arena."
    });
  };

  // Already voted
  if (userVote) {
    return (
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-green-500/10 border border-green-500/30 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Vote Locked! 🔒</h3>
          <p className="text-muted-foreground mb-4">
            You've staked <span className="font-bold text-green-500">{userVote.power_spent.toLocaleString()} ARX-P</span>
          </p>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            userClub === 'alpha' ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/20 text-primary'
          }`}>
            {userClub === 'alpha' ? <Crown className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            <span className="font-bold">{userClub.toUpperCase()}</span>
          </div>
          
          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">+25% Mining Boost Active!</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Fingerprint verification screen
  if (showFingerprint) {
    return (
      <div className="px-4 py-6">
        <div className="glass-card p-6 border border-border/50">
          <FingerprintScanner
            onVerified={handleFingerprintVerified}
            onVerificationFailed={handleFingerprintFailed}
            storedFingerprintHash={storedFingerprintHash || undefined}
            isVerifying={isVoting}
            title="Verify Your Identity"
            subtitle={`Confirm your fingerprint to stake ${pendingAmount.toLocaleString()} ARX-P`}
          />
          <button
            onClick={() => setShowFingerprint(false)}
            className="w-full mt-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Vote form
  return (
    <div className="px-4 py-6 space-y-5">
      {/* Club Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl ${
          userClub === 'alpha' 
            ? 'bg-amber-500/10 border border-amber-500/30' 
            : 'bg-primary/10 border border-primary/30'
        }`}
      >
        <div className="flex items-center gap-3">
          {userClub === 'alpha' ? (
            <Crown className="w-8 h-8 text-amber-500" />
          ) : (
            <Shield className="w-8 h-8 text-primary" />
          )}
          <div>
            <p className="text-sm text-muted-foreground">Staking for</p>
            <p className={`text-xl font-black ${
              userClub === 'alpha' ? 'text-amber-500' : 'text-primary'
            }`}>
              TEAM {userClub.toUpperCase()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Instant Boost Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-3 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30"
      >
        <div className="flex items-center gap-2 text-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">Instant +25% Mining Boost</span>
          <span className="text-xs text-muted-foreground">until battle ends</span>
        </div>
      </motion.div>

      {/* Available Points */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border/30">
        <span className="text-muted-foreground">Available Points</span>
        <span className="font-bold text-foreground">{availablePoints.toLocaleString()} ARX-P</span>
      </div>

      {/* Quick Stake Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {stakeTiers.map((tier) => (
          <button
            key={tier.label}
            onClick={() => setStakeAmount(Math.max(tier.value, 100))}
            disabled={tier.value < 100}
            className={`py-3 rounded-xl font-bold transition-all ${
              stakeAmount === tier.value
                ? userClub === 'alpha'
                  ? 'bg-amber-500 text-white'
                  : 'bg-primary text-primary-foreground'
                : tier.value < 100
                  ? 'bg-secondary/30 text-muted-foreground cursor-not-allowed'
                  : 'bg-secondary/50 text-foreground hover:bg-secondary'
            }`}
          >
            {tier.label}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div>
        <input
          type="range"
          min={100}
          max={Math.max(availablePoints, 100)}
          value={Math.max(stakeAmount, 100)}
          onChange={(e) => setStakeAmount(Number(e.target.value))}
          className="w-full h-2 rounded-full bg-secondary appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>100</span>
          <span className="font-bold text-foreground">{stakeAmount.toLocaleString()} ARX-P</span>
          <span>{availablePoints.toLocaleString()}</span>
        </div>
      </div>

      {/* Potential Returns Calculator */}
      {potentialReturns && stakeAmount >= 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Win Scenario */}
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-bold text-green-500">IF YOU WIN</span>
                {potentialReturns.isUnderdog && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">UNDERDOG</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{potentialReturns.multiplier.toFixed(1)}x multiplier</span>
            </div>
            <p className="text-2xl font-black text-green-500">
              +{potentialReturns.totalWinnings.toLocaleString()} ARX-P
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Stake back + {potentialReturns.multiplier.toFixed(1)}x bonus + share of loser pool
            </p>
          </div>

          {/* Lose Scenario */}
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold text-red-500">IF YOU LOSE</span>
            </div>
            <p className="text-2xl font-black text-red-500">
              -{potentialReturns.totalLoss.toLocaleString()} ARX-P
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You lose your entire stake. High risk, high reward!
            </p>
          </div>
        </motion.div>
      )}

      {/* Vote Button */}
      <button
        onClick={handleConfirmVote}
        disabled={stakeAmount < 100 || availablePoints < 100}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
          stakeAmount < 100 || availablePoints < 100
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : userClub === 'alpha'
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 shadow-lg shadow-amber-500/20'
              : 'bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-lg shadow-primary/20'
        }`}
      >
        <Fingerprint className="w-5 h-5" />
        {stakeAmount < 100 ? 'Minimum 100 ARX-P' : 'Verify & Stake'}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        ⚠️ Stakes are locked until battle ends. Winners take all!
      </p>
    </div>
  );
};

export default VotePanel;