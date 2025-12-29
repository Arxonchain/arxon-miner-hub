import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePoints } from './usePoints';
import { toast } from '@/hooks/use-toast';

const MAX_MINING_HOURS = 8;
const BASE_POINTS_PER_HOUR = 10;

interface MiningSettings {
  publicMiningEnabled: boolean;
  claimingEnabled: boolean;
  blockReward: number;
  consensusMode: string;
}

export const useMining = () => {
  const { user } = useAuth();
  const { addPoints, triggerConfetti, points } = usePoints();
  const [isMining, setIsMining] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [miningSettings, setMiningSettings] = useState<MiningSettings>({
    publicMiningEnabled: true,
    claimingEnabled: false,
    blockReward: 1000,
    consensusMode: 'PoW'
  });
  const lastPointsAwardedRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);
  const sessionStartTimeRef = useRef<number | null>(null);

  // Calculate effective points per hour with referral bonus
  const referralBonus = points?.referral_bonus_percentage || 0;
  const pointsPerHour = BASE_POINTS_PER_HOUR * (1 + referralBonus / 100);

  const maxTimeSeconds = MAX_MINING_HOURS * 60 * 60;
  const remainingTime = Math.max(0, maxTimeSeconds - elapsedTime);

  // Fetch mining settings
  const fetchMiningSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mining_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setMiningSettings({
          publicMiningEnabled: data.public_mining_enabled,
          claimingEnabled: data.claiming_enabled,
          blockReward: data.block_reward,
          consensusMode: data.consensus_mode
        });
      }
    } catch (error) {
      console.error('Error fetching mining settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

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
          // Resume session - calculate elapsed from server start time
          setSessionId(data.id);
          setIsMining(true);
          setElapsedTime(elapsed);
          setEarnedPoints(Number(data.arx_mined));
          lastPointsAwardedRef.current = Number(data.arx_mined);
          sessionStartTimeRef.current = startTime;
        }
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    } finally {
      setLoading(false);
      initialLoadRef.current = false;
    }
  }, [user, maxTimeSeconds]);

  const startMining = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to start mining",
        variant: "destructive"
      });
      return;
    }

    // Always re-check backend setting right before starting
    try {
      const { data: settingsRow, error: settingsError } = await supabase
        .from('mining_settings')
        .select('public_mining_enabled')
        .limit(1)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (!settingsRow?.public_mining_enabled) {
        toast({
          title: "Mining Disabled",
          description: "Public mining is currently disabled",
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
      console.error('Error checking mining settings:', error);
      toast({
        title: "Error",
        description: "Could not verify mining status",
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

      const startTime = new Date(data.started_at).getTime();
      setSessionId(data.id);
      setIsMining(true);
      setElapsedTime(0);
      setEarnedPoints(0);
      lastPointsAwardedRef.current = 0;
      sessionStartTimeRef.current = startTime;

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
      sessionStartTimeRef.current = null;

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

  // Timer and points calculation - use server start time for accuracy
  useEffect(() => {
    if (!isMining || !sessionId || !sessionStartTimeRef.current) return;

    intervalRef.current = setInterval(async () => {
      // Calculate elapsed based on actual start time from server
      const startTime = sessionStartTimeRef.current!;
      const newElapsed = Math.floor((Date.now() - startTime) / 1000);
      
      // Check if max time reached
      if (newElapsed >= maxTimeSeconds) {
        endSession(sessionId, earnedPoints);
        return;
      }

      setElapsedTime(newElapsed);

      // Calculate points based on hours mined with referral bonus
      const hoursElapsed = newElapsed / 3600;
      const pointsEarned = Math.floor(hoursElapsed * pointsPerHour);
      
      if (pointsEarned > lastPointsAwardedRef.current) {
        lastPointsAwardedRef.current = pointsEarned;
        setEarnedPoints(pointsEarned);
        
        // Update session in database periodically (every point change)
        supabase
          .from('mining_sessions')
          .update({ arx_mined: pointsEarned })
          .eq('id', sessionId);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMining, sessionId, maxTimeSeconds, pointsPerHour]);

  // Initial fetch
  useEffect(() => {
    (async () => {
      await fetchMiningSettings();
      await checkActiveSession();
    })();
  }, [checkActiveSession, fetchMiningSettings]);

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
              sessionStartTimeRef.current = null;
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up mining_sessions subscription');
      supabase.removeChannel(channel);
    };
  }, [user, sessionId]);

  // Use refs to track current values for the realtime callback
  const isMiningRef = useRef(isMining);
  const sessionIdRef = useRef(sessionId);
  const earnedPointsRef = useRef(earnedPoints);
  
  useEffect(() => {
    isMiningRef.current = isMining;
  }, [isMining]);
  
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);
  
  useEffect(() => {
    earnedPointsRef.current = earnedPoints;
  }, [earnedPoints]);

  // Real-time subscription for mining settings (admin controls)
  useEffect(() => {
    console.log('Setting up real-time subscription for mining_settings');
    
    const channel = supabase
      .channel('mining-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mining_settings'
        },
        async (payload) => {
          console.log('Real-time mining settings update:', payload);
          const newSettings = payload.new as any;
          
          setMiningSettings({
            publicMiningEnabled: newSettings.public_mining_enabled,
            claimingEnabled: newSettings.claiming_enabled,
            blockReward: newSettings.block_reward,
            consensusMode: newSettings.consensus_mode
          });

          // If mining was just disabled and user is mining, stop their session
          if (!newSettings.public_mining_enabled && isMiningRef.current && sessionIdRef.current) {
            toast({
              title: "Mining Disabled",
              description: "Public mining has been disabled by admin. Your session has ended.",
              variant: "destructive"
            });
            await endSession(sessionIdRef.current, earnedPointsRef.current);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up mining_settings subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isMining,
    loading,
    settingsLoading,
    elapsedTime,
    remainingTime,
    earnedPoints,
    maxTimeSeconds,
    startMining,
    stopMining,
    formatTime,
    referralBonus,
    pointsPerHour,
    miningSettings
  };
};
