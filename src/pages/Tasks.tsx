import { useState } from "react";
import { 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Users,
  Gift,
  Zap
} from "lucide-react";
import XIcon from "@/components/icons/XIcon";
import { useTasks, Task } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/auth/AuthDialog";

const Tasks = () => {
  const { user } = useAuth();
  const { tasks, loading, claimTask, getTaskStatus } = useTasks();
  const [showAuth, setShowAuth] = useState(false);

  const handleClaimTask = async (task: Task) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    // Check if already completed
    const status = getTaskStatus(task.id);
    if (status === 'completed' || status === 'pending') {
      return;
    }

    // Open external URL if available
    if (task.external_url) {
      window.open(task.external_url, '_blank');
    }
    
    // Directly claim the task (no screenshot required)
    await claimTask(task.id);
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'social':
        return <XIcon className="h-5 w-5 text-foreground" />;
      case 'referral':
        return <Users className="h-5 w-5 text-green-400" />;
      default:
        return <Gift className="h-5 w-5 text-purple-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-green-400 text-[10px] sm:text-xs">
            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-yellow-400 text-[10px] sm:text-xs">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-destructive text-[10px] sm:text-xs">
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Tasks</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Complete tasks to earn bonus ARX-P points</p>
      </div>

      {/* Task List */}
      <div className="space-y-2 sm:space-y-3">
        {loading ? (
          <div className="glass-card p-6 sm:p-8 text-center">
            <div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="glass-card p-6 sm:p-8 text-center text-muted-foreground text-sm">
            No tasks available right now. Check back later!
          </div>
        ) : (
          tasks.map((task) => {
            const status = getTaskStatus(task.id);
            const isCompleted = status === 'completed';
            const isPending = status === 'pending';

            return (
              <div 
                key={task.id} 
                className={`glass-card p-3 sm:p-4 md:p-5 transition-all ${
                  isCompleted ? 'opacity-60' : 'hover:bg-secondary/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-secondary shrink-0">
                      {getTaskIcon(task.task_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base text-foreground">{task.title}</h3>
                      {task.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 sm:mt-2">
                        <span className="flex items-center gap-1 text-accent text-xs sm:text-sm font-medium">
                          <Zap className="h-3 w-3" />
                          +{task.points_reward} ARX-P
                        </span>
                        {getStatusBadge(status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    {task.external_url && !isCompleted && (
                      <a
                        href={task.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 sm:p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      </a>
                    )}
                    <Button
                      onClick={() => handleClaimTask(task)}
                      disabled={isCompleted || isPending}
                      className={`text-xs sm:text-sm ${isCompleted || isPending ? 'btn-claimed' : 'btn-claim'}`}
                      size="sm"
                    >
                      {isCompleted ? 'Claimed' : isPending ? 'Pending' : 'Claim'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default Tasks;
