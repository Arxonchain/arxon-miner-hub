import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  daily_streak: number;
  username?: string;
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

      // Fetch profiles for usernames
      const userIds = pointsData.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      // Combine data
      const leaderboardWithRanks = pointsData.map((entry, index) => {
        const profile = profiles?.find(p => p.user_id === entry.user_id);
        return {
          ...entry,
          username: profile?.username || `Miner${entry.user_id.slice(0, 4)}`,
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

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { leaderboard, loading, refreshLeaderboard: fetchLeaderboard };
};
