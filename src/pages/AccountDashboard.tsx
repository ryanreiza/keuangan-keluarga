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
  Wallet,
  Loader2
} from "lucide-react";
import { useState, useMemo } from "react";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useNavigate } from "react-router-dom";

export default function AccountDashboard() {
  const [showBalances, setShowBalances] = useState(true);
  const navigate = useNavigate();
  
  const { 
    accounts, 
    transactions, 
    loading 
  } = useFinancialData();

  // Helper function to get bank emoji
  const getBankEmoji = (bankName: string) => {
    const bankEmojis: { [key: string]: string } = {
      "BCA": "🟦",
      "BNI": "🟠", 
      "BRI": "🟫",
      "Mandiri": "🟨",
      "CIMB": "🟥",
      "BSI": "🟢",
      "Danamon": "🟣",
      "Permata": "⚫",
      "OCBC": "🔴",
      "Maybank": "🟡"
    };
    return bankEmojis[bankName] || "🏦";
  };

  // Calculate account statistics
  const accountsWithStats = useMemo(() => {
    if (!accounts || !transactions) return [];

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    return accounts.map(account => {
      // Current month transactions
      const currentMonthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return t.account_id === account.id && 
               transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      });

      // Last month transactions for comparison
      const lastMonthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return t.account_id === account.id && 
               transactionDate.getMonth() === lastMonth && 
               transactionDate.getFullYear() === lastMonthYear;
      });

      // Calculate income and expenses for current month
      const monthlyIncome = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const monthlyExpense = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Calculate last month balance change for comparison
      const lastMonthIncome = lastMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const lastMonthExpense = lastMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const currentNetFlow = monthlyIncome - monthlyExpense;
      const lastNetFlow = lastMonthIncome - lastMonthExpense;
      
      // Calculate monthly change percentage
      let monthlyChange = 0;
      if (lastNetFlow !== 0) {
        monthlyChange = ((currentNetFlow - lastNetFlow) / Math.abs(lastNetFlow)) * 100;
      } else if (currentNetFlow > 0) {
        monthlyChange = 100;
      }

      return {
        ...account,
        monthlyIncome,
        monthlyExpense,
        monthlyChange: Number(monthlyChange.toFixed(1)),
        transactionCount: currentMonthTransactions.length,
        logo: getBankEmoji(account.bank_name)
      };
    });
  }, [accounts, transactions]);

  const formatCurrency = (amount: number) => {
    if (!showBalances) return "••••••••";
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Calculate totals
  const totalBalance = accountsWithStats.reduce((sum, acc) => sum + Number(acc.current_balance), 0);
  const totalIncome = accountsWithStats.reduce((sum, acc) => sum + acc.monthlyIncome, 0);
  const totalExpense = accountsWithStats.reduce((sum, acc) => sum + acc.monthlyExpense, 0);

  // Show loading state
  if (loading.accounts || loading.transactions) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <Button 
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            onClick={() => navigate('/accounts')}
          >
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
        {accountsWithStats.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Belum ada rekening. Tambah rekening pertama Anda.</p>
            <Button 
              className="mt-4 bg-gradient-primary text-primary-foreground hover:opacity-90"
              onClick={() => navigate('/accounts')}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Tambah Rekening
            </Button>
          </div>
        ) : (
          accountsWithStats.map((account) => (
            <Card key={account.id} className="shadow-card border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{account.logo}</div>
                    <div>
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <CardDescription>{account.bank_name}</CardDescription>
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
                    {formatCurrency(Number(account.current_balance))}
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
                      {formatCurrency(account.monthlyIncome)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-danger-bg rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4 text-danger" />
                      <span className="text-sm text-danger-foreground">Keluar</span>
                    </div>
                    <span className="font-medium text-danger">
                      {formatCurrency(account.monthlyExpense)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gradient-card rounded-lg border">
                    <span className="text-sm font-medium text-foreground">Selisih</span>
                    <span className={`font-bold ${account.monthlyIncome - account.monthlyExpense >= 0 ? 'text-success' : 'text-danger'}`}>
                      {account.monthlyIncome - account.monthlyExpense >= 0 ? '+' : ''}{formatCurrency(account.monthlyIncome - account.monthlyExpense)}
                    </span>
                  </div>
                </div>

                {/* Activity */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Transaksi bulan ini</span>
                  <Badge variant="secondary">{account.transactionCount}</Badge>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/accounts')}
                  >
                    Lihat Detail
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/transactions')}
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Transaksi
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Insights */}
      {accountsWithStats.length > 0 && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-xl">Insights & Rekomendasi</CardTitle>
            <CardDescription>Analisis otomatis berdasarkan aktivitas rekening</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Best performing account */}
              {(() => {
                const bestAccount = accountsWithStats.reduce((best, current) => 
                  current.monthlyChange > best.monthlyChange ? current : best
                );
                if (bestAccount.monthlyChange > 0) {
                  return (
                    <div className="p-4 bg-success-bg rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span className="text-sm font-medium text-success-foreground">Rekening Terbaik</span>
                      </div>
                      <p className="text-sm text-success-foreground/80">
                        {bestAccount.bank_name} {bestAccount.name} menunjukkan pertumbuhan tertinggi (+{bestAccount.monthlyChange}%)
                      </p>
                    </div>
                  );
                }
                return null;
              })()} 

              {/* Account that needs attention */}
              {(() => {
                const worstAccount = accountsWithStats.reduce((worst, current) => 
                  current.monthlyChange < worst.monthlyChange ? current : worst
                );
                if (worstAccount.monthlyChange < 0) {
                  return (
                    <div className="p-4 bg-warning-bg rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-warning rounded-full"></div>
                        <span className="text-sm font-medium text-warning-foreground">Perlu Perhatian</span>
                      </div>
                      <p className="text-sm text-warning-foreground/80">
                        {worstAccount.bank_name} {worstAccount.name} mengalami penurunan saldo bulan ini ({worstAccount.monthlyChange}%)
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* General recommendation */}
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm font-medium text-primary">Rekomendasi</span>
                </div>
                <p className="text-sm text-primary/80">
                  {totalIncome > totalExpense 
                    ? "Arus kas positif! Pertimbangkan untuk menambah investasi atau tabungan."
                    : "Pantau pengeluaran dan cari cara untuk meningkatkan pemasukan."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}