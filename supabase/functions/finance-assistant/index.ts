import { createClient } from "npm:@supabase/supabase-js@2";
import { convertToModelMessages, type UIMessage } from "npm:ai";
import { createResponsesCall } from "../_shared/responses.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const rp = (n: number) => "Rp" + Math.round(Number(n) || 0).toLocaleString("id-ID");

// deno-lint-ignore no-explicit-any
type Filters = { from?: string; to?: string; accountId?: string };
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f-]{36}$/i;

// deno-lint-ignore no-explicit-any
async function buildContext(sb: any, userId: string, f: Filters) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const start = f.from ?? new Date(year, now.getMonth() - 5, 1).toISOString().slice(0, 10);
  const end = f.to ?? now.toISOString().slice(0, 10);

  let txQ = sb.from("transactions")
    .select("amount,type,transaction_date,description,category_id,savings_goal_id,debt_id")
    .eq("user_id", userId).gte("transaction_date", start).lte("transaction_date", end);
  if (f.accountId) txQ = txQ.or(`account_id.eq.${f.accountId},destination_account_id.eq.${f.accountId}`);
  let accQ = sb.from("accounts").select("name,bank_name,current_balance,is_active").eq("user_id", userId);
  if (f.accountId) accQ = accQ.eq("id", f.accountId);

  const [cats, accs, txs, goals, debts, incomes, fixed, allocs, budgets] = await Promise.all([
    sb.from("categories").select("id,name,type").eq("user_id", userId),
    accQ,
    txQ.order("transaction_date", { ascending: false }).limit(3000),
    sb.from("savings_goals").select("name,target_amount,current_amount,target_date,is_achieved").eq("user_id", userId),
    sb.from("debts").select("creditor_name,total_amount,remaining_amount,monthly_payment,interest_rate,due_date,is_paid_off").eq("user_id", userId),
    sb.from("monthly_plan_incomes").select("category,amount").eq("user_id", userId).eq("month", month).eq("year", year),
    sb.from("monthly_plan_fixed_expenses").select("category,amount,is_done,web_category_id").eq("user_id", userId).eq("month", month).eq("year", year),
    sb.from("monthly_plan_allocations").select("category,percentage,note,web_category_id").eq("user_id", userId).eq("month", month).eq("year", year),
    sb.from("monthly_budgets").select("category_id,expected_amount").eq("user_id", userId).eq("month", month).eq("year", year),
  ]);

  const catName = new Map<string, string>((cats.data ?? []).map((c: any) => [c.id, c.name]));
  const monthly = new Map<string, { income: number; expense: number; byCat: Map<string, number> }>();
  const recent: string[] = [];
  for (const t of txs.data ?? []) {
    const key = String(t.transaction_date).slice(0, 7);
    if (!monthly.has(key)) monthly.set(key, { income: 0, expense: 0, byCat: new Map() });
    const m = monthly.get(key)!;
    const amt = Number(t.amount) || 0;
    if (t.type === "income") m.income += amt;
    else if (t.type === "expense" || t.type === "debt_payment") {
      m.expense += amt;
      const c = catName.get(t.category_id) ?? "Lainnya";
      m.byCat.set(c, (m.byCat.get(c) ?? 0) + amt);
    }
    if (recent.length < 40 && t.type !== "transfer") {
      recent.push(`${t.transaction_date} | ${t.type} | ${catName.get(t.category_id) ?? "-"} | ${rp(amt)} | ${t.description ?? ""}`);
    }
  }

  const monthLines = [...monthly.entries()].sort().map(([k, m]) => {
    const top = [...m.byCat.entries()].sort((a, b) => b[1] - a[1]).map(([c, v]) => `${c} ${rp(v)}`).join(", ");
    return `- ${k}: pemasukan ${rp(m.income)}, pengeluaran ${rp(m.expense)}. Per kategori: ${top || "-"}`;
  });

  const totalIncomePlan = (incomes.data ?? []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
  const fixedTotal = (fixed.data ?? []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
  const sisa = totalIncomePlan - fixedTotal;
  const curKey = `${year}-${String(month).padStart(2, "0")}`;
  const curByCat = monthly.get(curKey)?.byCat ?? new Map();

  const accLabel = f.accountId ? (accs.data?.[0] ? `${accs.data[0].name} saja` : "rekening terpilih") : "semua rekening";
  return `Tanggal hari ini: ${now.toISOString().slice(0, 10)}. Semua nilai dalam Rupiah.
CAKUPAN ANALISIS yang dipilih pengguna: periode ${start} s.d. ${end}, ${accLabel}. Data transaksi di bawah hanya mencakup cakupan ini; sebutkan cakupan ini di jawaban bila relevan dan jangan menyimpulkan di luar cakupan.

## Rekening
${(accs.data ?? []).map((a: any) => `- ${a.name} (${a.bank_name})${a.is_active === false ? " [nonaktif]" : ""}: ${rp(a.current_balance)}`).join("\n") || "-"}

## Ringkasan transaksi per bulan dalam cakupan
${monthLines.join("\n") || "- Belum ada transaksi"}

## Transaksi terbaru (maks 40)
${recent.join("\n") || "-"}

## Target Bulanan ${curKey}
Pemasukan rencana: ${(incomes.data ?? []).map((r: any) => `${r.category || "-"} ${rp(r.amount)}`).join(", ") || "-"} (total ${rp(totalIncomePlan)})
Pengeluaran Tetap: ${(fixed.data ?? []).map((r: any) => `${r.category || "-"} ${rp(r.amount)}${r.is_done ? " [sudah dilakukan]" : ""}`).join(", ") || "-"} (total ${rp(fixedTotal)})
Sisa keuangan setelah pengeluaran tetap: ${rp(sisa)}
Target Alokasi Keuangan (persentase dari sisa keuangan):
${(allocs.data ?? []).map((a: any) => {
    const target = (sisa * Number(a.percentage || 0)) / 100;
    const c = a.web_category_id ? catName.get(a.web_category_id) : undefined;
    const real = c ? curByCat.get(c) ?? 0 : undefined;
    return `- ${a.category || "-"}: ${a.percentage}% ≈ ${rp(target)}${c ? ` (kategori aplikasi: ${c}, realisasi bulan ini ${rp(real ?? 0)})` : ""}${a.note ? ` — ${a.note}` : ""}`;
  }).join("\n") || "- Belum diisi"}

## Anggaran "Yang Diharapkan" bulan ini
${(budgets.data ?? []).filter((b: any) => b.category_id).map((b: any) => `- ${catName.get(b.category_id) ?? "-"}: target ${rp(b.expected_amount)}, realisasi ${rp(curByCat.get(catName.get(b.category_id)) ?? 0)}`).join("\n") || "-"}

## Tujuan Tabungan
${(goals.data ?? []).map((g: any) => `- ${g.name}: ${rp(g.current_amount)} / ${rp(g.target_amount)}${g.target_date ? `, target ${g.target_date}` : ""}${g.is_achieved ? " [tercapai]" : ""}`).join("\n") || "-"}

## Utang
${(debts.data ?? []).map((d: any) => `- ${d.creditor_name}: sisa ${rp(d.remaining_amount)} dari ${rp(d.total_amount)}${d.monthly_payment ? `, cicilan ${rp(d.monthly_payment)}/bln` : ""}${d.interest_rate ? `, bunga ${d.interest_rate}%` : ""}${d.is_paid_off ? " [lunas]" : ""}`).join("\n") || "-"}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Silakan masuk terlebih dahulu." });

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json(500, { error: "Layanan AI belum dikonfigurasi." });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
  if (userErr || !userData?.user) return json(401, { error: "Sesi tidak valid. Silakan masuk ulang." });
  const userId = userData.user.id;

  let messages: UIMessage[];
  const filters: Filters = {};
  try {
    const body = await req.json();
    messages = body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error();
    const f = body?.filters ?? {};
    if (typeof f.from === "string" && DATE_RE.test(f.from)) filters.from = f.from;
    if (typeof f.to === "string" && DATE_RE.test(f.to)) filters.to = f.to;
    if (typeof f.accountId === "string" && UUID_RE.test(f.accountId)) filters.accountId = f.accountId;
    if (filters.from && filters.to && filters.from > filters.to) return json(400, { error: "Tanggal mulai harus sebelum tanggal akhir." });
  } catch {
    return json(400, { error: "Permintaan tidak valid." });
  }

  // Persist the latest user message
  const last = messages[messages.length - 1];
  if (last?.role === "user") {
    const { error } = await sb.from("ai_chat_messages").upsert(
      { user_id: userId, message_id: last.id, role: "user", message: last },
      { onConflict: "user_id,message_id" },
    );
    if (error) console.error("save user message failed", error);
  }

  const context = await buildContext(sb, userId, filters);
  const instructions = `Kamu adalah "Penasihat Keuangan Keluarga", asisten keuangan rumah tangga di aplikasi Keuangan Keluarga.
Pengguna akan bertanya dengan bahasa sehari-hari, santai, singkatan, atau bahasa gaul (contoh: "duit gue abis buat apa aja sih?", "bulan ini boros gak?", "jajan kebanyakan ya?", "50rb", "1,5jt"). Pahami maksudnya, tafsirkan kata seperti "jajan", "makan", "belanja", "cicilan", "nabung" ke kategori yang paling cocok di data, dan pahami waktu relatif ("bulan ini", "kemarin", "bulan lalu", "minggu ini") berdasarkan tanggal hari ini.
Jawab dalam Bahasa Indonesia sehari-hari yang hangat, jelas, dan ringkas, hindari istilah keuangan yang rumit (jelaskan singkat bila terpaksa). Gunakan format Rupiah (contoh: Rp1.250.000).
Gunakan HANYA data pengguna di bawah ini sebagai fakta; jika data tidak cukup, katakan terus terang dan sarankan data apa yang perlu dicatat.
Berikan wawasan pengeluaran (tren, kategori terbesar, perbandingan dengan target alokasi) dan rekomendasi anggaran yang konkret dan bisa dilakukan.
Gunakan poin-poin dan tabel markdown singkat bila membantu. Jangan memberi nasihat investasi spesifik produk. Jaga jawaban di bawah ±350 kata kecuali diminta lebih rinci.

# DATA KEUANGAN PENGGUNA
${context}`;

  try {
    const call = createResponsesCall(
      req,
      { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, model: "openai/gpt-6-astra" },
      await convertToModelMessages(messages),
      instructions,
    );
    return await call.response({
      originalMessages: messages,
      headers: corsHeaders,
      onError: (error: unknown) => {
        console.error("stream error", error);
        // deno-lint-ignore no-explicit-any
        const status = (error as any)?.statusCode;
        if (status === 429) return "Terlalu banyak permintaan. Coba lagi sebentar lagi.";
        if (status === 402) return "Kredit AI habis. Tambahkan kredit di pengaturan workspace.";
        if (status === 403) return "Akses AI ditolak untuk permintaan ini.";
        return "Terjadi kesalahan saat memproses jawaban.";
      },
      onFinish: async ({ responseMessage }) => {
        const { error } = await sb.from("ai_chat_messages").upsert(
          { user_id: userId, message_id: responseMessage.id, role: "assistant", message: responseMessage },
          { onConflict: "user_id,message_id" },
        );
        if (error) console.error("save assistant message failed", error);
      },
    });
  } catch (e) {
    console.error(e);
    return json(500, { error: "Gagal menghubungi layanan AI." });
  }
});
