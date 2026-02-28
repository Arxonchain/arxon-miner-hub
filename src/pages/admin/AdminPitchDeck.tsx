import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Grid3X3, Maximize, Minimize, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import arxonLogo from "@/assets/arxon-logo-new.jpg";

/* ── Slide Components ── */

const SlideWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("w-full h-full flex flex-col justify-center items-center relative overflow-hidden", className)}>
    {children}
  </div>
);

const SlideBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-block px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold border border-[hsl(215,50%,70%/0.3)] text-[hsl(215,50%,70%)] bg-[hsl(215,50%,70%/0.08)] mb-4">
    {children}
  </span>
);

const Stat = ({ value, label, sub }: { value: string; label: string; sub?: string }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-black text-[hsl(215,50%,80%)]">{value}</div>
    <div className="text-xs text-[hsl(220,15%,55%)] mt-1 uppercase tracking-wider font-medium">{label}</div>
    {sub && <div className="text-[10px] text-[hsl(220,15%,45%)] mt-0.5">{sub}</div>}
  </div>
);

/* ── SLIDE 1: Cover ── */
const Slide1Cover = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,15%,4%)] via-[hsl(220,20%,6%)] to-[hsl(220,15%,2%)]" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(220,40%,60%/0.04)] blur-[100px]" />
    <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <img src={arxonLogo} alt="Arxon" className="w-12 h-12 rounded-xl object-cover" />
        <span className="text-2xl font-black tracking-[0.15em] text-[hsl(220,20%,95%)]">ARXON</span>
      </div>
      <h1 className="text-5xl md:text-7xl font-black leading-[1.05] mb-4">
        <span className="text-[hsl(220,20%,95%)]">Privacy You </span>
        <span className="bg-gradient-to-r from-[hsl(215,50%,70%)] to-[hsl(200,60%,55%)] bg-clip-text text-transparent">Control</span>
      </h1>
      <p className="text-base text-[hsl(220,15%,55%)] max-w-lg mb-10 font-medium">
        Layer-1 blockchain with toggle privacy for payments and governance
      </p>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(220,40%,60%)] to-[hsl(215,50%,70%)] flex items-center justify-center text-white text-xs font-bold">GA</div>
        <div className="text-left">
          <div className="text-sm font-bold text-[hsl(220,20%,90%)]">Gabe Ademibo</div>
          <div className="text-xs text-[hsl(220,15%,55%)]">Founder & CEO</div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[hsl(220,15%,40%)] font-bold">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
        Pre-Seed · Confidential
      </div>
    </div>
  </SlideWrapper>
);

