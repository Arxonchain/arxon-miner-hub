import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePoints } from './usePoints';
import { toast } from '@/hooks/use-toast';

const SOCIAL_POST_POINTS = 50;

interface SocialSubmission {
  id: string;
  user_id: string;
  post_url: string;
  platform: string;
  status: string;
  points_awarded: number;
  created_at: string;
  reviewed_at: string | null;
}

export const useSocialSubmissions = () => {
  const { user } = useAuth();
  const { triggerConfetti } = usePoints();
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<SocialSubmission[]>([]);
  const [loading, setLoading] = useState(true);

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
      setSubmissions(data || []);
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
      const { error } = await supabase
        .from('social_submissions')
        .insert({
          user_id: user.id,
          post_url: postUrl,
          platform: 'twitter',
          status: 'pending',
          points_awarded: 0
        });

      if (error) throw error;

      toast({
        title: "Post Submitted! 🐦",
        description: "Your post is pending review. You'll earn points once approved.",
      });

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
            setSubmissions(prev => [payload.new as SocialSubmission, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSubmissions(prev => 
              prev.map(s => s.id === (payload.new as SocialSubmission).id ? payload.new as SocialSubmission : s)
            );
            
            // Show toast if submission was approved
            const newSubmission = payload.new as SocialSubmission;
            const oldSubmission = payload.old as SocialSubmission;
            if (oldSubmission.status === 'pending' && newSubmission.status === 'approved') {
              triggerConfetti();
              toast({
                title: "Post Approved! 🎉",
                description: `+${newSubmission.points_awarded} ARX-P earned`,
              });
            } else if (oldSubmission.status === 'pending' && newSubmission.status === 'rejected') {
              toast({
                title: "Post Rejected",
                description: "Your submission did not meet the requirements",
                variant: "destructive"
              });
            }
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
    submitPost,
    fetchSubmissions,
    SOCIAL_POST_POINTS
  };
};
