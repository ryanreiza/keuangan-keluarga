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
  Building2, 
  CreditCard, 
  Eye, 
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp
} from "lucide-react";
import { useState } from "react";

export default function Accounts() {
  const [showBalance, setShowBalance] = useState(true);

  const bankLogos = {
    "BCA": "🟦",
    "Mandiri": "🟨", 
    "BRI": "🟫",
    "BNI": "🟧",
    "CIMB": "🟥",
    "Permata": "🟪",
    "Danamon": "⬜",
    "OCBC": "🟩"
  };

  const accounts = [
    {
      id: 1,
      bank: "BCA",
      accountName: "Tabungan Utama",
      accountNumber: "1234567890",
      balance: 15750000,
      type: "savings",
      lastTransaction: "2024-12-15",
      monthlyChange: 8.5,
      isActive: true
    },
    {
      id: 2,
      bank: "Mandiri",
      accountName: "Giro Bisnis",
      accountNumber: "0987654321",
      balance: 8500000,
      type: "checking",
      lastTransaction: "2024-12-14",
      monthlyChange: -2.1,
      isActive: true
    },
    {
      id: 3,
      bank: "BRI",
      accountName: "Tabungan Haji",
      accountNumber: "1122334455",
      balance: 1500000,
      type: "savings",
      lastTransaction: "2024-12-10",
      monthlyChange: 15.2,
      isActive: true
    },
    {
      id: 4,
      bank: "BNI",
      accountName: "Deposito 12 Bulan",
      accountNumber: "5566778899",
      balance: 25000000,
      type: "deposit",
      lastTransaction: "2024-11-15",
      monthlyChange: 0.8,
      isActive: false
    }
  ];

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'savings': return 'Tabungan';
      case 'checking': return 'Giro';
      case 'deposit': return 'Deposito';
      case 'credit': return 'Kartu Kredit';
      default: return type;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'savings': return 'bg-success-bg text-success-foreground';
      case 'checking': return 'bg-primary/10 text-primary';
      case 'deposit': return 'bg-warning-bg text-warning-foreground';
      case 'credit': return 'bg-danger-bg text-danger-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatBalance = (balance: number) => {
    if (!showBalance) return "••••••••";
    return `Rp ${balance.toLocaleString('id-ID')}`;
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rekening Bank</h1>
          <p className="text-muted-foreground mt-1">Kelola semua rekening bank dan saldo Anda</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowBalance(!showBalance)}
          >
            {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Rekening
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Account Form */}
        <Card className="xl:col-span-1 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">Form Rekening</CardTitle>
            <CardDescription>Tambah rekening bank baru</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank">Bank</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BCA">🟦 BCA</SelectItem>
                  <SelectItem value="Mandiri">🟨 Bank Mandiri</SelectItem>
                  <SelectItem value="BRI">🟫 BRI</SelectItem>
                  <SelectItem value="BNI">🟧 BNI</SelectItem>
                  <SelectItem value="CIMB">🟥 CIMB Niaga</SelectItem>
                  <SelectItem value="Permata">🟪 Permata Bank</SelectItem>
                  <SelectItem value="Danamon">⬜ Danamon</SelectItem>
                  <SelectItem value="OCBC">🟩 OCBC NISP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Nama Rekening</Label>
              <Input id="accountName" placeholder="Contoh: Tabungan Utama" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Nomor Rekening</Label>
              <Input id="accountNumber" placeholder="1234567890" />
            </div>

            <div className="space-y-2">
              <Label>Jenis Rekening</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis rekening" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Tabungan</SelectItem>
                  <SelectItem value="checking">Giro</SelectItem>
                  <SelectItem value="deposit">Deposito</SelectItem>
                  <SelectItem value="credit">Kartu Kredit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Saldo Initial</Label>
              <Input id="balance" type="number" placeholder="0" />
            </div>

            <Button className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
              Simpan Rekening
            </Button>
          </CardContent>
        </Card>

        {/* Accounts Overview */}
        <div className="xl:col-span-3 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-primary shadow-card border-0">
              <CardContent className="p-6 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Total Saldo</p>
                    <p className="text-2xl font-bold">{formatBalance(totalBalance)}</p>
                  </div>
                  <Building2 className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-success shadow-card border-0">
              <CardContent className="p-6 text-success-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Rekening Aktif</p>
                    <p className="text-2xl font-bold">{accounts.filter(acc => acc.isActive).length}</p>
                  </div>
                  <CreditCard className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Perubahan Bulan Ini</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <p className="text-2xl font-bold text-success">+12.8%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Accounts List */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">Daftar Rekening</CardTitle>
              <CardDescription>Semua rekening bank Anda</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {accounts.map((account, index) => (
                  <div key={account.id} className={`p-6 hover:bg-surface/50 transition-colors group ${index !== accounts.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">
                          {bankLogos[account.bank as keyof typeof bankLogos]}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-foreground">{account.accountName}</h3>
                            <Badge className={getAccountTypeColor(account.type)}>
                              {getAccountTypeLabel(account.type)}
                            </Badge>
                            {account.isActive && (
                              <Badge className="bg-success-bg text-success-foreground">
                                Aktif
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{account.bank} • •••• {account.accountNumber.slice(-4)}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Transaksi terakhir: {new Date(account.lastTransaction).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground">
                            {formatBalance(account.balance)}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            {account.monthlyChange >= 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-success" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-danger" />
                            )}
                            <span className={`text-sm font-medium ${account.monthlyChange >= 0 ? 'text-success' : 'text-danger'}`}>
                              {account.monthlyChange >= 0 ? '+' : ''}{account.monthlyChange}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-danger hover:text-danger">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}