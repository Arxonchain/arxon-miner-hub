import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { isFeatureEnabled } from '@/lib/liteMode';

const Nexus = () => {
  const navigate = useNavigate();
  
  // Check if Nexus is enabled
  if (!isFeatureEnabled('NEXUS_ENABLED')) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <Card className="glass-card max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                <ArrowLeftRight className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">Nexus Coming Soon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We're optimizing the Nexus transfer system for better performance. 
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
      </DashboardLayout>
    );
  }

  // If enabled, render the full Nexus page
  // Import dynamically to avoid loading heavy components when disabled
  return (
    <DashboardLayout>
      <NexusFullContent />
    </DashboardLayout>
  );
};

// Lazy-loaded full content (only loads when feature is enabled)
const NexusFullContent = () => {
  // This component would contain the full Nexus functionality
  // For now, redirect to dashboard since feature is disabled
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="text-muted-foreground">Nexus is currently under maintenance.</p>
    </div>
  );
};

export default Nexus;
