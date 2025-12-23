import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  daily_streak: number;
  username?: string;
  avatar_url?: string;
  rank: number;
}

export const useLeaderboard = (limit: number = 100) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      // Fetch user points ordered by total_points
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('user_id, total_points, daily_streak')
        .order('total_points', { ascending: false })
        .limit(limit);

      if (pointsError) throw pointsError;

      if (!pointsData || pointsData.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

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
  }, [limit]);

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

  return { leaderboard, loading, refreshLeaderboard: fetchLeaderboard };
};
