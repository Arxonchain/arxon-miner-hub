import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePoints } from './usePoints';
import { toast } from '@/hooks/use-toast';

const MAX_MINING_HOURS = 8;
const BASE_POINTS_PER_HOUR = 10;

export const useMining = () => {
  const { user } = useAuth();
  const { addPoints, triggerConfetti, points } = usePoints();
  const [isMining, setIsMining] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const lastPointsAwardedRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate effective points per hour with referral bonus
  const referralBonus = points?.referral_bonus_percentage || 0;
  const pointsPerHour = BASE_POINTS_PER_HOUR * (1 + referralBonus / 100);

  const maxTimeSeconds = MAX_MINING_HOURS * 60 * 60;
  const remainingTime = Math.max(0, maxTimeSeconds - elapsedTime);

  const checkActiveSession = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const startTime = new Date(data.started_at).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        
        if (elapsed >= maxTimeSeconds) {
          // Session expired, end it
          await endSession(data.id, data.arx_mined);
        } else {
          setSessionId(data.id);
          setIsMining(true);
          setElapsedTime(elapsed);
          setEarnedPoints(Number(data.arx_mined));
          lastPointsAwardedRef.current = Number(data.arx_mined);
        }
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const startMining = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to start mining",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mining_sessions')
        .insert({
          user_id: user.id,
          is_active: true,
          arx_mined: 0
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(data.id);
      setIsMining(true);
      setElapsedTime(0);
      setEarnedPoints(0);
      lastPointsAwardedRef.current = 0;

      toast({
        title: "Mining Started! ⛏️",
        description: "You're now earning ARX-P points",
      });
      triggerConfetti();
    } catch (error) {
      console.error('Error starting mining:', error);
      toast({
        title: "Error",
        description: "Failed to start mining session",
        variant: "destructive"
      });
    }
  };

  const endSession = async (id: string, finalPoints: number) => {
    try {
      await supabase
        .from('mining_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          arx_mined: finalPoints
        })
        .eq('id', id);

      // Add earned points to total
      if (finalPoints > 0) {
        await addPoints(finalPoints, 'mining');
      }

      setIsMining(false);
      setSessionId(null);
      setElapsedTime(0);
      setEarnedPoints(0);
      lastPointsAwardedRef.current = 0;

      toast({
        title: "Mining Session Complete! 🎉",
        description: `You earned ${finalPoints} ARX-P points`,
      });
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const stopMining = async () => {
    if (!sessionId) return;
    await endSession(sessionId, earnedPoints);
  };

  // Timer and points calculation
  useEffect(() => {
    if (!isMining || !sessionId) return;

    intervalRef.current = setInterval(async () => {
      setElapsedTime(prev => {
        const newElapsed = prev + 1;
        
        // Check if max time reached
        if (newElapsed >= maxTimeSeconds) {
          endSession(sessionId, earnedPoints);
          return prev;
        }

        // Calculate points based on hours mined with referral bonus
        const hoursElapsed = newElapsed / 3600;
        const pointsEarned = Math.floor(hoursElapsed * pointsPerHour);
        
        if (pointsEarned > lastPointsAwardedRef.current) {
          lastPointsAwardedRef.current = pointsEarned;
          setEarnedPoints(pointsEarned);
          
          // Update session in database
          supabase
            .from('mining_sessions')
            .update({ arx_mined: pointsEarned })
            .eq('id', sessionId);
        }

        return newElapsed;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMining, sessionId, earnedPoints]);

  // Initial fetch
  useEffect(() => {
    checkActiveSession();
  }, [checkActiveSession]);

  // Real-time subscription for mining sessions
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for mining_sessions');
    
    const channel = supabase
      .channel('mining-session-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mining_sessions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time mining session update:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const session = payload.new as any;
            if (!session.is_active && session.id === sessionId) {
              // Session was ended (possibly from another tab)
              setIsMining(false);
              setSessionId(null);
            }
            setEarnedPoints(Number(session.arx_mined));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up mining_sessions subscription');
      supabase.removeChannel(channel);
    };
  }, [user, sessionId]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isMining,
    loading,
    elapsedTime,
    remainingTime,
    earnedPoints,
    maxTimeSeconds,
    startMining,
    stopMining,
    formatTime,
    referralBonus,
    pointsPerHour
  };
};
