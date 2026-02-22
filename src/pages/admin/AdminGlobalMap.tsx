import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Globe, Users, Zap, TrendingUp, Activity, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStats, formatNumber } from "@/hooks/useAdminStats";
import arxonLogo from "@/assets/arxon-logo-new.jpg";

// Country flag emoji map
const FLAG_MAP: Record<string, string> = {
  AF:"🇦🇫",AL:"🇦🇱",DZ:"🇩🇿",AO:"🇦🇴",AR:"🇦🇷",AM:"🇦🇲",AU:"🇦🇺",AT:"🇦🇹",AZ:"🇦🇿",
  BD:"🇧🇩",BH:"🇧🇭",BY:"🇧🇾",BE:"🇧🇪",BJ:"🇧🇯",BO:"🇧🇴",BA:"🇧🇦",BW:"🇧🇼",BR:"🇧🇷",
  BG:"🇧🇬",BF:"🇧🇫",BI:"🇧🇮",KH:"🇰🇭",CM:"🇨🇲",CA:"🇨🇦",CF:"🇨🇫",TD:"🇹🇩",CL:"🇨🇱",
  CN:"🇨🇳",CO:"🇨🇴",CD:"🇨🇩",CG:"🇨🇬",CR:"🇨🇷",CI:"🇨🇮",HR:"🇭🇷",CU:"🇨🇺",CY:"🇨🇾",
  CZ:"🇨🇿",DK:"🇩🇰",DJ:"🇩🇯",DO:"🇩🇴",EC:"🇪🇨",EG:"🇪🇬",SV:"🇸🇻",GQ:"🇬🇶",ER:"🇪🇷",
  EE:"🇪🇪",ET:"🇪🇹",FI:"🇫🇮",FR:"🇫🇷",GA:"🇬🇦",GM:"🇬🇲",GE:"🇬🇪",DE:"🇩🇪",GH:"🇬🇭",
  GR:"🇬🇷",GT:"🇬🇹",GN:"🇬🇳",GW:"🇬🇼",GY:"🇬🇾",HT:"🇭🇹",HN:"🇭🇳",HU:"🇭🇺",IS:"🇮🇸",
  IN:"🇮🇳",ID:"🇮🇩",IR:"🇮🇷",IQ:"🇮🇶",IE:"🇮🇪",IL:"🇮🇱",IT:"🇮🇹",JM:"🇯🇲",JP:"🇯🇵",
  JO:"🇯🇴",KZ:"🇰🇿",KE:"🇰🇪",KW:"🇰🇼",KG:"🇰🇬",LA:"🇱🇦",LV:"🇱🇻",LB:"🇱🇧",LS:"🇱🇸",
  LR:"🇱🇷",LY:"🇱🇾",LT:"🇱🇹",LU:"🇱🇺",MG:"🇲🇬",MW:"🇲🇼",MY:"🇲🇾",ML:"🇲🇱",MR:"🇲🇷",
  MX:"🇲🇽",MD:"🇲🇩",MN:"🇲🇳",ME:"🇲🇪",MA:"🇲🇦",MZ:"🇲🇿",MM:"🇲🇲",NA:"🇳🇦",NP:"🇳🇵",
  NL:"🇳🇱",NZ:"🇳🇿",NI:"🇳🇮",NE:"🇳🇪",NG:"🇳🇬",KP:"🇰🇵",MK:"🇲🇰",NO:"🇳🇴",OM:"🇴🇲",
  PK:"🇵🇰",PA:"🇵🇦",PG:"🇵🇬",PY:"🇵🇾",PE:"🇵🇪",PH:"🇵🇭",PL:"🇵🇱",PT:"🇵🇹",QA:"🇶🇦",
  RO:"🇷🇴",RU:"🇷🇺",RW:"🇷🇼",SA:"🇸🇦",SN:"🇸🇳",RS:"🇷🇸",SL:"🇸🇱",SG:"🇸🇬",SK:"🇸🇰",
  SI:"🇸🇮",SO:"🇸🇴",ZA:"🇿🇦",KR:"🇰🇷",SS:"🇸🇸",ES:"🇪🇸",LK:"🇱🇰",SD:"🇸🇩",SR:"🇸🇷",
  SE:"🇸🇪",CH:"🇨🇭",SY:"🇸🇾",TW:"🇹🇼",TJ:"🇹🇯",TZ:"🇹🇿",TH:"🇹🇭",TG:"🇹🇬",TT:"🇹🇹",
  TN:"🇹🇳",TR:"🇹🇷",TM:"🇹🇲",UG:"🇺🇬",UA:"🇺🇦",AE:"🇦🇪",GB:"🇬🇧",US:"🇺🇸",UY:"🇺🇾",
  UZ:"🇺🇿",VE:"🇻🇪",VN:"🇻🇳",YE:"🇾🇪",ZM:"🇿🇲",ZW:"🇿🇼",
};

