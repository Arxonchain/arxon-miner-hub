import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clock, ExternalLink, Gift, ListTodo, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
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
  const { points, refreshPoints, triggerConfetti } = usePoints();
  const [showAuth, setShowAuth] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<Map<string, UserTask>>(new Map());
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('is_active', true)
          .order('points_reward', { ascending: false });

        if (!error && data) {
          setTasks(data);
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Fetch user's completed tasks
  useEffect(() => {
    if (!user) return;

    const fetchUserTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('user_tasks')
          .select('*')
          .eq('user_id', user.id);

        if (!error && data) {
          const map = new Map<string, UserTask>();
          data.forEach((ut) => map.set(ut.task_id, ut));
          setUserTasks(map);
        }
      } catch (err) {
        console.error('Error fetching user tasks:', err);
      }
    };

    fetchUserTasks();
  }, [user]);

  // Complete a task
  const completeTask = async (task: Task) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    // Check if already completed
    const existing = userTasks.get(task.id);
    if (existing?.status === 'completed') {
      toast({ title: 'Already Completed', description: 'You\'ve already completed this task', variant: 'destructive' });
      return;
    }

    // Open external URL if available
    if (task.external_url) {
      window.open(task.external_url, '_blank');
    }

    setCompleting(task.id);
    try {
      // Create or update user_task record
      const { error } = await supabase
        .from('user_tasks')
        .upsert({
          user_id: user.id,
          task_id: task.id,
          status: 'completed',
          points_awarded: task.points_reward,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,task_id' });

      if (error) throw error;

      // Award points
      await supabase.functions.invoke('award-points', {
        body: { type: 'task', amount: task.points_reward },
      });

      // Update local state
      setUserTasks((prev) => {
        const next = new Map(prev);
        next.set(task.id, {
          id: task.id,
          task_id: task.id,
          status: 'completed',
          points_awarded: task.points_reward,
          completed_at: new Date().toISOString(),
        });
        return next;
      });

      triggerConfetti();
      toast({
        title: 'Task Completed! 🎉',
        description: `You earned ${task.points_reward} ARX-P!`,
      });

      await refreshPoints();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCompleting(null);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'social':
        return '📱';
      case 'daily':
        return '📅';
      case 'referral':
        return '👥';
      case 'special':
        return '⭐';
      default:
        return '📋';
    }
  };

  const completedCount = Array.from(userTasks.values()).filter(ut => ut.status === 'completed').length;
  const totalRewards = Array.from(userTasks.values()).reduce((sum, ut) => sum + (ut.points_awarded || 0), 0);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-foreground">Tasks</h1>
        <div className="w-10" />
      </header>

      <main className="relative z-10 px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 text-center border border-primary/20">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{completedCount}/{tasks.length}</p>
          </div>
          <div className="glass-card p-4 text-center border border-accent/20">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Earned</span>
            </div>
            <p className="text-2xl font-bold text-accent">{totalRewards} ARX-P</p>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            Available Tasks
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-secondary/20 animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No tasks available right now</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Check back later for new tasks!</p>
            </div>
          ) : (
            <AnimatePresence>
              {tasks.map((task, index) => {
                const userTask = userTasks.get(task.id);
                const isCompleted = userTask?.status === 'completed';
                const isCompletingThis = completing === task.id;

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`glass-card p-4 border transition-all ${
                      isCompleted 
                        ? 'border-green-500/30 bg-green-500/5' 
                        : 'border-border/40 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getTaskIcon(task.task_type)}</div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-foreground truncate">{task.title}</h3>
                          {isCompleted && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Done
                            </span>
                          )}
                        </div>
                        
                        {task.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                        )}
                        
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-primary flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            +{task.points_reward} ARX-P
                          </span>
                          {task.external_url && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              External
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => completeTask(task)}
                        disabled={isCompleted || isCompletingThis}
                        className={isCompleted 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-primary text-primary-foreground'
                        }
                      >
                        {isCompletingThis ? (
                          <Clock className="w-4 h-4 animate-spin" />
                        ) : isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          'Claim'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Info */}
        <div className="glass-card p-4 border border-primary/20">
          <p className="text-xs text-muted-foreground text-center">
            Complete tasks to earn ARX-P points. Some tasks require external actions. 
            Points are awarded immediately upon completion.
          </p>
        </div>
      </main>

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default Tasks;
