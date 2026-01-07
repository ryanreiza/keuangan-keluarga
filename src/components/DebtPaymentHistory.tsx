import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, History, Receipt } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Transaction {
  id: string;
  description: string | null;
  amount: number;
  transaction_date: string;
  accounts?: { name: string } | null;
}

interface DebtPaymentHistoryProps {
  debtId: string;
  transactions: Transaction[];
}

export function DebtPaymentHistory({ debtId, transactions }: DebtPaymentHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter transactions that are linked to this debt
  const debtPayments = transactions.filter((t: any) => t.debt_id === debtId);
  
  const totalPaid = debtPayments.reduce((sum, t) => sum + t.amount, 0);

  if (debtPayments.length === 0) {
    return (
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <History className="h-4 w-4" />
          <span>Belum ada riwayat pembayaran</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
            <div className="flex items-center gap-2 text-sm">
              <History className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                Riwayat Pembayaran ({debtPayments.length} transaksi)
              </span>
              <span className="text-success font-medium">
                Total: Rp {totalPaid.toLocaleString('id-ID')}
              </span>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {debtPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-success/10 rounded">
                    <Receipt className="h-3.5 w-3.5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {payment.description || 'Pembayaran Utang'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payment.transaction_date), 'dd MMMM yyyy', { locale: id })}
                      {payment.accounts?.name && ` • ${payment.accounts.name}`}
                    </p>
                  </div>
                </div>
                <span className="font-medium text-success">
                  +Rp {payment.amount.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
