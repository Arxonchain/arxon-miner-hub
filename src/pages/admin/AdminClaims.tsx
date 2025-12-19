import { useState } from "react";
import { Search, Filter, Download, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const mockClaims = [
  { id: "1", wallet: "0x8f3a...c2e1", eligible: 45230, claimed: 20000, proofStatus: "verified", lastActive: "2 min ago" },
  { id: "2", wallet: "0x2b7c...9f4a", eligible: 28450, claimed: 0, proofStatus: "pending", lastActive: "5 min ago" },
  { id: "3", wallet: "0xd1e5...7b2c", eligible: 67890, claimed: 67890, proofStatus: "verified", lastActive: "1 hour ago" },
  { id: "4", wallet: "0x6a9f...e3d8", eligible: 125600, claimed: 50000, proofStatus: "verified", lastActive: "3 hours ago" },
  { id: "5", wallet: "0xc4b2...1f6e", eligible: 19850, claimed: 0, proofStatus: "invalid", lastActive: "30 min ago" },
];

const AdminClaims = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClaims = mockClaims.filter((claim) =>
    claim.wallet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProofBadge = (status: string) => {
    const config = {
      verified: { icon: CheckCircle, className: "bg-green-500/10 text-green-500" },
      pending: { icon: Clock, className: "bg-yellow-500/10 text-yellow-500" },
      invalid: { icon: XCircle, className: "bg-red-500/10 text-red-500" },
    };
    const { icon: Icon, className } = config[status as keyof typeof config];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Claim Manager</h1>
          <p className="text-muted-foreground">Manage token claims and merkle proofs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Recalculate Proofs
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">287.1K</p>
          <p className="text-sm text-muted-foreground">Total Eligible</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-green-500">137.9K</p>
          <p className="text-sm text-muted-foreground">Total Claimed</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-500">149.2K</p>
          <p className="text-sm text-muted-foreground">Unclaimed</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">48%</p>
          <p className="text-sm text-muted-foreground">Claim Rate</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by wallet address..."
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
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Eligible</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Claimed</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Proof Status</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Last Active</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-4 px-4 text-sm font-mono text-primary">{claim.wallet}</td>
                  <td className="py-4 px-4 text-sm text-foreground">{claim.eligible.toLocaleString()} ARX</td>
                  <td className="py-4 px-4 text-sm text-foreground">{claim.claimed.toLocaleString()} ARX</td>
                  <td className="py-4 px-4">{getProofBadge(claim.proofStatus)}</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{claim.lastActive}</td>
                  <td className="py-4 px-4">
                    <Button variant="ghost" size="sm">View</Button>
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

export default AdminClaims;
