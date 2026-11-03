import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import QuickCapturePanel from "@/components/QuickCapturePanel";

export default function QuickCapture() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        eyebrow="Pencatatan Cerdas"
        title="Catat Cepat"
        subtitle="Catat transaksi dengan chat singkat, voice note, atau foto struk — AI menyiapkan drafnya, Anda tinggal periksa dan simpan."
      />
      <QuickCapturePanel />
    </div>
  );
}
