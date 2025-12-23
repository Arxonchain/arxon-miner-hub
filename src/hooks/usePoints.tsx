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
        // Create initial points record
        const { data: newPoints, error: createError } = await supabase
          .from('user_points')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        setPoints(newPoints);
      } else {
        setPoints(data);
      }

      // Fetch rank
      const { data: allPoints } = await supabase
        .from('user_points')
        .select('user_id, total_points')
        .order('total_points', { ascending: false });

      if (allPoints) {
        const userRank = allPoints.findIndex(p => p.user_id === user.id) + 1;
        setRank(userRank > 0 ? userRank : null);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addPoints = useCallback(async (amount: number, type: 'mining' | 'task' | 'social' | 'referral') => {
    if (!user || !points) return;

    const columnMap = {
      mining: 'mining_points',
      task: 'task_points',
      social: 'social_points',
      referral: 'referral_points'
    };

    const column = columnMap[type];
    const newTotal = points.total_points + amount;
    const newTypePoints = (points as any)[column] + amount;

    const { error } = await supabase
      .from('user_points')
      .update({
        total_points: newTotal,
        [column]: newTypePoints,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (!error) {
      setPoints(prev => prev ? {
        ...prev,
        total_points: newTotal,
        [column]: newTypePoints
      } : null);
      
      // Trigger confetti for significant rewards
      if (amount >= 10) {
        triggerConfetti();
      }
    }
  }, [user, points]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  return { points, loading, rank, addPoints, refreshPoints: fetchPoints, triggerConfetti };
};
