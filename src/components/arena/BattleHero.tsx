import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Share2, Lock } from 'lucide-react';
import type { ArenaBattle } from '@/hooks/useArena';

interface BattleHeroProps {
  battle: ArenaBattle | null;
  userClub: 'alpha' | 'omega';
  hasVoted: boolean;
  onEnterBattle: () => void;
  isRegistered: boolean;
}

const BattleHero = ({ battle, userClub, hasVoted, onEnterBattle, isRegistered }: BattleHeroProps) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!battle) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(battle.ends_at).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [battle]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Arxon Arena - Boost Battle',
          text: 'Join me in the Arena and battle for rewards!',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center px-4 py-8">
      {/* Spotlight Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Left spotlight */}
        <div 
          className="absolute top-0 left-1/4 w-32 h-96 opacity-20"
          style={{
            background: 'linear-gradient(180deg, hsl(var(--primary)) 0%, transparent 100%)',
            transform: 'rotate(-15deg)',
            filter: 'blur(40px)',
          }}
        />
        {/* Center spotlight */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-96 opacity-30"
          style={{
            background: 'linear-gradient(180deg, hsl(var(--primary)) 0%, transparent 100%)',
            filter: 'blur(50px)',
          }}
        />
        {/* Right spotlight */}
        <div 
          className="absolute top-0 right-1/4 w-32 h-96 opacity-20"
          style={{
            background: 'linear-gradient(180deg, hsl(var(--primary)) 0%, transparent 100%)',
            transform: 'rotate(15deg)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* Trophy Container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="relative z-10 mb-6"
      >
        {/* Trophy glow base */}
        <div 
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 rounded-full opacity-50"
          style={{
            background: 'radial-gradient(ellipse, hsl(var(--primary) / 0.5) 0%, transparent 70%)',
            filter: 'blur(10px)',
          }}
        />
        
        {/* Trophy with effects */}
        <div className="relative">
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 40px hsl(var(--primary) / 0.3)',
                '0 0 80px hsl(var(--primary) / 0.5)',
                '0 0 40px hsl(var(--primary) / 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Trophy icon */}
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-card via-secondary to-card border border-primary/30 flex items-center justify-center relative overflow-hidden">
            {/* Inner glow */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 50% 30%, hsl(var(--primary) / 0.3) 0%, transparent 60%)',
              }}
            />
            <Trophy className="w-20 h-20 text-primary relative z-10" strokeWidth={1.5} />
          </div>

          {/* Particle effects */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary"
              style={{
                left: `${50 + Math.cos((i / 6) * Math.PI * 2) * 60}%`,
                top: `${50 + Math.sin((i / 6) * Math.PI * 2) * 60}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Title & Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-6 relative z-10"
      >
        <h1 className="text-3xl font-black text-foreground mb-2">
          {battle?.title || 'Boost Battle'}
        </h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          {battle?.description || 'Stake your power, boost your points and earn weekly rewards!'}
        </p>
      </motion.div>

      {/* Countdown Timer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-8 relative z-10"
      >
        <p className="text-muted-foreground text-sm mb-3">This event ends in:</p>
        <div className="flex items-center justify-center gap-2">
          <TimerBlock value={timeLeft.days} label="D" />
          <TimerBlock value={timeLeft.hours} label="H" />
          <TimerBlock value={timeLeft.minutes} label="M" />
          <TimerBlock value={timeLeft.seconds} label="S" />
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm space-y-3 relative z-10"
      >
        <button
          onClick={onEnterBattle}
          disabled={!battle}
          className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasVoted ? 'View Battle' : 'Enter Battle'}
        </button>

        <button
          onClick={handleShare}
          className="w-full py-4 bg-transparent border border-border hover:border-primary/50 text-foreground rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          Share
        </button>
      </motion.div>

      {/* Club Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 relative z-10"
      >
        <span className="text-sm text-muted-foreground">Your Club: </span>
        <span className={`font-bold ${userClub === 'alpha' ? 'text-amber-500' : 'text-primary'}`}>
          {userClub.toUpperCase()}
        </span>
      </motion.div>
    </div>
  );
};

// Timer block component
const TimerBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex items-center gap-1">
    <div className="w-12 h-12 rounded-lg bg-secondary border border-border flex items-center justify-center">
      <span className="text-xl font-black text-foreground">
        {value.toString().padStart(2, '0')}
      </span>
    </div>
    <span className="text-muted-foreground text-sm font-medium">{label}</span>
  </div>
);

export default BattleHero;
