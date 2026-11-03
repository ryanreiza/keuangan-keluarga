import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import QuickCapturePanel from "@/components/QuickCapturePanel";
import { cn } from "@/lib/utils";

interface QuickCaptureDialogProps {
  collapsed?: boolean;
}

/**
 * Tombol + popup "Catat Cepat" yang bisa dipasang di mana saja (sidebar, header).
 * Membuka dialog dengan panel chat/suara/foto struk tanpa berpindah halaman.
 */
export function QuickCaptureDialog({ collapsed = false }: QuickCaptureDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {collapsed ? (
          <button
            aria-label="Catat Cepat"
            title="Catat Cepat"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant transition-transform hover:scale-105 active:scale-95"
          >
            <Sparkles className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <button
            className="group flex w-full items-center gap-3 rounded-xl bg-gradient-primary px-3 py-2.5 text-left shadow-elegant transition-all hover:opacity-90 active:scale-[0.99]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-primary-foreground leading-tight">Catat Cepat</span>
              <span className="block text-[11px] text-primary-foreground/70 leading-tight">Chat • Suara • Foto struk</span>
            </span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg sm:max-w-2xl lg:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-display">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-elegant">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </span>
            Catat Cepat
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Catat transaksi tanpa meninggalkan halaman ini — AI menyiapkan drafnya, Anda tinggal periksa dan simpan.
          </DialogDescription>
        </DialogHeader>
        <QuickCapturePanel />
      </DialogContent>
    </Dialog>
  );
}
