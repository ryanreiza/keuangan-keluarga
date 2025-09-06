import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  is_achieved: boolean;
  category_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  categories?: {
    name: string;
  };
}

export interface CreateSavingsGoalData {
  name: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string;
  category_id: string;
}

export const useSavings = () => {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSavingsGoals = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select(`
          *,
          categories(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavingsGoals(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching savings goals",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSavingsGoal = async (goalData: CreateSavingsGoalData) => {
    if (!user) return { error: 'No user found' };

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .insert([
          {
            ...goalData,
            user_id: user.id,
          }
        ])
        .select(`
          *,
          categories(name)
        `)
        .single();

      if (error) throw error;

      setSavingsGoals([data, ...savingsGoals]);
      toast({
        title: "Savings goal created",
        description: "Your savings goal has been saved successfully.",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error creating savings goal",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const updateSavingsGoal = async (id: string, goalData: Partial<CreateSavingsGoalData>) => {
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .update(goalData)
        .eq('id', id)
        .select(`
          *,
          categories(name)
        `)
        .single();

      if (error) throw error;

      setSavingsGoals(savingsGoals.map(g => g.id === id ? data : g));
      toast({
        title: "Savings goal updated",
        description: "Savings goal has been updated successfully.",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error updating savings goal",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavingsGoals(savingsGoals.filter(g => g.id !== id));
      toast({
        title: "Savings goal deleted",
        description: "Savings goal has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting savings goal",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSavingsGoals();
  }, [user]);

  return {
    savingsGoals,
    loading,
    createSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    refetch: fetchSavingsGoals,
  };
};