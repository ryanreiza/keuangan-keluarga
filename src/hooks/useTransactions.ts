import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Transaction {
  id: string;
  description: string | null;
  amount: number;
  type: string;
  transaction_date: string;
  category_id: string;
  account_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  categories?: {
    name: string;
  };
  accounts?: {
    name: string;
  };
}

export interface CreateTransactionData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string;
  account_id: string;
  transaction_date: string;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories(name),
          accounts(name)
        `)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching transactions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (transactionData: CreateTransactionData) => {
    if (!user) return { error: 'No user found' };

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            ...transactionData,
            user_id: user.id,
          }
        ])
        .select(`
          *,
          categories(name),
          accounts(name)
        `)
        .single();

      if (error) throw error;

      setTransactions([data, ...transactions]);
      toast({
        title: "Transaction created",
        description: "Your transaction has been saved successfully.",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error creating transaction",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(transactions.filter(t => t.id !== id));
      toast({
        title: "Transaction deleted",
        description: "Transaction has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting transaction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetAllTransactions = async () => {
    if (!user) return { error: 'No user found' };

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setTransactions([]);
      toast({
        title: "All transactions reset",
        description: "All transaction data has been cleared successfully.",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error resetting transactions",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  return {
    transactions,
    loading,
    createTransaction,
    deleteTransaction,
    resetAllTransactions,
    refetch: fetchTransactions,
  };
};