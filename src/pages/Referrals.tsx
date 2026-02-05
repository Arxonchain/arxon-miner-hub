import { ArrowRight, ArrowLeft, Copy, Users, Activity, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import StatCard from "@/components/dashboard/StatCard";
import { toast } from "@/hooks/use-toast";

import { useReferrals } from "@/hooks/useReferrals";
import { useAuth } from "@/contexts/AuthContext";
import { useMiningStatus } from "@/hooks/useMiningStatus";
import { format } from "date-fns";
import { useMemo } from "react";

const Referrals = () => {
  const navigate = useNavigate();
  
  const { user } = useAuth();
  const { isMining } = useMiningStatus();
  const { referralCode, referrals, stats, loading, getReferralLink } = useReferrals(user);

  // Separate active and inactive referrals (safely handle missing is_active)
  const { activeReferrals, inactiveReferrals } = useMemo(() => {
    const active = referrals.filter(r => r.is_active === true);
    const inactive = referrals.filter(r => r.is_active !== true);
    return { activeReferrals: active, inactiveReferrals: inactive };
  }, [referrals]);

  const copyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      toast({
        title: "Code Copied!",
        description: `Referral code ${referralCode} copied to clipboard`,
      });
    }
  };

  const shareReferralLink = async () => {
    const link = getReferralLink();
    if (!link) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join ARXON',
          text: `Join me on ARXON and start mining! Use my referral code: ${referralCode}`,
          url: link,
        });
      } catch (err) {
        // User cancelled or share failed - fall back to clipboard
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(link);
          toast({
            title: "Link Copied!",
            description: "Referral link copied to clipboard",
          });
        }
      }
    } else {
      navigator.clipboard.writeText(link);
      toast({
        title: "Link Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };

  const ReferralCard = ({ referral, showStatus = true }: { referral: any; showStatus?: boolean }) => {
    const isActive = referral?.is_active === true;
    return (
      <div className="p-3 border-b border-border/30 last:border-0 space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full shrink-0 ${isActive ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'}`} />
          <span className="text-sm text-foreground font-medium">{referral?.referred_username || 'Anonymous'}</span>
          {showStatus && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
              {isActive ? 'Mining' : 'Inactive'}
            </span>
          )}
          <span className="text-xs text-primary ml-auto">+{referral?.points_awarded || 0} ARX-P</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <p className="text-muted-foreground">Joined</p>
            <p className="text-foreground">{referral?.created_at ? format(new Date(referral.created_at), 'MMM d, yyyy') : 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Code Used</p>
            <p className="text-foreground">{referral?.referral_code_used || 'N/A'}</p>
          </div>
        </div>
      </div>
    );
  };

  const ReferralTableRow = ({ referral }: { referral: any }) => {
    const isActive = referral?.is_active === true;
    return (
      <tr className="border-b border-border/30 last:border-0">
        <td className="p-2.5 sm:p-3 lg:p-4">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full shrink-0 ${isActive ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'}`} />
            <span className="text-foreground text-xs sm:text-sm">{referral?.referred_username || 'Anonymous'}</span>
          </div>
        </td>
        <td className="p-2.5 sm:p-3 lg:p-4 text-muted-foreground text-xs sm:text-sm">
          {referral?.created_at ? format(new Date(referral.created_at), 'MMM d, yyyy') : 'N/A'}
        </td>
        <td className="p-2.5 sm:p-3 lg:p-4 text-foreground text-xs sm:text-sm">+{referral?.points_awarded || 0} ARX-P</td>
      </tr>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/')}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Referrals</h1>
      </div>

      <WelcomeCard
        title="Welcome to ARXON Referrals Section"
        description="Invite others to join ARXON and earn bonus rewards as they mine."
        isActive={isMining}
      />

      {/* Referral Code Display */}
      {user && (
        <div className="glass-card p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Your Unique Referral Code</p>
              <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary tracking-wider">
                  {loading && !referralCode ? "Generating..." : referralCode || "Generating..."}
                </span>
                {referralCode && !loading && (
                  <button 
                    onClick={copyReferralCode}
                    className="btn-glow p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all"
                    title="Copy code"
                  >
                    <Copy className="h-4 w-4 text-primary" />
                  </button>
                )}
              </div>
            </div>
            <button 
              onClick={shareReferralLink} 
              className="btn-glow btn-claim flex items-center gap-2 w-full sm:w-auto justify-center text-xs sm:text-sm lg:text-base px-4 lg:px-6 py-2"
              disabled={!referralCode}
            >
              Share Referral Link
              <ArrowRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        <StatCard label="Total Referrals" value={stats.totalReferrals.toString()} />
        <StatCard label="Active Miners" value={stats.activeMiners.toString()} />
        <StatCard label="Inactive" value={stats.inactiveMiners.toString()} />
        <StatCard label="Referral Earnings" value={`${stats.totalEarnings} ARX-P`} />
      </div>

      <div className="glass-card p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
          Your referral tier increases as more of your invitees mine actively. Earn 100 ARX-P per successful referral!
        </p>
      </div>

      {/* Referrals List */}
      {referrals.length === 0 ? (
        <div className="glass-card p-8 sm:p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm sm:text-base">No referrals yet</p>
          <p className="text-muted-foreground/70 text-xs sm:text-sm mt-1">Share your referral code to start earning!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Referrals Section */}
          <div className="glass-card overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-border/50 flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-400" />
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                Active Miners ({activeReferrals.length})
              </h3>
              <span className="ml-auto text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded">Currently Mining</span>
            </div>
            
            {activeReferrals.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-muted-foreground text-sm">No active miners at the moment</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block sm:hidden">
                  {activeReferrals.map((referral) => (
                    <ReferralCard key={referral.id} referral={referral} showStatus={false} />
                  ))}
                </div>
                
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-2.5 sm:p-3 lg:p-4 text-muted-foreground font-medium text-xs sm:text-sm">User</th>
                        <th className="text-left p-2.5 sm:p-3 lg:p-4 text-muted-foreground font-medium text-xs sm:text-sm">Joined</th>
                        <th className="text-left p-2.5 sm:p-3 lg:p-4 text-muted-foreground font-medium text-xs sm:text-sm">Reward Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeReferrals.map((referral) => (
                        <ReferralTableRow key={referral.id} referral={referral} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Inactive Referrals Section */}
          <div className="glass-card overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-border/50 flex items-center gap-2">
              <UserX className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                Inactive ({inactiveReferrals.length})
              </h3>
              <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Not Mining</span>
            </div>
            
            {inactiveReferrals.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-muted-foreground text-sm">All your referrals are actively mining! 🎉</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block sm:hidden">
                  {inactiveReferrals.map((referral) => (
                    <ReferralCard key={referral.id} referral={referral} showStatus={false} />
                  ))}
                </div>
                
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-2.5 sm:p-3 lg:p-4 text-muted-foreground font-medium text-xs sm:text-sm">User</th>
                        <th className="text-left p-2.5 sm:p-3 lg:p-4 text-muted-foreground font-medium text-xs sm:text-sm">Joined</th>
                        <th className="text-left p-2.5 sm:p-3 lg:p-4 text-muted-foreground font-medium text-xs sm:text-sm">Reward Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inactiveReferrals.map((referral) => (
                        <ReferralTableRow key={referral.id} referral={referral} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Referrals;
