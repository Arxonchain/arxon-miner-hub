import { ArrowRight } from "lucide-react";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import StatCard from "@/components/dashboard/StatCard";
import { toast } from "@/hooks/use-toast";

const referralData = [
  { wallet: "Arx4kba..92d", joined: "Nov 10", status: "Active", totalMined: "1,420 ARX", reward: "78.2 ARX" },
];

const Referrals = () => {
  const shareReferralLink = () => {
    navigator.clipboard.writeText("https://arxon.io/ref/ARX-12345");
    toast({
      title: "Link Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Claiming Rewards</h1>

      <WelcomeCard
        title="Welcome to ARXON Referrals Section"
        description="Invite others to join ARXON and earn bonus rewards as they mine."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Referrals" value="40" />
        <StatCard label="Active Miners" value="30" />
        <StatCard label="Referral Earnings" value="840.25 ARX" />
      </div>

      <div className="glass-card p-6 flex items-center justify-between">
        <p className="text-muted-foreground">
          Your referral tier increases as more of your invitees mine actively.
        </p>
        <button onClick={shareReferralLink} className="btn-claim flex items-center gap-2">
          Share Referral Link
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-4 text-muted-foreground font-medium">User / Wallet</th>
              <th className="text-left p-4 text-muted-foreground font-medium">Joined</th>
              <th className="text-left p-4 text-muted-foreground font-medium">Mining Status</th>
              <th className="text-left p-4 text-muted-foreground font-medium">Total Mined</th>
              <th className="text-left p-4 text-muted-foreground font-medium">Reward Earned</th>
            </tr>
          </thead>
          <tbody>
            {referralData.map((ref, idx) => (
              <tr key={idx} className="border-b border-border/30 last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600" />
                    <span className="text-foreground">{ref.wallet}</span>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{ref.joined}</td>
                <td className="p-4">
                  <span className="text-primary">{ref.status}</span>
                </td>
                <td className="p-4 text-foreground">{ref.totalMined}</td>
                <td className="p-4 text-foreground">{ref.reward}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Referrals;
