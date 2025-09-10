import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Eye,
  CreditCard,
  Wallet,
  TrendingUp as GrowthIcon
} from "lucide-react";
import { useState, useMemo } from "react";
import { useFinancialData } from "@/hooks/useFinancialData";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, isSameDay, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Monthly() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const { transactions, accounts, savingsGoals, categories, loading } = useFinancialData();

  // Calculate current and previous month data
  const monthlyData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        currentMonth: {
          totalIncome: 0,
          totalExpense: 0,
          totalSavings: 0,
          transactionCount: 0,
          dailyData: [],
          categoryBreakdown: [],
          accountActivity: []
        },
        previousMonth: {
          totalIncome: 0,
          totalExpense: 0,
          totalSavings: 0
        },
        growth: {
          income: 0,
          expense: 0,
          savings: 0
        }
      };
    }

    const currentDate = new Date(selectedMonth + '-01');
    const previousDate = subMonths(currentDate, 1);
    
    const currentMonthStart = startOfMonth(currentDate);
    const currentMonthEnd = endOfMonth(currentDate);
    const previousMonthStart = startOfMonth(previousDate);
    const previousMonthEnd = endOfMonth(previousDate);

    // Filter transactions for current month
    const currentTransactions = transactions.filter(t => {
      const transactionDate = parseISO(t.transaction_date);
      return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
    });

    // Filter transactions for previous month
    const previousTransactions = transactions.filter(t => {
      const transactionDate = parseISO(t.transaction_date);
      return transactionDate >= previousMonthStart && transactionDate <= previousMonthEnd;
    });

    // Calculate current month metrics
    const currentIncome = currentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const currentExpense = currentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate previous month metrics
    const previousIncome = previousTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const previousExpense = previousTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentSavings = currentIncome - currentExpense;
    const previousSavings = previousIncome - previousExpense;

    // Calculate growth percentages
    const incomeGrowth = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome * 100) : 0;
    const expenseGrowth = previousExpense > 0 ? ((currentExpense - previousExpense) / previousExpense * 100) : 0;
    const savingsGrowth = previousSavings > 0 ? ((currentSavings - previousSavings) / previousSavings * 100) : 0;

    // Generate daily data for the current month
    const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });
    const dailyData = daysInMonth.map(day => {
      const dayTransactions = currentTransactions.filter(t => 
        isSameDay(parseISO(t.transaction_date), day)
      );
      
      const dayIncome = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const dayExpense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        date: format(day, 'dd'),
        income: dayIncome,
        expense: dayExpense,
        net: dayIncome - dayExpense
      };
    });

    // Category breakdown for expenses
    const categoryMap = new Map();
    currentTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const categoryName = t.categories?.name || 'Lainnya';
        const current = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, current + Number(t.amount));
      });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: currentExpense > 0 ? (amount / currentExpense * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    // Account activity
    const accountMap = new Map();
    currentTransactions.forEach(t => {
      const accountName = t.accounts?.name || 'Unknown Account';
      const current = accountMap.get(accountName) || { income: 0, expense: 0, transactions: 0 };
      
      if (t.type === 'income') {
        current.income += Number(t.amount);
      } else {
        current.expense += Number(t.amount);
      }
      current.transactions += 1;
      
      accountMap.set(accountName, current);
    });

    const accountActivity = Array.from(accountMap.entries())
      .map(([account, data]) => ({
        account,
        ...data,
        net: data.income - data.expense
      }))
      .sort((a, b) => b.transactions - a.transactions);

    return {
      currentMonth: {
        totalIncome: currentIncome,
        totalExpense: currentExpense,
        totalSavings: currentSavings,
        transactionCount: currentTransactions.length,
        dailyData,
        categoryBreakdown,
        accountActivity
      },
      previousMonth: {
        totalIncome: previousIncome,
        totalExpense: previousExpense,
        totalSavings: previousSavings
      },
      growth: {
        income: incomeGrowth,
        expense: expenseGrowth,
        savings: savingsGrowth
      }
    };
  }, [transactions, selectedMonth]);

  // Generate month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: id })
      });
    }
    return options;
  }, []);

  const savingsRate = monthlyData.currentMonth.totalIncome > 0 
    ? (monthlyData.currentMonth.totalSavings / monthlyData.currentMonth.totalIncome * 100) 
    : 0;

  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.current_balance), 0) || 0;
  const totalSavingsGoals = savingsGoals?.reduce((sum, goal) => sum + Number(goal.current_amount), 0) || 0;

  if (loading.transactions || loading.accounts || loading.categories) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat data dashboard bulanan...</p>
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
          <h1 className="text-3xl font-bold text-foreground">Dashboard Bulanan</h1>
          <p className="text-muted-foreground mt-1">Analisis keuangan bulanan dan tren harian</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-success shadow-card border-0">
          <CardContent className="p-6 text-success-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Pemasukan Bulan Ini</p>
                <p className="text-2xl font-bold">Rp {monthlyData.currentMonth.totalIncome.toLocaleString('id-ID')}</p>
                <div className="flex items-center mt-2">
                  {monthlyData.growth.income >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-sm font-medium">
                    {monthlyData.growth.income >= 0 ? '+' : ''}{monthlyData.growth.income.toFixed(1)}% vs bulan lalu
                  </span>
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
                <p className="text-sm text-muted-foreground mb-1">Pengeluaran Bulan Ini</p>
                <p className="text-2xl font-bold text-danger">Rp {monthlyData.currentMonth.totalExpense.toLocaleString('id-ID')}</p>
                <div className="flex items-center mt-2">
                  {monthlyData.growth.expense >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 mr-1 text-danger" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1 text-success" />
                  )}
                  <span className={`text-sm font-medium ${monthlyData.growth.expense >= 0 ? 'text-danger' : 'text-success'}`}>
                    {monthlyData.growth.expense >= 0 ? '+' : ''}{monthlyData.growth.expense.toFixed(1)}% vs bulan lalu
                  </span>
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
                <p className="text-sm opacity-90 mb-1">Saldo Tabungan</p>
                <p className="text-2xl font-bold">Rp {monthlyData.currentMonth.totalSavings.toLocaleString('id-ID')}</p>
                <div className="flex items-center mt-2">
                  {monthlyData.growth.savings >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-sm font-medium">
                    {monthlyData.growth.savings >= 0 ? '+' : ''}{monthlyData.growth.savings.toFixed(1)}% vs bulan lalu
                  </span>
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
                <p className="text-sm text-muted-foreground mb-1">Total Transaksi</p>
                <p className="text-2xl font-bold text-foreground">{monthlyData.currentMonth.transactionCount}</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-muted-foreground">bulan ini</span>
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend Chart */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-xl">Tren Harian {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: id })}</CardTitle>
          <CardDescription>Perbandingan pemasukan dan pengeluaran harian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-end justify-between gap-1 p-4 overflow-x-auto">
            {monthlyData.currentMonth.dailyData.map((day, index) => {
              const maxValue = Math.max(
                ...monthlyData.currentMonth.dailyData.map(d => Math.max(d.income, d.expense))
              );
              const incomeHeight = maxValue > 0 ? (day.income / maxValue) * 100 : 0;
              const expenseHeight = maxValue > 0 ? (day.expense / maxValue) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex justify-center items-end gap-0.5 h-64 min-w-[20px]">
                    <div 
                      className="bg-success w-2 rounded-t-sm"
                      style={{ height: `${incomeHeight}%` }}
                      title={`${day.date}: Pemasukan Rp ${day.income.toLocaleString('id-ID')}`}
                    ></div>
                    <div 
                      className="bg-danger w-2 rounded-t-sm"
                      style={{ height: `${expenseHeight}%` }}
                      title={`${day.date}: Pengeluaran Rp ${day.expense.toLocaleString('id-ID')}`}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{day.date}</span>
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
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-xl">Pengeluaran per Kategori</CardTitle>
            <CardDescription>Distribusi pengeluaran bulan ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyData.currentMonth.categoryBreakdown.length > 0 ? (
              monthlyData.currentMonth.categoryBreakdown.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{category.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{category.percentage.toFixed(1)}%</span>
                      <span className="text-sm font-medium text-foreground">
                        Rp {category.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada data pengeluaran bulan ini</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Activity */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-xl">Aktivitas Rekening</CardTitle>
            <CardDescription>Ringkasan transaksi per rekening bulan ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyData.currentMonth.accountActivity.length > 0 ? (
              monthlyData.currentMonth.accountActivity.map((account, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{account.account}</p>
                        <p className="text-xs text-muted-foreground">{account.transactions} transaksi</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${account.net >= 0 ? 'text-success' : 'text-danger'}`}>
                        {account.net >= 0 ? '+' : ''}Rp {account.net.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-muted-foreground">net flow</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Masuk</p>
                      <p className="font-medium text-success">+Rp {account.income.toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Keluar</p>
                      <p className="font-medium text-danger">-Rp {account.expense.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada aktivitas rekening bulan ini</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Health & Insights */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-xl">Kesehatan Finansial & Insight</CardTitle>
          <CardDescription>Analisis dan rekomendasi berdasarkan data bulan ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Savings Rate */}
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <Target className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Rasio Tabungan</p>
              <p className="text-2xl font-bold text-primary">{savingsRate.toFixed(1)}%</p>
              <Badge className={`mt-2 ${savingsRate >= 20 ? "bg-success" : savingsRate >= 10 ? "bg-warning" : "bg-danger"}`}>
                {savingsRate >= 20 ? "Excellent" : savingsRate >= 10 ? "Good" : "Perlu Perbaikan"}
              </Badge>
            </div>

            {/* Total Balance */}
            <div className="p-4 bg-success/10 rounded-lg text-center">
              <Wallet className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Total Saldo Rekening</p>
              <p className="text-2xl font-bold text-success">Rp {totalBalance.toLocaleString('id-ID')}</p>
              <p className="text-xs text-muted-foreground mt-1">dari {accounts?.length || 0} rekening</p>
            </div>

            {/* Savings Goals */}
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <GrowthIcon className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Total Target Tabungan</p>
              <p className="text-2xl font-bold text-primary">Rp {totalSavingsGoals.toLocaleString('id-ID')}</p>
              <p className="text-xs text-muted-foreground mt-1">{savingsGoals?.length || 0} target aktif</p>
            </div>

            {/* Monthly Growth */}
            <div className="p-4 bg-gradient-card rounded-lg text-center">
              <Calendar className="h-8 w-8 text-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Pertumbuhan Bulanan</p>
              <p className={`text-2xl font-bold ${monthlyData.growth.savings >= 0 ? 'text-success' : 'text-danger'}`}>
                {monthlyData.growth.savings >= 0 ? '+' : ''}{monthlyData.growth.savings.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">vs bulan sebelumnya</p>
            </div>
          </div>

          {/* Insights */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-foreground mb-3">💡 Insight & Rekomendasi</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {savingsRate < 10 && (
                <p>• Rasio tabungan Anda masih di bawah 10%. Cobalah untuk mengurangi pengeluaran atau meningkatkan pendapatan.</p>
              )}
              {monthlyData.growth.expense > 20 && (
                <p>• Pengeluaran bulan ini meningkat signifikan ({monthlyData.growth.expense.toFixed(1)}%). Periksa kategori pengeluaran terbesar.</p>
              )}
              {monthlyData.currentMonth.totalIncome > monthlyData.currentMonth.totalExpense && (
                <p>• Bagus! Anda berhasil menghemat Rp {monthlyData.currentMonth.totalSavings.toLocaleString('id-ID')} bulan ini.</p>
              )}
              {monthlyData.currentMonth.transactionCount < 5 && (
                <p>• Jumlah transaksi bulan ini masih sedikit. Pastikan Anda mencatat semua pemasukan dan pengeluaran.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}