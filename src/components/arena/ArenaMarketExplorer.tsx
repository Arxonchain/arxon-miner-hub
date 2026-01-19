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
    <div className="px-4 py-6 space-y-5">
      {/* Featured Market */}
      {activeFilter === 'live' && featuredMarket && !searchQuery && !categoryFilter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Featured Market</span>
            </div>
            <MarketCard
              market={featuredMarket}
              userPosition={userPositions.get(featuredMarket.id)}
              onClick={() => onSelectMarket(featuredMarket)}
              variant="featured"
            />
          </div>
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search markets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeFilter === filter.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <filter.icon className="w-4 h-4" />
            {filter.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeFilter === filter.id
                ? 'bg-primary-foreground/20'
                : 'bg-muted'
            }`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            categoryFilter === null
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-secondary/30 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Filter className="w-3 h-3" />
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${
              categoryFilter === cat
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-secondary/30 text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 text-center">
          <p className="text-lg font-bold text-foreground">{liveMarkets.length}</p>
          <p className="text-xs text-muted-foreground">Live Markets</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 text-center">
          <p className="text-lg font-bold text-primary">
            {liveMarkets.reduce((sum, m) => sum + m.side_a_power + m.side_b_power, 0).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">ARX-P Staked</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 text-center">
          <p className="text-lg font-bold text-green-500">
            {liveMarkets.reduce((sum, m) => sum + (m.total_participants || 0), 0)}
          </p>
          <p className="text-xs text-muted-foreground">Bettors</p>
        </div>
      </div>

      {/* Markets List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl bg-secondary/30 animate-pulse"
                />
              ))}
            </div>
          ) : filteredMarkets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {searchQuery || categoryFilter
                  ? 'No markets match your filters'
                  : `No ${activeFilter} markets right now`}
              </p>
            </motion.div>
          ) : (
            filteredMarkets.map((market, index) => (
              <motion.div
                key={market.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <MarketCard
                  market={market}
                  userPosition={userPositions.get(market.id)}
                  onClick={() => onSelectMarket(market)}
                  variant={activeFilter === 'live' && index === 0 && !featuredMarket ? 'featured' : 'default'}
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
