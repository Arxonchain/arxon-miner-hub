import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Clock, Users, Trophy, TrendingUp, AlertTriangle, 
  Zap, Fingerprint, Share2, Gift, CheckCircle, Target, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import type { ArenaMarket, MarketVote } from '@/hooks/useArenaMarkets';
import FingerprintScanner from './FingerprintScanner';
import BattlePoolDisplay from './BattlePoolDisplay';
import BattleVoteExplorer from './BattleVoteExplorer';
import { useAuth } from '@/hooks/useAuth';

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

type DetailTab = 'vote' | 'explorer' | 'pools';

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
  const { user } = useAuth();
  const [selectedSide, setSelectedSide] = useState<'a' | 'b' | null>(null);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [showFingerprint, setShowFingerprint] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('pools');

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
      {/* Header - Compact */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-3 py-2.5 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <button 
          onClick={onClose}
          className="p-1.5 -ml-1 text-muted-foreground active:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <h1 className="font-bold text-sm text-foreground truncate max-w-[180px]">{market.title}</h1>
        
        <button 
          onClick={handleShare}
          className="p-1.5 -mr-1 text-muted-foreground active:text-foreground transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </header>

      {/* Content - Compact spacing */}
      <div className="px-3 py-4 space-y-3">
        {/* Status & Timer - Single row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {isEnded ? (
              <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Resolved
              </span>
            ) : isUpcoming ? (
              <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                Starts {timeLeft}
              </span>
            ) : (
              <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {timeLeft}
              </span>
            )}
          </div>
          {market.prize_pool > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
              <Gift className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400">
                {market.prize_pool >= 1000 ? `${(market.prize_pool / 1000).toFixed(0)}K` : market.prize_pool} Pool
              </span>
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-lg font-black text-foreground leading-tight">{market.title}</h2>
          {market.description && (
            <p className="text-xs text-muted-foreground mt-1">{market.description}</p>
          )}
        </div>

        {/* Tab Pills - Compact */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveDetailTab('pools')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-all ${
              activeDetailTab === 'pools'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/40 text-muted-foreground active:bg-secondary'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Pools
          </button>
          <button
            onClick={() => setActiveDetailTab('explorer')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-all ${
              activeDetailTab === 'explorer'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/40 text-muted-foreground active:bg-secondary'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Votes
          </button>
          {isLive && !userPosition && (
            <button
              onClick={() => setActiveDetailTab('vote')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-all ${
                activeDetailTab === 'vote'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/40 text-muted-foreground active:bg-secondary'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Vote
            </button>
          )}
        </div>

        {/* Pools Tab */}
        {activeDetailTab === 'pools' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BattlePoolDisplay market={market} />
          </motion.div>
        )}

        {/* Vote Explorer Tab */}
        {activeDetailTab === 'explorer' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BattleVoteExplorer market={market} currentUserId={user?.id} />
          </motion.div>
        )}

        {/* Already Voted Display */}
        {userPosition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 rounded-xl bg-primary/10 border border-primary/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Your Position</p>
                <p className="text-base font-bold text-primary">
                  {userPosition.power_spent >= 1000 
                    ? `${(userPosition.power_spent / 1000).toFixed(1)}K` 
                    : userPosition.power_spent.toLocaleString()} ARX-P
                </p>
                <p className="text-[10px] text-muted-foreground">
                  on {userPosition.side === 'a' ? market.side_a_name : market.side_b_name}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/20">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold text-primary">+25% Boost</span>
              </div>
            </div>
          </motion.div>
        )}

        {isEnded && market.winner_side && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">Winner</p>
                <p className="text-sm font-bold text-amber-500">
                  {market.winner_side === 'a' ? market.side_a_name : market.side_b_name}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Side Selection - Vote Tab - Compact */}
        {activeDetailTab === 'vote' && isLive && !userPosition && (
          <>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Select your prediction:</p>
              
              {/* Side A */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSide('a')}
                className={`w-full p-3 rounded-xl border transition-all ${
                  selectedSide === 'a' ? 'border-2' : 'border-border/40'
                }`}
                style={{ 
                  borderColor: selectedSide === 'a' ? market.side_a_color : undefined,
                  backgroundColor: selectedSide === 'a' ? `${market.side_a_color}10` : undefined
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: market.side_a_color }} />
                    <span className="font-bold text-sm text-foreground">{market.side_a_name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: market.side_a_color }}>{sideAPercent.toFixed(0)}%</span>
                </div>
              </motion.button>

              {/* Side B */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSide('b')}
                className={`w-full p-3 rounded-xl border transition-all ${
                  selectedSide === 'b' ? 'border-2' : 'border-border/40'
                }`}
                style={{ 
                  borderColor: selectedSide === 'b' ? market.side_b_color : undefined,
                  backgroundColor: selectedSide === 'b' ? `${market.side_b_color}10` : undefined
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: market.side_b_color }} />
                    <span className="font-bold text-sm text-foreground">{market.side_b_name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: market.side_b_color }}>{sideBPercent.toFixed(0)}%</span>
                </div>
              </motion.button>
            </div>

            {/* Stake Amount - Compact */}
            {selectedSide && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/40 border border-border/30">
                  <span className="text-xs text-muted-foreground">Available</span>
                  <span className="text-sm font-bold text-foreground">{availablePoints.toLocaleString()} ARX-P</span>
                </div>

                {/* Quick Stakes - Compact */}
                <div className="grid grid-cols-4 gap-1.5">
                  {stakeTiers.map((tier) => (
                    <button
                      key={tier.label}
                      onClick={() => setStakeAmount(Math.max(tier.value, 100))}
                      disabled={tier.value < 100}
                      className={`py-2 rounded-lg font-bold text-xs transition-all ${
                        stakeAmount === tier.value
                          ? 'bg-primary text-primary-foreground'
                          : tier.value < 100
                            ? 'bg-secondary/20 text-muted-foreground/50'
                            : 'bg-secondary/40 text-foreground active:bg-secondary'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>

                {/* Slider - Compact */}
                <div>
                  <input
                    type="range"
                    min={100}
                    max={Math.max(availablePoints, 100)}
                    value={Math.max(stakeAmount, 100)}
                    onChange={(e) => setStakeAmount(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full bg-secondary appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[10px] text-muted-foreground">100</span>
                    <span className="font-bold text-sm text-foreground">{stakeAmount.toLocaleString()} ARX-P</span>
                    <span className="text-[10px] text-muted-foreground">{availablePoints >= 1000 ? `${(availablePoints/1000).toFixed(0)}K` : availablePoints}</span>
                  </div>
                </div>

                {/* Potential Returns - Compact */}
                {potentialReturns && stakeAmount >= 100 && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-[10px] font-bold text-green-500">WIN</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{potentialReturns.multiplier.toFixed(1)}x</span>
                      </div>
                      <p className="text-lg font-black text-green-500">
                        +{potentialReturns.totalWin >= 1000 ? `${(potentialReturns.totalWin/1000).toFixed(1)}K` : potentialReturns.totalWin}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                      <div className="flex items-center gap-1 mb-1">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        <span className="text-[10px] font-bold text-red-500">LOSE</span>
                      </div>
                      <p className="text-lg font-black text-red-500">
                        -{potentialReturns.totalLoss >= 1000 ? `${(potentialReturns.totalLoss/1000).toFixed(1)}K` : potentialReturns.totalLoss}
                      </p>
                    </div>
                  </div>
                )}

                {/* Confirm Button - Compact */}
                <button
                  onClick={handleConfirmBet}
                  disabled={stakeAmount < 100 || availablePoints < 100}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-accent text-white active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Fingerprint className="w-4 h-4" />
                  {stakeAmount < 100 ? 'Min 100 ARX-P' : 'Verify & Vote'}
                </button>

                <p className="text-[10px] text-muted-foreground text-center">
                  ⚠️ Stakes locked until resolution
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
                  title="Confirm Your Vote"
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
