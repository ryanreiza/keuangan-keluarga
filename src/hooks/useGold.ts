import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface GoldAccount {
  id: string;
  user_id: string;
  name: string;
  institution: string | null;
  grams: number;
  total_cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoldTransaction {
  id: string;
  user_id: string;
  gold_account_id: string;
  transaction_id: string | null;
  type: 'buy' | 'sell' | string;
  grams: number;
  price_per_gram: number;
  total_amount: number;
  cost_basis: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGoldAccountData {
  name: string;
  institution?: string;
  notes?: string;
}

export interface GoldPurchaseInput {
  gold_account_id: string;
  account_id: string;
  category_id?: string | null;
  amount: number;
  grams: number;
  transaction_date?: string;
  description?: string;
}

export interface GoldSaleInput {
  gold_account_id: string;
  account_id: string;
  category_id?: string | null;
  amount: number;
  grams: number;
  transaction_date?: string;
  description?: string;
}

export const useGold = () => {
  const [goldAccounts, setGoldAccounts] = useState<GoldAccount[]>([]);
  const [goldTransactions, setGoldTransactions] = useState<GoldTransaction[]>([]);
  const [goldPricePerGram, setGoldPricePerGram] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchGold = async () => {
    if (!user) return;

    try {
      const [accountsRes, txRes, profileRes] = await Promise.all([
        supabase
          .from('gold_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('gold_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('profiles')
          .select('gold_price_per_gram')
          .eq('user_id', user.id)
          .single(),
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (txRes.error) throw txRes.error;

      setGoldAccounts(accountsRes.data || []);
      setGoldTransactions(txRes.data || []);
      if (!profileRes.error && profileRes.data) {
        setGoldPricePerGram(profileRes.data.gold_price_per_gram ?? 0);
      }
    } catch (error: any) {
      toast({
        title: "Gagal memuat data emas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createGoldAccount = async (accountData: CreateGoldAccountData) => {
    if (!user) return { error: 'No user found' };

    try {
      const { data, error } = await supabase
        .from('gold_accounts')
        .insert({
          name: accountData.name,
          institution: accountData.institution || null,
          notes: accountData.notes || null,
          user_id: user.id,
        })
        .select('*')
        .single();

      if (error) throw error;

      setGoldAccounts([...goldAccounts, data]);
      toast({
        title: "Tempat emas ditambahkan",
        description: "Anda sekarang bisa mencatat pembelian emas di tempat ini.",
      });
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Gagal menambah tempat emas",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const updateGoldAccount = async (id: string, accountData: Partial<CreateGoldAccountData>) => {
    try {
      const { data, error } = await supabase
        .from('gold_accounts')
        .update({
          name: accountData.name,
          institution: accountData.institution || null,
          notes: accountData.notes || null,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      setGoldAccounts(goldAccounts.map(a => (a.id === id ? data : a)));
      toast({
        title: "Tempat emas diperbarui",
        description: "Perubahan berhasil disimpan.",
      });
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Gagal memperbarui tempat emas",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const deleteGoldAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gold_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGoldAccounts(goldAccounts.filter(a => a.id !== id));
      setGoldTransactions(goldTransactions.filter(t => t.gold_account_id !== id));
      toast({
        title: "Tempat emas dihapus",
        description: "Riwayat beli/jual di tempat ini ikut terhapus.",
      });
    } catch (error: any) {
      toast({
        title: "Gagal menghapus tempat emas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const recordPurchase = async (input: GoldPurchaseInput) => {
    try {
      const { data, error } = await supabase.rpc('record_gold_purchase', {
        p_gold_account_id: input.gold_account_id,
        p_account_id: input.account_id,
        p_category_id: input.category_id ?? null,
        p_amount: input.amount,
        p_grams: input.grams,
        p_transaction_date: input.transaction_date,
        p_description: input.description || null,
      } as any);

      if (error) throw error;

      toast({
        title: "Pembelian emas tercatat",
        description: "Saldo rekening berkurang dan simpanan emas bertambah.",
      });
      await fetchGold();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Gagal mencatat pembelian emas",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const recordSale = async (input: GoldSaleInput) => {
    try {
      const { data, error } = await supabase.rpc('record_gold_sale', {
        p_gold_account_id: input.gold_account_id,
        p_account_id: input.account_id,
        p_category_id: input.category_id ?? null,
        p_amount: input.amount,
        p_grams: input.grams,
        p_transaction_date: input.transaction_date,
        p_description: input.description || null,
      } as any);

      if (error) throw error;

      toast({
        title: "Penjualan emas tercatat",
        description: "Simpanan emas berkurang dan saldo rekening bertambah (pemasukan baru).",
      });
      await fetchGold();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Gagal mencatat penjualan emas",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const updateGoldPrice = async (price: number) => {
    if (!user) return { error: 'No user found' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ gold_price_per_gram: price })
        .eq('user_id', user.id);

      if (error) throw error;

      setGoldPricePerGram(price);
      toast({
        title: "Harga emas diperbarui",
        description: `Rp ${price.toLocaleString('id-ID')} per gram tersimpan.`,
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Gagal menyimpan harga emas",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  useEffect(() => {
    fetchGold();
  }, [user]);

  // Realtime sync: gram & modal emas selalu terbarui antar halaman
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`gold-realtime-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gold_accounts', filter: `user_id=eq.${user.id}` },
        () => fetchGold()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gold_transactions', filter: `user_id=eq.${user.id}` },
        () => fetchGold()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    goldAccounts,
    goldTransactions,
    goldPricePerGram,
    loading,
    createGoldAccount,
    updateGoldAccount,
    deleteGoldAccount,
    recordPurchase,
    recordSale,
    updateGoldPrice,
    refetch: fetchGold,
  };
};
