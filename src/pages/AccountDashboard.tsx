import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Eye,
  EyeOff,
  CreditCard,
  Wallet
} from "lucide-react";
import { useState } from "react";

export default function AccountDashboard() {
  const [showBalances, setShowBalances] = useState(true);

  const accounts = [
    {
      id: 1,
      bank: "BCA",
      name: "Tabungan Utama",
      balance: 15750000,
      income: 8500000,
      expense: 6200000,
      monthlyChange: 8.5,
      transactions: 45,
      logo: "🟦"
    },
    {
      id: 2,
      bank: "Mandiri", 
      name: "Giro Bisnis",
      balance: 8500000,
      income: 3200000,
      expense: 3800000,
      monthlyChange: -2.1,
      transactions: 28,
      logo: "🟨"
    },
    {
      id: 3,
      bank: "BRI",
      name: "Tabungan Haji",
      balance: 1500000,
      income: 500000,
      expense: 100000,
      monthlyChange: 15.2,
      transactions: 8,
      logo: "🟫"
    }
  ];

  const formatCurrency = (amount: number) => {
    if (!showBalances) return "••••••••";
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalIncome = accounts.reduce((sum, acc) => sum + acc.income, 0);
  const totalExpense = accounts.reduce((sum, acc) => sum + acc.expense, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Rekening</h1>
          <p className="text-muted-foreground mt-1">Ringkasan dan analisis semua rekening bank</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            <Building2 className="h-4 w-4 mr-2" />
            Tambah Rekening
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-primary shadow-card border-0">
          <CardContent className="p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total Saldo</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
              </div>
              <Wallet className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success shadow-card border-0">
          <CardContent className="p-6 text-success-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total Pemasukan</p>
                <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-danger">{formatCurrency(totalExpense)}</p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-danger" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Selisih</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(totalIncome - totalExpense)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Card key={account.id} className="shadow-card border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{account.logo}</div>
                  <div>
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    <CardDescription>{account.bank}</CardDescription>
                  </div>
                </div>
                <Badge className={`${account.monthlyChange >= 0 ? 'bg-success-bg text-success-foreground' : 'bg-danger-bg text-danger-foreground'}`}>
                  {account.monthlyChange >= 0 ? '+' : ''}{account.monthlyChange}%
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Balance */}
              <div className="text-center p-4 bg-gradient-surface rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Saldo Tersedia</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(account.balance)}
                </p>
              </div>

              {/* Cash Flow */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Arus Kas Bulan Ini</h4>
                
                <div className="flex items-center justify-between p-3 bg-success-bg rounded-lg">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-success" />
                    <span className="text-sm text-success-foreground">Masuk</span>
                  </div>
                  <span className="font-medium text-success">
                    {formatCurrency(account.income)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-danger-bg rounded-lg">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-danger" />
                    <span className="text-sm text-danger-foreground">Keluar</span>
                  </div>
                  <span className="font-medium text-danger">
                    {formatCurrency(account.expense)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-card rounded-lg border">
                  <span className="text-sm font-medium text-foreground">Selisih</span>
                  <span className={`font-bold ${account.income - account.expense >= 0 ? 'text-success' : 'text-danger'}`}>
                    {account.income - account.expense >= 0 ? '+' : ''}{formatCurrency(account.income - account.expense)}
                  </span>
                </div>
              </div>

              {/* Activity */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Transaksi bulan ini</span>
                <Badge variant="secondary">{account.transactions}</Badge>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  Lihat Detail
                </Button>
                <Button variant="outline" size="sm">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Transaksi
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Insights */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-xl">Insights & Rekomendasi</CardTitle>
          <CardDescription>Analisis otomatis berdasarkan aktivitas rekening</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-success-bg rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm font-medium text-success-foreground">Rekening Terbaik</span>
              </div>
              <p className="text-sm text-success-foreground/80">
                BRI Tabungan Haji menunjukkan pertumbuhan tertinggi (+15.2%)
              </p>
            </div>

            <div className="p-4 bg-warning-bg rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <span className="text-sm font-medium text-warning-foreground">Perlu Perhatian</span>
              </div>
              <p className="text-sm text-warning-foreground/80">
                Mandiri Giro mengalami penurunan saldo bulan ini
              </p>
            </div>

            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm font-medium text-primary">Rekomendasi</span>
              </div>
              <p className="text-sm text-primary/80">
                Pertimbangkan transfer dana ke rekening dengan bunga lebih tinggi
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}