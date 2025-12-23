import { useState } from "react";
import { Search, Filter, Download, MoreHorizontal, Activity, Clock, Coins, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminStats } from "@/hooks/useAdminStats";
import { formatDistanceToNow } from "date-fns";

const AdminMiners = () => {
  const { stats, miners, loading, refetch } = useAdminStats();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMiners = miners.filter(
    (miner) =>
      (miner.wallet?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (miner.username?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-500/10 text-green-500",
      idle: "bg-yellow-500/10 text-yellow-500",
      offline: "bg-muted text-muted-foreground",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const activeMinersCount = miners.filter(m => m.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Miners</h1>
          <p className="text-muted-foreground">Manage and monitor all registered miners</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Activity className="h-6 w-6 text-green-500" />
          </div>
          <div>
            {loading ? (
              <div className="h-8 w-16 bg-muted/50 animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{formatNumber(activeMinersCount)}</p>
            )}
            <p className="text-sm text-muted-foreground">Active Now</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            {loading ? (
              <div className="h-8 w-16 bg-muted/50 animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalMiners)}</p>
            )}
            <p className="text-sm text-muted-foreground">Total Miners</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Coins className="h-6 w-6 text-accent" />
          </div>
          <div>
            {loading ? (
              <div className="h-8 w-16 bg-muted/50 animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalArxMined)} ARX</p>
            )}
            <p className="text-sm text-muted-foreground">Total Mined</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by wallet or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMiners.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Wallet</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Username</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Sessions</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Total Mined</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Last Active</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMiners.map((miner) => (
                  <tr key={miner.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-4 text-sm font-mono text-primary">
                      {miner.wallet || 'No wallet'}
                    </td>
                    <td className="py-4 px-4 text-sm text-foreground">
                      {miner.username || 'Anonymous'}
                    </td>
                    <td className="py-4 px-4 text-sm text-foreground">{miner.sessions}</td>
                    <td className="py-4 px-4 text-sm text-foreground">
                      {formatNumber(miner.totalMined)} ARX
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {miner.lastActive 
                        ? formatDistanceToNow(new Date(miner.lastActive), { addSuffix: true })
                        : 'Never'}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(miner.status)}</td>
                    <td className="py-4 px-4">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? 'No miners match your search' : 'No miners registered yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMiners;
