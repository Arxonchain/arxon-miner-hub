import { motion } from 'framer-motion';
import { Trophy, Zap, Crown, Shield, Award, Star } from 'lucide-react';
import type { ArenaBattle } from '@/hooks/useArena';

interface PrizePoolProps {
  battle: ArenaBattle | null;
}

const PrizePool = ({ battle }: PrizePoolProps) => {
  const boostPercentage = battle?.winner_boost_percentage || 10;
  
  const prizes = [
    {
      icon: Zap,
      title: 'Mining Boost',
      value: `+${boostPercentage}%`,
      description: 'Winners receive a mining rate boost for 7 days',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Award,
      title: 'Winner Badge',
      value: 'Exclusive',
      description: 'Earn a unique badge showing your victory',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: Star,
      title: 'Legend Badge',
      value: 'Top Voter',
      description: 'The highest staker wins a legendary badge',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  const totalPower = battle ? battle.side_a_power + battle.side_b_power : 0;

  return (
    <div className="px-4 py-6 space-y-6">
      <h2 className="text-xl font-bold text-foreground">Prize Pool</h2>

      {/* Total Stakes Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Power Staked</p>
              <p className="text-2xl font-black text-foreground">
                {totalPower.toLocaleString()} ARX-P
              </p>
            </div>
          </div>
        </div>

        {/* Club Power Distribution */}
        {battle && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-500">ALPHA</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {battle.side_a_power.toLocaleString()} ARX-P
              </span>
            </div>
            
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="flex h-full">
                <motion.div
                  className="bg-gradient-to-r from-amber-600 to-amber-500"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: totalPower > 0 
                      ? `${(battle.side_a_power / totalPower) * 100}%` 
                      : '50%' 
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
                <motion.div
                  className="bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: totalPower > 0 
                      ? `${(battle.side_b_power / totalPower) * 100}%` 
                      : '50%' 
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">OMEGA</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {battle.side_b_power.toLocaleString()} ARX-P
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Prize List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
          Rewards for Winners
        </h3>
        
        {prizes.map((prize, index) => (
          <motion.div
            key={prize.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/30"
          >
            <div className={`w-12 h-12 rounded-xl ${prize.bgColor} flex items-center justify-center`}>
              <prize.icon className={`w-6 h-6 ${prize.color}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground">{prize.title}</h4>
              <p className="text-xs text-muted-foreground">{prize.description}</p>
            </div>
            <div className={`font-black ${prize.color}`}>
              {prize.value}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PrizePool;
