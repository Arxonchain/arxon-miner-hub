import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Trophy, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useArena } from '@/hooks/useArena';
import { usePoints } from '@/hooks/usePoints';
import { useAdmin } from '@/hooks/useAdmin';
import { useArenaMembership } from '@/hooks/useArenaMembership';
import { supabase } from '@/integrations/supabase/client';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import ArenaOnboarding from '@/components/arena/ArenaOnboarding';
import BattleHero from '@/components/arena/BattleHero';
import RoundTabs from '@/components/arena/RoundTabs';
import ArenaBottomNav, { type ArenaTab } from '@/components/arena/ArenaBottomNav';
import BattleRules from '@/components/arena/BattleRules';
import MyRankings from '@/components/arena/MyRankings';
import PrizePool from '@/components/arena/PrizePool';
import VotePanel from '@/components/arena/VotePanel';
import AuthDialog from '@/components/auth/AuthDialog';

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
    leaderboard,
    battleHistory,
    analytics,
    loading,
    voting,
    castVote,
    getTotalArenaBoost,
  } = useArena();

  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<ArenaTab>('rules');
  const [arenaPublicAccess, setArenaPublicAccess] = useState<boolean | null>(null);
  const [isEmailWhitelisted, setIsEmailWhitelisted] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch arena access setting and check email whitelist
  useEffect(() => {
    const checkArenaAccess = async () => {
      try {
        // Check public access setting
        const { data: settings } = await supabase
          .from('mining_settings')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (settings) {
          setArenaPublicAccess((settings as any).arena_public_access ?? false);
        }

        // Check if user's email is whitelisted (if logged in)
        if (user?.email) {
          const { data: whitelist } = await supabase
            .from('arena_email_whitelist')
            .select('email')
            .eq('email', user.email.toLowerCase())
            .maybeSingle();
          
          setIsEmailWhitelisted(!!whitelist);
        }
      } catch (error) {
        console.error('Error checking arena access:', error);
      } finally {
        setAccessLoading(false);
      }
    };

    checkArenaAccess();
  }, [user?.email]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger data refetch
    window.location.reload();
  };

  // Check access
  // Access: admin, public access enabled, or email whitelisted
  const hasArenaAccess = arenaPublicAccess === true || isAdmin || isEmailWhitelisted;

  // Loading state
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

  // Access denied
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
            The Arxon Arena is currently under construction. Stay tuned!
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
            Sign in to enter the battleground
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

  // Membership loading
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

  // Onboarding for new members
  if (!membership) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <AnimatedBackground />
        <ArenaOnboarding 
          onComplete={registerMembership} 
          isLoading={registering}
        />
      </div>
    );
  }

  // Main Arena Interface
  const handleVote = async (amount: number): Promise<boolean> => {
    if (!activeBattle) return false;
    const side = membership.club === 'alpha' ? 'a' : 'b';
    return await castVote(activeBattle.id, side, amount);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <button 
          onClick={() => navigate('/')}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <h1 className="font-bold text-foreground">Boost Battle</h1>
        
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Round Tabs */}
      {battleHistory.length > 0 && (
        <div className="relative z-10 border-b border-border/30">
          <RoundTabs
            battles={[...(activeBattle ? [{ ...activeBattle, user_participated: !!userVote }] : []), ...battleHistory]}
            activeBattleId={activeBattle?.id || null}
            onSelectBattle={() => {}}
          />
        </div>
      )}

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {activeTab === 'rules' && !loading && (
          <>
            <BattleHero
              battle={activeBattle}
              userClub={membership.club}
              hasVoted={!!userVote}
              onEnterBattle={() => setActiveTab('vote')}
              isRegistered={true}
            />
            <BattleRules />
          </>
        )}

        {activeTab === 'rankings' && (
          <MyRankings
            leaderboard={leaderboard}
            userBadges={userBadges}
            currentUserId={user?.id}
            analytics={analytics}
          />
        )}

        {activeTab === 'prizes' && (
          <PrizePool battle={activeBattle} />
        )}

        {activeTab === 'vote' && (
          <VotePanel
            battle={activeBattle}
            userClub={membership.club}
            userVote={userVote}
            availablePoints={points?.total_points || 0}
            onVote={handleVote}
            isVoting={voting}
            storedFingerprintHash={membership.fingerprint_hash}
          />
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Trophy className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="relative z-20">
        <ArenaBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Arena;
