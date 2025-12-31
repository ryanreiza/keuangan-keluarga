import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResetTransactionsDialogProps {
  onReset: () => Promise<{ error: string | null }>;
}

export function ResetTransactionsDialog({ onReset }: ResetTransactionsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    setLoading(true);

    try {
      // Proceed with reset - user is already authenticated via session
      // RLS policies ensure users can only reset their own transactions
      const { error: resetError } = await onReset();
      
      if (resetError) {
        toast({
          title: "Reset failed",
          description: resetError,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset successful",
          description: "All transactions have been cleared successfully.",
        });
        setOpen(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Transaksi
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-destructive" />
            Reset Semua Transaksi
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini akan menghapus <strong>SEMUA</strong> data transaksi Anda dan tidak dapat dibatalkan. 
            Saldo rekening akan kembali ke saldo awal. Apakah Anda yakin ingin melanjutkan?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Memproses..." : "Reset Semua Transaksi"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
