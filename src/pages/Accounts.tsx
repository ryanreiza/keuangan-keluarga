import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  TrendingUp,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useAccounts, CreateAccountData } from "@/hooks/useAccounts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Accounts() {
  const [showBalance, setShowBalance] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    bank_name: "",
    account_number: "",
    initial_balance: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [showForm, setShowForm] = useState(false);

  const { accounts, loading: accountsLoading, createAccount, updateAccount, deleteAccount } = useAccounts();
  const { user } = useAuth();
  const { toast } = useToast();

  const bankOptions = [
    { value: 'BCA', label: 'Bank Central Asia (BCA)', emoji: '🟦' },
    { value: 'Mandiri', label: 'Bank Mandiri', emoji: '🟨' },
    { value: 'BRI', label: 'Bank Rakyat Indonesia (BRI)', emoji: '🟫' },
    { value: 'BNI', label: 'Bank Negara Indonesia (BNI)', emoji: '🟧' },
    { value: 'BSI', label: 'Bank Syariah Indonesia (BSI)', emoji: '🟩' },
    { value: 'CIMB', label: 'CIMB Niaga', emoji: '🟥' },
    { value: 'Permata', label: 'Permata Bank', emoji: '🟪' },
    { value: 'Danamon', label: 'Bank Danamon', emoji: '⬜' },
    { value: 'OCBC', label: 'OCBC NISP', emoji: '🟩' },
    { value: 'Panin', label: 'Panin Bank', emoji: '🔶' },
    { value: 'Mega', label: 'Bank Mega', emoji: '🟫' },
    { value: 'BTPN', label: 'Bank BTPN', emoji: '🟨' },
    { value: 'Muamalat', label: 'Bank Muamalat', emoji: '🟢' },
    { value: 'Lainnya', label: 'Bank Lainnya', emoji: '🏦' }
  ];
  
  const getBankEmoji = (bankName: string) => {
    const bank = bankOptions.find(b => b.value === bankName);
    return bank?.emoji || '🏦';
  };

  const formatBalance = (balance: number) => {
    if (!showBalance) return "••••••••";
    return `Rp ${balance.toLocaleString('id-ID')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.bank_name || !formData.initial_balance) return;

    setLoading(true);
    const accountData: CreateAccountData = {
      name: formData.name,
      bank_name: formData.bank_name,
      account_number: formData.account_number,
      initial_balance: parseFloat(formData.initial_balance),
    };

    let result;
    if (editingId) {
      result = await updateAccount(editingId, accountData);
    } else {
      result = await createAccount(accountData);
    }

    if (!result.error) {
      setFormData({ name: "", bank_name: "", account_number: "", initial_balance: "" });
      setEditingId(null);
      if (!editingId) setShowForm(false);
    }
    setLoading(false);
  };

  const handleEdit = (account: any) => {
    setFormData({
      name: account.name,
      bank_name: account.bank_name,
      account_number: account.account_number || '',
      initial_balance: account.initial_balance.toString()
    });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setFormData({ name: "", bank_name: "", account_number: "", initial_balance: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleDeleteWithPassword = async () => {
    if (!user || !deletingId || !deletePassword.trim()) {
      toast({
        title: "Error",
        description: "Password diperlukan untuk menghapus rekening",
        variant: "destructive",
      });
      return;
    }

    setDeleteLoading(true);
    try {
      // Verify password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: deletePassword,
      });

      if (authError) {
        toast({
          title: "Password salah",
          description: "Password yang Anda masukkan tidak benar",
          variant: "destructive",
        });
        return;
      }

      // If password is correct, delete the account
      await deleteAccount(deletingId);
      
      // Reset state
      setDeletingId(null);
      setDeletePassword('');
      
      toast({
        title: "Rekening dihapus",
        description: "Rekening berhasil dihapus dari sistem",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat menghapus rekening",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.current_balance, 0);
  const activeAccounts = accounts.filter(acc => acc.is_active);

  if (accountsLoading) {
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
          <Button 
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "Tutup Form" : "Tambah Rekening"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Account Form */}
        {showForm && (
          <Card className="xl:col-span-1 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Edit Rekening" : "Form Rekening"}
            </CardTitle>
            <CardDescription>
              {editingId ? "Edit rekening yang ada" : "Tambah rekening bank baru"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bank">Bank</Label>
                <Select value={formData.bank_name} onValueChange={(value) => setFormData({...formData, bank_name: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankOptions.map((bank) => (
                      <SelectItem key={bank.value} value={bank.value}>
                        <div className="flex items-center gap-2">
                          <span>{bank.emoji}</span>
                          <span>{bank.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">Nama Rekening</Label>
                <Input 
                  id="accountName" 
                  placeholder="Contoh: Tabungan Utama"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Nomor Rekening</Label>
                <Input 
                  id="accountNumber" 
                  placeholder="1234567890"
                  value={formData.account_number}
                  onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="balance">Saldo Initial</Label>
                <Input 
                  id="balance" 
                  type="number" 
                  placeholder="0"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData({...formData, initial_balance: e.target.value})}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingId ? "Update Rekening" : "Simpan Rekening"}
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

        {/* Accounts Overview */}
        <div className={`${showForm ? 'xl:col-span-3' : 'xl:col-span-4'} space-y-6`}>
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
                    <p className="text-2xl font-bold">{activeAccounts.length}</p>
                  </div>
                  <CreditCard className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Rekening</p>
                    <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Accounts List */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">Daftar Rekening</CardTitle>
              <CardDescription>Semua rekening bank Anda ({accounts.length} rekening)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {accounts.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Belum ada rekening. Tambahkan rekening pertama Anda untuk mulai melacak keuangan.
                  </div>
                ) : (
                  accounts.map((account, index) => (
                    <div key={account.id} className={`p-6 hover:bg-surface/50 transition-colors group ${index !== accounts.length - 1 ? 'border-b border-border' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">
                            {getBankEmoji(account.bank_name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-foreground">{account.name}</h3>
                              {account.is_active && (
                                <Badge className="bg-success-bg text-success-foreground">
                                  Aktif
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {account.bank_name} {account.account_number && `• •••• ${account.account_number.slice(-4)}`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Dibuat: {new Date(account.created_at).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground mb-1">Saldo Saat Ini</p>
                            <p className="text-2xl font-bold text-foreground">
                              {formatBalance(account.current_balance)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Awal: {formatBalance(account.initial_balance)}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-danger hover:text-danger"
                                  onClick={() => setDeletingId(account.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Konfirmasi Hapus Rekening</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tindakan ini akan menghapus rekening "{account.name}" secara permanen. 
                                    Masukkan password Anda untuk konfirmasi.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2">
                                  <Label htmlFor="delete-password">Password</Label>
                                  <Input
                                    id="delete-password"
                                    type="password"
                                    placeholder="Masukkan password Anda"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    disabled={deleteLoading}
                                  />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel 
                                    onClick={() => {
                                      setDeletingId(null);
                                      setDeletePassword('');
                                    }}
                                  >
                                    Batal
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteWithPassword}
                                    disabled={deleteLoading || !deletePassword.trim()}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deleteLoading ? "Menghapus..." : "Hapus Rekening"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