/* ── SLIDE 2: The Problem ── */
const Slide2Problem = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,15%,4%)] to-[hsl(0,30%,6%/0.3)]" />
    <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
      <SlideBadge>The Problem</SlideBadge>
      <h2 className="text-3xl md:text-5xl font-black text-[hsl(220,20%,95%)] leading-tight mb-8">
        2 Billion People Can't Use<br />Blockchain <span className="text-[hsl(0,70%,60%)]">Safely</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: "🌍", stat: "$905B", label: "Global remittance market", sub: "World Bank/Visa 2024–2025" },
          { icon: "👁", stat: "1.3B", label: "Unbanked face surveillance", sub: "Financial privacy at risk" },
          { icon: "🔓", stat: "100%", label: "Transactions exposed", sub: "On public ledgers" },
        ].map((item, i) => (
          <div key={i} className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-5 text-center">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="text-2xl font-black text-[hsl(215,50%,80%)]">{item.stat}</div>
            <div className="text-xs text-[hsl(220,20%,85%)] font-semibold mt-1">{item.label}</div>
            <div className="text-[10px] text-[hsl(220,15%,45%)] mt-1">{item.sub}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-[hsl(220,15%,55%)] border-l-2 border-[hsl(0,70%,50%/0.5)] pl-4">
        Public ledgers expose every transaction → majority of users avoid or limit blockchain use due to privacy concerns.
        Single focused problem: <span className="text-[hsl(220,20%,85%)] font-bold">financial privacy for the underserved.</span>
      </p>
    </div>
  </SlideWrapper>
);

/* ── SLIDE 3: Market Timing ── */
const Slide3Timing = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
    <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
      <SlideBadge>Market Timing</SlideBadge>
      <h2 className="text-3xl md:text-5xl font-black text-[hsl(220,20%,95%)] leading-tight mb-10">
        The Market Is <span className="text-[hsl(215,50%,70%)]">Ready</span>
      </h2>
      <div className="space-y-3 mb-10">
        {[
          { date: "Oct 2025", text: "Ethereum Foundation launches Privacy Cluster", icon: "⟠" },
          { date: "Dec 2025", text: "Circle tests encrypted stablecoins (USDCx on Aleo testnet)", icon: "💲" },
          { date: "2025", text: "Goldman Sachs / BNY Mellon back Canton's privacy chain", icon: "🏦" },
          { date: "2025", text: "Monero delisted on ~73 exchanges → market needs compliant privacy", icon: "⚠️" },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-4 bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-4">
            <span className="text-xl mt-0.5 flex-shrink-0">{item.icon}</span>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[hsl(215,50%,70%)] font-bold">{item.date}</span>
              <p className="text-sm text-[hsl(220,20%,85%)] font-medium mt-0.5">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gradient-to-r from-[hsl(215,50%,70%/0.1)] to-transparent border-l-2 border-[hsl(215,50%,70%)] p-4 rounded-r-xl">
        <p className="text-sm text-[hsl(220,20%,90%)] font-bold italic">
          "The market is ready. The incumbents are focused elsewhere."
        </p>
      </div>
    </div>
  </SlideWrapper>
);

/* ── SLIDE 4: The Solution ── */
const Slide4Solution = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
    <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
      <SlideBadge>The Solution</SlideBadge>
      <h2 className="text-3xl md:text-4xl font-black text-[hsl(220,20%,95%)] leading-tight mb-3">
        Toggle Privacy: <span className="text-[hsl(215,50%,70%)]">On</span> When You Need It,{" "}
        <span className="text-[hsl(220,15%,55%)]">Off</span> When You Don't
      </h2>
      <p className="text-sm text-[hsl(220,15%,55%)] mb-8">One-tap ZK shielding via Halo2 zk-SNARKs</p>

      {/* Toggle diagram */}
      <div className="flex items-center justify-center gap-2 md:gap-4 mb-8 flex-wrap">
        {["TX Created", "→", "Toggle 🔒", "→", "ZK Shielded", "→", "Receipt ✓"].map((step, i) => (
          <div key={i} className={cn(
            i % 2 === 1 ? "text-[hsl(215,50%,70%)] font-black text-xl" :
            "bg-[hsl(220,15%,8%)] border border-[hsl(220,15%,18%)] rounded-lg px-4 py-3 text-center",
          )}>
            {i % 2 === 0 ? (
              <span className="text-xs font-bold text-[hsl(220,20%,85%)] whitespace-nowrap">{step}</span>
            ) : step}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-5 text-center">
          <div className="text-2xl font-black text-[hsl(150,60%,55%)]">&lt;$0.01</div>
          <div className="text-xs text-[hsl(220,15%,55%)] mt-1">Transaction fees</div>
        </div>
        <div className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-5 text-center">
          <div className="text-2xl font-black text-[hsl(150,60%,55%)]">&lt;5s</div>
          <div className="text-xs text-[hsl(220,15%,55%)] mt-1">Finality</div>
        </div>
        <div className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-5 text-center">
          <div className="text-2xl font-black text-[hsl(150,60%,55%)]">Auto</div>
          <div className="text-xs text-[hsl(220,15%,55%)] mt-1">Compliance receipts</div>
        </div>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-[hsl(0,60%,15%/0.3)] border border-[hsl(0,60%,30%/0.3)] rounded-lg p-3">
          <div className="text-xs font-bold text-[hsl(0,70%,60%)]">Monero</div>
          <div className="text-[10px] text-[hsl(220,15%,55%)] mt-1">Always private → Delisted</div>
        </div>
        <div className="bg-[hsl(215,50%,70%/0.1)] border border-[hsl(215,50%,70%/0.3)] rounded-lg p-3">
          <div className="text-xs font-bold text-[hsl(215,50%,80%)]">Arxon ✓</div>
          <div className="text-[10px] text-[hsl(220,15%,55%)] mt-1">Toggle privacy → Compliant</div>
        </div>
        <div className="bg-[hsl(30,60%,15%/0.3)] border border-[hsl(30,60%,30%/0.3)] rounded-lg p-3">
          <div className="text-xs font-bold text-[hsl(30,70%,60%)]">Ethereum</div>
          <div className="text-[10px] text-[hsl(220,15%,55%)] mt-1">Always public → Exposed</div>
        </div>
      </div>
    </div>
  </SlideWrapper>
);

/* ── SLIDE 5: Architecture ── */
const Slide5Architecture = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
    <div className="relative z-10 w-full max-w-5xl px-6 md:px-12">
      <SlideBadge>How It Works</SlideBadge>
      <h2 className="text-3xl md:text-4xl font-black text-[hsl(220,20%,95%)] mb-8">
        Built for Privacy at <span className="text-[hsl(215,50%,70%)]">Scale</span>
      </h2>

      {/* Architecture flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
        {[
          { layer: "Consensus Layer", tech: "BABE + GRANDPA", desc: "Fast block production + provable finality", color: "from-[hsl(280,50%,50%)] to-[hsl(260,50%,40%)]" },
          { layer: "ZK Proof Engine", tech: "Halo2 zk-SNARKs", desc: "Toggleable proofs – no trusted setup", color: "from-[hsl(215,50%,60%)] to-[hsl(220,40%,50%)]" },
          { layer: "Transaction Layer", tech: "Shielded ⇄ Transparent", desc: "Private details hidden | Fully auditable", color: "from-[hsl(180,50%,45%)] to-[hsl(200,50%,40%)]" },
          { layer: "Application Layer", tech: "dApps & Contracts", desc: "ZK-Voting · Remittances · EVM-compatible", color: "from-[hsl(150,50%,45%)] to-[hsl(170,50%,35%)]" },
        ].map((item, i) => (
          <div key={i} className="relative">
            <div className={cn("bg-gradient-to-br rounded-xl p-5 h-full border border-white/5", item.color)}>
              <div className="text-[10px] uppercase tracking-wider text-white/60 font-bold mb-2">{item.layer}</div>
              <div className="text-sm font-black text-white mb-2">{item.tech}</div>
              <div className="text-[11px] text-white/70 leading-snug">{item.desc}</div>
            </div>
            {i < 3 && <div className="hidden md:block absolute top-1/2 -right-2 text-[hsl(215,50%,70%)] font-black text-lg z-20">→</div>}
          </div>
        ))}
      </div>

      <div className="space-y-1 text-xs text-[hsl(220,15%,55%)]">
        <p>• Sovereign Rust L1 — leveraging proven modular primitives</p>
        <p>• Performance ambition: <span className="text-[hsl(220,20%,85%)] font-bold">5,000–20,000+ TPS</span> (transparent mode, testnet parallel execution)</p>
        <p>• Long-term target: <span className="text-[hsl(220,20%,85%)] font-bold">100,000+ TPS</span> via intra-block parallelism & future upgrades</p>
      </div>
      <p className="text-[9px] text-[hsl(220,15%,35%)] mt-4 text-right italic">
        Production performance depends on hardware, network, tx complexity & privacy ratio — public testnet benchmarks coming
      </p>
    </div>
  </SlideWrapper>
);

/* ── SLIDE 6: Product ── */
const Slide6Product = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
    <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
      <SlideBadge>Product</SlideBadge>
      <h2 className="text-3xl md:text-4xl font-black text-[hsl(220,20%,95%)] mb-3">
        Live Mining, Real Users, <span className="text-[hsl(150,60%,55%)]">Growing Daily</span>
      </h2>
      <p className="text-sm text-[hsl(220,15%,55%)] mb-8">Browser/mobile mining — no hardware needed, accessible worldwide</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat value="10,000+" label="Active Miners" />
        <Stat value="249" label="Daily Signups" sub="& growing" />
        <Stat value="5,594" label="Weekly Active" />
        <Stat value="1,700+" label="Discord Members" />
      </div>

      {/* Growth chart visualization */}
      <div className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-6">
        <div className="text-xs text-[hsl(220,15%,55%)] mb-4 font-bold uppercase tracking-wider">Week-over-Week Growth</div>
        <div className="flex items-end gap-1 h-32">
          {[8, 14, 22, 28, 35, 42, 55, 68, 78, 85, 92, 100].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-[hsl(215,50%,50%)] to-[hsl(215,50%,70%)] min-h-[4px] transition-all"
                style={{ height: `${h}%` }}
              />
              <span className="text-[8px] text-[hsl(220,15%,40%)]">W{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </SlideWrapper>
);

/* ── SLIDE 7: Traction ── */
const Slide7Traction = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
    <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
      <SlideBadge>Traction</SlideBadge>
      <h2 className="text-3xl md:text-4xl font-black text-[hsl(220,20%,95%)] mb-3">
        From 0 to 10K in <span className="text-[hsl(215,50%,70%)]">40 Days</span>
      </h2>
      <p className="text-sm text-[hsl(220,15%,55%)] mb-8">Organic, pre-marketing, pre-funding traction</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Geographic distribution */}
        <div className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-5">
          <div className="text-xs font-bold text-[hsl(220,15%,55%)] uppercase tracking-wider mb-4">Top Mining Countries</div>
          {[
            { country: "🇮🇳 India", pct: 28 },
            { country: "🇮🇩 Indonesia", pct: 18 },
            { country: "🇳🇬 Nigeria", pct: 16 },
            { country: "🇧🇩 Bangladesh", pct: 12 },
            { country: "🇨🇳 China", pct: 8 },
            { country: "🇵🇰 Pakistan", pct: 6 },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 mb-2">
              <span className="text-xs text-[hsl(220,20%,85%)] w-28 font-medium">{item.country}</span>
              <div className="flex-1 bg-[hsl(220,15%,12%)] rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[hsl(215,50%,60%)] to-[hsl(215,50%,70%)] rounded-full" style={{ width: `${item.pct}%` }} />
              </div>
              <span className="text-[10px] text-[hsl(220,15%,55%)] w-8 text-right">{item.pct}%</span>
            </div>
          ))}
        </div>

        {/* Community */}
        <div className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-5">
          <div className="text-xs font-bold text-[hsl(220,15%,55%)] uppercase tracking-wider mb-4">Community Growth</div>
          <div className="space-y-4">
            {[
              { platform: "Discord", members: "1,700+", growth: "+340%", icon: "💬" },
              { platform: "Twitter/X", members: "2,500+", growth: "+180%", icon: "𝕏" },
              { platform: "Telegram", members: "900+", growth: "+220%", icon: "✈️" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <div className="text-sm text-[hsl(220,20%,85%)] font-bold">{item.platform}</div>
                    <div className="text-xs text-[hsl(220,15%,55%)]">{item.members} members</div>
                  </div>
                </div>
                <span className="text-xs text-[hsl(150,60%,55%)] font-bold">{item.growth}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[hsl(150,60%,55%/0.1)] to-transparent border-l-2 border-[hsl(150,60%,55%)] p-3 rounded-r-xl">
        <p className="text-xs text-[hsl(220,20%,85%)] font-bold italic">
          "This is organic, pre-marketing, pre-funding traction"
        </p>
      </div>
    </div>
  </SlideWrapper>
);

/* ── SLIDE 8: Market Opportunity ── */
const Slide8Market = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
    <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
      <SlideBadge>Market Opportunity</SlideBadge>
      <h2 className="text-2xl md:text-4xl font-black text-[hsl(220,20%,95%)] mb-10">
        <span className="text-[hsl(215,50%,70%)]">$905B</span> → $150B → <span className="text-[hsl(150,60%,55%)]">$15B</span>
      </h2>

      {/* Funnel */}
      <div className="flex flex-col items-center gap-3 mb-10">
        {[
          { label: "TAM", value: "$905B", desc: "Global remittances (World Bank/Visa 2024–2025)", width: "100%" },
          { label: "SAM", value: "$150B", desc: "Crypto-enabled cross-border payments", width: "65%" },
          { label: "SOM", value: "$15B", desc: "10% of crypto remittance market", width: "35%" },
        ].map((item, i) => (
          <div key={i} className="w-full flex flex-col items-center">
            <div
              className="bg-gradient-to-r from-[hsl(215,50%,50%/0.2)] to-[hsl(215,50%,70%/0.1)] border border-[hsl(215,50%,70%/0.2)] rounded-xl p-4 flex items-center justify-between transition-all"
              style={{ width: item.width, minWidth: "280px" }}
            >
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[hsl(215,50%,70%)] font-bold">{item.label}</span>
                <p className="text-xs text-[hsl(220,15%,55%)] mt-0.5">{item.desc}</p>
              </div>
              <span className="text-xl md:text-2xl font-black text-[hsl(215,50%,80%)]">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[hsl(220,15%,6%)] border border-[hsl(215,50%,70%/0.2)] rounded-xl p-4 text-center">
        <p className="text-xs text-[hsl(220,15%,55%)]">Phase 2 Opportunity</p>
        <p className="text-lg font-black text-[hsl(215,50%,80%)]">$10B+ Election Integrity Market <span className="text-[hsl(220,15%,55%)] font-normal text-xs">(2027+)</span></p>
      </div>
    </div>
  </SlideWrapper>
);

/* ── SLIDE 9: Competitive Landscape ── */
const Slide9Competition = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
    <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
      <SlideBadge>Competitive Landscape</SlideBadge>
      <h2 className="text-3xl md:text-4xl font-black text-[hsl(220,20%,95%)] mb-8">
        Privacy Chains: Well-Funded,<br /><span className="text-[hsl(215,50%,70%)]">Differently Focused</span>
      </h2>

      {/* 2x2 Matrix */}
      <div className="relative bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-8 mb-6" style={{ minHeight: "320px" }}>
        {/* Axes */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] uppercase tracking-wider text-[hsl(220,15%,40%)] font-bold whitespace-nowrap">Developer Infrastructure ← → End-User Payments</div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-wider text-[hsl(220,15%,40%)] font-bold">Mandatory Privacy ← → Optional Privacy</div>
        
        {/* Grid lines */}
        <div className="absolute left-1/2 top-8 bottom-8 w-px bg-[hsl(220,15%,18%)]" />
        <div className="absolute top-1/2 left-12 right-4 h-px bg-[hsl(220,15%,18%)]" />

        {/* Competitors */}
        <div className="absolute top-12 left-16 bg-[hsl(220,15%,12%)] rounded-lg px-3 py-1.5 text-xs text-[hsl(220,15%,55%)] border border-[hsl(220,15%,20%)]">Zcash</div>
        <div className="absolute top-20 left-14 bg-[hsl(220,15%,12%)] rounded-lg px-3 py-1.5 text-xs text-[hsl(220,15%,55%)] border border-[hsl(220,15%,20%)]">Monero ⚠️</div>
        <div className="absolute top-16 right-16 bg-[hsl(220,15%,12%)] rounded-lg px-3 py-1.5 text-xs text-[hsl(220,15%,55%)] border border-[hsl(220,15%,20%)]">Aleo</div>
        <div className="absolute top-24 right-24 bg-[hsl(220,15%,12%)] rounded-lg px-3 py-1.5 text-xs text-[hsl(220,15%,55%)] border border-[hsl(220,15%,20%)]">Nillion</div>
        <div className="absolute top-28 left-[45%] bg-[hsl(220,15%,12%)] rounded-lg px-3 py-1.5 text-xs text-[hsl(220,15%,55%)] border border-[hsl(220,15%,20%)]">Aztec (L2)</div>

        {/* Arxon - highlighted */}
        <div className="absolute bottom-16 right-12 bg-gradient-to-br from-[hsl(215,50%,60%)] to-[hsl(220,40%,50%)] rounded-lg px-4 py-2 text-sm font-black text-white shadow-[0_0_20px_hsl(215,50%,60%/0.4)]">
          ARXON ✦
        </div>
      </div>

      <div className="bg-gradient-to-r from-[hsl(215,50%,70%/0.1)] to-transparent border-l-2 border-[hsl(215,50%,70%)] p-3 rounded-r-xl">
        <p className="text-xs text-[hsl(220,20%,85%)] font-bold italic">
          "Our wedge: We're the only privacy L1 built for end-user payments with mobile-first distribution"
        </p>
      </div>
    </div>
  </SlideWrapper>
);

/* ── SLIDE 10: GTM Strategy ── */
const Slide10GTM = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
    <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
      <SlideBadge>Go-to-Market</SlideBadge>
      <h2 className="text-3xl md:text-4xl font-black text-[hsl(220,20%,95%)] mb-8">
        Mine → Use → <span className="text-[hsl(215,50%,70%)]">Govern</span>
      </h2>

      <div className="space-y-3">
        {[
          { phase: "Phase 1", time: "NOW", title: "Mobile Mining for User Acquisition", desc: "10K+ miners from India, Indonesia, Nigeria, Bangladesh, China — world's leading remittance recipients", status: "active" },
          { phase: "Phase 2", time: "Post-Raise", title: "Private Remittance Corridors", desc: "India (top global), Indonesia & Philippines (SEA), Nigeria & Kenya (SSA), Bangladesh", status: "next" },
          { phase: "Phase 3", time: "2027", title: "ZK-Voting dApp Pilots", desc: "Municipal/regional government pilots for coercion-resistant voting", status: "planned" },
          { phase: "Phase 4", time: "2028", title: "Ecosystem Expansion", desc: "ARX-20 tokens, DeFi primitives, NFTs, governance tools", status: "planned" },
        ].map((item, i) => (
          <div key={i} className={cn(
            "flex gap-4 rounded-xl p-4 border transition-all",
            item.status === "active"
              ? "bg-[hsl(215,50%,70%/0.08)] border-[hsl(215,50%,70%/0.3)]"
              : "bg-[hsl(220,15%,6%)] border-[hsl(220,15%,14%)]"
          )}>
            <div className="flex-shrink-0 text-center w-16">
              <div className="text-[10px] uppercase tracking-wider text-[hsl(215,50%,70%)] font-bold">{item.phase}</div>
              <div className="text-xs text-[hsl(220,15%,55%)] mt-0.5">{item.time}</div>
              {item.status === "active" && <span className="inline-block w-2 h-2 rounded-full bg-[hsl(150,60%,55%)] mt-1 animate-pulse" />}
            </div>
            <div>
              <div className="text-sm font-bold text-[hsl(220,20%,90%)]">{item.title}</div>
              <div className="text-xs text-[hsl(220,15%,55%)] mt-1">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </SlideWrapper>
);

/* ── SLIDE 11: Tokenomics ── */
const Slide11Tokenomics = () => {
  const allocations = [
    { label: "Treasury / Ecosystem", pct: 30, color: "hsl(215,50%,60%)" },
    { label: "Community Mining", pct: 25, color: "hsl(150,60%,50%)" },
    { label: "Pre-seed Investors", pct: 20, color: "hsl(280,50%,55%)" },
    { label: "Team (4yr vest)", pct: 15, color: "hsl(30,70%,55%)" },
    { label: "Post-TGE Staking", pct: 10, color: "hsl(180,50%,50%)" },
  ];
  return (
    <SlideWrapper>
      <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
      <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
        <SlideBadge>Tokenomics</SlideBadge>
        <h2 className="text-3xl md:text-4xl font-black text-[hsl(220,20%,95%)] mb-2">
          $ARX: Designed for <span className="text-[hsl(215,50%,70%)]">Long-Term Value</span>
        </h2>
        <p className="text-sm text-[hsl(220,15%,55%)] mb-8">Total Supply: 1,000,000,000 $ARX · TGE Circulating: 250,000,000</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Allocation bars */}
          <div className="space-y-3">
            {allocations.map((a, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[hsl(220,20%,85%)] font-medium">{a.label}</span>
                  <span className="text-[hsl(220,15%,55%)] font-bold">{a.pct}%</span>
                </div>
                <div className="w-full bg-[hsl(220,15%,12%)] rounded-full h-3 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${a.pct}%`, backgroundColor: a.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Utility */}
          <div className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-5">
            <div className="text-xs font-bold text-[hsl(220,15%,55%)] uppercase tracking-wider mb-3">Token Utility</div>
            <div className="space-y-2">
              {["⛽ Gas fees", "🔒 Staking for security", "🗳 Governance voting", "🛡 Privacy proof generation", "⛏ Mining reward claims"].map((u, i) => (
                <div key={i} className="text-xs text-[hsl(220,20%,85%)] font-medium">{u}</div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[hsl(220,15%,18%)]">
              <p className="text-[10px] text-[hsl(150,60%,55%)] font-bold italic">"No insider-dominated allocation" — contrast with Nillion's 80%</p>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};

/* ── SLIDE 12: Team ── */
const Slide12Team = () => {
  const team = [
    { name: "Gabe Ademibo", role: "Founder & CEO", desc: "6+ years blockchain/Web3 · Built systems for Doginal Dogs · Driving Arxon's toggle privacy vision", x: "@GabeXmeta", initials: "GA" },
    { name: "Aisar Gatrif", role: "Marketing & Growth Lead", desc: "Founder @aisarlabs · Partner @rakebitcom & @qzino_official · 50K+ Web3 community reach", x: "@aisarcore", initials: "AG" },
    { name: "Victor Agama", role: "Community & Marketing Lead", desc: "Web3 Community Builder · Building Discord, onboarding, and viral mining traction", x: "@dibwuru", initials: "VA" },
    { name: "Zeoraex Ronish", role: "Blockchain App Developer", desc: "EVM dApp development · Smart contract interaction, wallet integration, testnet ops", x: "@Titaniconqueror", initials: "ZR" },
    { name: "Ojulowo Vincent", role: "Frontend/UI Engineer", desc: "Building mining dashboard, wallet UX, user interfaces", x: "", initials: "OV" },
  ];
  return (
    <SlideWrapper>
      <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
      <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
        <SlideBadge>Team</SlideBadge>
        <h2 className="text-3xl md:text-4xl font-black text-[hsl(220,20%,95%)] mb-8">
          Built by <span className="text-[hsl(215,50%,70%)]">Builders</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {team.map((m, i) => (
            <div key={i} className={cn(
              "bg-[hsl(220,15%,6%)] border rounded-xl p-4",
              i === 0 ? "border-[hsl(215,50%,70%/0.3)] md:col-span-2 lg:col-span-1" : "border-[hsl(220,15%,14%)]"
            )}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(220,40%,60%)] to-[hsl(215,50%,70%)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{m.initials}</div>
                <div>
                  <div className="text-sm font-bold text-[hsl(220,20%,90%)]">{m.name}</div>
                  <div className="text-[10px] text-[hsl(215,50%,70%)] font-bold uppercase tracking-wider">{m.role}</div>
                </div>
              </div>
              <p className="text-[11px] text-[hsl(220,15%,55%)] leading-relaxed">{m.desc}</p>
              {m.x && <p className="text-[10px] text-[hsl(215,50%,70%)] mt-2 font-medium">𝕏 {m.x}</p>}
            </div>
          ))}
        </div>
        <div className="bg-[hsl(220,15%,6%)] border border-dashed border-[hsl(220,15%,20%)] rounded-xl p-3 text-center">
          <p className="text-xs text-[hsl(220,15%,55%)]">
            <span className="font-bold text-[hsl(220,20%,85%)]">Scaling Post-Raise:</span> Priority hires — CTO/Lead Rust Engineer + backend/DevOps
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
};

/* ── SLIDE 13: Roadmap ── */
const Slide13Roadmap = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
    <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
      <SlideBadge>Roadmap</SlideBadge>
      <h2 className="text-3xl md:text-4xl font-black text-[hsl(220,20%,95%)] mb-8">
        From Mining to <span className="text-[hsl(215,50%,70%)]">Mainnet</span>
      </h2>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-[hsl(215,50%,70%)] via-[hsl(215,50%,50%)] to-[hsl(220,15%,20%)]" />

        <div className="space-y-6 pl-12">
          {[
            { time: "Now – Mid 2026", title: "Bootstrapped Phase", items: ["Mining live & growing (10K+ → 50K+ target)", "Pre-seed raise execution", "Team expansion prep & early prototyping"], active: true },
            { time: "H2 2026", title: "Core Development & Testnet", items: ["Hire CTO/Lead Rust Engineer + DevOps", "Build & launch testnet (Substrate + Halo2)", "Security audits · EVM compatibility"], active: false },
            { time: "2027", title: "Mainnet Launch", items: ["Mainnet rollout (alpha → full decentralization)", "Private remittance corridors live", "ZK-voting dApp beta/testnet"], active: false },
            { time: "2028+", title: "Growth & Impact Scale", items: ["Target 1M+ users", "Multi-country ZK-voting", "ARX-20 tokens, DeFi, governance"], active: false },
          ].map((phase, i) => (
            <div key={i} className="relative">
              <div className={cn(
                "absolute -left-12 top-1 w-3 h-3 rounded-full border-2",
                phase.active
                  ? "bg-[hsl(215,50%,70%)] border-[hsl(215,50%,70%)] shadow-[0_0_10px_hsl(215,50%,70%/0.5)]"
                  : "bg-[hsl(220,15%,10%)] border-[hsl(220,15%,25%)]"
              )} />
              <div className="text-[10px] uppercase tracking-wider text-[hsl(215,50%,70%)] font-bold mb-1">{phase.time}</div>
              <div className="text-sm font-bold text-[hsl(220,20%,90%)] mb-2">{phase.title}</div>
              <ul className="space-y-1">
                {phase.items.map((item, j) => (
                  <li key={j} className="text-xs text-[hsl(220,15%,55%)] flex items-start gap-2">
                    <span className="text-[hsl(215,50%,70%)] mt-0.5">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  </SlideWrapper>
);

/* ── SLIDE 14: The Ask ── */
const Slide14Ask = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,15%,4%)] via-[hsl(215,30%,8%)] to-[hsl(220,15%,4%)]" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(215,50%,60%/0.05)] blur-[80px]" />
    <div className="relative z-10 w-full max-w-4xl px-8 md:px-12 text-center">
      <SlideBadge>The Ask</SlideBadge>
      <h2 className="text-4xl md:text-6xl font-black text-[hsl(220,20%,95%)] mb-3">
        <span className="text-[hsl(215,50%,70%)]">$10M</span> Pre-Seed
      </h2>
      <p className="text-lg text-[hsl(220,15%,55%)] mb-10 font-medium">
        $40–60M FDV · SAFE + Token Warrant
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {[
          { pct: "50%", label: "Engineering", desc: "8→15 engineers, ZK, audit", color: "hsl(215,50%,60%)" },
          { pct: "25%", label: "Growth", desc: "Mining, Africa/SEA entry", color: "hsl(150,60%,50%)" },
          { pct: "15%", label: "Operations", desc: "Legal, compliance, infra", color: "hsl(280,50%,55%)" },
          { pct: "10%", label: "Reserve", desc: "24-month runway buffer", color: "hsl(30,70%,55%)" },
        ].map((item, i) => (
          <div key={i} className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-4">
            <div className="text-2xl font-black mb-1" style={{ color: item.color }}>{item.pct}</div>
            <div className="text-xs font-bold text-[hsl(220,20%,85%)]">{item.label}</div>
            <div className="text-[10px] text-[hsl(220,15%,45%)] mt-1">{item.desc}</div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-[hsl(215,50%,70%/0.1)] to-[hsl(215,50%,70%/0.05)] border border-[hsl(215,50%,70%/0.2)] rounded-xl p-5">
        <p className="text-sm text-[hsl(220,20%,90%)] font-bold italic">
          "This raise gets us to mainnet + 100K users — the milestones that unlock Series A"
        </p>
      </div>
    </div>
  </SlideWrapper>
);

/* ── SLIDE 15: Appendix Cover ── */
const Slide15Appendix = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
    <div className="relative z-10 w-full max-w-3xl px-8 md:px-12 text-center">
      <SlideBadge>Appendix</SlideBadge>
      <h2 className="text-3xl md:text-4xl font-black text-[hsl(220,20%,95%)] mb-3">
        Supporting Materials &<br /><span className="text-[hsl(215,50%,70%)]">Due Diligence</span>
      </h2>
      <p className="text-sm text-[hsl(220,15%,55%)] mb-10">For follow-up reference only — not presented in the main pitch unless requested.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {[
          "Detailed $ARX Tokenomics",
          "Litepaper & Full Document",
          "Mining Economics & Rewards",
          "Regulatory by Market",
          "3-Year Projections",
          "Cap Table (Pre & Post)",
        ].map((item, i) => (
          <div key={i} className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-lg p-3 text-xs text-[hsl(220,20%,85%)] font-medium text-center">
            {item}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[hsl(220,15%,40%)]">
        Arxon Confidential · February 2026 · Gabe @GabeXmeta
      </p>
    </div>
  </SlideWrapper>
);

/* ── APPENDIX A: Tokenomics Detail ── */
const SlideAppendixA = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
    <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
      <SlideBadge>Appendix A</SlideBadge>
      <h2 className="text-2xl md:text-3xl font-black text-[hsl(220,20%,95%)] mb-6">
        $ARX Token — <span className="text-[hsl(215,50%,70%)]">Full Economics</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-4">
          <div className="text-xs font-bold text-[hsl(220,15%,55%)] uppercase tracking-wider mb-3">Allocation Breakdown</div>
          {[
            { label: "Community & Miners", amount: "250M", pct: "25%", color: "hsl(150,60%,50%)" },
            { label: "Treasury / Ecosystem", amount: "300M", pct: "30%", color: "hsl(215,50%,60%)" },
            { label: "Pre-seed Investors", amount: "200M", pct: "20%", color: "hsl(280,50%,55%)" },
            { label: "Team & Contributors", amount: "150M", pct: "15%", color: "hsl(30,70%,55%)" },
            { label: "Post-TGE Staking", amount: "100M", pct: "10%", color: "hsl(180,50%,50%)" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
              <span className="text-xs text-[hsl(220,20%,85%)] flex-1">{a.label}</span>
              <span className="text-xs text-[hsl(220,15%,55%)]">{a.amount}</span>
              <span className="text-xs font-bold text-[hsl(215,50%,70%)] w-8 text-right">{a.pct}</span>
            </div>
          ))}
        </div>
        <div className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-4">
          <div className="text-xs font-bold text-[hsl(220,15%,55%)] uppercase tracking-wider mb-3">Vesting & Emission</div>
          <div className="space-y-2 text-xs text-[hsl(220,15%,55%)]">
            <p>• Mining rewards: ~4–5 years tapering (~50% in first 18mo)</p>
            <p>• Investor tokens: 12-month lock-up, then 24–36mo linear vest</p>
            <p>• Team: 4-year vesting, 1-year cliff</p>
          </div>
          <div className="mt-4 pt-3 border-t border-[hsl(220,15%,18%)]">
            <div className="text-xs font-bold text-[hsl(220,15%,55%)] uppercase tracking-wider mb-2">Deflationary Mechanisms</div>
            <p className="text-xs text-[hsl(220,15%,55%)]">Network fees partially burned → net-zero or mild deflation as usage grows</p>
          </div>
        </div>
      </div>
      <p className="text-[9px] text-[hsl(220,15%,35%)] italic">Note: Final parameters subject to community governance input and legal review.</p>
    </div>
  </SlideWrapper>
);

/* ── APPENDIX B: Mining Economics ── */
const SlideAppendixB = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
    <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
      <SlideBadge>Appendix B</SlideBadge>
      <h2 className="text-2xl md:text-3xl font-black text-[hsl(220,20%,95%)] mb-6">
        Mining Economics <span className="text-[hsl(215,50%,70%)]">Breakdown</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-4">
          <div className="text-xs font-bold text-[hsl(215,50%,70%)] mb-2">Current System</div>
          <p className="text-xs text-[hsl(220,15%,55%)]">Browser/mobile mining → ARX-P points. No hardware needed, accessible worldwide.</p>
        </div>
        <div className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-4">
          <div className="text-xs font-bold text-[hsl(215,50%,70%)] mb-2">Conversion to $ARX</div>
          <p className="text-xs text-[hsl(220,15%,55%)]">Post-mainnet: fair ratio (total points ÷ 250M $ARX). Anti-sybil + optional KYC for large claims.</p>
        </div>
        <div className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-4">
          <div className="text-xs font-bold text-[hsl(215,50%,70%)] mb-2">Claim & Vesting</div>
          <p className="text-xs text-[hsl(220,15%,55%)]">40% immediate claimable · 60% vested over 24 months (linear monthly). Staking accelerates unlock.</p>
        </div>
      </div>

      {/* Emission curve */}
      <div className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-5 mb-4">
        <div className="text-xs font-bold text-[hsl(220,15%,55%)] uppercase tracking-wider mb-3">Emission Taper (~48 months)</div>
        <div className="flex items-end gap-0.5 h-24">
          {[100,92,85,78,72,65,58,52,46,40,35,30,26,22,18,15,12,10,8,7,6,5,4,4].map((h, i) => (
            <div key={i} className="flex-1 bg-gradient-to-t from-[hsl(215,50%,50%)] to-[hsl(215,50%,70%)] rounded-t min-h-[2px]" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between text-[8px] text-[hsl(220,15%,40%)] mt-1">
          <span>Month 1</span><span>Month 12</span><span>Month 24</span><span>Month 48</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat value="8–18%" label="Expected Early Yield" sub="Annualized for active miners" />
        <Stat value="25%" label="Total Supply Cap" sub="No further minting post-emission" />
      </div>
    </div>
  </SlideWrapper>
);

/* ── APPENDIX C: Regulatory ── */
const SlideAppendixC = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
    <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
      <SlideBadge>Appendix C</SlideBadge>
      <h2 className="text-2xl md:text-3xl font-black text-[hsl(220,20%,95%)] mb-6">
        Regulatory <span className="text-[hsl(215,50%,70%)]">Snapshot</span>
      </h2>
      <p className="text-xs text-[hsl(220,15%,55%)] mb-6">Optional privacy (toggle) reduces regulatory friction vs. mandatory privacy coins. Transparent mode supports audits/KYC.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {[
          { flag: "🇮🇳", country: "India", remit: "~$138B", note: "30% crypto tax, growing adoption. Toggle fits PMLA/AML." },
          { flag: "🇳🇬", country: "Nigeria", remit: "~$21B", note: "CBN restrictions easing 2025–2026. Privacy for diaspora." },
          { flag: "🇮🇩", country: "Indonesia", remit: "SEA Leader", note: "OJK/BI oversight. Optional shielded mode aligns with fintech rules." },
          { flag: "🇧🇩", country: "Bangladesh", remit: "High % GDP", note: "Emerging crypto interest. Privacy helps unbanked users." },
        ].map((item, i) => (
          <div key={i} className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-4 flex gap-3">
            <span className="text-2xl flex-shrink-0">{item.flag}</span>
            <div>
              <div className="text-sm font-bold text-[hsl(220,20%,85%)]">{item.country} <span className="text-[hsl(215,50%,70%)] text-xs font-normal">{item.remit} remittances</span></div>
              <p className="text-xs text-[hsl(220,15%,55%)] mt-1">{item.note}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-[hsl(220,15%,45%)] space-y-1">
        <p>• Utility token design (fees, governance, staking). No ICO-style promises.</p>
        <p>• Legal opinion planned pre-TGE. Optional KYC for high-value operations.</p>
        <p>• Monitoring FATF and local regulatory updates.</p>
      </div>
    </div>
  </SlideWrapper>
);

/* ── APPENDIX D: Projections ── */
const SlideAppendixD = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
    <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
      <SlideBadge>Appendix D</SlideBadge>
      <h2 className="text-2xl md:text-3xl font-black text-[hsl(220,20%,95%)] mb-6">
        3-Year <span className="text-[hsl(215,50%,70%)]">Projections</span>
      </h2>
      <p className="text-xs text-[hsl(220,15%,55%)] mb-6">Conservative estimates · $10M raise · Mainnet H2 2026–2027</p>

      <div className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl overflow-hidden mb-6">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[hsl(220,15%,18%)]">
              <th className="p-3 text-left text-[hsl(220,15%,55%)] font-bold uppercase tracking-wider text-[10px]">Metric</th>
              <th className="p-3 text-center text-[hsl(220,15%,55%)] font-bold uppercase tracking-wider text-[10px]">Year 1 (2026–27)</th>
              <th className="p-3 text-center text-[hsl(220,15%,55%)] font-bold uppercase tracking-wider text-[10px]">Year 2 (2027–28)</th>
              <th className="p-3 text-center text-[hsl(220,15%,55%)] font-bold uppercase tracking-wider text-[10px]">Year 3 (2028–29)</th>
            </tr>
          </thead>
          <tbody className="text-[hsl(220,20%,85%)]">
            <tr className="border-b border-[hsl(220,15%,14%)]">
              <td className="p-3 font-medium">Revenue</td>
              <td className="p-3 text-center text-[hsl(220,15%,55%)]">Near-zero</td>
              <td className="p-3 text-center">$0.5–4M</td>
              <td className="p-3 text-center text-[hsl(150,60%,55%)] font-bold">$8–25M+</td>
            </tr>
            <tr className="border-b border-[hsl(220,15%,14%)]">
              <td className="p-3 font-medium">Expenses</td>
              <td className="p-3 text-center">~$5–7M</td>
              <td className="p-3 text-center">$7–10M</td>
              <td className="p-3 text-center">Scaling</td>
            </tr>
            <tr className="border-b border-[hsl(220,15%,14%)]">
              <td className="p-3 font-medium">Users</td>
              <td className="p-3 text-center">50K+</td>
              <td className="p-3 text-center">250K+</td>
              <td className="p-3 text-center text-[hsl(215,50%,70%)] font-bold">500K–1M+</td>
            </tr>
            <tr>
              <td className="p-3 font-medium">Status</td>
              <td className="p-3 text-center text-[hsl(30,70%,55%)]">Testnet → Mainnet</td>
              <td className="p-3 text-center text-[hsl(215,50%,70%)]">Remittances live</td>
              <td className="p-3 text-center text-[hsl(150,60%,55%)]">Path to profitability</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[9px] text-[hsl(220,15%,35%)] italic">Projections are directional and conservative — actuals depend on adoption and market conditions.</p>
    </div>
  </SlideWrapper>
);

/* ── APPENDIX E: Cap Table ── */
const SlideAppendixE = () => (
  <SlideWrapper>
    <div className="absolute inset-0 bg-[hsl(220,15%,4%)]" />
    <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
      <SlideBadge>Appendix E</SlideBadge>
      <h2 className="text-2xl md:text-3xl font-black text-[hsl(220,20%,95%)] mb-8">
        Cap Table <span className="text-[hsl(215,50%,70%)]">Summary</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pre-Raise */}
        <div className="bg-[hsl(220,15%,6%)] border border-[hsl(220,15%,14%)] rounded-xl p-5">
          <div className="text-xs font-bold text-[hsl(220,15%,55%)] uppercase tracking-wider mb-4">Pre-Raise</div>
          <div className="space-y-3">
            {[
              { label: "Founder & Early Contributors", pct: "85–90%", color: "hsl(215,50%,60%)" },
              { label: "Future Team / Option Pool", pct: "10–15%", color: "hsl(280,50%,55%)" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[hsl(220,20%,85%)]">{item.label}</span>
                  <span className="font-bold" style={{ color: item.color }}>{item.pct}</span>
                </div>
                <div className="w-full bg-[hsl(220,15%,12%)] rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: item.pct.split("–")[0] + "%", backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Post-Raise */}
        <div className="bg-[hsl(220,15%,6%)] border border-[hsl(215,50%,70%/0.2)] rounded-xl p-5">
          <div className="text-xs font-bold text-[hsl(215,50%,70%)] uppercase tracking-wider mb-4">Post-$10M Raise ($40–60M FDV)</div>
          <div className="space-y-3">
            {[
              { label: "Founder & Contributors", pct: "60–70%", color: "hsl(215,50%,60%)" },
              { label: "Pre-seed Investors", pct: "17–25%", color: "hsl(150,60%,50%)" },
              { label: "Option Pool", pct: "10–15%", color: "hsl(280,50%,55%)" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[hsl(220,20%,85%)]">{item.label}</span>
                  <span className="font-bold" style={{ color: item.color }}>{item.pct}</span>
                </div>
                <div className="w-full bg-[hsl(220,15%,12%)] rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: item.pct.split("–")[0] + "%", backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[9px] text-[hsl(220,15%,35%)] mt-4 italic text-center">
        Note: Exact percentages depend on final valuation and terms. Via SAFE + Token Warrant.
      </p>
    </div>
  </SlideWrapper>
);


/* ── ALL SLIDES ── */
const ALL_SLIDES = [
  { component: Slide1Cover, title: "Cover" },
  { component: Slide2Problem, title: "The Problem" },
  { component: Slide3Timing, title: "Market Timing" },
  { component: Slide4Solution, title: "The Solution" },
  { component: Slide5Architecture, title: "Architecture" },
  { component: Slide6Product, title: "Product" },
  { component: Slide7Traction, title: "Traction" },
  { component: Slide8Market, title: "Market Opportunity" },
  { component: Slide9Competition, title: "Competition" },
  { component: Slide10GTM, title: "Go-to-Market" },
  { component: Slide11Tokenomics, title: "Tokenomics" },
  { component: Slide12Team, title: "Team" },
  { component: Slide13Roadmap, title: "Roadmap" },
  { component: Slide14Ask, title: "The Ask" },
  { component: Slide15Appendix, title: "Appendix" },
  { component: SlideAppendixA, title: "App. A: Tokenomics" },
  { component: SlideAppendixB, title: "App. B: Mining" },
  { component: SlideAppendixC, title: "App. C: Regulatory" },
  { component: SlideAppendixD, title: "App. D: Projections" },
  { component: SlideAppendixE, title: "App. E: Cap Table" },
];

/* ── MAIN COMPONENT ── */
const AdminPitchDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const next = useCallback(() => setCurrentSlide(s => Math.min(s + 1, ALL_SLIDES.length - 1)), []);
  const prev = useCallback(() => setCurrentSlide(s => Math.max(s - 1, 0)), []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "g") setShowGrid(v => !v);
      if (e.key === "Escape") { setShowGrid(false); setIsFullscreen(false); }
      if (e.key === "f") {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
      }
    };
    window.addEventListener("keydown", handleKey);
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => { window.removeEventListener("keydown", handleKey); document.removeEventListener("fullscreenchange", handleFs); };
  }, [next, prev]);

  const CurrentSlideComponent = ALL_SLIDES[currentSlide].component;

  if (showGrid) {
    return (
      <div className="min-h-screen bg-[hsl(220,15%,4%)] p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-black text-[hsl(220,20%,95%)]">Arxon Pitch Deck</h1>
          <button onClick={() => setShowGrid(false)} className="text-xs text-[hsl(215,50%,70%)] hover:text-[hsl(215,50%,85%)] font-bold uppercase tracking-wider">
            ← Back to Presentation
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {ALL_SLIDES.map((slide, i) => {
            const SlideComp = slide.component;
            return (
              <button
                key={i}
                onClick={() => { setCurrentSlide(i); setShowGrid(false); }}
                className={cn(
                  "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.03]",
                  i === currentSlide ? "border-[hsl(215,50%,70%)] shadow-[0_0_15px_hsl(215,50%,70%/0.3)]" : "border-[hsl(220,15%,18%)] hover:border-[hsl(220,15%,30%)]"
                )}
              >
                <div className="w-[1920px] h-[1080px] origin-top-left" style={{ transform: "scale(0.12)" }}>
                  <SlideComp />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <span className="text-[10px] text-white/80 font-bold">{i + 1}. {slide.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col bg-[hsl(220,15%,2%)]",
      isFullscreen ? "fixed inset-0 z-[100]" : "min-h-[calc(100vh-3rem)] rounded-xl overflow-hidden"
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[hsl(220,15%,4%)] border-b border-[hsl(220,15%,12%)] z-20">
        <div className="flex items-center gap-3">
          <img src={arxonLogo} alt="Arxon" className="w-6 h-6 rounded object-cover" />
          <span className="text-xs font-bold text-[hsl(220,20%,95%)] tracking-wider hidden md:inline">ARXON PITCH DECK</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowGrid(true)} className="p-2 rounded-lg hover:bg-[hsl(220,15%,12%)] transition-colors text-[hsl(220,15%,55%)] hover:text-[hsl(220,20%,85%)]">
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
              else document.exitFullscreen?.();
            }}
            className="p-2 rounded-lg hover:bg-[hsl(220,15%,12%)] transition-colors text-[hsl(220,15%,55%)] hover:text-[hsl(220,20%,85%)]"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Slide area */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <CurrentSlideComponent />
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {currentSlide > 0 && (
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[hsl(220,15%,8%/0.8)] border border-[hsl(220,15%,20%)] flex items-center justify-center text-[hsl(220,15%,55%)] hover:text-[hsl(220,20%,85%)] hover:bg-[hsl(220,15%,12%)] transition-all z-10 backdrop-blur-sm">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {currentSlide < ALL_SLIDES.length - 1 && (
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[hsl(220,15%,8%/0.8)] border border-[hsl(220,15%,20%)] flex items-center justify-center text-[hsl(220,15%,55%)] hover:text-[hsl(220,20%,85%)] hover:bg-[hsl(220,15%,12%)] transition-all z-10 backdrop-blur-sm">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[hsl(220,15%,4%)] border-t border-[hsl(220,15%,12%)]">
        <span className="text-[10px] text-[hsl(220,15%,40%)] font-bold">
          {currentSlide + 1} / {ALL_SLIDES.length}
        </span>
        {/* Dot navigation */}
        <div className="flex items-center gap-1">
          {ALL_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={cn(
                "transition-all rounded-full",
                i === currentSlide
                  ? "w-4 h-1.5 bg-[hsl(215,50%,70%)]"
                  : i < 15
                    ? "w-1.5 h-1.5 bg-[hsl(220,15%,25%)] hover:bg-[hsl(220,15%,40%)]"
                    : "w-1.5 h-1.5 bg-[hsl(220,15%,18%)] hover:bg-[hsl(220,15%,30%)]"
              )}
            />
          ))}
        </div>
        <span className="text-[10px] text-[hsl(220,15%,35%)]">{ALL_SLIDES[currentSlide].title}</span>
      </div>
    </div>
  );
};

export default AdminPitchDeck;
