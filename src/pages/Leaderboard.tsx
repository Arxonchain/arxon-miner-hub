import { useState } from "react";
import { ChevronDown, Clock, FileText, Users } from "lucide-react";
import WelcomeCard from "@/components/dashboard/WelcomeCard";

const leaderboardData = [
  { id: 1, name: "Gabe", handle: "@GabeXmetax", badge: "Diamond", tweets: 10, points: 113 },
  { id: 2, name: "Gabe", handle: "@GabeXmetax", badge: "King of Content", tweets: 10, points: 113 },
  { id: 3, name: "Gabe", handle: "@GabeXmetax", badge: "King of Content", tweets: 10, points: 113 },
];

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("all");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Creator Leaderboard</h1>

      <WelcomeCard
        title="Welcome to ARXON Creator Leaderboard"
        description="Compete for glory and prizes! Top content creators win amazing rewards."
        isActive={false}
      />

      <div className="glass-card p-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-accent" />
        <span className="text-foreground">The next competition is coming soon!</span>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Top miners in the ARXON ecosystem this season.
        </h2>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("global")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "global" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Global Ranking
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "friends" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Friends / Referrals
            </button>
          </div>

          <div className="flex gap-2">
            {(["all", "month", "week"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                  timeFilter === filter ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                {filter !== "all" && <ChevronDown className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {leaderboardData.map((user) => (
            <div key={user.id} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{user.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      user.badge === "Diamond" ? "bg-cyan-500/20 text-cyan-400" : "bg-orange-500/20 text-orange-400"
                    }`}>
                      {user.badge}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-sm">{user.handle}</span>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {user.tweets} tweets
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {user.points} pts
                </div>
                <ChevronDown className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
