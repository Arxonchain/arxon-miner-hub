import { useState } from "react";
import { 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Send,
  Users,
  Gift,
  Zap,
  TrendingUp
} from "lucide-react";
import XIcon from "@/components/icons/XIcon";
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
  const { 
    submitPost, 
    submitting, 
    submissions, 
    claiming,
    claimRewards,
    SOCIAL_POST_POINTS, 
    SOCIAL_MINING_BOOST,
    MAX_QUALITY_POSTS,
    totalMiningBoost,
    qualityPostsCount,
    canSubmitMore
  } = useSocialSubmissions();
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

  const handleClaimRewards = async (submissionId: string) => {
    await claimRewards(submissionId);
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

  const getStatusBadge = (status: string, claimed?: boolean) => {
    if (claimed) {
      return (
        <span className="flex items-center gap-1 text-green-400 text-[10px] sm:text-xs">
          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
          Claimed
        </span>
      );
    }
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 text-accent text-[10px] sm:text-xs">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
            Ready to Claim
          </span>
        );
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

  // Filter out claimed/rejected submissions older than 5 minutes
  const CLEAR_AFTER_MS = 5 * 60 * 1000; // 5 minutes
  const now = Date.now();

  const isRecentSubmission = (sub: typeof submissions[0]) => {
    const reviewedAt = sub.reviewed_at ? new Date(sub.reviewed_at).getTime() : 0;
    const createdAt = new Date(sub.created_at).getTime();
    const referenceTime = reviewedAt || createdAt;
    return now - referenceTime < CLEAR_AFTER_MS;
  };

  // Get unclaimed approved submissions
  const unclaimedSubmissions = submissions.filter(s => s.status === 'approved' && !s.claimed);
  
  // Only show claimed submissions from the last 5 minutes
  const claimedSubmissions = submissions.filter(s => s.claimed && isRecentSubmission(s));
  
  // Only show rejected submissions from the last 5 minutes
  const recentRejectedOrPending = submissions.filter(s => 
    s.status === 'pending' || (s.status === 'rejected' && isRecentSubmission(s))
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Tasks</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Complete tasks to earn bonus ARX-P points</p>
      </div>

      {/* Social Yapping Section */}
      <div className="glass-card p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
              <XIcon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground shrink-0" />
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground">X Social Yapping</h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Paste your X post links to earn <span className="text-accent font-semibold">{SOCIAL_POST_POINTS} ARX-P</span> + <span className="text-yellow-400 font-semibold">+{SOCIAL_MINING_BOOST} ARX-P/HR</span> mining boost per quality post
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 sm:mt-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="h-3 w-3 text-accent" />
                <span>{qualityPostsCount}/{MAX_QUALITY_POSTS} posts used</span>
              </div>
              {totalMiningBoost > 0 && (
                <div className="flex items-center gap-1 text-xs text-yellow-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{totalMiningBoost} ARX-P/HR boost active</span>
                </div>
              )}
            </div>
          </div>
          <Button 
            onClick={() => user ? setShowPostDialog(true) : setShowAuth(true)}
            className="btn-mining w-full sm:w-auto shrink-0 text-xs sm:text-sm"
            size="sm"
            disabled={!canSubmitMore}
          >
            <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            {canSubmitMore ? 'Submit Post' : 'Limit Reached'}
          </Button>
        </div>

        {/* Unclaimed Submissions - Ready to Claim */}
        {unclaimedSubmissions.length > 0 && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
            <p className="text-xs sm:text-sm font-medium text-accent mb-2 sm:mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Ready to Claim ({unclaimedSubmissions.length})
            </p>
            <div className="space-y-2">
              {unclaimedSubmissions.map((sub) => (
                <div key={sub.id} className="glass-card p-3 sm:p-4 border-accent/30 bg-accent/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <a 
                        href={sub.post_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-accent hover:underline truncate block"
                      >
                        {sub.post_url}
                      </a>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          Rewards: <span className="text-green-400">+{SOCIAL_POST_POINTS} ARX-P</span> + <span className="text-yellow-400">+{SOCIAL_MINING_BOOST} ARX-P/HR</span>
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleClaimRewards(sub.id)}
                      disabled={claiming === sub.id}
                      className="btn-claim shrink-0 text-xs"
                      size="sm"
                    >
                      {claiming === sub.id ? (
                        <>
                          <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3 mr-1" />
                          Claim Rewards
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Claimed Submissions */}
        {claimedSubmissions.length > 0 && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
            <p className="text-xs sm:text-sm font-medium text-green-400 mb-2 sm:mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Claimed Posts ({claimedSubmissions.length})
            </p>
            <div className="space-y-2">
              {claimedSubmissions.slice(0, 5).map((sub) => (
                <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 sm:p-3 bg-secondary/50 rounded-lg opacity-70">
                  <a 
                    href={sub.post_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-muted-foreground hover:text-accent truncate max-w-full"
                  >
                    {sub.post_url}
                  </a>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[10px] text-green-400">+{sub.points_awarded} ARX-P</span>
                    {getStatusBadge(sub.status, sub.claimed)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending/Rejected Submissions */}
        {recentRejectedOrPending.length > 0 && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">Other Submissions</p>
            <div className="space-y-2">
              {recentRejectedOrPending.map((sub) => (
                <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 sm:p-3 bg-secondary/50 rounded-lg">
                  <a 
                    href={sub.post_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-muted-foreground hover:text-accent truncate max-w-full"
                  >
                    {sub.post_url}
                  </a>
                  <div className="shrink-0">{getStatusBadge(sub.status)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
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
                      onClick={() => handleClaimTask(task.id, task.external_url)}
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

      {/* Submit Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Submit X Post</DialogTitle>
            <DialogDescription>
              Paste your X post link to earn rewards instantly
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Rewards Preview */}
            <div className="glass-card p-3 border-accent/30 bg-accent/5">
              <p className="text-xs text-muted-foreground mb-2">You'll earn:</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">+{SOCIAL_POST_POINTS} ARX-P</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-400">+{SOCIAL_MINING_BOOST} ARX-P/HR</span>
                </div>
              </div>
            </div>

            <div>
              <Input
                placeholder="https://x.com/username/status/..."
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                className="bg-input border-border"
              />
              <p className="text-xs text-muted-foreground mt-2">
                <span className="text-yellow-400 font-medium">Required:</span> Posts must mention <span className="text-accent">@arxonarx</span>, <span className="text-accent">#arxon</span>, <span className="text-accent">#arxonmining</span>, or <span className="text-accent">#arxonchain</span> to qualify.
                <br />
                <span className="text-accent">{qualityPostsCount}/{MAX_QUALITY_POSTS}</span> posts used.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPostDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitPost} 
                disabled={submitting || !postUrl || !canSubmitMore}
                className="btn-mining"
              >
                {submitting ? 'Submitting...' : 'Submit & Claim'}
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
