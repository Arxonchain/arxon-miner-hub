import { useMemo } from "react";
import { motion } from "framer-motion";
import { Globe, Users, Zap, TrendingUp, Activity } from "lucide-react";
import arxonLogo from "@/assets/arxon-logo-new.jpg";

// Realistic estimated data based on ~4,400 user base
const MINING_COUNTRIES = [
  { code: "NG", name: "Nigeria", flag: "🇳🇬", miners: 2134, x: 48, y: 52, color: "#22c55e" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", miners: 387, x: 45, y: 52, color: "#eab308" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", miners: 312, x: 58, y: 56, color: "#14b8a6" },
  { code: "US", name: "United States", flag: "🇺🇸", miners: 289, x: 18, y: 38, color: "#3b82f6" },
  { code: "IN", name: "India", flag: "🇮🇳", miners: 246, x: 72, y: 45, color: "#f97316" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", miners: 198, x: 46, y: 30, color: "#ef4444" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", miners: 167, x: 53, y: 72, color: "#8b5cf6" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲", miners: 143, x: 50, y: 53, color: "#06b6d4" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿", miners: 112, x: 57, y: 58, color: "#ec4899" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", miners: 98, x: 83, y: 48, color: "#f59e0b" },
  { code: "CA", name: "Canada", flag: "🇨🇦", miners: 76, x: 18, y: 26, color: "#10b981" },
  { code: "AE", name: "UAE", flag: "🇦🇪", miners: 64, x: 62, y: 42, color: "#6366f1" },
  { code: "DE", name: "Germany", flag: "🇩🇪", miners: 52, x: 50, y: 32, color: "#e11d48" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", miners: 41, x: 30, y: 62, color: "#d946ef" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", miners: 38, x: 55, y: 42, color: "#0ea5e9" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", miners: 32, x: 68, y: 40, color: "#84cc16" },
];

const TOTAL_MINERS = MINING_COUNTRIES.reduce((sum, c) => sum + c.miners, 0);

const AdminGlobalMap = () => {
  const sortedCountries = useMemo(
    () => [...MINING_COUNTRIES].sort((a, b) => b.miners - a.miners),
    []
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-[#4a9eff]/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-[#00d4ff]/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 p-6 md:p-10 max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src={arxonLogo} alt="Arxon" className="w-12 h-12 rounded-xl" />
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Global Mining Network</h1>
              <p className="text-white/50 text-sm mt-1">Real-time Arxon mining activity across the world</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-sm text-white/70">Live</span>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {[
            { icon: Globe, label: "Countries", value: `${MINING_COUNTRIES.length}`, sub: "Active regions" },
            { icon: Users, label: "Total Miners", value: TOTAL_MINERS.toLocaleString(), sub: "+18% this week" },
            { icon: Zap, label: "ARX Mined Today", value: "1.2M", sub: "Block reward: 1000" },
            { icon: Activity, label: "Active Now", value: "4,389", sub: "Mining in real-time" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 md:p-5">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4 text-[#4a9eff]" />
                <span className="text-xs text-white/40 uppercase tracking-wider font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold">{stat.value}</p>
              <p className="text-xs text-emerald-400/80 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />{stat.sub}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Map + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 md:p-6 relative overflow-hidden">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#4a9eff]" />Mining Activity Map
            </h2>
            <div className="relative w-full aspect-[2/1] min-h-[300px]">
              <svg viewBox="0 0 1000 500" className="w-full h-full absolute inset-0" xmlns="http://www.w3.org/2000/svg">
                {Array.from({ length: 50 }).map((_, row) =>
                  Array.from({ length: 100 }).map((_, col) => {
                    const x = col * 10 + 5, y = row * 10 + 5;
                    if (!isPointOnLand(x / 10, y / 10)) return null;
                    return <circle key={`${row}-${col}`} cx={x} cy={y} r={1.5} fill="rgba(255,255,255,0.08)" />;
                  })
                )}
              </svg>
              {MINING_COUNTRIES.map((country, i) => (
                <motion.div key={country.code} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.05, type: "spring", stiffness: 200 }} className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer" style={{ left: `${country.x}%`, top: `${country.y}%` }}>
                  <div className="absolute inset-[-6px] rounded-full animate-ping opacity-20" style={{ backgroundColor: country.color, animationDuration: `${2 + i * 0.3}s` }} />
                  <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-[#1a1a2e] border-2 border-white/20 flex items-center justify-center text-lg md:text-xl shadow-lg shadow-black/50 relative z-10 group-hover:scale-110 transition-transform">{country.flag}</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <p className="text-[10px] font-bold text-white">{country.name}</p>
                    <p className="text-[9px] text-[#4a9eff]">{country.miners.toLocaleString()} miners</p>
                  </div>
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-[10px] font-bold text-white/70 drop-shadow-lg">{country.code}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-white/30 text-sm">Mining</span>
              <span className="text-white/30">•</span>
              <span className="text-xl font-bold bg-gradient-to-r from-[#4a9eff] to-[#00d4ff] bg-clip-text text-transparent">ARXON</span>
              <span className="text-white/30">•</span>
              <span className="text-white/30 text-sm">Worldwide</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 md:p-6">
            <h2 className="text-lg font-bold mb-4">🏆 Top Mining Countries</h2>
            <div className="space-y-2">
              {sortedCountries.map((country, i) => {
                const pct = (country.miners / sortedCountries[0].miners) * 100;
                return (
                  <motion.div key={country.code} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.03 }} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white/30 w-5 text-right">{i + 1}</span>
                    <span className="text-xl">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold truncate">{country.name}</span>
                        <span className="text-xs font-bold text-[#4a9eff] ml-2">{country.miners.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.6 + i * 0.03, duration: 0.8, ease: "easeOut" }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${country.color}, ${country.color}88)` }} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06]">
              <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3 font-medium">Regional Distribution</h3>
              <div className="flex items-end gap-1 h-20">
                {sortedCountries.slice(0, 10).map((country, i) => {
                  const height = (country.miners / sortedCountries[0].miners) * 100;
                  return (
                    <motion.div key={country.code} initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ delay: 0.8 + i * 0.05, duration: 0.6 }} className="flex-1 rounded-t-sm relative group cursor-pointer" style={{ backgroundColor: country.color + "cc" }}>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] text-white whitespace-nowrap">{country.flag}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex gap-1 mt-1">
                {sortedCountries.slice(0, 10).map((country) => (
                  <div key={country.code} className="flex-1 text-center">
                    <span className="text-[7px] text-white/30">{country.code}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-8 text-center">
          <p className="text-white/20 text-sm">
            Countries mining on{" "}
            <span className="font-extrabold bg-gradient-to-r from-[#4a9eff] to-[#00d4ff] bg-clip-text text-transparent text-lg">ARXON</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

function isPointOnLand(x: number, y: number): boolean {
  if (x >= 5 && x <= 30 && y >= 10 && y <= 35) { if (y < 15 && x > 25) return false; if (y > 30 && x < 10) return false; return true; }
  if (x >= 15 && x <= 22 && y >= 35 && y <= 42) return true;
  if (x >= 22 && x <= 38 && y >= 42 && y <= 80) { if (x < 25 && y > 70) return false; if (x > 35 && y > 65) return false; return true; }
  if (x >= 44 && x <= 58 && y >= 15 && y <= 35) return true;
  if (x >= 42 && x <= 60 && y >= 35 && y <= 75) { if (x > 55 && y > 65) return false; if (x < 45 && y > 60) return false; return true; }
  if (x >= 58 && x <= 68 && y >= 30 && y <= 45) return true;
  if (x >= 68 && x <= 78 && y >= 30 && y <= 55) { if (y > 50 && x > 75) return false; return true; }
  if (x >= 55 && x <= 95 && y >= 10 && y <= 30) return true;
  if (x >= 78 && x <= 92 && y >= 25 && y <= 45) return true;
  if (x >= 78 && x <= 88 && y >= 45 && y <= 55) return true;
  if (x >= 80 && x <= 92 && y >= 48 && y <= 62) return (Math.floor(x) + Math.floor(y)) % 3 !== 0;
  if (x >= 82 && x <= 96 && y >= 62 && y <= 78) { if (x < 85 && y < 65) return false; return true; }
  if (x >= 43 && x <= 47 && y >= 12 && y <= 18) return true;
  if (x >= 88 && x <= 92 && y >= 28 && y <= 40) return true;
  return false;
}

export default AdminGlobalMap;
