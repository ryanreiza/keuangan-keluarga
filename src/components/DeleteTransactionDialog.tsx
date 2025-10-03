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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface DeleteTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  transactionDescription: string;
}

export function DeleteTransactionDialog({
  open,
  onOpenChange,
  onConfirm,
  transactionDescription,
}: DeleteTransactionDialogProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleConfirm = async () => {
    if (!password) {
      toast({
        title: "Error",
        description: "Password harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: "Error",
        description: "User email tidak ditemukan",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // Verify password by attempting to sign in
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Password salah",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Password is correct, proceed with deletion
    onConfirm();
    setPassword("");
    setLoading(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setPassword("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus transaksi "{transactionDescription}"? 
            Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="password">Masukkan Password Anda</Label>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleConfirm();
              }
            }}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-danger text-white hover:bg-danger/90"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
