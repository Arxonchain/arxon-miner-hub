import { useState } from "react";
import { Search, Filter, Download, MoreHorizontal, Activity, Clock, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const mockMiners = [
  { id: "1", wallet: "0x8f3a...c2e1", username: "CryptoMiner42", sessions: 156, totalMined: 45230, lastActive: "2 min ago", status: "active" },
  { id: "2", wallet: "0x2b7c...9f4a", username: "BlockHunter", sessions: 89, totalMined: 28450, lastActive: "5 min ago", status: "active" },
  { id: "3", wallet: "0xd1e5...7b2c", username: "ARXFan99", sessions: 234, totalMined: 67890, lastActive: "1 hour ago", status: "idle" },
  { id: "4", wallet: "0x6a9f...e3d8", username: "MiningPro", sessions: 412, totalMined: 125600, lastActive: "3 hours ago", status: "offline" },
  { id: "5", wallet: "0xc4b2...1f6e", username: "NodeRunner", sessions: 78, totalMined: 19850, lastActive: "30 min ago", status: "active" },
];

const AdminMiners = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMiners = mockMiners.filter(
    (miner) =>
      miner.wallet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      miner.username.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Miners</h1>
          <p className="text-muted-foreground">Manage and monitor all registered miners</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Activity className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">2,145</p>
            <p className="text-sm text-muted-foreground">Active Now</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">24,582</p>
            <p className="text-sm text-muted-foreground">Total Miners</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Coins className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">45.2M ARX</p>
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
                  <td className="py-4 px-4 text-sm font-mono text-primary">{miner.wallet}</td>
                  <td className="py-4 px-4 text-sm text-foreground">{miner.username}</td>
                  <td className="py-4 px-4 text-sm text-foreground">{miner.sessions}</td>
                  <td className="py-4 px-4 text-sm text-foreground">{miner.totalMined.toLocaleString()} ARX</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{miner.lastActive}</td>
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
        </div>
      </div>
    </div>
  );
};

export default AdminMiners;
