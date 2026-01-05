import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ArrowRight, Eye, EyeOff, Lock, RefreshCw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNexus } from '@/hooks/useNexus';

interface Transaction {
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
    if (address.length > 20) {
      return `${address.slice(0, 12)}...${address.slice(-6)}`;
    }
    return address;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Transaction Explorer</h2>
          <p className="text-sm text-muted-foreground">
            Real-time view of all Nexus transfers
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by address or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-card/50 border border-border/50">
          <p className="text-sm text-muted-foreground">Total Transactions</p>
          <p className="text-2xl font-bold">{transactions.length}</p>
        </div>
        <div className="p-4 rounded-lg bg-card/50 border border-border/50">
          <p className="text-sm text-muted-foreground">Public</p>
          <p className="text-2xl font-bold text-green-400">
            {transactions.filter(tx => !tx.private_mode).length}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-card/50 border border-border/50">
          <p className="text-sm text-muted-foreground">Private</p>
          <p className="text-2xl font-bold text-primary">
            {transactions.filter(tx => tx.private_mode).length}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-card/50 border border-border/50">
          <p className="text-sm text-muted-foreground">Total Volume</p>
          <p className="text-2xl font-bold">
            {transactions
              .filter(tx => !tx.hide_amount)
              .reduce((sum, tx) => sum + tx.amount, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>

      {/* Transaction table */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/50 hover:bg-card/50">
              <TableHead className="w-[180px]">Time</TableHead>
              <TableHead>From</TableHead>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>To</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loading transactions...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No transactions found' : 'No transactions yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx, index) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-border/30 hover:bg-card/30"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {format(new Date(tx.created_at), 'MMM dd, HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tx.hide_usernames ? (
                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                      ) : null}
                      <span className="font-mono text-sm">
                        {formatAddress(tx.sender_address, tx.hide_usernames)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tx.hide_usernames ? (
                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                      ) : null}
                      <span className="font-mono text-sm">
                        {formatAddress(tx.receiver_address, tx.hide_usernames)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {tx.hide_amount ? (
                      <span className="flex items-center justify-end gap-1 text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Private
                      </span>
                    ) : (
                      <span className="font-bold text-primary">
                        {tx.amount.toLocaleString()} ARX-P
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={tx.status === 'completed' ? 'default' : 'secondary'}
                      className={tx.status === 'completed' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : ''}
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransactionExplorer;
