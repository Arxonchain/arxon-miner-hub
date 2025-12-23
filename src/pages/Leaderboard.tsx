import { useState } from "react";
import { ChevronDown, Clock, FileText, Users, Twitter, Zap, TrendingUp, Flame } from "lucide-react";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useYapperLeaderboard } from "@/hooks/useYapperLeaderboard";

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState<"miners" | "yappers">("yappers");
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("all");
  const { leaderboard: minerEntries, loading: minersLoading } = useLeaderboard();
  const { yappers, loading: yappersLoading } = useYapperLeaderboard();

  const getBadge = (boost: number) => {
    if (boost >= 800) return { label: "🔥 Viral King", color: "bg-orange-500/20 text-orange-400" };
    if (boost >= 500) return { label: "⚡ Power Yapper", color: "bg-yellow-500/20 text-yellow-400" };
    if (boost >= 300) return { label: "🚀 Rising Star", color: "bg-blue-500/20 text-blue-400" };
    if (boost >= 100) return { label: "✨ Active", color: "bg-green-500/20 text-green-400" };
    return { label: "New", color: "bg-muted text-muted-foreground" };
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

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
          {activeTab === "yappers" ? "Top yappers with highest X engagement" : "Top miners in the ARXON ecosystem this season."}
        </h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 lg:mb-6">
          <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab("yappers")} 
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs lg:text-sm font-medium transition-colors rounded flex items-center justify-center gap-1.5 ${activeTab === "yappers" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Twitter className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Top Yappers
            </button>
            <button 
              onClick={() => setActiveTab("miners")} 
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs lg:text-sm font-medium transition-colors rounded flex items-center justify-center gap-1.5 ${activeTab === "miners" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Top Miners
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
          {activeTab === "yappers" ? (
            yappersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
              </div>
            ) : yappers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Twitter className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No yappers yet. Be the first to connect your X profile!</p>
                <p className="text-xs mt-1">Go to Mining page to connect your X account.</p>
              </div>
            ) : (
              yappers.map((yapper, index) => {
                const badge = getBadge(yapper.boost_percentage);
                return (
                  <div key={yapper.id} className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shrink-0">
                        {getRankIcon(index)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <Twitter className="h-3.5 w-3.5 text-blue-400" />
                          <span className="font-semibold text-sm sm:text-base text-foreground">@{yapper.username}</span>
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${badge.color}`}>
                            {badge.label}
                          </span>
                          {yapper.viral_bonus && (
                            <Flame className="h-3.5 w-3.5 text-orange-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mt-0.5">
                          <span>{yapper.qualified_posts_today} posts today</span>
                          <span>•</span>
                          <span>avg {yapper.average_engagement} eng</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-xs lg:text-sm w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                        <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="text-sm sm:text-base">{yapper.boost_percentage}%</span>
                        <span className="text-muted-foreground font-normal">boost</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            minersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
              </div>
            ) : minerEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No miners yet. Start mining to join the leaderboard!</p>
              </div>
            ) : (
              minerEntries.map((user, index) => (
                <div key={user.user_id} className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shrink-0">
                      {getRankIcon(index)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base text-foreground">
                          {user.username || `Miner ${user.user_id.slice(0, 6)}`}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs sm:text-sm">Rank #{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-xs lg:text-sm text-muted-foreground w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-accent" />
                      <span className="text-foreground font-semibold">{user.total_points.toLocaleString()}</span> pts
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
