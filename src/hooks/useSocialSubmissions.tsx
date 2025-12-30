import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePoints } from './usePoints';
import { toast } from '@/hooks/use-toast';

const SOCIAL_POST_POINTS = 50; // Points per quality post
const SOCIAL_MINING_BOOST = 5; // +5 ARX-P/HR per quality post
const MAX_QUALITY_POSTS = 5; // Maximum quality posts allowed

interface SocialSubmission {
  id: string;
  user_id: string;
  post_url: string;
  platform: string;
  status: string;
  points_awarded: number;
  created_at: string;
  reviewed_at: string | null;
  claimed: boolean; // Track if rewards have been claimed
}

export const useSocialSubmissions = () => {
  const { user } = useAuth();
  const { addPoints, triggerConfetti, refreshPoints } = usePoints();
  const [submitting, setSubmitting] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SocialSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate total mining boost from approved/claimed posts
  const totalMiningBoost = submissions.filter(
    s => s.status === 'approved' || s.claimed
  ).length * SOCIAL_MINING_BOOST;

  // Count quality posts (approved or pending)
  const qualityPostsCount = submissions.filter(
    s => s.status !== 'rejected'
  ).length;

  const canSubmitMore = qualityPostsCount < MAX_QUALITY_POSTS;

  const fetchSubmissions = useCallback(async () => {
    if (!user) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('social_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add claimed field based on points_awarded > 0
      const submissionsWithClaimed = (data || []).map(s => ({
        ...s,
        claimed: s.points_awarded > 0
      }));
      
      setSubmissions(submissionsWithClaimed);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const submitPost = async (postUrl: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to submit posts",
        variant: "destructive"
      });
      return false;
    }

    // Check max posts limit
    if (!canSubmitMore) {
      toast({
        title: "Limit Reached",
        description: `You can only submit ${MAX_QUALITY_POSTS} quality posts`,
        variant: "destructive"
      });
      return false;
    }

    // Validate URL format
    const urlPattern = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;
    if (!urlPattern.test(postUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid X/Twitter post URL",
        variant: "destructive"
      });
      return false;
    }

    // Check for duplicate submission
    const existing = submissions.find(s => s.post_url === postUrl);
    if (existing) {
      toast({
        title: "Already Submitted",
        description: "This post has already been submitted",
        variant: "destructive"
      });
      return false;
    }

    setSubmitting(true);

    try {
      // Insert the submission - auto-approve for instant rewards
      const { data, error } = await supabase
        .from('social_submissions')
        .insert({
          user_id: user.id,
          post_url: postUrl,
          platform: 'twitter',
          status: 'approved', // Auto-approve for instant claiming
          points_awarded: 0 // Points awarded when claimed
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Post Submitted! 🐦",
        description: `Claim your ${SOCIAL_POST_POINTS} ARX-P + ${SOCIAL_MINING_BOOST} ARX-P/HR boost!`,
      });

      // Add to local state
      setSubmissions(prev => [{
        ...data,
        claimed: false
      }, ...prev]);

      return true;
    } catch (error: any) {
      console.error('Error submitting post:', error);
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Claim rewards for a submission
  const claimRewards = async (submissionId: string) => {
    if (!user) return false;

    const submission = submissions.find(s => s.id === submissionId);
    if (!submission || submission.claimed || submission.status === 'rejected') {
      return false;
    }

    setClaiming(submissionId);

    try {
      // Update submission as claimed with points
      const { error: updateError } = await supabase
        .from('social_submissions')
        .update({
          points_awarded: SOCIAL_POST_POINTS,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;

      // Add points to user's balance (social_points)
      await addPoints(SOCIAL_POST_POINTS, 'social');

      // Update user's referral_bonus_percentage for mining boost
      // Each quality post adds 5% to mining rate (referral_bonus_percentage is used as boost)
      const { data: currentPoints } = await supabase
        .from('user_points')
        .select('referral_bonus_percentage')
        .eq('user_id', user.id)
        .single();

      if (currentPoints) {
        const newBoost = (currentPoints.referral_bonus_percentage || 0) + (SOCIAL_MINING_BOOST * 10); // 5 ARX-P/HR = 50% of base 10/hr
        await supabase
          .from('user_points')
          .update({ referral_bonus_percentage: newBoost })
          .eq('user_id', user.id);
      }

      // Update local state
      setSubmissions(prev => 
        prev.map(s => s.id === submissionId 
          ? { ...s, claimed: true, points_awarded: SOCIAL_POST_POINTS }
          : s
        )
      );

      // Refresh points to get updated balance
      await refreshPoints();

      triggerConfetti();
      toast({
        title: "Rewards Claimed! 🎉",
        description: `+${SOCIAL_POST_POINTS} ARX-P & +${SOCIAL_MINING_BOOST} ARX-P/HR mining boost!`,
      });

      return true;
    } catch (error) {
      console.error('Error claiming rewards:', error);
      toast({
        title: "Claim Failed",
        description: "Please try again",
        variant: "destructive"
      });
      return false;
    } finally {
      setClaiming(null);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Real-time subscription for social_submissions
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for social_submissions');
    
    const channel = supabase
      .channel('social-submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_submissions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time social_submissions update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newSub = payload.new as SocialSubmission;
            setSubmissions(prev => {
              // Check if already exists
              if (prev.some(s => s.id === newSub.id)) return prev;
              return [{ ...newSub, claimed: newSub.points_awarded > 0 }, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setSubmissions(prev => 
              prev.map(s => s.id === (payload.new as SocialSubmission).id 
                ? { ...payload.new as SocialSubmission, claimed: (payload.new as SocialSubmission).points_awarded > 0 }
                : s
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setSubmissions(prev => prev.filter(s => s.id !== (payload.old as SocialSubmission).id));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up social_submissions subscription');
      supabase.removeChannel(channel);
    };
  }, [user, triggerConfetti]);

  return {
    submissions,
    loading,
    submitting,
    claiming,
    submitPost,
    claimRewards,
    fetchSubmissions,
    SOCIAL_POST_POINTS,
    SOCIAL_MINING_BOOST,
    MAX_QUALITY_POSTS,
    totalMiningBoost,
    qualityPostsCount,
    canSubmitMore
  };
};
