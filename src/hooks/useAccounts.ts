import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Account {
  id: string;
  name: string;
  bank_name: string;
  account_number: string | null;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountData {
  name: string;
  bank_name: string;
  account_number?: string;
  initial_balance: number;
}

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAccounts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching accounts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (accountData: CreateAccountData) => {
    if (!user) return { error: 'No user found' };

    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([
          {
            ...accountData,
            current_balance: accountData.initial_balance,
            user_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setAccounts([data, ...accounts]);
      toast({
        title: "Account created",
        description: "Your account has been saved successfully.",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const updateAccount = async (id: string, accountData: Partial<CreateAccountData>) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update(accountData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAccounts(accounts.map(a => a.id === id ? data : a));
      toast({
        title: "Account updated",
        description: "Account has been updated successfully.",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error updating account",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAccounts(accounts.filter(a => a.id !== id));
      toast({
        title: "Account deleted",
        description: "Account has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  return {
    accounts,
    loading,
    createAccount,
    updateAccount,
    deleteAccount,
    refetch: fetchAccounts,
  };
};