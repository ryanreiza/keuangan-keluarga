import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowUpRight, ArrowDownRight, Calendar, Wallet, Tag, FileText, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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
  debts?: Array<{ id: string; creditor_name: string }>;
}

export function TransactionDetailDialog({
  open,
  onOpenChange,
  transaction,
  accounts = [],
  debts = [],
}: TransactionDetailDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
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
            Detail Transaksi
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap transaksi
          </DialogDescription>
        </DialogHeader>

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
              <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
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
      </DialogContent>
    </Dialog>
  );
}
