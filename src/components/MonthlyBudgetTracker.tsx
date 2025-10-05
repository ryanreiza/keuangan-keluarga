import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMonthlyBudgets } from '@/hooks/useMonthlyBudgets';
import { Category } from '@/hooks/useCategories';
import { Transaction } from '@/hooks/useTransactions';
import { Skeleton } from '@/components/ui/skeleton';

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

  const month = parseInt(selectedMonth.split('-')[1]);
  const year = parseInt(selectedMonth.split('-')[0]);

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
    const progress = (actual / expected) * 100;
    if (type === 'expense') {
      if (progress > 100) return 'bg-destructive';
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

  const title = type === 'expense' ? 'Ringkasan Pengeluaran' : 'Ringkasan Pemasukan';
  const bgColor = type === 'expense' ? 'bg-red-50 dark:bg-red-950/20' : 'bg-green-50 dark:bg-green-950/20';
  const borderColor = type === 'expense' ? 'border-red-200 dark:border-red-800' : 'border-green-200 dark:border-green-800';

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
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
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
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
