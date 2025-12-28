import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Zap, Clock, Trophy } from 'lucide-react';
import { ArenaBattle } from '@/hooks/useArena';

interface BattleCardProps {
  battle: ArenaBattle;
  onSelectSide: (side: 'a' | 'b') => void;
  selectedSide: 'a' | 'b' | null;
  hasVoted: boolean;
}

const BattleCard = ({ battle, onSelectSide, selectedSide, hasVoted }: BattleCardProps) => {
  const [timeLeft, setTimeLeft] = useState('');
  const totalPower = battle.side_a_power + battle.side_b_power;
  const sideAPercent = totalPower > 0 ? (battle.side_a_power / totalPower) * 100 : 50;
  const sideBPercent = totalPower > 0 ? (battle.side_b_power / totalPower) * 100 : 50;

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(battle.ends_at).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Battle Ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [battle.ends_at]);

  return (
    <div className="relative">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: '100%',
              opacity: 0 
            }}
            animate={{ 
              y: '-10%',
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'linear'
            }}
          />
        ))}
      </div>

      <div className="relative glass-card p-6 md:p-8 border border-primary/20 overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4"
            animate={{ 
              boxShadow: ['0 0 20px rgba(0, 212, 255, 0.2)', '0 0 40px rgba(0, 212, 255, 0.4)', '0 0 20px rgba(0, 212, 255, 0.2)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Swords className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">ACTIVE BATTLE</span>
          </motion.div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{battle.title}</h2>
          {battle.description && (
            <p className="text-muted-foreground max-w-lg mx-auto">{battle.description}</p>
          )}

          {/* Countdown */}
          <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-lg">{timeLeft}</span>
          </div>
        </div>

        {/* Battle Arena */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-center">
          {/* Side A */}
          <motion.button
            onClick={() => !hasVoted && onSelectSide('a')}
            disabled={hasVoted}
            className={`relative p-6 rounded-xl border-2 transition-all ${
              selectedSide === 'a' 
                ? 'border-[#00D4FF] bg-[#00D4FF]/10 shadow-[0_0_30px_rgba(0,212,255,0.3)]'
                : 'border-border/50 hover:border-[#00D4FF]/50 hover:bg-[#00D4FF]/5'
            } ${hasVoted ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
            whileHover={!hasVoted ? { scale: 1.02 } : {}}
            whileTap={!hasVoted ? { scale: 0.98 } : {}}
          >
            {/* Glow effect */}
            <div 
              className="absolute inset-0 rounded-xl opacity-20"
              style={{ 
                background: `radial-gradient(circle at center, ${battle.side_a_color}, transparent 70%)` 
              }}
            />
            
            <div className="relative z-10 text-center">
              <div 
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl"
                style={{ 
                  background: `linear-gradient(135deg, ${battle.side_a_color}20, ${battle.side_a_color}40)`,
                  boxShadow: `0 0 30px ${battle.side_a_color}40`
                }}
              >
                ⚡
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{battle.side_a_name}</h3>
              <div className="flex items-center justify-center gap-1 text-lg font-mono" style={{ color: battle.side_a_color }}>
                <Zap className="w-4 h-4" />
                <span>{battle.side_a_power.toLocaleString()}</span>
              </div>
            </div>
          </motion.button>

          {/* VS Divider */}
          <div className="flex flex-col items-center justify-center py-4">
            <motion.div 
              className="relative"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-20 h-20 rounded-full border-2 border-primary/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">VS</span>
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
            </motion.div>

            {/* Power Bar */}
            <div className="w-full mt-6">
              <div className="h-3 rounded-full bg-background/50 overflow-hidden flex">
                <motion.div 
                  className="h-full rounded-l-full"
                  style={{ backgroundColor: battle.side_a_color }}
                  initial={{ width: '50%' }}
                  animate={{ width: `${sideAPercent}%` }}
                  transition={{ duration: 0.5 }}
                />
                <motion.div 
                  className="h-full rounded-r-full"
                  style={{ backgroundColor: battle.side_b_color }}
                  initial={{ width: '50%' }}
                  animate={{ width: `${sideBPercent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{sideAPercent.toFixed(1)}%</span>
                <span>{sideBPercent.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Side B */}
          <motion.button
            onClick={() => !hasVoted && onSelectSide('b')}
            disabled={hasVoted}
            className={`relative p-6 rounded-xl border-2 transition-all ${
              selectedSide === 'b' 
                ? 'border-[#FF00FF] bg-[#FF00FF]/10 shadow-[0_0_30px_rgba(255,0,255,0.3)]'
                : 'border-border/50 hover:border-[#FF00FF]/50 hover:bg-[#FF00FF]/5'
            } ${hasVoted ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
            whileHover={!hasVoted ? { scale: 1.02 } : {}}
            whileTap={!hasVoted ? { scale: 0.98 } : {}}
          >
            {/* Glow effect */}
            <div 
              className="absolute inset-0 rounded-xl opacity-20"
              style={{ 
                background: `radial-gradient(circle at center, ${battle.side_b_color}, transparent 70%)` 
              }}
            />
            
            <div className="relative z-10 text-center">
              <div 
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl"
                style={{ 
                  background: `linear-gradient(135deg, ${battle.side_b_color}20, ${battle.side_b_color}40)`,
                  boxShadow: `0 0 30px ${battle.side_b_color}40`
                }}
              >
                🔥
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{battle.side_b_name}</h3>
              <div className="flex items-center justify-center gap-1 text-lg font-mono" style={{ color: battle.side_b_color }}>
                <Zap className="w-4 h-4" />
                <span>{battle.side_b_power.toLocaleString()}</span>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Winner Boost Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">
              Winning side gets <span className="text-accent font-bold">+{battle.winner_boost_percentage}%</span> mining rate for 7 days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleCard;
