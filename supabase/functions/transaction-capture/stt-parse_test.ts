import { parseTranscriptionResponse } from "./stt-parse.ts";
import { assertEq } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { assert } from "https://deno.land/std@0.224.0/assert/assert.ts";

Deno.test("parses SSE transcript with \\r\\n separators (gateway format)", () => {
  const body =
    'data: {"type":"transcript.text.delta","delta":"Beli"}\r\n\r\n' +
    'data: {"type":"transcript.text.delta","delta":" ayam"}\r\n\r\n' +
    'data: {"type":"transcript.text.done","text":"Beli ayam goreng.","usage":{"type":"duration","seconds":9},"languages":[{"code":"id"}]}\r\n\r\n' +
    "data: [DONE]\r\n\r\n";
  const out = parseTranscriptionResponse(body, "text/event-stream; charset=utf-8");
  assertEq(out, "Beli ayam goreng.");
});

Deno.test("parses SSE transcript with \\n separators (fallback format)", () => {
  const body =
    'data: {"type":"transcript.text.delta","delta":"Jajan"}\n\n' +
    'data: {"type":"transcript.text.delta","delta":" bakso"}\n\n' +
    "data: [DONE]\n\n";
  const out = parseTranscriptionResponse(body, "text/event-stream");
  assertEq(out, "Jajan bakso");
});

Deno.test("parses buffered JSON transcript", () => {
  const out = parseTranscriptionResponse(JSON.stringify({ text: "Beli pulsa 50rb." }), "application/json");
  assertEq(out, "Beli pulsa 50rb.");
});

Deno.test("returns empty string for transcript with no text events", () => {
  const out = parseTranscriptionResponse("data: [DONE]\r\n\r\n", "text/event-stream");
  assertEq(out, "");
});

Deno.test("tolerates malformed data lines without dropping valid ones", () => {
  const body =
    'data: not-json\r\n\r\n' +
    'data: {"type":"transcript.text.delta","delta":"Oke"}\r\n\r\n';
  const out = parseTranscriptionResponse(body, "text/event-stream");
  assert(out.length > 0);
  assertEq(out, "Oke");
});
