import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import confetti from 'canvas-confetti';

interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  daily_streak: number;
  last_checkin_date: string | null;
  mining_points: number;
  task_points: number;
  social_points: number;
  referral_points: number;
  referral_bonus_percentage: number; // Boost from referrals only
  x_post_boost_percentage: number;   // Boost from X post submissions (social yapping)
}

export const usePoints = () => {
  const { user } = useAuth();
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [rank, setRank] = useState<number | null>(null);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6B8CAE', '#8BA4C4', '#A0B8D4', '#C0D0E0']
    });
  };

  const fetchPoints = useCallback(async () => {
    if (!user) {
      setPoints(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Ensure an initial row exists without race-condition unique errors
        const { error: ensureError } = await supabase
          .from('user_points')
          .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });

        if (ensureError) throw ensureError;

        const { data: ensured, error: ensuredError } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (ensuredError) throw ensuredError;
        setPoints(ensured ?? null);
      } else {
        setPoints(data);
      }

      // Fetch rank from the secure leaderboard view (user_points is private by RLS)
      const { data: leaderboardRows } = await supabase
        .from('leaderboard_view')
        .select('user_id')
        .order('total_points', { ascending: false })
        .limit(1000);

      if (leaderboardRows) {
        const userRank = leaderboardRows.findIndex((p) => p.user_id === user.id) + 1;
        setRank(userRank > 0 ? userRank : null);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addPoints = useCallback(async (amount: number, type: 'mining' | 'task' | 'social' | 'referral') => {
    if (!user) return;

    // Validate amount client-side first
    const safeAmount = Math.min(Math.max(Math.floor(amount), 0), 10000);
    if (safeAmount <= 0) return;

    try {
      // Use server-side RPC for atomic, safe point increments
      const { data, error } = await supabase.rpc('increment_user_points', {
        p_user_id: user.id,
        p_amount: safeAmount,
        p_type: type
      });

      if (error) {
        console.error('Error adding points via RPC:', error);
        return;
      }

      // Update local state from returned row
      if (data) {
        setPoints(data as UserPoints);
      }

      // Trigger confetti for significant rewards
      if (safeAmount >= 10) {
        triggerConfetti();
      }
    } catch (err) {
      console.error('Error adding points:', err);
    }
  }, [user, triggerConfetti]);

  // Initial fetch
  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  // Real-time subscription for user's own points
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for user_points');
    
    const channel = supabase
      .channel('user-points-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time points update:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setPoints(payload.new as UserPoints);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up user_points subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { points, loading, rank, addPoints, refreshPoints: fetchPoints, triggerConfetti };
};
