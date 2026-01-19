import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Clock, Users, Trophy, TrendingUp, AlertTriangle, 
  Zap, Fingerprint, Share2, Gift, CheckCircle, Target
} from 'lucide-react';
import { toast } from 'sonner';
import type { ArenaMarket, MarketVote } from '@/hooks/useArenaMarkets';
import FingerprintScanner from './FingerprintScanner';

interface ArenaMarketDetailProps {
  market: ArenaMarket;
  userPosition?: MarketVote;
  availablePoints: number;
  onClose: () => void;
  onPlaceBet: (marketId: string, side: 'a' | 'b', amount: number) => Promise<boolean>;
  calculateReturns: (market: ArenaMarket, side: 'a' | 'b', amount: number) => any;
  isVoting: boolean;
  storedFingerprintHash?: string | null;
}

const ArenaMarketDetail = ({
  market,
  userPosition,
  availablePoints,
  onClose,
  onPlaceBet,
  calculateReturns,
  isVoting,
  storedFingerprintHash,
}: ArenaMarketDetailProps) => {
  const [selectedSide, setSelectedSide] = useState<'a' | 'b' | null>(null);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [showFingerprint, setShowFingerprint] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const totalPool = market.side_a_power + market.side_b_power;
  const sideAPercent = totalPool > 0 ? (market.side_a_power / totalPool) * 100 : 50;
  const sideBPercent = totalPool > 0 ? (market.side_b_power / totalPool) * 100 : 50;

  const isEnded = !!market.winner_side || new Date(market.ends_at) < new Date();
  const isUpcoming = new Date(market.starts_at) > new Date();
  const isLive = !isEnded && !isUpcoming;

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const target = isUpcoming 
        ? new Date(market.starts_at).getTime()
        : new Date(market.ends_at).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(isUpcoming ? 'Starting...' : 'Ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [market.ends_at, market.starts_at, isUpcoming]);

  const potentialReturns = useMemo(() => {
    if (!selectedSide || stakeAmount < 100) return null;
    return calculateReturns(market, selectedSide, stakeAmount);
  }, [market, selectedSide, stakeAmount, calculateReturns]);

  const stakeTiers = [
    { label: '10%', value: Math.floor(availablePoints * 0.1) },
    { label: '25%', value: Math.floor(availablePoints * 0.25) },
    { label: '50%', value: Math.floor(availablePoints * 0.5) },
    { label: 'MAX', value: availablePoints },
  ];

  const handleConfirmBet = () => {
    if (selectedSide && stakeAmount >= 100) {
      setShowFingerprint(true);
    }
  };

  const handleFingerprintVerified = async () => {
    if (!selectedSide) return;
    const success = await onPlaceBet(market.id, selectedSide, stakeAmount);
    if (success) {
      setShowFingerprint(false);
      setStakeAmount(0);
      setSelectedSide(null);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Arxon Arena - ${market.title}`,
          text: `I'm predicting ${selectedSide === 'a' ? market.side_a_name : market.side_b_name}! Join me and stake your prediction!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <button 
          onClick={onClose}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <h1 className="font-bold text-foreground truncate max-w-[200px]">{market.title}</h1>
        
        <button 
          onClick={handleShare}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <div className="px-4 py-6 space-y-5">
        {/* Status & Timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEnded ? (
              <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Resolved
              </span>
            ) : isUpcoming ? (
              <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Starting in {timeLeft}
              </span>
            ) : (
              <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live • {timeLeft}
              </span>
            )}
          </div>
          {market.prize_pool > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
              <Gift className="w-3 h-3 text-amber-500" />
              <span className="text-xs font-bold text-amber-500">
                {(market.prize_pool / 1000).toFixed(0)}K Prize
              </span>
            </div>
          )}
        </div>

        {/* Market Title & Description */}
        <div>
          <h2 className="text-xl font-black text-foreground mb-2">{market.title}</h2>
          {market.description && (
            <p className="text-sm text-muted-foreground">{market.description}</p>
          )}
        </div>

        {/* Pool Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 text-center">
            <Trophy className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-foreground">{totalPool.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Pool</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 text-center">
            <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold text-foreground">{market.total_participants || 0}</p>
            <p className="text-xs text-muted-foreground">Bettors</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 text-center">
            <Zap className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-primary">+25%</p>
            <p className="text-xs text-muted-foreground">Boost</p>
          </div>
        </div>

        {/* Already Voted / Winner Display */}
        {userPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-primary/10 border border-primary/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Your Position</p>
                <p className="text-lg font-bold text-primary">
                  {userPosition.power_spent.toLocaleString()} ARX-P
                </p>
                <p className="text-xs text-muted-foreground">
                  on {userPosition.side === 'a' ? market.side_a_name : market.side_b_name}
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">+25% Boost Active</span>
              </div>
            </div>
          </motion.div>
        )}

        {isEnded && market.winner_side && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
          >
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Winner</p>
                <p className="text-lg font-bold text-amber-500">
                  {market.winner_side === 'a' ? market.side_a_name : market.side_b_name}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Side Selection */}
        {isLive && !userPosition && (
          <>
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Choose your side:</p>
              
              {/* Side A */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSide('a')}
                className={`w-full p-4 rounded-xl border transition-all ${
                  selectedSide === 'a'
                    ? 'border-2'
                    : 'border-border/50 hover:border-primary/30'
                }`}
                style={{ 
                  borderColor: selectedSide === 'a' ? market.side_a_color : undefined,
                  backgroundColor: selectedSide === 'a' ? `${market.side_a_color}10` : undefined
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: market.side_a_color }}
                    />
                    <span className="font-bold text-foreground">{market.side_a_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: market.side_a_color }}>
                      {sideAPercent.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {market.side_a_power.toLocaleString()} ARX-P
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: market.side_a_color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${sideAPercent}%` }}
                  />
                </div>
              </motion.button>

              {/* Side B */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSide('b')}
                className={`w-full p-4 rounded-xl border transition-all ${
                  selectedSide === 'b'
                    ? 'border-2'
                    : 'border-border/50 hover:border-primary/30'
                }`}
                style={{ 
                  borderColor: selectedSide === 'b' ? market.side_b_color : undefined,
                  backgroundColor: selectedSide === 'b' ? `${market.side_b_color}10` : undefined
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: market.side_b_color }}
                    />
                    <span className="font-bold text-foreground">{market.side_b_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: market.side_b_color }}>
                      {sideBPercent.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {market.side_b_power.toLocaleString()} ARX-P
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: market.side_b_color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${sideBPercent}%` }}
                  />
                </div>
              </motion.button>
            </div>

            {/* Stake Amount */}
            {selectedSide && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/30">
                  <span className="text-sm text-muted-foreground">Available</span>
                  <span className="font-bold text-foreground">{availablePoints.toLocaleString()} ARX-P</span>
                </div>

                {/* Quick Stakes */}
                <div className="grid grid-cols-4 gap-2">
                  {stakeTiers.map((tier) => (
                    <button
                      key={tier.label}
                      onClick={() => setStakeAmount(Math.max(tier.value, 100))}
                      disabled={tier.value < 100}
                      className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                        stakeAmount === tier.value
                          ? 'bg-primary text-primary-foreground'
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
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>100</span>
                    <span className="font-bold text-foreground text-base">{stakeAmount.toLocaleString()} ARX-P</span>
                    <span>{availablePoints.toLocaleString()}</span>
                  </div>
                </div>

                {/* Potential Returns */}
                {potentialReturns && stakeAmount >= 100 && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-bold text-green-500">IF YOU WIN</span>
                          {potentialReturns.isUnderdog && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">UNDERDOG</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{potentialReturns.multiplier.toFixed(1)}x</span>
                      </div>
                      <p className="text-2xl font-black text-green-500">
                        +{potentialReturns.totalWin.toLocaleString()} ARX-P
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-bold text-red-500">IF YOU LOSE</span>
                      </div>
                      <p className="text-2xl font-black text-red-500">
                        -{potentialReturns.totalLoss.toLocaleString()} ARX-P
                      </p>
                    </div>
                  </div>
                )}

                {/* Confirm Button */}
                <button
                  onClick={handleConfirmBet}
                  disabled={stakeAmount < 100 || availablePoints < 100}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <Fingerprint className="w-5 h-5" />
                  {stakeAmount < 100 ? 'Min 100 ARX-P' : 'Verify & Place Bet'}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  ⚠️ Stakes are locked until the market resolves
                </p>
              </motion.div>
            )}
          </>
        )}

        {/* Fingerprint Modal */}
        <AnimatePresence>
          {showFingerprint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-sm glass-card p-6 border border-border/50"
              >
                <FingerprintScanner
                  onVerified={handleFingerprintVerified}
                  onVerificationFailed={() => toast.error("Fingerprint mismatch!")}
                  storedFingerprintHash={storedFingerprintHash || undefined}
                  isVerifying={isVoting}
                  title="Verify Your Bet"
                  subtitle={`Stake ${stakeAmount.toLocaleString()} ARX-P on ${selectedSide === 'a' ? market.side_a_name : market.side_b_name}`}
                />
                <button
                  onClick={() => setShowFingerprint(false)}
                  className="w-full mt-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ArenaMarketDetail;
