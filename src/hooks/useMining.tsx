import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cacheGet, cacheSet } from '@/lib/localCache';
import { BackendUnavailableError } from '@/lib/backendHealth';
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

type UseMiningOptions = {
  /** UI tick interval; lower is smoother but more CPU. */
  tickMs?: number;
};

const miningSettingsCacheKey = 'arxon:mining_settings:v1';
const xProfileBoostCacheKey = (userId: string) => `arxon:x_profile_boost:v1:${userId}`;
const arenaBoostsCacheKey = (userId: string) => `arxon:arena_boosts:v1:${userId}`;

export const useMining = (options?: UseMiningOptions) => {
  const tickMs = Math.min(Math.max(options?.tickMs ?? 1000, 100), 5000);

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
    consensusMode: 'PoW',
  });
  const [xProfileBoost, setXProfileBoost] = useState(0);
  const [arenaBoosts, setArenaBoosts] = useState<ArenaBoost[]>([]);

  const lastDbPointsRef = useRef(0);
  const lastDbWriteAtRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialLoadRef = useRef(true);
  const sessionStartTimeRef = useRef<number | null>(null);
  const endingRef = useRef(false);

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
        const next = data.boost_percentage || 0;
        setXProfileBoost(next);
        cacheSet(xProfileBoostCacheKey(user.id), next);
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
        cacheSet(arenaBoostsCacheKey(user.id), data);
      }
    } catch (err) {
      console.error('Error fetching arena boosts:', err);
    }
  }, [user]);

  // Calculate all boost sources separately
  const referralBonus = points?.referral_bonus_percentage || 0;
  const xPostBoost = (points as any)?.x_post_boost_percentage || 0;
  const totalArenaBoost = arenaBoosts.reduce((sum, b) => sum + b.boost_percentage, 0);
  const streakBoost = Math.min(points?.daily_streak || 0, 30);

  // Total boost = referral + X scan + X posts + arena + streak (cap 500%)
  const rawTotalBoost = referralBonus + xProfileBoost + xPostBoost + totalArenaBoost + streakBoost;
  const totalBoostPercentage = Math.min(rawTotalBoost, 500);

  // Rate caps: 10/hr base, 60/hr max
  const pointsPerHour = BASE_POINTS_PER_HOUR * (1 + totalBoostPercentage / 100);
  const cappedPointsPerHour = Math.min(pointsPerHour, 60);
  const pointsPerSecond = cappedPointsPerHour / 3600;

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log('Mining rate updated:', {
      referralBonus,
      xProfileBoost,
      xPostBoost,
      totalArenaBoost,
      streakBoost,
      rawTotalBoost,
      totalBoostPercentage,
      cappedPointsPerHour,
      pointsPerSecond,
    });
  }, [
    referralBonus,
    xProfileBoost,
    xPostBoost,
    totalArenaBoost,
    streakBoost,
    rawTotalBoost,
    totalBoostPercentage,
    cappedPointsPerHour,
    pointsPerSecond,
  ]);

  const maxTimeSeconds = MAX_MINING_HOURS * 60 * 60;
  const remainingTime = Math.max(0, maxTimeSeconds - elapsedTime);

  // Fetch mining settings
  const fetchMiningSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mining_settings')
        .select('public_mining_enabled, claiming_enabled, block_reward, consensus_mode')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const next: MiningSettings = {
          publicMiningEnabled: data.public_mining_enabled,
          claimingEnabled: data.claiming_enabled,
          blockReward: data.block_reward,
          consensusMode: data.consensus_mode,
        };
        setMiningSettings(next);
        cacheSet(miningSettingsCacheKey, next);
      }
    } catch (error) {
      console.error('Error fetching mining settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const endSession = useCallback(
    async (id: string, finalPoints: number) => {
      const pointsToCredit = Math.max(0, Math.floor(finalPoints));

      try {
        await supabase
          .from('mining_sessions')
          .update({
            is_active: false,
            ended_at: new Date().toISOString(),
            arx_mined: pointsToCredit,
          })
          .eq('id', id);

        if (pointsToCredit > 0) {
          await addPoints(pointsToCredit, 'mining');
        }

        setIsMining(false);
        setSessionId(null);
        setElapsedTime(0);
        setEarnedPoints(0);
        lastDbPointsRef.current = 0;
        lastDbWriteAtRef.current = 0;
        sessionStartTimeRef.current = null;
        endingRef.current = false;

        toast({
          title: 'Mining Session Complete! 🎉',
          description: `You earned ${pointsToCredit} ARX-P points`,
        });
      } catch (error) {
        console.error('Error ending session:', error);
        // Allow another attempt if we failed to end
        endingRef.current = false;
      }
    },
    [addPoints]
  );

  const finalizeSessionSilently = useCallback(
    async (session: { id: string; started_at: string; arx_mined?: number | null }) => {
      const startTime = new Date(session.started_at).getTime();
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      const effectiveSeconds = Math.min(elapsedSeconds, maxTimeSeconds);

      const calculatedPoints = Math.min(480, Math.floor((effectiveSeconds / 3600) * cappedPointsPerHour));
      const dbPoints = Math.max(0, Math.floor(Number(session.arx_mined ?? 0)));
      const finalPoints = Math.max(calculatedPoints, dbPoints);

      const { data: updated, error: updateError } = await supabase
        .from('mining_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          arx_mined: finalPoints,
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
      const { data: sessions, error } = await supabase
        .from('mining_sessions')
        .select('id, started_at, arx_mined, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (sessions && sessions.length > 0) {
        const latestSession = sessions[0];

        if (sessions.length > 1) {
          const duplicates = sessions.slice(1);
          await Promise.allSettled(duplicates.map((s) => finalizeSessionSilently(s as any)));
        }

        const startTime = new Date(latestSession.started_at).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);

        if (elapsed >= maxTimeSeconds) {
          const calculatedPoints = Math.min(480, Math.floor((maxTimeSeconds / 3600) * cappedPointsPerHour));
          await endSession(latestSession.id, calculatedPoints);
        } else {
          const calculatedPoints = Math.min(480, (elapsed / 3600) * cappedPointsPerHour);
          const dbPoints = latestSession.arx_mined || 0;
          const resumePoints = Math.max(calculatedPoints, dbPoints);

          setSessionId(latestSession.id);
          setIsMining(true);
          setElapsedTime(elapsed);
          setEarnedPoints(resumePoints);
          lastDbPointsRef.current = Math.floor(resumePoints);
          sessionStartTimeRef.current = startTime;
          endingRef.current = false;

          if (calculatedPoints > dbPoints) {
            void supabase
              .from('mining_sessions')
              .update({ arx_mined: Math.floor(calculatedPoints) })
              .eq('id', latestSession.id);
          }
        }
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    } finally {
      setLoading(false);
      initialLoadRef.current = false;
    }
  }, [user, maxTimeSeconds, cappedPointsPerHour, finalizeSessionSilently, endSession]);

  const startMining = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please sign in to start mining',
        variant: 'destructive',
      });
      return;
    }

    if (settingsLoading) {
      toast({
        title: 'Please wait',
        description: 'Still checking mining status…',
        variant: 'destructive',
      });
      return;
    }

    if (!miningSettings.publicMiningEnabled) {
      toast({
        title: 'Mining Disabled',
        description: 'Public mining is currently disabled',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: existingSessions, error: existingError } = await supabase
        .from('mining_sessions')
        .select('id, started_at, arx_mined, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(5);

      if (existingError) throw existingError;

      if (existingSessions && existingSessions.length > 0) {
        await Promise.allSettled(existingSessions.map((s) => finalizeSessionSilently(s as any)));
      }

      const { data, error } = await supabase
        .from('mining_sessions')
        .insert({
          user_id: user.id,
          is_active: true,
          arx_mined: 0,
        })
        .select('id, started_at')
        .single();

      if (error) throw error;

      const startTime = new Date(data.started_at).getTime();
      setSessionId(data.id);
      setIsMining(true);
      setElapsedTime(0);
      setEarnedPoints(0);
      lastDbPointsRef.current = 0;
      lastDbWriteAtRef.current = 0;
      sessionStartTimeRef.current = startTime;
      endingRef.current = false;

      toast({
        title: 'Mining Started! ⛏️',
        description: "You're now earning ARX-P points",
      });
      triggerConfetti();
    } catch (error) {
      console.error('Error starting mining:', error);
      const description =
        error instanceof BackendUnavailableError ? error.message : 'Failed to start mining session';

      toast({
        title: error instanceof BackendUnavailableError ? 'Service Unavailable' : 'Error',
        description,
        variant: 'destructive',
      });
    }
  };

  const stopMining = async () => {
    if (!sessionId) return;
    const pointsToClaim = Math.floor(earnedPoints);
    await endSession(sessionId, pointsToClaim);
  };

  // Claim current earned points without stopping mining
  const claimPoints = async () => {
    if (!sessionId || !user) return;

    const pointsToClaim = Math.floor(earnedPoints);
    if (pointsToClaim <= 0) {
      toast({
        title: 'Nothing to Claim',
        description: 'Keep mining to earn points',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addPoints(pointsToClaim, 'mining');

      setEarnedPoints(0);
      lastDbPointsRef.current = 0;
      lastDbWriteAtRef.current = 0;

      const newStartTime = Date.now();
      sessionStartTimeRef.current = newStartTime;

      await supabase
        .from('mining_sessions')
        .update({
          started_at: new Date(newStartTime).toISOString(),
          arx_mined: 0,
        })
        .eq('id', sessionId);

      setElapsedTime(0);

      toast({
        title: 'Points Claimed! 🎉',
        description: `+${pointsToClaim} ARX-P added to your balance`,
      });
      triggerConfetti();
    } catch (error) {
      console.error('Error claiming points:', error);
      toast({
        title: error instanceof BackendUnavailableError ? 'Service Unavailable' : 'Claim Failed',
        description: error instanceof BackendUnavailableError ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Timer and points calculation - computed from server start time for accuracy.
  const recomputeFromStartTime = useCallback(() => {
    if (!isMining || !sessionId || !sessionStartTimeRef.current) return;

    const startTime = sessionStartTimeRef.current;
    const elapsedMs = Date.now() - startTime;
    const newElapsed = Math.floor(elapsedMs / 1000);

    if (newElapsed >= maxTimeSeconds) {
      if (endingRef.current) return;
      endingRef.current = true;

      const finalPoints = Math.min(480, Math.floor((newElapsed / 3600) * cappedPointsPerHour));
      void endSession(sessionId, finalPoints);
      return;
    }

    setElapsedTime(newElapsed);

    const secondsElapsed = elapsedMs / 1000;
    const fractionalPoints = Math.max(0, Math.min(480, (secondsElapsed / 3600) * cappedPointsPerHour));
    setEarnedPoints(fractionalPoints);

    const wholePoints = Math.min(480, Math.floor(fractionalPoints));
    if (wholePoints > lastDbPointsRef.current) {
      lastDbPointsRef.current = wholePoints;

      // Hard throttle (safety): never write more often than every 15s.
      const now = Date.now();
      if (now - lastDbWriteAtRef.current > 15_000) {
        lastDbWriteAtRef.current = now;
        void supabase.from('mining_sessions').update({ arx_mined: wholePoints }).eq('id', sessionId);
      }
    }
  }, [isMining, sessionId, maxTimeSeconds, cappedPointsPerHour, endSession]);

  useEffect(() => {
    if (!isMining || !sessionId || !sessionStartTimeRef.current) return;

    // Run once immediately
    recomputeFromStartTime();

    intervalRef.current = setInterval(() => {
      recomputeFromStartTime();
    }, tickMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isMining, sessionId, recomputeFromStartTime, tickMs]);

  // When the tab wakes up from background throttling, recompute.
  useEffect(() => {
    const handleWake = () => {
      if (document.visibilityState !== 'visible') return;

      recomputeFromStartTime();

      if (!isMining) {
        void checkActiveSession();
      }
    };

    document.addEventListener('visibilitychange', handleWake);
    window.addEventListener('focus', handleWake);

    return () => {
      document.removeEventListener('visibilitychange', handleWake);
      window.removeEventListener('focus', handleWake);
    };
  }, [recomputeFromStartTime, checkActiveSession, isMining]);

  // Initial fetch
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setSettingsLoading(false);
      return;
    }

    // Hydrate from cache first for instant UI
    const cachedSettings = cacheGet<MiningSettings>(miningSettingsCacheKey, { maxAgeMs: 10 * 60_000 });
    if (cachedSettings?.data) {
      setMiningSettings(cachedSettings.data);
      setSettingsLoading(false);
    }

    const cachedXBoost = cacheGet<number>(xProfileBoostCacheKey(user.id), { maxAgeMs: 10 * 60_000 });
    if (cachedXBoost?.data !== undefined) setXProfileBoost(cachedXBoost.data);

    const cachedArena = cacheGet<ArenaBoost[]>(arenaBoostsCacheKey(user.id), { maxAgeMs: 2 * 60_000 });
    if (cachedArena?.data) setArenaBoosts(cachedArena.data);

    Promise.all([fetchMiningSettings(), fetchXProfileBoost(), fetchArenaBoosts(), checkActiveSession()]).catch(
      () => {}
    );
  }, [user, checkActiveSession, fetchMiningSettings, fetchXProfileBoost, fetchArenaBoosts]);

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
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            const next = (payload.new as any).boost_percentage || 0;
            setXProfileBoost(next);
            cacheSet(xProfileBoostCacheKey(user.id), next);
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
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void fetchArenaBoosts();
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

    const channel = supabase
      .channel('mining-session-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mining_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const session = payload.new as any;
            if (!session.is_active && session.id === sessionId) {
              setIsMining(false);
              setSessionId(null);
              setElapsedTime(0);
              setEarnedPoints(0);
              lastDbPointsRef.current = 0;
              lastDbWriteAtRef.current = 0;
              sessionStartTimeRef.current = null;
              endingRef.current = false;
            }
          }
        }
      )
      .subscribe();

    return () => {
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
    const channel = supabase
      .channel('mining-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mining_settings',
        },
        async (payload) => {
          const newSettings = payload.new as any;

          const next: MiningSettings = {
            publicMiningEnabled: newSettings.public_mining_enabled,
            claimingEnabled: newSettings.claiming_enabled,
            blockReward: newSettings.block_reward,
            consensusMode: newSettings.consensus_mode,
          };

          setMiningSettings(next);
          cacheSet(miningSettingsCacheKey, next);

          if (!newSettings.public_mining_enabled && isMiningRef.current && sessionIdRef.current) {
            toast({
              title: 'Mining Disabled',
              description: 'Public mining has been disabled by admin. Your session has ended.',
              variant: 'destructive',
            });

            await endSession(sessionIdRef.current, earnedPointsRef.current);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [endSession]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return {
    isMining,
    loading,
    settingsLoading,
    elapsedTime,
    remainingTime,
    earnedPoints: Math.max(0, earnedPoints),
    maxTimeSeconds,
    startMining,
    stopMining,
    claimPoints,
    formatTime,
    referralBonus,
    xProfileBoost,
    xPostBoost,
    totalArenaBoost,
    streakBoost,
    totalBoostPercentage,
    pointsPerHour: cappedPointsPerHour,
    pointsPerSecond,
    miningSettings,
  };
};
