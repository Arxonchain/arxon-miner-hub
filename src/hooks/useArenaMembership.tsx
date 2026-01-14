import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ArenaMember {
  id: string;
  user_id: string;
  club: 'alpha' | 'omega';
  fingerprint_verified: boolean;
  fingerprint_hash: string | null;
  joined_at: string;
  total_votes: number;
  total_wins: number;
}

export const useArenaMembership = () => {
  const { user } = useAuth();
  const [membership, setMembership] = useState<ArenaMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const fetchMembership = useCallback(async () => {
    if (!user) {
      setMembership(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('arena_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setMembership(data as ArenaMember | null);
    } catch (error) {
      console.error('Error fetching arena membership:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const registerMembership = async (club: 'alpha' | 'omega', fingerprintHash: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to join the Arena');
      return false;
    }

    setRegistering(true);
    try {
      const { data, error } = await supabase
        .from('arena_members')
        .insert({
          user_id: user.id,
          club,
          fingerprint_verified: true,
          fingerprint_hash: fingerprintHash,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('You are already registered in the Arena');
        } else {
          throw error;
        }
        return false;
      }

      setMembership(data as ArenaMember);
      toast.success(`Welcome to Club ${club.toUpperCase()}!`);
      return true;
    } catch (error: any) {
      console.error('Error registering arena membership:', error);
      toast.error('Failed to register for the Arena');
      return false;
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('arena-membership')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'arena_members',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setMembership(payload.new as ArenaMember);
          } else if (payload.eventType === 'DELETE') {
            setMembership(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    membership,
    loading,
    registering,
    registerMembership,
    refetch: fetchMembership,
  };
};
