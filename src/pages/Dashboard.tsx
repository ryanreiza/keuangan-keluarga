import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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
  Loader2,
  Plus,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useFinancialData } from "@/hooks/useFinancialData";
import MonthlyBudgetTracker from "@/components/MonthlyBudgetTracker";
import { StaggerContainer, StaggerItem } from "@/components/StaggerItem";
import { EmptyState } from "@/components/EmptyState";
import { useState, useMemo } from "react";
import { format, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  const {
    transactions,
    accounts,
    savingsGoals,
    debts,
    categories,
    loading,
  } = useFinancialData();

  const monthOptions = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [{
        value: format(new Date(), "yyyy-MM"),
        label: format(new Date(), "MMMM yyyy", { locale: id })
      }];
    }
    const uniqueMonths = new Set<string>();
    transactions.forEach((t) => uniqueMonths.add(t.transaction_date.slice(0, 7)));
    return Array.from(uniqueMonths)
      .sort((a, b) => b.localeCompare(a))
      .map((m) => ({
        value: m,
        label: format(new Date(m + "-01"), "MMMM yyyy", { locale: id }),
      }));
  }, [transactions]);

  const currentMonthTransactions = useMemo(
    () => transactions.filter((t) => t.transaction_date.slice(0, 7) === selectedMonth),
    [transactions, selectedMonth]
  );

  const totalIncome = currentMonthTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = currentMonthTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalBalance = accounts.reduce((s, a) => s + a.current_balance, 0);
  const totalDebt = debts.filter((d) => !d.is_paid_off).reduce((s, d) => s + d.remaining_amount, 0);

  // Previous month comparison
  const prevMonthKey = format(subMonths(new Date(selectedMonth + "-01"), 1), "yyyy-MM");
  const prevMonthTx = useMemo(
    () => transactions.filter((t) => t.transaction_date.slice(0, 7) === prevMonthKey),
    [transactions, prevMonthKey]
  );
  const prevIncome = prevMonthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const calcChange = (curr: number, prev: number): { pct: number; type: "increase" | "decrease" | "neutral" } | null => {
    if (prev === 0 && curr === 0) return null;
    if (prev === 0) return { pct: 100, type: "increase" };
    const pct = ((curr - prev) / prev) * 100;
    return {
      pct: Math.abs(pct),
      type: pct > 0.5 ? "increase" : pct < -0.5 ? "decrease" : "neutral",
    };
  };

  // Sparkline data: last 6 months income/expense per type
  const sparklineData = useMemo(() => {
    const months: { key: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const k = format(subMonths(new Date(selectedMonth + "-01"), i), "yyyy-MM");
      const tx = transactions.filter((t) => t.transaction_date.slice(0, 7) === k);
      months.push({
        key: k,
        income: tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expense: tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [transactions, selectedMonth]);

  const incomeChange = calcChange(totalIncome, prevIncome);
  const expenseChange = calcChange(totalExpense, prevExpense);

  if (loading.transactions || loading.accounts || loading.savings || loading.debts || loading.categories) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      title: "Total Pemasukan",
      value: totalIncome,
      change: incomeChange,
      icon: TrendingUp,
      bgColor: "bg-success-bg",
      iconColor: "text-success",
      sparkColor: "hsl(var(--success))",
      sparkData: sparklineData.map((m) => ({ value: m.income })),
    },
    {
      title: "Total Pengeluaran",
      value: totalExpense,
      change: expenseChange,
      icon: TrendingDown,
      bgColor: "bg-danger-bg",
      iconColor: "text-danger",
      sparkColor: "hsl(var(--danger))",
      sparkData: sparklineData.map((m) => ({ value: m.expense })),
      // For expense: increase is BAD (red), decrease is GOOD (green) — invert visually
      invertChange: true,
    },
    {
      title: "Saldo Tersedia",
      value: totalBalance,
      change: null,
      subText: `${accounts.length} rekening aktif`,
      icon: Wallet,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
      sparkColor: "hsl(var(--primary))",
      sparkData: null,
    },
    {
      title: "Total Utang",
      value: totalDebt,
      change: null,
      subText: `${debts.filter((d) => !d.is_paid_off).length} utang aktif`,
      icon: CreditCard,
      bgColor: "bg-warning-bg",
      iconColor: "text-warning",
      sparkColor: "hsl(var(--warning))",
      sparkData: null,
    },
  ];

  const quickActions = [
    { icon: PieChart, label: "Analisis Kategori", to: "/categories", gradient: "from-primary to-primary-light" },
    { icon: BarChart3, label: "Laporan Bulanan", to: "/reports", gradient: "from-accent-brand to-success-light" },
    { icon: Target, label: "Set Target Baru", to: "/savings", gradient: "from-warning to-warning-light" },
    { icon: CreditCard, label: "Rekening Baru", to: "/accounts", gradient: "from-primary-dark to-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground tracking-tight">
            Dashboard Keuangan
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Ringkasan keuangan {monthOptions.find((opt) => opt.value === selectedMonth)?.label || ""}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36 md:w-44 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant"
            size="sm"
            onClick={() => navigate("/transactions")}
          >
            <Plus className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Tambah Transaksi</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {stats.map((stat, index) => {
          const change = stat.change;
          let changeColor = "text-muted-foreground";
          let ChangeIcon: typeof ArrowUpRight | null = null;
          if (change) {
            const isPositive = stat.invertChange ? change.type === "decrease" : change.type === "increase";
            const isNegative = stat.invertChange ? change.type === "increase" : change.type === "decrease";
            if (isPositive) changeColor = "text-success";
            else if (isNegative) changeColor = "text-danger";
            ChangeIcon = change.type === "increase" ? ArrowUpRight : change.type === "decrease" ? ArrowDownRight : null;
          }

          return (
            <StaggerItem key={index} index={index}>
              <Card className="bg-gradient-card shadow-card border border-border/50 h-full hover-lift overflow-hidden">
                <CardContent className="p-4 md:p-5 relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5 truncate uppercase tracking-wide">
                        {stat.title}
                      </p>
                      <p className="text-lg md:text-2xl font-bold font-mono-num text-foreground truncate tracking-tight">
                        Rp {stat.value.toLocaleString("id-ID")}
                      </p>
                      <div className="flex items-center mt-2 gap-1">
                        {ChangeIcon && <ChangeIcon className={`h-3.5 w-3.5 ${changeColor}`} />}
                        <span className={`text-xs font-semibold ${changeColor}`}>
                          {change ? `${change.pct.toFixed(1)}%` : stat.subText || "—"}
                        </span>
                        {change && <span className="text-xs text-muted-foreground hidden sm:inline">vs bulan lalu</span>}
                      </div>
                    </div>
                    <div className={`p-2 md:p-2.5 rounded-xl ${stat.bgColor} shrink-0`}>
                      <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                  {stat.sparkData && stat.sparkData.some((d) => d.value > 0) && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 opacity-70 pointer-events-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stat.sparkData}>
                          <defs>
                            <linearGradient id={`spark-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={stat.sparkColor} stopOpacity={0.4} />
                              <stop offset="100%" stopColor={stat.sparkColor} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={stat.sparkColor}
                            strokeWidth={1.5}
                            fill={`url(#spark-${index})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Expense Summary */}
      <StaggerItem delay={0.3}>
        <Card className="shadow-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-display">Ringkasan Pengeluaran Bulanan</CardTitle>
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
      </StaggerItem>

      {/* Savings Goals */}
      <StaggerItem delay={0.4}>
        <Card className="shadow-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-display flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Target Tabungan
            </CardTitle>
            <CardDescription>Progress target Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {savingsGoals.length === 0 ? (
              <EmptyState
                icon={Target}
                title="Belum ada target tabungan"
                description="Mulai buat target tabungan untuk melacak progress menabung Anda."
                action={{ label: "Buat Target Pertama", onClick: () => navigate("/savings") }}
              />
            ) : (
              savingsGoals.map((goal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{goal.name}</p>
                    <p className="text-sm font-mono-num font-semibold text-primary">
                      {Math.round((goal.current_amount / goal.target_amount) * 100)}%
                    </p>
                  </div>
                  <Progress value={(goal.current_amount / goal.target_amount) * 100} className="h-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono-num">
                      Rp {goal.current_amount.toLocaleString("id-ID")}
                    </span>
                    <span className="text-muted-foreground font-mono-num">
                      Rp {goal.target_amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Quick Actions */}
      <StaggerItem delay={0.5}>
        <Card className="shadow-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-display">Aksi Cepat</CardTitle>
            <CardDescription>Fitur yang sering digunakan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {quickActions.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => navigate(qa.to)}
                  className="group flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-border bg-gradient-card hover-lift transition-all"
                >
                  <div
                    className={`h-11 w-11 rounded-xl bg-gradient-to-br ${qa.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <qa.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-foreground text-center leading-tight">
                    {qa.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </StaggerItem>
    </div>
  );
}
