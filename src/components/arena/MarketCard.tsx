import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, TrendingUp, Trophy, Flame, ChevronRight, Zap, Gift } from 'lucide-react';
import type { ArenaMarket, MarketVote } from '@/hooks/useArenaMarkets';

interface MarketCardProps {
  market: ArenaMarket;
  userPosition?: MarketVote;
  onClick: () => void;
  variant?: 'default' | 'compact' | 'featured';
}

const MarketCard = ({ market, userPosition, onClick, variant = 'default' }: MarketCardProps) => {
  const [timeLeft, setTimeLeft] = useState('');
  
  const totalPool = market.side_a_power + market.side_b_power;
  const sideAPercent = totalPool > 0 ? (market.side_a_power / totalPool) * 100 : 50;
  const sideBPercent = totalPool > 0 ? (market.side_b_power / totalPool) * 100 : 50;
  
  const isEnded = !!market.winner_side || new Date(market.ends_at) < new Date();
  const isUpcoming = new Date(market.starts_at) > new Date();
  
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
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className="p-4 rounded-xl bg-card/50 border border-border/50 cursor-pointer hover:border-primary/30 transition-all"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{market.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${categoryBadge.color}`}>
                {categoryBadge.label}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                {market.total_participants || 0}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-primary">{totalPool.toLocaleString()} ARX-P</p>
            <p className="text-xs text-muted-foreground">{timeLeft}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border cursor-pointer transition-all ${
        userPosition 
          ? 'bg-primary/5 border-primary/30' 
          : 'bg-card/80 border-border/50 hover:border-primary/30'
      } ${variant === 'featured' ? 'p-6' : 'p-4'}`}
    >
      {/* Prize pool badge */}
      {market.prize_pool > 0 && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 animate-pulse">
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">
              {market.prize_pool >= 1000000 
                ? `${(market.prize_pool / 1000000).toFixed(1)}M` 
                : `${(market.prize_pool / 1000).toFixed(0)}K`} Pool
            </span>
          </div>
        </div>
      )}

      {/* Category & Status */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${categoryBadge.color}`}>
          {categoryBadge.label}
        </span>
        {isEnded ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Resolved
          </span>
        ) : isUpcoming ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
            Upcoming
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        )}
        {userPosition && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Staked
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className={`font-bold text-foreground mb-2 ${variant === 'featured' ? 'text-xl' : 'text-base'}`}>
        {market.title}
      </h3>
      
      {variant === 'featured' && market.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {market.description}
        </p>
      )}

      {/* Odds Bars */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium truncate max-w-[120px]" style={{ color: market.side_a_color }}>
                {market.side_a_name}
              </span>
              <span className="text-xs font-bold" style={{ color: market.side_a_color }}>
                {sideAPercent.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: market.side_a_color }}
                initial={{ width: 0 }}
                animate={{ width: `${sideAPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium truncate max-w-[120px]" style={{ color: market.side_b_color }}>
                {market.side_b_name}
              </span>
              <span className="text-xs font-bold" style={{ color: market.side_b_color }}>
                {sideBPercent.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: market.side_b_color }}
                initial={{ width: 0 }}
                animate={{ width: `${sideBPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            {totalPool.toLocaleString()} ARX-P
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {market.total_participants || 0}
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {timeLeft}
        </span>
      </div>

      {/* Winner badge for ended markets */}
      {isEnded && market.winner_side && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-500">
              Winner: {market.winner_side === 'a' ? market.side_a_name : market.side_b_name}
            </span>
          </div>
        </div>
      )}

      {/* Your position */}
      {userPosition && (
        <div className="mt-3 pt-3 border-t border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Your stake:</span>
            <span className="text-sm font-bold text-primary">
              {userPosition.power_spent.toLocaleString()} ARX-P on {userPosition.side === 'a' ? market.side_a_name : market.side_b_name}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MarketCard;
