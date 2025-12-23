import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePoints } from './usePoints';
import { toast } from '@/hooks/use-toast';

const CHECKIN_BASE_POINTS = 5;
const STREAK_BONUS_MULTIPLIER = 2;

export const useCheckin = () => {
  const { user } = useAuth();
  const { addPoints, triggerConfetti, points, refreshPoints } = usePoints();
  const [canCheckin, setCanCheckin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayCheckin, setTodayCheckin] = useState<any>(null);

  const checkTodayCheckin = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('checkin_date', today)
        .maybeSingle();

      if (error) throw error;

      setTodayCheckin(data);
      setCanCheckin(!data);
    } catch (error) {
      console.error('Error checking today checkin:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const performCheckin = async () => {
    if (!user || !canCheckin) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      // Check if yesterday was checked in
      const { data: yesterdayCheckin } = await supabase
        .from('daily_checkins')
        .select('streak_day')
        .eq('user_id', user.id)
        .eq('checkin_date', yesterday)
        .maybeSingle();

      const streakDay = yesterdayCheckin ? yesterdayCheckin.streak_day + 1 : 1;
      const streakBonus = Math.floor(streakDay / 7) * STREAK_BONUS_MULTIPLIER;
      const pointsToAward = CHECKIN_BASE_POINTS + streakBonus;

      const { data, error } = await supabase
        .from('daily_checkins')
        .insert({
          user_id: user.id,
          checkin_date: today,
          points_awarded: pointsToAward,
          streak_day: streakDay
        })
        .select()
        .single();

      if (error) throw error;

      // Update user points
      await supabase
        .from('user_points')
        .update({
          daily_streak: streakDay,
          last_checkin_date: today,
          total_points: (points?.total_points || 0) + pointsToAward,
          task_points: (points?.task_points || 0) + pointsToAward
        })
        .eq('user_id', user.id);

      setTodayCheckin(data);
      setCanCheckin(false);
      triggerConfetti();

      toast({
        title: `Daily Check-in Complete! 🔥`,
        description: `+${pointsToAward} ARX-P | Streak: ${streakDay} days`,
      });

      refreshPoints();
    } catch (error: any) {
      console.error('Error performing checkin:', error);
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Initial fetch
  useEffect(() => {
    checkTodayCheckin();
  }, [checkTodayCheckin]);

  // Real-time subscription for check-ins
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for daily_checkins');
    
    const channel = supabase
      .channel('checkin-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'daily_checkins',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time checkin update:', payload);
          const today = new Date().toISOString().split('T')[0];
          const checkin = payload.new as any;
          
          if (checkin.checkin_date === today) {
            setTodayCheckin(checkin);
            setCanCheckin(false);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up daily_checkins subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    canCheckin,
    loading,
    todayCheckin,
    performCheckin,
    currentStreak: points?.daily_streak || 0
  };
};
