import { motion } from 'framer-motion';
import { Trophy, Flame, Target, TrendingUp } from 'lucide-react';
import type { ArenaMarket } from '@/hooks/useArenaMarkets';

interface BattlePoolDisplayProps {
  market: ArenaMarket;
}

const BattlePoolDisplay = ({ market }: BattlePoolDisplayProps) => {
  const totalStaked = market.side_a_power + market.side_b_power;
  const sideAPercent = totalStaked > 0 ? (market.side_a_power / totalStaked) * 100 : 50;
  const sideBPercent = totalStaked > 0 ? (market.side_b_power / totalStaked) * 100 : 50;

  // Calculate multipliers based on pool imbalance
  const calculateMultiplier = (myPool: number, theirPool: number) => {
    if (myPool >= theirPool) {
      const ratio = theirPool / (myPool || 1);
      return Math.min(2 + (ratio * 3), 5);
    }
    return 5;
  };

  const sideAMultiplier = calculateMultiplier(market.side_a_power, market.side_b_power);
  const sideBMultiplier = calculateMultiplier(market.side_b_power, market.side_a_power);

  return (
    <div className="space-y-4">
      {/* Dual Pool Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Fixed Prize Pool */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase">Fixed Prize Pool</span>
          </div>
          <p className="text-xl font-black text-amber-400">
            {market.prize_pool >= 1000000 
              ? `${(market.prize_pool / 1000000).toFixed(1)}M` 
              : market.prize_pool >= 1000
                ? `${(market.prize_pool / 1000).toFixed(0)}K`
                : market.prize_pool.toLocaleString()
            }
          </p>
          <p className="text-xs text-muted-foreground">ARX-P</p>
          {market.bonus_percentage && (
            <div className="mt-2 flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-xs font-bold text-orange-400">{market.bonus_percentage}% Bonus</span>
            </div>
          )}
        </motion.div>

        {/* Staking Pool */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border border-primary/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase">Staking Pool</span>
          </div>
          <p className="text-xl font-black text-primary">
            {totalStaked >= 1000000 
              ? `${(totalStaked / 1000000).toFixed(1)}M` 
              : totalStaked >= 1000
                ? `${(totalStaked / 1000).toFixed(0)}K`
                : totalStaked.toLocaleString()
            }
          </p>
          <p className="text-xs text-muted-foreground">ARX-P Staked</p>
          <div className="mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-xs font-bold text-green-400">
              {market.total_participants || 0} Voters
            </span>
          </div>
        </motion.div>
      </div>

      {/* Team Power Distribution */}
      <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: market.side_a_color }}
              />
              <span className="font-bold text-sm" style={{ color: market.side_a_color }}>
                {market.side_a_name}
              </span>
            </div>
            <p className="text-lg font-black text-foreground">
              {market.side_a_power.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{sideAPercent.toFixed(1)}%</p>
            <span className="text-xs px-2 py-0.5 mt-1 inline-block rounded-full bg-muted text-muted-foreground">
              {sideAMultiplier.toFixed(1)}x
            </span>
          </div>

          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-background/50 flex items-center justify-center border border-border/50">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>

          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="font-bold text-sm" style={{ color: market.side_b_color }}>
                {market.side_b_name}
              </span>
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: market.side_b_color }}
              />
            </div>
            <p className="text-lg font-black text-foreground">
              {market.side_b_power.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{sideBPercent.toFixed(1)}%</p>
            <span className="text-xs px-2 py-0.5 mt-1 inline-block rounded-full bg-muted text-muted-foreground">
              {sideBMultiplier.toFixed(1)}x
            </span>
          </div>
        </div>

        {/* Visual Power Bar */}
        <div className="h-3 rounded-full overflow-hidden bg-muted flex">
          <motion.div
            className="h-full"
            style={{ backgroundColor: market.side_a_color }}
            initial={{ width: '50%' }}
            animate={{ width: `${sideAPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          <motion.div
            className="h-full"
            style={{ backgroundColor: market.side_b_color }}
            initial={{ width: '50%' }}
            animate={{ width: `${sideBPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
};

export default BattlePoolDisplay;
