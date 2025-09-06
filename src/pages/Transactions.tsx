import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, CalendarIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTransactions, CreateTransactionData } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { ResetTransactionsDialog } from "@/components/ResetTransactionsDialog";

export default function Transactions() {
  const [date, setDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "",
    category_id: "",
    account_id: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const { transactions, loading: transactionsLoading, createTransaction, resetAllTransactions } = useTransactions();
  const { categories, loading: categoriesLoading } = useCategories();
  const { accounts, loading: accountsLoading } = useAccounts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.type || !formData.category_id || !formData.account_id) {
      return;
    }

    setLoading(true);
    const transactionData: CreateTransactionData = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type as 'income' | 'expense',
      category_id: formData.category_id,
      account_id: formData.account_id,
      transaction_date: format(date, "yyyy-MM-dd"),
    };

    const result = await createTransaction(transactionData);
    if (!result.error) {
      setFormData({
        description: "",
        amount: "",
        type: "",
        category_id: "",
        account_id: "",
      });
      setDate(new Date());
    }
    setLoading(false);
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.categories?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.accounts?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter categories by type
  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const availableCategories = formData.type === 'income' ? incomeCategories : 
                             formData.type === 'expense' ? expenseCategories : 
                             categories;

  if (transactionsLoading || categoriesLoading || accountsLoading) {
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
          <h1 className="text-3xl font-bold text-foreground">Transaksi</h1>
          <p className="text-muted-foreground mt-1">Kelola semua transaksi keuangan Anda</p>
        </div>
        <div className="flex items-center gap-3">
          <ResetTransactionsDialog onReset={resetAllTransactions} />
          <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Transaksi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Transaction Form */}
        <Card className="xl:col-span-1 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">Form Transaksi</CardTitle>
            <CardDescription>Tambah transaksi baru</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input 
                  id="description" 
                  placeholder="Masukkan deskripsi transaksi"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value, category_id: ""})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe transaksi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Pemasukan</SelectItem>
                    <SelectItem value="expense">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})} disabled={!formData.type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rekening</Label>
                <Select value={formData.account_id} onValueChange={(value) => setFormData({...formData, account_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih rekening" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bank_name} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan Transaksi
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Transaction List */}
        <Card className="xl:col-span-3 shadow-card border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Daftar Transaksi</CardTitle>
                <CardDescription>Riwayat semua transaksi ({filteredTransactions.length} transaksi)</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-10 w-64" 
                    placeholder="Cari transaksi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {searchTerm ? "Tidak ada transaksi yang cocok dengan pencarian" : "Belum ada transaksi"}
                </div>
              ) : (
                filteredTransactions.map((transaction, index) => (
                  <div key={transaction.id} className={`flex items-center justify-between p-4 hover:bg-surface/50 transition-colors ${index !== filteredTransactions.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-success-bg' : 'bg-danger-bg'}`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4 text-success" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-danger" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{transaction.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.transaction_date).toLocaleDateString('id-ID')}
                          </p>
                          <Badge variant="secondary" className="text-xs">{transaction.categories?.name}</Badge>
                          <Badge variant="outline" className="text-xs">{transaction.accounts?.name}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-lg ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                        {transaction.type === 'income' ? '+' : '-'}Rp {Math.abs(transaction.amount).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}