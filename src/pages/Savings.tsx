import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";

export default function Savings() {
  const savingsGoals = [
    {
      id: 1,
      title: "Dana Darurat",
      description: "6 bulan pengeluaran untuk situasi darurat",
      target: 30000000,
      current: 15000000,
      monthlyContribution: 2500000,
      deadline: "2025-06-30",
      category: "Keuangan",
      status: "active",
      priority: "high"
    },
    {
      id: 2,
      title: "Liburan ke Bali",
      description: "Liburan keluarga 5 hari 4 malam di Bali",
      target: 8000000,
      current: 3500000,
      monthlyContribution: 1000000,
      deadline: "2025-07-15",
      category: "Liburan",
      status: "active",
      priority: "medium"
    },
    {
      id: 3,
      title: "Laptop Gaming Baru",
      description: "Upgrade laptop untuk work from home",
      target: 12000000,
      current: 8500000,
      monthlyContribution: 1500000,
      deadline: "2025-03-31",
      category: "Elektronik",
      status: "active",
      priority: "medium"
    },
    {
      id: 4,
      title: "DP Motor",
      description: "Down payment motor baru Honda PCX",
      target: 5000000,
      current: 5000000,
      monthlyContribution: 800000,
      deadline: "2024-12-31",
      category: "Kendaraan",
      status: "completed",
      priority: "high"
    },
    {
      id: 5,
      title: "Kursus Programming",
      description: "Bootcamp Full Stack Development",
      target: 15000000,
      current: 2500000,
      monthlyContribution: 0,
      deadline: "2025-12-31",
      category: "Pendidikan",
      status: "paused",
      priority: "low"
    }
  ];

  const getProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-bg text-success-foreground';
      case 'active': return 'bg-primary/10 text-primary';
      case 'paused': return 'bg-warning-bg text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'active': return TrendingUp;
      case 'paused': return Clock;
      default: return AlertCircle;
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

  const getMonthsRemaining = (deadline: string, current: number, target: number, monthlyContribution: number) => {
    if (current >= target) return 0;
    if (monthlyContribution <= 0) return Infinity;
    
    const remaining = target - current;
    return Math.ceil(remaining / monthlyContribution);
  };

  const activeGoals = savingsGoals.filter(goal => goal.status === 'active');
  const totalTarget = activeGoals.reduce((sum, goal) => sum + goal.target, 0);
  const totalSaved = activeGoals.reduce((sum, goal) => sum + goal.current, 0);
  const totalMonthly = activeGoals.reduce((sum, goal) => sum + goal.monthlyContribution, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pelacak Tabungan</h1>
          <p className="text-muted-foreground mt-1">Kelola target tabungan dan pantau progress pencapaian</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Target
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Goal Form */}
        <Card className="xl:col-span-1 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">Form Target Tabungan</CardTitle>
            <CardDescription>Buat target tabungan baru</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Nama Target</Label>
              <Input id="title" placeholder="Contoh: Dana Darurat" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input id="description" placeholder="Deskripsi singkat target" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target Jumlah</Label>
              <Input id="target" type="number" placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly">Kontribusi Bulanan</Label>
              <Input id="monthly" type="number" placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keuangan">Keuangan</SelectItem>
                  <SelectItem value="liburan">Liburan</SelectItem>
                  <SelectItem value="elektronik">Elektronik</SelectItem>
                  <SelectItem value="kendaraan">Kendaraan</SelectItem>
                  <SelectItem value="pendidikan">Pendidikan</SelectItem>
                  <SelectItem value="lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
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
              Simpan Target
            </Button>
          </CardContent>
        </Card>

        {/* Summary & Goals */}
        <div className="xl:col-span-3 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-primary shadow-card border-0">
              <CardContent className="p-6 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Total Target</p>
                    <p className="text-2xl font-bold">Rp {totalTarget.toLocaleString('id-ID')}</p>
                  </div>
                  <Target className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-success shadow-card border-0">
              <CardContent className="p-6 text-success-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Sudah Terkumpul</p>
                    <p className="text-2xl font-bold">Rp {totalSaved.toLocaleString('id-ID')}</p>
                  </div>
                  <DollarSign className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Progress Keseluruhan</p>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.round((totalSaved / totalTarget) * 100)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Kontribusi Bulanan</p>
                    <p className="text-2xl font-bold text-foreground">Rp {totalMonthly.toLocaleString('id-ID')}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Goals List */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">Daftar Target Tabungan</CardTitle>
              <CardDescription>Semua target tabungan dan progressnya</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {savingsGoals.map((goal) => {
                const progress = getProgress(goal.current, goal.target);
                const StatusIcon = getStatusIcon(goal.status);
                const monthsRemaining = getMonthsRemaining(goal.deadline, goal.current, goal.target, goal.monthlyContribution);
                
                return (
                  <div key={goal.id} className="p-6 border border-border rounded-lg hover:bg-surface/50 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{goal.title}</h3>
                          <Badge className={getStatusColor(goal.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {goal.status === 'completed' ? 'Selesai' : 
                             goal.status === 'active' ? 'Aktif' : 'Ditunda'}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(goal.priority)}>
                            {goal.priority === 'high' ? 'Prioritas Tinggi' :
                             goal.priority === 'medium' ? 'Prioritas Sedang' : 'Prioritas Rendah'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Progress:</span>
                            <p className="font-medium text-foreground">{progress.toFixed(1)}%</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Terkumpul:</span>
                            <p className="font-medium text-success">Rp {goal.current.toLocaleString('id-ID')}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Target:</span>
                            <p className="font-medium text-foreground">Rp {goal.target.toLocaleString('id-ID')}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Deadline:</span>
                            <p className="font-medium text-foreground">
                              {new Date(goal.deadline).toLocaleDateString('id-ID')}
                            </p>
                          </div>
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

                    <div className="space-y-3">
                      <Progress value={progress} className="h-3" />
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">
                            Bulanan: <span className="font-medium text-foreground">
                              Rp {goal.monthlyContribution.toLocaleString('id-ID')}
                            </span>
                          </span>
                          {goal.status === 'active' && monthsRemaining !== Infinity && (
                            <span className="text-muted-foreground">
                              Sisa: <span className="font-medium text-warning">
                                {monthsRemaining} bulan
                              </span>
                            </span>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {goal.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}