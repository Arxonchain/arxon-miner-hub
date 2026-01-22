import { motion } from 'framer-motion';
import { Trophy, Swords, Shield, Crown, Zap, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ArenaCountdownProps {
  launchTime: Date;
}

const ArenaCountdown = ({ launchTime }: ArenaCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchTime.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [launchTime]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--primary) / 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Radial Gradient Overlays */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-blue-600/10 to-transparent" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-600/10 to-transparent" />
      </div>

      {/* Floating Particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Left Army - Team Alpha */}
      <div className="absolute left-0 top-0 bottom-0 w-1/3 flex items-center justify-center">
        <motion.div
          className="relative"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          {/* Alpha Army Silhouette */}
          <div className="relative">
            {/* Multiple warrior silhouettes */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${i * 15 - 30}px`,
                  top: `${Math.abs(i - 2) * 20 - 20}px`,
                  zIndex: 5 - Math.abs(i - 2),
                }}
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              >
                <Shield 
                  className="w-12 h-12 md:w-16 md:h-16 text-blue-500/60" 
                  style={{ filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))' }}
                />
              </motion.div>
            ))}
          </div>

          {/* Team Alpha Label */}
          <motion.div
            className="absolute -bottom-24 left-1/2 -translate-x-1/2 text-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-xl md:text-2xl font-black text-blue-500 tracking-widest">
              ALPHA
            </span>
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent mt-1" />
          </motion.div>
        </motion.div>

        {/* Alpha Energy Beam */}
        <motion.div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500"
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scaleX: [0.8, 1.2, 0.8],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      {/* Right Army - Team Omega */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-center">
        <motion.div
          className="relative"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          {/* Omega Army Silhouette */}
          <div className="relative">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  right: `${i * 15 - 30}px`,
                  top: `${Math.abs(i - 2) * 20 - 20}px`,
                  zIndex: 5 - Math.abs(i - 2),
                }}
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              >
                <Swords 
                  className="w-12 h-12 md:w-16 md:h-16 text-red-500/60" 
                  style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))' }}
                />
              </motion.div>
            ))}
          </div>

          {/* Team Omega Label */}
          <motion.div
            className="absolute -bottom-24 left-1/2 -translate-x-1/2 text-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            <span className="text-xl md:text-2xl font-black text-red-500 tracking-widest">
              OMEGA
            </span>
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-red-500 to-transparent mt-1" />
          </motion.div>
        </motion.div>

        {/* Omega Energy Beam */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-32 h-1 bg-gradient-to-l from-red-500/0 via-red-500/50 to-red-500"
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scaleX: [0.8, 1.2, 0.8],
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
        />
      </div>

      {/* Center Content */}
      <div className="relative z-10 text-center px-4">
        {/* VS Badge */}
        <motion.div
          className="absolute -top-32 left-1/2 -translate-x-1/2"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: 'spring' }}
        >
          <div className="relative">
            <motion.div
              className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border-2 border-primary/50"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(var(--primary), 0.3)',
                  '0 0 40px rgba(var(--primary), 0.5)',
                  '0 0 20px rgba(var(--primary), 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-2xl md:text-3xl font-black text-foreground">VS</span>
            </motion.div>
            
            {/* Orbiting Stars */}
            {[0, 120, 240].map((angle, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3"
                style={{
                  top: '50%',
                  left: '50%',
                }}
                animate={{
                  rotate: [angle, angle + 360],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <Star 
                  className="w-3 h-3 text-accent" 
                  style={{ transform: `translateX(50px)` }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trophy */}
        <motion.div
          className="relative mb-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="relative inline-block"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Trophy Glow */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, hsl(var(--accent) / 0.4) 0%, transparent 70%)',
                filter: 'blur(30px)',
                transform: 'scale(2)',
              }}
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1.8, 2.2, 1.8],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Crown above trophy */}
            <motion.div
              className="absolute -top-8 left-1/2 -translate-x-1/2"
              animate={{
                y: [0, -5, 0],
                rotate: [-5, 5, -5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-10 h-10 text-accent" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--accent)))' }} />
            </motion.div>

            <Trophy 
              className="w-24 h-24 md:w-32 md:h-32 text-accent relative z-10" 
              style={{ filter: 'drop-shadow(0 0 20px hsl(var(--accent)))' }}
            />
            
            {/* Sparkles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              >
                <Zap className="w-3 h-3 text-accent" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-black mb-2 tracking-tight"
            animate={{
              textShadow: [
                '0 0 20px hsl(var(--primary) / 0.5)',
                '0 0 40px hsl(var(--primary) / 0.8)',
                '0 0 20px hsl(var(--primary) / 0.5)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              THE ARENA
            </span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground font-medium tracking-widest uppercase"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Battle Begins In
          </motion.p>
        </motion.div>

        {/* Countdown Timer */}
        <motion.div
          className="flex items-center justify-center gap-3 md:gap-6 mt-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7, type: 'spring' }}
        >
          <TimeBlock value={timeLeft.hours} label="HOURS" />
          <motion.span 
            className="text-4xl md:text-5xl font-bold text-accent"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            :
          </motion.span>
          <TimeBlock value={timeLeft.minutes} label="MINUTES" />
          <motion.span 
            className="text-4xl md:text-5xl font-bold text-accent"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            :
          </motion.span>
          <TimeBlock value={timeLeft.seconds} label="SECONDS" />
        </motion.div>

        {/* Tagline */}
        <motion.div
          className="mt-12 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.p
            className="text-xl md:text-2xl font-bold text-foreground"
            animate={{
              opacity: [0.8, 1, 0.8],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Stake Your ARX-P • Pick Your Side • Claim Victory
          </motion.p>
          
          <motion.div
            className="flex items-center justify-center gap-4 text-sm text-muted-foreground"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-accent" />
              100K+ Prize Pool
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-primary" />
              +25% Mining Boost
            </span>
          </motion.div>
        </motion.div>

        {/* Animated Bottom Bar */}
        <motion.div
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-blue-500 via-accent to-red-500 rounded-full"
          animate={{
            scaleX: [0.5, 1, 0.5],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-primary/30" />
      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-primary/30" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-primary/30" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-primary/30" />

      {/* Add gradient animation keyframes */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

// Time Block Component
const TimeBlock = ({ value, label }: { value: number; label: string }) => (
  <motion.div
    className="relative"
    whileHover={{ scale: 1.05 }}
  >
    <motion.div
      className="w-20 h-24 md:w-28 md:h-32 rounded-xl bg-card/80 backdrop-blur-xl border border-primary/30 flex flex-col items-center justify-center"
      animate={{
        borderColor: [
          'hsl(var(--primary) / 0.3)',
          'hsl(var(--accent) / 0.5)',
          'hsl(var(--primary) / 0.3)',
        ],
        boxShadow: [
          '0 0 20px hsl(var(--primary) / 0.1)',
          '0 0 30px hsl(var(--accent) / 0.2)',
          '0 0 20px hsl(var(--primary) / 0.1)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <motion.span
        className="text-4xl md:text-5xl font-black text-foreground tabular-nums"
        key={value}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {String(value).padStart(2, '0')}
      </motion.span>
      <span className="text-[10px] md:text-xs text-muted-foreground tracking-widest mt-1">
        {label}
      </span>
    </motion.div>
    
    {/* Reflection */}
    <div className="absolute -bottom-4 left-0 right-0 h-4 bg-gradient-to-b from-primary/10 to-transparent rounded-b-xl blur-sm" />
  </motion.div>
);

export default ArenaCountdown;
