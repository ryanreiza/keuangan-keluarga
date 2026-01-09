import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMonthlyBudgets } from '@/hooks/useMonthlyBudgets';
import { Category } from '@/hooks/useCategories';
import { Transaction } from '@/hooks/useTransactions';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, ClipboardPaste } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

// Storage key for copied budget data
const COPIED_BUDGET_KEY = 'copiedBudgetData';

interface MonthlyBudgetTrackerProps {
  categories: Category[];
  transactions: Transaction[];
  selectedMonth: string; // Format: yyyy-MM
  type: 'income' | 'expense';
}

export default function MonthlyBudgetTracker({ 
  categories, 
  transactions, 
  selectedMonth,
  type 
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

  // Calculate actual amounts from transactions
  const actualAmounts = useMemo(() => {
    const amounts: Record<string, number> = {};
    
    filteredCategories.forEach(cat => {
      const categoryTransactions = transactions.filter(
        t => t.category_id === cat.id && t.type === type
      );
      amounts[cat.id] = categoryTransactions.reduce(
        (sum, t) => sum + Number(t.amount), 
        0
      );
    });
    
    return amounts;
  }, [transactions, filteredCategories, type]);

  // Get expected amounts from budgets
  const expectedAmounts = useMemo(() => {
    const amounts: Record<string, number> = {};
    
    filteredCategories.forEach(cat => {
      const budget = budgets.find(
        b => b.category_id === cat.id && b.month === month && b.year === year
      );
      amounts[cat.id] = budget?.expected_amount || 0;
    });
    
    return amounts;
  }, [budgets, filteredCategories, month, year]);

  // Initialize local expected values
  useEffect(() => {
    const initial: Record<string, string> = {};
    filteredCategories.forEach(cat => {
      const expected = expectedAmounts[cat.id];
      initial[cat.id] = expected > 0 ? expected.toString() : '';
    });
    setLocalExpected(initial);
  }, [expectedAmounts, filteredCategories]);

  // Show notification for categories exceeding budget (>100%)
  useEffect(() => {
    if (type !== 'expense') return;
    
    const overBudgetCategories = filteredCategories.filter(cat => {
      const expected = expectedAmounts[cat.id] || 0;
      const actual = actualAmounts[cat.id] || 0;
      return expected > 0 && actual > expected;
    });

    if (overBudgetCategories.length > 0) {
      const categoryNames = overBudgetCategories.map(cat => {
        const expected = expectedAmounts[cat.id];
        const actual = actualAmounts[cat.id];
        const percentage = Math.round((actual / expected) * 100);
        return `${cat.name} (${percentage}%)`;
      }).join(', ');

      toast({
        title: "⚠️ Peringatan Budget",
        description: `Kategori melebihi budget: ${categoryNames}`,
        variant: "destructive",
      });
    }
  }, [filteredCategories, expectedAmounts, actualAmounts, type, toast, selectedMonth]);

  const handleExpectedChange = (categoryId: string, value: string) => {
    setLocalExpected(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleExpectedBlur = async (categoryId: string) => {
    const value = localExpected[categoryId];
    const numValue = parseFloat(value) || 0;
    
    if (numValue >= 0) {
      await upsertBudget({
        category_id: categoryId,
        month,
        year,
        expected_amount: numValue
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

  // Calculate totals
  const totalExpected = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + (expectedAmounts[cat.id] || 0), 0);
  }, [filteredCategories, expectedAmounts]);

  const totalActual = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + (actualAmounts[cat.id] || 0), 0);
  }, [filteredCategories, actualAmounts]);

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
              {filteredCategories.map((category) => {
                const expected = expectedAmounts[category.id] || 0;
                const actual = actualAmounts[category.id] || 0;
                const progress = calculateProgress(expected, actual);
                const progressColor = getProgressColor(expected, actual);

                return (
                  <tr key={category.id} className="border-b border-border/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        value={localExpected[category.id] || ''}
                        onChange={(e) => handleExpectedChange(category.id, e.target.value)}
                        onBlur={() => handleExpectedBlur(category.id)}
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
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-muted-foreground">
                    Tidak ada kategori {type === 'expense' ? 'pengeluaran' : 'pemasukan'}
                  </td>
                </tr>
              )}
            </tbody>
            {filteredCategories.length > 0 && (
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
