import { useState } from "react";
import { ArrowRight } from "lucide-react";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import StatCard from "@/components/dashboard/StatCard";
import MiningWidget from "@/components/mining/MiningWidget";

const Dashboard = () => {
  const [isMining, setIsMining] = useState(true);
  const [view, setView] = useState<"overview" | "mining">("overview");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Overview</h1>

      <WelcomeCard
        title="Welcome to ARXON Q1, Marketing Ongoing!"
        description="On the dashboard you will see your earnings for this Arxon. To view your total number of points, simply navigate to the Rewards tab on the left."
        isActive={isMining}
      />

      {view === "overview" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Mining Balance" value="3,420 ARX" />
            <StatCard label="Mining Rate" value="+10 ARX" suffix="/ 30s" />
            <StatCard label="Active Miners" value="24,211" />
          </div>

          <div className="glass-card p-6 flex items-center justify-between">
            <p className="text-muted-foreground">
              Rank Boost by +2% mining rate from every 5 referrals.
            </p>
            <button 
              onClick={() => setIsMining(!isMining)}
              className="btn-mining"
            >
              <span className="w-2 h-2 rounded-full bg-foreground" />
              Start Mining
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <button 
            onClick={() => setView("mining")}
            className="glass-card p-8 w-full text-center hover:border-accent/50 transition-colors cursor-pointer"
          >
            <p className="text-muted-foreground">Click to view Mining Widget</p>
          </button>
        </>
      ) : (
        <>
          <MiningWidget isMining={isMining} onToggleMining={() => setIsMining(!isMining)} />
          <button 
            onClick={() => setView("overview")}
            className="text-accent hover:underline text-sm"
          >
            ← Back to Overview
          </button>
        </>
      )}
    </div>
  );
};

export default Dashboard;
