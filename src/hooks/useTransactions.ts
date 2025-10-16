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
  destination_account_id?: string; // For transfer transactions
  debt_id?: string; // For debt payment transactions
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
  type: 'income' | 'expense' | 'transfer' | 'debt_payment';
  category_id: string;
  account_id: string;
  destination_account_id?: string; // Required only for transfer type
  debt_id?: string; // Required only for debt_payment type
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
    if (!user) return { error: 'User not authenticated' };

    try {
      const insertData: any = {
        description: transactionData.description,
        amount: transactionData.amount,
        type: transactionData.type,
        category_id: transactionData.category_id,
        account_id: transactionData.account_id,
        transaction_date: transactionData.transaction_date,
        user_id: user.id,
      };

      // Add destination_account_id for transfer transactions
      if (transactionData.type === 'transfer' && transactionData.destination_account_id) {
        insertData.destination_account_id = transactionData.destination_account_id;
      }

      // Add debt_id for debt payment transactions
      if (transactionData.type === 'debt_payment' && transactionData.debt_id) {
        insertData.debt_id = transactionData.debt_id;
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([insertData])
        .select(`
          *,
          categories(name),
          accounts(name)
        `);

      if (error) throw error;

      if (data && data[0]) {
        setTransactions(prev => [data[0], ...prev]);
        toast({
          title: "Berhasil",
          description: transactionData.type === 'transfer' 
            ? "Transfer antar rekening berhasil ditambahkan"
            : transactionData.type === 'debt_payment'
            ? "Pembayaran utang berhasil ditambahkan"
            : "Transaksi berhasil ditambahkan",
        });
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan transaksi",
        variant: "destructive",
      });
      return { data: null, error };
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