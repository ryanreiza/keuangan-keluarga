import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  MessageSquareText,
  Mic,
  Receipt,
  Loader2,
  Send,
  Square,
  Trash2,
  Check,
  Camera,
  Upload,
  Info,
  Wallet,
  Tags,
  CalendarDays,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Mode = "chat" | "voice" | "receipt";

interface Draft {
  uid: string;
  description: string;
  amountText: string;
  type: "income" | "expense";
  date: string;
  category_id: string; // "" = belum dipilih
  account_id: string; // "" = belum dipilih
  note: string | null;
}

interface ApiResponse {
  drafts?: Array<{
    description: string;
    amount: number;
    type: "income" | "expense";
    date: string;
    category_id: string | null;
    category_name?: string | null;
    account_id: string | null;
    note?: string | null;
  }>;
  summary?: string | null;
  transcript?: string | null;
}

const uid = () => `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatGrouped = (digits: string) => {
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
};

const parseAmount = (text: string) => {
  const digits = text.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const CHAT_EXAMPLES = [
  "Jajan bakso 25rb",
  "Gaji masuk 5,2jt",
  "Bayar listrik 350rb pakai BCA kemarin",
  "Belanja pasar 120rb + pulsa 50rb",
];

async function compressImage(file: File, maxDim = 1600, quality = 0.85): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Gambar tidak dapat dibuka"));
      image.src = dataUrl;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

function pickRecorderMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

export default function QuickCapture() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createTransaction } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();

  const [mode, setMode] = useState<Mode>("chat");
  const [chatText, setChatText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [heardText, setHeardText] = useState<string | null>(null);
  const [savingUids, setSavingUids] = useState<Set<string>>(new Set());

  // Voice recording
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  // Receipt
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeAccounts = useMemo(() => accounts.filter((a) => a.is_active !== false), [accounts]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleResult = (data: ApiResponse) => {
    setAiNote(data.summary ?? null);
    setHeardText(data.transcript ?? null);
    const mapped: Draft[] = (data.drafts ?? []).map((d) => ({
      uid: uid(),
      description: d.description || "",
      amountText: d.amount ? formatGrouped(String(d.amount)) : "",
      type: d.type === "income" ? "income" : "expense",
      date: /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : todayStr(),
      category_id: d.category_id ?? "",
      account_id: d.account_id ?? (activeAccounts.length === 1 ? activeAccounts[0].id : ""),
      note: d.note ?? null,
    }));
    setDrafts(mapped);
    if (mapped.length === 0 && !data.summary) {
      toast({
        title: "Tidak ada transaksi terbaca",
        description: "Coba tulis atau ucapkan lebih jelas, atau pastikan foto struk terang dan utuh.",
        variant: "destructive",
      });
    }
  };

  const analyze = async (payload: Record<string, unknown>) => {
    if (!user) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke<ApiResponse>("transaction-capture", { body: payload });
      if (error) {
        const details =
          error instanceof FunctionsHttpError ? await error.context.text().catch(() => "") : "";
        let msg = "";
        try {
          msg = JSON.parse(details)?.error ?? "";
        } catch {
          /* ignore */
        }
        toast({ title: "Gagal membaca transaksi", description: msg || error.message, variant: "destructive" });
        return;
      }
      handleResult(data ?? {});
    } catch (e: any) {
      toast({ title: "Gagal membaca transaksi", description: e?.message ?? "Coba lagi sebentar lagi.", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const submitChat = () => {
    const text = chatText.trim();
    if (!text) return;
    analyze({ mode: "text", text });
    setChatText("");
  };

  // ----- Voice -----
  const startRecording = async () => {
    const mimeType = pickRecorderMime();
    if (!mimeType) {
      toast({ title: "Perekaman tidak didukung", description: "Peramban ini tidak mendukung rekaman suara.", variant: "destructive" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const cleanMime = mimeType.split(";")[0];
        const blob = new Blob(chunksRef.current, { type: cleanMime });
        if (blob.size < 2048) {
          toast({ title: "Rekaman kosong", description: "Silakan rekam ulang.", variant: "destructive" });
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          analyze({ mode: "audio", audioBase64: String(reader.result), audioMime: cleanMime });
        };
        reader.readAsDataURL(blob);
      };
      recorder.start(250);
      recorderRef.current = recorder;
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      toast({ title: "Tidak bisa mengakses mikrofon", description: "Izinkan akses mikrofon pada peramban Anda.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  // ----- Receipt -----
  const onReceiptPicked = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "File bukan gambar", description: "Pilih foto struk dalam format gambar.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Foto terlalu besar", description: "Ukuran maksimal 10 MB.", variant: "destructive" });
      return;
    }
    try {
      const compressed = await compressImage(file);
      setReceiptPreview(compressed);
    } catch (e: any) {
      toast({ title: "Gagal memproses foto", description: e?.message ?? "Coba foto lain.", variant: "destructive" });
    }
  };

  const analyzeReceipt = () => {
    if (!receiptPreview) return;
    analyze({ mode: "image", imageDataUrl: receiptPreview });
  };

  // ----- Draft editing & saving -----
  const updateDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((prev) => prev.map((d) => (d.uid === id ? { ...d, ...patch } : d)));

  const removeDraft = (id: string) => setDrafts((prev) => prev.filter((d) => d.uid !== id));

  const draftAmount = (d: Draft) => parseAmount(d.amountText);
  const isDraftValid = (d: Draft) =>
    draftAmount(d) > 0 && d.description.trim().length > 0 && d.category_id !== "" && d.account_id !== "";

  const saveDraft = async (d: Draft) => {
    if (!isDraftValid(d)) return;
    setSavingUids((prev) => new Set(prev).add(d.uid));
    const { error } = await createTransaction({
      description: d.description.trim(),
      amount: draftAmount(d),
      type: d.type,
      category_id: d.category_id,
      account_id: d.account_id,
      transaction_date: d.date,
    });
    setSavingUids((prev) => {
      const next = new Set(prev);
      next.delete(d.uid);
      return next;
    });
    if (!error) removeDraft(d.uid);
  };

  const saveAll = async () => {
    const valid = drafts.filter(isDraftValid);
    for (const d of valid) {
      // sequential so each insert lands and toasts once per transaction
      await saveDraft(d);
    }
    const invalid = drafts.length - valid.length;
    if (invalid > 0) {
      toast({
        title: "Beberapa draf belum lengkap",
        description: `${invalid} draf butuh nominal, kategori, atau rekening yang masih kosong.`,
        variant: "destructive",
      });
    }
  };

  const draftCategoryOptions = (d: Draft) => categories.filter((c) => c.type === d.type);
  const validCount = drafts.filter(isDraftValid).length;

  const modes: { key: Mode; label: string; icon: typeof Mic; hint: string }[] = [
    { key: "chat", label: "Chat", icon: MessageSquareText, hint: "Ketik singkat, langsung terbaca" },
    { key: "voice", label: "Suara", icon: Mic, hint: "Rekam voice note" },
    { key: "receipt", label: "Foto Struk", icon: Receipt, hint: "OCR struk belanjaan" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        eyebrow="Pencatatan Cerdas"
        title="Catat Cepat"
        subtitle="Catat transaksi dengan chat singkat, voice note, atau foto struk — AI menyiapkan drafnya, Anda tinggal periksa dan simpan."
      />

      {/* Mode selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
              mode === m.key
                ? "border-primary/40 bg-primary/10 shadow-sm"
                : "border-border/60 hover:bg-accent/60",
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                mode === m.key ? "bg-gradient-primary text-primary-foreground shadow-elegant" : "bg-muted text-muted-foreground",
              )}
            >
              <m.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold", mode === m.key ? "text-primary" : "text-foreground")}>{m.label}</p>
              <p className="text-xs text-muted-foreground truncate">{m.hint}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="card-bento p-4 md:p-6">
        {mode === "chat" && (
          <div className="space-y-3">
            <Label htmlFor="capture-chat" className="flex items-center gap-2 text-sm font-medium">
              <MessageSquareText className="h-4 w-4 text-primary" /> Tulis seperti chat WA
            </Label>
            <Textarea
              id="capture-chat"
              placeholder='Contoh: "jajan 25rb", "gaji masuk 5,2jt", "bayar listrik 350rb pake BCA kemarin"'
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!analyzing) submitChat();
                }
              }}
              rows={3}
              maxLength={2000}
              disabled={analyzing || recording}
            />
            <div className="flex flex-wrap gap-2">
              {CHAT_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setChatText(ex)}
                  disabled={analyzing || recording}
                  className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {ex}
                </button>
              ))}
            </div>
            <Button onClick={submitChat} disabled={!chatText.trim() || analyzing || recording} className="w-full sm:w-auto">
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {analyzing ? "Menganalisis…" : "Baca Transaksi"}
            </Button>
          </div>
        )}

        {mode === "voice" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Tekan tombol lalu ceritakan transaksi Anda, misalnya <em>"tadi siang bayar parkir lima ribu dan jajan kopi dua belas ribu"</em>.
            </p>
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={analyzing}
              className={cn(
                "relative flex h-24 w-24 items-center justify-center rounded-full transition-all",
                recording
                  ? "bg-destructive text-destructive-foreground shadow-lg"
                  : "bg-gradient-primary text-primary-foreground shadow-elegant hover:scale-105",
                analyzing && "opacity-60",
              )}
              aria-label={recording ? "Berhenti merekam" : "Mulai merekam"}
            >
              {recording && <span className="absolute inset-0 rounded-full bg-destructive/40 animate-ping" />}
              {recording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </button>
            <p className="text-sm font-mono text-muted-foreground">
              {recording
                ? `Merekam… ${String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:${String(recordSeconds % 60).padStart(2, "0")}`
                : analyzing
                  ? "Menganalisis rekaman…"
                  : "Siap merekam"}
            </p>
          </div>
        )}

        {mode === "receipt" && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                onReceiptPicked(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <div
              onClick={() => !analyzing && fileInputRef.current?.click()}
              className={cn(
                "flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
                receiptPreview ? "border-primary/40 bg-primary/5" : "border-border/70 hover:bg-accent/60",
              )}
            >
              {receiptPreview ? (
                <img src={receiptPreview} alt="Pratinjau struk" className="max-h-56 rounded-lg object-contain" />
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ambil / unggah foto struk</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pastikan struk terang, utuh, dan grand total terlihat jelas
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Upload className="h-3.5 w-3.5" /> Klik untuk memilih foto
                  </span>
                </>
              )}
            </div>
            {receiptPreview && (
              <div className="flex gap-2">
                <Button onClick={analyzeReceipt} disabled={analyzing} className="flex-1 sm:flex-none">
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                  {analyzing ? "Membaca struk…" : "Baca Struk"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReceiptPreview(null);
                  }}
                  disabled={analyzing}
                >
                  <Trash2 className="h-4 w-4" /> Hapus
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI note / transcript */}
      {(heardText || aiNote) && (
        <div className="space-y-2">
          {heardText && (
            <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/40 p-3 text-sm">
              <Mic className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Terdengar: </span>
                {heardText}
              </p>
            </div>
          )}
          {aiNote && (
            <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm">
              <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <p className="text-muted-foreground">{aiNote}</p>
            </div>
          )}
        </div>
      )}

      {/* Drafts */}
      {drafts.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg font-semibold font-display flex items-center gap-2">
              <Check className="h-5 w-5 text-success" />
              Draf Transaksi ({drafts.length})
            </h2>
            {drafts.length > 1 && (
              <Button onClick={saveAll} disabled={analyzing || savingUids.size > 0} className="w-full sm:w-auto">
                {savingUids.size > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Simpan Semua ({validCount}/{drafts.length} siap)
              </Button>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {drafts.map((d) => {
              const valid = isDraftValid(d);
              const saving = savingUids.has(d.uid);
              return (
                <div key={d.uid} className="card-bento p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {d.note && <p className="text-xs text-muted-foreground italic mb-1 truncate">{d.note}</p>}
                      <Input
                        value={d.description}
                        onChange={(e) => updateDraft(d.uid, { description: e.target.value })}
                        placeholder="Keterangan transaksi"
                        className="font-medium"
                      />
                    </div>
                    <button
                      onClick={() => removeDraft(d.uid)}
                      className="shrink-0 rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Hapus draf"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Wallet className="h-3 w-3" /> Nominal
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                        <Input
                          value={d.amountText}
                          onChange={(e) => updateDraft(d.uid, { amountText: e.target.value.replace(/[^\d.]/g, "") })}
                          onBlur={(e) => updateDraft(d.uid, { amountText: formatGrouped(e.target.value.replace(/[^\d]/g, "")) })}
                          inputMode="numeric"
                          placeholder="0"
                          className="pl-9 font-mono-num"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">Jenis</Label>
                      <Select
                        value={d.type}
                        onValueChange={(v) => {
                          const nextType = v as "income" | "expense";
                          const pool = categories.filter((c) => c.type === nextType);
                          const keepCategory = pool.some((c) => c.id === d.category_id);
                          updateDraft(d.uid, { type: nextType, category_id: keepCategory ? d.category_id : "" });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">Pengeluaran</SelectItem>
                          <SelectItem value="income">Pemasukan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <CalendarDays className="h-3 w-3" /> Tanggal
                      </Label>
                      <Input
                        type="date"
                        value={d.date}
                        onChange={(e) => updateDraft(d.uid, { date: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Tags className="h-3 w-3" /> Kategori
                      </Label>
                      <Select value={d.category_id || undefined} onValueChange={(v) => updateDraft(d.uid, { category_id: v })}>
                        <SelectTrigger className={cn(!d.category_id && "border-destructive/50")}>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {draftCategoryOptions(d).map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Wallet className="h-3 w-3" /> Rekening
                      </Label>
                      <Select value={d.account_id || undefined} onValueChange={(v) => updateDraft(d.uid, { account_id: v })}>
                        <SelectTrigger className={cn(!d.account_id && "border-destructive/50")}>
                          <SelectValue placeholder="Pilih rekening" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeAccounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name} — {a.bank_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {!valid && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Info className="h-3.5 w-3.5 shrink-0" /> Lengkapi nominal, kategori, dan rekening untuk menyimpan.
                    </p>
                  )}

                  <Button onClick={() => saveDraft(d)} disabled={!valid || saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Simpan Transaksi
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {drafts.length === 0 && !analyzing && !recording && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 p-8 text-center">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground max-w-md">
            Tulis, bicarakan, atau foto transaksi Anda — draf akan muncul di sini untuk diperiksa sebelum disimpan.
          </p>
        </div>
      )}
    </div>
  );
}
