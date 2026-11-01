// Parse a /v1/audio/transcriptions response body into a transcript.
// The gateway streams SSE events separated by \r\n\r\n (and sometimes \n\n),
// so parsing must be line-based and tolerant of both.
export function parseTranscriptionResponse(bodyText: string, contentType: string): string {
  let transcript = "";
  let deltas = "";
  const isSse = contentType.includes("text/event-stream") || bodyText.includes("data:");
  if (isSse) {
    for (const line of bodyText.split(/\r?\n/)) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload);
        if (evt?.type === "transcript.text.done" && typeof evt.text === "string") transcript = evt.text;
        else if (evt?.type === "transcript.text.delta" && typeof evt.delta === "string") {
          deltas += evt.delta;
        }
      } catch {
        /* ignore malformed line */
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
  return (transcript || deltas).trim();
}
