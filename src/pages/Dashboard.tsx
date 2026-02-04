import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Zap, TrendingUp, Clock, Trophy } from 'lucide-react';
import arxonLogo from '@/assets/arxon-logo.jpg';

interface MiningSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  arx_mined: number;
  is_active: boolean;
}

interface UserPoints {
  total_points: number;
  mining_points: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [mining, setMining] = useState(false);
  const [session, setSession] = useState<MiningSession | null>(null);
  const [points, setPoints] = useState<UserPoints>({ total_points: 0, mining_points: 0 });
  const [currentMined, setCurrentMined] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch user data
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      // Get active mining session
      const { data: sessions } = await supabase
        .from('mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(1);
      
      if (sessions && sessions.length > 0) {
        setSession(sessions[0]);
        setMining(true);
        setCurrentMined(sessions[0].arx_mined || 0);
      }
      
      // Get user points
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('total_points, mining_points')
        .eq('user_id', user.id)
        .single();
      
      if (pointsData) {
        setPoints(pointsData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Mining tick effect
  useEffect(() => {
    if (!mining || !session) return;

    const interval = setInterval(() => {
      const startTime = new Date(session.started_at).getTime();
      const elapsed = (Date.now() - startTime) / 1000 / 3600; // hours
      const pointsPerHour = 10;
      const mined = Math.min(elapsed * pointsPerHour, 480);
      setCurrentMined(mined);
    }, 1000);

    return () => clearInterval(interval);
  }, [mining, session]);

  const startMining = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('mining_sessions')
        .insert({
          user_id: user.id,
          started_at: new Date().toISOString(),
          is_active: true,
          arx_mined: 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setSession(data);
      setMining(true);
      setCurrentMined(0);
      toast({ title: 'Mining Started!', description: 'Earning ARX-P points...' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const stopMining = async () => {
    if (!user || !session) return;
    
    try {
      // Calculate final mined amount
      const startTime = new Date(session.started_at).getTime();
      const elapsed = (Date.now() - startTime) / 1000 / 3600;
      const finalMined = Math.min(Math.floor(elapsed * 10), 480);
      
      // End the session
      const { error } = await supabase
        .from('mining_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          arx_mined: finalMined,
        })
        .eq('id', session.id);
      
      if (error) throw error;
      
      // Update user points via RPC
      await supabase.rpc('increment_user_points', {
        p_user_id: user.id,
        p_amount: finalMined,
        p_type: 'mining',
      });
      
      setMining(false);
      setSession(null);
      setPoints(prev => ({
        ...prev,
        total_points: prev.total_points + finalMined,
        mining_points: prev.mining_points + finalMined,
      }));
      
      toast({ title: 'Mining Complete!', description: `You earned ${finalMined} ARX-P` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="glow-orb glow-orb-steel w-96 h-96 top-20 left-10 opacity-20 fixed" />
      <div className="glow-orb glow-orb-blue w-64 h-64 bottom-20 right-10 opacity-15 fixed" />
      
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={arxonLogo} alt="Arxon" className="h-10 w-10 rounded-lg" />
            <span className="text-xl font-bold">Arxon</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, Miner!</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">Total Points</span>
            </div>
            <p className="text-2xl font-bold">{Math.floor(points.total_points).toLocaleString()}</p>
          </div>
          
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Mining Points</span>
            </div>
            <p className="text-2xl font-bold">{Math.floor(points.mining_points).toLocaleString()}</p>
          </div>
          
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">Rate</span>
            </div>
            <p className="text-2xl font-bold">10/hr</p>
          </div>
        </div>
        
        {/* Mining Widget */}
        <div className="glass-card p-8">
          <div className="flex flex-col items-center">
            {/* Mining Circle */}
            <div className={`mining-circle w-48 h-48 mb-6 ${mining ? 'animate-pulse' : ''}`}>
              <Zap className={`h-12 w-12 mb-2 ${mining ? 'text-accent' : 'text-muted-foreground'}`} />
              <span className="text-3xl font-bold">{currentMined.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">ARX-P</span>
            </div>
            
            {/* Status */}
            <div className="mb-6">
              {mining ? (
                <div className="flex items-center gap-2 text-accent">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Mining in progress...</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Ready to mine</span>
              )}
            </div>
            
            {/* Action Button */}
            <Button
              onClick={mining ? stopMining : startMining}
              className={`btn-glow px-8 py-6 text-lg ${mining ? 'bg-destructive hover:bg-destructive/90' : 'btn-mining'}`}
            >
              {mining ? 'Stop Mining' : 'Start Mining'}
            </Button>
            
            {mining && (
              <p className="text-sm text-muted-foreground mt-4">
                Max session: 480 ARX-P (48 hours)
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
