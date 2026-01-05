import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NexusRewardModalProps {
  open: boolean;
  onClose: () => void;
  onClaim: () => void;
  claiming: boolean;
}

const NexusRewardModal = ({ open, onClose, onClaim, claiming }: NexusRewardModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-card via-card to-primary/10 border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            Transaction Sent!
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Your ARX-P has been transferred successfully
          </DialogDescription>
        </DialogHeader>

        <div className="py-8">
          {/* Animated reward display */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
            className="relative mx-auto w-32 h-32 mb-6"
          >
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Gift className="h-16 w-16 text-primary-foreground" />
            </div>
            
            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-primary rounded-full"
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{
                  x: Math.cos((i * 60 * Math.PI) / 180) * 60,
                  y: Math.sin((i * 60 * Math.PI) / 180) * 60,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                style={{ left: '50%', top: '50%', marginLeft: -4, marginTop: -4 }}
              />
            ))}
          </motion.div>

          {/* Rewards breakdown */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-green-400" />
                </div>
                <span className="font-medium">Bonus Points</span>
              </div>
              <span className="text-xl font-bold text-green-400">+5 ARX-P</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="font-medium">Mining Boost</span>
                  <p className="text-xs text-muted-foreground">Active for 24 hours</p>
                </div>
              </div>
              <span className="text-xl font-bold text-primary">+20%</span>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            onClick={onClaim}
            disabled={claiming}
            className="w-full h-12 text-lg font-bold relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-green-500 via-primary to-green-500"
              animate={{
                x: claiming ? ['0%', '100%'] : '0%',
              }}
              transition={{
                duration: 1,
                repeat: claiming ? Infinity : 0,
                ease: 'linear',
              }}
              style={{ backgroundSize: '200% 100%' }}
            />
            <span className="relative flex items-center gap-2">
              <Gift className={`h-5 w-5 ${claiming ? 'animate-bounce' : ''}`} />
              {claiming ? 'Claiming...' : 'Claim Your Reward'}
            </span>
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default NexusRewardModal;
