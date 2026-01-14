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

  // Auto-assign to club with fewer members
  const getAutoAssignedClub = async (): Promise<'alpha' | 'omega'> => {
    const { count: alphaCount } = await supabase
      .from('arena_members')
      .select('*', { count: 'exact', head: true })
      .eq('club', 'alpha');

    const { count: omegaCount } = await supabase
      .from('arena_members')
      .select('*', { count: 'exact', head: true })
      .eq('club', 'omega');

    const alpha = alphaCount ?? 0;
    const omega = omegaCount ?? 0;

    // Assign to smaller club, or random if equal
    if (alpha < omega) return 'alpha';
    if (omega < alpha) return 'omega';
    return Math.random() < 0.5 ? 'alpha' : 'omega';
  };

  const registerMembership = async (fingerprintHash: string): Promise<{ success: boolean; club: 'alpha' | 'omega' | null }> => {
    if (!user) {
      toast.error('You must be logged in to join the Arena');
      return { success: false, club: null };
    }

    setRegistering(true);
    try {
      // Auto-assign club
      const assignedClub = await getAutoAssignedClub();

      const { data, error } = await supabase
        .from('arena_members')
        .insert({
          user_id: user.id,
          club: assignedClub,
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
        return { success: false, club: null };
      }

      setMembership(data as ArenaMember);
      return { success: true, club: assignedClub };
    } catch (error: any) {
      console.error('Error registering arena membership:', error);
      toast.error('Failed to register for the Arena');
      return { success: false, club: null };
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
