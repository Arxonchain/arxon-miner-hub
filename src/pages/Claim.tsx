import { useState } from "react";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import { toast } from "@/hooks/use-toast";

interface ClaimItem {
  id: number;
  amount: string;
  claimed: boolean;
  claimedAgo?: string;
}

const Claim = () => {
  const [claims, setClaims] = useState<ClaimItem[]>([
    { id: 1, amount: "3,420 ARX", claimed: false },
    { id: 2, amount: "3,420 ARX", claimed: false },
    { id: 3, amount: "3,420 ARX", claimed: true, claimedAgo: "Now" },
    { id: 4, amount: "3,420 ARX", claimed: true, claimedAgo: "2 hrs ago" },
  ]);

  const handleClaim = (id: number) => {
    setClaims(prev => prev.map(claim => 
      claim.id === id ? { ...claim, claimed: true, claimedAgo: "Now" } : claim
    ));
    toast({
      title: "Claimed!",
      description: "ARX tokens have been sent to your wallet",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Claiming Rewards</h1>

      <WelcomeCard
        title="Welcome to ARXON Reward Section"
        description="Withdraw your mined ARX tokens securely to your connected wallet."
      />

      <div className="space-y-4">
        {claims.map((claim) => (
          <div key={claim.id} className="glass-card p-6 flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-foreground">{claim.amount}</p>
              <p className="text-muted-foreground text-sm">Available ARXON token to Claim</p>
            </div>
            {claim.claimed ? (
              <button className="btn-claimed flex items-center gap-2">
                Claimed
                {claim.claimedAgo && <span className="text-xs opacity-70">{claim.claimedAgo}</span>}
              </button>
            ) : (
              <button onClick={() => handleClaim(claim.id)} className="btn-claim">
                Claim Now
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Claim;
