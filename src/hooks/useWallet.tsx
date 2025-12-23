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
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to connect your wallet",
        variant: "destructive"
      });
      return;
    }

    setConnecting(true);

    try {
      // Check if Polkadot.js extension is installed
      if (!window.injectedWeb3?.['polkadot-js']) {
        toast({
          title: "Wallet Not Found",
          description: "Please install the Polkadot.js extension",
          variant: "destructive"
        });
        window.open('https://polkadot.js.org/extension/', '_blank');
        return;
      }

      const extension = await window.injectedWeb3['polkadot-js'].enable();
      const accounts = await extension.accounts.get();

      if (!accounts || accounts.length === 0) {
        toast({
          title: "No Accounts Found",
          description: "Please create an account in your Polkadot.js extension",
          variant: "destructive"
        });
        return;
      }

      // Use the first account
      const account = accounts[0];
      const walletAddress = account.address;

      // Check if wallet already connected
      const existing = wallets.find(w => w.wallet_address === walletAddress);
      if (existing) {
        toast({
          title: "Already Connected",
          description: "This wallet is already linked to your account",
        });
        return;
      }

      // Save wallet to database
      const { error } = await supabase
        .from('user_wallets')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress,
          wallet_type: 'polkadot',
          is_primary: wallets.length === 0
        });

      if (error) throw error;

      toast({
        title: "Wallet Connected! 🎉",
        description: `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)} linked successfully`,
      });

      fetchWallets();
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
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
