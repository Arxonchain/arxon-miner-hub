import { useState } from "react";
import { Link2, Unlink, Check, Loader2, UserCheck, Clock } from "lucide-react";
import XIcon from "@/components/icons/XIcon";
import { useXProfile } from "@/hooks/useXProfile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuthDialog from "@/components/auth/AuthDialog";
import { isFeatureEnabled } from "@/lib/liteMode";
import { useNavigate } from "react-router-dom";

const XProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { 
    xProfile, 
    loading, 
    scanning,
    connectXProfile, 
    disconnectXProfile,
  } = useXProfile();

  const [showAuth, setShowAuth] = useState(false);
  const [xProfileInput, setXProfileInput] = useState('');

  // Check if X features are enabled
  if (!isFeatureEnabled('X_FEATURES_ENABLED')) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="glass-card max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <XIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">X Integration Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We're optimizing the X profile integration for better performance. 
              This feature will be available soon!
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-accent">
              <Clock className="h-4 w-4" />
              <span>Under maintenance</span>
            </div>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full bg-accent hover:bg-accent/90"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XIcon className="h-5 w-5" />
            X Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {xProfile ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">@{xProfile.username}</p>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
                <Check className="h-5 w-5 text-accent" />
              </div>
              
              <Button
                variant="outline"
                onClick={disconnectXProfile}
                className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your X profile to verify your identity.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="@username or profile URL"
                  value={xProfileInput}
                  onChange={(e) => setXProfileInput(e.target.value)}
                  disabled={scanning}
                />
                <Button
                  onClick={handleConnect}
                  disabled={!xProfileInput.trim() || scanning}
                  className="bg-accent hover:bg-accent/90"
                >
                  {scanning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default XProfilePage;
