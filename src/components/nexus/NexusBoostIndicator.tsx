import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NexusBoost {
  id: string;
  boost_percentage: number;
  expires_at: string;
}

interface NexusBoostIndicatorProps {
  boosts: NexusBoost[];
}

const NexusBoostIndicator = ({ boosts }: NexusBoostIndicatorProps) => {
  if (boosts.length === 0) return null;

  const totalBoost = boosts.reduce((sum, b) => sum + b.boost_percentage, 0);
  const nearestExpiry = boosts
    .map(b => new Date(b.expires_at))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-primary/10 p-3 sm:p-4"
    >
      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)',
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '200% 0%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/30"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <p className="font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
              Nexus Boost Active
              <span className="text-primary text-sm sm:text-lg">+{totalBoost}%</span>
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Expires {formatDistanceToNow(nearestExpiry, { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs sm:text-sm text-muted-foreground">{boosts.length} active</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">boosts stacked</p>
        </div>
      </div>
    </motion.div>
  );
};

export default NexusBoostIndicator;