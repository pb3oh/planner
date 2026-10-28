"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SubmitPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [rawRequest, setRawRequest] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!rawRequest.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawRequest }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Submit failed");
        return;
      }
      router.push("/inbox");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#0f172a",
            fontFamily: "var(--font-sans)",
            margin: 0,
          }}
        >
          Submit a request
        </h1>
        <p
          style={{
            fontSize: 12,
            color: "#94a3b8",
            margin: "2px 0 0",
            fontFamily: "var(--font-sans)",
          }}
        >
          Paste a raw ask. AI shapes it into an FR draft for inbox review.
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "16px 18px",
        }}
      >
        <textarea
          value={rawRequest}
          onChange={(e) => setRawRequest(e.target.value)}
          rows={10}
          placeholder="What do you need, who is it for, and what does success look like?"
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            fontSize: 14,
            color: "#475569",
            fontFamily: "var(--font-sans)",
            resize: "vertical",
            lineHeight: 1.6,
            padding: 0,
            boxSizing: "border-box",
          }}
        />
        {error && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "#b91c1c",
              fontFamily: "var(--font-sans)",
            }}
          >
            {error}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <button
            onClick={() => void submit()}
            disabled={submitting || !rawRequest.trim()}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background:
                submitting || !rawRequest.trim() ? "#e2e8f0" : "#1d4ed8",
              color: submitting || !rawRequest.trim() ? "#94a3b8" : "#fff",
              border: "none",
              cursor: submitting || !rawRequest.trim() ? "default" : "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            {submitting ? "Shaping…" : "Shape with AI"}
          </button>
          <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "var(--font-sans)" }}>
            Submitting as {session?.user?.name ?? session?.user?.email ?? "you"}
          </span>
        </div>
      </div>
    </div>
  );
}
