export type GoldSpotQuote = {
  pricePerGram: number;
  quotedAt: string;
};

const MAX_QUOTE_AGE_MS = 72 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

export function parseGoldSpotQuote(payload: unknown, now = Date.now()): GoldSpotQuote {
  if (!payload || typeof payload !== "object") {
    throw new Error("Sumber harga emas mengembalikan data yang tidak valid.");
  }

  const data = payload as {
    xau?: { price?: unknown; currency?: unknown; unit?: unknown };
    updated_at?: unknown;
    data_state?: { as_of?: unknown; status?: unknown };
    stale?: unknown;
  };
  const pricePerGram = Number(data.xau?.price);
  const quotedAt = typeof data.data_state?.as_of === "string"
    ? data.data_state.as_of
    : typeof data.updated_at === "string"
    ? data.updated_at
    : "";
  const quotedTime = Date.parse(quotedAt);

  if (
    data.xau?.currency !== "IDR" || data.xau?.unit !== "gram" ||
    !Number.isFinite(pricePerGram) || pricePerGram <= 0
  ) {
    throw new Error("Harga emas dari sumber tidak memiliki format IDR per gram yang valid.");
  }
  if (!Number.isFinite(quotedTime)) {
    throw new Error("Waktu kutipan harga emas dari sumber tidak valid.");
  }
  if (quotedTime > now + MAX_FUTURE_SKEW_MS) {
    throw new Error("Waktu kutipan harga emas dari sumber tidak wajar.");
  }
  if (data.stale === true || data.data_state?.status === "stale" || now - quotedTime > MAX_QUOTE_AGE_MS) {
    throw new Error("Sumber harga emas sedang menampilkan kutipan yang sudah kedaluwarsa.");
  }

  return { pricePerGram, quotedAt: new Date(quotedTime).toISOString() };
}

export function isGoldPriceDue(updatedAt: string | null | undefined, now = Date.now()): boolean {
  if (!updatedAt) return true;
  const lastUpdated = Date.parse(updatedAt);
  return !Number.isFinite(lastUpdated) || now - lastUpdated >= 24 * 60 * 60 * 1000;
}