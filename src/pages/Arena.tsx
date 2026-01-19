import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Trophy, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useArena } from '@/hooks/useArena';
import { usePoints } from '@/hooks/usePoints';
import { useAdmin } from '@/hooks/useAdmin';
import { useArenaMembership } from '@/hooks/useArenaMembership';
import { useArenaMarkets } from '@/hooks/useArenaMarkets';
import { supabase } from '@/integrations/supabase/client';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import ArenaOnboarding from '@/components/arena/ArenaOnboarding';
import BattleHero from '@/components/arena/BattleHero';
import RoundTabs from '@/components/arena/RoundTabs';
import ArenaBottomNav, { type ArenaTab } from '@/components/arena/ArenaBottomNav';
import VotePanel from '@/components/arena/VotePanel';
import ArenaMarketExplorer from '@/components/arena/ArenaMarketExplorer';
import ArenaEarningsLeaderboard from '@/components/arena/ArenaEarningsLeaderboard';
import ArenaMyBets from '@/components/arena/ArenaMyBets';
import ArenaMarketDetail from '@/components/arena/ArenaMarketDetail';
import AuthDialog from '@/components/auth/AuthDialog';
import type { ArenaMarket } from '@/hooks/useArenaMarkets';

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

  const {
    liveMarkets,
    upcomingMarkets,
    endedMarkets,
    userPositions,
    earningsLeaderboard,
    loading: marketsLoading,
    voting: marketVoting,
    placeBet,
    calculatePotentialReturns,
    availablePoints,
  } = useArenaMarkets();

  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<ArenaTab>('markets');
  const [selectedMarket, setSelectedMarket] = useState<ArenaMarket | null>(null);
  const [arenaPublicAccess, setArenaPublicAccess] = useState<boolean | null>(null);
  const [isEmailWhitelisted, setIsEmailWhitelisted] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const checkArenaAccess = async () => {
      try {
        const { data: settings } = await supabase
          .from('mining_settings')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (settings) {
          setArenaPublicAccess((settings as any).arena_public_access ?? false);
        }

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
    window.location.reload();
  };

  const hasArenaAccess = arenaPublicAccess === true || isAdmin || isEmailWhitelisted;

  if (accessLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Trophy className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!hasArenaAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 text-center p-8 glass-card border border-primary/20 max-w-md mx-4">
          <Lock className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Arena Coming Soon</h1>
          <p className="text-muted-foreground mb-6">The Arxon Arena is currently under construction.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 text-center p-8 glass-card border border-primary/20 max-w-md mx-4">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Join the Arena</h1>
          <p className="text-muted-foreground mb-6">Sign in to enter the battleground</p>
          <button onClick={() => setShowAuth(true)} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold">
            Sign In to Enter
          </button>
        </div>
        <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
      </div>
    );
  }

  if (membershipLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Trophy className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <AnimatedBackground />
        <ArenaOnboarding onComplete={registerMembership} isLoading={registering} />
      </div>
    );
  }

  // Market detail view
  if (selectedMarket) {
    return (
      <ArenaMarketDetail
        market={selectedMarket}
        userPosition={userPositions.get(selectedMarket.id)}
        availablePoints={availablePoints}
        onClose={() => setSelectedMarket(null)}
        onPlaceBet={placeBet}
        calculateReturns={calculatePotentialReturns}
        isVoting={marketVoting}
        storedFingerprintHash={membership.fingerprint_hash}
      />
    );
  }

  const handleVote = async (amount: number): Promise<boolean> => {
    if (!activeBattle) return false;
    const side = membership.club === 'alpha' ? 'a' : 'b';
    return await castVote(activeBattle.id, side, amount);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <AnimatedBackground />

      <header className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-foreground">Arena</h1>
        <button onClick={handleRefresh} disabled={isRefreshing} className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto relative z-10">
        {activeTab === 'markets' && (
          <ArenaMarketExplorer
            liveMarkets={liveMarkets}
            upcomingMarkets={upcomingMarkets}
            endedMarkets={endedMarkets}
            userPositions={userPositions}
            onSelectMarket={setSelectedMarket}
            loading={marketsLoading}
          />
        )}

        {activeTab === 'leaderboard' && (
          <ArenaEarningsLeaderboard
            leaderboard={earningsLeaderboard}
            currentUserId={user?.id}
            loading={marketsLoading}
          />
        )}

        {activeTab === 'bets' && (
          <ArenaMyBets
            liveMarkets={liveMarkets}
            endedMarkets={endedMarkets}
            userPositions={userPositions}
            onSelectMarket={setSelectedMarket}
            availablePoints={availablePoints}
          />
        )}

        {activeTab === 'vote' && (
          <>
            <BattleHero
              battle={activeBattle}
              userClub={membership.club}
              hasVoted={!!userVote}
              onEnterBattle={() => {}}
              isRegistered={true}
            />
            <VotePanel
              battle={activeBattle}
              userClub={membership.club}
              userVote={userVote}
              availablePoints={points?.total_points || 0}
              onVote={handleVote}
              isVoting={voting}
              storedFingerprintHash={membership.fingerprint_hash}
            />
          </>
        )}

        {(loading || marketsLoading) && activeTab === 'vote' && (
          <div className="flex items-center justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
              <Trophy className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
        )}
      </main>

      <div className="relative z-20">
        <ArenaBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Arena;
