import { useEffect, useMemo, useState } from "react";
import {
  Gem,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Coins,
  Wallet,
  Scale,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Banknote,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useGold, GoldAccount } from "@/hooks/useGold";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";

const groupThousands = (v: string) => {
  const digits = v.replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
};

const parseGrams = (v: string) => {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
};

const fmtRp = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;
const fmtGram = (n: number) =>
  `${n.toLocaleString("id-ID", { maximumFractionDigits: 3, minimumFractionDigits: 0 })} gr`;
const today = () => new Date().toISOString().slice(0, 10);

function MoneyInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  id?: string;
}) {
  const [text, setText] = useState(() => groupThousands(String(value ?? 0)));
  useEffect(() => {
    setText(groupThousands(String(value ?? 0)));
  }, [value]);
  return (
    <Input
      id={id}
      inputMode="numeric"
      placeholder={placeholder ?? "0"}
      value={text}
      onChange={(e) => {
        const grouped = groupThousands(e.target.value);
        setText(grouped);
        const digits = grouped.replace(/\./g, "");
        onChange(digits ? Number(digits) : 0);
      }}
    />
  );
}

export default function Gold() {
  const {
    goldAccounts,
    goldTransactions,
    goldPricePerGram,
    loading,
    createGoldAccount,
    updateGoldAccount,
    deleteGoldAccount,
    recordPurchase,
    recordSale,
    updateGoldPrice,
  } = useGold();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const activeAccounts = accounts.filter((a) => a.is_active);
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  // Harga emas saat ini
  const [priceInput, setPriceInput] = useState(0);
  const [savingPrice, setSavingPrice] = useState(false);
  useEffect(() => setPriceInput(goldPricePerGram), [goldPricePerGram]);

  // Form tempat emas (tersembunyi secara default)
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({ name: "", institution: "", notes: "" });
  const [savingAccount, setSavingAccount] = useState(false);

  // Dialog Beli Emas
  const [buyOpen, setBuyOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyForm, setBuyForm] = useState({
    gold_account_id: "",
    account_id: "",
    category_id: "auto",
    amount: 0,
    grams: "",
    date: today(),
    description: "",
  });

  // Dialog Jual Emas
  const [sellOpen, setSellOpen] = useState(false);
  const [selling, setSelling] = useState(false);
  const [sellForm, setSellForm] = useState({
    gold_account_id: "",
    account_id: "",
    category_id: "auto",
    grams: "",
    price: 0,
    date: today(),
    description: "",
  });

  const [deleteTarget, setDeleteTarget] = useState<GoldAccount | null>(null);

  const totalGrams = useMemo(() => goldAccounts.reduce((s, a) => s + a.grams, 0), [goldAccounts]);
  const totalCost = useMemo(() => goldAccounts.reduce((s, a) => s + a.total_cost, 0), [goldAccounts]);
  const marketValue = totalGrams * goldPricePerGram;
  const unrealized = goldPricePerGram > 0 ? marketValue - totalCost : 0;
  const unrealizedPct =
    goldPricePerGram > 0 && totalCost > 0 ? (unrealized / totalCost) * 100 : 0;

  const openBuyDialog = (account?: GoldAccount) => {
    setBuyForm({
      gold_account_id: account?.id ?? goldAccounts[0]?.id ?? "",
      account_id: activeAccounts[0]?.id ?? "",
      category_id: "auto",
      amount: 0,
      grams: "",
      date: today(),
      description: "",
    });
    setBuyOpen(true);
  };

  const openSellDialog = (account?: GoldAccount) => {
    const target = account ?? goldAccounts.find((a) => a.grams > 0) ?? goldAccounts[0];
    setSellForm({
      gold_account_id: target?.id ?? "",
      account_id: activeAccounts[0]?.id ?? "",
      category_id: "auto",
      grams: "",
      price: goldPricePerGram || 0,
      date: today(),
      description: "",
    });
    setSellOpen(true);
  };

  const sellAccount = goldAccounts.find((a) => a.id === sellForm.gold_account_id);
  const sellGrams = parseGrams(sellForm.grams);
  const sellTotal = sellGrams * sellForm.price;
  const sellAvgCost =
    sellAccount && sellAccount.grams > 0 ? sellAccount.total_cost / sellAccount.grams : 0;
  const sellEstGain = sellTotal - sellAvgCost * sellGrams;

  const buyGrams = parseGrams(buyForm.grams);
  const buyPrice = buyGrams > 0 ? buyForm.amount / buyGrams : 0;

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name.trim()) return;
    setSavingAccount(true);
    let result;
    if (editingAccountId) {
      result = await updateGoldAccount(editingAccountId, accountForm);
    } else {
      result = await createGoldAccount(accountForm);
    }
    if (!result.error) {
      setAccountForm({ name: "", institution: "", notes: "" });
      setEditingAccountId(null);
      setShowAccountForm(false);
    }
    setSavingAccount(false);
  };

  const handleEditAccount = (account: GoldAccount) => {
    setAccountForm({
      name: account.name,
      institution: account.institution ?? "",
      notes: account.notes ?? "",
    });
    setEditingAccountId(account.id);
    setShowAccountForm(true);
  };

  const handleBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyForm.gold_account_id || !buyForm.account_id || buyForm.amount <= 0 || buyGrams <= 0) return;
    setBuying(true);
    const result = await recordPurchase({
      gold_account_id: buyForm.gold_account_id,
      account_id: buyForm.account_id,
      category_id: buyForm.category_id === "auto" ? null : buyForm.category_id,
      amount: buyForm.amount,
      grams: buyGrams,
      transaction_date: buyForm.date,
      description: buyForm.description || "Beli emas",
    });
    setBuying(false);
    if (!result.error) setBuyOpen(false);
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !sellForm.gold_account_id ||
      !sellForm.account_id ||
      sellGrams <= 0 ||
      sellForm.price <= 0 ||
      (sellAccount && sellGrams > sellAccount.grams)
    )
      return;
    setSelling(true);
    const result = await recordSale({
      gold_account_id: sellForm.gold_account_id,
      account_id: sellForm.account_id,
      category_id: sellForm.category_id === "auto" ? null : sellForm.category_id,
      amount: sellTotal,
      grams: sellGrams,
      transaction_date: sellForm.date,
      description: sellForm.description || "Jual emas",
    });
    setSelling(false);
    if (!result.error) setSellOpen(false);
  };

  const handleSavePrice = async () => {
    if (priceInput <= 0) return;
    setSavingPrice(true);
    await updateGoldPrice(priceInput);
    setSavingPrice(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        icon={Gem}
        eyebrow="Aset Emas"
        title="Tabungan Emas"
        subtitle="Belanja emas tercatat sebagai pengeluaran, simpanan gram bertambah otomatis. Saat dijual, hasilnya masuk kembali sebagai pemasukan."
        actions={
          <>
            <Button
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant rounded-xl"
              onClick={() => openBuyDialog()}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Beli Emas
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => openSellDialog()}
              disabled={totalGrams <= 0}
            >
              <Banknote className="h-4 w-4 mr-2" />
              Jual Emas
            </Button>
          </>
        }
      />

      {/* Harga emas saat ini */}
      <Card className="shadow-card border border-border/40 rounded-2xl">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2.5 rounded-xl bg-gradient-primary-soft shrink-0">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Harga Emas Saat Ini</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Per gram — dipakai menghitung nilai & untung/rugi berjalan. Perbarui sesuai harga pasar.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex-1 md:w-52">
              <MoneyInput
                id="gold-price"
                value={priceInput}
                onChange={setPriceInput}
                placeholder="Contoh: 1400000"
              />
            </div>
            <Button
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 rounded-xl"
              onClick={handleSavePrice}
              disabled={savingPrice || priceInput <= 0}
            >
              {savingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary shadow-elegant border-0 rounded-2xl overflow-hidden hover-lift">
          <CardContent className="p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1 font-medium">Total Emas</p>
                <p className="text-2xl font-bold font-mono-num">{fmtGram(totalGrams)}</p>
                <p className="text-[11px] opacity-70 mt-1">{goldAccounts.length} tempat penyimpanan</p>
              </div>
              <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm">
                <Gem className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border border-border/40 rounded-2xl hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">Modal / Nilai Beli</p>
                <p className="text-2xl font-bold text-foreground font-mono-num">{fmtRp(totalCost)}</p>
                {totalGrams > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Rata-rata {fmtRp(totalCost / totalGrams)}/gr
                  </p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-gradient-primary-soft">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border border-border/40 rounded-2xl hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">Nilai Sekarang</p>
                {goldPricePerGram > 0 ? (
                  <p className="text-2xl font-bold text-foreground font-mono-num">{fmtRp(marketValue)}</p>
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground font-mono-num">—</p>
                )}
                {goldPricePerGram > 0 ? (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {fmtRp(goldPricePerGram)}/gr
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3" /> Isi harga emas di atas
                  </p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-gradient-primary-soft">
                <Scale className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`rounded-2xl overflow-hidden hover-lift border-0 shadow-elegant ${
            goldPricePerGram > 0 && unrealized >= 0
              ? "bg-gradient-success"
              : goldPricePerGram > 0
                ? "bg-gradient-danger"
                : "bg-gradient-card shadow-card border border-border/40"
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm mb-1 font-medium ${
                    goldPricePerGram > 0
                      ? "text-white/90"
                      : "text-muted-foreground"
                  }`}
                >
                  Untung / Rugi Berjalan
                </p>
                {goldPricePerGram > 0 ? (
                  <>
                    <p
                      className={`text-2xl font-bold font-mono-num ${
                        unrealized >= 0 ? "text-white" : "text-white"
                      }`}
                    >
                      {unrealized >= 0 ? "+" : ""}
                      {fmtRp(unrealized)}
                    </p>
                    <p
                      className={`text-[11px] mt-1 flex items-center gap-1 ${
                        unrealized >= 0 ? "text-white/80" : "text-white/80"
                      }`}
                    >
                      {unrealized >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {unrealizedPct >= 0 ? "+" : ""}
                      {unrealizedPct.toFixed(2)}% dari modal
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground font-mono-num">—</p>
                )}
              </div>
              <div
                className={`p-3 rounded-xl ${
                  goldPricePerGram > 0 ? "bg-white/15 backdrop-blur-sm" : "bg-gradient-primary-soft"
                }`}
              >
                {unrealized >= 0 ? (
                  <TrendingUp
                    className={`h-6 w-6 ${goldPricePerGram > 0 ? "text-white" : "text-primary"}`}
                  />
                ) : (
                  <TrendingDown
                    className={`h-6 w-6 ${goldPricePerGram > 0 ? "text-white" : "text-primary"}`}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tempat penyimpanan emas */}
      <Card className="shadow-card border border-border/40 rounded-2xl">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-display">Tempat Penyimpanan Emas</CardTitle>
            <CardDescription>
              Misalnya emas fisik di rumah, Antam, Pegadaian, atau emas digital ({goldAccounts.length}{" "}
              tempat)
            </CardDescription>
          </div>
          <Button
            variant={showAccountForm ? "outline" : "default"}
            size="sm"
            className="rounded-xl shrink-0"
            onClick={() => {
              setShowAccountForm(!showAccountForm);
              if (showAccountForm) {
                setEditingAccountId(null);
                setAccountForm({ name: "", institution: "", notes: "" });
              }
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            {showAccountForm ? "Tutup" : "Tambah Tempat"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAccountForm && (
            <form
              onSubmit={handleSaveAccount}
              className="p-4 border border-border/60 rounded-2xl bg-surface/50 space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="gold-name">Nama</Label>
                  <Input
                    id="gold-name"
                    placeholder="Contoh: Emas Antam 1 gr"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gold-institution">Tempat / Vendor</Label>
                  <Input
                    id="gold-institution"
                    placeholder="Antam, Pegadaian, Tokopedia Emas…"
                    value={accountForm.institution}
                    onChange={(e) => setAccountForm({ ...accountForm, institution: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gold-notes">Catatan</Label>
                  <Input
                    id="gold-notes"
                    placeholder="Opsional"
                    value={accountForm.notes}
                    onChange={(e) => setAccountForm({ ...accountForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-gradient-primary text-primary-foreground hover:opacity-90 rounded-xl"
                  disabled={savingAccount}
                >
                  {savingAccount ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingAccountId ? "Simpan Perubahan" : "Tambah Tempat"}
                </Button>
                {editingAccountId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingAccountId(null);
                      setAccountForm({ name: "", institution: "", notes: "" });
                      setShowAccountForm(false);
                    }}
                  >
                    Batal
                  </Button>
                )}
              </div>
            </form>
          )}

          {goldAccounts.length === 0 ? (
            <EmptyState
              icon={Gem}
              title="Belum ada tempat penyimpanan emas"
              description="Tambahkan tempat penyimpanan pertama — lalu catat pembelian emas lewat tombol Beli Emas."
              action={{
                label: "Tambah Tempat",
                onClick: () => setShowAccountForm(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {goldAccounts.map((account) => {
                const avgCost = account.grams > 0 ? account.total_cost / account.grams : 0;
                const value = account.grams * goldPricePerGram;
                return (
                  <div
                    key={account.id}
                    className="p-5 border border-border/60 rounded-2xl hover:bg-surface/50 hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-base font-semibold font-display text-foreground">
                            {account.name}
                          </h3>
                          {account.institution && (
                            <Badge variant="outline" className="rounded-md">
                              {account.institution}
                            </Badge>
                          )}
                          {account.grams <= 0 && (
                            <Badge className="bg-muted text-muted-foreground rounded-md">Kosong</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">Simpanan</span>
                            <p className="font-semibold text-foreground font-mono-num">
                              {fmtGram(account.grams)}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Modal</span>
                            <p className="font-semibold text-foreground font-mono-num">
                              {fmtRp(account.total_cost)}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Rata-rata Beli</span>
                            <p className="font-semibold text-foreground font-mono-num">
                              {avgCost > 0 ? `${fmtRp(avgCost)}/gr` : "—"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Nilai Sekarang</span>
                            <p className="font-semibold text-foreground font-mono-num">
                              {goldPricePerGram > 0 ? fmtRp(value) : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => openBuyDialog(account)}
                        >
                          <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Beli
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          disabled={account.grams <= 0}
                          onClick={() => openSellDialog(account)}
                        >
                          <Banknote className="h-3.5 w-3.5 mr-1" /> Jual
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg opacity-60 group-hover:opacity-100"
                          onClick={() => handleEditAccount(account)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-danger hover:text-danger opacity-60 group-hover:opacity-100"
                          onClick={() => setDeleteTarget(account)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riwayat beli/jual */}
      <Card className="shadow-card border border-border/40 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-display">Riwayat Beli & Jual Emas</CardTitle>
          <CardDescription>
            Pembelian tercatat sebagai pengeluaran; penjualan sebagai pemasukan baru di rekening tujuan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {goldTransactions.length === 0 ? (
            <EmptyState
              icon={Coins}
              title="Belum ada transaksi emas"
              description="Catat pembelian pertama Anda untuk mulai menabung dalam bentuk emas."
              action={{
                label: "Beli Emas",
                onClick: () => openBuyDialog(),
              }}
            />
          ) : (
            goldTransactions.map((tx) => {
              const accountName =
                goldAccounts.find((a) => a.id === tx.gold_account_id)?.name ?? "—";
              const realized =
                tx.type === "sell" && tx.cost_basis != null
                  ? tx.total_amount - tx.cost_basis
                  : null;
              return (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-border/60 rounded-2xl hover:bg-surface/50 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        tx.type === "buy"
                          ? "bg-warning-bg text-warning-foreground"
                          : "bg-success-bg text-success-foreground"
                      }`}
                    >
                      {tx.type === "buy" ? (
                        <ShoppingBag className="h-4 w-4" />
                      ) : (
                        <Banknote className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">
                          {tx.type === "buy" ? "Beli" : "Jual"} {fmtGram(tx.grams)}
                        </p>
                        <Badge variant="outline" className="rounded-md text-[10px]">
                          {accountName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {new Date(tx.transaction_id ? tx.created_at : tx.created_at).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                        {" · "}
                        {fmtRp(tx.price_per_gram)}/gr
                        {tx.notes ? ` · ${tx.notes}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p
                      className={`text-sm font-bold font-mono-num ${
                        tx.type === "buy" ? "text-danger" : "text-success"
                      }`}
                    >
                      {tx.type === "buy" ? "−" : "+"}
                      {fmtRp(tx.total_amount)}
                    </p>
                    {realized != null && (
                      <p
                        className={`text-[11px] font-medium font-mono-num ${
                          realized >= 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        Untung bersih: {realized >= 0 ? "+" : ""}
                        {fmtRp(realized)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Dialog Beli Emas */}
      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Beli Emas</DialogTitle>
            <DialogDescription>
              Uang keluar dari rekening dan simpanan emas bertambah otomatis.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBuySubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Simpanan Emas Tujuan</Label>
              <Select
                value={buyForm.gold_account_id}
                onValueChange={(v) => setBuyForm({ ...buyForm, gold_account_id: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tempat emas" />
                </SelectTrigger>
                <SelectContent>
                  {goldAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Rekening Asal (uang keluar)</Label>
              <Select
                value={buyForm.account_id}
                onValueChange={(v) => setBuyForm({ ...buyForm, account_id: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih rekening" />
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="buy-amount">Nominal (Rp)</Label>
                <MoneyInput
                  id="buy-amount"
                  value={buyForm.amount}
                  onChange={(v) => setBuyForm({ ...buyForm, amount: v })}
                  placeholder="1500000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="buy-grams">Berat (gram)</Label>
                <Input
                  id="buy-grams"
                  inputMode="decimal"
                  placeholder="Contoh: 1,12"
                  value={buyForm.grams}
                  onChange={(e) => setBuyForm({ ...buyForm, grams: e.target.value })}
                  required
                />
              </div>
            </div>
            {buyPrice > 0 && (
              <p className="text-xs text-muted-foreground">
                Harga beli: <span className="font-semibold text-foreground">{fmtRp(buyPrice)}/gr</span>
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="buy-date">Tanggal</Label>
                <Input
                  id="buy-date"
                  type="date"
                  value={buyForm.date}
                  onChange={(e) => setBuyForm({ ...buyForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kategori Pengeluaran</Label>
                <Select
                  value={buyForm.category_id}
                  onValueChange={(v) => setBuyForm({ ...buyForm, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Otomatis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Otomatis (Tabungan Emas)</SelectItem>
                    {expenseCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="buy-desc">Catatan (opsional)</Label>
              <Input
                id="buy-desc"
                placeholder="Contoh: beli emas Antam 1 gram"
                value={buyForm.description}
                onChange={(e) => setBuyForm({ ...buyForm, description: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 rounded-xl"
                disabled={
                  buying ||
                  !buyForm.gold_account_id ||
                  !buyForm.account_id ||
                  buyForm.amount <= 0 ||
                  buyGrams <= 0
                }
              >
                {buying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Catat Pembelian
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Jual Emas */}
      <Dialog open={sellOpen} onOpenChange={setSellOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Jual Emas</DialogTitle>
            <DialogDescription>
              Simpanan emas berkurang dan hasil penjualan masuk sebagai pemasukan baru.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSellSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Simpanan Emas</Label>
              <Select
                value={sellForm.gold_account_id}
                onValueChange={(v) => setSellForm({ ...sellForm, gold_account_id: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tempat emas" />
                </SelectTrigger>
                <SelectContent>
                  {goldAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} · {a.grams.toLocaleString("id-ID")} gr
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sellAccount && (
                <p className="text-xs text-muted-foreground">
                  Simpanan: <span className="font-semibold text-foreground">{fmtGram(sellAccount.grams)}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sell-grams">Berat Dijual (gram)</Label>
                <Input
                  id="sell-grams"
                  inputMode="decimal"
                  placeholder="Contoh: 5"
                  value={sellForm.grams}
                  onChange={(e) => setSellForm({ ...sellForm, grams: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sell-price">Harga Jual / gram</Label>
                <MoneyInput
                  id="sell-price"
                  value={sellForm.price}
                  onChange={(v) => setSellForm({ ...sellForm, price: v })}
                  placeholder="1600000"
                />
              </div>
            </div>

            {sellGrams > 0 && sellForm.price > 0 && (
              <div className="p-3 rounded-xl bg-surface/60 border border-border/60 space-y-1">
                <p className="text-sm font-semibold text-foreground font-mono-num">
                  Total diterima: {fmtRp(sellTotal)}
                </p>
                <p
                  className={`text-xs font-medium font-mono-num ${
                    sellEstGain >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  Perkiraan untung bersih: {sellEstGain >= 0 ? "+" : ""}
                  {fmtRp(sellEstGain)}
                </p>
                {sellAccount && sellGrams > sellAccount.grams && (
                  <p className="text-xs text-danger font-medium">
                    Melebihi simpanan ({fmtGram(sellAccount.grams)}).
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Rekening Tujuan (pemasukan masuk)</Label>
              <Select
                value={sellForm.account_id}
                onValueChange={(v) => setSellForm({ ...sellForm, account_id: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih rekening" />
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sell-date">Tanggal</Label>
                <Input
                  id="sell-date"
                  type="date"
                  value={sellForm.date}
                  onChange={(e) => setSellForm({ ...sellForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kategori Pemasukan</Label>
                <Select
                  value={sellForm.category_id}
                  onValueChange={(v) => setSellForm({ ...sellForm, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Otomatis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Otomatis (Penjualan Emas)</SelectItem>
                    {incomeCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sell-desc">Catatan (opsional)</Label>
              <Input
                id="sell-desc"
                placeholder="Contoh: jual 5 gram ke Pegadaian"
                value={sellForm.description}
                onChange={(e) => setSellForm({ ...sellForm, description: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 rounded-xl"
                disabled={
                  selling ||
                  !sellForm.gold_account_id ||
                  !sellForm.account_id ||
                  sellGrams <= 0 ||
                  sellForm.price <= 0 ||
                  (sellAccount ? sellGrams > sellAccount.grams : false)
                }
              >
                {selling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Catat Penjualan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteGoldAccount(deleteTarget.id)}
        title="Hapus Tempat Emas"
        description={
          deleteTarget
            ? `Apakah Anda yakin ingin menghapus "${deleteTarget.name}"? Simpanan ${fmtGram(
                deleteTarget.grams
              )} dan seluruh riwayat beli/jual di tempat ini ikut terhapus. Transaksi kas yang sudah tercatat di menu Transaksi tetap ada.`
            : ""
        }
      />
    </div>
  );
}
