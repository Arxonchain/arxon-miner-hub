import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import StatCard from "@/components/dashboard/StatCard";
import EarningStatistics from "@/components/dashboard/EarningStatistics";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isMining] = useState(true);

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Overview</h1>

      <WelcomeCard
        title="Welcome to ARXON Q1, Marketing Ongoing!"
        description="On the dashboard you will see your earnings for this Arxon. To view your total number of points, simply navigate to the Rewards tab on the left."
        isActive={isMining}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        <StatCard label="Mining Balance" value="3,420 ARX" />
        <StatCard label="Mining Rate" value="+10 ARX" suffix="/ 30s" />
        <StatCard label="Active Miners" value="24,211" />
      </div>

      <div className="glass-card p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
          Rank Boost by +2% mining rate from every 5 referrals.
        </p>
        <button 
          onClick={() => navigate('/mining')}
          className="btn-mining w-full sm:w-auto justify-center text-xs sm:text-sm lg:text-base px-4 lg:px-6 py-2 lg:py-2.5"
        >
          <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-foreground" />
          Start Mining
          <ArrowRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
        </button>
      </div>

      <EarningStatistics />
    </div>
  );
};

export default Dashboard;
