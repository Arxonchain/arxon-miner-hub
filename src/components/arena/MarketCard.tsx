import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, TrendingUp, Trophy, Flame, ChevronRight, Zap, Gift, Activity, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { ArenaMarket, MarketVote } from '@/hooks/useArenaMarkets';
import AIPredictionBadge from './AIPredictionBadge';
import EarlyStakerBonus from './EarlyStakerBonus';

interface MarketCardProps {
  market: ArenaMarket;
  userPosition?: MarketVote;
  onClick: () => void;
  variant?: 'default' | 'compact' | 'featured';
}

const MarketCard = ({ market, userPosition, onClick, variant = 'default' }: MarketCardProps) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [recentActivity, setRecentActivity] = useState(false);
  const [liveStake, setLiveStake] = useState<{ side: 'a' | 'b'; amount: number } | null>(null);
  
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
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [market.ends_at, market.starts_at, isUpcoming]);

  // Subscribe to real-time vote activity for live markets
  useEffect(() => {
    if (!isLive) return;

    const channel = supabase
      .channel(`card-activity-${market.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arena_votes',
          filter: `battle_id=eq.${market.id}`,
        },
        (payload) => {
          const newVote = payload.new as any;
          setRecentActivity(true);
          setLiveStake({ side: newVote.side, amount: newVote.power_spent });
          setTimeout(() => {
            setRecentActivity(false);
            setLiveStake(null);
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [market.id, isLive]);

  const getCategoryBadge = () => {
    const categories: Record<string, { color: string; label: string }> = {
      sports: { color: 'bg-green-500/20 text-green-400', label: '⚽ Sports' },
      politics: { color: 'bg-blue-500/20 text-blue-400', label: '🏛️ Politics' },
      crypto: { color: 'bg-orange-500/20 text-orange-400', label: '₿ Crypto' },
      entertainment: { color: 'bg-purple-500/20 text-purple-400', label: '🎬 Entertainment' },
      other: { color: 'bg-muted text-muted-foreground', label: '📊 Other' },
    };
    return categories[market.category] || categories.other;
  };

  const categoryBadge = getCategoryBadge();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full p-3 rounded-xl bg-card/50 border border-border/40 text-left touch-manipulation select-none transition-all duration-200 hover:bg-secondary/30 active:bg-secondary/50 active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{market.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground">{categoryBadge.label}</span>
              <span className="text-[10px] text-muted-foreground">•</span>
              <span className="text-[10px] text-muted-foreground">{market.total_participants || 0} voters</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-bold text-primary">{totalPool >= 1000 ? `${(totalPool/1000).toFixed(0)}K` : totalPool}</p>
            <p className="text-[10px] text-muted-foreground">{timeLeft}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl border w-full text-left
        touch-manipulation select-none transition-all duration-200
        ${userPosition 
          ? 'bg-primary/5 border-primary/30 shadow-sm shadow-primary/10' 
          : recentActivity
            ? 'bg-accent/5 border-accent/40'
            : 'bg-card/60 border-border/40 hover:border-border active:bg-secondary/30'
        } 
        ${variant === 'featured' ? 'p-4' : 'p-3'}
      `}
    >
      {/* Live stake animation overlay */}
      <AnimatePresence>
        {liveStake && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-0 left-0 right-0 px-2 py-1 flex items-center justify-center gap-1 z-10"
            style={{ 
              backgroundColor: liveStake.side === 'a' ? `${market.side_a_color}20` : `${market.side_b_color}20`,
              borderBottom: `1px solid ${liveStake.side === 'a' ? market.side_a_color : market.side_b_color}40`
            }}
          >
            <Activity className="w-3 h-3 text-foreground animate-pulse" />
            <span className="text-[10px] font-bold text-foreground">
              +{liveStake.amount >= 1000 ? `${(liveStake.amount / 1000).toFixed(1)}K` : liveStake.amount} on {liveStake.side === 'a' ? market.side_a_name : market.side_b_name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prize pool badge - Compact */}
      {market.prize_pool > 0 && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
            <Gift className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400">
              {market.prize_pool >= 1000 ? `${(market.prize_pool / 1000).toFixed(0)}K` : market.prize_pool}
            </span>
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0 pr-14">
          {/* Status indicators inline */}
          <div className="flex items-center gap-1 mb-1 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryBadge.color}`}>
              {categoryBadge.label}
            </span>
            {isEnded ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">Done</span>
            ) : isUpcoming ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">Soon</span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-0.5">
                <span className="w-1 h-1 rounded-full bg-green-500" />
                Live
              </span>
            )}
            {userPosition && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                <Zap className="w-2.5 h-2.5 inline" />
              </span>
            )}
            {/* AI Prediction badge */}
            {isLive && market.ai_side_a_probability !== undefined && market.ai_side_a_probability !== null && (
              <AIPredictionBadge
                sideAProbability={Number(market.ai_side_a_probability) || 50}
                sideBProbability={Number(market.ai_side_b_probability) || 50}
                confidence={market.ai_confidence || 'moderate'}
                sideAName={market.side_a_name}
                sideBName={market.side_b_name}
                sideAColor={market.side_a_color}
                sideBColor={market.side_b_color}
                compact
              />
            )}
            {/* Early staker bonus */}
            {isLive && !userPosition && (
              <EarlyStakerBonus startsAt={market.starts_at} endsAt={market.ends_at} compact />
            )}
          </div>

          {/* Title */}
          <h3 className={`font-bold text-foreground leading-tight ${variant === 'featured' ? 'text-base' : 'text-sm'}`}>
            {market.title}
          </h3>
        </div>
      </div>

      {/* Compact Odds Display */}
      <div className="space-y-1.5 mb-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium truncate max-w-[40%]" style={{ color: market.side_a_color }}>
            {market.side_a_name}
          </span>
          <div className="flex-1 mx-2 h-1.5 rounded-full bg-muted overflow-hidden flex">
            <motion.div
              className="h-full"
              style={{ backgroundColor: market.side_a_color }}
              initial={{ width: '50%' }}
              animate={{ width: `${sideAPercent}%` }}
            />
          </div>
          <span className="font-bold text-[11px]" style={{ color: market.side_a_color }}>{sideAPercent.toFixed(0)}%</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium truncate max-w-[40%]" style={{ color: market.side_b_color }}>
            {market.side_b_name}
          </span>
          <div className="flex-1 mx-2 h-1.5 rounded-full bg-muted overflow-hidden flex">
            <motion.div
              className="h-full"
              style={{ backgroundColor: market.side_b_color }}
              initial={{ width: '50%' }}
              animate={{ width: `${sideBPercent}%` }}
            />
          </div>
          <span className="font-bold text-[11px]" style={{ color: market.side_b_color }}>{sideBPercent.toFixed(0)}%</span>
        </div>
      </div>

      {/* Footer Stats - Single line */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5">
            <Trophy className="w-3 h-3 text-primary" />
            {totalPool >= 1000 ? `${(totalPool/1000).toFixed(0)}K` : totalPool}
          </span>
          <span className="flex items-center gap-0.5">
            <Users className="w-3 h-3" />
            {market.total_participants || 0}
          </span>
        </div>
        <span className="flex items-center gap-0.5">
          <Clock className="w-3 h-3" />
          {timeLeft}
        </span>
      </div>

      {/* Winner - Compact */}
      {isEnded && market.winner_side && (
        <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center gap-1.5">
          <Trophy className="w-3 h-3 text-amber-500" />
          <span className="text-[11px] font-bold text-amber-500">
            {market.winner_side === 'a' ? market.side_a_name : market.side_b_name} won
          </span>
        </div>
      )}

      {/* User position - Compact */}
      {userPosition && (
        <div className="mt-2 pt-2 border-t border-primary/20 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Your stake</span>
          <span className="text-[11px] font-bold text-primary">
            {userPosition.power_spent >= 1000 ? `${(userPosition.power_spent/1000).toFixed(1)}K` : userPosition.power_spent} on {userPosition.side === 'a' ? market.side_a_name : market.side_b_name}
          </span>
        </div>
      )}
    </motion.button>
  );
};

export default MarketCard;
