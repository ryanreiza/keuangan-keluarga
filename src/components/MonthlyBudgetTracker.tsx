import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMonthlyBudgets } from '@/hooks/useMonthlyBudgets';
import { Category } from '@/hooks/useCategories';
import { Transaction } from '@/hooks/useTransactions';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, ClipboardPaste, PiggyBank } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { SavingsGoal } from '@/hooks/useSavings';

// Storage key for copied budget data
const COPIED_BUDGET_KEY = 'copiedBudgetData';

interface MonthlyBudgetTrackerProps {
  categories: Category[];
  transactions: Transaction[];
  selectedMonth: string; // Format: yyyy-MM
  type: 'income' | 'expense';
  savingsGoals?: SavingsGoal[];
}

export default function MonthlyBudgetTracker({ 
  categories, 
  transactions, 
  selectedMonth,
  type,
  savingsGoals = [],
}: MonthlyBudgetTrackerProps) {
  const { budgets, loading, upsertBudget } = useMonthlyBudgets();
  const [localExpected, setLocalExpected] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const month = parseInt(selectedMonth.split('-')[1]);
  const year = parseInt(selectedMonth.split('-')[0]);
  const monthLabel = format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: localeId });

  // Filter categories by type
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => cat.type === type);
  }, [categories, type]);

  // Build unified rows: categories + (for expense) savings goals
  interface Row {
    key: string;
    kind: 'category' | 'savings';
    id: string;
    name: string;
    color: string;
  }

  const rows = useMemo<Row[]>(() => {
    const catRows: Row[] = filteredCategories.map(cat => ({
      key: `cat:${cat.id}`,
      kind: 'category',
      id: cat.id,
      name: cat.name,
      color: cat.color,
    }));
    if (type !== 'expense') return catRows;
    const savRows: Row[] = (savingsGoals || []).map(g => ({
      key: `sav:${g.id}`,
      kind: 'savings',
      id: g.id,
      name: g.name,
      color: '#10B981',
    }));
    return [...catRows, ...savRows];
  }, [filteredCategories, savingsGoals, type]);

  // Calculate actual amounts from transactions, keyed by row.key
  const actualAmounts = useMemo(() => {
    const amounts: Record<string, number> = {};

    // Category rows: sum transactions for that category & type,
    // EXCLUDING transactions linked to a savings goal (to avoid double-count).
    filteredCategories.forEach(cat => {
      const sum = transactions
        .filter(t => t.category_id === cat.id && t.type === type && !t.savings_goal_id)
        .reduce((s, t) => s + Number(t.amount), 0);
      amounts[`cat:${cat.id}`] = sum;
    });

    if (type === 'expense') {
      (savingsGoals || []).forEach(goal => {
        const sum = transactions
          .filter(t => t.savings_goal_id === goal.id)
          .reduce((s, t) => s + Number(t.amount), 0);
        amounts[`sav:${goal.id}`] = sum;
      });
    }

    return amounts;
  }, [transactions, filteredCategories, savingsGoals, type]);

  // Get expected amounts from budgets, keyed by row.key
  const expectedAmounts = useMemo(() => {
    const amounts: Record<string, number> = {};

    filteredCategories.forEach(cat => {
      const budget = budgets.find(
        b => b.category_id === cat.id && b.month === month && b.year === year
      );
      amounts[`cat:${cat.id}`] = budget?.expected_amount || 0;
    });

    if (type === 'expense') {
      (savingsGoals || []).forEach(goal => {
        const budget = budgets.find(
          b => b.savings_goal_id === goal.id && b.month === month && b.year === year
        );
        amounts[`sav:${goal.id}`] = budget?.expected_amount || 0;
      });
    }

    return amounts;
  }, [budgets, filteredCategories, savingsGoals, month, year, type]);

  // Initialize local expected values
  useEffect(() => {
    const initial: Record<string, string> = {};
    rows.forEach(r => {
      const expected = expectedAmounts[r.key];
      initial[r.key] = expected > 0 ? expected.toString() : '';
    });
    setLocalExpected(initial);
  }, [expectedAmounts, rows]);


  const handleExpectedChange = (rowKey: string, value: string) => {
    setLocalExpected(prev => ({ ...prev, [rowKey]: value }));
  };

  const handleExpectedBlur = async (row: Row) => {
    const value = localExpected[row.key];
    const numValue = parseFloat(value) || 0;

    if (numValue >= 0) {
      await upsertBudget({
        ...(row.kind === 'savings'
          ? { savings_goal_id: row.id }
          : { category_id: row.id }),
        month,
        year,
        expected_amount: numValue,
      });
    }
  };

  const calculateProgress = (expected: number, actual: number) => {
    if (expected === 0) return 0;
    return Math.min((actual / expected) * 100, 100);
  };

  const getProgressColor = (expected: number, actual: number) => {
    if (expected === 0) return 'bg-primary';
    const progress = (actual / expected) * 100;
    if (type === 'expense') {
      if (progress > 100) return 'bg-red-500 dark:bg-red-600';
      if (progress === 100) return 'bg-green-500 dark:bg-green-600';
      if (progress > 80) return 'bg-yellow-500';
      return 'bg-primary';
    } else {
      if (progress < 50) return 'bg-yellow-500';
      if (progress >= 100) return 'bg-green-500';
      return 'bg-primary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate totals across all rows
  const totalExpected = useMemo(() => {
    return rows.reduce((sum, r) => sum + (expectedAmounts[r.key] || 0), 0);
  }, [rows, expectedAmounts]);

  const totalActual = useMemo(() => {
    return rows.reduce((sum, r) => sum + (actualAmounts[r.key] || 0), 0);
  }, [rows, actualAmounts]);

  const totalProgress = useMemo(() => {
    if (totalExpected === 0) return 0;

    return Math.round((totalActual / totalExpected) * 100);
  }, [totalExpected, totalActual]);

  const title = type === 'expense' ? 'Ringkasan Pengeluaran' : 'Ringkasan Pemasukan';
  const bgColor = type === 'expense' ? 'bg-red-50 dark:bg-red-950/20' : 'bg-green-50 dark:bg-green-950/20';
  const borderColor = type === 'expense' ? 'border-red-200 dark:border-red-800' : 'border-green-200 dark:border-green-800';

  // Copy only expected amounts to localStorage for pasting to other months
  const handleCopyExpected = () => {
    const budgetData: Record<string, { categoryName: string; amount: number }> = {};
    
    filteredCategories.forEach(cat => {
      const expected = expectedAmounts[cat.id] || 0;
      if (expected > 0) {
        budgetData[cat.id] = {
          categoryName: cat.name,
          amount: expected
        };
      }
    });

    const dataToStore = {
      type,
      sourceMonth: monthLabel,
      budgets: budgetData
    };

    localStorage.setItem(COPIED_BUDGET_KEY + '_' + type, JSON.stringify(dataToStore));
    
    toast({
      title: "Berhasil Disalin",
      description: `Target ${type === 'expense' ? 'pengeluaran' : 'pemasukan'} dari ${monthLabel} telah disalin. Pilih bulan lain dan klik Tempel.`,
    });
  };

  // Paste copied budget data to current month
  const handlePasteExpected = async () => {
    const stored = localStorage.getItem(COPIED_BUDGET_KEY + '_' + type);
    
    if (!stored) {
      toast({
        title: "Tidak Ada Data",
        description: "Belum ada data yang disalin. Salin terlebih dahulu dari bulan lain.",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = JSON.parse(stored);
      const budgetData = data.budgets as Record<string, { categoryName: string; amount: number }>;
      
      // Apply each budget to current month
      for (const [categoryId, budget] of Object.entries(budgetData)) {
        // Check if category still exists
        const categoryExists = filteredCategories.find(cat => cat.id === categoryId);
        if (categoryExists) {
          await upsertBudget({
            category_id: categoryId,
            month,
            year,
            expected_amount: budget.amount
          });
        }
      }

      toast({
        title: "Berhasil Ditempel",
        description: `Target ${type === 'expense' ? 'pengeluaran' : 'pemasukan'} dari ${data.sourceMonth} telah diterapkan ke ${monthLabel}.`,
      });
    } catch (error) {
      toast({
        title: "Gagal Menempel",
        description: "Terjadi kesalahan saat menerapkan data",
        variant: "destructive",
      });
    }
  };

  // Check if there's copied data available
  const hasCopiedData = useMemo(() => {
    const stored = localStorage.getItem(COPIED_BUDGET_KEY + '_' + type);
    return !!stored;
  }, [type]);

  if (loading) {
    return (
      <Card className={`${bgColor} ${borderColor}`}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${bgColor} ${borderColor}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyExpected}
            className="text-xs"
            title={`Salin Target ${type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}`}
          >
            <Copy className="h-3 w-3 mr-1" />
            Salin
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePasteExpected}
            className="text-xs"
            title={`Tempel Target ${type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}`}
          >
            <ClipboardPaste className="h-3 w-3 mr-1" />
            Tempel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-semibold">Kategori</th>
                <th className="text-right py-2 px-2 font-semibold">Yang Diharapkan</th>
                <th className="text-right py-2 px-2 font-semibold">Yang Sebenarnya</th>
                <th className="text-right py-2 px-2 font-semibold">Progress</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const expected = expectedAmounts[row.key] || 0;
                const actual = actualAmounts[row.key] || 0;
                const progress = calculateProgress(expected, actual);

                return (
                  <tr key={row.key} className="border-b border-border/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="font-medium">{row.name}</span>
                        {row.kind === 'savings' && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <PiggyBank className="h-3 w-3" />
                            Tabungan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        value={localExpected[row.key] || ''}
                        onChange={(e) => handleExpectedChange(row.key, e.target.value)}
                        onBlur={() => handleExpectedBlur(row)}
                        placeholder="0"
                        className="text-right h-8 w-32 ml-auto"
                      />
                    </td>
                    <td className="text-right py-3 px-2 font-medium">
                      {formatCurrency(actual)}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full transition-all ${getProgressColor(expected, actual)}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-12 text-right">
                          {expected > 0 ? `${Math.round((actual / expected) * 100)}%` : '0%'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-muted-foreground">
                    Tidak ada kategori {type === 'expense' ? 'pengeluaran' : 'pemasukan'}
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (

              <tfoot>
                <tr className="border-t-2 border-border bg-muted/50">
                  <td className="py-3 px-2 font-bold text-base">Total</td>
                  <td className="text-right py-3 px-2 font-bold text-base">
                    {formatCurrency(totalExpected)}
                  </td>
                  <td className="text-right py-3 px-2 font-bold text-base">
                    {formatCurrency(totalActual)}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div 
                          className={`h-full transition-all ${getProgressColor(totalExpected, totalActual)}`}
                          style={{ width: `${Math.min(totalProgress, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold w-12 text-right">
                        {totalProgress}%
                      </span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
