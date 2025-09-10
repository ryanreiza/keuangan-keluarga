import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Target,
  PieChart,
  BarChart3,
  Download,
  Eye
} from "lucide-react";
import { useState, useMemo } from "react";
import { useFinancialData } from "@/hooks/useFinancialData";
import { format, startOfYear, endOfYear, eachMonthOfInterval, subYears, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Annual() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const { transactions, accounts, savingsGoals, categories, loading } = useFinancialData();

  // Calculate annual data from real transactions
  const annualData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        currentYear: {
          totalIncome: 0,
          totalExpense: 0,
          totalSavings: 0,
          monthlyAverage: { income: 0, expense: 0, savings: 0 },
          monthlyData: [],
          categoryExpenses: []
        },
        previousYear: {
          totalIncome: 0,
          totalExpense: 0,
          totalSavings: 0
        }
      };
    }

    const currentYear = parseInt(selectedYear);
    const previousYear = currentYear - 1;
    
    const currentYearStart = startOfYear(new Date(currentYear, 0, 1));
    const currentYearEnd = endOfYear(new Date(currentYear, 0, 1));
    const previousYearStart = startOfYear(new Date(previousYear, 0, 1));
    const previousYearEnd = endOfYear(new Date(previousYear, 0, 1));

    // Filter transactions for current year
    const currentYearTransactions = transactions.filter(t => {
      const transactionDate = parseISO(t.transaction_date);
      return transactionDate >= currentYearStart && transactionDate <= currentYearEnd;
    });

    // Filter transactions for previous year
    const previousYearTransactions = transactions.filter(t => {
      const transactionDate = parseISO(t.transaction_date);
      return transactionDate >= previousYearStart && transactionDate <= previousYearEnd;
    });

    // Calculate current year metrics
    const currentIncome = currentYearTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const currentExpense = currentYearTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentSavings = currentIncome - currentExpense;

    // Calculate previous year metrics
    const previousIncome = previousYearTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const previousExpense = previousYearTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const previousSavings = previousIncome - previousExpense;

    // Generate monthly data for current year
    const monthsInYear = eachMonthOfInterval({ start: currentYearStart, end: currentYearEnd });
    const monthlyData = monthsInYear.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = currentYearTransactions.filter(t => {
        const transactionDate = parseISO(t.transaction_date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
      
      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const monthExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        month: format(month, 'MMM'),
        income: monthIncome,
        expense: monthExpense,
        savings: monthIncome - monthExpense
      };
    });

    // Category breakdown for expenses
    const categoryMap = new Map();
    currentYearTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const categoryName = t.categories?.name || 'Lainnya';
        const current = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, current + Number(t.amount));
      });

    const categoryExpenses = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: currentExpense > 0 ? (amount / currentExpense * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    // Monthly averages
    const monthlyAverage = {
      income: monthlyData.length > 0 ? currentIncome / monthlyData.length : 0,
      expense: monthlyData.length > 0 ? currentExpense / monthlyData.length : 0,
      savings: monthlyData.length > 0 ? currentSavings / monthlyData.length : 0
    };

    return {
      currentYear: {
        totalIncome: currentIncome,
        totalExpense: currentExpense,
        totalSavings: currentSavings,
        monthlyAverage,
        monthlyData,
        categoryExpenses
      },
      previousYear: {
        totalIncome: previousIncome,
        totalExpense: previousExpense,
        totalSavings: previousSavings
      }
    };
  }, [transactions, selectedYear]);

  // Generate year options (current year and 4 previous years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const options = [];
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      options.push(year.toString());
    }
    return options;
  }, []);

  const { currentYear: currentYearData, previousYear: previousYearData } = annualData;

  const incomeGrowth = previousYearData.totalIncome > 0 
    ? ((currentYearData.totalIncome - previousYearData.totalIncome) / previousYearData.totalIncome * 100)
    : 0;

  const expenseGrowth = previousYearData.totalExpense > 0
    ? ((currentYearData.totalExpense - previousYearData.totalExpense) / previousYearData.totalExpense * 100)
    : 0;

  const savingsGrowth = previousYearData.totalSavings !== 0
    ? ((currentYearData.totalSavings - previousYearData.totalSavings) / Math.abs(previousYearData.totalSavings) * 100)
    : 0;

  const savingsRate = currentYearData.totalIncome > 0 ? (currentYearData.totalSavings / currentYearData.totalIncome) * 100 : 0;

  if (loading.transactions || loading.accounts || loading.categories) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat data dashboard tahunan...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Tahunan</h1>
          <p className="text-muted-foreground mt-1">Analisis dan perbandingan keuangan tahunan</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            <Eye className="h-4 w-4 mr-2" />
            Lihat Detail
          </Button>
        </div>
      </div>

      {/* Annual Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-success shadow-card border-0">
          <CardContent className="p-6 text-success-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total Pemasukan {selectedYear}</p>
                <p className="text-2xl font-bold">Rp {currentYearData.totalIncome.toLocaleString('id-ID')}</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">+{incomeGrowth.toFixed(1)}% vs tahun lalu</span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Pengeluaran {selectedYear}</p>
                <p className="text-2xl font-bold text-danger">Rp {currentYearData.totalExpense.toLocaleString('id-ID')}</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 mr-1 text-danger" />
                  <span className="text-sm font-medium text-danger">+{expenseGrowth.toFixed(1)}% vs tahun lalu</span>
                </div>
              </div>
              <TrendingDown className="h-8 w-8 text-danger" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-primary shadow-card border-0">
          <CardContent className="p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total Tabungan {selectedYear}</p>
                <p className="text-2xl font-bold">Rp {currentYearData.totalSavings.toLocaleString('id-ID')}</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">+{savingsGrowth.toFixed(1)}% vs tahun lalu</span>
                </div>
              </div>
              <Target className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rasio Tabungan</p>
                <p className="text-2xl font-bold text-foreground">{savingsRate.toFixed(1)}%</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-muted-foreground">dari total pemasukan</span>
                </div>
              </div>
              <PieChart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-xl">Tren Bulanan Tahun {selectedYear}</CardTitle>
          <CardDescription>Perbandingan pemasukan, pengeluaran, dan tabungan per bulan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-end justify-between gap-2 p-4">
            {currentYearData.monthlyData?.map((month, index) => {
              const maxValue = Math.max(...currentYearData.monthlyData.map(m => Math.max(m.income, m.expense, m.savings)));
              const incomeHeight = (month.income / maxValue) * 100;
              const expenseHeight = (month.expense / maxValue) * 100;
              const savingsHeight = (month.savings / maxValue) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex justify-center items-end gap-1 h-64">
                    <div 
                      className="bg-success w-4 rounded-t-sm"
                      style={{ height: `${incomeHeight}%` }}
                      title={`Pemasukan: Rp ${month.income.toLocaleString('id-ID')}`}
                    ></div>
                    <div 
                      className="bg-danger w-4 rounded-t-sm"
                      style={{ height: `${expenseHeight}%` }}
                      title={`Pengeluaran: Rp ${month.expense.toLocaleString('id-ID')}`}
                    ></div>
                    <div 
                      className="bg-primary w-4 rounded-t-sm"
                      style={{ height: `${savingsHeight}%` }}
                      title={`Tabungan: Rp ${month.savings.toLocaleString('id-ID')}`}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{month.month}</span>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-success rounded"></div>
              <span className="text-sm text-muted-foreground">Pemasukan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-danger rounded"></div>
              <span className="text-sm text-muted-foreground">Pengeluaran</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded"></div>
              <span className="text-sm text-muted-foreground">Tabungan</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-xl">Pengeluaran per Kategori {selectedYear}</CardTitle>
            <CardDescription>Distribusi pengeluaran berdasarkan kategori</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentYearData.categoryExpenses?.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{category.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{category.percentage}%</span>
                    <span className="text-sm font-medium text-foreground">
                      Rp {category.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Monthly Averages */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-xl">Rata-rata Bulanan {selectedYear}</CardTitle>
            <CardDescription>Nilai rata-rata per bulan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-success-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success rounded-lg">
                    <ArrowUpRight className="h-5 w-5 text-success-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-success-foreground">Rata-rata Pemasukan</p>
                    <p className="text-xs text-success-foreground/70">per bulan</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-success-foreground">
                  Rp {currentYearData.monthlyAverage.income.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-danger-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-danger rounded-lg">
                    <ArrowDownRight className="h-5 w-5 text-danger-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-danger-foreground">Rata-rata Pengeluaran</p>
                    <p className="text-xs text-danger-foreground/70">per bulan</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-danger-foreground">
                  Rp {currentYearData.monthlyAverage.expense.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-lg">
                    <Target className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary">Rata-rata Tabungan</p>
                    <p className="text-xs text-primary/70">per bulan</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-primary">
                  Rp {currentYearData.monthlyAverage.savings.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Financial Health Score */}
            <div className="pt-4 border-t border-border">
              <h4 className="font-semibold text-foreground mb-3">Skor Kesehatan Finansial</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rasio Tabungan</span>
                  <Badge className={savingsRate >= 20 ? "bg-success-bg text-success-foreground" : savingsRate >= 10 ? "bg-warning-bg text-warning-foreground" : "bg-danger-bg text-danger-foreground"}>
                    {savingsRate >= 20 ? "Excellent" : savingsRate >= 10 ? "Good" : "Needs Improvement"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Konsistensi Menabung</span>
                  <Badge className="bg-success-bg text-success-foreground">Consistent</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tren Pemasukan</span>
                  <Badge className="bg-success-bg text-success-foreground">Growing</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year-over-Year Comparison */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-xl">Perbandingan Tahun ke Tahun</CardTitle>
          <CardDescription>Pertumbuhan keuangan dibanding tahun sebelumnya</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-surface rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
              <p className="text-2xl font-bold text-success mb-1">+{incomeGrowth.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Pertumbuhan Pemasukan</p>
              <p className="text-xs text-muted-foreground mt-1">vs tahun {parseInt(selectedYear) - 1}</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-surface rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingDown className="h-8 w-8 text-danger" />
              </div>
              <p className="text-2xl font-bold text-danger mb-1">+{expenseGrowth.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Pertumbuhan Pengeluaran</p>
              <p className="text-xs text-muted-foreground mt-1">vs tahun {parseInt(selectedYear) - 1}</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-surface rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary mb-1">+{savingsGrowth.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Pertumbuhan Tabungan</p>
              <p className="text-xs text-muted-foreground mt-1">vs tahun {parseInt(selectedYear) - 1}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}