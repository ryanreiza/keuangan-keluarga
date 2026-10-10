import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { RotateCcw, MessageCircleQuestion } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import advisorLogo from "@/assets/advisor-logo.png";

const SUGGESTIONS = [
  "Duit bulan ini paling banyak abis buat apa ya?",
  "Bulan ini aku boros gak dibanding target alokasi?",
  "Bulan depan sebaiknya anggarannya gimana?",
  "Gimana biar utangku cepet lunas?",
];

type Filters = { from: string; to: string; accountId: string };
const ALL = "all";
const iso = (d: Date) => d.toISOString().slice(0, 10);
const defaultFilters = (): Filters => {
  const n = new Date();
  return { from: iso(new Date(n.getFullYear(), n.getMonth() - 5, 1)), to: iso(n), accountId: ALL };
};

function ScopeBar({ filters, setFilters, disabled }: { filters: Filters; setFilters: (f: Filters) => void; disabled: boolean }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<{ id: string; name: string; bank_name: string }[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("accounts").select("id,name,bank_name").eq("user_id", user.id).order("name")
      .then(({ data }) => setAccounts(data ?? []));
  }, [user]);
  const n = new Date();
  const presets: [string, () => Partial<Filters>][] = [
    ["Bulan ini", () => ({ from: iso(new Date(n.getFullYear(), n.getMonth(), 1)), to: iso(n) })],
    ["Bulan lalu", () => ({ from: iso(new Date(n.getFullYear(), n.getMonth() - 1, 1)), to: iso(new Date(n.getFullYear(), n.getMonth(), 0)) })],
    ["3 bulan", () => ({ from: iso(new Date(n.getFullYear(), n.getMonth() - 2, 1)), to: iso(n) })],
    ["6 bulan", () => ({ from: iso(new Date(n.getFullYear(), n.getMonth() - 5, 1)), to: iso(n) })],
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-3 md:p-4 flex flex-col lg:flex-row lg:items-end gap-3">
      <div className="flex flex-wrap gap-1.5">
        {presets.map(([label, fn]) => (
          <Button key={label} type="button" size="sm" variant="outline" disabled={disabled}
            onClick={() => setFilters({ ...filters, ...fn() })}>{label}</Button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
        <label className="text-xs text-muted-foreground space-y-1">
          <span>Dari tanggal</span>
          <Input type="date" value={filters.from} max={filters.to} disabled={disabled}
            onChange={(e) => e.target.value && setFilters({ ...filters, from: e.target.value })} />
        </label>
        <label className="text-xs text-muted-foreground space-y-1">
          <span>Sampai tanggal</span>
          <Input type="date" value={filters.to} min={filters.from} disabled={disabled}
            onChange={(e) => e.target.value && setFilters({ ...filters, to: e.target.value })} />
        </label>
        <div className="text-xs text-muted-foreground space-y-1 col-span-2 sm:col-span-1">
          <span>Rekening</span>
          <Select value={filters.accountId} disabled={disabled} onValueChange={(v) => setFilters({ ...filters, accountId: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Semua rekening</SelectItem>
              {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.bank_name})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function ChatWindow({ initialMessages }: { initialMessages: UIMessage[] }) {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: "finance-assistant",
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-assistant`,
      headers: async () => {
        const { data } = await supabase.auth.getSession();
        return {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${data.session?.access_token ?? ""}`,
        };
      },
      body: () => {
        const f = filtersRef.current;
        return { filters: { from: f.from, to: f.to, accountId: f.accountId === ALL ? undefined : f.accountId } };
      },
    }),
    onError: (err) => {
      let msg = err.message || "Gagal terhubung ke asisten.";
      try { msg = JSON.parse(msg).error ?? msg; } catch { /* plain text */ }
      toast({ title: "Asisten tidak bisa menjawab", description: msg, variant: "destructive" });
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  };

  const resetChat = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("ai_chat_messages").delete().eq("user_id", u.user.id);
    if (error) {
      toast({ title: "Gagal menghapus percakapan", description: error.message, variant: "destructive" });
      return;
    }
    setMessages([]);
  };

  return (
    <div className="space-y-3">
    <ScopeBar filters={filters} setFilters={setFilters} disabled={busy} />
    <div className="flex flex-col h-[calc(100dvh-20rem)] md:h-[calc(100dvh-18rem)] min-h-[420px] rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <Conversation className="flex-1">
        <ConversationContent className="px-4 md:px-8 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <img src={advisorLogo} alt="Penasihat Keuangan Keluarga" width={80} height={80} className="h-20 w-20" />
              <div>
                <h2 className="text-lg font-semibold font-display">Tanya apa saja tentang keuangan keluarga</h2>
                <p className="text-sm text-muted-foreground max-w-md mt-1">
                  Asisten membaca transaksi, Target Bulanan, tabungan, dan utang Anda untuk memberi wawasan dan rekomendasi anggaran.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 w-full max-w-2xl">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="text-left text-sm rounded-xl border border-border bg-background hover:bg-muted px-4 py-3 transition-colors flex gap-2"
                  >
                    <MessageCircleQuestion className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <Message from={m.role} key={m.id}>
              <MessageContent
                className={
                  m.role === "user"
                    ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground"
                    : "bg-transparent"
                }
              >
                {m.parts.map((p, i) =>
                  p.type === "text" ? (
                    m.role === "assistant" ? (
                      <MessageResponse key={i}>{p.text}</MessageResponse>
                    ) : (
                      <p key={i} className="whitespace-pre-wrap">{p.text}</p>
                    )
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}

          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent className="bg-transparent">
                <Shimmer>Menganalisis data keuangan Anda...</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-3 md:p-4 bg-background/60">
        <PromptInput onSubmit={(msg) => send(msg.text)}>
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            autoFocus
            onChange={(e) => setInput(e.target.value)}
            placeholder="Contoh: Berapa sisa anggaran makan saya bulan ini?"
          />
          <PromptInputFooter className="justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetChat}
              disabled={busy || messages.length === 0}
              className="text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-1" /> Mulai ulang
            </Button>
            <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !input.trim()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
    </div>
  );
}

export default function Assistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [initial, setInitial] = useState<UIMessage[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("ai_chat_messages")
      .select("message")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) toast({ title: "Gagal memuat riwayat", description: error.message, variant: "destructive" });
        setInitial(((data ?? []).map((r) => r.message) as unknown) as UIMessage[]);
      });
  }, [user, toast]);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={MessageCircleQuestion}
        eyebrow="Lovable AI"
        title="Penasihat Keuangan"
        subtitle="Wawasan pengeluaran dan rekomendasi anggaran yang dipersonalisasi"
      />
      {initial === null ? (
        <div className="h-[420px] rounded-2xl border border-border bg-card flex items-center justify-center">
          <Shimmer>Memuat percakapan...</Shimmer>
        </div>
      ) : (
        <ChatWindow initialMessages={initial} />
      )}
    </div>
  );
}
