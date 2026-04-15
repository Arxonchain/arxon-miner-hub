import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clock, ExternalLink, Gift, Target, Star, Zap, Sparkles, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { usePoints } from '@/hooks/usePoints';
import { useCheckin } from '@/hooks/useCheckin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import ResendBackground from '@/components/effects/ResendBackground';
import ScrollReveal from '@/components/effects/ScrollReveal';
import GlowCard from '@/components/effects/GlowCard';
import AuthDialog from '@/components/auth/AuthDialog';

interface Task {
  id: string;
  title: string;
  description: string | null;
  points_reward: number;
  external_url: string | null;
  task_type: string;
  is_active: boolean;
}

interface UserTask {
  id: string;
  task_id: string;
  status: string;
  points_awarded: number;
  completed_at: string | null;
}

const Tasks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshPoints, triggerConfetti, addPoints } = usePoints();
  const { canCheckin, loading: checkinLoading, performCheckin, currentStreak, streakBoost } = useCheckin();
  
  const [showAuth, setShowAuth] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<Map<string, UserTask>>(new Map());
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  // ... (your existing useEffects for fetching tasks and userTasks remain unchanged)

  const completeTask = async (task: Task) => {
    // ... (your existing completeTask function - unchanged)
  };

  const getTaskIcon = (type: string) => {
    // ... (unchanged)
  };

  // === Existing YouTube Tasks ===

  // Subscribe Task
  const YOUTUBE_TASK_KEY = `arxon_yt_task_done_${user?.id}`;
  const isYoutubeDone = (() => { try { return localStorage.getItem(YOUTUBE_TASK_KEY) === 'true'; } catch { return false; } })();
  const [youtubeDone, setYoutubeDone] = useState(isYoutubeDone);
  const [completingYoutube, setCompletingYoutube] = useState(false);

  const completeYoutubeTask = async () => {
    if (!user) { setShowAuth(true); return; }
    if (youtubeDone) return;
    setCompletingYoutube(true);
    window.open('https://www.youtube.com/channel/UCrBWjlEw_17pQ0OgJgc0Gcw?sub_confirmation=1', '_blank');
    try {
      const credited = await addPoints(1000, 'task');
      if (!credited.success) throw new Error(credited.error || 'Failed to credit points');
      try { localStorage.setItem(YOUTUBE_TASK_KEY, 'true'); } catch {}
      setYoutubeDone(true);
      triggerConfetti();
      toast({ title: 'Task Completed! 🎉', description: 'You earned 1,000 ARX-P for subscribing!' });
      await refreshPoints();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCompletingYoutube(false);
    }
  };

  // === New Video Task (as requested) ===
  const NEW_VIDEO_TASK_KEY = `arxon_new_video_task_done_${user?.id}`;
  const isNewVideoDone = (() => { try { return localStorage.getItem(NEW_VIDEO_TASK_KEY) === 'true'; } catch { return false; } })();
  const [newVideoDone, setNewVideoDone] = useState(isNewVideoDone);
  const [completingNewVideo, setCompletingNewVideo] = useState(false);

  const completeNewVideoTask = async () => {
    if (!user) { setShowAuth(true); return; }
    if (newVideoDone) return;

    setCompletingNewVideo(true);
    window.open('https://youtu.be/dDfkFXB5pmE', '_blank');

    try {
      const credited = await addPoints(1000, 'task');
      if (!credited.success) throw new Error(credited.error || 'Failed to credit points');

      try { localStorage.setItem(NEW_VIDEO_TASK_KEY, 'true'); } catch {}
      setNewVideoDone(true);
      triggerConfetti();
      toast({ 
        title: 'Task Completed! 🎉', 
        description: 'You earned 1,000 ARX-P for watching the video!' 
      });
      await refreshPoints();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCompletingNewVideo(false);
    }
  };

  // ... (keep your existing VIDEO_TASK and VIDEO2_TASK if you still want them)

  const completedCount = Array.from(userTasks.values()).filter(ut => ut.status === 'completed').length;
  const totalRewards = Array.from(userTasks.values()).reduce((sum, ut) => sum + (ut.points_awarded || 0), 0);
  const availableRewards = tasks.reduce((sum, t) => sum + t.points_reward, 0) + 4000; // +1000 for new task

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ResendBackground variant="subtle" />
      
      {/* Header - unchanged */}

      <main className="relative z-10 px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Hero & Stats - unchanged */}

        {/* Daily Check-in - unchanged */}

        {/* Task List */}
        <ScrollReveal delay={0.15}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Available Tasks</h2>
            </div>

            {/* YouTube Subscribe Task - unchanged */}

            {/* Existing Video Tasks - unchanged (or you can remove old ones if desired) */}

            {/* === NEW VIDEO TASK CARD === */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`p-4 rounded-xl border backdrop-blur-sm transition-all ${
                newVideoDone
                  ? 'bg-green-500/5 border-green-500/30'
                  : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl mt-0.5">🎬</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground truncate">Watch New Arxon Video</h3>
                    {newVideoDone && (
                      <motion.span
                        className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <CheckCircle className="w-3 h-3" />
                        Done
                      </motion.span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Watch this important Arxon video and earn rewards
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-accent flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      +1,000 ARX-P
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      YouTube
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={completeNewVideoTask}
                  disabled={newVideoDone || completingNewVideo}
                  className={newVideoDone
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                    : 'bg-red-600 text-white hover:bg-red-700'
                  }
                >
                  {completingNewVideo ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Clock className="w-4 h-4" />
                    </motion.div>
                  ) : newVideoDone ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    'Watch Video'
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Existing dynamic tasks from database */}
            {loading ? (
              // loading skeleton...
            ) : (
              <AnimatePresence>
                {tasks.map((task, index) => { /* ... your existing map */ })}
              </AnimatePresence>
            )}
          </div>
        </ScrollReveal>

        {/* Info section - unchanged */}
      </main>

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default Tasks;
