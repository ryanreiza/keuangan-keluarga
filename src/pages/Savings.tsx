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
  Clock,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useSavings, CreateSavingsGoalData } from "@/hooks/useSavings";
import { useCategories } from "@/hooks/useCategories";
import { format } from "date-fns";

export default function Savings() {
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    current_amount: "",
    target_date: "",
    category_id: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { savingsGoals, loading: savingsLoading, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useSavings();
  const { categories } = useCategories();

  const savingsCategories = categories.filter(cat => cat.type === 'savings');

  const getProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getStatusColor = (progress: number) => {
    if (progress >= 100) return 'bg-success-bg text-success-foreground';
    if (progress >= 50) return 'bg-primary/10 text-primary';
    return 'bg-warning-bg text-warning-foreground';
  };

  const getStatusIcon = (progress: number) => {
    if (progress >= 100) return CheckCircle;
    if (progress >= 50) return TrendingUp;
    return Clock;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.target_amount || !formData.category_id) return;

    setLoading(true);
    const goalData: CreateSavingsGoalData = {
      name: formData.name,
      target_amount: parseFloat(formData.target_amount),
      current_amount: parseFloat(formData.current_amount) || 0,
      target_date: formData.target_date || undefined,
      category_id: formData.category_id,
    };

    let result;
    if (editingId) {
      result = await updateSavingsGoal(editingId, goalData);
    } else {
      result = await createSavingsGoal(goalData);
    }

    if (!result.error) {
      setFormData({ name: "", target_amount: "", current_amount: "", target_date: "", category_id: "" });
      setEditingId(null);
      setShowForm(false);
    }
    setLoading(false);
  };

  const handleEdit = (goal: any) => {
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      target_date: goal.target_date ? format(new Date(goal.target_date), "yyyy-MM-dd") : "",
      category_id: goal.category_id
    });
    setEditingId(goal.id);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setFormData({ name: "", target_amount: "", current_amount: "", target_date: "", category_id: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const activeGoals = savingsGoals.filter(goal => !goal.is_achieved);
  const totalTarget = activeGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalSaved = activeGoals.reduce((sum, goal) => sum + goal.current_amount, 0);

  if (savingsLoading) {
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
          <h1 className="text-3xl font-bold text-foreground">Pelacak Tabungan</h1>
          <p className="text-muted-foreground mt-1">Kelola target tabungan dan pantau progress pencapaian</p>
        </div>
        <Button 
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Sembunyikan Form' : 'Tambah Target'}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Goal Form */}
        {showForm && (
        <Card className="xl:col-span-1 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Edit Target" : "Form Target Tabungan"}
            </CardTitle>
            <CardDescription>
              {editingId ? "Edit target tabungan" : "Buat target tabungan baru"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Target</Label>
                <Input 
                  id="name" 
                  placeholder="Contoh: Dana Darurat"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Target Jumlah</Label>
                <Input 
                  id="target" 
                  type="number" 
                  placeholder="0"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current">Jumlah Saat Ini</Label>
                <Input 
                  id="current" 
                  type="number" 
                  placeholder="0"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({...formData, current_amount: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_date">Target Tanggal</Label>
                <Input 
                  id="target_date" 
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {savingsCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingId ? "Update Target" : "Simpan Target"}
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

        {/* Summary & Goals */}
        <div className={`${showForm ? 'xl:col-span-3' : 'xl:col-span-4'} space-y-6`}>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Goals List */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">Daftar Target Tabungan</CardTitle>
              <CardDescription>Semua target tabungan dan progressnya ({savingsGoals.length} target)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {savingsGoals.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Belum ada target tabungan. Buat target pertama Anda untuk mulai menabung dengan tujuan yang jelas.
                </div>
              ) : (
                savingsGoals.map((goal) => {
                  const progress = getProgress(goal.current_amount, goal.target_amount);
                  const StatusIcon = getStatusIcon(progress);
                  
                  return (
                    <div key={goal.id} className="p-6 border border-border rounded-lg hover:bg-surface/50 transition-colors group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{goal.name}</h3>
                            <Badge className={getStatusColor(progress)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {progress >= 100 ? 'Tercapai' : progress >= 50 ? 'On Track' : 'Perlu Usaha'}
                            </Badge>
                            {goal.categories && (
                              <Badge variant="outline">
                                {goal.categories.name}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-muted-foreground">Progress:</span>
                              <p className="font-medium text-foreground">{progress.toFixed(1)}%</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Terkumpul:</span>
                              <p className="font-medium text-success">Rp {goal.current_amount.toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Target:</span>
                              <p className="font-medium text-foreground">Rp {goal.target_amount.toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Target Tanggal:</span>
                              <p className="font-medium text-foreground">
                                {goal.target_date ? new Date(goal.target_date).toLocaleDateString('id-ID') : 'Tidak ditetapkan'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(goal)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger" onClick={() => deleteSavingsGoal(goal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Progress value={progress} className="h-3" />
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">
                              Sisa: <span className="font-medium text-warning">
                                Rp {Math.max(0, goal.target_amount - goal.current_amount).toLocaleString('id-ID')}
                              </span>
                            </span>
                            {goal.target_date && (
                              <span className="text-muted-foreground">
                                Sisa waktu: <span className="font-medium text-foreground">
                                  {Math.max(0, Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} hari
                                </span>
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Dibuat: {new Date(goal.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
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