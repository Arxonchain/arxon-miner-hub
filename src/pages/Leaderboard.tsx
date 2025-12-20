import { useState } from "react";
import { ChevronDown, Clock, FileText, Users } from "lucide-react";
import WelcomeCard from "@/components/dashboard/WelcomeCard";

const leaderboardData = [{
  id: 1,
  name: "Gabe",
  handle: "@GabeXmetax",
  badge: "Diamond",
  tweets: 10,
  points: 113
}, {
  id: 2,
  name: "Gabe",
  handle: "@GabeXmetax",
  badge: "King of Content",
  tweets: 10,
  points: 113
}, {
  id: 3,
  name: "Gabe",
  handle: "@GabeXmetax",
  badge: "King of Content",
  tweets: 10,
  points: 113
}];

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("all");

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Creator Leaderboard</h1>

      <WelcomeCard 
        title="Welcome to ARXON Creator Leaderboard" 
        description="Compete for glory and prizes! Top content creators win amazing rewards." 
        isActive={false} 
      />

      <div className="glass-card p-3 sm:p-4 flex items-center gap-2 border-solid">
        <Clock className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-accent shrink-0" />
        <span className="text-xs sm:text-sm lg:text-base text-foreground">The next competition is coming soon!</span>
      </div>

      <div className="glass-card p-3 sm:p-4 md:p-5 lg:p-6">
        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-4 sm:mb-5 lg:mb-6">
          Top miners in the ARXON ecosystem this season.
        </h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 lg:mb-6">
          <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab("global")} 
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs lg:text-sm font-medium transition-colors rounded ${activeTab === "global" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Global Ranking
            </button>
            <button 
              onClick={() => setActiveTab("friends")} 
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs lg:text-sm font-medium transition-colors rounded ${activeTab === "friends" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Friends / Referrals
            </button>
          </div>

          <div className="flex gap-1 sm:gap-2">
            {(["all", "month", "week"] as const).map(filter => (
              <button 
                key={filter} 
                onClick={() => setTimeFilter(filter)} 
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs lg:text-sm font-medium transition-colors flex items-center gap-0.5 sm:gap-1 ${timeFilter === filter ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                {filter !== "all" && <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {leaderboardData.map(user => (
            <div key={user.id} className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shrink-0" />
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="font-semibold text-sm sm:text-base text-foreground">{user.name}</span>
                    <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${user.badge === "Diamond" ? "bg-cyan-500/20 text-cyan-400" : "bg-orange-500/20 text-orange-400"}`}>
                      {user.badge}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs sm:text-sm">{user.handle}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-xs lg:text-sm text-muted-foreground w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                  {user.tweets} tweets
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                  {user.points} pts
                </div>
                <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5 hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
