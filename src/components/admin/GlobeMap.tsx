import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CountryData {
  code: string;
  name: string;
  flag: string;
  miners: number;
  color: string;
  // Position as percentage of the map container
  x: number;
  y: number;
}

const COUNTRIES: CountryData[] = [
  { code: "CA", name: "Canada", flag: "🇨🇦", miners: 225, color: "#10b981", x: 13, y: 16 },
  { code: "US", name: "United States", flag: "🇺🇸", miners: 855, color: "#3b82f6", x: 15, y: 34 },
  { code: "BR", name: "Brazil", flag: "🇧🇷", miners: 121, color: "#d946ef", x: 27, y: 68 },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", miners: 586, color: "#ef4444", x: 39, y: 10 },
  { code: "DE", name: "Germany", flag: "🇩🇪", miners: 154, color: "#e11d48", x: 47, y: 18 },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", miners: 6325, color: "#22c55e", x: 42, y: 40 },
  { code: "GH", name: "Ghana", flag: "🇬🇭", miners: 1145, color: "#eab308", x: 35, y: 52 },
  { code: "CM", name: "Cameroon", flag: "🇨🇲", miners: 423, color: "#06b6d4", x: 44, y: 58 },
  { code: "EG", name: "Egypt", flag: "🇪🇬", miners: 112, color: "#0ea5e9", x: 54, y: 30 },
  { code: "KE", name: "Kenya", flag: "🇰🇪", miners: 923, color: "#14b8a6", x: 58, y: 48 },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿", miners: 331, color: "#ec4899", x: 54, y: 68 },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", miners: 494, color: "#8b5cf6", x: 50, y: 82 },
  { code: "AE", name: "UAE", flag: "🇦🇪", miners: 189, color: "#6366f1", x: 64, y: 36 },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", miners: 100, color: "#84cc16", x: 70, y: 26 },
  { code: "IN", name: "India", flag: "🇮🇳", miners: 728, color: "#f97316", x: 74, y: 44 },
  { code: "PH", name: "Philippines", flag: "🇵🇭", miners: 290, color: "#f59e0b", x: 84, y: 38 },
];

/* ── Dot-matrix world map (simplified SVG paths as dot grid) ── */
function DotMap() {
  // Generate dots in a world-map-like pattern
  const dots: { cx: number; cy: number; opacity: number }[] = [];

  // Simplified continent outlines as rectangular regions with dot density
  const continents = [
    // North America
    { xMin: 5, xMax: 28, yMin: 12, yMax: 48, density: 0.55 },
    // Central America
    { xMin: 15, xMax: 24, yMin: 42, yMax: 52, density: 0.4 },
    // South America
    { xMin: 20, xMax: 35, yMin: 50, yMax: 82, density: 0.55 },
    // Europe
    { xMin: 40, xMax: 55, yMin: 14, yMax: 36, density: 0.6 },
    // Africa
    { xMin: 40, xMax: 58, yMin: 34, yMax: 76, density: 0.6 },
    // Middle East
    { xMin: 55, xMax: 65, yMin: 30, yMax: 44, density: 0.45 },
    // Russia/Central Asia
    { xMin: 50, xMax: 90, yMin: 10, yMax: 30, density: 0.45 },
    // South Asia
    { xMin: 64, xMax: 76, yMin: 32, yMax: 50, density: 0.5 },
    // East Asia
    { xMin: 74, xMax: 88, yMin: 22, yMax: 48, density: 0.5 },
    // Southeast Asia
    { xMin: 76, xMax: 88, yMin: 44, yMax: 56, density: 0.4 },
    // Australia
    { xMin: 80, xMax: 92, yMin: 62, yMax: 78, density: 0.45 },
    // Indonesia
    { xMin: 78, xMax: 90, yMin: 54, yMax: 60, density: 0.35 },
  ];

  const step = 1.8;
  for (let x = 0; x <= 100; x += step) {
    for (let y = 0; y <= 90; y += step) {
      let inContinent = false;
      for (const c of continents) {
        if (x >= c.xMin && x <= c.xMax && y >= c.yMin && y <= c.yMax) {
          // Add some randomness for organic shape
          const noise = Math.sin(x * 0.8) * Math.cos(y * 0.6) * 0.3;
          if (Math.random() < c.density + noise * 0.2) {
            inContinent = true;
            break;
          }
        }
      }
      if (inContinent) {
        dots.push({ cx: x, cy: y, opacity: 0.25 + Math.random() * 0.2 });
      }
    }
  }

  return (
    <svg
      viewBox="0 0 100 90"
      className="w-full h-full absolute inset-0"
      preserveAspectRatio="xMidYMid meet"
    >
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          r={0.35}
          fill="#4a9eff"
          opacity={d.opacity}
        />
      ))}
    </svg>
  );
}

/* ── Single country flag marker ── */
function FlagMarker({
  country,
  isActive,
  delay,
}: {
  country: CountryData;
  isActive: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, type: "spring", stiffness: 200 }}
      className="absolute flex flex-col items-center"
      style={{
        left: `${country.x}%`,
        top: `${country.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isActive ? 20 : 10,
      }}
    >
      {/* Pulse ring */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="absolute rounded-full"
            style={{
              width: 36,
              height: 36,
              border: `2px solid ${country.color}`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Flag circle */}
      <motion.div
        animate={{
          boxShadow: isActive
            ? `0 0 16px 4px ${country.color}88, 0 0 32px 8px ${country.color}44`
            : `0 0 6px 1px ${country.color}33`,
          scale: isActive ? 1.15 : 1,
        }}
        transition={{ duration: 0.4 }}
        className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-sm md:text-base relative"
        style={{
          background: `linear-gradient(135deg, ${country.color}22, ${country.color}44)`,
          border: `1.5px solid ${country.color}88`,
          backdropFilter: "blur(4px)",
        }}
      >
        {country.flag}
      </motion.div>

      {/* Label */}
      <motion.span
        animate={{ opacity: isActive ? 1 : 0.6 }}
        className="mt-1 text-[9px] md:text-[10px] font-bold tracking-wider uppercase"
        style={{
          color: isActive ? country.color : "rgba(255,255,255,0.5)",
          textShadow: isActive ? `0 0 8px ${country.color}88` : "none",
        }}
      >
        {country.code}
      </motion.span>
    </motion.div>
  );
}

/* ── Exported component ── */
export default function GlobeMap() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % COUNTRIES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative" style={{ aspectRatio: "2/1", minHeight: 300, maxHeight: 520 }}>
      {/* Dot matrix map */}
      <DotMap />

      {/* Country flags */}
      {COUNTRIES.map((c, i) => (
        <FlagMarker
          key={c.code}
          country={c}
          isActive={activeIndex === i}
          delay={0.1 + i * 0.05}
        />
      ))}

      {/* Active country indicator dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
        {COUNTRIES.map((c, i) => (
          <div
            key={c.code}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              background: activeIndex === i ? c.color : "rgba(255,255,255,0.12)",
              boxShadow: activeIndex === i ? `0 0 8px ${c.color}` : "none",
              transform: activeIndex === i ? "scale(1.5)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
