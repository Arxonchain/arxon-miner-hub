import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArenaBattle } from '@/hooks/useArena';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  battle: ArenaBattle;
  selectedSide: 'a' | 'b';
  availablePoints: number;
  onConfirmVote: (amount: number) => Promise<boolean>;
  isVoting: boolean;
}

const VoteModal = ({
  isOpen,
  onClose,
  battle,
  selectedSide,
  availablePoints,
  onConfirmVote,
  isVoting,
}: VoteModalProps) => {
  const [voteAmount, setVoteAmount] = useState(100);
  const [showSuccess, setShowSuccess] = useState(false);
  const minVote = 100;
  const maxVote = Math.floor(availablePoints);

  const sideName = selectedSide === 'a' ? battle.side_a_name : battle.side_b_name;
  const sideColor = selectedSide === 'a' ? battle.side_a_color : battle.side_b_color;

  useEffect(() => {
    if (isOpen) {
      setVoteAmount(Math.min(minVote, maxVote));
      setShowSuccess(false);
    }
  }, [isOpen, maxVote]);

  const handleConfirm = async () => {
    const success = await onConfirmVote(voteAmount);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md glass-card p-6 border border-primary/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {showSuccess ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center py-8"
            >
              {/* Success Animation */}
              <motion.div
                className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${sideColor}20` }}
                animate={{
                  boxShadow: [
                    `0 0 0 0 ${sideColor}40`,
                    `0 0 0 30px ${sideColor}00`,
                  ],
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Zap className="w-12 h-12" style={{ color: sideColor }} />
              </motion.div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Vote Cast!</h3>
              <p className="text-muted-foreground">
                {voteAmount.toLocaleString()} ARX-P locked for {sideName}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${sideColor}20, ${sideColor}40)`,
                    boxShadow: `0 0 30px ${sideColor}40`,
                  }}
                >
                  {selectedSide === 'a' ? '⚡' : '🔥'}
                </div>
                <h3 className="text-xl font-bold text-foreground">Vote for {sideName}</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Choose how much power to commit
                </p>
              </div>

              {/* Available Points */}
              <div className="bg-background/50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Available ARX-P</span>
                  <span className="text-foreground font-bold">
                    {availablePoints.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Vote Amount Slider */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">Vote Amount</span>
                  <div className="flex items-center gap-1" style={{ color: sideColor }}>
                    <Zap className="w-4 h-4" />
                    <span className="font-bold text-lg">{voteAmount.toLocaleString()}</span>
                  </div>
                </div>

                {maxVote >= minVote ? (
                  <Slider
                    value={[voteAmount]}
                    onValueChange={(value) => setVoteAmount(value[0])}
                    min={minVote}
                    max={maxVote}
                    step={10}
                    className="w-full"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Minimum 100 ARX-P required to vote</span>
                  </div>
                )}

                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Min: {minVote}</span>
                  <span>Max: {maxVote.toLocaleString()}</span>
                </div>
              </div>

              {/* Lock Warning */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/30 mb-6">
                <Lock className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-foreground font-medium">24-Hour Lock</p>
                  <p className="text-muted-foreground">
                    Your vote is private and locked for 24 hours. Choose wisely!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isVoting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isVoting || maxVote < minVote}
                  className="flex-1"
                  style={{
                    background: `linear-gradient(135deg, ${sideColor}, ${sideColor}CC)`,
                  }}
                >
                  {isVoting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Zap className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    'Cast Vote'
                  )}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoteModal;
