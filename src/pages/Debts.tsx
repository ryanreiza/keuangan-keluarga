import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard,
  Plus, 
  Edit, 
  Trash2, 
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Building2
} from "lucide-react";

export default function Debts() {
  const debts = [
    {
      id: 1,
      name: "Kartu Kredit BCA",
      type: "credit_card",
      totalAmount: 5000000,
      remainingAmount: 2100000,
      monthlyPayment: 650000,
      interestRate: 2.95,
      nextPayment: "2024-12-20",
      status: "active",
      priority: "high",
      creditor: "BCA"
    },
    {
      id: 2,
      name: "KTA Mandiri",
      type: "personal_loan",
      totalAmount: 15000000,
      remainingAmount: 8500000,
      monthlyPayment: 850000,
      interestRate: 1.5,
      nextPayment: "2024-12-25",
      status: "active",
      priority: "medium",
      creditor: "Mandiri"
    },
    {
      id: 3,
      name: "Pinjaman Teman",
      type: "personal",
      totalAmount: 3000000,
      remainingAmount: 1500000,
      monthlyPayment: 500000,
      interestRate: 0,
      nextPayment: "2024-12-30",
      status: "active",
      priority: "high",
      creditor: "Andi"
    },
    {
      id: 4,
      name: "Kredit Motor Honda",
      type: "vehicle_loan",
      totalAmount: 25000000,
      remainingAmount: 0,
      monthlyPayment: 1200000,
      interestRate: 1.2,
      nextPayment: "2024-11-15",
      status: "completed",
      priority: "medium",
      creditor: "Adira Finance"
    }
  ];

  const getProgress = (remaining: number, total: number) => {
    return ((total - remaining) / total) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-bg text-success-foreground';
      case 'active': return 'bg-warning-bg text-warning-foreground';
      case 'overdue': return 'bg-danger-bg text-danger-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'active': return Clock;
      case 'overdue': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-danger text-danger-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'credit_card': return 'Kartu Kredit';
      case 'personal_loan': return 'KTA';
      case 'personal': return 'Pribadi';
      case 'vehicle_loan': return 'Kredit Kendaraan';
      case 'mortgage': return 'KPR';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'credit_card': return CreditCard;
      case 'personal_loan': return Building2;
      case 'personal': return DollarSign;
      case 'vehicle_loan': return TrendingDown;
      default: return DollarSign;
    }
  };

  const getDaysUntilPayment = (nextPayment: string) => {
    const today = new Date();
    const paymentDate = new Date(nextPayment);
    const timeDiff = paymentDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const activeDebts = debts.filter(debt => debt.status === 'active');
  const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
  const totalMonthlyPayment = activeDebts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
  const averageInterestRate = activeDebts.length > 0 
    ? activeDebts.reduce((sum, debt) => sum + debt.interestRate, 0) / activeDebts.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pelacak Utang</h1>
          <p className="text-muted-foreground mt-1">Kelola dan pantau semua utang dan kewajiban pembayaran</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Utang
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Debt Form */}
        <Card className="xl:col-span-1 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">Form Utang</CardTitle>
            <CardDescription>Tambah atau edit utang</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Utang</Label>
              <Input id="name" placeholder="Contoh: Kartu Kredit BCA" />
            </div>

            <div className="space-y-2">
              <Label>Jenis Utang</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis utang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Kartu Kredit</SelectItem>
                  <SelectItem value="personal_loan">KTA</SelectItem>
                  <SelectItem value="personal">Pinjaman Pribadi</SelectItem>
                  <SelectItem value="vehicle_loan">Kredit Kendaraan</SelectItem>
                  <SelectItem value="mortgage">KPR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditor">Kreditor</Label>
              <Input id="creditor" placeholder="Nama bank/lembaga/orang" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Jumlah Total</Label>
              <Input id="totalAmount" type="number" placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remainingAmount">Sisa Utang</Label>
              <Input id="remainingAmount" type="number" placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyPayment">Cicilan Bulanan</Label>
              <Input id="monthlyPayment" type="number" placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestRate">Bunga (% per bulan)</Label>
              <Input id="interestRate" type="number" step="0.01" placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label>Prioritas</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Tinggi</SelectItem>
                  <SelectItem value="medium">Sedang</SelectItem>
                  <SelectItem value="low">Rendah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
              Simpan Utang
            </Button>
          </CardContent>
        </Card>

        {/* Summary & Debts */}
        <div className="xl:col-span-3 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-card shadow-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Utang</p>
                    <p className="text-2xl font-bold text-danger">Rp {totalDebt.toLocaleString('id-ID')}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-danger" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Cicilan Bulanan</p>
                    <p className="text-2xl font-bold text-warning">Rp {totalMonthlyPayment.toLocaleString('id-ID')}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rata-rata Bunga</p>
                    <p className="text-2xl font-bold text-foreground">{averageInterestRate.toFixed(2)}%</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Utang Aktif</p>
                    <p className="text-2xl font-bold text-foreground">{activeDebts.length}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Debts List */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">Daftar Utang & Kewajiban</CardTitle>
              <CardDescription>Semua utang dan jadwal pembayaran</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {debts.map((debt) => {
                const progress = getProgress(debt.remainingAmount, debt.totalAmount);
                const StatusIcon = getStatusIcon(debt.status);
                const TypeIcon = getTypeIcon(debt.type);
                const daysUntilPayment = getDaysUntilPayment(debt.nextPayment);
                const monthsRemaining = debt.monthlyPayment > 0 ? Math.ceil(debt.remainingAmount / debt.monthlyPayment) : 0;
                
                return (
                  <div key={debt.id} className="p-6 border border-border rounded-lg hover:bg-surface/50 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-muted rounded-lg">
                          <TypeIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{debt.name}</h3>
                            <Badge className={getStatusColor(debt.status)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {debt.status === 'completed' ? 'Lunas' : 
                               debt.status === 'active' ? 'Aktif' : 'Terlambat'}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(debt.priority)}>
                              {debt.priority === 'high' ? 'Prioritas Tinggi' :
                               debt.priority === 'medium' ? 'Prioritas Sedang' : 'Prioritas Rendah'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-muted-foreground">Kreditor:</span>
                              <p className="font-medium text-foreground">{debt.creditor}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Jenis:</span>
                              <p className="font-medium text-foreground">{getTypeLabel(debt.type)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Sisa Utang:</span>
                              <p className="font-medium text-danger">Rp {debt.remainingAmount.toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cicilan:</span>
                              <p className="font-medium text-warning">Rp {debt.monthlyPayment.toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Bunga:</span>
                              <p className="font-medium text-foreground">{debt.interestRate}%</p>
                            </div>
                          </div>

                          {debt.status === 'active' && (
                            <div className="flex items-center gap-6 text-sm">
                              <div className={`flex items-center gap-2 ${daysUntilPayment <= 7 ? 'text-danger' : daysUntilPayment <= 14 ? 'text-warning' : 'text-muted-foreground'}`}>
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Bayar dalam {daysUntilPayment} hari ({new Date(debt.nextPayment).toLocaleDateString('id-ID')})
                                </span>
                              </div>
                              {monthsRemaining > 0 && (
                                <div className="text-muted-foreground">
                                  Sisa {monthsRemaining} bulan
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {debt.status !== 'completed' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress Pembayaran</span>
                          <span className="font-medium text-foreground">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Rp {(debt.totalAmount - debt.remainingAmount).toLocaleString('id-ID')} dibayar</span>
                          <span>Rp {debt.totalAmount.toLocaleString('id-ID')} total</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Payment Schedule */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">Jadwal Pembayaran Mendatang</CardTitle>
              <CardDescription>7 hari ke depan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeDebts
                  .filter(debt => getDaysUntilPayment(debt.nextPayment) <= 7)
                  .sort((a, b) => getDaysUntilPayment(a.nextPayment) - getDaysUntilPayment(b.nextPayment))
                  .map((debt) => {
                    const daysUntil = getDaysUntilPayment(debt.nextPayment);
                    return (
                      <div key={debt.id} className={`flex items-center justify-between p-4 rounded-lg ${
                        daysUntil <= 3 ? 'bg-danger-bg' : daysUntil <= 7 ? 'bg-warning-bg' : 'bg-muted'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            daysUntil <= 3 ? 'bg-danger' : daysUntil <= 7 ? 'bg-warning' : 'bg-muted-foreground'
                          }`}></div>
                          <div>
                            <p className="font-medium text-foreground">{debt.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {daysUntil === 0 ? 'Hari ini' : daysUntil === 1 ? 'Besok' : `${daysUntil} hari lagi`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">Rp {debt.monthlyPayment.toLocaleString('id-ID')}</p>
                          <p className="text-sm text-muted-foreground">{new Date(debt.nextPayment).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                    );
                  })}
                {activeDebts.filter(debt => getDaysUntilPayment(debt.nextPayment) <= 7).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Tidak ada pembayaran dalam 7 hari ke depan</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}