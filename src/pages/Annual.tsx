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
import { useState } from "react";

export default function Annual() {
  const [selectedYear, setSelectedYear] = useState("2024");

  // Mock data untuk demonstrasi
  const annualData = {
    "2024": {
      totalIncome: 145000000,
      totalExpense: 98500000,
      totalSavings: 46500000,
      monthlyAverage: {
        income: 12083333,
        expense: 8208333,
        savings: 3875000
      },
      monthlyData: [
        { month: "Jan", income: 12500000, expense: 8200000, savings: 4300000 },
        { month: "Feb", income: 11800000, expense: 7900000, savings: 3900000 },
        { month: "Mar", income: 13200000, expense: 9100000, savings: 4100000 },
        { month: "Apr", income: 12000000, expense: 8500000, savings: 3500000 },
        { month: "May", income: 11500000, expense: 7800000, savings: 3700000 },
        { month: "Jun", income: 12800000, expense: 8900000, savings: 3900000 },
        { month: "Jul", income: 11900000, expense: 8100000, savings: 3800000 },
        { month: "Aug", income: 12400000, expense: 8300000, savings: 4100000 },
        { month: "Sep", income: 12200000, expense: 8000000, savings: 4200000 },
        { month: "Oct", income: 11700000, expense: 7700000, savings: 4000000 },
        { month: "Nov", income: 12000000, expense: 8200000, savings: 3800000 },
        { month: "Dec", income: 13000000, expense: 8800000, savings: 4200000 }
      ],
      categoryExpenses: [
        { category: "Makanan", amount: 24000000, percentage: 24.4 },
        { category: "Transport", amount: 18500000, percentage: 18.8 },
        { category: "Tagihan", amount: 15000000, percentage: 15.2 },
        { category: "Belanja", amount: 12000000, percentage: 12.2 },
        { category: "Hiburan", amount: 10500000, percentage: 10.7 },
        { category: "Kesehatan", amount: 8500000, percentage: 8.6 },
        { category: "Pendidikan", amount: 6000000, percentage: 6.1 },
        { category: "Lainnya", amount: 4000000, percentage: 4.1 }
      ]
    },
    "2023": {
      totalIncome: 128000000,
      totalExpense: 89000000,
      totalSavings: 39000000,
      monthlyAverage: {
        income: 10666667,
        expense: 7416667,
        savings: 3250000
      },
      monthlyData: [
        { month: "Jan", income: 10500000, expense: 7200000, savings: 3300000 },
        { month: "Feb", income: 10200000, expense: 7100000, savings: 3100000 },
        { month: "Mar", income: 10800000, expense: 7500000, savings: 3300000 },
        { month: "Apr", income: 10600000, expense: 7300000, savings: 3300000 },
        { month: "May", income: 10400000, expense: 7000000, savings: 3400000 },
        { month: "Jun", income: 10900000, expense: 7600000, savings: 3300000 },
        { month: "Jul", income: 10500000, expense: 7200000, savings: 3300000 },
        { month: "Aug", income: 10700000, expense: 7400000, savings: 3300000 },
        { month: "Sep", income: 10600000, expense: 7300000, savings: 3300000 },
        { month: "Oct", income: 10300000, expense: 7000000, savings: 3300000 },
        { month: "Nov", income: 10800000, expense: 7500000, savings: 3300000 },
        { month: "Dec", income: 11700000, expense: 7900000, savings: 3800000 }
      ],
      categoryExpenses: [
        { category: "Makanan", amount: 21500000, percentage: 24.2 },
        { category: "Transport", amount: 16000000, percentage: 18.0 },
        { category: "Tagihan", amount: 13500000, percentage: 15.2 },
        { category: "Belanja", amount: 10500000, percentage: 11.8 },
        { category: "Hiburan", amount: 9500000, percentage: 10.7 },
        { category: "Kesehatan", amount: 7500000, percentage: 8.4 },
        { category: "Pendidikan", amount: 5500000, percentage: 6.2 },
        { category: "Lainnya", amount: 4500000, percentage: 5.1 }
      ]
    }
  };

  const currentYearData = annualData[selectedYear as keyof typeof annualData];
  const previousYearData = annualData["2023"];

  const incomeGrowth = currentYearData && previousYearData 
    ? ((currentYearData.totalIncome - previousYearData.totalIncome) / previousYearData.totalIncome * 100)
    : 0;

  const expenseGrowth = currentYearData && previousYearData
    ? ((currentYearData.totalExpense - previousYearData.totalExpense) / previousYearData.totalExpense * 100)
    : 0;

  const savingsGrowth = currentYearData && previousYearData
    ? ((currentYearData.totalSavings - previousYearData.totalSavings) / previousYearData.totalSavings * 100)
    : 0;

  const savingsRate = (currentYearData.totalSavings / currentYearData.totalIncome) * 100;

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
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
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