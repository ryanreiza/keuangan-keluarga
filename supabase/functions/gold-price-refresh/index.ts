import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { parseGoldSpotQuote } from "../_shared/gold-price.ts";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json(401, { error: "Silakan masuk terlebih dahulu." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!supabaseUrl || !publishableKey) {
    return json(500, { error: "Layanan harga emas belum dikonfigurasi." });
  }

  const supabase = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) return json(401, { error: "Sesi tidak valid. Silakan masuk ulang." });

  try {
    const response = await fetch("https://xaus.com/api/v1/spot?currency=IDR&unit=gram", {
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      const details = await response.text();
      console.error(`Gold quote source failed [${response.status}]: ${details.slice(0, 500)}`);
      return json(502, { error: "Sumber harga emas sedang tidak tersedia." });
    }

    const quote = parseGoldSpotQuote(await response.json());
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        gold_price_per_gram: quote.pricePerGram,
        gold_price_updated_at: quote.quotedAt,
        gold_price_source: "xaus",
      })
      .eq("user_id", userData.user.id);

    if (updateError) {
      console.error("Gold quote could not be saved:", updateError.message);
      return json(500, { error: "Harga emas berhasil dibaca, tetapi belum dapat disimpan." });
    }

    return json(200, {
      pricePerGram: quote.pricePerGram,
      quotedAt: quote.quotedAt,
      source: "xaus",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Gold quote refresh failed:", message);
    return json(502, {
      error: message.includes("format") || message.includes("kedaluwarsa") || message.includes("wajar")
        ? message
        : "Sumber harga emas tidak dapat dijangkau saat ini.",
    });
  }
});