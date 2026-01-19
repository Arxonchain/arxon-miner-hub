import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Clock, CheckCircle, Search, Filter, TrendingUp, Sparkles } from 'lucide-react';
import MarketCard from './MarketCard';
import type { ArenaMarket, MarketVote } from '@/hooks/useArenaMarkets';

type MarketFilter = 'live' | 'upcoming' | 'ended';

interface ArenaMarketExplorerProps {
  liveMarkets: ArenaMarket[];
  upcomingMarkets: ArenaMarket[];
  endedMarkets: ArenaMarket[];
  userPositions: Map<string, MarketVote>;
  onSelectMarket: (market: ArenaMarket) => void;
  loading?: boolean;
}

const ArenaMarketExplorer = ({
  liveMarkets,
  upcomingMarkets,
  endedMarkets,
  userPositions,
  onSelectMarket,
  loading = false,
}: ArenaMarketExplorerProps) => {
  const [activeFilter, setActiveFilter] = useState<MarketFilter>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filters: { id: MarketFilter; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'live', label: 'Live', icon: Flame, count: liveMarkets.length },
    { id: 'upcoming', label: 'Upcoming', icon: Clock, count: upcomingMarkets.length },
    { id: 'ended', label: 'Ended', icon: CheckCircle, count: endedMarkets.length },
  ];

  const categories = ['sports', 'politics', 'crypto', 'entertainment', 'other'];

  const getFilteredMarkets = () => {
    let markets: ArenaMarket[] = [];
    
    switch (activeFilter) {
      case 'live':
        markets = liveMarkets;
        break;
      case 'upcoming':
        markets = upcomingMarkets;
        break;
      case 'ended':
        markets = endedMarkets;
        break;
    }

    // Apply search filter
    if (searchQuery) {
      markets = markets.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.side_a_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.side_b_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter) {
      markets = markets.filter(m => m.category === categoryFilter);
    }

    return markets;
  };

  const filteredMarkets = getFilteredMarkets();

  // Featured market (first live market with prize pool)
  const featuredMarket = liveMarkets.find(m => m.prize_pool > 0) || liveMarkets[0];

  return (
    <div className="px-3 py-4 space-y-3 md:px-4 md:py-6 md:space-y-5">
      {/* Compact Stats Row - Mobile optimized */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 whitespace-nowrap">
          <Flame className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-primary">{liveMarkets.length} Live</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/30 whitespace-nowrap">
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">
            {liveMarkets.reduce((sum, m) => sum + m.side_a_power + m.side_b_power, 0) >= 1000 
              ? `${(liveMarkets.reduce((sum, m) => sum + m.side_a_power + m.side_b_power, 0) / 1000).toFixed(0)}K` 
              : liveMarkets.reduce((sum, m) => sum + m.side_a_power + m.side_b_power, 0).toLocaleString()} Staked
          </span>
        </div>
        {(() => {
          const totalPrizePool = liveMarkets.reduce((sum, m) => sum + (m.prize_pool || 0), 0);
          return totalPrizePool > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">
                {totalPrizePool >= 1000000 
                  ? `${(totalPrizePool / 1000000).toFixed(1)}M` 
                  : `${(totalPrizePool / 1000).toFixed(0)}K`} Prizes
              </span>
            </div>
          );
        })()}
      </div>

      {/* Search - Compact */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search markets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 text-sm bg-secondary/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Filter Tabs - Compact pills */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-all ${
              activeFilter === filter.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <filter.icon className="w-3.5 h-3.5" />
            {filter.label}
            <span className={`text-[10px] px-1 py-0.5 rounded ${
              activeFilter === filter.id
                ? 'bg-primary-foreground/20'
                : 'bg-muted/50'
            }`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Category Pills - Compact */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
            categoryFilter === null
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-secondary/30 text-muted-foreground hover:text-foreground'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium capitalize whitespace-nowrap transition-all ${
              categoryFilter === cat
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-secondary/30 text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Markets List - Compact spacing */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-secondary/20 animate-pulse" />
              ))}
            </div>
          ) : filteredMarkets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-10 text-center"
            >
              <TrendingUp className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {searchQuery || categoryFilter ? 'No matches' : `No ${activeFilter} markets`}
              </p>
            </motion.div>
          ) : (
            filteredMarkets.map((market, index) => (
              <motion.div
                key={market.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <MarketCard
                  market={market}
                  userPosition={userPositions.get(market.id)}
                  onClick={() => onSelectMarket(market)}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ArenaMarketExplorer;
