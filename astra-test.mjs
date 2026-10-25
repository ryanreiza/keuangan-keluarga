import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";

const GATEWAY_BASE = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const apiKey = process.env.LOVABLE_API_KEY;

const DraftSchema = z.strictObject({
  transactions: z.array(
    z.strictObject({
      description: z.string(),
      amount: z.number(),
      type: z.enum(["income", "expense"]),
      date: z.string().nullable(),
      category_name: z.string().nullable(),
      account_name: z.string().nullable(),
      note: z.string().nullable(),
    }),
  ),
  summary: z.string().nullable(),
});

const transcript = "Beli ayam goreng lima puluh ribu.";

const instructions = `Kamu adalah mesin ekstraksi transaksi keuangan. Ubah input pengguna menjadi draf transaksi.
Tanggal hari ini: 2026-10-25.
KATEGORI PENGGUNA (pilih NAMA PERSIS):
- Makanan & Minuman (expense)
- Transportasi (expense)
- Gaji (income)
REKENING PENGGUNA:
- BCA (BCA)
- GoPay (GoPay)`;

const messages = [{ role: "user", content: `Transkrip rekaman suara pengguna:\n"""${transcript}"""` }];

const provider = createOpenAI({
  baseURL: GATEWAY_BASE,
  apiKey,
  headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
});

try {
  const result = streamText({
    model: provider.responses(MODEL),
    instructions,
    messages,
    output: Output.object({ schema: DraftSchema }),
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
  const parsed = await result.output;
  console.log("OK:", JSON.stringify(parsed, null, 2));
} catch (e) {
  console.log("ERROR name:", e?.name);
  console.log("ERROR message:", e?.message);
  if (e instanceof NoObjectGeneratedError) {
    console.log("text:", e.text?.slice(0, 500));
    console.log("cause:", e.cause?.message, e.cause?.responseBody?.slice?.(0, 800));
  } else {
    console.log("raw:", JSON.stringify(e, Object.getOwnPropertyNames(e)).slice(0, 1500));
  }
}
