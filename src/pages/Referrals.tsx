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
    <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Claiming Rewards</h1>

      <WelcomeCard
        title="Welcome to ARXON Referrals Section"
        description="Invite others to join ARXON and earn bonus rewards as they mine."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        <StatCard label="Total Referrals" value="40" />
        <StatCard label="Active Miners" value="30" />
        <StatCard label="Referral Earnings" value="840.25 ARX" />
      </div>

      <div className="glass-card p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
          Your referral tier increases as more of your invitees mine actively.
        </p>
        <button onClick={shareReferralLink} className="btn-claim flex items-center gap-2 w-full sm:w-auto justify-center text-xs sm:text-sm lg:text-base px-4 lg:px-6 py-1.5 sm:py-2">
          Share Referral Link
          <ArrowRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
        </button>
      </div>

      {/* Mobile Card View */}
      <div className="glass-card overflow-hidden block sm:hidden">
        {referralData.map((ref, idx) => (
          <div key={idx} className="p-3 border-b border-border/30 last:border-0 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shrink-0" />
              <span className="text-sm text-foreground font-medium">{ref.wallet}</span>
              <span className="text-xs text-primary ml-auto">{ref.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <p className="text-muted-foreground">Joined</p>
                <p className="text-foreground">{ref.joined}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Mined</p>
                <p className="text-foreground">{ref.totalMined}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reward</p>
                <p className="text-foreground">{ref.reward}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="glass-card overflow-hidden hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-2.5 sm:p-3 lg:p-4 text-muted-foreground font-medium text-xs sm:text-sm">User / Wallet</th>
              <th className="text-left p-2.5 sm:p-3 lg:p-4 text-muted-foreground font-medium text-xs sm:text-sm">Joined</th>
              <th className="text-left p-2.5 sm:p-3 lg:p-4 text-muted-foreground font-medium text-xs sm:text-sm">Mining Status</th>
              <th className="text-left p-2.5 sm:p-3 lg:p-4 text-muted-foreground font-medium text-xs sm:text-sm">Total Mined</th>
              <th className="text-left p-2.5 sm:p-3 lg:p-4 text-muted-foreground font-medium text-xs sm:text-sm">Reward Earned</th>
            </tr>
          </thead>
          <tbody>
            {referralData.map((ref, idx) => (
              <tr key={idx} className="border-b border-border/30 last:border-0">
                <td className="p-2.5 sm:p-3 lg:p-4">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shrink-0" />
                    <span className="text-foreground text-xs sm:text-sm">{ref.wallet}</span>
                  </div>
                </td>
                <td className="p-2.5 sm:p-3 lg:p-4 text-muted-foreground text-xs sm:text-sm">{ref.joined}</td>
                <td className="p-2.5 sm:p-3 lg:p-4">
                  <span className="text-primary text-xs sm:text-sm">{ref.status}</span>
                </td>
                <td className="p-2.5 sm:p-3 lg:p-4 text-foreground text-xs sm:text-sm">{ref.totalMined}</td>
                <td className="p-2.5 sm:p-3 lg:p-4 text-foreground text-xs sm:text-sm">{ref.reward}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Referrals;
