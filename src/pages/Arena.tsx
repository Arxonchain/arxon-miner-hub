import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useArena } from '@/hooks/useArena';
import { usePoints } from '@/hooks/usePoints';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import BattleCard from '@/components/arena/BattleCard';
import VoteModal from '@/components/arena/VoteModal';
import VoteExplorer from '@/components/arena/VoteExplorer';
import ArenaLeaderboard from '@/components/arena/ArenaLeaderboard';
import BattleHistory from '@/components/arena/BattleHistory';
import ArenaAnalytics from '@/components/arena/ArenaAnalytics';
import UserBadges from '@/components/arena/UserBadges';
import ArenaHeader from '@/components/arena/ArenaHeader';
import ArenaNavigation from '@/components/arena/ArenaNavigation';
import AuthDialog from '@/components/auth/AuthDialog';

type ArenaTab = 'battle' | 'explorer' | 'leaderboard' | 'history' | 'analytics';

const Arena = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { points } = usePoints();
  const {
    activeBattle,
    userVote,
    participants,
    userBadges,
    arenaBoosts,
    leaderboard,
    battleHistory,
    analytics,
    loading,
    voting,
    castVote,
    getTotalArenaBoost,
  } = useArena();

  const [selectedSide, setSelectedSide] = useState<'a' | 'b' | null>(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<ArenaTab>('battle');
  const [arenaPublicAccess, setArenaPublicAccess] = useState<boolean | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);

  // Fetch arena access setting from database
  useEffect(() => {
    const fetchArenaAccess = async () => {
      const { data, error } = await supabase
        .from('mining_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (!error && data) {
        setArenaPublicAccess((data as any).arena_public_access ?? false);
      }
      setAccessLoading(false);
    };

    fetchArenaAccess();
  }, []);

  // Check if user has access to Arena
  const hasArenaAccess = arenaPublicAccess === true || isAdmin;

  // Show access denied page if Arena is not public and user is not admin
  if (accessLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-[#0A1F44] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Swords className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!hasArenaAccess) {
    return (
      <div className="min-h-screen bg-[#0A1F44] flex items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 text-center p-8 glass-card border border-primary/20 max-w-md mx-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <Lock className="w-16 h-16 mx-auto mb-4 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Arena Coming Soon</h1>
          <p className="text-muted-foreground mb-6">
            The Arxon Arena is currently under construction. We're preparing epic battles for you. Stay tuned!
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalArenaBoost = getTotalArenaBoost();

  const handleSelectSide = (side: 'a' | 'b') => {
    if (!user) {
      setShowAuth(true);
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
          <Swords className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  const totalPowerStaked = activeBattle 
    ? activeBattle.side_a_power + activeBattle.side_b_power 
    : 0;

  return (
    <div className="min-h-screen bg-[#0A1F44] relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <ArenaHeader 
        totalPoints={points?.total_points || 0}
        activeBoost={totalArenaBoost}
      />

      <main className="relative z-10 container mx-auto px-4 py-6 space-y-6">
        {/* Navigation */}
        <ArenaNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          participantCount={participants.length}
        />

        {/* Tab Content */}
        {activeTab === 'battle' && (
          <div className="space-y-6">
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
                    className="glass-card p-4 border border-green-500/30 bg-green-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Swords className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <span className="text-foreground font-medium">Your stake is locked</span>
                          <p className="text-xs text-muted-foreground">Results revealed when battle ends</p>
                        </div>
                      </div>
                      <div className="text-primary font-bold">
                        {userVote.power_spent.toLocaleString()} ARX-P
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Badges Section */}
                {userBadges.length > 0 && (
                  <UserBadges badges={userBadges} />
                )}
              </>
            ) : (
              <div className="glass-card p-12 text-center border border-primary/20">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Swords className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">No Active Battle</h2>
                <p className="text-muted-foreground">
                  The Arena is preparing for the next battle. Check back soon!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'explorer' && (
          <VoteExplorer
            participants={participants}
            totalVoters={participants.length}
            totalPowerStaked={totalPowerStaked}
            currentUserId={user?.id}
          />
        )}

        {activeTab === 'leaderboard' && (
          <ArenaLeaderboard
            entries={leaderboard}
            currentUserId={user?.id}
          />
        )}

        {activeTab === 'history' && (
          <BattleHistory
            battles={battleHistory}
            currentUserId={user?.id}
          />
        )}

        {activeTab === 'analytics' && analytics && (
          <ArenaAnalytics
            totalBattles={analytics.totalBattles}
            totalPowerStaked={analytics.totalPowerStaked}
            totalParticipants={analytics.totalParticipants}
            averageStakePerVoter={analytics.averageStakePerVoter}
            largestSingleStake={analytics.largestSingleStake}
            mostActiveVoter={analytics.mostActiveVoter}
            userStats={analytics.userStats}
          />
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
