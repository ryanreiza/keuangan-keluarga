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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResetTransactionsDialogProps {
  onReset: () => Promise<{ error: string | null }>;
}

export function ResetTransactionsDialog({ onReset }: ResetTransactionsDialogProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleReset = async () => {
    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter your account password to confirm reset.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: "Error",
        description: "User email not found.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Verify password by attempting to sign in
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (authError) {
        toast({
          title: "Invalid password",
          description: "The password you entered is incorrect.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Password is correct, proceed with reset
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
        setPassword("");
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
            Saldo rekening akan kembali ke saldo awal. Masukkan password akun Anda untuk konfirmasi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password Akun</Label>
            <Input
              id="password"
              type="password"
              placeholder="Masukkan password akun Anda"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPassword("")}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={loading || !password.trim()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Memproses..." : "Reset Semua Transaksi"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}