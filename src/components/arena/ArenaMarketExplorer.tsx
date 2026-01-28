import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Clock, CheckCircle, Search, TrendingUp, Sparkles, Trophy, Zap, Target } from 'lucide-react';
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

  const filters: { id: MarketFilter; label: string; icon: React.ElementType; count: number; color: string }[] = [
    { id: 'live', label: 'Live', icon: Flame, count: liveMarkets.length, color: 'text-green-400' },
    { id: 'upcoming', label: 'Upcoming', icon: Clock, count: upcomingMarkets.length, color: 'text-blue-400' },
    { id: 'ended', label: 'Ended', icon: CheckCircle, count: endedMarkets.length, color: 'text-muted-foreground' },
  ];

  const categories = [
    { id: 'sports', label: 'Sports', icon: '⚽' },
    { id: 'politics', label: 'Politics', icon: '🏛️' },
    { id: 'crypto', label: 'Crypto', icon: '₿' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { id: 'other', label: 'Other', icon: '📊' },
  ];

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

    if (searchQuery) {
      markets = markets.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.side_a_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.side_b_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter) {
      markets = markets.filter(m => m.category === categoryFilter);
    }

    return markets;
  };

  const filteredMarkets = getFilteredMarkets();
  const totalStaked = liveMarkets.reduce((sum, m) => sum + m.side_a_power + m.side_b_power, 0);
  const totalPrizePool = liveMarkets.reduce((sum, m) => sum + (m.prize_pool || 0), 0);

  return (
    <div className="px-4 py-5 space-y-4 md:px-6 md:py-8 md:space-y-6">
      {/* Premium Stats Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/30 p-4"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-black text-foreground">{liveMarkets.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Live Markets</p>
          </div>
          <div className="text-center border-x border-border/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-black text-foreground">
              {totalStaked >= 1000000 
                ? `${(totalStaked / 1000000).toFixed(1)}M` 
                : totalStaked >= 1000 
                  ? `${(totalStaked / 1000).toFixed(0)}K`
                  : totalStaked}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Staked</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400">
              {totalPrizePool >= 1000000 
                ? `${(totalPrizePool / 1000000).toFixed(1)}M` 
                : totalPrizePool >= 1000 
                  ? `${(totalPrizePool / 1000).toFixed(0)}K`
                  : totalPrizePool || '0'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Prize Pool</p>
          </div>
        </div>
      </motion.div>

      {/* Search Bar - Premium */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 rounded-xl blur-xl opacity-50 pointer-events-none" />
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 text-sm bg-card/80 backdrop-blur-sm border-2 border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Filter Tabs - Premium Pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        {filters.map((filter) => (
          <motion.button
            key={filter.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${
              activeFilter === filter.id
                ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30'
                : 'bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30'
            }`}
          >
            <filter.icon className={`w-4 h-4 ${activeFilter === filter.id ? 'text-primary-foreground' : filter.color}`} />
            {filter.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-md ${
              activeFilter === filter.id
                ? 'bg-primary-foreground/20'
                : 'bg-muted/50'
            }`}>
              {filter.count}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Category Pills - Enhanced */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            categoryFilter === null
              ? 'bg-primary/20 text-primary border-2 border-primary/40'
              : 'bg-card/50 text-muted-foreground border border-border/30 hover:text-foreground hover:border-border/50'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id === categoryFilter ? null : cat.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              categoryFilter === cat.id
                ? 'bg-primary/20 text-primary border-2 border-primary/40'
                : 'bg-card/50 text-muted-foreground border border-border/30 hover:text-foreground hover:border-border/50'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Markets List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-48 rounded-2xl bg-gradient-to-br from-secondary/30 to-secondary/10 animate-pulse border border-border/20" 
                />
              ))}
            </div>
          ) : filteredMarkets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <p className="text-lg font-bold text-muted-foreground mb-1">
                {searchQuery || categoryFilter ? 'No matches found' : `No ${activeFilter} markets`}
              </p>
              <p className="text-sm text-muted-foreground/60">
                {searchQuery || categoryFilter ? 'Try adjusting your filters' : 'Check back soon for new markets'}
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
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <MarketCard
                  market={market}
                  userPosition={userPositions.get(market.id)}
                  onClick={() => onSelectMarket(market)}
                  variant={index === 0 && activeFilter === 'live' ? 'featured' : 'default'}
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
