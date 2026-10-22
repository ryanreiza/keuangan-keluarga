import { createClient } from "npm:@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai";
import {
  streamText,
  Output,
  NoObjectGeneratedError,
  NoOutputGeneratedError,
  APICallError,
  type ModelMessage,
} from "npm:ai";
import { z } from "npm:zod";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
} from "../_shared/run-id.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const GATEWAY_BASE = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const STT_MODEL = "openai/gpt-transcribe";

const TEXT_MAX = 2000;
const AUDIO_B64_MAX = 20_000_000; // ~15 MB decoded
const IMAGE_B64_MAX = 10_000_000; // ~7.5 MB decoded
const MAX_DRAFTS = 10;

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const rp = (n: number) => "Rp" + Math.round(Number(n) || 0).toLocaleString("id-ID");

// ---------- Structured output schema (strict-compatible: flat, all required, nullable optionals) ----------
const DraftSchema = z
  .object({
    transactions: z
      .array(
        z
          .object({
            description: z.string(),
            amount: z.number(),
            type: z.enum(["income", "expense"]),
            date: z.string().nullable(),
            category_name: z.string().nullable(),
            account_name: z.string().nullable(),
            note: z.string().nullable(),
          })
          .strict(),
      )
      .strict(),
    summary: z.string().nullable(),
  })
  .strict();

type RawDraft = z.infer<typeof DraftSchema>["transactions"][number];

// ---------- Shared input validation ----------
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isBase64(s: string): boolean {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(s) || s.startsWith("data:");
}

function stripDataUrl(s: string): string {
  const idx = s.indexOf("base64,");
  return idx >= 0 ? s.slice(idx + 7) : s;
}

