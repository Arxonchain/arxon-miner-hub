import { useState } from "react";
import { Wallet, Link2, Unlink, Check, ExternalLink, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/auth/AuthDialog";

const WalletPage = () => {
  const { user } = useAuth();
  const { 
    wallets, 
    primaryWallet, 
    loading, 
    connecting, 
    connectPolkadotWallet, 
    disconnectWallet,
    setPrimaryWallet,
    hasPolkadotExtension
  } = useWallet();
  const [showAuth, setShowAuth] = useState(false);

  const handleConnect = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    connectPolkadotWallet();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Connect Wallet</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Link your Polkadot wallet for the future $ARX airdrop
        </p>
      </div>

      {/* Info Banner */}
      <div className="glass-card p-3 sm:p-4 md:p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20 shrink-0">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm sm:text-base text-foreground">Why Connect Your Wallet?</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Your ARX-P points will convert to $ARX tokens when the Arxon blockchain launches. 
              Connect your Polkadot wallet now to receive your airdrop directly.
            </p>
          </div>
        </div>
      </div>

      {/* Connect Button */}
      {!hasPolkadotExtension ? (
        <div className="glass-card p-4 sm:p-6 text-center">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <h3 className="font-medium text-sm sm:text-base text-foreground mb-2">Polkadot.js Extension Required</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            Install the Polkadot.js browser extension to connect your wallet
          </p>
          <Button
            onClick={() => window.open('https://polkadot.js.org/extension/', '_blank')}
            className="btn-mining text-xs sm:text-sm w-full sm:w-auto"
            size="sm"
          >
            <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Install Extension
          </Button>
        </div>
      ) : wallets.length === 0 ? (
        <div className="glass-card p-6 sm:p-8 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-sm sm:text-base text-foreground mb-2">No Wallet Connected</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            Connect your Polkadot wallet to secure your airdrop eligibility
          </p>
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="btn-mining text-xs sm:text-sm w-full sm:w-auto"
            size="sm"
          >
            {connecting ? (
              <>
                <div className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-1.5 sm:mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Connect Polkadot Wallet
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          {/* Connected Wallets */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground">Connected Wallets</h2>
              <Button
                onClick={handleConnect}
                disabled={connecting}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm w-full sm:w-auto"
              >
                <Link2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Add Wallet
              </Button>
            </div>

            {wallets.map((wallet) => (
              <div 
                key={wallet.id}
                className={`glass-card p-3 sm:p-4 md:p-5 ${
                  wallet.is_primary ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                      wallet.is_primary ? 'bg-primary/20' : 'bg-secondary'
                    }`}>
                      <Wallet className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        wallet.is_primary ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <p className="font-mono text-xs sm:text-sm text-foreground truncate">
                          {formatAddress(wallet.wallet_address)}
                        </p>
                        {wallet.is_primary && (
                          <span className="shrink-0 flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-primary/20 text-primary text-[10px] sm:text-xs rounded-full">
                            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground capitalize mt-0.5">
                        {wallet.wallet_type} • Connected {new Date(wallet.connected_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    {!wallet.is_primary && (
                      <Button
                        onClick={() => setPrimaryWallet(wallet.id)}
                        variant="ghost"
                        size="sm"
                        className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      onClick={() => disconnectWallet(wallet.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-7 sm:h-8 px-2 sm:px-3"
                    >
                      <Unlink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Airdrop Info */}
          <div className="glass-card p-3 sm:p-4 md:p-6">
            <h3 className="font-medium text-sm sm:text-base text-foreground mb-2 sm:mb-3">Airdrop Details</h3>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <p>• Your $ARX tokens will be sent to your primary wallet</p>
              <p>• Conversion rate will be announced before TGE</p>
              <p>• Keep mining to maximize your allocation</p>
              <p>• Multiple wallets can be connected but only primary receives airdrop</p>
            </div>
          </div>
        </>
      )}

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default WalletPage;
