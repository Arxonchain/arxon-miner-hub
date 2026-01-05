import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, History, Send, Zap } from 'lucide-react';
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
    loading 
  } = useNexus();
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  const handleTransferSuccess = (transactionId: string) => {
    setPendingTransactionId(transactionId);
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
      <div className="space-y-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <ArrowLeftRight className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Arxon Nexus
              </h1>
              <p className="text-muted-foreground">
                Transfer ARX-P to other miners and earn rewards
              </p>
            </div>
          </div>
        </motion.div>

        {/* Active boosts indicator */}
        {activeBoosts.length > 0 && (
          <NexusBoostIndicator boosts={activeBoosts} />
        )}

        {/* Main content */}
        <Tabs defaultValue="send" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-card/50">
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send ARX-P
            </TabsTrigger>
            <TabsTrigger value="explorer" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Explorer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left column - Address card */}
              <NexusAddressCard 
                address={nexusAddress} 
                balance={points?.total_points || 0} 
              />

              {/* Right column - Send form */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    Send ARX-P
                  </CardTitle>
                  <CardDescription>
                    Transfer points to another miner. Earn +5 ARX-P and 20% mining boost!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NexusSendForm onSuccess={handleTransferSuccess} />
                </CardContent>
              </Card>
            </div>

            {/* Rewards info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid gap-4 sm:grid-cols-3"
            >
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-green-400" />
                  <span className="font-semibold text-green-400">+5 ARX-P Bonus</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Earn bonus points on every successful transfer
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">+20% Mining Boost</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  24-hour mining rate boost after each transfer
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowLeftRight className="h-5 w-5 text-accent" />
                  <span className="font-semibold text-accent">5 Daily Transfers</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maximum 5 transfers per day to earn rewards
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
      />
    </DashboardLayout>
  );
};

export default Nexus;
