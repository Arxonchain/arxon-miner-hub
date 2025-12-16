import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import StatCard from "@/components/dashboard/StatCard";
import EarningStatistics from "@/components/dashboard/EarningStatistics";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <WelcomeCard
        title="Welcome to ARXON Q1, Marketing Ongoing!"
        description="On the dashboard you will see your earnings for this Arxon. To view your total number of points, simply navigate to the Rewards tab on the left."
        isActive={true}
      />

      {/* Stats Grid with inner cards */}
      <div className="bg-card/40 border border-accent/40 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Mining Balance" value="3,420 ARX" />
          <StatCard label="Mining Rate" value="+10 ARX" suffix=" / 30s" />
          <StatCard label="Active Miners" value="24,211" />
        </div>

        {/* Boost Banner */}
        <div className="mt-4 bg-card/40 border border-accent/40 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Rank Boost by +2% mining rate from every 5 referrals.
          </p>
          <button 
            onClick={() => navigate('/mining')}
            className="bg-accent hover:bg-accent/90 text-foreground px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Start Mining
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <EarningStatistics />
    </div>
  );
};

export default Dashboard;