import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

const SOCIAL_POST_POINTS = 50;

export const useSocialSubmissions = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
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

      fetchSubmissions();
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

  return {
    submissions,
    loading,
    submitting,
    submitPost,
    fetchSubmissions,
    SOCIAL_POST_POINTS
  };
};
