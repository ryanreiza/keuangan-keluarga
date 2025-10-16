import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { id } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { useDebts } from "@/hooks/useDebts";
import { ResetTransactionsDialog } from "@/components/ResetTransactionsDialog";
import { DeleteTransactionDialog } from "@/components/DeleteTransactionDialog";

export default function Transactions() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "",
    category_id: "",
    account_id: "",
    destination_account_id: "",
    debt_id: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<{ id: string; description: string } | null>(null);

  const { transactions, loading: transactionsLoading, createTransaction, deleteTransaction, resetAllTransactions } = useTransactions();
  const { categories, loading: categoriesLoading } = useCategories();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { debts, loading: debtsLoading } = useDebts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.type || !formData.account_id) {
      return;
    }

    // Validate transfer-specific requirements
    if (formData.type === 'transfer') {
      if (!formData.destination_account_id) {
        return;
      }
      if (formData.account_id === formData.destination_account_id) {
        return;
      }
    } else if (formData.type === 'debt_payment') {
      // For debt payment transactions, debt_id is required
      if (!formData.debt_id) {
        return;
      }
    } else {
      // For non-transfer and non-debt-payment transactions, category is required
      if (!formData.category_id) {
        return;
      }
    }

    setLoading(true);
    const transactionData: any = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      account_id: formData.account_id,
      transaction_date: format(date, "yyyy-MM-dd"),
    };

    // Add category for non-transfer transactions (use a default for transfers and debt payments)
    if (formData.type === 'transfer') {
      // Find or use a default "Transfer" category
      const transferCategory = categories?.find(cat => cat.name === 'Transfer') || categories?.[0];
      transactionData.category_id = transferCategory?.id || formData.category_id;
      transactionData.destination_account_id = formData.destination_account_id;
    } else if (formData.type === 'debt_payment') {
      // Find or use a default "Debt Payment" category
      const debtCategory = categories?.find(cat => cat.name === 'Pembayaran Utang') || expenseCategories?.[0];
      transactionData.category_id = debtCategory?.id || formData.category_id;
      transactionData.debt_id = formData.debt_id;
    } else {
      transactionData.category_id = formData.category_id;
    }

    const result = await createTransaction(transactionData);
    if (!result.error) {
      setFormData({
        description: "",
        amount: "",
        type: "",
        category_id: "",
        account_id: "",
        destination_account_id: "",
        debt_id: "",
      });
      setDate(new Date());
      setShowForm(false);
    }
    setLoading(false);
  };

  // Generate month options based on actual transaction dates
  const monthOptions = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      // Return current month as default if no transactions
      return [{
        value: format(new Date(), 'yyyy-MM'),
        label: format(new Date(), 'MMMM yyyy', { locale: id })
      }];
    }

    // Extract unique months from transactions
    const uniqueMonths = new Set<string>();
    transactions.forEach(t => {
      const monthKey = t.transaction_date.slice(0, 7); // Get YYYY-MM
      uniqueMonths.add(monthKey);
    });

    // Convert to array and sort in descending order (newest first)
    const sortedMonths = Array.from(uniqueMonths).sort((a, b) => b.localeCompare(a));

    // Format for display
    return sortedMonths.map(monthKey => ({
      value: monthKey,
      label: format(new Date(monthKey + '-01'), 'MMMM yyyy', { locale: id })
    }));
  }, [transactions]);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.categories?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.accounts?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const transactionMonth = transaction.transaction_date.slice(0, 7);
    const matchesMonth = transactionMonth === selectedMonth;
    
    return matchesSearch && matchesMonth;
  });

  // Filter categories by type
  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const availableCategories = formData.type === 'income' ? incomeCategories : 
                             formData.type === 'expense' ? expenseCategories : 
                             categories;

  const handleDeleteClick = (id: string, description: string) => {
    setSelectedTransaction({ id, description });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedTransaction) {
      deleteTransaction(selectedTransaction.id);
      setSelectedTransaction(null);
    }
  };

  // Filter out paid off debts
  const activeDebts = debts?.filter(debt => !debt.is_paid_off) || [];

  if (transactionsLoading || categoriesLoading || accountsLoading || debtsLoading) {
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
          <p className="text-muted-foreground mt-1">
            {monthOptions.find(opt => opt.value === selectedMonth)?.label || 'Kelola semua transaksi keuangan Anda'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ResetTransactionsDialog onReset={resetAllTransactions} />
          <Button 
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "Tutup Form" : "Tambah Transaksi"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Transaction Form */}
        {showForm && (
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
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value, category_id: "", destination_account_id: "", debt_id: ""})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe transaksi" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    <SelectItem value="income">Pemasukan</SelectItem>
                    <SelectItem value="expense">Pengeluaran</SelectItem>
                    <SelectItem value="transfer">Transfer Antar Rekening</SelectItem>
                    <SelectItem value="debt_payment">Bayar Utang</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type !== 'transfer' && formData.type !== 'debt_payment' && (
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})} disabled={!formData.type}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.type === 'debt_payment' && (
                <div className="space-y-2">
                  <Label>Pilih Utang</Label>
                  <Select value={formData.debt_id} onValueChange={(value) => setFormData({...formData, debt_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih utang yang akan dibayar" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {activeDebts.length > 0 ? (
                        activeDebts.map((debt) => (
                          <SelectItem key={debt.id} value={debt.id}>
                            {debt.creditor_name} - Sisa: Rp {debt.remaining_amount.toLocaleString("id-ID")}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Tidak ada utang aktif
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  {formData.type === 'transfer' ? 'Rekening Asal' : 
                   formData.type === 'debt_payment' ? 'Rekening Pembayaran' : 
                   'Rekening'}
                </Label>
                <Select value={formData.account_id} onValueChange={(value) => setFormData({...formData, account_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      formData.type === 'transfer' ? 'Pilih rekening asal' : 
                      formData.type === 'debt_payment' ? 'Pilih rekening pembayaran' : 
                      'Pilih rekening'
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} - {account.bank_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'transfer' && (
                <div className="space-y-2">
                  <Label>Rekening Tujuan</Label>
                  <Select value={formData.destination_account_id} onValueChange={(value) => setFormData({...formData, destination_account_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih rekening tujuan" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {accounts.filter(account => account.id !== formData.account_id).map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} - {account.bank_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
        )}

        {/* Transaction List */}
        <Card className={`${showForm ? 'xl:col-span-3' : 'xl:col-span-4'} shadow-card border-0`}>
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
                    placeholder="Cari transaksi..." 
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg group">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'income' 
                          ? 'bg-success/10' 
                          : transaction.type === 'expense' || transaction.type === 'debt_payment'
                          ? 'bg-danger/10'
                          : 'bg-primary/10'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4 text-success" />
                        ) : transaction.type === 'expense' || transaction.type === 'debt_payment' ? (
                          <ArrowDownRight className="h-4 w-4 text-danger" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.type === 'transfer' 
                            ? `Transfer antar rekening`
                            : transaction.type === 'debt_payment'
                            ? `Pembayaran Utang`
                            : transaction.categories?.name
                          } • {transaction.accounts?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        transaction.type === 'income' 
                          ? 'default' 
                          : transaction.type === 'expense' || transaction.type === 'debt_payment'
                          ? 'destructive'
                          : 'secondary'
                      } className="mb-1">
                        {transaction.type === 'income' ? 'Pemasukan' : 
                         transaction.type === 'expense' ? 'Pengeluaran' : 
                         transaction.type === 'debt_payment' ? 'Bayar Utang' : 'Transfer'}
                      </Badge>
                      <p className={`font-bold ${
                        transaction.type === 'income' 
                          ? 'text-success' 
                          : transaction.type === 'expense' || transaction.type === 'debt_payment'
                          ? 'text-danger'
                          : 'text-primary'
                      }`}>
                        {transaction.type === 'income' 
                          ? '+' 
                          : transaction.type === 'expense' || transaction.type === 'debt_payment'
                          ? '-' 
                          : ''
                        }Rp {transaction.amount.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.transaction_date).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                      onClick={() => handleDeleteClick(transaction.id, transaction.description || 'Transaksi')}
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Tidak ada transaksi yang ditemukan</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteTransactionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        transactionDescription={selectedTransaction?.description || ''}
      />
    </div>
  );
}