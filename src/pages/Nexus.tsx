import { useState, useEffect } from 'react';
import { ArrowLeft, Send, Users, Zap, Shield, Gift, ArrowUpRight, ArrowDownLeft, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import AuthDialog from '@/components/auth/AuthDialog';
import { ensureProfileFields } from '@/lib/profile/ensureProfileFields';

const Nexus = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { points, refreshPoints } = usePoints();
  const { profile, loading: profileLoading, fetchProfile } = useProfile();
  const [showAuth, setShowAuth] = useState(false);
  const [receiverAddress, setReceiverAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingAddress, setGeneratingAddress] = useState(false);

  // Self-heal: ensure nexus_address exists
  useEffect(() => {
    if (!user || profileLoading) return;
    if (profile && !profile.nexus_address) {
      setGeneratingAddress(true);
      ensureProfileFields(user.id, { usernameHint: profile.username })
        .then(() => fetchProfile())
        .finally(() => setGeneratingAddress(false));
    }
  }, [user, profile, profileLoading, fetchProfile]);

  const copyAddress = async () => {
    if (!profile?.nexus_address) return;
    try {
      await navigator.clipboard.writeText(profile.nexus_address);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Nexus address copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Error', description: 'Failed to copy address', variant: 'destructive' });
    }
  };

  // Fetch recent transactions
  const fetchTransactions = async () => {
    if (!user) return;
    setLoadingTx(true);
    try {
      const { data, error } = await supabase
        .from('nexus_transactions')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error && data) {
        setTransactions(data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoadingTx(false);
    }
  };

  // Send transfer
  const handleSend = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    if (!receiverAddress.trim()) {
      toast({ title: 'Error', description: 'Enter a receiver address', variant: 'destructive' });
      return;
    }

    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount < 1 || numAmount > 10) {
      toast({ title: 'Error', description: 'Amount must be between 1 and 10 ARX-P', variant: 'destructive' });
      return;
    }

    if ((points?.total_points || 0) < numAmount) {
      toast({ title: 'Insufficient Balance', description: 'You don\'t have enough ARX-P', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.rpc('send_nexus_transfer', {
        p_sender_id: user.id,
        p_receiver_address: receiverAddress.trim(),
        p_amount: numAmount,
      });

      if (error) throw error;

      const result = data as any;
      if (!result?.success) {
        toast({ title: 'Transfer Failed', description: result?.error || 'Unknown error', variant: 'destructive' });
        return;
      }

      toast({
        title: 'Transfer Sent! 🎉',
        description: `Sent ${numAmount} ARX-P. You earned a 20% mining boost for 3 days!`,
      });

      setReceiverAddress('');
      setAmount('');
      await refreshPoints();
      await fetchTransactions();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 text-center p-8 glass-card border border-primary/20 max-w-md mx-4">
          <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Join the Nexus</h1>
          <p className="text-muted-foreground mb-6">Sign in to send and receive ARX-P</p>
          <button onClick={() => setShowAuth(true)} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold">
            Sign In to Enter
          </button>
        </div>
        <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-foreground">Nexus</h1>
        <div className="w-10" />
      </header>

      <main className="relative z-10 px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Your Address */}
        <div className="glass-card p-4 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Your Nexus Address</span>
            </div>
            <button
              onClick={copyAddress}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-sm md:text-lg font-bold text-foreground font-mono break-all">
            {profileLoading || generatingAddress 
              ? 'Generating address...' 
              : profile?.nexus_address || 'Address unavailable'}
          </p>
        </div>

        {/* Balance */}
        <div className="glass-card p-6 text-center border border-accent/20">
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <p className="text-4xl font-bold text-foreground">
            {points?.total_points?.toLocaleString() || 0}
            <span className="text-xl text-accent ml-2">ARX-P</span>
          </p>
        </div>

        {/* Send Section */}
        <div className="glass-card p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Send className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-foreground">Send ARX-P</h3>
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Receiver Address</label>
            <Input
              placeholder="ARX-P-username1234"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              className="bg-secondary/50"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Amount (1-10 ARX-P)</label>
            <Input
              type="number"
              placeholder="5"
              min={1}
              max={10}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-secondary/50"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || !receiverAddress || !amount}
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
          >
            {sending ? 'Sending...' : 'Send & Earn Boost'}
          </Button>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <Gift className="w-4 h-4 text-green-400" />
            <p className="text-xs text-green-400">
              Each transfer earns you a <strong>20% mining boost</strong> for 3 days!
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-bold text-foreground">5</p>
            <p className="text-xs text-muted-foreground">Daily Limit</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-bold text-accent">20%</p>
            <p className="text-xs text-muted-foreground">Boost Per Send</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Recent Activity
            </h3>
            <button onClick={fetchTransactions} className="text-xs text-primary">
              Refresh
            </button>
          </div>
          
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx) => {
                const isSender = tx.sender_id === user.id;
                return (
                  <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2">
                      {isSender ? (
                        <ArrowUpRight className="w-4 h-4 text-red-400" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 text-green-400" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {isSender ? 'Sent' : 'Received'}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${isSender ? 'text-red-400' : 'text-green-400'}`}>
                      {isSender ? '-' : '+'}{tx.amount} ARX-P
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default Nexus;
