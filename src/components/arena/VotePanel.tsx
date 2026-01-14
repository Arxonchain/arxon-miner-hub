import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Crown, Shield, Fingerprint, CheckCircle, Zap } from 'lucide-react';
import type { ArenaBattle, ArenaVote } from '@/hooks/useArena';
import FingerprintScanner from './FingerprintScanner';

interface VotePanelProps {
  battle: ArenaBattle | null;
  userClub: 'alpha' | 'omega';
  userVote: ArenaVote | null;
  availablePoints: number;
  onVote: (amount: number) => Promise<boolean>;
  isVoting: boolean;
}

const VotePanel = ({ 
  battle, 
  userClub, 
  userVote, 
  availablePoints, 
  onVote, 
  isVoting 
}: VotePanelProps) => {
  const [stakeAmount, setStakeAmount] = useState(0);
  const [showFingerprint, setShowFingerprint] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);

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
    if (stakeAmount > 0) {
      setPendingAmount(stakeAmount);
      setShowFingerprint(true);
    }
  };

  const handleFingerprintVerified = async () => {
    const success = await onVote(pendingAmount);
    if (success) {
      setShowFingerprint(false);
      setStakeAmount(0);
      setPendingAmount(0);
    }
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
          <h3 className="text-xl font-bold text-foreground mb-2">Vote Locked!</h3>
          <p className="text-muted-foreground mb-4">
            You've staked <span className="font-bold text-green-500">{userVote.power_spent.toLocaleString()} ARX-P</span> for {userClub.toUpperCase()}
          </p>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            userClub === 'alpha' ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/20 text-primary'
          }`}>
            {userClub === 'alpha' ? <Crown className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            <span className="font-bold">{userClub.toUpperCase()}</span>
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
            isVerifying={isVoting}
            title="Confirm Your Vote"
            subtitle={`Staking ${pendingAmount.toLocaleString()} ARX-P for ${userClub.toUpperCase()}`}
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
    <div className="px-4 py-6 space-y-6">
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
            <p className="text-sm text-muted-foreground">Voting for</p>
            <p className={`text-xl font-black ${
              userClub === 'alpha' ? 'text-amber-500' : 'text-primary'
            }`}>
              CLUB {userClub.toUpperCase()}
            </p>
          </div>
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
            onClick={() => setStakeAmount(tier.value)}
            className={`py-3 rounded-xl font-bold transition-all ${
              stakeAmount === tier.value
                ? userClub === 'alpha'
                  ? 'bg-amber-500 text-white'
                  : 'bg-primary text-primary-foreground'
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
          min={0}
          max={availablePoints}
          value={stakeAmount}
          onChange={(e) => setStakeAmount(Number(e.target.value))}
          className="w-full h-2 rounded-full bg-secondary appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>0</span>
          <span className="font-bold text-foreground">{stakeAmount.toLocaleString()} ARX-P</span>
          <span>{availablePoints.toLocaleString()}</span>
        </div>
      </div>

      {/* Reward Info */}
      <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">
            Win and get <span className="font-bold text-primary">+{battle.winner_boost_percentage}% mining boost</span> for 7 days!
          </span>
        </div>
      </div>

      {/* Vote Button */}
      <button
        onClick={handleConfirmVote}
        disabled={stakeAmount === 0}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
          stakeAmount === 0
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : userClub === 'alpha'
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400'
              : 'bg-gradient-to-r from-primary to-accent text-white hover:opacity-90'
        }`}
      >
        <Fingerprint className="w-5 h-5" />
        Verify & Vote
      </button>

      <p className="text-xs text-muted-foreground text-center">
        You'll need to verify with fingerprint to confirm your vote
      </p>
    </div>
  );
};

export default VotePanel;
