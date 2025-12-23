import { useState } from "react";
import { 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Send,
  Twitter,
  Users,
  Gift,
  Zap
} from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useSocialSubmissions } from "@/hooks/useSocialSubmissions";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AuthDialog from "@/components/auth/AuthDialog";

const Tasks = () => {
  const { user } = useAuth();
  const { tasks, loading, claimTask, getTaskStatus } = useTasks();
  const { submitPost, submitting, submissions, SOCIAL_POST_POINTS } = useSocialSubmissions();
  const [showAuth, setShowAuth] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [postUrl, setPostUrl] = useState("");

  const handleClaimTask = async (taskId: string, externalUrl?: string | null) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    if (externalUrl) {
      window.open(externalUrl, '_blank');
    }
    
    await claimTask(taskId);
  };

  const handleSubmitPost = async () => {
    const success = await submitPost(postUrl);
    if (success) {
      setPostUrl("");
      setShowPostDialog(false);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'social':
        return <Twitter className="h-5 w-5 text-blue-400" />;
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
          <span className="flex items-center gap-1 text-green-400 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-yellow-400 text-sm">
            <Clock className="h-4 w-4" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-destructive text-sm">
            <XCircle className="h-4 w-4" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Tasks</h1>
        <p className="text-muted-foreground mt-1">Complete tasks to earn bonus ARX-P points</p>
      </div>

      {/* Social Yapping Section */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Twitter className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-foreground">Social Yapping</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Post about Arxon on X with #ArxonMining and @Arxonarx to earn {SOCIAL_POST_POINTS} ARX-P per approved post
            </p>
          </div>
          <Button 
            onClick={() => user ? setShowPostDialog(true) : setShowAuth(true)}
            className="btn-mining shrink-0"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Post
          </Button>
        </div>

        {/* Recent Submissions */}
        {submissions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-medium text-foreground mb-3">Your Submissions</p>
            <div className="space-y-2">
              {submissions.slice(0, 3).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <a 
                    href={sub.post_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline truncate max-w-[200px] sm:max-w-xs"
                  >
                    {sub.post_url}
                  </a>
                  {getStatusBadge(sub.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">
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
                className={`glass-card p-4 sm:p-5 transition-all ${
                  isCompleted ? 'opacity-60' : 'hover:bg-secondary/30'
                }`}
              >
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-secondary shrink-0">
                      {getTaskIcon(task.task_type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-accent text-sm font-medium">
                          <Zap className="h-3 w-3" />
                          +{task.points_reward} ARX-P
                        </span>
                        {getStatusBadge(status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {task.external_url && !isCompleted && (
                      <a
                        href={task.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    )}
                    <Button
                      onClick={() => handleClaimTask(task.id, task.external_url)}
                      disabled={isCompleted || isPending}
                      className={isCompleted || isPending ? 'btn-claimed' : 'btn-claim'}
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

      {/* Submit Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Submit X Post</DialogTitle>
            <DialogDescription>
              Share a post about Arxon with #ArxonMining and mention @Arxonarx
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="https://x.com/username/status/..."
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                className="bg-input border-border"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Paste your X/Twitter post URL. Posts will be reviewed for +{SOCIAL_POST_POINTS} ARX-P.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPostDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitPost} 
                disabled={submitting || !postUrl}
                className="btn-mining"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default Tasks;
