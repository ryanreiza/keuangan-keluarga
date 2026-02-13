import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Debt {
  id: string;
  creditor_name: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number;
  monthly_payment: number | null;
  due_date: string | null;
  is_paid_off: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDebtData {
  creditor_name: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate?: number;
  monthly_payment?: number;
  due_date?: string;
}

export const useDebts = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDebts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDebts(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching debts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDebt = async (debtData: CreateDebtData) => {
    if (!user) return { error: 'No user found' };

    try {
      const { data, error } = await supabase
        .from('debts')
        .insert([
          {
            ...debtData,
            user_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setDebts([data, ...debts]);
      toast({
        title: "Debt created",
        description: "Your debt has been saved successfully.",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error creating debt",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const updateDebt = async (id: string, debtData: Partial<CreateDebtData>) => {
    try {
      const { data, error } = await supabase
        .from('debts')
        .update(debtData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setDebts(debts.map(d => d.id === id ? data : d));
      toast({
        title: "Debt updated",
        description: "Debt has been updated successfully.",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error updating debt",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDebts(debts.filter(d => d.id !== id));
      toast({
        title: "Debt deleted",
        description: "Debt has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting debt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDebts();
  }, [user]);

  // Realtime subscription for debts table
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('debts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debts',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchDebts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    debts,
    loading,
    createDebt,
    updateDebt,
    deleteDebt,
    refetch: fetchDebts,
  };
};