import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ArrowRight, Eye, EyeOff, Lock, RefreshCw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNexus } from '@/hooks/useNexus';

const TransactionExplorer = () => {
  const { transactions, fetchTransactions, loading } = useNexus();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setTimeout(() => setRefreshing(false), 500);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tx.sender_address.toLowerCase().includes(query) ||
      tx.receiver_address.toLowerCase().includes(query) ||
      tx.id.toLowerCase().includes(query)
    );
  });

  const formatAddress = (address: string, hidden: boolean) => {
    if (hidden) return 'Hidden';
    if (address.length > 16) {
      return `${address.slice(0, 10)}...${address.slice(-4)}`;
    }
    return address;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold">Transaction Explorer</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time Nexus transfers
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 h-9 sm:h-10 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats - Compact grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm text-muted-foreground">Total</p>
            <p className="text-lg sm:text-2xl font-bold">{transactions.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-green-500/30">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm text-muted-foreground">Public</p>
            <p className="text-lg sm:text-2xl font-bold text-green-400">
              {transactions.filter(tx => !tx.private_mode).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-primary/30">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm text-muted-foreground">Private</p>
            <p className="text-lg sm:text-2xl font-bold text-primary">
              {transactions.filter(tx => tx.private_mode).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-accent/30">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm text-muted-foreground">Volume</p>
            <p className="text-lg sm:text-2xl font-bold text-accent">
              {transactions
                .filter(tx => !tx.hide_amount)
                .reduce((sum, tx) => sum + tx.amount, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction list - Card-based for mobile */}
      <div className="space-y-2">
        {loading ? (
          <Card className="bg-card/50">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Loading transactions...</span>
              </div>
            </CardContent>
          </Card>
        ) : filteredTransactions.length === 0 ? (
          <Card className="bg-card/50">
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              {searchQuery ? 'No transactions found' : 'No transactions yet'}
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    {/* Time */}
                    <div className="text-[10px] sm:text-xs text-muted-foreground font-mono shrink-0">
                      {format(new Date(tx.created_at), 'MMM dd, HH:mm')}
                    </div>
                    
                    {/* Transfer info */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex items-center gap-1 min-w-0">
                        {tx.hide_usernames && <EyeOff className="h-3 w-3 text-muted-foreground shrink-0" />}
                        <span className="font-mono text-xs sm:text-sm truncate">
                          {formatAddress(tx.sender_address, tx.hide_usernames)}
                        </span>
                      </div>
                      
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
                      
                      <div className="flex items-center gap-1 min-w-0">
                        {tx.hide_usernames && <EyeOff className="h-3 w-3 text-muted-foreground shrink-0" />}
                        <span className="font-mono text-xs sm:text-sm truncate">
                          {formatAddress(tx.receiver_address, tx.hide_usernames)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Amount & Status */}
                    <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
                      {tx.hide_amount ? (
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Lock className="h-3 w-3" />
                          Private
                        </span>
                      ) : (
                        <span className="font-bold text-primary text-sm sm:text-base">
                          {tx.amount.toLocaleString()}
                        </span>
                      )}
                      <Badge
                        variant="secondary"
                        className={`text-[10px] sm:text-xs ${tx.status === 'completed' ? 'bg-green-500/20 text-green-400' : ''}`}
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionExplorer;