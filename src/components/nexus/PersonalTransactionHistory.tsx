import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PersonalTransaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  sender_address: string;
  receiver_address: string;
  status: string;
  created_at: string;
}

const PersonalTransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPersonalTransactions = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('nexus_transactions')
      .select('id, sender_id, receiver_id, amount, sender_address, receiver_address, status, created_at')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPersonalTransactions();
  }, [fetchPersonalTransactions]);

  // Real-time subscription for personal transactions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('personal-nexus-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nexus_transactions',
        },
        (payload) => {
          const newTx = payload.new as PersonalTransaction;
          if (newTx.sender_id === user.id || newTx.receiver_id === user.id) {
            fetchPersonalTransactions();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPersonalTransactions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPersonalTransactions();
    setTimeout(() => setRefreshing(false), 500);
  };

  const formatAddress = (address: string) => {
    if (address.length > 16) {
      return `${address.slice(0, 10)}...${address.slice(-4)}`;
    }
    return address;
  };

  const sentCount = transactions.filter(tx => tx.sender_id === user?.id).length;
  const receivedCount = transactions.filter(tx => tx.receiver_id === user?.id).length;
  const totalSent = transactions
    .filter(tx => tx.sender_id === user?.id)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalReceived = transactions
    .filter(tx => tx.receiver_id === user?.id)
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold">My Transactions</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your sent & received transfers
          </p>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-9 w-9 sm:h-10 sm:w-10"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm text-muted-foreground">Sent</p>
            <p className="text-lg sm:text-2xl font-bold text-orange-400">{sentCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm text-muted-foreground">Received</p>
            <p className="text-lg sm:text-2xl font-bold text-green-400">{receivedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-primary/30">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm text-muted-foreground">Total Sent</p>
            <p className="text-lg sm:text-2xl font-bold text-primary">{totalSent.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-accent/30">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm text-muted-foreground">Total Received</p>
            <p className="text-lg sm:text-2xl font-bold text-accent">{totalReceived.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction list */}
      <div className="space-y-2">
        {loading ? (
          <Card className="bg-card/50">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            </CardContent>
          </Card>
        ) : transactions.length === 0 ? (
          <Card className="bg-card/50">
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              No transactions yet. Start sending ARX-P!
            </CardContent>
          </Card>
        ) : (
          transactions.map((tx, index) => {
            const isSent = tx.sender_id === user?.id;
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      {/* Direction icon */}
                      <div className={`p-2 rounded-full ${isSent ? 'bg-orange-500/20' : 'bg-green-500/20'}`}>
                        {isSent ? (
                          <ArrowUpRight className="h-4 w-4 text-orange-400" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4 text-green-400" />
                        )}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isSent ? 'text-orange-400' : 'text-green-400'}`}>
                            {isSent ? 'Sent' : 'Received'}
                          </span>
                          <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-400">
                            {tx.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {isSent ? `To: ${formatAddress(tx.receiver_address)}` : `From: ${formatAddress(tx.sender_address)}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      
                      {/* Amount */}
                      <div className={`text-right ${isSent ? 'text-orange-400' : 'text-green-400'}`}>
                        <span className="font-bold text-base sm:text-lg">
                          {isSent ? '-' : '+'}{tx.amount.toLocaleString()}
                        </span>
                        <p className="text-[10px] text-muted-foreground">ARX-P</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PersonalTransactionHistory;
