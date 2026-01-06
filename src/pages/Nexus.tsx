import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, History, Send, Zap, Gift, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/layout/DashboardLayout';
import NexusAddressCard from '@/components/nexus/NexusAddressCard';
import NexusSendForm from '@/components/nexus/NexusSendForm';
import NexusRewardModal from '@/components/nexus/NexusRewardModal';
import NexusBoostIndicator from '@/components/nexus/NexusBoostIndicator';
import TransactionExplorer from '@/components/nexus/TransactionExplorer';
import { useNexus } from '@/hooks/useNexus';
import { usePoints } from '@/hooks/usePoints';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Nexus = () => {
  const { user } = useAuth();
  const { points } = usePoints();
  const { 
    nexusAddress, 
    activeBoosts, 
    pendingReward, 
    claimReward,
    loading,
    lastTransactionAmount
  } = useNexus();
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [sentAmount, setSentAmount] = useState<number>(0);

  const handleTransferSuccess = (transactionId: string, amount: number) => {
    setPendingTransactionId(transactionId);
    setSentAmount(amount);
    setShowRewardModal(true);
  };

  const handleClaimReward = async () => {
    if (!pendingTransactionId) return;
    
    setClaiming(true);
    const success = await claimReward(pendingTransactionId);
    setClaiming(false);
    
    if (success) {
      setShowRewardModal(false);
      setPendingTransactionId(null);
      setSentAmount(0);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Sign in Required</CardTitle>
              <CardDescription>
                Please sign in to access the Arxon Nexus
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 pb-6">
        {/* Header - Compact on mobile */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Arxon Nexus
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Transfer ARX-P & earn rewards
              </p>
            </div>
          </div>
        </motion.div>

        {/* Active boosts indicator */}
        {activeBoosts.length > 0 && (
          <NexusBoostIndicator boosts={activeBoosts} />
        )}

        {/* Main content */}
        <Tabs defaultValue="send" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-card border border-border/50">
            <TabsTrigger 
              value="send" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground transition-all"
            >
              <Send className="h-4 w-4" />
              <span className="font-medium">Send ARX-P</span>
            </TabsTrigger>
            <TabsTrigger 
              value="explorer" 
              className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground transition-all"
            >
              <History className="h-4 w-4" />
              <span className="font-medium">Explorer</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Left column - Address card */}
              <NexusAddressCard 
                address={nexusAddress} 
                balance={points?.total_points || 0} 
              />

              {/* Right column - Send form */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Send className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Send ARX-P
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Transfer to a miner once — get matching bonus + 20% boost for 3 days!
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <NexusSendForm onSuccess={handleTransferSuccess} />
                </CardContent>
              </Card>
            </div>

            {/* Rewards info - Compact cards on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3"
            >
              <div className="p-3 sm:p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                  <span className="font-semibold text-green-400 text-sm sm:text-base">Matching Bonus</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Send 10, get 10 back. Send 100, get 100 back!
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="font-semibold text-primary text-sm sm:text-base">+20% Mining Boost</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  3-day mining boost — stack up to 300%!
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-accent/10 border border-accent/30">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  <span className="font-semibold text-accent text-sm sm:text-base">One-Time Transfer</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Each pair can only transact once — find new miners!
                </p>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="explorer">
            <TransactionExplorer />
          </TabsContent>
        </Tabs>
      </div>

      {/* Reward claim modal */}
      <NexusRewardModal
        open={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        onClaim={handleClaimReward}
        claiming={claiming}
        bonusAmount={sentAmount}
      />
    </DashboardLayout>
  );
};

export default Nexus;