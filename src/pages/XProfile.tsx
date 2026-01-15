import { useState } from "react";
import { Link2, Unlink, Check, Loader2, UserCheck } from "lucide-react";
import XIcon from "@/components/icons/XIcon";
import { useXProfile } from "@/hooks/useXProfile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthDialog from "@/components/auth/AuthDialog";

const XProfilePage = () => {
  const { user } = useAuth();

  const { 
    xProfile, 
    loading, 
    scanning,
    connectXProfile, 
    disconnectXProfile,
  } = useXProfile();

  const [showAuth, setShowAuth] = useState(false);
  const [xProfileInput, setXProfileInput] = useState('');

  const handleConnect = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    const success = await connectXProfile(xProfileInput);
    if (success) {
      setXProfileInput('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Connect X Account</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Link your X profile to verify your identity
        </p>
      </div>

      {/* Info Banner */}
      <div className="glass-card p-3 sm:p-4 md:p-6 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/20 shrink-0">
            <XIcon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm sm:text-base text-foreground">Why Connect Your X Account?</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Connect your X account to verify your identity and participate in the ARXON community. 
              Your X profile picture will be used as your ARXON avatar.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="glass-card p-3 sm:p-4 md:p-6">
        <h3 className="font-medium text-sm sm:text-base text-foreground mb-2 sm:mb-3">Benefits of Connecting</h3>
        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-400 shrink-0" />
            Verify your identity in the ARXON community
          </p>
          <p className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-400 shrink-0" />
            Use your X profile picture as your avatar
          </p>
          <p className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-400 shrink-0" />
            Participate in Arena battles with verified status
          </p>
          <p className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-400 shrink-0" />
            Connect with other miners on X
          </p>
        </div>
      </div>

      {!xProfile ? (
        <div className="glass-card p-6 sm:p-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <XIcon className="h-6 w-6 sm:h-8 sm:w-8 text-foreground" />
          </div>
          <h3 className="font-medium text-sm sm:text-base text-foreground mb-2 text-center">Connect Your X Profile</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 text-center">
            Enter your X username or profile URL to link your account
          </p>
          <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <Input
              placeholder="@username or x.com/username"
              value={xProfileInput}
              onChange={(e) => setXProfileInput(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleConnect}
              disabled={scanning || !xProfileInput}
              className="btn-mining text-xs sm:text-sm w-full sm:w-auto"
              size="sm"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Connect
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Connected Profile */}
          <div className="glass-card p-3 sm:p-4 md:p-5 border-green-500/50 bg-green-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/20 shrink-0">
                  <XIcon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <p className="font-medium text-sm sm:text-base text-foreground">
                      @{xProfile.username}
                    </p>
                    <span className="shrink-0 flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] sm:text-xs rounded-full">
                      <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      Verified
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    Connected {xProfile.last_scanned_at ? new Date(xProfile.last_scanned_at).toLocaleDateString() : 'recently'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <Button
                  onClick={disconnectXProfile}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive h-7 sm:h-8 px-2 sm:px-3"
                >
                  <Unlink className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                  Disconnect
                </Button>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="glass-card p-4 sm:p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="font-medium text-lg text-foreground mb-2">Account Connected!</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Your X account is now linked to your ARXON profile. Your X profile picture has been set as your avatar.
            </p>
          </div>
        </>
      )}

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default XProfilePage;
