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
  Banknote
} from "lucide-react";

export default function Categories() {
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

  const categories = [
    // Income Categories
    { id: 1, name: "Gaji", type: "income", icon: "DollarSign", color: "bg-success", count: 12 },
    { id: 2, name: "Freelance", type: "income", icon: "TrendingUp", color: "bg-primary", count: 5 },
    { id: 3, name: "Investasi", type: "income", icon: "Target", color: "bg-success", count: 3 },
    { id: 4, name: "Transfer", type: "income", icon: "Banknote", color: "bg-success", count: 8 },
    
    // Expense Categories
    { id: 5, name: "Makanan", type: "expense", icon: "Utensils", color: "bg-danger", count: 45 },
    { id: 6, name: "Transport", type: "expense", icon: "Car", color: "bg-danger", count: 23 },
    { id: 7, name: "Tagihan", type: "expense", icon: "Home", color: "bg-warning", count: 15 },
    { id: 8, name: "Belanja", type: "expense", icon: "ShoppingBag", color: "bg-danger", count: 18 },
    { id: 9, name: "Hiburan", type: "expense", icon: "Gamepad2", color: "bg-danger", count: 12 },
    { id: 10, name: "Kesehatan", type: "expense", icon: "Heart", color: "bg-warning", count: 7 },
    
    // Savings Categories
    { id: 11, name: "Dana Darurat", type: "savings", icon: "Target", color: "bg-primary", count: 6 },
    { id: 12, name: "Liburan", type: "savings", icon: "Car", color: "bg-primary", count: 4 },
    
    // Debt Categories
    { id: 13, name: "Kartu Kredit", type: "debt", icon: "CreditCard", color: "bg-warning", count: 8 },
    { id: 14, name: "KTA", type: "debt", icon: "Building2", color: "bg-warning", count: 3 }
  ];

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

  const groupedCategories = categories.reduce((acc, category) => {
    if (!acc[category.type]) acc[category.type] = [];
    acc[category.type].push(category);
    return acc;
  }, {} as Record<string, typeof categories>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kategori Keuangan</h1>
          <p className="text-muted-foreground mt-1">Kelola kategori pemasukan, pengeluaran, tabungan, dan utang</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Kategori
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Category Form */}
        <Card className="xl:col-span-1 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">Form Kategori</CardTitle>
            <CardDescription>Tambah atau edit kategori</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Kategori</Label>
              <Input id="name" placeholder="Masukkan nama kategori" />
            </div>

            <div className="space-y-2">
              <Label>Tipe Kategori</Label>
              <Select>
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
              <Select>
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Warna</Label>
              <div className="grid grid-cols-4 gap-2">
                {['bg-success', 'bg-danger', 'bg-warning', 'bg-primary', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'].map((color) => (
                  <button key={color} className={`w-8 h-8 rounded-lg ${color} hover:scale-110 transition-transform`} />
                ))}
              </div>
            </div>

            <Button className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
              Simpan Kategori
            </Button>
          </CardContent>
        </Card>

        {/* Categories List */}
        <div className="xl:col-span-3 space-y-6">
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
                    <CardDescription>
                      Total transaksi: {typeCategories.reduce((sum, cat) => sum + cat.count, 0)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeCategories.map((category) => {
                    const IconComponent = getCategoryIcon(category.icon);
                    return (
                      <div key={category.id} className="p-4 border border-border rounded-lg hover:bg-surface/50 transition-colors group">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-lg ${category.color}/10`}>
                            <IconComponent className={`h-5 w-5 ${category.color.replace('bg-', 'text-')}`} />
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-danger hover:text-danger">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{category.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {category.count} transaksi
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}