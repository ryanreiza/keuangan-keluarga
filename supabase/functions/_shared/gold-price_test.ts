import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isGoldPriceDue, parseGoldSpotQuote } from "./gold-price.ts";

Deno.test("gold quote accepts fresh IDR per gram data", () => {
  const now = Date.parse("2026-11-07T06:00:00.000Z");
  const quote = parseGoldSpotQuote({
    xau: { price: 2_300_000, currency: "IDR", unit: "gram" },
    updated_at: "2026-11-07T05:59:00.000Z",
    stale: false,
  }, now);
  assertEquals(quote.pricePerGram, 2_300_000);
  assertEquals(quote.quotedAt, "2026-11-07T05:59:00.000Z");
});

Deno.test("gold quote rejects a wrong currency or unit", () => {
  assertThrows(() => parseGoldSpotQuote({
    xau: { price: 2_300_000, currency: "USD", unit: "gram" },
    updated_at: "2026-11-07T05:59:00.000Z",
  }));
  assertThrows(() => parseGoldSpotQuote({
    xau: { price: 2_300_000, currency: "IDR", unit: "oz" },
    updated_at: "2026-11-07T05:59:00.000Z",
  }));
});

Deno.test("gold quote rejects stale external data", () => {
  assertThrows(() => parseGoldSpotQuote({
    xau: { price: 2_300_000, currency: "IDR", unit: "gram" },
    updated_at: "2026-11-03T06:00:00.000Z",
  }, Date.parse("2026-11-07T06:00:00.000Z")));
});

Deno.test("gold quote refresh is due after one day", () => {
  const now = Date.parse("2026-11-07T06:00:00.000Z");
  assertEquals(isGoldPriceDue(null, now), true);
  assertEquals(isGoldPriceDue("2026-11-06T05:59:59.000Z", now), true);
  assertEquals(isGoldPriceDue("2026-11-06T06:00:01.000Z", now), false);
});