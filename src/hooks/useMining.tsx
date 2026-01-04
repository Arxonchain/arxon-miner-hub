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

interface ArenaBoost {
  boost_percentage: number;
  expires_at: string;
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
  const [xProfileBoost, setXProfileBoost] = useState(0);
  const [arenaBoosts, setArenaBoosts] = useState<ArenaBoost[]>([]); 
  const lastDbPointsRef = useRef(0); // Track last whole points saved to DB
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);
  const sessionStartTimeRef = useRef<number | null>(null);

  // Fetch X profile boost
  const fetchXProfileBoost = useCallback(async () => {
    if (!user) {
      setXProfileBoost(0);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('x_profiles')
        .select('boost_percentage')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!error && data) {
        setXProfileBoost(data.boost_percentage || 0);
      }
    } catch (err) {
      console.error('Error fetching X profile boost:', err);
    }
  }, [user]);

  // Fetch arena boosts
  const fetchArenaBoosts = useCallback(async () => {
    if (!user) {
      setArenaBoosts([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('arena_boosts')
        .select('boost_percentage, expires_at')
        .eq('user_id', user.id)
        .gte('expires_at', new Date().toISOString());
      
      if (!error && data) {
        setArenaBoosts(data);
      }
    } catch (err) {
      console.error('Error fetching arena boosts:', err);
    }
  }, [user]);

  // Calculate all boost sources separately
  const referralBonus = points?.referral_bonus_percentage || 0; // Only from referrals
  const xPostBoost = (points as any)?.x_post_boost_percentage || 0; // From X social submissions
  const totalArenaBoost = arenaBoosts.reduce((sum, b) => sum + b.boost_percentage, 0);
  
  // Streak boost: +1% per consecutive day, capped at 30%
  const streakBoost = Math.min(points?.daily_streak || 0, 30);
  
  // X profile scan boost is tracked separately in x_profiles table
  // xProfileBoost comes from the scan-x-profile edge function
  
  // Total boost = referral + X scan + X posts + arena + streak
  // CAP total boost at 500% to prevent exploits
  const rawTotalBoost = referralBonus + xProfileBoost + xPostBoost + totalArenaBoost + streakBoost;
  const totalBoostPercentage = Math.min(rawTotalBoost, 500);
  
  // Calculate effective points per hour with ALL boosts
  // Max: 10 base * (1 + 5) = 60 points/hour maximum
  const pointsPerHour = BASE_POINTS_PER_HOUR * (1 + totalBoostPercentage / 100);
  
  // CAP points per hour at 60 (10 base + 500% boost max)
  const cappedPointsPerHour = Math.min(pointsPerHour, 60);
  
  // Points per second for real-time display
  const pointsPerSecond = cappedPointsPerHour / 3600;
  
  // Log when mining rate changes for debugging
  useEffect(() => {
    console.log('Mining rate updated:', { 
      referralBonus, 
      xProfileBoost, 
      xPostBoost,
      totalArenaBoost,
      streakBoost,
      rawTotalBoost,
      totalBoostPercentage,
      cappedPointsPerHour, 
      pointsPerSecond 
    });
  }, [referralBonus, xProfileBoost, xPostBoost, totalArenaBoost, streakBoost, rawTotalBoost, totalBoostPercentage, cappedPointsPerHour, pointsPerSecond]);

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

  const finalizeSessionSilently = useCallback(
    async (session: { id: string; started_at: string; arx_mined?: number | null }) => {
      const startTime = new Date(session.started_at).getTime();
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      const effectiveSeconds = Math.min(elapsedSeconds, maxTimeSeconds);

      const calculatedPoints = Math.min(
        480,
        Math.floor((effectiveSeconds / 3600) * cappedPointsPerHour)
      );
      const dbPoints = Math.max(0, Math.floor(Number(session.arx_mined ?? 0)));
      const finalPoints = Math.max(calculatedPoints, dbPoints);

      // Only credit if we actually ended an active session (prevents double-credit)
      const { data: updated, error: updateError } = await supabase
        .from('mining_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          arx_mined: finalPoints
        })
        .eq('id', session.id)
        .eq('is_active', true)
        .select('id')
        .maybeSingle();

      if (updateError) throw updateError;
      if (!updated) return 0;

      if (finalPoints > 0) {
        await addPoints(finalPoints, 'mining');
      }

      return finalPoints;
    },
    [addPoints, cappedPointsPerHour, maxTimeSeconds]
  );

  const checkActiveSession = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch ALL active sessions for this user, order by most recent
      const { data: sessions, error } = await supabase
        .from('mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('started_at', { ascending: false });

      if (error) throw error;

      if (sessions && sessions.length > 0) {
        // Use the most recent session
        const latestSession = sessions[0];

        // If duplicates exist, end & credit them (don’t silently discard mined time)
        if (sessions.length > 1) {
          console.log(`Found ${sessions.length} active sessions, ending duplicates...`);
          const duplicates = sessions.slice(1);
          await Promise.allSettled(duplicates.map((s) => finalizeSessionSilently(s as any)));
        }

        const startTime = new Date(latestSession.started_at).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);

        if (elapsed >= maxTimeSeconds) {
          // Session expired, end it - calculate points based on elapsed time
          // Use max 8 hours * rate, capped at 480
          const calculatedPoints = Math.min(
            480,
            Math.floor((maxTimeSeconds / 3600) * cappedPointsPerHour)
          );
          await endSession(latestSession.id, calculatedPoints);
        } else {
          // Resume session - RECALCULATE points based on elapsed time, not DB value
          // This handles cases where user closed browser and arx_mined wasn't saved
          const calculatedPoints = Math.min(480, (elapsed / 3600) * cappedPointsPerHour);
          const dbPoints = latestSession.arx_mined || 0;

          // Use whichever is higher: calculated or DB (in case of timing issues)
          const resumePoints = Math.max(calculatedPoints, dbPoints);

          setSessionId(latestSession.id);
          setIsMining(true);
          setElapsedTime(elapsed);
          setEarnedPoints(resumePoints);
          lastDbPointsRef.current = Math.floor(resumePoints);
          sessionStartTimeRef.current = startTime;

          // Update DB with calculated points if they're higher than what was saved
          if (calculatedPoints > dbPoints) {
            await supabase
              .from('mining_sessions')
              .update({ arx_mined: Math.floor(calculatedPoints) })
              .eq('id', latestSession.id);
          }

          console.log('Resumed mining session:', {
            sessionId: latestSession.id,
            elapsed,
            calculatedPoints,
            dbPoints,
            resumePoints,
            startTime,
            closedDuplicates: sessions.length - 1
          });
        }
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    } finally {
      setLoading(false);
      initialLoadRef.current = false;
    }
  }, [user, maxTimeSeconds, cappedPointsPerHour, finalizeSessionSilently]);

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
      // End & credit any existing active sessions for this user (prevents duplicates without losing points)
      const { data: existingSessions, error: existingError } = await supabase
        .from('mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('started_at', { ascending: false });

      if (existingError) throw existingError;

      if (existingSessions && existingSessions.length > 0) {
        await Promise.allSettled(
          existingSessions.map((s) => finalizeSessionSilently(s as any))
        );
      }

      // Now create a fresh session
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
    // Use whole earned points for claiming
    const pointsToClaim = Math.floor(earnedPoints);
    await endSession(sessionId, pointsToClaim);
  };
  
  // Claim current earned points without stopping mining
  const claimPoints = async () => {
    if (!sessionId || !user) return;
    
    const pointsToClaim = Math.floor(earnedPoints);
    if (pointsToClaim <= 0) {
      toast({
        title: "Nothing to Claim",
        description: "Keep mining to earn points",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Add points to total balance
      await addPoints(pointsToClaim, 'mining');
      
      // Reset earned points display (keep mining)
      setEarnedPoints(0);
      lastDbPointsRef.current = 0;
      
      // Update session start time to now for fresh count
      const newStartTime = Date.now();
      sessionStartTimeRef.current = newStartTime;
      
      // Update the session in database
      await supabase
        .from('mining_sessions')
        .update({ 
          started_at: new Date(newStartTime).toISOString(),
          arx_mined: 0 
        })
        .eq('id', sessionId);
      
      // Reset elapsed time
      setElapsedTime(0);
      
      toast({
        title: "Points Claimed! 🎉",
        description: `+${pointsToClaim} ARX-P added to your balance`,
      });
      triggerConfetti();
    } catch (error) {
      console.error('Error claiming points:', error);
      toast({
        title: "Claim Failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
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
        // Use capped rate to prevent exploits - MAX 480 points in 8 hours (60/hr * 8hr)
        const finalPoints = Math.min(480, Math.floor((newElapsed / 3600) * cappedPointsPerHour));
        endSession(sessionId, finalPoints);
        return;
      }

      setElapsedTime(newElapsed);

      // Calculate fractional points for real-time display - always positive, start from 0
      // Use capped rate to prevent exploits
      const secondsElapsed = elapsedMs / 1000;
      const fractionalPoints = Math.max(0, Math.min(480, (secondsElapsed / 3600) * cappedPointsPerHour));
      setEarnedPoints(fractionalPoints);
      
      // Only update database when whole points change (to avoid excessive writes)
      // Double-check cap before saving
      const wholePoints = Math.min(480, Math.floor(fractionalPoints));
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
  }, [isMining, sessionId, maxTimeSeconds, cappedPointsPerHour]);

  // Initial fetch - including all boost sources
  useEffect(() => {
    (async () => {
      await fetchMiningSettings();
      await fetchXProfileBoost();
      await fetchArenaBoosts();
      await checkActiveSession();
    })();
  }, [checkActiveSession, fetchMiningSettings, fetchXProfileBoost, fetchArenaBoosts]);

  // Real-time subscription for X profile boost changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('x-profile-boost-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'x_profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time X profile update:', payload);
          if (payload.new) {
            const newProfile = payload.new as any;
            setXProfileBoost(newProfile.boost_percentage || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Real-time subscription for arena boost changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('arena-boost-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'arena_boosts',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refetch arena boosts on any change
          fetchArenaBoosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchArenaBoosts]);

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
    earnedPoints: Math.max(0, earnedPoints), // Ensure never negative
    maxTimeSeconds,
    startMining,
    stopMining,
    claimPoints,
    formatTime,
    // Boost breakdown for UI display
    referralBonus,       // From referrals only
    xProfileBoost,       // From X profile scan (hashtag posts)
    xPostBoost,          // From X post submissions (social yapping)
    totalArenaBoost,
    streakBoost,         // From daily check-in streak (+1%/day, max 30%)
    totalBoostPercentage, // Capped at 500%
    // Unified rate (capped at 60/hr max)
    pointsPerHour: cappedPointsPerHour,
    pointsPerSecond,
    miningSettings
  };
};
