import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface XProfile {
  id: string;
  user_id: string;
  username: string;
  profile_url: string;
  boost_percentage: number;
  qualified_posts_today: number;
  average_engagement: number;
  viral_bonus: boolean;
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;
  historical_posts_count: number;
  historical_arx_p_total: number;
  historical_boost_total: number;
  historical_scanned: boolean;
}

interface XPostReward {
  id: string;
  tweet_id: string;
  tweet_text: string;
  like_count: number;
  retweet_count: number;
  reply_count: number;
  quote_count: number;
  total_engagement: number;
  arx_p_reward: number;
  boost_reward: number;
  tweet_created_at: string | null;
  created_at: string;
}

export const useXProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [xProfile, setXProfile] = useState<XProfile | null>(null);
  const [postRewards, setPostRewards] = useState<XPostReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const fetchXProfile = useCallback(async () => {
    if (!user) {
      setXProfile(null);
      setPostRewards([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('x_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching X profile:', error);
      } else {
        setXProfile(data);
        
        // Fetch post rewards if profile exists
        if (data) {
          const { data: rewards, error: rewardsError } = await supabase
            .from('x_post_rewards')
            .select('*')
            .eq('user_id', user.id)
            .order('tweet_created_at', { ascending: false });
          
          if (rewardsError) {
            console.error('Error fetching post rewards:', rewardsError);
          } else {
            setPostRewards(rewards || []);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching X profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const extractUsername = (input: string): string | null => {
    // Handle full URL: https://x.com/username or https://twitter.com/username
    const urlMatch = input.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }
    
    // Handle @username
    if (input.startsWith('@')) {
      return input.slice(1);
    }
    
    // Handle plain username
    if (/^[a-zA-Z0-9_]+$/.test(input)) {
      return input;
    }
    
    return null;
  };

  const connectXProfile = async (profileInput: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to connect your X profile',
        variant: 'destructive',
      });
      return false;
    }

    const username = extractUsername(profileInput.trim());
    if (!username) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid X username or profile URL',
        variant: 'destructive',
      });
      return false;
    }

    setScanning(true);

    try {
      // First, check if there's an existing profile and delete it to allow reconnection
      const { data: existingProfile } = await supabase
        .from('x_profiles')
        .select('id, historical_scanned')
        .eq('user_id', user.id)
        .maybeSingle();

      const isInitialConnect = !existingProfile || !existingProfile.historical_scanned;

      if (existingProfile) {
        // Delete existing profile first to prevent conflicts
        await supabase
          .from('x_profiles')
          .delete()
          .eq('user_id', user.id);
        
        // Also delete existing post rewards
        await supabase
          .from('x_post_rewards')
          .delete()
          .eq('user_id', user.id);
      }

      const response = await supabase.functions.invoke('scan-x-profile', {
        body: {
          username,
          profileUrl: `https://x.com/${username}`,
          isInitialConnect,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to scan profile');
      }

      const boostPct = response.data.data.boostPercentage || 0;
      const postsFound = response.data.data.qualifiedPostsToday || 0;
      
      toast({
        title: 'X Profile Connected!',
        description: boostPct > 0 
          ? `@${username} connected with ${boostPct}% boost from ${postsFound} posts!`
          : `@${username} connected successfully. Post about ARXON to earn boost!`,
      });

      await fetchXProfile();
      return true;
    } catch (error: any) {
      console.error('Error connecting X profile:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect X profile. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setScanning(false);
    }
  };

  const refreshBoost = async () => {
    if (!xProfile) return;

    setScanning(true);

    try {
      const response = await supabase.functions.invoke('scan-x-profile', {
        body: {
          username: xProfile.username,
          profileUrl: xProfile.profile_url,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to refresh boost');
      }

      const boostPct = response.data.data.boostPercentage || 0;
      const postsFound = response.data.data.qualifiedPostsToday || 0;
      
      toast({
        title: 'Scan Complete!',
        description: boostPct > 0 
          ? `Found ${postsFound} posts. Current boost: ${boostPct}%`
          : 'No ARXON posts found yet. Post with #Arxon to earn boost!',
      });

      await fetchXProfile();
    } catch (error: any) {
      console.error('Error refreshing boost:', error);
      toast({
        title: 'Refresh Failed',
        description: error.message || 'Failed to refresh boost',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  const disconnectXProfile = async () => {
    if (!user || !xProfile) return;

    try {
      const { error } = await supabase
        .from('x_profiles')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setXProfile(null);
      toast({
        title: 'X Profile Disconnected',
        description: 'Your X profile has been disconnected',
      });
    } catch (error: any) {
      console.error('Error disconnecting X profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect X profile',
        variant: 'destructive',
      });
    }
  };

  // Check if boost needs refresh (every 6 hours)
  const shouldRefresh = useCallback(() => {
    if (!xProfile?.last_scanned_at) return true;
    const lastScanned = new Date(xProfile.last_scanned_at);
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    return lastScanned < sixHoursAgo;
  }, [xProfile]);

  // Fetch profile on mount and when user changes
  useEffect(() => {
    fetchXProfile();
  }, [fetchXProfile]);

  // Auto-refresh on app open if needed (only once)
  useEffect(() => {
    if (xProfile && shouldRefresh() && !scanning) {
      refreshBoost();
    }
  }, [xProfile?.id]); // Only run when profile ID changes (not on every xProfile update)

  // Calculate boosted rate
  const getBoostedRate = (baseRate: number) => {
    if (!xProfile) return baseRate;
    return baseRate * (1 + xProfile.boost_percentage / 100);
  };

  return {
    xProfile,
    postRewards,
    loading,
    scanning,
    connectXProfile,
    refreshBoost,
    disconnectXProfile,
    getBoostedRate,
    shouldRefresh: shouldRefresh(),
  };
};
