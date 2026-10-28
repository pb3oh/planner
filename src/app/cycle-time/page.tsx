"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/ui/StatusPill";

type Row = {
  id: number;
  title: string;
  status: string;
  startedAt: string | null;
  total: string;
  totalMs: number;
  segments: { status: string; duration: string; durationMs: number }[];
};

export default function CycleTimePage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cycle-time")
      .then((r) => r.json())
      .then((data) => {
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
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
          Cycle time
        </h1>
        <p
          style={{
            fontSize: 12,
            color: "#94a3b8",
            margin: "2px 0 0",
            fontFamily: "var(--font-sans)",
          }}
        >
          Time in each status from the ItemEvent log
        </p>
      </div>

      {loading ? (
        <div style={{ color: "#94a3b8", fontFamily: "var(--font-sans)" }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((row) => (
            <div
              key={row.id}
              onClick={() => router.push(`/plan/${row.id}`)}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 9,
                padding: "12px 16px",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0f172a",
                    fontFamily: "var(--font-sans)",
                    flex: 1,
                  }}
                >
                  {row.title}
                </span>
                <StatusPill status={row.status} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#1d4ed8",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {row.total}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {row.segments.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 5,
                      padding: "2px 7px",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {s.status.replaceAll("_", " ")} {s.duration}
                  </span>
                ))}
                {row.segments.length === 0 && (
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>No events yet</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
