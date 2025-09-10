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
  Building2,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useDebts, CreateDebtData } from "@/hooks/useDebts";
import { format } from "date-fns";

export default function Debts() {
  const [formData, setFormData] = useState({
    creditor_name: "",
    total_amount: "",
    remaining_amount: "",
    interest_rate: "",
    monthly_payment: "",
    due_date: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { debts, loading: debtsLoading, createDebt, updateDebt, deleteDebt } = useDebts();

  const getProgress = (remaining: number, total: number) => {
    return ((total - remaining) / total) * 100;
  };

  const getStatusColor = (isPaidOff: boolean, daysUntilDue: number) => {
    if (isPaidOff) return 'bg-success-bg text-success-foreground';
    if (daysUntilDue <= 0) return 'bg-danger-bg text-danger-foreground';
    if (daysUntilDue <= 7) return 'bg-warning-bg text-warning-foreground';
    return 'bg-primary/10 text-primary';
  };

  const getStatusIcon = (isPaidOff: boolean, daysUntilDue: number) => {
    if (isPaidOff) return CheckCircle;
    if (daysUntilDue <= 0) return AlertTriangle;
    return Clock;
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return Infinity;
    const today = new Date();
    const due = new Date(dueDate);
    const timeDiff = due.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.creditor_name || !formData.total_amount || !formData.remaining_amount) return;

    setLoading(true);
    const debtData: CreateDebtData = {
      creditor_name: formData.creditor_name,
      total_amount: parseFloat(formData.total_amount),
      remaining_amount: parseFloat(formData.remaining_amount),
      interest_rate: parseFloat(formData.interest_rate) || 0,
      monthly_payment: parseFloat(formData.monthly_payment) || 0,
      due_date: formData.due_date || undefined,
    };

    let result;
    if (editingId) {
      result = await updateDebt(editingId, debtData);
    } else {
      result = await createDebt(debtData);
    }

    if (!result.error) {
      setFormData({ 
        creditor_name: "", 
        total_amount: "", 
        remaining_amount: "", 
        interest_rate: "", 
        monthly_payment: "", 
        due_date: "" 
      });
      setEditingId(null);
      setShowForm(false);
    }
    setLoading(false);
  };

  const handleEdit = (debt: any) => {
    setFormData({
      creditor_name: debt.creditor_name,
      total_amount: debt.total_amount.toString(),
      remaining_amount: debt.remaining_amount.toString(),
      interest_rate: debt.interest_rate.toString(),
      monthly_payment: debt.monthly_payment?.toString() || "",
      due_date: debt.due_date ? format(new Date(debt.due_date), "yyyy-MM-dd") : ""
    });
    setEditingId(debt.id);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setFormData({ 
      creditor_name: "", 
      total_amount: "", 
      remaining_amount: "", 
      interest_rate: "", 
      monthly_payment: "", 
      due_date: "" 
    });
    setEditingId(null);
    setShowForm(false);
  };

  const activeDebts = debts.filter(debt => !debt.is_paid_off);
  const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.remaining_amount, 0);
  const totalMonthlyPayment = activeDebts.reduce((sum, debt) => sum + (debt.monthly_payment || 0), 0);

  if (debtsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pelacak Utang</h1>
          <p className="text-muted-foreground mt-1">Kelola dan pantau semua utang dan kewajiban pembayaran</p>
        </div>
        <Button 
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Sembunyikan Form' : 'Tambah Utang'}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Debt Form */}
        {showForm && (
        <Card className="xl:col-span-1 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Edit Utang" : "Form Utang"}
            </CardTitle>
            <CardDescription>
              {editingId ? "Edit utang yang ada" : "Tambah atau edit utang"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="creditor">Kreditor</Label>
                <Input 
                  id="creditor" 
                  placeholder="Nama bank/lembaga/orang"
                  value={formData.creditor_name}
                  onChange={(e) => setFormData({...formData, creditor_name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount">Jumlah Total Utang</Label>
                <Input 
                  id="totalAmount" 
                  type="number" 
                  placeholder="0"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remainingAmount">Sisa Utang</Label>
                <Input 
                  id="remainingAmount" 
                  type="number" 
                  placeholder="0"
                  value={formData.remaining_amount}
                  onChange={(e) => setFormData({...formData, remaining_amount: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyPayment">Cicilan Bulanan</Label>
                <Input 
                  id="monthlyPayment" 
                  type="number" 
                  placeholder="0"
                  value={formData.monthly_payment}
                  onChange={(e) => setFormData({...formData, monthly_payment: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestRate">Bunga (% per bulan)</Label>
                <Input 
                  id="interestRate" 
                  type="number" 
                  step="0.01" 
                  placeholder="0"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({...formData, interest_rate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Tanggal Jatuh Tempo</Label>
                <Input 
                  id="dueDate" 
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingId ? "Update Utang" : "Simpan Utang"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Batal
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        )}

        {/* Summary & Debts */}
        <div className={`${showForm ? 'xl:col-span-3' : 'xl:col-span-4'} space-y-6`}>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <CardDescription>Semua utang dan jadwal pembayaran ({debts.length} utang)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {debts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Belum ada utang tercatat. Semoga tetap bebas utang! 🎉
                </div>
              ) : (
                debts.map((debt) => {
                  const progress = getProgress(debt.remaining_amount, debt.total_amount);
                  const daysUntilDue = getDaysUntilDue(debt.due_date);
                  const StatusIcon = getStatusIcon(debt.is_paid_off, daysUntilDue);
                  const monthsRemaining = debt.monthly_payment && debt.monthly_payment > 0 
                    ? Math.ceil(debt.remaining_amount / debt.monthly_payment) 
                    : 0;
                  
                  return (
                    <div key={debt.id} className="p-6 border border-border rounded-lg hover:bg-surface/50 transition-colors group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 bg-muted rounded-lg">
                            <CreditCard className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-foreground">{debt.creditor_name}</h3>
                              <Badge className={getStatusColor(debt.is_paid_off, daysUntilDue)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {debt.is_paid_off ? 'Lunas' : 
                                 daysUntilDue <= 0 ? 'Terlambat' : 
                                 daysUntilDue <= 7 ? 'Segera Jatuh Tempo' : 'Aktif'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-muted-foreground">Sisa Utang:</span>
                                <p className="font-medium text-danger">Rp {debt.remaining_amount.toLocaleString('id-ID')}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Total Utang:</span>
                                <p className="font-medium text-foreground">Rp {debt.total_amount.toLocaleString('id-ID')}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Cicilan Bulanan:</span>
                                <p className="font-medium text-warning">
                                  Rp {(debt.monthly_payment || 0).toLocaleString('id-ID')}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Bunga:</span>
                                <p className="font-medium text-foreground">{debt.interest_rate}% /bulan</p>
                              </div>
                            </div>

                            {!debt.is_paid_off && debt.due_date && (
                              <div className="flex items-center gap-6 text-sm mb-4">
                                <div className={`flex items-center gap-2 ${
                                  daysUntilDue <= 0 ? 'text-danger' : 
                                  daysUntilDue <= 7 ? 'text-warning' : 
                                  'text-muted-foreground'
                                }`}>
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {daysUntilDue <= 0 ? `Terlambat ${Math.abs(daysUntilDue)} hari` :
                                     `Jatuh tempo dalam ${daysUntilDue} hari`} 
                                    ({new Date(debt.due_date).toLocaleDateString('id-ID')})
                                  </span>
                                </div>
                                {monthsRemaining > 0 && (
                                  <div className="text-muted-foreground">
                                    Estimasi lunas: {monthsRemaining} bulan
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(debt)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger" onClick={() => deleteDebt(debt.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {!debt.is_paid_off && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress Pembayaran</span>
                            <span className="font-medium text-foreground">{progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={progress} className="h-3" />
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Rp {(debt.total_amount - debt.remaining_amount).toLocaleString('id-ID')} dibayar</span>
                            <span>Rp {debt.total_amount.toLocaleString('id-ID')} total</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}