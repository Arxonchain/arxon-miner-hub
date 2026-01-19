import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePoints } from './usePoints';
import { toast } from 'sonner';

export interface ArenaMarket {
  id: string;
  title: string;
  description: string | null;
  side_a_name: string;
  side_a_image: string | null;
  side_a_color: string;
  side_b_name: string;
  side_b_image: string | null;
  side_b_color: string;
  side_a_power: number;
  side_b_power: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  winner_side: string | null;
  winner_boost_percentage: number;
  prize_pool: number;
  bonus_percentage: number;
  category: string;
  resolution_source: string | null;
  total_participants: number;
}

export interface MarketVote {
  id: string;
  battle_id: string;
  user_id: string;
  side: 'a' | 'b';
  power_spent: number;
  locked_until: string;
  created_at: string;
}

export interface EarningsLeaderboardEntry {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  total_battles: number;
  total_wins: number;
  total_staked: number;
  total_earned: number;
  total_bonus_earned: number;
  total_pool_share_earned: number;
  win_rate: number;
}

export interface UserMarketPosition {
  marketId: string;
  side: 'a' | 'b';
  staked: number;
  potentialWin: number;
}

export type MarketStatus = 'live' | 'upcoming' | 'ended';

export const useArenaMarkets = () => {
  const { user } = useAuth();
  const { points } = usePoints();
  
  const [liveMarkets, setLiveMarkets] = useState<ArenaMarket[]>([]);
  const [upcomingMarkets, setUpcomingMarkets] = useState<ArenaMarket[]>([]);
  const [endedMarkets, setEndedMarkets] = useState<ArenaMarket[]>([]);
  const [userPositions, setUserPositions] = useState<Map<string, MarketVote>>(new Map());
  const [earningsLeaderboard, setEarningsLeaderboard] = useState<EarningsLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<ArenaMarket | null>(null);

  // Fetch all markets categorized by status
  const fetchMarkets = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      
      // Fetch all battles
      const { data: allMarkets, error } = await supabase
        .from('arena_battles')
        .select('*')
        .order('ends_at', { ascending: true });

      if (error) throw error;

      const markets = (allMarkets || []) as ArenaMarket[];
      
      // Categorize markets
      const live: ArenaMarket[] = [];
      const upcoming: ArenaMarket[] = [];
      const ended: ArenaMarket[] = [];

      markets.forEach(market => {
        const startsAt = new Date(market.starts_at);
        const endsAt = new Date(market.ends_at);
        const nowDate = new Date();

        if (!market.is_active && market.winner_side) {
          ended.push(market);
        } else if (startsAt > nowDate) {
          upcoming.push(market);
        } else if (endsAt > nowDate && market.is_active) {
          live.push(market);
        } else {
          ended.push(market);
        }
      });

      // Sort: live by ending soonest, upcoming by starting soonest, ended by most recent
      live.sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime());
      upcoming.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
      ended.sort((a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime());

      setLiveMarkets(live);
      setUpcomingMarkets(upcoming);
      setEndedMarkets(ended.slice(0, 20)); // Last 20 ended

      return { live, upcoming, ended };
    } catch (error) {
      console.error('Error fetching markets:', error);
      return { live: [], upcoming: [], ended: [] };
    }
  }, []);

  // Fetch user's positions in all markets
  const fetchUserPositions = useCallback(async () => {
    if (!user) {
      setUserPositions(new Map());
      return;
    }

    try {
      const { data: votes, error } = await supabase
        .from('arena_votes')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const positionsMap = new Map<string, MarketVote>();
      (votes || []).forEach((vote: any) => {
        positionsMap.set(vote.battle_id, vote as MarketVote);
      });

      setUserPositions(positionsMap);
    } catch (error) {
      console.error('Error fetching user positions:', error);
    }
  }, [user]);

  // Fetch earnings leaderboard
  const fetchEarningsLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('arena_earnings_leaderboard')
        .select('*')
        .limit(100);

      if (error) throw error;
      setEarningsLeaderboard((data || []) as EarningsLeaderboardEntry[]);
    } catch (error) {
      console.error('Error fetching earnings leaderboard:', error);
    }
  }, []);

  // Calculate potential returns for a stake
  const calculatePotentialReturns = useCallback((
    market: ArenaMarket,
    side: 'a' | 'b',
    stakeAmount: number
  ) => {
    const myPool = side === 'a' ? market.side_a_power : market.side_b_power;
    const theirPool = side === 'a' ? market.side_b_power : market.side_a_power;
    
    const newMyPool = myPool + stakeAmount;
    const totalPool = newMyPool + theirPool;
    const prizePool = market.prize_pool || 0;
    const bonusPercentage = market.bonus_percentage || 200;

    // Calculate pool-based multiplier (2x-5x)
    let multiplier: number;
    if (newMyPool >= theirPool) {
      const ratio = theirPool / newMyPool;
      multiplier = Math.min(2 + (ratio * 3), 5);
    } else {
      multiplier = 5;
    }

    // Potential winnings breakdown
    const stakeReturn = stakeAmount; // Original stake back
    const bonusFromPrizePool = (stakeAmount / newMyPool) * prizePool * (bonusPercentage / 100);
    const loserPoolShare = (stakeAmount / newMyPool) * theirPool;
    const multiplierBonus = stakeAmount * (multiplier - 1);
    
    const totalWin = stakeReturn + bonusFromPrizePool + loserPoolShare + multiplierBonus;
    const totalLoss = stakeAmount; // Lose everything

    return {
      multiplier,
      bonusPercentage,
      stakeReturn,
      bonusFromPrizePool: Math.round(bonusFromPrizePool),
      loserPoolShare: Math.round(loserPoolShare),
      multiplierBonus: Math.round(multiplierBonus),
      totalWin: Math.round(totalWin),
      totalLoss,
      isUnderdog: newMyPool < theirPool,
      myPoolPercentage: totalPool > 0 ? Math.round((newMyPool / totalPool) * 100) : 50,
      winChance: totalPool > 0 ? Math.round((newMyPool / totalPool) * 100) : 50,
    };
  }, []);

  // Place a bet on a market
  const placeBet = async (marketId: string, side: 'a' | 'b', amount: number): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in to place a bet');
      return false;
    }

    if (!points || points.total_points < amount) {
      toast.error('Insufficient ARX-P points');
      return false;
    }

    if (amount < 100) {
      toast.error('Minimum bet is 100 ARX-P');
      return false;
    }

    if (amount > 1000000) {
      toast.error('Maximum bet is 1,000,000 ARX-P');
      return false;
    }

    // Check if user already has a position in this market
    if (userPositions.has(marketId)) {
      toast.error('You already have a position in this market');
      return false;
    }

    setVoting(true);

    try {
      const { error: voteError } = await supabase
        .from('arena_votes')
        .insert({
          battle_id: marketId,
          user_id: user.id,
          side,
          power_spent: amount,
        });

      if (voteError) throw voteError;

      toast.success('Bet placed successfully! +25% mining boost activated 🚀');
      
      // Refresh data
      await Promise.all([
        fetchMarkets(),
        fetchUserPositions(),
      ]);

      return true;
    } catch (error: any) {
      console.error('Error placing bet:', error);
      toast.error(error.message || 'Failed to place bet');
      return false;
    } finally {
      setVoting(false);
    }
  };

  // Initial data load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchMarkets(),
        fetchUserPositions(),
        fetchEarningsLeaderboard(),
      ]);
      setLoading(false);
    };

    init();
  }, [fetchMarkets, fetchUserPositions, fetchEarningsLeaderboard]);

  // Real-time subscription for market updates
  useEffect(() => {
    const channel = supabase
      .channel('arena-markets-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'arena_battles',
        },
        () => {
          fetchMarkets();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arena_votes',
        },
        () => {
          fetchMarkets();
          if (user) fetchUserPositions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMarkets, fetchUserPositions, user]);

  return {
    liveMarkets,
    upcomingMarkets,
    endedMarkets,
    userPositions,
    earningsLeaderboard,
    loading,
    voting,
    selectedMarket,
    setSelectedMarket,
    placeBet,
    calculatePotentialReturns,
    refreshMarkets: fetchMarkets,
    refreshLeaderboard: fetchEarningsLeaderboard,
    availablePoints: points?.total_points || 0,
  };
};
