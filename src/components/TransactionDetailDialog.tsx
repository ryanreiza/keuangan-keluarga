import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon, Wallet, Tag, FileText, CreditCard, Pencil, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
    id: string;
    description: string | null;
    amount: number;
    type: string;
    transaction_date: string;
    category_id: string;
    account_id: string;
    destination_account_id?: string;
    debt_id?: string;
    created_at: string;
    updated_at: string;
    categories?: {
      name: string;
    };
    accounts?: {
      name: string;
    };
  } | null;
  accounts?: Array<{ id: string; name: string; bank_name: string }>;
  debts?: Array<{ id: string; creditor_name: string; remaining_amount: number; is_paid_off: boolean }>;
  categories?: Array<{ id: string; name: string; type: string }>;
  onUpdate?: (id: string, data: any) => Promise<{ error: any }>;
}

export function TransactionDetailDialog({
  open,
  onOpenChange,
  transaction,
  accounts = [],
  debts = [],
  categories = [],
  onUpdate,
}: TransactionDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    description: "",
    amount: "",
    type: "",
    category_id: "",
    account_id: "",
    destination_account_id: "",
    debt_id: "",
    transaction_date: new Date(),
  });

  useEffect(() => {
    if (transaction) {
      setEditData({
        description: transaction.description || "",
        amount: transaction.amount.toString(),
        type: transaction.type,
        category_id: transaction.category_id,
        account_id: transaction.account_id,
        destination_account_id: transaction.destination_account_id || "",
        debt_id: transaction.debt_id || "",
        transaction_date: new Date(transaction.transaction_date),
      });
    }
  }, [transaction]);

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
    }
  }, [open]);

  if (!transaction) return null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "income":
        return "Pemasukan";
      case "expense":
        return "Pengeluaran";
      case "transfer":
        return "Transfer";
      case "debt_payment":
        return "Bayar Utang";
      default:
        return type;
    }
  };

  const getTypeVariant = (type: string) => {
    switch (type) {
      case "income":
        return "default";
      case "expense":
      case "debt_payment":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getDestinationAccount = () => {
    if (transaction.destination_account_id) {
      const destAccount = accounts.find(acc => acc.id === transaction.destination_account_id);
      return destAccount ? `${destAccount.name} - ${destAccount.bank_name}` : "-";
    }
    return null;
  };

  const getDebtCreditor = () => {
    if (transaction.debt_id) {
      const debt = debts.find(d => d.id === transaction.debt_id);
      return debt?.creditor_name || "-";
    }
    return null;
  };

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const availableCategories = editData.type === 'income' ? incomeCategories : 
                             editData.type === 'expense' ? expenseCategories : 
                             categories;

  const activeDebts = debts.filter(debt => !debt.is_paid_off || debt.id === transaction.debt_id);

  const handleSave = async () => {
    if (!onUpdate) return;
    
    setLoading(true);
    const result = await onUpdate(transaction.id, {
      description: editData.description,
      amount: parseFloat(editData.amount),
      type: editData.type,
      category_id: editData.category_id,
      account_id: editData.account_id,
      destination_account_id: editData.type === 'transfer' ? editData.destination_account_id : null,
      debt_id: editData.debt_id || null,
      transaction_date: format(editData.transaction_date, "yyyy-MM-dd"),
    });
    setLoading(false);
    
    if (!result.error) {
      setIsEditing(false);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      description: transaction.description || "",
      amount: transaction.amount.toString(),
      type: transaction.type,
      category_id: transaction.category_id,
      account_id: transaction.account_id,
      destination_account_id: transaction.destination_account_id || "",
      debt_id: transaction.debt_id || "",
      transaction_date: new Date(transaction.transaction_date),
    });
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${
                transaction.type === "income"
                  ? "bg-success/10"
                  : transaction.type === "expense" || transaction.type === "debt_payment"
                  ? "bg-danger/10"
                  : "bg-primary/10"
              }`}>
                {transaction.type === "income" ? (
                  <ArrowUpRight className="h-5 w-5 text-success" />
                ) : transaction.type === "expense" || transaction.type === "debt_payment" ? (
                  <ArrowDownRight className="h-5 w-5 text-danger" />
                ) : (
                  <ArrowUpRight className="h-5 w-5 text-primary" />
                )}
              </div>
              {isEditing ? "Edit Transaksi" : "Detail Transaksi"}
            </div>
            {!isEditing && onUpdate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Ubah informasi transaksi" : "Informasi lengkap transaksi"}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Input
                id="edit-description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Masukkan deskripsi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">Jumlah</Label>
              <Input
                id="edit-amount"
                type="number"
                value={editData.amount}
                onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipe</Label>
              <Select
                value={editData.type}
                onValueChange={(value) => setEditData({ ...editData, type: value, category_id: "", destination_account_id: "", debt_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Pemasukan</SelectItem>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editData.type !== 'transfer' && (
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={editData.category_id}
                  onValueChange={(value) => setEditData({ ...editData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>{editData.type === 'transfer' ? 'Rekening Asal' : 'Rekening'}</Label>
              <Select
                value={editData.account_id}
                onValueChange={(value) => setEditData({ ...editData, account_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih rekening" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} - {acc.bank_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editData.type === 'transfer' && (
              <div className="space-y-2">
                <Label>Rekening Tujuan</Label>
                <Select
                  value={editData.destination_account_id}
                  onValueChange={(value) => setEditData({ ...editData, destination_account_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih rekening tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.filter(acc => acc.id !== editData.account_id).map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} - {acc.bank_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {transaction.debt_id && (
              <div className="space-y-2">
                <Label>Utang Terkait</Label>
                <Select
                  value={editData.debt_id}
                  onValueChange={(value) => setEditData({ ...editData, debt_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih utang" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeDebts.map((debt) => (
                      <SelectItem key={debt.id} value={debt.id}>
                        {debt.creditor_name}
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
                      !editData.transaction_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editData.transaction_date ? format(editData.transaction_date, "PPP", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editData.transaction_date}
                    onSelect={(date) => date && setEditData({ ...editData, transaction_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
              <Button onClick={handleSave} disabled={loading} className="flex-1 bg-gradient-primary">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Amount & Type */}
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className={`text-2xl font-bold ${
                transaction.type === "income"
                  ? "text-success"
                  : transaction.type === "expense" || transaction.type === "debt_payment"
                  ? "text-danger"
                  : "text-primary"
              }`}>
                {transaction.type === "income" ? "+" : transaction.type === "expense" || transaction.type === "debt_payment" ? "-" : ""}
                Rp {transaction.amount.toLocaleString("id-ID")}
              </p>
              <Badge variant={getTypeVariant(transaction.type) as any} className="mt-2">
                {getTypeLabel(transaction.type)}
              </Badge>
            </div>

            <Separator />

            {/* Transaction Details */}
            <div className="space-y-3">
              {/* Description */}
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Deskripsi</p>
                  <p className="font-medium">{transaction.description || "-"}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal</p>
                  <p className="font-medium">
                    {format(new Date(transaction.transaction_date), "EEEE, dd MMMM yyyy", { locale: id })}
                  </p>
                </div>
              </div>

              {/* Category */}
              <div className="flex items-start gap-3">
                <Tag className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Kategori</p>
                  <p className="font-medium">
                    {transaction.type === "transfer"
                      ? "Transfer Antar Rekening"
                      : transaction.type === "debt_payment"
                      ? "Pembayaran Utang"
                      : transaction.categories?.name || "-"}
                  </p>
                </div>
              </div>

              {/* Account */}
              <div className="flex items-start gap-3">
                <Wallet className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {transaction.type === "transfer" ? "Rekening Asal" : "Rekening"}
                  </p>
                  <p className="font-medium">{transaction.accounts?.name || "-"}</p>
                </div>
              </div>

              {/* Destination Account (for transfers) */}
              {transaction.type === "transfer" && (
                <div className="flex items-start gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Rekening Tujuan</p>
                    <p className="font-medium">{getDestinationAccount()}</p>
                  </div>
                </div>
              )}

              {/* Debt Creditor (for debt payments) */}
              {(transaction.type === "debt_payment" || transaction.debt_id) && (
                <div className="flex items-start gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pembayaran Ke</p>
                    <p className="font-medium">{getDebtCreditor()}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Dibuat: {format(new Date(transaction.created_at), "dd MMM yyyy, HH:mm", { locale: id })}</p>
              <p>Diperbarui: {format(new Date(transaction.updated_at), "dd MMM yyyy, HH:mm", { locale: id })}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
