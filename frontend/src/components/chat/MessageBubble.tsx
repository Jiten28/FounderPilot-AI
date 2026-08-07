import { cn } from "../../lib/cn";

export interface ChatMessage {
  role: "founder" | "ai";
  text: string;
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isFounder = message.role === "founder";
  return (
    <div className={cn("flex animate-fade-slide-in", isFounder ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[70%]",
          isFounder
            ? "rounded-br-sm bg-primary text-white"
            : "rounded-bl-sm border border-[var(--border-subtle)] bg-[var(--surface-raised)] text-[var(--text-primary)]"
        )}
      >
        {message.text}
      </div>
    </div>
  );
}
