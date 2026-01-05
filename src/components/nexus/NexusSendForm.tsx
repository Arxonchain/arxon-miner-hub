import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, Eye, EyeOff, Lock, User, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNexus } from '@/hooks/useNexus';
import { usePoints } from '@/hooks/usePoints';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  user_id: string;
  username: string | null;
  nexus_address: string;
  avatar_url: string | null;
}

interface NexusSendFormProps {
  onSuccess: (transactionId: string) => void;
}

const NexusSendForm = ({ onSuccess }: NexusSendFormProps) => {
  const { searchUsers, sendTransfer, dailySendCount, sending, privacySettings } = useNexus();
  const { points } = usePoints();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<SearchResult | null>(null);
  const [amount, setAmount] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // Privacy toggles (per-transaction, initialized from saved settings)
  const [hideAmount, setHideAmount] = useState(privacySettings.hide_amount);
  const [hideUsernames, setHideUsernames] = useState(privacySettings.hide_usernames);
  const [privateMode, setPrivateMode] = useState(privacySettings.private_mode);

  // Update toggles when settings load
  useEffect(() => {
    setHideAmount(privacySettings.hide_amount);
    setHideUsernames(privacySettings.hide_usernames);
    setPrivateMode(privacySettings.private_mode);
  }, [privacySettings]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setSearching(true);
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
        setSearching(false);
        setShowSearch(true);
      } else {
        setSearchResults([]);
        setShowSearch(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectRecipient = (recipient: SearchResult) => {
    setSelectedRecipient(recipient);
    setSearchQuery('');
    setShowSearch(false);
    setSearchResults([]);
  };

  const handleSend = async () => {
    if (!selectedRecipient) {
      toast({ title: "Select a recipient", variant: "destructive" });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 10) {
      toast({ title: "Minimum amount is 10 ARX-P", variant: "destructive" });
      return;
    }

    if (points && amountNum > points.total_points) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }

    const result = await sendTransfer(
      selectedRecipient.nexus_address,
      amountNum,
      hideAmount,
      hideUsernames,
      privateMode
    );

    if (result.success && result.transactionId) {
      onSuccess(result.transactionId);
      setSelectedRecipient(null);
      setAmount('');
    } else {
      toast({ title: "Transfer failed", description: result.error, variant: "destructive" });
    }
  };

  const remainingSends = 5 - dailySendCount;

  return (
    <div className="space-y-6">
      {/* Daily limit indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Daily transfers remaining</span>
        <span className={`font-bold ${remainingSends === 0 ? 'text-destructive' : 'text-primary'}`}>
          {remainingSends}/5
        </span>
      </div>

      {/* Recipient search */}
      <div className="space-y-2">
        <Label>Recipient</Label>
        {selectedRecipient ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedRecipient.avatar_url || ''} />
              <AvatarFallback className="bg-primary/20">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{selectedRecipient.username || 'Anonymous'}</p>
              <p className="text-xs text-muted-foreground font-mono">{selectedRecipient.nexus_address}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRecipient(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              Change
            </Button>
          </motion.div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search username or ARX-P address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-border/50"
            />
            
            <AnimatePresence>
              {showSearch && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50"
                >
                  {searchResults.map((result) => (
                    <button
                      key={result.user_id}
                      onClick={() => handleSelectRecipient(result)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={result.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/20 text-xs">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium text-sm">{result.username || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{result.nexus_address}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Amount input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Amount</Label>
          <span className="text-xs text-muted-foreground">
            Balance: {points?.total_points.toLocaleString() || 0} ARX-P
          </span>
        </div>
        <div className="relative">
          <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            placeholder="Min 10 ARX-P"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={10}
            className="pl-10 bg-card/50 border-border/50"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            ARX-P
          </span>
        </div>
      </div>

      {/* Privacy toggles */}
      <div className="space-y-4 p-4 rounded-lg bg-card/30 border border-border/50">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          Transaction Privacy
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hideAmount ? <EyeOff className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              <Label htmlFor="hide-amount" className="text-sm cursor-pointer">Hide amount</Label>
            </div>
            <Switch
              id="hide-amount"
              checked={hideAmount}
              onCheckedChange={setHideAmount}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hideUsernames ? <EyeOff className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              <Label htmlFor="hide-usernames" className="text-sm cursor-pointer">Hide usernames</Label>
            </div>
            <Switch
              id="hide-usernames"
              checked={hideUsernames}
              onCheckedChange={setHideUsernames}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {privateMode ? <Lock className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
              <Label htmlFor="private-mode" className="text-sm cursor-pointer">Private mode (hidden from explorer)</Label>
            </div>
            <Switch
              id="private-mode"
              checked={privateMode}
              onCheckedChange={setPrivateMode}
            />
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          {privateMode 
            ? "This transaction will only be visible to you and the recipient"
            : "Transaction will appear in the public explorer"
          }
        </p>
      </div>

      {/* Send button */}
      <Button
        onClick={handleSend}
        disabled={!selectedRecipient || !amount || sending || remainingSends === 0}
        className="w-full h-12 text-lg font-bold relative overflow-hidden group"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary"
          animate={{
            x: sending ? ['0%', '100%'] : '0%',
          }}
          transition={{
            duration: 1,
            repeat: sending ? Infinity : 0,
            ease: 'linear',
          }}
          style={{ backgroundSize: '200% 100%' }}
        />
        <span className="relative flex items-center gap-2">
          <Send className={`h-5 w-5 ${sending ? 'animate-pulse' : ''}`} />
          {sending ? 'Sending...' : 'Send ARX-P'}
        </span>
      </Button>
    </div>
  );
};

export default NexusSendForm;
