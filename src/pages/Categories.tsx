import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Utensils, 
  Car, 
  Home, 
  DollarSign, 
  CreditCard, 
  TrendingUp,
  Target,
  Building2,
  ShoppingBag,
  Gamepad2,
  Heart,
  Banknote,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useCategories, CreateCategoryData } from "@/hooks/useCategories";

export default function Categories() {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    icon: "",
    color: "#3B82F6"
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { categories, loading: categoriesLoading, createCategory, updateCategory, deleteCategory } = useCategories();

  const categoryIcons = {
    "Utensils": Utensils,
    "Car": Car,
    "Home": Home,
    "DollarSign": DollarSign,
    "CreditCard": CreditCard,
    "TrendingUp": TrendingUp,
    "Target": Target,
    "Building2": Building2,
    "ShoppingBag": ShoppingBag,
    "Gamepad2": Gamepad2,
    "Heart": Heart,
    "Banknote": Banknote
  };

  const getCategoryIcon = (iconName: string) => {
    const IconComponent = categoryIcons[iconName as keyof typeof categoryIcons] || DollarSign;
    return IconComponent;
  };

  const getCategoryTypeLabel = (type: string) => {
    switch (type) {
      case 'income': return 'Pemasukan';
      case 'expense': return 'Pengeluaran';
      case 'savings': return 'Tabungan';
      case 'debt': return 'Utang';
      default: return type;
    }
  };

  const getCategoryTypeColor = (type: string) => {
    switch (type) {
      case 'income': return 'bg-success-bg text-success-foreground';
      case 'expense': return 'bg-danger-bg text-danger-foreground';
      case 'savings': return 'bg-primary/10 text-primary';
      case 'debt': return 'bg-warning-bg text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type) return;

    setLoading(true);
    const categoryData: CreateCategoryData = {
      name: formData.name,
      type: formData.type as 'income' | 'expense' | 'savings' | 'debt',
      icon: formData.icon || 'DollarSign',
      color: formData.color,
    };

    let result;
    if (editingId) {
      result = await updateCategory(editingId, categoryData);
    } else {
      result = await createCategory(categoryData);
    }

    if (!result.error) {
      setFormData({ name: "", type: "", icon: "", color: "#3B82F6" });
      setEditingId(null);
      if (!editingId) setShowForm(false);
    }
    setLoading(false);
  };

  const handleEdit = (category: any) => {
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon || '',
      color: category.color || '#3B82F6'
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setFormData({ name: "", type: "", icon: "", color: "#3B82F6" });
    setEditingId(null);
    setShowForm(false);
  };

  const groupedCategories = categories.reduce((acc, category) => {
    if (!acc[category.type]) acc[category.type] = [];
    acc[category.type].push(category);
    return acc;
  }, {} as Record<string, typeof categories>);

  if (categoriesLoading) {
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
          <h1 className="text-3xl font-bold text-foreground">Kategori Keuangan</h1>
          <p className="text-muted-foreground mt-1">Kelola kategori pemasukan, pengeluaran, tabungan, dan utang</p>
        </div>
        <Button 
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Tutup Form" : "Tambah Kategori"}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Category Form */}
        {showForm && (
          <Card className="xl:col-span-1 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Edit Kategori" : "Form Kategori"}
            </CardTitle>
            <CardDescription>
              {editingId ? "Edit kategori yang ada" : "Tambah kategori baru"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Kategori</Label>
                <Input 
                  id="name" 
                  placeholder="Masukkan nama kategori"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipe Kategori</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Pemasukan</SelectItem>
                    <SelectItem value="expense">Pengeluaran</SelectItem>
                    <SelectItem value="savings">Tabungan</SelectItem>
                    <SelectItem value="debt">Utang</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ikon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({...formData, icon: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih ikon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DollarSign">💰 Uang</SelectItem>
                    <SelectItem value="Utensils">🍽️ Makanan</SelectItem>
                    <SelectItem value="Car">🚗 Transport</SelectItem>
                    <SelectItem value="Home">🏠 Rumah</SelectItem>
                    <SelectItem value="ShoppingBag">🛍️ Belanja</SelectItem>
                    <SelectItem value="Gamepad2">🎮 Hiburan</SelectItem>
                    <SelectItem value="Heart">❤️ Kesehatan</SelectItem>
                    <SelectItem value="Target">🎯 Target</SelectItem>
                    <SelectItem value="Building2">🏢 Bank</SelectItem>
                    <SelectItem value="CreditCard">💳 Kredit</SelectItem>
                    <SelectItem value="TrendingUp">📈 Investasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Warna</Label>
                <div className="grid grid-cols-4 gap-2">
                  {['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'].map((color) => (
                    <button 
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-lg hover:scale-110 transition-transform border-2 ${formData.color === color ? 'border-foreground' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({...formData, color})}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingId ? "Update Kategori" : "Simpan Kategori"}
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

        {/* Categories List */}
        <div className={`${showForm ? 'xl:col-span-3' : 'xl:col-span-4'} space-y-6`}>
          {Object.entries(groupedCategories).map(([type, typeCategories]) => (
            <Card key={type} className="shadow-card border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Badge className={getCategoryTypeColor(type)}>
                        {getCategoryTypeLabel(type)}
                      </Badge>
                      <span>({typeCategories.length} kategori)</span>
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeCategories.map((category) => {
                    const IconComponent = getCategoryIcon(category.icon || 'DollarSign');
                    return (
                      <div key={category.id} className="p-4 border border-border rounded-lg hover:bg-surface/50 transition-colors group">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}20` }}>
                            <IconComponent className="h-5 w-5" style={{ color: category.color }} />
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(category)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-danger hover:text-danger" onClick={() => deleteCategory(category.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{category.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Dibuat {new Date(category.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {categories.length === 0 && (
            <Card className="shadow-card border-0">
              <CardContent className="p-8 text-center text-muted-foreground">
                Belum ada kategori. Tambahkan kategori pertama Anda untuk mulai mengatur keuangan.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}