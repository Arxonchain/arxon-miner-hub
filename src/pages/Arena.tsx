import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, ArrowLeft, Shield, Twitter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useArena } from '@/hooks/useArena';
import { usePoints } from '@/hooks/usePoints';
import { useXProfile } from '@/hooks/useXProfile';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import BattleCard from '@/components/arena/BattleCard';
import VoteModal from '@/components/arena/VoteModal';
import ParticipantLeaderboard from '@/components/arena/ParticipantLeaderboard';
import UserBadges from '@/components/arena/UserBadges';
import ArenaStats from '@/components/arena/ArenaStats';
import AuthDialog from '@/components/auth/AuthDialog';
import { Button } from '@/components/ui/button';

const Arena = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { points } = usePoints();
  const { xProfile } = useXProfile();
  const {
    activeBattle,
    userVote,
    participants,
    userBadges,
    arenaBoosts,
    loading,
    voting,
    castVote,
  } = useArena();

  const [selectedSide, setSelectedSide] = useState<'a' | 'b' | null>(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const hasXAccount = !!xProfile?.username;
  const xBoost = xProfile?.boost_percentage || 0;

  const handleSelectSide = (side: 'a' | 'b') => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (!hasXAccount) {
      navigate('/profile');
      return;
    }
    setSelectedSide(side);
    setShowVoteModal(true);
  };

  const handleConfirmVote = async (amount: number) => {
    if (!activeBattle || !selectedSide) return false;
    const success = await castVote(activeBattle.id, selectedSide, amount);
    if (success) {
      setSelectedSide(null);
    }
    return success;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1F44] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Swords className="w-12 h-12 text-[#00D4FF]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1F44] relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-[#00D4FF]/20 bg-[#0A1F44]/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-[#A0A0FF] hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#FF00FF] flex items-center justify-center"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(0, 212, 255, 0.3)',
                      '0 0 40px rgba(255, 0, 255, 0.3)',
                      '0 0 20px rgba(0, 212, 255, 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Swords className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-white">Arxon Arena</h1>
                  <p className="text-xs text-[#A0A0FF]">Battle for Power</p>
                </div>
              </div>
            </div>

            {!hasXAccount && user && (
              <Button
                onClick={() => navigate('/profile')}
                className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/80 text-white"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Connect X Account
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        {/* Stats Bar */}
        <ArenaStats
          totalPoints={points?.total_points || 0}
          miningRate={10}
          arenaBoosts={arenaBoosts}
          xBoost={xBoost}
        />

        {/* Main Battle Area */}
        {activeBattle ? (
          <>
            <BattleCard
              battle={activeBattle}
              onSelectSide={handleSelectSide}
              selectedSide={selectedSide}
              hasVoted={!!userVote}
              userVotedSide={userVote?.side}
              userVotedAmount={userVote?.power_spent}
            />

            {/* User Vote Status */}
            {userVote && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 border border-[#00D4FF]/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#00D4FF]" />
                  <span className="text-white">Your vote is locked</span>
                </div>
                <div className="text-[#00D4FF] font-bold">
                  {userVote.power_spent.toLocaleString()} ARX-P committed
                </div>
              </motion.div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ParticipantLeaderboard
                participants={participants}
                currentUserId={user?.id}
              />
              <UserBadges badges={userBadges} />
            </div>
          </>
        ) : (
          <div className="glass-card p-12 text-center border border-[#00D4FF]/20">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Swords className="w-16 h-16 mx-auto mb-4 text-[#A0A0FF]" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">No Active Battle</h2>
            <p className="text-[#A0A0FF]">
              The Arena is preparing for the next battle. Check back soon!
            </p>
          </div>
        )}
      </main>

      {/* Vote Modal */}
      {activeBattle && selectedSide && (
        <VoteModal
          isOpen={showVoteModal}
          onClose={() => {
            setShowVoteModal(false);
            setSelectedSide(null);
          }}
          battle={activeBattle}
          selectedSide={selectedSide}
          availablePoints={points?.total_points || 0}
          onConfirmVote={handleConfirmVote}
          isVoting={voting}
        />
      )}

      {/* Auth Dialog */}
      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default Arena;
