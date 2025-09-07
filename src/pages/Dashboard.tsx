import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useSavings } from "@/hooks/useSavings";
import { useDebts } from "@/hooks/useDebts";

export default function Dashboard() {
  const currentMonth = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { savingsGoals, loading: savingsLoading } = useSavings();
  const { debts, loading: debtsLoading } = useDebts();

  // Calculate real statistics
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.transaction_date);
    const currentDate = new Date();
    return transactionDate.getMonth() === currentDate.getMonth() && 
           transactionDate.getFullYear() === currentDate.getFullYear();
  });

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.current_balance, 0);
  const totalDebt = debts.filter(d => !d.is_paid_off).reduce((sum, d) => sum + d.remaining_amount, 0);

  if (transactionsLoading || accountsLoading || savingsLoading || debtsLoading) {
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

  const recentTransactions = [
    { id: 1, description: "Gaji Bulanan", amount: 8500000, type: "income", date: "15 Des 2024", category: "Gaji" },
    { id: 2, description: "Belanja Groceries", amount: -450000, type: "expense", date: "14 Des 2024", category: "Makanan" },
    { id: 3, description: "Transfer dari Ayah", amount: 2000000, type: "income", date: "13 Des 2024", category: "Transfer" },
    { id: 4, description: "Bayar Listrik", amount: -320000, type: "expense", date: "12 Des 2024", category: "Tagihan" },
    { id: 5, description: "Beli Bensin", amount: -150000, type: "expense", date: "12 Des 2024", category: "Transport" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Keuangan</h1>
          <p className="text-muted-foreground mt-1">Ringkasan keuangan bulan {currentMonth}</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
          <DollarSign className="h-4 w-4 mr-2" />
          Tambah Transaksi
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-gradient-card shadow-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.changeType === "increase" && <ArrowUpRight className="h-4 w-4 text-success mr-1" />}
                    {stat.changeType === "decrease" && <ArrowDownRight className="h-4 w-4 text-danger mr-1" />}
                    <span className={`text-sm font-medium ${
                      stat.changeType === "increase" ? "text-success" : 
                      stat.changeType === "decrease" ? "text-danger" : "text-muted-foreground"
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2 shadow-card border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Transaksi Terbaru</CardTitle>
                <CardDescription>5 transaksi terakhir bulan ini</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {recentTransactions.map((transaction, index) => (
                <div key={transaction.id} className={`flex items-center justify-between p-4 ${index !== recentTransactions.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-success-bg' : 'bg-danger-bg'}`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-danger" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transaction.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        <Badge variant="secondary" className="text-xs">{transaction.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className={`text-right ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                    <p className="font-semibold">
                      {transaction.type === 'income' ? '+' : ''}{transaction.amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
      </div>

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