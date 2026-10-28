"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type Msg = { role: "user" | "assistant"; content: string };

export function CLBar() {
  const pathname = usePathname();
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);

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
        body: JSON.stringify({ messages: next }),
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
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        background: "#fff",
        borderTop: "1px solid #e2e8f0",
        boxShadow: "0 -8px 24px rgba(15,23,42,0.04)",
      }}
    >
      {open && messages.length > 0 && (
        <div
          style={{
            maxHeight: 260,
            overflowY: "auto",
            padding: "12px 20px 0",
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
                maxWidth: 640,
                background: m.role === "user" ? "#1d4ed8" : "#f8fafc",
                color: m.role === "user" ? "#fff" : "#334155",
                border: m.role === "user" ? "none" : "1px solid #e2e8f0",
                borderRadius: 10,
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
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          padding: "10px 16px 12px",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: 0.6,
              textTransform: "uppercase",
              fontFamily: "var(--font-sans)",
              marginBottom: 4,
            }}
          >
            Planning Advisor
          </div>
          <textarea
            className="cl-bar-input"
            rows={1}
            value={text}
            placeholder="Ask about the plan, an item, or a trade-off…"
            onChange={(e) => setText(e.target.value)}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            style={{
              width: "100%",
              resize: "none",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              outline: "none",
              color: "#0f172a",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: 12,
            padding: "8px 4px",
            fontFamily: "var(--font-sans)",
          }}
        >
          {open ? "Hide" : "Show"}
        </button>
        <button
          onClick={() => void send()}
          disabled={sending || !text.trim()}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: sending || !text.trim() ? "#e2e8f0" : "#1d4ed8",
            color: sending || !text.trim() ? "#94a3b8" : "#fff",
            border: "none",
            cursor: sending || !text.trim() ? "default" : "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