// Approximate map positions (% from top-left) for country codes
const COUNTRY_POSITIONS: Record<string, { x: number; y: number }> = {
  NG:{x:48,y:52},US:{x:18,y:38},IN:{x:72,y:45},GB:{x:46,y:30},GH:{x:45,y:52},
  KE:{x:58,y:56},ZA:{x:53,y:72},PH:{x:83,y:48},CA:{x:18,y:26},DE:{x:50,y:32},
  BR:{x:30,y:62},AE:{x:62,y:42},TR:{x:56,y:36},ID:{x:82,y:58},EG:{x:55,y:42},
  PK:{x:68,y:40},FR:{x:47,y:33},IT:{x:50,y:35},ES:{x:44,y:36},JP:{x:90,y:35},
  KR:{x:87,y:36},CN:{x:80,y:36},AU:{x:88,y:70},RU:{x:70,y:22},MX:{x:16,y:43},
  SA:{x:60,y:42},UA:{x:55,y:30},PL:{x:52,y:30},NL:{x:48,y:30},SE:{x:51,y:24},
  BD:{x:74,y:44},TZ:{x:57,y:58},UG:{x:56,y:55},CM:{x:50,y:53},SN:{x:41,y:48},
  CI:{x:44,y:52},ET:{x:59,y:50},RW:{x:56,y:56},ML:{x:45,y:48},BF:{x:46,y:50},
  NE:{x:48,y:48},TG:{x:47,y:52},BJ:{x:48,y:52},GN:{x:42,y:50},SL:{x:42,y:51},
  LR:{x:43,y:52},MW:{x:57,y:62},ZM:{x:55,y:62},ZW:{x:55,y:65},MZ:{x:58,y:64},
  BW:{x:53,y:66},NA:{x:50,y:66},AO:{x:50,y:60},CD:{x:54,y:56},CG:{x:51,y:56},
  GA:{x:50,y:55},CO:{x:24,y:52},VE:{x:26,y:50},PE:{x:23,y:58},CL:{x:24,y:68},
  AR:{x:27,y:72},EC:{x:22,y:55},BO:{x:26,y:62},PY:{x:28,y:66},UY:{x:28,y:70},
  TH:{x:80,y:48},VN:{x:81,y:47},MY:{x:80,y:53},MM:{x:78,y:45},SG:{x:80,y:55},
  KH:{x:80,y:49},LA:{x:79,y:46},NP:{x:72,y:42},LK:{x:73,y:50},
};

const COUNTRY_COLORS = [
  "#22c55e","#3b82f6","#f97316","#ef4444","#eab308","#14b8a6","#8b5cf6",
  "#06b6d4","#ec4899","#f59e0b","#10b981","#6366f1","#e11d48","#d946ef","#0ea5e9","#84cc16",
];

interface CountryData {
  country: string;
  country_code: string;
  miners: number;
  flag: string;
  x: number;
  y: number;
  color: string;
}

