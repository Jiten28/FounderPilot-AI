import { useEffect, useRef, useState } from "react";
import { sendChatMessage, ApiError } from "../../api/client";
import { MessageBubble, type ChatMessage } from "./MessageBubble";
import type { AnalysisResult } from "../../types/api";

const SUGGESTIONS = [
  "Should I hire another developer?",
  "What's my biggest risk right now?",
  "Am I ready to raise funding?",
];

export function ChatWindow({ analysis }: { analysis: AnalysisResult }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: `Hey — I've reviewed ${analysis.business_summary.split(".")[0]}. Ask me anything about your numbers, risks, or next steps.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    setMessages((prev) => [...prev, { role: "founder", text: trimmed }]);
    setInput("");
    setSending(true);
    try {
      const res = await sendChatMessage({ analysis_id: analysis.analysis_id, message: trimmed });
      setMessages((prev) => [...prev, { role: "ai", text: res.reply }]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong sending that message.";
      setError(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[560px] flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-muted)]"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-5 mb-2 rounded-lg bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] px-3 py-2 text-xs text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 px-5 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition hover:border-primary hover:text-[var(--text-primary)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="flex items-center gap-2 border-t border-[var(--border-subtle)] p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your startup..."
          className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-4 py-2.5 text-sm outline-none placeholder:text-[var(--text-muted)] focus:border-primary"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
