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
  ArrowRight,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
  Loader2,
  Plus,
  LayoutDashboard,
  PiggyBank,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useFinancialData } from "@/hooks/useFinancialData";
import MonthlyBudgetTracker from "@/components/MonthlyBudgetTracker";
import { StaggerContainer, StaggerItem } from "@/components/StaggerItem";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useState, useMemo } from "react";
import { format, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { Area, AreaChart, ResponsiveContainer, Cell, Pie, PieChart } from "recharts";

const rp = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

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
  const activeDebts = debts.filter((d) => !d.is_paid_off);
  const totalDebt = activeDebts.reduce((s, d) => s + d.remaining_amount, 0);
  const totalDebtOriginal = activeDebts.reduce((s, d) => s + d.total_amount, 0);
  const debtPaidPct = totalDebtOriginal > 0 ? ((totalDebtOriginal - totalDebt) / totalDebtOriginal) * 100 : 0;

  const netCashflow = totalIncome - totalExpense;
  const expenseRatio = totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 0;
  const savingRate = totalIncome > 0 ? Math.max(0, Math.min((netCashflow / totalIncome) * 100, 100)) : 0;

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

  // Sparkline data: last 6 months income/expense
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

  const heroSparkData = sparklineData.map((m) => ({ value: m.income - m.expense }));

  const quickActions = [
    { icon: PieChartIcon, label: "Analisis Kategori", desc: "Sebaran pengeluaran", to: "/categories", gradient: "from-primary to-primary-light" },
    { icon: BarChart3, label: "Laporan Bulanan", desc: "Ringkasan & ekspor", to: "/reports", gradient: "from-accent-brand to-success-light" },
    { icon: Target, label: "Target Baru", desc: "Rencana menabung", to: "/savings", gradient: "from-warning to-warning-light" },
    { icon: CreditCard, label: "Rekening Baru", desc: "Kelola sumber dana", to: "/accounts", gradient: "from-primary-dark to-primary" },
  ];

  const ChangeBadge = ({
    change,
    invert,
  }: { change: ReturnType<typeof calcChange>; invert?: boolean }) => {
    if (!change) return <span className="text-xs text-muted-foreground">Tidak ada pembanding</span>;
    const isPositive = invert ? change.type === "decrease" : change.type === "increase";
    const isNegative = invert ? change.type === "increase" : change.type === "decrease";
    const color = isPositive ? "text-success" : isNegative ? "text-danger" : "text-muted-foreground";
    const Icon = change.type === "increase" ? ArrowUpRight : change.type === "decrease" ? ArrowDownRight : null;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${color}`}>
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {change.pct.toFixed(1)}%
        <span className="text-muted-foreground font-medium hidden sm:inline">vs bulan lalu</span>
      </span>
    );
  };

  const donutData = [
    { name: "Pengeluaran", value: Math.max(totalExpense, 0) },
    { name: "Sisa", value: Math.max(totalIncome - totalExpense, 0) },
  ];
  const hasDonut = totalIncome > 0 || totalExpense > 0;

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        icon={LayoutDashboard}
        eyebrow="Dashboard"
        title="Ringkasan Keuangan"
        subtitle={`Periode ${monthOptions.find((opt) => opt.value === selectedMonth)?.label || ""}`}
        actions={
          <>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36 md:w-44 bg-background h-10">
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
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant h-10"
              onClick={() => navigate("/transactions")}
            >
              <Plus className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Tambah Transaksi</span>
              <span className="sm:hidden">Tambah</span>
            </Button>
          </>
        }
      />

      {/* ---------- BENTO ROW 1 ---------- */}
      <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Hero saldo (2 kolom) */}
        <StaggerItem index={0} className="lg:col-span-2">
          <div className="bento-hero h-full p-6 md:p-8 lg:p-10">
            <div className="relative z-10 flex h-full flex-col justify-between gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/70 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-brand animate-pulse" />
                  Total Saldo Tersedia
                </p>
                <p className="num-hero text-display-1 mt-3 animate-count-in text-primary-foreground">
                  {rp(totalBalance)}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-semibold text-primary-foreground/90 backdrop-blur">
                    <Wallet className="h-3.5 w-3.5" />
                    {accounts.length} rekening
                  </span>
                  {totalDebt > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning-foreground backdrop-blur">
                      <CreditCard className="h-3.5 w-3.5" />
                      Utang {rp(totalDebt)}
                    </span>
                  )}
                  {savingsGoals.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-brand/25 px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur">
                      <Target className="h-3.5 w-3.5" />
                      {savingsGoals.length} target aktif
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-end justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/60">
                    Tren arus kas bersih 6 bulan
                  </p>
                  <p className={`num-hero text-sm ${netCashflow >= 0 ? "text-accent-brand" : "text-warning"}`}>
                    {netCashflow >= 0 ? "+" : "-"}{rp(Math.abs(netCashflow))}
                  </p>
                </div>
                <div className="h-20 md:h-24 -mx-1 mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={heroSparkData}>
                      <defs>
                        <linearGradient id="hero-spark" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--accent-brand))" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="hsl(var(--accent-brand))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--accent-brand))"
                        strokeWidth={2.5}
                        fill="url(#hero-spark)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Arus kas bulan ini */}
        <StaggerItem index={1}>
          <div className="card-bento h-full p-5 md:p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="card-bento-head">Arus Kas Bulan Ini</p>
                <p className="text-sm text-muted-foreground mt-1">Masuk vs keluar</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <TrendingUp className="h-4 w-4 text-success" /> Pemasukan
                  </span>
                  <span className="num-hero text-sm text-foreground">{rp(totalIncome)}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-success transition-all" style={{ width: "100%" }} />
                </div>
                <div className="mt-1.5"><ChangeBadge change={incomeChange} /></div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <TrendingDown className="h-4 w-4 text-danger" /> Pengeluaran
                  </span>
                  <span className="num-hero text-sm text-foreground">{rp(totalExpense)}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-danger transition-all"
                    style={{ width: `${totalIncome > 0 ? expenseRatio : totalExpense > 0 ? 100 : 0}%` }}
                  />
                </div>
                <div className="mt-1.5"><ChangeBadge change={expenseChange} invert /></div>
              </div>
            </div>

            <div className="mt-auto rounded-2xl border border-border/60 bg-muted/40 px-4 py-3">
              <p className="text-eyebrow">Selisih Bersih</p>
              <p className={`num-hero text-lg ${netCashflow >= 0 ? "text-success" : "text-danger"}`}>
                {netCashflow >= 0 ? "+" : "-"}{rp(Math.abs(netCashflow))}
              </p>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* ---------- BENTO ROW 2 ---------- */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {/* Komposisi pengeluaran */}
        <StaggerItem index={0}>
          <div className="card-bento h-full p-5 md:p-6">
            <p className="card-bento-head">Komposisi Bulan Ini</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="relative h-28 w-28 shrink-0">
                {hasDonut ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          dataKey="value"
                          innerRadius={38}
                          outerRadius={54}
                          startAngle={90}
                          endAngle={-270}
                          stroke="none"
                          paddingAngle={2}
                        >
                          <Cell fill="hsl(var(--danger))" />
                          <Cell fill="hsl(var(--accent-brand))" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="num-hero text-lg text-foreground">{Math.round(expenseRatio)}%</span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">terpakai</span>
                    </div>
                  </>
                ) : (
                  <div className="h-full w-full rounded-full border-[10px] border-secondary" />
                )}
              </div>
              <div className="space-y-2 text-sm min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-danger shrink-0" />
                  <span className="text-muted-foreground">Pengeluaran</span>
                </div>
                <p className="num-hero text-foreground truncate">{rp(totalExpense)}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent-brand shrink-0" />
                  <span className="text-muted-foreground">Tersisa</span>
                </div>
                <p className="num-hero text-foreground truncate">{rp(Math.max(totalIncome - totalExpense, 0))}</p>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Tingkat menabung */}
        <StaggerItem index={1}>
          <div className="card-bento h-full p-5 md:p-6 flex flex-col">
            <div className="flex items-start justify-between">
              <p className="card-bento-head">Tingkat Menabung</p>
              <div className="p-2.5 rounded-2xl bg-success-bg">
                <PiggyBank className="h-4 w-4 text-success" />
              </div>
            </div>
            <p className="num-hero text-display-2 mt-4 text-foreground">{Math.round(savingRate)}%</p>
            <p className="text-sm text-muted-foreground mt-1">dari pemasukan bulan ini</p>
            <div className="mt-auto pt-5">
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${savingRate >= 20 ? "bg-success" : savingRate >= 10 ? "bg-warning" : "bg-danger"}`}
                  style={{ width: `${savingRate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {savingRate >= 20 ? "Sangat sehat — pertahankan." : savingRate >= 10 ? "Cukup baik, bisa ditingkatkan." : "Perlu ditingkatkan bulan ini."}
              </p>
            </div>
          </div>
        </StaggerItem>

        {/* Utang aktif */}
        <StaggerItem index={2}>
          <div className="card-bento h-full p-5 md:p-6 flex flex-col">
            <div className="flex items-start justify-between">
              <p className="card-bento-head">Utang Aktif</p>
              <div className="p-2.5 rounded-2xl bg-warning-bg">
                <CreditCard className="h-4 w-4 text-warning" />
              </div>
            </div>
            <p className="num-hero text-display-2 mt-4 text-foreground">{rp(totalDebt)}</p>
            <p className="text-sm text-muted-foreground mt-1">{activeDebts.length} utang berjalan</p>
            <div className="mt-auto pt-5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progress pelunasan</span>
                <span className="num-hero text-foreground">{Math.round(debtPaidPct)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${debtPaidPct}%` }} />
              </div>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* ---------- RINGKASAN PENGELUARAN ---------- */}
      <StaggerItem delay={0.3}>
        <div className="card-bento p-5 md:p-7">
          <div className="mb-5">
            <p className="card-bento-head">Anggaran</p>
            <h2 className="text-display-2 text-foreground mt-1">Ringkasan Pengeluaran Bulanan</h2>
            <p className="text-sm text-muted-foreground mt-1">Target vs realisasi pengeluaran per kategori</p>
          </div>
          <MonthlyBudgetTracker
            type="expense"
            categories={categories}
            transactions={currentMonthTransactions}
            selectedMonth={selectedMonth}
            savingsGoals={savingsGoals}
          />
        </div>
      </StaggerItem>

      {/* ---------- TARGET TABUNGAN + AKSI CEPAT ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        <StaggerItem delay={0.4}>
          <div className="card-bento h-full p-5 md:p-7">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="card-bento-head">Tabungan</p>
                <h2 className="text-xl font-display font-bold text-foreground mt-1">Target Tabungan</h2>
                <p className="text-sm text-muted-foreground mt-1">Progress setiap tujuan Anda</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-primary/10">
                <Target className="h-4 w-4 text-primary" />
              </div>
            </div>

            {savingsGoals.length === 0 ? (
              <EmptyState
                icon={Target}
                title="Belum ada target tabungan"
                description="Mulai buat target tabungan untuk melacak progress menabung Anda."
                action={{ label: "Buat Target Pertama", onClick: () => navigate("/savings") }}
              />
            ) : (
              <div className="space-y-5">
                {savingsGoals.map((goal) => {
                  const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                  const done = pct >= 100;
                  return (
                    <div key={goal.id} className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-foreground truncate">{goal.name}</p>
                        {done ? (
                          <span className="pill-success shrink-0">
                            <CheckCircle2 className="h-3 w-3" /> Tercapai
                          </span>
                        ) : (
                          <span className="num-hero text-sm text-primary shrink-0">{Math.round(pct)}%</span>
                        )}
                      </div>
                      <Progress value={Math.min(pct, 100)} className="h-2.5 mt-3" />
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="num-hero text-muted-foreground">{rp(goal.current_amount)}</span>
                        <span className="num-hero text-muted-foreground">{rp(goal.target_amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </StaggerItem>

        <StaggerItem delay={0.5}>
          <div className="card-bento h-full p-5 md:p-7">
            <div className="mb-5">
              <p className="card-bento-head">Pintasan</p>
              <h2 className="text-xl font-display font-bold text-foreground mt-1">Aksi Cepat</h2>
              <p className="text-sm text-muted-foreground mt-1">Fitur yang sering digunakan</p>
            </div>
            <div className="space-y-3">
              {quickActions.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => navigate(qa.to)}
                  className="group w-full flex items-center gap-4 rounded-2xl border border-border/60 bg-gradient-card px-4 py-3.5 text-left transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <span
                    className={`h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br ${qa.gradient} flex items-center justify-center shadow-md transition-transform group-hover:scale-105`}
                  >
                    <qa.icon className="h-5 w-5 text-primary-foreground" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground truncate">{qa.label}</span>
                    <span className="block text-xs text-muted-foreground truncate">{qa.desc}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              ))}
            </div>
          </div>
        </StaggerItem>
      </div>
    </div>
  );
}
