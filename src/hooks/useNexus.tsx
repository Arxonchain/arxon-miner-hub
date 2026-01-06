import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface NexusTransaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  sender_address: string;
  receiver_address: string;
  hide_amount: boolean;
  hide_usernames: boolean;
  private_mode: boolean;
  status: string;
  created_at: string;
}

interface NexusBoost {
  id: string;
  user_id: string;
  transaction_id: string;
  boost_percentage: number;
  expires_at: string;
  claimed: boolean;
  created_at: string;
}

interface PrivacySettings {
  hide_amount: boolean;
  hide_usernames: boolean;
  private_mode: boolean;
}

interface SearchResult {
  user_id: string;
  username: string | null;
  nexus_address: string;
  avatar_url: string | null;
}

function useNexusState() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [nexusAddress, setNexusAddress] = useState<string | null>(null);
  const [dailySendCount, setDailySendCount] = useState(0);
  const [transactions, setTransactions] = useState<NexusTransaction[]>([]);
  const [activeBoosts, setActiveBoosts] = useState<NexusBoost[]>([]);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    hide_amount: false,
    hide_usernames: false,
    private_mode: false,
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingReward, setPendingReward] = useState<string | null>(null);
  const [lastTransactionAmount, setLastTransactionAmount] = useState<number>(0);

  // Fetch user's nexus address
  const fetchNexusAddress = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('nexus_address')
      .eq('user_id', user.id)
      .single();
    
    if (!error && data) {
      setNexusAddress(data.nexus_address);
    }
  }, [user]);

  // Fetch daily send count
  const fetchDailySendCount = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase.rpc('get_daily_send_count', {
      p_user_id: user.id
    });
    
    if (!error) {
      setDailySendCount(data || 0);
    }
  }, [user]);

  // Fetch active boosts
  const fetchActiveBoosts = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('nexus_boosts')
      .select('*')
      .eq('user_id', user.id)
      .eq('claimed', true)
      .gte('expires_at', new Date().toISOString());
    
    if (!error && data) {
      setActiveBoosts(data);
    }
  }, [user]);

  // Fetch unclaimed rewards
  const fetchUnclaimedRewards = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('nexus_boosts')
      .select('transaction_id')
      .eq('user_id', user.id)
      .eq('claimed', false)
      .limit(1);
    
    if (!error && data && data.length > 0) {
      setPendingReward(data[0].transaction_id);
    }
  }, [user]);

  // Fetch privacy settings
  const fetchPrivacySettings = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('nexus_privacy_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (!error && data) {
      setPrivacySettings({
        hide_amount: data.hide_amount,
        hide_usernames: data.hide_usernames,
        private_mode: data.private_mode,
      });
    }
  }, [user]);

  // Fetch public transactions for explorer
  const fetchTransactions = useCallback(async () => {
    const { data, error } = await supabase
      .from('nexus_transactions')
      .select('*')
      .eq('private_mode', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setTransactions(data);
    }
  }, []);

  // Search users by username or address
  const searchUsers = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];
    
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, nexus_address, avatar_url')
      .or(`username.ilike.%${query}%,nexus_address.ilike.%${query}%`)
      .neq('user_id', user?.id || '')
      .limit(10);
    
    if (error) return [];
    return data || [];
  };

  // Send ARX-P transfer
  const sendTransfer = async (
    receiverAddress: string,
    amount: number,
    hideAmount: boolean,
    hideUsernames: boolean,
    privateMode: boolean
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    
    setSending(true);
    try {
      const { data, error } = await supabase.rpc('send_nexus_transfer', {
        p_sender_id: user.id,
        p_receiver_address: receiverAddress,
        p_amount: amount,
        p_hide_amount: hideAmount,
        p_hide_usernames: hideUsernames,
        p_private_mode: privateMode,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; transaction_id?: string; error?: string };
      
      if (result.success) {
        setPendingReward(result.transaction_id || null);
        await fetchDailySendCount();
        await fetchTransactions();
        return { success: true, transactionId: result.transaction_id };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setSending(false);
    }
  };

  // Claim nexus reward
  const claimReward = async (transactionId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('claim_nexus_reward', {
        p_transaction_id: transactionId,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      
      if (result.success) {
        setPendingReward(null);
        setLastTransactionAmount(0);
        await fetchActiveBoosts();
        toast({
          title: "Reward Claimed!",
          description: result.message || "+ARX-P and 20% mining boost for 3 days",
        });
        return true;
      } else {
        toast({
          title: "Failed to claim",
          description: result.error,
          variant: "destructive",
        });
        return false;
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Update privacy settings
  const updatePrivacySettings = async (settings: PrivacySettings) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('nexus_privacy_settings')
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      });
    
    if (!error) {
      setPrivacySettings(settings);
    }
  };

  // Get total active nexus boost percentage
  const getTotalNexusBoost = (): number => {
    return activeBoosts.reduce((sum, boost) => sum + boost.boost_percentage, 0);
  };

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchNexusAddress(),
        fetchDailySendCount(),
        fetchActiveBoosts(),
        fetchUnclaimedRewards(),
        fetchPrivacySettings(),
        fetchTransactions(),
      ]);
      setLoading(false);
    };
    
    if (user) {
      init();
    } else {
      setLoading(false);
    }
  }, [user, fetchNexusAddress, fetchDailySendCount, fetchActiveBoosts, fetchUnclaimedRewards, fetchPrivacySettings, fetchTransactions]);

  // Real-time subscription for transactions
  useEffect(() => {
    const channel = supabase
      .channel('nexus-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nexus_transactions',
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions]);

  return {
    nexusAddress,
    dailySendCount,
    transactions,
    activeBoosts,
    privacySettings,
    loading,
    sending,
    pendingReward,
    lastTransactionAmount,
    searchUsers,
    sendTransfer,
    claimReward,
    updatePrivacySettings,
    getTotalNexusBoost,
    fetchTransactions,
  };
}

type NexusContextValue = ReturnType<typeof useNexusState>;

const NexusContext = createContext<NexusContextValue | null>(null);

export function NexusProvider({ children }: { children: ReactNode }) {
  const value = useNexusState();
  return <NexusContext.Provider value={value}>{children}</NexusContext.Provider>;
}

export const useNexus = () => {
  const ctx = useContext(NexusContext);
  if (!ctx) {
    throw new Error('useNexus must be used within <NexusProvider />');
  }
  return ctx;
};
