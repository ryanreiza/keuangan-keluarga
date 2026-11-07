import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FunctionsHttpError } from '@supabase/supabase-js';

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
  const [goldPriceUpdatedAt, setGoldPriceUpdatedAt] = useState<string | null>(null);
  const [goldPriceSource, setGoldPriceSource] = useState<string>('manual');
  const [loading, setLoading] = useState(true);
  const autoRefreshStarted = useRef(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const refreshGoldPrice = async (showErrorToast = true) => {
    try {
      const { data, error } = await supabase.functions.invoke('gold-price-refresh', { body: {} });
      if (error) {
        const details = error instanceof FunctionsHttpError
          ? await error.context.text()
          : error.message;
        throw new Error(details || 'Harga emas belum berhasil diperbarui.');
      }
      if (!data || typeof data.pricePerGram !== 'number' || data.pricePerGram <= 0) {
        throw new Error('Sumber harga emas mengembalikan nilai yang tidak valid.');
      }

      setGoldPricePerGram(data.pricePerGram);
      setGoldPriceUpdatedAt(data.quotedAt ?? null);
      setGoldPriceSource(data.source ?? 'xaus');
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Harga emas belum berhasil diperbarui.';
      if (showErrorToast) {
        toast({
          title: 'Harga emas belum diperbarui',
          description: 'Harga terakhir tetap digunakan. Silakan coba lagi nanti.',
          variant: 'destructive',
        });
      }
      return { error: message };
    }
  };

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
          .select('gold_price_per_gram, gold_price_updated_at, gold_price_source')
          .eq('user_id', user.id)
          .single(),
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (txRes.error) throw txRes.error;

      setGoldAccounts(accountsRes.data || []);
      setGoldTransactions(txRes.data || []);
      if (!profileRes.error && profileRes.data) {
        setGoldPricePerGram(profileRes.data.gold_price_per_gram ?? 0);
        setGoldPriceUpdatedAt(profileRes.data.gold_price_updated_at ?? null);
        setGoldPriceSource(profileRes.data.gold_price_source ?? 'manual');

        const updatedAt = profileRes.data.gold_price_updated_at
          ? Date.parse(profileRes.data.gold_price_updated_at)
          : 0;
        const stale = !Number.isFinite(updatedAt) || Date.now() - updatedAt >= 24 * 60 * 60 * 1000;
        if (stale && !autoRefreshStarted.current) {
          autoRefreshStarted.current = true;
          const result = await refreshGoldPrice(false);
          if (result.error) {
            toast({
              title: 'Harga emas belum diperbarui',
              description: 'Harga terakhir tetap digunakan. Anda dapat mencoba memperbarui lagi nanti.',
              variant: 'destructive',
            });
          }
        }
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
        .update({
          gold_price_per_gram: price,
          gold_price_updated_at: new Date().toISOString(),
          gold_price_source: 'manual',
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setGoldPricePerGram(price);
      setGoldPriceUpdatedAt(new Date().toISOString());
      setGoldPriceSource('manual');
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
    goldPriceUpdatedAt,
    goldPriceSource,
    loading,
    createGoldAccount,
    updateGoldAccount,
    deleteGoldAccount,
    recordPurchase,
    recordSale,
    updateGoldPrice,
    refreshGoldPrice,
    refetch: fetchGold,
  };
};
