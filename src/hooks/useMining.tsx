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
  const [earnedPoints, setEarnedPoints] = useState(0); // Fractional points for display
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [miningSettings, setMiningSettings] = useState<MiningSettings>({
    publicMiningEnabled: true,
    claimingEnabled: false,
    blockReward: 1000,
    consensusMode: 'PoW'
  });
  const lastDbPointsRef = useRef(0); // Track last whole points saved to DB
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);
  const sessionStartTimeRef = useRef<number | null>(null);

  // Calculate effective points per hour with referral bonus
  const referralBonus = points?.referral_bonus_percentage || 0;
  const pointsPerHour = BASE_POINTS_PER_HOUR * (1 + referralBonus / 100);
  
  // Points per second for real-time display
  const pointsPerSecond = pointsPerHour / 3600;

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
          // Resume session - calculate fractional points based on elapsed time
          const fractionalPoints = (elapsed / 3600) * pointsPerHour;
          setSessionId(data.id);
          setIsMining(true);
          setElapsedTime(elapsed);
          setEarnedPoints(fractionalPoints);
          lastDbPointsRef.current = Math.floor(fractionalPoints);
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
      lastDbPointsRef.current = 0;
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
      lastDbPointsRef.current = 0;
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
  // Update every 100ms for smooth fractional point display
  useEffect(() => {
    if (!isMining || !sessionId || !sessionStartTimeRef.current) return;

    intervalRef.current = setInterval(async () => {
      // Calculate elapsed based on actual start time from server (in milliseconds for precision)
      const startTime = sessionStartTimeRef.current!;
      const elapsedMs = Date.now() - startTime;
      const newElapsed = Math.floor(elapsedMs / 1000);
      
      // Check if max time reached
      if (newElapsed >= maxTimeSeconds) {
        const finalPoints = Math.floor((newElapsed / 3600) * pointsPerHour);
        endSession(sessionId, finalPoints);
        return;
      }

      setElapsedTime(newElapsed);

      // Calculate fractional points for real-time display
      const secondsElapsed = elapsedMs / 1000;
      const fractionalPoints = (secondsElapsed / 3600) * pointsPerHour;
      setEarnedPoints(fractionalPoints);
      
      // Only update database when whole points change (to avoid excessive writes)
      const wholePoints = Math.floor(fractionalPoints);
      if (wholePoints > lastDbPointsRef.current) {
        lastDbPointsRef.current = wholePoints;
        supabase
          .from('mining_sessions')
          .update({ arx_mined: wholePoints })
          .eq('id', sessionId);
      }
    }, 100); // Update every 100ms for smooth display

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
    pointsPerSecond,
    miningSettings
  };
};
