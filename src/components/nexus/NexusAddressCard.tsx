import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface NexusAddressCardProps {
  address: string | null;
  balance: number;
}

const NexusAddressCard = ({ address, balance }: NexusAddressCardProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast({ title: "Address copied!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Your Nexus Address</h3>
            <p className="text-sm text-muted-foreground">Share to receive ARX-P</p>
          </div>
        </div>

        {/* Address display */}
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 rounded-lg bg-background/50 border border-border/50 font-mono text-sm overflow-x-auto">
            {address || 'Loading...'}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Balance */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <span className="text-sm text-muted-foreground">Available Balance</span>
          <span className="text-xl font-bold text-primary">
            {balance.toLocaleString()} ARX-P
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default NexusAddressCard;
