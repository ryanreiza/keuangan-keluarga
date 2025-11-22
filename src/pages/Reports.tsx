import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useMonthlyBudgets } from '@/hooks/useMonthlyBudgets';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subMonths, startOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileBarChart } from 'lucide-react';

export default function Reports() {
  const [monthsToShow, setMonthsToShow] = useState<number>(6);
  const [viewType, setViewType] = useState<'expense' | 'income'>('expense');
  
  const { transactions, categories, loading: dataLoading } = useFinancialData();
  const { budgets, loading: budgetsLoading } = useMonthlyBudgets();

  // Generate array of last N months
  const monthsArray = useMemo(() => {
    const months = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = subMonths(startOfMonth(new Date()), i);
      months.push({
        date,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: format(date, 'MMM yyyy', { locale: id })
      });
    }
    return months;
  }, [monthsToShow]);

  // Calculate data for charts
  const chartData = useMemo(() => {
    const filteredCategories = categories.filter(cat => cat.type === viewType);
    
    return monthsArray.map(({ date, month, year, label }) => {
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.transaction_date);
        return tDate.getMonth() + 1 === month && 
               tDate.getFullYear() === year && 
               t.type === viewType;
      });

      let totalActual = 0;
      let totalExpected = 0;

      filteredCategories.forEach(cat => {
        const categoryTransactions = monthTransactions.filter(t => t.category_id === cat.id);
        const actualAmount = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        
        const budget = budgets.find(
          b => b.category_id === cat.id && b.month === month && b.year === year
        );
        const expectedAmount = budget?.expected_amount || 0;

        totalActual += actualAmount;
        totalExpected += expectedAmount;
      });

      return {
        month: label,
        actual: totalActual,
        expected: totalExpected,
        difference: totalActual - totalExpected
      };
    });
  }, [monthsArray, transactions, categories, budgets, viewType]);

  // Calculate category breakdown for current period
  const categoryData = useMemo(() => {
    const filteredCategories = categories.filter(cat => cat.type === viewType);
    const lastMonth = monthsArray[monthsArray.length - 1];
    
    if (!lastMonth) return [];

    return filteredCategories.map(cat => {
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.transaction_date);
        return tDate.getMonth() + 1 === lastMonth.month && 
               tDate.getFullYear() === lastMonth.year && 
               t.type === viewType &&
               t.category_id === cat.id;
      });

      const actualAmount = monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      
      const budget = budgets.find(
        b => b.category_id === cat.id && 
        b.month === lastMonth.month && 
        b.year === lastMonth.year
      );
      const expectedAmount = budget?.expected_amount || 0;

      return {
        name: cat.name,
        actual: actualAmount,
        expected: expectedAmount,
        color: cat.color || '#3B82F6'
      };
    }).filter(item => item.actual > 0 || item.expected > 0);
  }, [categories, transactions, budgets, viewType, monthsArray]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (dataLoading || budgetsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <FileBarChart className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Laporan Keuangan</h1>
            <p className="text-muted-foreground">Analisis perbandingan budget vs aktual</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Tipe</label>
            <Select value={viewType} onValueChange={(value: 'expense' | 'income') => setViewType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Pengeluaran</SelectItem>
                <SelectItem value="income">Pemasukan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Periode</label>
            <Select value={monthsToShow.toString()} onValueChange={(value) => setMonthsToShow(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Bulan</SelectItem>
                <SelectItem value="6">6 Bulan</SelectItem>
                <SelectItem value="12">12 Bulan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Budget vs Actual Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Tren Budget vs Aktual</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="expected" 
                name="Yang Diharapkan" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                name="Yang Sebenarnya" 
                stroke={viewType === 'expense' ? '#ef4444' : '#22c55e'} 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Comparison Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Perbandingan Bulanan</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="expected" 
                name="Yang Diharapkan" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="actual" 
                name="Yang Sebenarnya" 
                fill={viewType === 'expense' ? '#ef4444' : '#22c55e'} 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown for Latest Month */}
      {categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Perbandingan per Kategori ({monthsArray[monthsArray.length - 1]?.label})</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={categoryData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`}
                />
                <YAxis 
                  type="category"
                  dataKey="name" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="expected" 
                  name="Yang Diharapkan" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                />
                <Bar 
                  dataKey="actual" 
                  name="Yang Sebenarnya" 
                  fill={viewType === 'expense' ? '#ef4444' : '#22c55e'} 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Yang Diharapkan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(chartData.reduce((sum, item) => sum + item.expected, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Yang Sebenarnya</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${viewType === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
              {formatCurrency(chartData.reduce((sum, item) => sum + item.actual, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selisih Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${
              chartData.reduce((sum, item) => sum + item.difference, 0) > 0 
                ? 'text-red-500' 
                : 'text-green-500'
            }`}>
              {formatCurrency(Math.abs(chartData.reduce((sum, item) => sum + item.difference, 0)))}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
