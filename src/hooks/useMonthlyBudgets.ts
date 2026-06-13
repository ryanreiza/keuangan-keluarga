import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface MonthlyBudget {
  id: string;
  user_id: string;
  category_id: string | null;
  savings_goal_id: string | null;
  month: number;
  year: number;
  expected_amount: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetData {
  category_id?: string | null;
  savings_goal_id?: string | null;
  month: number;
  year: number;
  expected_amount: number;
}

export const useMonthlyBudgets = () => {
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBudgets = async (month?: number, year?: number) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', user.id);

      if (month !== undefined && year !== undefined) {
        query = query.eq('month', month).eq('year', year);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBudgets(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching budgets",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const upsertBudget = async (budgetData: CreateBudgetData) => {
    if (!user) return { error: 'No user found' };

    try {
      const isSavings = !!budgetData.savings_goal_id;
      const payload: any = {
        user_id: user.id,
        month: budgetData.month,
        year: budgetData.year,
        expected_amount: budgetData.expected_amount,
        category_id: isSavings ? null : budgetData.category_id ?? null,
        savings_goal_id: isSavings ? budgetData.savings_goal_id : null,
      };

      const { data, error } = await supabase
        .from('monthly_budgets')
        .upsert([payload], {
          onConflict: isSavings
            ? 'user_id,savings_goal_id,month,year'
            : 'user_id,category_id,month,year',
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setBudgets(prev => {
        const index = prev.findIndex(b =>
          b.month === data.month &&
          b.year === data.year &&
          ((isSavings && b.savings_goal_id === data.savings_goal_id) ||
           (!isSavings && b.category_id === data.category_id))
        );
        if (index >= 0) {
          const newBudgets = [...prev];
          newBudgets[index] = data;
          return newBudgets;
        }
        return [...prev, data];
      });


      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error saving budget",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [user]);

  return {
    budgets,
    loading,
    upsertBudget,
    fetchBudgets,
  };
};