// ---------- Audio transcription via /v1/audio/transcriptions ----------
async function transcribeAudio(apiKey: string, b64: string, mime: string, signal?: AbortSignal): Promise<string> {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  if (bytes.length < 2048) {
    throw new HttpError(400, "Rekaman terlalu pendek atau kosong. Silakan rekam ulang.");
  }
  const ext = /mp4|m4a/.test(mime) ? "m4a" : /ogg/.test(mime) ? "ogg" : "webm";

  const form = new FormData();
  form.append("model", STT_MODEL);
  form.append("file", new Blob([bytes], { type: mime }), `audio.${ext}`);
  form.append("response_format", "json");
  form.append("stream", "true");
  form.append("languages", "id");

  const resp = await fetch(`${GATEWAY_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    ...(signal ? { signal } : {}),
  });

  const bodyText = await resp.text();
  if (!resp.ok) {
    let msg = "Gagal mentranskripsi rekaman.";
    try {
      const err = JSON.parse(bodyText);
      if (typeof err?.message === "string" && err.message) msg = `Transkripsi gagal (${resp.status}): ${err.message}`;
    } catch {
      /* keep default */
    }
    console.error("transcription failed", resp.status, bodyText.slice(0, 500));
    throw new HttpError(resp.status === 400 ? 400 : resp.status, msg);
  }

  const contentType = resp.headers.get("content-type") ?? "";
  let transcript = "";
  if (contentType.includes("text/event-stream")) {
    for (const block of bodyText.split("\n\n")) {
      const dataLine = block
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim())
        .join("");
      if (!dataLine || dataLine === "[DONE]") continue;
      try {
        const evt = JSON.parse(dataLine);
        if (evt?.type === "transcript.text.done" && typeof evt.text === "string") transcript = evt.text;
        else if (evt?.type === "transcript.text.delta" && typeof evt.delta === "string" && !transcript) {
          transcript += evt.delta;
        }
      } catch {
        /* ignore malformed block */
      }
    }
  } else {
    try {
      const parsed = JSON.parse(bodyText);
      if (typeof parsed?.text === "string") transcript = parsed.text;
    } catch {
      /* ignore */
    }
  }

  transcript = transcript.trim();
  if (!transcript) throw new HttpError(422, "Rekaman tidak berhasil dibaca. Coba rekam lagi lebih dekat ke mikrofon.");
  return transcript;
}

// ---------- Prompt ----------
function buildInstructions(today: string, catLines: string[], accLines: string[]): string {
  return `Kamu adalah mesin ekstraksi transaksi keuangan untuk aplikasi Keuangan Keluarga (rumah tangga Indonesia).
Tugas: mengubah input pengguna (pesan chat santai, transkrip suara, atau foto struk belanja) menjadi draf transaksi yang terstruktur.

Tanggal hari ini: ${today}.

ATURAN UMUM:
- Pahami bahasa sehari-hari, singkatan, dan bahasa gaul Indonesia (contoh: "jajan 25rb", "duit gaji masuk 5,2jt", "bayar listrik 350rb pake BCA").
- Nominal: "rb"/"ribu"/"k" dikali 1.000, "jt"/"juta"/"m"? tidak dipakai, "jt" dikali 1.000.000, "2,5jt" = 2500000, "1,5 jt" = 1500000, "50rb" = 50000. Tulis sebagai angka penuh tanpa titik.
- Tanggal: pahami waktu relatif ("kemarin", "tadi pagi", "minggu lalu", "bulan lalu") berdasarkan tanggal hari ini. "Tanggal 5" berarti tanggal 5 bulan ini, atau bulan lalu bila tanggal itu masih di masa depan. Format hasil: YYYY-MM-DD. Bila tidak disebut, gunakan hari ini (${today}).
- type: "income" untuk uang masuk (gaji, bonus, penjualan, transfer masuk), "expense" untuk uang keluar (belanja, jajan, cicilan, tagihan).
- Bila satu pesan memuat beberapa transaksi, keluarkan beberapa draf (maksimal 10).
- Jangan mengarang data yang tidak ada. Jika nominal tidak bisa ditentukan sama sekali, isi amount 0 dan jelaskan di summary agar pengguna melengkapinya.
- summary: 1-2 kalimat Bahasa Indonesia santai yang merangkum apa yang kamu baca dan hal yang perlu pengguna periksa (misal tanggal atau kategori yang kamu tebak).

KATEGORI PENGGUNA (pilih NAMA PERSIS dari daftar ini untuk category_name, pilih yang paling cocok; kalau tidak ada yang cocok isi null):
${catLines.join("\n") || "- (belum ada kategori)"}

REKENING PENGGUNA (pilih NAMA PERSIS dari daftar ini untuk account_name bila pengguna menyebut rekening/sumber dana; kalau tidak disebut, isi null):
${accLines.join("\n") || "- (belum ada rekening)"}

MODE STRUK (foto):
- Baca teks struk dengan teliti (OCR): nama toko/merchant, tanggal, rincian item, pajak, dan GRAND TOTAL.
- Satu struk biasanya menjadi SATU transaksi: description = nama merchant, amount = grand total (bukan subtotal per item), date = tanggal di struk (format YYYY-MM-DD; jika tidak terbaca, hari ini).
- Hanya pecah menjadi beberapa transaksi (maksimal 5) jika struk jelas berisi beberapa pembelian yang benar-benar berbeda tujuan dan totalnya tetap terbagi rapi.
- category_name = tebakan kategori terbaik dari item di struk; account_name = null kecuali metode pembayaran di struk cocok dengan daftar rekening.
- note = ringkasan singkat isi struk (2-3 item utama).
- Jika gambar bukan struk belanja atau teks tidak terbaca, kembalikan transactions kosong dan jelaskan di summary.`;
}

// ---------- Category / account matching ----------
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function bestMatch(label: string | null | undefined, items: { id: string; name: string }[]): string | null {
  if (!label) return null;
  const n = norm(String(label));
  if (!n) return null;
  for (const it of items) if (norm(it.name) === n) return it.id;
  for (const it of items) {
    const a = norm(it.name);
    if (a.startsWith(n) || n.startsWith(a)) return it.id;
  }
  for (const it of items) {
    const a = norm(it.name);
    if (a.includes(n) || n.includes(a)) return it.id;
  }
  return null;
}

// deno-lint-ignore no-explicit-any
function mapError(e: unknown): { status: number; message: string } {
  if (e instanceof HttpError) return { status: e.status, message: e.message };
  const status = (e as { statusCode?: number })?.statusCode;
  if (status === 429) return { status: 429, message: "Terlalu banyak permintaan. Coba lagi sebentar lagi." };
  if (status === 402) return { status: 402, message: "Kredit AI habis. Tambahkan kredit di pengaturan workspace." };
  if (status === 403) return { status: 403, message: "Akses AI ditolak untuk permintaan ini." };
  if (status === 401) return { status: 401, message: "Layanan AI belum terautentikasi." };
  if (e instanceof APICallError) return { status: 500, message: "Gagal menghubungi layanan AI." };
  return { status: 500, message: "Terjadi kesalahan saat membaca transaksi. Coba lagi." };
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

  // Parse & validate input
  let mode: string;
  let text = "";
  let audioB64 = "";
  let audioMime = "";
  let imageDataUrl = "";
  try {
    const body = await req.json();
    mode = typeof body?.mode === "string" ? body.mode : "";
    text = typeof body?.text === "string" ? body.text.trim().slice(0, TEXT_MAX) : "";
    audioB64 = typeof body?.audioBase64 === "string" ? stripDataUrl(body.audioBase64) : "";
    audioMime = typeof body?.audioMime === "string" ? body.audioMime : "";
    imageDataUrl = typeof body?.imageDataUrl === "string" ? body.imageDataUrl : "";
    if (!["text", "audio", "image"].includes(mode)) throw new Error("mode tidak dikenal");
    if (mode === "text" && !text) throw new Error("teks kosong");
    if (mode === "text" && !isBase64(text)) throw new Error("teks tidak valid");
    if (mode === "audio") {
      if (!audioB64 || audioB64.length > AUDIO_B64_MAX) throw new Error("audio tidak valid / terlalu besar");
      if (!/^audio\//.test(audioMime)) throw new Error("tipe audio tidak didukung");
    }
    if (mode === "image") {
      if (!imageDataUrl || imageDataUrl.length > IMAGE_B64_MAX) throw new Error("gambar tidak valid / terlalu besar");
      if (!/^data:image\/(png|jpe?g|webp|heic|heif);base64,/.test(imageDataUrl)) throw new Error("tipe gambar tidak didukung");
    }
  } catch (e) {
    return json(400, { error: "Permintaan tidak valid." + (e instanceof Error && e.message ? ` (${e.message})` : "") });
  }

  // Fetch user's categories & accounts (RLS-scoped via caller JWT)
  const [catsRes, accsRes] = await Promise.all([
    sb.from("categories").select("id,name,type").eq("user_id", userId).order("name"),
    sb.from("accounts").select("id,name,bank_name,is_active").eq("user_id", userId).order("name"),
  ]);
  if (catsRes.error || accsRes.error) {
    console.error("fetch context failed", catsRes.error ?? accsRes.error);
    return json(500, { error: "Gagal memuat data kategori/rekening." });
  }
  const categories = (catsRes.data ?? []) as { id: string; name: string; type: string }[];
  const accounts = (accsRes.data ?? []) as { id: string; name: string; bank_name: string; is_active: boolean }[];

  const today = new Date().toISOString().slice(0, 10);
  const catLines = categories.map((c) => `- ${c.name} (${c.type})`);
  const accLines = accounts.map((a) => `- ${a.name} (${a.bank_name})${a.is_active === false ? " [nonaktif]" : ""}`);
  const instructions = buildInstructions(today, catLines, accLines);

  // Optional transcript for audio mode
  let transcript: string | undefined;
  try {
    if (mode === "audio") {
      transcript = await transcribeAudio(apiKey, audioB64, audioMime, req.signal);
    }
  } catch (e) {
    const m = mapError(e);
    return json(m.status, { error: m.message });
  }

  // Build model messages
  let messages: ModelMessage[];
  if (mode === "audio") {
    messages = [{ role: "user", content: `Transkrip rekaman suara pengguna:\n"""${transcript}"""` }];
  } else if (mode === "image") {
    messages = [
      {
        role: "user",
        content: [
          { type: "text", text: "Foto struk belanja pengguna. Baca struk ini dan ubah menjadi draf transaksi." },
          { type: "image", image: imageDataUrl },
        ],
      },
    ];
  } else {
    messages = [{ role: "user", content: `Pesan chat pengguna:\n"""${text}"""` }];
  }

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
  const provider = createOpenAI({
    baseURL: GATEWAY_BASE,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  let parsed: z.infer<typeof DraftSchema> | undefined;
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      instructions,
      messages,
      output: Output.object({ schema: DraftSchema }),
      abortSignal: req.signal,
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    parsed = await result.output;
  } catch (e) {
    if (e instanceof NoObjectGeneratedError || e instanceof NoOutputGeneratedError) {
      // Try guarded fallback parse of raw text
      const raw = (e as { text?: string })?.text ?? "";
      try {
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start >= 0 && end > start) parsed = JSON.parse(raw.slice(start, end + 1));
      } catch {
        /* fallthrough */
      }
      if (!parsed) {
        console.error("no object generated", e.message, raw.slice(0, 300));
        return json(422, { error: "AI tidak berhasil membaca input ini. Coba tulis dengan lebih jelas." });
      }
    } else {
      const m = mapError(e);
      console.error("capture failed", m.status, e);
      return json(m.status, { error: m.message });
    }
  }

  // Normalize & clamp
  const rawTxs = Array.isArray(parsed?.transactions) ? parsed.transactions.slice(0, MAX_DRAFTS) : [];
  const drafts = rawTxs
    .map((t: RawDraft) => {
      const amount = Math.round(Number(t.amount) || 0);
      if (amount <= 0 || amount > 1_000_000_000_000) return null;
      const type = t.type === "income" ? "income" : "expense";
      const date = typeof t.date === "string" && DATE_RE.test(t.date) ? t.date : today;
      const catPool = categories.filter((c) => c.type === type);
      const category_id = bestMatch(t.category_name, catPool.length ? catPool : categories);
      const activeAccs = accounts.filter((a) => a.is_active !== false);
      const account_id = bestMatch(t.account_name, activeAccs.length ? activeAccs : accounts);
      return {
        description: String(t.description ?? "").trim().slice(0, 120) || (type === "income" ? "Pemasukan" : "Pengeluaran"),
        amount,
        type,
        date,
        category_id,
        category_name: t.category_name ?? null,
        account_id,
        account_name: t.account_name ?? null,
        note: typeof t.note === "string" ? t.note.slice(0, 200) : null,
      };
    })
    .filter(Boolean);

  return new Response(
    JSON.stringify({
      drafts,
      summary: parsed?.summary ?? null,
      transcript: transcript ?? null,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
