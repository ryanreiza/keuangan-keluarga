import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  type: 'budget_warning' | 'debt_due' | 'debt_overdue' | 'savings_achieved';
}

const STORAGE_KEY = 'read_notifications';

const getReadIds = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch { return new Set(); }
};

const saveReadIds = (ids: Set<string>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(getReadIds);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    generateNotifications();
  }, [user]);

  const generateNotifications = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const results: AppNotification[] = [];

      // Fetch budgets, transactions, debts, categories, and savings in parallel
      const [budgetsRes, transactionsRes, debtsRes, categoriesRes, savingsRes] = await Promise.all([
        supabase
          .from('monthly_budgets')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', currentMonth)
          .eq('year', currentYear),
        supabase
          .from('transactions')
          .select('*, categories(name)')
          .eq('user_id', user.id)
          .eq('type', 'expense')
          .gte('transaction_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
          .lte('transaction_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`),
        supabase
          .from('debts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_paid_off', false),
        supabase
          .from('categories')
          .select('id, name')
          .eq('user_id', user.id),
        supabase
          .from('savings_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_achieved', true),
      ]);

      const budgets = budgetsRes.data || [];
      const transactions = transactionsRes.data || [];
      const debts = debtsRes.data || [];
      const categories = categoriesRes.data || [];
      const savings = savingsRes.data || [];

      const categoryMap = new Map(categories.map(c => [c.id, c.name]));

      // Budget warnings: spending >= 80% of budget
      for (const budget of budgets) {
        const spent = transactions
          .filter(t => t.category_id === budget.category_id)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const percentage = budget.expected_amount > 0 
          ? Math.round((spent / budget.expected_amount) * 100) 
          : 0;

        if (percentage >= 100) {
          const nId = `budget-over-${budget.id}`;
          results.push({
            id: nId,
            title: 'Anggaran melebihi batas',
            desc: `Pengeluaran ${categoryMap.get(budget.category_id) || 'kategori'} sudah ${percentage}% dari anggaran (Rp ${formatNumber(spent)} / Rp ${formatNumber(budget.expected_amount)})`,
            time: 'Bulan ini',
            unread: !readIds.has(nId),
            type: 'budget_warning',
          });
        } else if (percentage >= 80) {
          const nId = `budget-warn-${budget.id}`;
          results.push({
            id: nId,
            title: 'Anggaran hampir habis',
            desc: `Pengeluaran ${categoryMap.get(budget.category_id) || 'kategori'} sudah ${percentage}% dari anggaran`,
            time: 'Bulan ini',
            unread: !readIds.has(nId),
            type: 'budget_warning',
          });
        }
      }

      // Debt due date warnings
      const today = now.toISOString().split('T')[0];
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      for (const debt of debts) {
        if (!debt.due_date) continue;

        if (debt.due_date < today) {
          const nId = `debt-overdue-${debt.id}`;
          results.push({
            id: nId,
            title: 'Pembayaran utang terlambat!',
            desc: `Utang ke ${debt.creditor_name} sudah melewati jatuh tempo (${formatDate(debt.due_date)}). Sisa: Rp ${formatNumber(debt.remaining_amount)}`,
            time: 'Terlambat',
            unread: !readIds.has(nId),
            type: 'debt_overdue',
          });
        } else if (debt.due_date <= threeDaysLater) {
          const nId = `debt-due-${debt.id}`;
          results.push({
            id: nId,
            title: 'Pembayaran utang jatuh tempo',
            desc: `Cicilan ${debt.creditor_name} jatuh tempo ${formatDate(debt.due_date)}. Sisa: Rp ${formatNumber(debt.remaining_amount)}`,
            time: 'Segera',
            unread: !readIds.has(nId),
            type: 'debt_due',
          });
        }
      }

      // Savings achieved
      for (const saving of savings) {
        const nId = `savings-${saving.id}`;
        results.push({
          id: nId,
          title: 'Tabungan tercapai! 🎉',
          desc: `Target "${saving.name}" sudah tercapai 100% (Rp ${formatNumber(saving.target_amount)})`,
          time: formatDate(saving.updated_at.split('T')[0]),
          unread: !readIds.has(nId),
          type: 'savings_achieved',
        });
      }

      // Sort: unread first, then by type priority
      results.sort((a, b) => {
        if (a.unread !== b.unread) return a.unread ? -1 : 1;
        const priority = { debt_overdue: 0, budget_warning: 1, debt_due: 2, savings_achieved: 3 };
        return priority[a.type] - priority[b.type];
      });

      setNotifications(results);
    } catch (error) {
      console.error('Error generating notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    const updated = new Set(readIds);
    updated.add(id);
    setReadIds(updated);
    saveReadIds(updated);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const markAllAsRead = () => {
    const updated = new Set(readIds);
    notifications.forEach(n => updated.add(n.id));
    setReadIds(updated);
    saveReadIds(updated);
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = useMemo(() => notifications.filter(n => n.unread).length, [notifications]);

  return { notifications, unreadCount, loading, refetch: generateNotifications, markAsRead, markAllAsRead };
};

function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(Math.abs(num));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
