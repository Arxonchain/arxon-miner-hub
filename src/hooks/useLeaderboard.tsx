import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  daily_streak: number;
  username?: string;
  avatar_url?: string;
  rank: number;
  created_at?: string;
}

export type TimeFilter = 'all' | 'month' | 'week' | '7days';

interface LeaderboardTotals {
  totalPoints: number;
  totalMiners: number;
}

export const useLeaderboard = (limit: number = 100, timeFilter: TimeFilter = 'all') => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totals, setTotals] = useState<LeaderboardTotals>({ totalPoints: 0, totalMiners: 0 });
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on filter
      let startDate: Date | null = null;
      const now = new Date();
      
      switch (timeFilter) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '7days':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'all':
        default:
          startDate = null;
          break;
      }

      // Build query
      let query = supabase
        .from('user_points')
        .select('user_id, total_points, daily_streak, created_at')
        .order('total_points', { ascending: false })
        .limit(limit);

      // For time-based filters, we filter by created_at or updated_at
      if (startDate) {
        query = query.gte('updated_at', startDate.toISOString());
      }

      const { data: pointsData, error: pointsError } = await query;

      if (pointsError) throw pointsError;

      if (!pointsData || pointsData.length === 0) {
        setLeaderboard([]);
        setTotals({ totalPoints: 0, totalMiners: 0 });
        setLoading(false);
        return;
      }

      // Calculate totals for the period
      const periodTotals = {
        totalPoints: pointsData.reduce((sum, p) => sum + Number(p.total_points || 0), 0),
        totalMiners: pointsData.length,
      };
      setTotals(periodTotals);

      // Fetch profiles for usernames and avatars
      const userIds = pointsData.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      // Combine data
      const leaderboardWithRanks = pointsData.map((entry, index) => {
        const profile = profiles?.find(p => p.user_id === entry.user_id);
        return {
          ...entry,
          username: profile?.username || `Miner${entry.user_id.slice(0, 4)}`,
          avatar_url: profile?.avatar_url || undefined,
          rank: index + 1
        };
      });

      setLeaderboard(leaderboardWithRanks);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [limit, timeFilter]);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Real-time subscription for all user_points changes
  useEffect(() => {
    console.log('Setting up real-time subscription for leaderboard');
    
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points'
        },
        (payload) => {
          console.log('Real-time leaderboard update:', payload);
          // Refetch the entire leaderboard to get proper rankings
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up leaderboard subscription');
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  return { leaderboard, totals, loading, refreshLeaderboard: fetchLeaderboard };
};