const AdminGlobalMap = () => {
  const { data: adminStats } = useAdminStats();

  const { data: countryData, isLoading } = useQuery({
    queryKey: ["admin-country-miners"],
    queryFn: async () => {
      // Fetch all profiles with country data
      const { data, error } = await supabase
        .from("profiles")
        .select("country, country_code")
        .not("country_code", "is", null);

      if (error) throw error;

      // Aggregate by country
      const counts: Record<string, { country: string; count: number }> = {};
      for (const row of data || []) {
        const code = row.country_code!;
        if (!counts[code]) {
          counts[code] = { country: row.country || code, count: 0 };
        }
        counts[code].count++;
      }

      // Convert to sorted array
      return Object.entries(counts)
        .map(([code, { country, count }], i) => ({
          country,
          country_code: code,
          miners: count,
          flag: FLAG_MAP[code] || "🏳️",
          x: COUNTRY_POSITIONS[code]?.x ?? 50,
          y: COUNTRY_POSITIONS[code]?.y ?? 50,
          color: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
        }))
        .sort((a, b) => b.miners - a.miners);
    },
    refetchInterval: 30000,
  });

  const countries: CountryData[] = countryData || [];
  const totalMiners = countries.reduce((s, c) => s + c.miners, 0);
  const topCountry = countries[0];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-[#4a9eff]/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-[#00d4ff]/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 p-6 md:p-10 max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <img src={arxonLogo} alt="Arxon" className="w-12 h-12 rounded-xl" />
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Global Mining Network
              </h1>
              <p className="text-white/50 text-sm mt-1">
                Real-time Arxon mining activity across the world
              </p>
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8"
        >
          {[
            { icon: Globe, label: "Countries", value: `${countries.length}`, sub: "Active regions" },
            { icon: Users, label: "Total Users", value: formatNumber(adminStats?.totalUsers ?? 0), sub: `${adminStats?.todaySignups ?? 0} joined today` },
            { icon: Zap, label: "ARX Mined", value: formatNumber(adminStats?.totalMiningPoints ?? 0), sub: `Block reward: ${adminStats?.blockReward ?? 1000}` },
            { icon: Activity, label: "Active Miners", value: formatNumber(adminStats?.activeMiners ?? 0), sub: "Mining right now" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 md:p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4 text-[#4a9eff]" />
                <span className="text-xs text-white/40 uppercase tracking-wider font-medium">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold">{stat.value}</p>
              <p className="text-xs text-emerald-400/80 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stat.sub}
              </p>
            </div>
          ))}
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#4a9eff]" />
          </div>
        ) : countries.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <Globe className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">No country data yet</p>
            <p className="text-sm mt-1">Country detection will populate as users log in.</p>
          </div>
        ) : (
          /* Map + Leaderboard */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* World Map */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 md:p-6 relative overflow-hidden"
            >
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#4a9eff]" />
                Mining Activity Map
              </h2>

              <div className="relative w-full aspect-[2/1] min-h-[300px]">
                {/* Dot grid background */}
                <svg viewBox="0 0 1000 500" className="w-full h-full absolute inset-0" xmlns="http://www.w3.org/2000/svg">
                  {Array.from({ length: 50 }).map((_, row) =>
                    Array.from({ length: 100 }).map((_, col) => {
                      const x = col * 10 + 5;
                      const y = row * 10 + 5;
                      if (!isPointOnLand(x / 10, y / 10)) return null;
                      return <circle key={`${row}-${col}`} cx={x} cy={y} r={1.5} fill="rgba(255,255,255,0.08)" />;
                    })
                  )}
                </svg>

                {/* Country markers */}
                {countries.map((country, i) => (
                  <motion.div
                    key={country.country_code}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05, type: "spring", stiffness: 200 }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    style={{ left: `${country.x}%`, top: `${country.y}%` }}
                  >
                    <div
                      className="absolute inset-[-6px] rounded-full animate-ping opacity-20"
                      style={{ backgroundColor: country.color, animationDuration: `${2 + i * 0.3}s` }}
                    />
                    <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-[#1a1a2e] border-2 border-white/20 flex items-center justify-center text-lg md:text-xl shadow-lg shadow-black/50 relative z-10 group-hover:scale-110 transition-transform">
                      {country.flag}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <p className="text-[10px] font-bold text-white">{country.country}</p>
                      <p className="text-[9px] text-[#4a9eff]">{country.miners.toLocaleString()} miners</p>
                    </div>
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                      <span className="text-[10px] font-bold text-white/70 drop-shadow-lg">
                        {country.country_code}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-center gap-3">
                <span className="text-white/30 text-sm">Mining</span>
                <span className="text-white/30">•</span>
                <span className="text-xl font-bold bg-gradient-to-r from-[#4a9eff] to-[#00d4ff] bg-clip-text text-transparent">
                  ARXON
                </span>
                <span className="text-white/30">•</span>
                <span className="text-white/30 text-sm">Worldwide</span>
              </div>
            </motion.div>

            {/* Leaderboard */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 md:p-6"
            >
              <h2 className="text-lg font-bold mb-4">🏆 Top Mining Countries</h2>

              <div className="space-y-2">
                {countries.slice(0, 16).map((country, i) => {
                  const pct = topCountry ? (country.miners / topCountry.miners) * 100 : 0;
                  return (
                    <motion.div
                      key={country.country_code}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.03 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xs font-bold text-white/30 w-5 text-right">{i + 1}</span>
                      <span className="text-xl">{country.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold truncate">{country.country}</span>
                          <span className="text-xs font-bold text-[#4a9eff] ml-2">{country.miners.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.6 + i * 0.03, duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${country.color}, ${country.color}88)` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Distribution chart */}
              {countries.length > 1 && (
                <div className="mt-6 pt-4 border-t border-white/[0.06]">
                  <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3 font-medium">
                    Regional Distribution
                  </h3>
                  <div className="flex items-end gap-1 h-20">
                    {countries.slice(0, 10).map((country, i) => {
                      const height = topCountry ? (country.miners / topCountry.miners) * 100 : 0;
                      return (
                        <motion.div
                          key={country.country_code}
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ delay: 0.8 + i * 0.05, duration: 0.6 }}
                          className="flex-1 rounded-t-sm relative group cursor-pointer"
                          style={{ backgroundColor: country.color + "cc" }}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] text-white whitespace-nowrap">{country.flag}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {countries.slice(0, 10).map((country) => (
                      <div key={country.country_code} className="flex-1 text-center">
                        <span className="text-[7px] text-white/30">{country.country_code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Footer branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-white/20 text-sm">
            Countries mining on{" "}
            <span className="font-extrabold bg-gradient-to-r from-[#4a9eff] to-[#00d4ff] bg-clip-text text-transparent text-lg">
              ARXON
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// Simple function to approximate land masses for the dot grid
function isPointOnLand(x: number, y: number): boolean {
  if (x >= 5 && x <= 30 && y >= 10 && y <= 35) {
    if (y < 15 && x > 25) return false;
    if (y > 30 && x < 10) return false;
    return true;
  }
  if (x >= 15 && x <= 22 && y >= 35 && y <= 42) return true;
  if (x >= 22 && x <= 38 && y >= 42 && y <= 80) {
    if (x < 25 && y > 70) return false;
    if (x > 35 && y > 65) return false;
    return true;
  }
  if (x >= 44 && x <= 58 && y >= 15 && y <= 35) return true;
  if (x >= 42 && x <= 60 && y >= 35 && y <= 75) {
    if (x > 55 && y > 65) return false;
    if (x < 45 && y > 60) return false;
    return true;
  }
  if (x >= 58 && x <= 68 && y >= 30 && y <= 45) return true;
  if (x >= 68 && x <= 78 && y >= 30 && y <= 55) {
    if (y > 50 && x > 75) return false;
    return true;
  }
  if (x >= 55 && x <= 95 && y >= 10 && y <= 30) return true;
  if (x >= 78 && x <= 92 && y >= 25 && y <= 45) return true;
  if (x >= 78 && x <= 88 && y >= 45 && y <= 55) return true;
  if (x >= 80 && x <= 92 && y >= 48 && y <= 62) {
    return (Math.floor(x) + Math.floor(y)) % 3 !== 0;
  }
  if (x >= 82 && x <= 96 && y >= 62 && y <= 78) {
    if (x < 85 && y < 65) return false;
    return true;
  }
  if (x >= 43 && x <= 47 && y >= 12 && y <= 18) return true;
  if (x >= 88 && x <= 92 && y >= 28 && y <= 40) return true;
  return false;
}

export default AdminGlobalMap;
