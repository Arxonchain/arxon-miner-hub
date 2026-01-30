import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cacheGet, cacheSet } from '@/lib/localCache';
import { useAuth } from './useAuth';
import { ensureProfileFields } from '@/lib/profile/ensureProfileFields';

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  referral_code: string | null;
  nexus_address: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
        cacheSet(`arxon:profile:v1:${user.id}`, data);

        // Self-heal: ensure derived fields always exist.
        // This fixes accounts showing missing referral codes / nexus addresses.
        if (!data?.referral_code || !data?.nexus_address) {
          const ensured = await ensureProfileFields(user.id, { usernameHint: data?.username });
          if (ensured) {
            // Re-fetch from DB to get canonical values and update UI instantly
            const { data: refreshed } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (refreshed) {
              setProfile(refreshed);
              cacheSet(`arxon:profile:v1:${user.id}`, refreshed);
            } else {
              const merged = { ...data, ...ensured } as UserProfile;
              setProfile(merged);
              cacheSet(`arxon:profile:v1:${user.id}`, merged);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchProfile();
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const cached = cacheGet<UserProfile | null>(`arxon:profile:v1:${userId}`, { maxAgeMs: 24 * 60 * 60_000 });
    if (cached?.data) {
      setProfile(cached.data);
      setLoading(false);
    }

    fetchProfile();
  }, [fetchProfile, user?.id]);

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
  };
};

