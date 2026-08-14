import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PlanIncome {
  id: string;
  user_id: string;
  month: number;
  year: number;
  category: string;
  amount: number;
  sort_order: number;
}

export interface PlanFixedExpense {
  id: string;
  user_id: string;
  month: number;
  year: number;
  category: string;
  amount: number;
  web_category_id: string | null;
  remark: string | null;
  sort_order: number;
}

export interface PlanAllocation {
  id: string;
  user_id: string;
  month: number;
  year: number;
  percentage: number;
  category: string;
  note: string | null;
  web_category_id: string | null;
  remark: string | null;
  sort_order: number;
}

export const useMonthlyPlan = (month: number, year: number) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<PlanIncome[]>([]);
  const [fixed, setFixed] = useState<PlanFixedExpense[]>([]);
  const [allocations, setAllocations] = useState<PlanAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [i, f, a] = await Promise.all([
        supabase.from('monthly_plan_incomes').select('*').eq('user_id', user.id).eq('month', month).eq('year', year).order('sort_order').order('created_at'),
        supabase.from('monthly_plan_fixed_expenses').select('*').eq('user_id', user.id).eq('month', month).eq('year', year).order('sort_order').order('created_at'),
        supabase.from('monthly_plan_allocations').select('*').eq('user_id', user.id).eq('month', month).eq('year', year).order('sort_order').order('created_at'),
      ]);
      if (i.error) throw i.error;
      if (f.error) throw f.error;
      if (a.error) throw a.error;
      setIncomes((i.data as any) || []);
      setFixed((f.data as any) || []);
      setAllocations((a.data as any) || []);
    } catch (e: any) {
      toast({ title: 'Gagal memuat rencana bulanan', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, month, year, toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Generic helpers
  const wrap = async <T,>(op: () => PromiseLike<{ data: any; error: any }>, errMsg: string): Promise<T | null> => {
    const { data, error } = await op();
    if (error) {
      toast({ title: errMsg, description: error.message, variant: 'destructive' });
      return null;
    }
    return data as T;
  };

  // Incomes
  const addIncome = async () => {
    if (!user) return;
    const row = await wrap<PlanIncome>(() => supabase.from('monthly_plan_incomes').insert({ user_id: user.id, month, year, category: '', amount: 0, sort_order: incomes.length }).select().single(), 'Gagal menambah pemasukan');
    if (row) setIncomes(prev => [...prev, row]);
  };
  const updateIncome = async (id: string, patch: Partial<PlanIncome>) => {
    setIncomes(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    await wrap(() => supabase.from('monthly_plan_incomes').update(patch).eq('id', id).select().single(), 'Gagal menyimpan');
  };
  const deleteIncome = async (id: string) => {
    setIncomes(prev => prev.filter(r => r.id !== id));
    const { error } = await supabase.from('monthly_plan_incomes').delete().eq('id', id);
    if (error) toast({ title: 'Gagal menghapus', description: error.message, variant: 'destructive' });
  };

  // Fixed
  const addFixed = async () => {
    if (!user) return;
    const row = await wrap<PlanFixedExpense>(() => supabase.from('monthly_plan_fixed_expenses').insert({ user_id: user.id, month, year, category: '', amount: 0, sort_order: fixed.length }).select().single(), 'Gagal menambah baris');
    if (row) setFixed(prev => [...prev, row]);
  };
  const updateFixed = async (id: string, patch: Partial<PlanFixedExpense>) => {
    setFixed(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    await wrap(() => supabase.from('monthly_plan_fixed_expenses').update(patch).eq('id', id).select().single(), 'Gagal menyimpan');
  };
  const deleteFixed = async (id: string) => {
    setFixed(prev => prev.filter(r => r.id !== id));
    const { error } = await supabase.from('monthly_plan_fixed_expenses').delete().eq('id', id);
    if (error) toast({ title: 'Gagal menghapus', description: error.message, variant: 'destructive' });
  };

  // Allocations
  const addAllocation = async (preset?: Partial<PlanAllocation>) => {
    if (!user) return;
    const row = await wrap<PlanAllocation>(() => supabase.from('monthly_plan_allocations').insert({
      user_id: user.id, month, year,
      percentage: preset?.percentage ?? 0,
      category: preset?.category ?? '',
      note: preset?.note ?? null,
      sort_order: allocations.length,
    }).select().single(), 'Gagal menambah alokasi');
    if (row) setAllocations(prev => [...prev, row]);
  };
  const updateAllocation = async (id: string, patch: Partial<PlanAllocation>) => {
    setAllocations(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    await wrap(() => supabase.from('monthly_plan_allocations').update(patch).eq('id', id).select().single(), 'Gagal menyimpan');
  };
  const deleteAllocation = async (id: string) => {
    setAllocations(prev => prev.filter(r => r.id !== id));
    const { error } = await supabase.from('monthly_plan_allocations').delete().eq('id', id);
    if (error) toast({ title: 'Gagal menghapus', description: error.message, variant: 'destructive' });
  };

  // Bulk paste (copy targets from another month)
  const pasteIncomes = async (rows: Partial<PlanIncome>[]) => {
    if (!user || rows.length === 0) return 0;
    const payload = rows.map((r, idx) => ({
      user_id: user.id, month, year,
      category: r.category ?? '', amount: Number(r.amount ?? 0),
      sort_order: incomes.length + idx,
    }));
    const data = await wrap<PlanIncome[]>(() => supabase.from('monthly_plan_incomes').insert(payload).select(), 'Gagal menempel pemasukan');
    if (data) setIncomes(prev => [...prev, ...data]);
    return data?.length ?? 0;
  };
  const pasteFixed = async (rows: Partial<PlanFixedExpense>[]) => {
    if (!user || rows.length === 0) return 0;
    const payload = rows.map((r, idx) => ({
      user_id: user.id, month, year,
      category: r.category ?? '', amount: Number(r.amount ?? 0),
      web_category_id: r.web_category_id ?? null, remark: r.remark ?? null,
      sort_order: fixed.length + idx,
    }));
    const data = await wrap<PlanFixedExpense[]>(() => supabase.from('monthly_plan_fixed_expenses').insert(payload).select(), 'Gagal menempel pengeluaran tetap');
    if (data) setFixed(prev => [...prev, ...data]);
    return data?.length ?? 0;
  };
  const pasteAllocations = async (rows: Partial<PlanAllocation>[]) => {
    if (!user || rows.length === 0) return 0;
    const payload = rows.map((r, idx) => ({
      user_id: user.id, month, year,
      percentage: Number(r.percentage ?? 0), category: r.category ?? '',
      note: r.note ?? null, web_category_id: r.web_category_id ?? null, remark: r.remark ?? null,
      sort_order: allocations.length + idx,
    }));
    const data = await wrap<PlanAllocation[]>(() => supabase.from('monthly_plan_allocations').insert(payload).select(), 'Gagal menempel alokasi');
    if (data) setAllocations(prev => [...prev, ...data]);
    return data?.length ?? 0;
  };

  const clearIncomes = async () => {
    if (!user) return;
    setIncomes([]);
    await supabase.from('monthly_plan_incomes').delete().eq('user_id', user.id).eq('month', month).eq('year', year);
  };
  const clearFixed = async () => {
    if (!user) return;
    setFixed([]);
    await supabase.from('monthly_plan_fixed_expenses').delete().eq('user_id', user.id).eq('month', month).eq('year', year);
  };
  const clearAllocations = async () => {
    if (!user) return;
    setAllocations([]);
    await supabase.from('monthly_plan_allocations').delete().eq('user_id', user.id).eq('month', month).eq('year', year);
  };

  return {
    loading,
    incomes, addIncome, updateIncome, deleteIncome,
    fixed, addFixed, updateFixed, deleteFixed,
    allocations, addAllocation, updateAllocation, deleteAllocation,
    pasteIncomes, pasteFixed, pasteAllocations,
    clearIncomes, clearFixed, clearAllocations,
    refetch: fetchAll,
  };
};

