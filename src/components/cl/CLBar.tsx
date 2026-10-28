"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type Msg = { role: "user" | "assistant"; content: string };

function pageLabel(pathname: string): string {
  if (pathname === "/") return "request-work";
  if (pathname === "/plan") return "plan-list";
  if (pathname.startsWith("/plan/")) return "plan-item";
  if (pathname.startsWith("/inbox")) return "inbox";
  if (pathname.startsWith("/admin")) return "admin-users";
  return pathname;
}

export function CLBar() {
  const pathname = usePathname();
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);

  const context = useMemo(() => {
    const itemMatch = pathname.match(/^\/plan\/(\d+)/);
    const itemId = itemMatch ? Number(itemMatch[1]) : null;
    return {
      pathname,
      page: pageLabel(pathname),
      itemId,
    };
  }, [pathname]);

  if (pathname === "/login" || status !== "authenticated") return null;

  async function send() {
    const content = text.trim();
    if (!content || sending) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setText("");
    setOpen(true);
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      setMessages([
        ...next,
        { role: "assistant", content: data.reply ?? data.error ?? "No reply" },
      ]);
    } catch (e) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Chat failed",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 18,
        transform: "translateX(-50%)",
        width: "min(640px, calc(100vw - 32px))",
        zIndex: 40,
        pointerEvents: "none",
      }}
    >
      {open && messages.length > 0 && (
        <div
          style={{
            pointerEvents: "auto",
            maxHeight: 280,
            overflowY: "auto",
            marginBottom: 10,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: "12px 14px",
            boxShadow: "0 12px 40px rgba(15,23,42,0.12)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "90%",
                background: m.role === "user" ? "#2563eb" : "#f8fafc",
                color: m.role === "user" ? "#fff" : "#334155",
                border: m.role === "user" ? "none" : "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "8px 12px",
                fontSize: 13,
                lineHeight: 1.5,
                fontFamily: "var(--font-sans)",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          ))}
          {sending && (
            <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "var(--font-sans)" }}>
              Thinking…
            </div>
          )}
        </div>
      )}

      <div
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 999,
          padding: "6px 6px 6px 6px",
          boxShadow: "0 10px 32px rgba(15,23,42,0.12)",
        }}
      >
        <button
          type="button"
          aria-label={messages.length ? "New chat" : "Focus AI planner"}
          onClick={() => {
            if (messages.length) {
              setMessages([]);
              setOpen(false);
            }
            document.querySelector<HTMLInputElement>(".cl-bar-input")?.focus();
          }}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontSize: 20,
            lineHeight: 1,
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            className="cl-bar-input"
            value={text}
            placeholder="Ask the AI Planner anything about the roadmap…"
            onChange={(e) => setText(e.target.value)}
            onInput={(e) => setText((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: 14,
              fontFamily: "var(--font-sans)",
              color: "#0f172a",
              background: "transparent",
              padding: "4px 6px",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          type="button"
          aria-label="Send"
          onClick={() => void send()}
          disabled={sending || !text.trim()}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            background: sending || !text.trim() ? "#f1f5f9" : "#2563eb",
            color: sending || !text.trim() ? "#94a3b8" : "#fff",
            cursor: sending || !text.trim() ? "default" : "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M8 12.5V3.5M8 3.5L3.5 8M8 3.5L12.5 8"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
