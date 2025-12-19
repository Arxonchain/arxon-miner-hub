import { Download, Plus, Calendar, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockAllocations = [
  { 
    name: "Founder 1", 
    wallet: "0x8f3a...c2e1", 
    percentage: 5.0, 
    total: 5000000, 
    claimed: 1250000,
    vestingType: "linear",
    nextUnlock: "2025-01-15",
    notes: "Core team member"
  },
  { 
    name: "Founder 2", 
    wallet: "0x2b7c...9f4a", 
    percentage: 3.5, 
    total: 3500000, 
    claimed: 875000,
    vestingType: "cliff",
    nextUnlock: "2025-03-01",
    notes: "Technical lead"
  },
  { 
    name: "Advisor Pool", 
    wallet: "0xd1e5...7b2c", 
    percentage: 2.0, 
    total: 2000000, 
    claimed: 0,
    vestingType: "cliff",
    nextUnlock: "2025-06-01",
    notes: "Advisory board"
  },
  { 
    name: "Treasury", 
    wallet: "0x6a9f...e3d8", 
    percentage: 10.0, 
    total: 10000000, 
    claimed: 2500000,
    vestingType: "linear",
    nextUnlock: "2025-01-01",
    notes: "Ecosystem development"
  },
];

const AdminAllocations = () => {
  const totalAllocated = mockAllocations.reduce((sum, a) => sum + a.total, 0);
  const totalClaimed = mockAllocations.reduce((sum, a) => sum + a.claimed, 0);

  const getVestingBadge = (type: string) => {
    const styles = {
      linear: "bg-primary/10 text-primary",
      cliff: "bg-yellow-500/10 text-yellow-500",
      immediate: "bg-green-500/10 text-green-500",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type as keyof typeof styles]}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Founder Allocation</h1>
          <p className="text-muted-foreground">Manage founder and team token allocations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Allocation
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">20.5%</p>
          <p className="text-sm text-muted-foreground">Total Allocated</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{(totalAllocated / 1000000).toFixed(1)}M</p>
          <p className="text-sm text-muted-foreground">Total ARX</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{(totalClaimed / 1000000).toFixed(2)}M</p>
          <p className="text-sm text-muted-foreground">Claimed</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-500">{((totalAllocated - totalClaimed) / 1000000).toFixed(2)}M</p>
          <p className="text-sm text-muted-foreground">Unclaimed</p>
        </div>
      </div>

      {/* Vesting Timeline */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Vesting Timeline
        </h3>
        <div className="h-8 bg-muted rounded-full overflow-hidden flex">
          <div className="h-full bg-green-500" style={{ width: `${(totalClaimed / totalAllocated) * 100}%` }} />
          <div className="h-full bg-primary/30" style={{ width: `${((totalAllocated - totalClaimed) / totalAllocated) * 100}%` }} />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Claimed: {((totalClaimed / totalAllocated) * 100).toFixed(1)}%</span>
          <span>Locked: {(((totalAllocated - totalClaimed) / totalAllocated) * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Wallet</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Allocation %</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Total</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Claimed</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Vesting</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Next Unlock</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Notes</th>
              </tr>
            </thead>
            <tbody>
              {mockAllocations.map((allocation, index) => (
                <tr key={index} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-4 px-4 text-sm font-medium text-foreground">{allocation.name}</td>
                  <td className="py-4 px-4 text-sm font-mono text-primary">{allocation.wallet}</td>
                  <td className="py-4 px-4 text-sm text-foreground">{allocation.percentage}%</td>
                  <td className="py-4 px-4 text-sm text-foreground">{(allocation.total / 1000000).toFixed(1)}M ARX</td>
                  <td className="py-4 px-4 text-sm text-foreground">{(allocation.claimed / 1000000).toFixed(2)}M ARX</td>
                  <td className="py-4 px-4">{getVestingBadge(allocation.vestingType)}</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{allocation.nextUnlock}</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{allocation.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAllocations;
