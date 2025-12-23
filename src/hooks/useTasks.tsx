import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePoints } from './usePoints';
import { toast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  points_reward: number;
  task_type: string;
  external_url: string | null;
  is_active: boolean;
}

interface UserTask {
  id: string;
  task_id: string;
  status: string;
  proof_url: string | null;
  points_awarded: number;
  completed_at: string | null;
}

export const useTasks = () => {
  const { user } = useAuth();
  const { addPoints, triggerConfetti } = usePoints();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('points_reward', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, []);

  const fetchUserTasks = useCallback(async () => {
    if (!user) {
      setUserTasks([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserTasks(data || []);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const claimTask = async (taskId: string, proofUrl?: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to claim tasks",
        variant: "destructive"
      });
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const existingUserTask = userTasks.find(ut => ut.task_id === taskId);
    if (existingUserTask?.status === 'completed') {
      toast({
        title: "Already Claimed",
        description: "You've already completed this task",
      });
      return;
    }

    try {
      // For social tasks that require proof, set status to pending
      // For manual tasks, auto-complete
      const status = task.task_type === 'social' && proofUrl ? 'pending' : 'completed';
      const pointsAwarded = status === 'completed' ? task.points_reward : 0;

      if (existingUserTask) {
        await supabase
          .from('user_tasks')
          .update({
            status,
            proof_url: proofUrl,
            points_awarded: pointsAwarded,
            completed_at: status === 'completed' ? new Date().toISOString() : null
          })
          .eq('id', existingUserTask.id);
      } else {
        await supabase
          .from('user_tasks')
          .insert({
            user_id: user.id,
            task_id: taskId,
            status,
            proof_url: proofUrl,
            points_awarded: pointsAwarded,
            completed_at: status === 'completed' ? new Date().toISOString() : null
          });
      }

      if (status === 'completed') {
        await addPoints(task.points_reward, 'task');
        triggerConfetti();
        toast({
          title: "Task Completed! 🎉",
          description: `+${task.points_reward} ARX-P earned`,
        });
      } else {
        toast({
          title: "Task Submitted",
          description: "Your submission is pending review",
        });
      }

      fetchUserTasks();
    } catch (error: any) {
      console.error('Error claiming task:', error);
      toast({
        title: "Error",
        description: "Failed to claim task",
        variant: "destructive"
      });
    }
  };

  const getTaskStatus = (taskId: string) => {
    const userTask = userTasks.find(ut => ut.task_id === taskId);
    return userTask?.status || 'available';
  };

  useEffect(() => {
    fetchTasks();
    fetchUserTasks();
  }, [fetchTasks, fetchUserTasks]);

  return {
    tasks,
    userTasks,
    loading,
    claimTask,
    getTaskStatus,
    refreshTasks: fetchUserTasks
  };
};
