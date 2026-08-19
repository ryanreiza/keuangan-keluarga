import { useMemo, useState, useEffect } from "react";
import { Plus, Trash2, AlertCircle, CheckCircle2, Target, Copy, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/PageHeader";
import { useMonthlyPlan, PlanAllocation } from "@/hooks/useMonthlyPlan";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_CATEGORIES = [
  "Sedekah", "Makanan / Minuman", "Perlengkapan Bayi", "PDAM", "Listrik",
  "Internet", "Laundry", "Transportasi", "Jajan Suami", "Belanja Dapur",
  "Pakaian", "Kesehatan", "Perawatan", "Hiburan", "Tabungan Darurat",
  "Tabungan Masa Depan", "Nafkah Istri", "Investasi",
];

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

const CLIP_KEY = "monthly-plan-clipboard";

const fmtIDR = (n: number) => `Rp ${Math.round(n || 0).toLocaleString("id-ID")}`;

const parseNum = (v: string) => {
  const cleaned = String(v).replace(/[^\d]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const groupThousands = (v: string) => {
  const digits = String(v).replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
  return digits ? Number(digits).toLocaleString("id-ID") : "";
};

function AmountInput({
  value,
  onCommit,
  className = "",
}: {
  value: number;
  onCommit: (n: number) => void;
  className?: string;
}) {
  const [text, setText] = useState(() => groupThousands(String(value ?? 0)));
  useEffect(() => { setText(groupThousands(String(value ?? 0))); }, [value]);
  return (
    <Input
      inputMode="numeric"
      className={`text-right font-mono-num ${className}`}
      value={text}
      placeholder="0"
      onChange={(e) => setText(groupThousands(e.target.value))}
      onBlur={() => {
        const v = parseNum(text);
        setText(groupThousands(String(v)));
        if (v !== Number(value)) onCommit(v);
      }}
    />
  );
}


export default function MonthlyPlan() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const plan = useMonthlyPlan(month, year);
  const { categories } = useCategories();
  const { transactions } = useTransactions();

  const expenseCategories = useMemo(
    () => categories.filter(c => c.type === "expense" || c.type === "savings" || c.type === "debt"),
    [categories]
  );

  const totalIncome = useMemo(() => plan.incomes.reduce((s, r) => s + Number(r.amount || 0), 0), [plan.incomes]);
  const totalFixed = useMemo(() => plan.fixed.reduce((s, r) => s + Number(r.amount || 0), 0), [plan.fixed]);
  const remaining = totalIncome - totalFixed;

  const totalPct = useMemo(() => plan.allocations.reduce((s, r) => s + Number(r.percentage || 0), 0), [plan.allocations]);

  // Actuals: sum expense-type transactions for this month/year grouped by category_id
  const actualsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const d = new Date(t.transaction_date);
      if (d.getFullYear() !== year || d.getMonth() + 1 !== month) continue;
      if (!t.category_id) continue;
      map.set(t.category_id, (map.get(t.category_id) || 0) + Number(t.amount || 0));
    }
    return map;
  }, [transactions, month, year]);

  const seedDefaults = async () => {
    const share = Math.floor(100 / DEFAULT_CATEGORIES.length);
    for (const name of DEFAULT_CATEGORIES) {
      await plan.addAllocation({ category: name, percentage: share });
    }
  };

  // ---- Copy / Paste antar bulan ----
  const { toast } = useToast();
  const [clip, setClip] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLIP_KEY);
      if (raw) setClip(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const saveClip = (data: any) => {
    setClip(data);
    try { localStorage.setItem(CLIP_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  };

  const copySection = (section: "incomes" | "fixed" | "allocations" | "all") => {
    const next = { ...(clip || {}), from: `${MONTHS[month - 1]} ${year}` };
    if (section === "incomes" || section === "all") {
      next.incomes = plan.incomes.map(r => ({ category: r.category, amount: r.amount }));
    }
    if (section === "fixed" || section === "all") {
      next.fixed = plan.fixed.map(r => ({ category: r.category, amount: r.amount, web_category_id: r.web_category_id, remark: r.remark }));
    }
    if (section === "allocations" || section === "all") {
      next.allocations = plan.allocations.map(r => ({ percentage: r.percentage, category: r.category, note: r.note, web_category_id: r.web_category_id, remark: r.remark }));
    }
    saveClip(next);
    toast({ title: "Disalin", description: `Data ${MONTHS[month - 1]} ${year} siap ditempel ke bulan lain.` });
  };

  const pasteSection = async (section: "incomes" | "fixed" | "allocations" | "all") => {
    if (!clip) return;
    let count = 0;
    if ((section === "incomes" || section === "all") && clip.incomes?.length) {
      await plan.clearIncomes();
      count += await plan.pasteIncomes(clip.incomes);
    }
    if ((section === "fixed" || section === "all") && clip.fixed?.length) {
      await plan.clearFixed();
      count += await plan.pasteFixed(clip.fixed);
    }
    if ((section === "allocations" || section === "all") && clip.allocations?.length) {
      await plan.clearAllocations();
      count += await plan.pasteAllocations(clip.allocations);
    }
    toast({ title: "Ditempel", description: `${count} baris disalin ke ${MONTHS[month - 1]} ${year}.` });
  };

  const currentYear = now.getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];


  return (
    <div className="space-y-6">
      <PageHeader
        icon={Target}
        title="TARGET KEUANGAN BULANAN"
        subtitle="Rencanakan pemasukan, pengeluaran tetap, dan alokasi target berbasis persentase."
      />

      {/* Period picker */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Periode:</span>
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => copySection("all")}>
              <Copy className="h-4 w-4 mr-1" />Salin Semua
            </Button>
            <Button size="sm" disabled={!clip} onClick={() => pasteSection("all")}>
              <ClipboardPaste className="h-4 w-4 mr-1" />Tempel Semua
            </Button>
          </div>
          {clip?.from && (
            <p className="w-full text-xs text-muted-foreground">Data tersalin dari: <span className="font-medium">{clip.from}</span></p>
          )}
        </CardContent>
      </Card>

      {/* Section 1 — Incomes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">Pemasukan Utama</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => copySection("incomes")}><Copy className="h-4 w-4 mr-1" />Salin</Button>
            <Button size="sm" variant="outline" disabled={!clip?.incomes?.length} onClick={() => pasteSection("incomes")}><ClipboardPaste className="h-4 w-4 mr-1" />Tempel</Button>
            <Button size="sm" onClick={plan.addIncome}><Plus className="h-4 w-4 mr-1" />Tambah Baris</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Kategori</th>
                  <th className="text-right px-4 py-2 font-semibold w-56">Jumlah</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {plan.incomes.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Belum ada pemasukan. Klik "Tambah Baris".</td></tr>
                )}
                {plan.incomes.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-4 py-2">
                      <Input
                        defaultValue={row.category}
                        placeholder="Nama pemasukan"
                        onBlur={(e) => e.target.value !== row.category && plan.updateIncome(row.id, { category: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <AmountInput
                        value={Number(row.amount)}
                        onCommit={(v) => plan.updateIncome(row.id, { amount: v })}
                      />

                    </td>
                    <td className="px-2 py-2 text-center">
                      <Button variant="ghost" size="icon" onClick={() => plan.deleteIncome(row.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30">
                <tr>
                  <td className="px-4 py-2 font-semibold">Total Pemasukan</td>
                  <td className="px-4 py-2 text-right font-bold font-mono-num text-success">{fmtIDR(totalIncome)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Fixed expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">Pengeluaran Tetap Sebelum Target</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => copySection("fixed")}><Copy className="h-4 w-4 mr-1" />Salin</Button>
            <Button size="sm" variant="outline" disabled={!clip?.fixed?.length} onClick={() => pasteSection("fixed")}><ClipboardPaste className="h-4 w-4 mr-1" />Tempel</Button>
            <Button size="sm" onClick={plan.addFixed}><Plus className="h-4 w-4 mr-1" />Tambah Baris</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Kategori</th>
                  <th className="text-right px-4 py-2 font-semibold w-44">Jumlah</th>
                  <th className="text-left px-4 py-2 font-semibold w-56">Kategori Web</th>
                  <th className="text-left px-4 py-2 font-semibold">Remark</th>
                  <th className="text-center px-4 py-2 font-semibold w-28">Sudah Dilakukan</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {plan.fixed.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Belum ada pengeluaran tetap.</td></tr>
                )}
                {plan.fixed.map((row) => (
                  <tr key={row.id} className={`border-t border-border transition-colors ${row.is_done ? "bg-success/10 hover:bg-success/15" : ""}`}>
                    <td className="px-4 py-2">
                      <Input defaultValue={row.category} placeholder="Cth: Cicilan Rumah"
                        onBlur={(e) => e.target.value !== row.category && plan.updateFixed(row.id, { category: e.target.value })} />
                    </td>
                    <td className="px-4 py-2">
                      <AmountInput value={Number(row.amount)} onCommit={(v) => plan.updateFixed(row.id, { amount: v })} />

                    </td>
                    <td className="px-4 py-2">
                      <Select
                        value={row.web_category_id ?? "none"}
                        onValueChange={(v) => plan.updateFixed(row.id, { web_category_id: v === "none" ? null : v })}
                      >
                        <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Tidak ada —</SelectItem>
                          {expenseCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2">
                      <Input defaultValue={row.remark ?? ""} placeholder="Catatan"
                        onBlur={(e) => e.target.value !== (row.remark ?? "") && plan.updateFixed(row.id, { remark: e.target.value })} />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Checkbox
                        checked={!!row.is_done}
                        onCheckedChange={(v) => plan.updateFixed(row.id, { is_done: v === true })}
                        aria-label="Tandai pengeluaran sudah dilakukan"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Button variant="ghost" size="icon" onClick={() => plan.deleteFixed(row.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30">
                <tr>
                  <td className="px-4 py-2 font-semibold">Total Pengeluaran Tetap</td>
                  <td className="px-4 py-2 text-right font-bold font-mono-num text-warning">{fmtIDR(totalFixed)}</td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Remaining summary */}
      <Card className={remaining >= 0 ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"}>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Sisa Keuangan Bulanan</p>
            <p className="text-xs text-muted-foreground mt-1">Total Pemasukan − Total Pengeluaran Tetap</p>
          </div>
          <p className={`text-3xl font-bold font-mono-num ${remaining >= 0 ? "text-success" : "text-destructive"}`}>
            {fmtIDR(remaining)}
          </p>
        </CardContent>
      </Card>

      {/* Section 3 — Allocations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg">Target Alokasi Keuangan</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Jumlah dihitung otomatis: (Persentase ÷ 100) × Sisa Keuangan.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {plan.allocations.length === 0 && (
              <Button size="sm" variant="outline" onClick={seedDefaults}>Gunakan Template Default</Button>
            )}
            <Button size="sm" variant="outline" onClick={() => copySection("allocations")}><Copy className="h-4 w-4 mr-1" />Salin</Button>
            <Button size="sm" variant="outline" disabled={!clip?.allocations?.length} onClick={() => pasteSection("allocations")}><ClipboardPaste className="h-4 w-4 mr-1" />Tempel</Button>
            <Button size="sm" onClick={() => plan.addAllocation()}><Plus className="h-4 w-4 mr-1" />Tambah Baris</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-right px-3 py-2 font-semibold w-20">%</th>
                  <th className="text-left px-3 py-2 font-semibold">Kategori</th>
                  <th className="text-right px-3 py-2 font-semibold w-40">Jumlah</th>
                  <th className="text-left px-3 py-2 font-semibold">Keterangan</th>
                  <th className="text-left px-3 py-2 font-semibold w-48">Kategori Web</th>
                  <th className="text-right px-3 py-2 font-semibold w-36">Realisasi</th>
                  <th className="text-center px-3 py-2 font-semibold w-32">Status</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {plan.allocations.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">Belum ada alokasi. Tambahkan atau gunakan template default.</td></tr>
                )}
                {plan.allocations.map((row) => {
                  const planned = (Number(row.percentage) / 100) * Math.max(remaining, 0);
                  const actual = row.web_category_id ? (actualsByCategory.get(row.web_category_id) || 0) : 0;
                  const usedPct = planned > 0 ? (actual / planned) * 100 : 0;
                  const status: "progress" | "near" | "reached" | "over" | "gray" =
                    !row.web_category_id ? "gray" :
                    usedPct > 100 ? "over" :
                    usedPct >= 95 ? "reached" :
                    usedPct >= 80 ? "near" : "progress";
                  const statusText =
                    status === "gray" ? "Belum dipetakan" :
                    status === "over" ? "Melebihi Target" :
                    status === "reached" ? "Target Tercapai" :
                    status === "near" ? "Mendekati Batas" : "Sedang Proses";
                  const badgeClass =
                    status === "over" ? "bg-destructive/15 text-destructive border-destructive/30" :
                    status === "reached" ? "bg-success/15 text-success border-success/30" :
                    status === "near" ? "bg-warning/15 text-warning border-warning/30" :
                    status === "progress" ? "bg-primary/10 text-primary border-primary/30" :
                    "bg-muted text-muted-foreground border-border";
                  return (
                    <tr key={row.id} className="border-t border-border align-top">
                      <td className="px-3 py-2">
                        <Input type="number" min={0} max={100} className="text-right font-mono-num h-9"
                          defaultValue={row.percentage}
                          onBlur={(e) => {
                            const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                            if (v !== Number(row.percentage)) plan.updateAllocation(row.id, { percentage: v });
                          }} />
                      </td>
                      <td className="px-3 py-2">
                        <Input defaultValue={row.category} placeholder="Nama kategori" className="h-9"
                          onBlur={(e) => e.target.value !== row.category && plan.updateAllocation(row.id, { category: e.target.value })} />
                      </td>
                      <td className="px-3 py-2 text-right font-mono-num font-semibold">{fmtIDR(planned)}</td>
                      <td className="px-3 py-2">
                        <Input defaultValue={row.note ?? ""} placeholder="Keterangan" className="h-9"
                          onBlur={(e) => e.target.value !== (row.note ?? "") && plan.updateAllocation(row.id, { note: e.target.value })} />
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={row.web_category_id ?? "none"}
                          onValueChange={(v) => plan.updateAllocation(row.id, { web_category_id: v === "none" ? null : v })}
                        >
                          <SelectTrigger className="h-9"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">— Tidak ada —</SelectItem>
                            {expenseCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2 text-right font-mono-num">
                        <div>{fmtIDR(actual)}</div>
                        {row.web_category_id && planned > 0 && (
                          <div className="text-[11px] text-muted-foreground">{usedPct.toFixed(0)}% terpakai</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge variant="outline" className={badgeClass}>{statusText}</Badge>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <Button variant="ghost" size="icon" onClick={() => plan.deleteAllocation(row.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/30">
                <tr>
                  <td className="px-3 py-2 text-right font-bold font-mono-num">{totalPct.toFixed(0)}%</td>
                  <td className="px-3 py-2 font-semibold">Total Alokasi</td>
                  <td className="px-3 py-2 text-right font-bold font-mono-num">
                    {fmtIDR((totalPct / 100) * Math.max(remaining, 0))}
                  </td>
                  <td colSpan={5}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Percentage validation */}
          <div className="p-4 border-t border-border">
            {Math.round(totalPct) === 100 ? (
              <div className="flex items-center gap-2 text-success text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" /> Total persentase sudah tepat 100%.
              </div>
            ) : (
              <div className="flex items-center gap-2 text-warning text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                Total persentase saat ini {totalPct.toFixed(1)}%. Harus tepat 100%.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
