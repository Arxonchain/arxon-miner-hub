import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { cacheGet, cacheSet } from '@/lib/localCache';

const NOTIFICATION_PREFS_KEY = 'arxon_notification_preferences';

interface NotificationPreferences {
  miningAlerts: boolean;
  claimNotifications: boolean;
  rewardUpdates: boolean;
  leaderboardChanges: boolean;
  systemAnnouncements: boolean;
}

const defaultPrefs: NotificationPreferences = {
  miningAlerts: true,
  claimNotifications: true,
  rewardUpdates: true,
  leaderboardChanges: false,
  systemAnnouncements: true,
};

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPrefs);
  const previousRankRef = useRef<number | null>(null);
  const miningSessionCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedSessionsRef = useRef<Set<string>>(new Set());

  // Load preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse notification preferences');
      }
    }
  }, []);

  // Check browser notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Send a notification
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;
    if (document.visibilityState === 'visible') {
      // Don't send push if user is on the page - they'll see the toast
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.jpg',
        badge: '/favicon.jpg',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [permission]);

  // Mining session notifications (10 min before end + session complete)
  useEffect(() => {
    if (!user || !preferences.miningAlerts && !preferences.claimNotifications) {
      if (miningSessionCheckRef.current) {
        clearInterval(miningSessionCheckRef.current);
        miningSessionCheckRef.current = null;
      }
      return;
    }

    const checkMiningSession = async () => {
      try {
        const { data: session } = await supabase
          .from('mining_sessions')
          .select('id, started_at, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!session) return;

        const startTime = new Date(session.started_at).getTime();
        const elapsed = (Date.now() - startTime) / 1000;
        const maxTime = 8 * 60 * 60; // 8 hours
        const tenMinsBefore = maxTime - 10 * 60; // 10 mins before end

        const sessionKey = session.id;
        const warningKey = `${sessionKey}-warning`;
        const completeKey = `${sessionKey}-complete`;

        // 10 minutes before notification
        if (preferences.miningAlerts && elapsed >= tenMinsBefore && elapsed < maxTime) {
          if (!notifiedSessionsRef.current.has(warningKey)) {
            notifiedSessionsRef.current.add(warningKey);
            sendNotification('Mining Session Ending Soon ⏰', {
              body: 'Your mining session will complete in 10 minutes. Get ready to claim your rewards!',
              tag: 'mining-warning',
            });
          }
        }

        // Session complete notification
        if (preferences.claimNotifications && elapsed >= maxTime) {
          if (!notifiedSessionsRef.current.has(completeKey)) {
            notifiedSessionsRef.current.add(completeKey);
            sendNotification('Mining Complete! 🎉', {
              body: 'Your 8-hour session is complete. Claim your ARX-P and start a new session!',
              tag: 'mining-complete',
            });
          }
        }
      } catch (error) {
        console.error('Error checking mining session:', error);
      }
    };

    // Check every 30 seconds
    checkMiningSession();
    miningSessionCheckRef.current = setInterval(checkMiningSession, 30000);

    return () => {
      if (miningSessionCheckRef.current) {
        clearInterval(miningSessionCheckRef.current);
        miningSessionCheckRef.current = null;
      }
    };
  }, [user, preferences.miningAlerts, preferences.claimNotifications, sendNotification]);

  // Leaderboard change notifications
  useEffect(() => {
    if (!user || !preferences.leaderboardChanges) return;

    const checkRank = async () => {
      try {
        const { data: leaderboard } = await supabase
          .from('leaderboard_view')
          .select('user_id, total_points')
          .order('total_points', { ascending: false });

        if (!leaderboard) return;

        const currentRank = leaderboard.findIndex(entry => entry.user_id === user.id) + 1;
        
        if (previousRankRef.current !== null && currentRank !== previousRankRef.current) {
          const change = previousRankRef.current - currentRank;
          if (change > 0) {
            sendNotification('Rank Up! 🚀', {
              body: `You moved up ${change} position${change > 1 ? 's' : ''} to #${currentRank} on the leaderboard!`,
              tag: 'leaderboard-up',
            });
          } else if (change < 0) {
            sendNotification('Leaderboard Update 📊', {
              body: `You dropped to #${currentRank} on the leaderboard. Keep mining to climb back up!`,
              tag: 'leaderboard-down',
            });
          }
        }
        
        previousRankRef.current = currentRank;
      } catch (error) {
        console.error('Error checking leaderboard rank:', error);
      }
    };

    // Check initially and then every 5 minutes
    checkRank();
    const interval = setInterval(checkRank, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, preferences.leaderboardChanges, sendNotification]);

  // System announcements
  useEffect(() => {
    if (!preferences.systemAnnouncements) return;

    const channel = supabase
      .channel('announcements-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
        },
        (payload) => {
          if (payload.new && (payload.new as any).is_active) {
            sendNotification('📢 New Announcement', {
              body: (payload.new as any).title,
              tag: 'announcement',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [preferences.systemAnnouncements, sendNotification]);

  // Reward updates (points changes)
  useEffect(() => {
    if (!user || !preferences.rewardUpdates) return;

    const channel = supabase
      .channel('reward-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_points',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const oldPoints = (payload.old as any)?.total_points || 0;
          const newPoints = (payload.new as any)?.total_points || 0;
          const diff = newPoints - oldPoints;

          if (diff > 0 && diff >= 10) { // Only notify for significant gains
            sendNotification('Rewards Earned! 💰', {
              body: `You earned +${Math.floor(diff)} ARX-P! Total: ${Math.floor(newPoints).toLocaleString()}`,
              tag: 'reward-update',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, preferences.rewardUpdates, sendNotification]);

  const updatePreferences = useCallback((newPrefs: NotificationPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(newPrefs));
  }, []);

  return {
    permission,
    preferences,
    requestPermission,
    sendNotification,
    updatePreferences,
    isSupported: 'Notification' in window,
  };
};
