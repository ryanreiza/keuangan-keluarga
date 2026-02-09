import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Target,
  PieChart,
  BarChart3,
  Loader2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useFinancialData } from "@/hooks/useFinancialData";
import { Link } from "react-router-dom";
import MonthlyBudgetTracker from "@/components/MonthlyBudgetTracker";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  const { 
    transactions, 
    accounts, 
    savingsGoals, 
    debts, 
    categories,
    loading,
    refreshAllData 
  } = useFinancialData();

  // Generate month options based on actual transaction dates
  const monthOptions = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      // Return current month as default if no transactions
      return [{
        value: format(new Date(), 'yyyy-MM'),
        label: format(new Date(), 'MMMM yyyy', { locale: id })
      }];
    }

    // Extract unique months from transactions
    const uniqueMonths = new Set<string>();
    transactions.forEach(t => {
      const monthKey = t.transaction_date.slice(0, 7); // Get YYYY-MM
      uniqueMonths.add(monthKey);
    });

    // Convert to array and sort in descending order (newest first)
    const sortedMonths = Array.from(uniqueMonths).sort((a, b) => b.localeCompare(a));

    // Format for display
    return sortedMonths.map(monthKey => ({
      value: monthKey,
      label: format(new Date(monthKey + '-01'), 'MMMM yyyy', { locale: id })
    }));
  }, [transactions]);

  // Calculate real statistics for selected month
  const currentMonthTransactions = transactions.filter(t => {
    const transactionMonth = t.transaction_date.slice(0, 7);
    return transactionMonth === selectedMonth;
  });

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.current_balance, 0);
  const totalDebt = debts.filter(d => !d.is_paid_off).reduce((sum, d) => sum + d.remaining_amount, 0);

  // Calculate progress statistics
  const totalSavingsTarget = savingsGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalSavingsCurrent = savingsGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const activeSavingsGoals = savingsGoals.filter(goal => !goal.is_achieved);
  
  if (loading.transactions || loading.accounts || loading.savings || loading.debts || loading.categories) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      title: "Total Pemasukan",
      value: `Rp ${totalIncome.toLocaleString('id-ID')}`,
      change: "+8.5%",
      changeType: "increase" as const,
      icon: TrendingUp,
      bgColor: "bg-success-bg",
      iconColor: "text-success"
    },
    {
      title: "Total Pengeluaran", 
      value: `Rp ${totalExpense.toLocaleString('id-ID')}`,
      change: "-2.1%",
      changeType: "decrease" as const,
      icon: TrendingDown,
      bgColor: "bg-danger-bg",
      iconColor: "text-danger"
    },
    {
      title: "Saldo Tersedia",
      value: `Rp ${totalBalance.toLocaleString('id-ID')}`,
      change: "+15.2%",
      changeType: "increase" as const,
      icon: Wallet,
      bgColor: "bg-primary/10",
      iconColor: "text-primary"
    },
    {
      title: "Total Utang",
      value: `Rp ${totalDebt.toLocaleString('id-ID')}`,
      change: `${debts.filter(d => !d.is_paid_off).length} utang aktif`,
      changeType: "neutral" as const,
      icon: CreditCard,
      bgColor: "bg-warning-bg",
      iconColor: "text-warning"
    }
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard Keuangan</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Ringkasan keuangan {monthOptions.find(opt => opt.value === selectedMonth)?.label || ''}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36 md:w-40">
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
          <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90" size="sm">
            <DollarSign className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Tambah Transaksi</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-gradient-card shadow-card border-0">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1 truncate">{stat.title}</p>
                  <p className="text-lg md:text-2xl font-bold text-foreground truncate">{stat.value}</p>
                  <div className="flex items-center mt-1 md:mt-2">
                    {stat.changeType === "increase" && <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-success mr-0.5" />}
                    {stat.changeType === "decrease" && <ArrowDownRight className="h-3 w-3 md:h-4 md:w-4 text-danger mr-0.5" />}
                    <span className={`text-xs md:text-sm font-medium ${
                      stat.changeType === "increase" ? "text-success" : 
                      stat.changeType === "decrease" ? "text-danger" : "text-muted-foreground"
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-2 md:p-3 rounded-xl ${stat.bgColor} ml-2 flex-shrink-0`}>
                  <stat.icon className={`h-4 w-4 md:h-6 md:w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expense Summary Table */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-xl">Ringkasan Pengeluaran Bulanan</CardTitle>
          <CardDescription>Target vs Realisasi pengeluaran per kategori bulan ini</CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyBudgetTracker 
            type="expense" 
            categories={categories}
            transactions={currentMonthTransactions}
            selectedMonth={selectedMonth}
          />
        </CardContent>
      </Card>

      {/* Savings Goals */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="h-5 w-5" />
            Target Tabungan
          </CardTitle>
          <CardDescription>Progress target bulan ini</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {savingsGoals.map((goal, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">{goal.name}</p>
                <p className="text-sm text-muted-foreground">
                  {Math.round((goal.current_amount / goal.target_amount) * 100)}%
                </p>
              </div>
              <Progress 
                value={(goal.current_amount / goal.target_amount) * 100} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Rp {goal.current_amount.toLocaleString('id-ID')}
                </span>
                <span className="text-muted-foreground">
                  Rp {goal.target_amount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-xl">Aksi Cepat</CardTitle>
          <CardDescription>Fitur yang sering digunakan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <PieChart className="h-6 w-6" />
              <span className="text-sm">Analisis Kategori</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Laporan Bulanan</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Target className="h-6 w-6" />
              <span className="text-sm">Set Target Baru</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <CreditCard className="h-6 w-6" />
              <span className="text-sm">Rekening Baru</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}