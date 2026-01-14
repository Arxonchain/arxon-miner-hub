import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Lock, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useArena } from '@/hooks/useArena';
import { usePoints } from '@/hooks/usePoints';
import { useAdmin } from '@/hooks/useAdmin';
import { useArenaMembership } from '@/hooks/useArenaMembership';
import { supabase } from '@/integrations/supabase/client';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import ArenaOnboarding from '@/components/arena/ArenaOnboarding';
import ArenaBattleInterface from '@/components/arena/ArenaBattleInterface';
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
  const { membership, loading: membershipLoading, registering, registerMembership } = useArenaMembership();
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

  // Show loading state
  if (accessLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Trophy className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  // Show access denied page if Arena is not public and user is not admin
  if (!hasArenaAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
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

  // Require authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 text-center p-8 glass-card border border-primary/20 max-w-md mx-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Join the Arena</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to enter the battleground and compete for glory
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors"
          >
            Sign In to Enter
          </button>
        </div>
        <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
      </div>
    );
  }

  // Show loading while checking membership
  if (membershipLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Trophy className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  // Show onboarding if user is not a member
  if (!membership) {
    const handleOnboardingComplete = async (club: 'alpha' | 'omega', fingerprintHash: string) => {
      await registerMembership(club, fingerprintHash);
    };

    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <AnimatedBackground />
        <ArenaOnboarding 
          onComplete={handleOnboardingComplete} 
          isLoading={registering}
        />
      </div>
    );
  }

  // Member is verified - show the Arena
  const totalArenaBoost = getTotalArenaBoost();

  const handleVote = async (amount: number): Promise<boolean> => {
    if (!activeBattle) return false;
    // Auto-vote for user's club side
    const side = membership.club === 'alpha' ? 'a' : 'b';
    return await castVote(activeBattle.id, side, amount);
  };

  const totalPowerStaked = activeBattle 
    ? activeBattle.side_a_power + activeBattle.side_b_power 
    : 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
              <ArenaBattleInterface
                battle={activeBattle}
                userClub={membership.club}
                userVote={userVote}
                participants={participants}
                userBadges={userBadges}
                availablePoints={points?.total_points || 0}
                onVote={handleVote}
                isVoting={voting}
              />
            ) : (
              <div className="glass-card p-12 text-center border border-primary/20">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
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
    </div>
  );
};

export default Arena;
