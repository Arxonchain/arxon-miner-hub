import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface Wallet {
  id: string;
  wallet_address: string;
  wallet_type: string;
  is_primary: boolean;
  connected_at: string;
}

declare global {
  interface Window {
    injectedWeb3?: {
      [key: string]: {
        enable: () => Promise<any>;
        version: string;
      };
    };
  }
}

export const useWallet = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const fetchWallets = useCallback(async () => {
    if (!user) {
      setWallets([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('connected_at', { ascending: false });

      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const connectPolkadotWallet = async () => {
    toast({
      title: "Coming Soon",
      description: "Wallet connect will be available soon. Stay tuned!",
    });
    return;
  };

  const disconnectWallet = async (walletId: string) => {
    try {
      const { error } = await supabase
        .from('user_wallets')
        .delete()
        .eq('id', walletId);

      if (error) throw error;

      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been unlinked",
      });

      fetchWallets();
    } catch (error: any) {
      console.error('Error disconnecting wallet:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect wallet",
        variant: "destructive"
      });
    }
  };

  const setPrimaryWallet = async (walletId: string) => {
    try {
      // First, set all wallets to non-primary
      await supabase
        .from('user_wallets')
        .update({ is_primary: false })
        .eq('user_id', user?.id);

      // Then set the selected wallet as primary
      const { error } = await supabase
        .from('user_wallets')
        .update({ is_primary: true })
        .eq('id', walletId);

      if (error) throw error;

      toast({
        title: "Primary Wallet Updated",
        description: "Your airdrop wallet has been set",
      });

      fetchWallets();
    } catch (error: any) {
      console.error('Error setting primary wallet:', error);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const primaryWallet = wallets.find(w => w.is_primary) || wallets[0];

  return {
    wallets,
    primaryWallet,
    loading,
    connecting,
    connectPolkadotWallet,
    disconnectWallet,
    setPrimaryWallet,
    hasPolkadotExtension: typeof window !== 'undefined' && !!window.injectedWeb3?.['polkadot-js']
  };
};
