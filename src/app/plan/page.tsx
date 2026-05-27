"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useHierarchy } from "@/hooks/useHierarchy";
import { StatusPill } from "@/components/ui/StatusPill";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { L0Tag } from "@/components/ui/L0Tag";
import { EFFORT_SHORT, PRIORITY_META, STATUS_LABEL } from "@/lib/constants";
import { fmt } from "@/lib/utils";

type Item = {
  id: number;
  title: string;
  status: string;
  priority: string;
  effort: number;
  score: number;
  needByDate: string | null;
  btl: boolean;
  l0Id: string;
  l1Id: string | null;
  teamId: string | null;
  l0?: { name: string; color: string };
  l1?: { name: string } | null;
  team?: { name: string } | null;
};

export default function PlanPage() {
  const router = useRouter();
  const { l0s } = useHierarchy();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [btlOpen, setBtlOpen] = useState(false);

  const [selL0, setSelL0] = useState<string | null>(null);
  const [selL1, setSelL1] = useState<string | null>(null);
  const [selTeam, setSelTeam] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selL0) params.set("l0Id", selL0);
    if (selL1) params.set("l1Id", selL1);
    if (selTeam) params.set("teamId", selTeam);
    const res = await fetch(`/api/items?${params}`);
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }, [selL0, selL1, selTeam]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const l1s = selL0 ? (l0s.find((l) => l.id === selL0)?.l1s ?? []) : [];
  const teams = selL1 ? (l1s.find((l) => l.id === selL1)?.teams ?? []) : [];

  const atl = items.filter((i) => !i.btl);
  const btl = items.filter((i) => i.btl);

  const needsReview = atl.filter((i) => i.status === "Needs_Review");
  const rest = atl.filter((i) => i.status !== "Needs_Review").sort((a, b) => b.score - a.score);
  const sortedAtl = [...needsReview, ...rest];

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const body: Record<string, string> = {};
      if (selL0) body.l0Id = selL0;
      if (selL1) body.l1Id = selL1;
      if (selTeam) body.teamId = selTeam;
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setExportError((data as Record<string,string>).error ?? "Export failed");
        return;
      }
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", fontFamily: "var(--font-sans)", margin: 0 }}>
            Plan
          </h1>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0", fontFamily: "var(--font-sans)" }}>
            {atl.length} ATL · {btl.length} BTL
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {exportError && (
            <span style={{ fontSize: 12, color: "#ef4444", fontFamily: "var(--font-sans)", maxWidth: 220 }}>
              {exportError}
            </span>
          )}
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              background: exporting ? "#e2e8f0" : "#1d4ed8",
              color: exporting ? "#94a3b8" : "#fff",
              border: "none",
              cursor: exporting ? "default" : "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s",
            }}
          >
            {exporting ? (
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>↻</span>
            ) : (
              <span>↑</span>
            )}
            Generate Slides
          </button>
        </div>
      </div>

      {/* 3-tier filter bar */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
        {/* L0 pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: l0s.length ? 10 : 0 }}>
          <button
            onClick={() => { setSelL0(null); setSelL1(null); setSelTeam(null); }}
            style={{
              padding: "5px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              border: "1px solid",
              borderColor: selL0 === null ? "#1d4ed8" : "#e2e8f0",
              background: selL0 === null ? "#eff6ff" : "#f8fafc",
              color: selL0 === null ? "#1d4ed8" : "#64748b",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s",
            }}
          >
            All
          </button>
          {l0s.map((l0) => (
            <button
              key={l0.id}
              onClick={() => { setSelL0(l0.id === selL0 ? null : l0.id); setSelL1(null); setSelTeam(null); }}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                border: "1px solid",
                borderColor: selL0 === l0.id ? l0.color : "#e2e8f0",
                background: selL0 === l0.id ? l0.color + "18" : "#f8fafc",
                color: selL0 === l0.id ? l0.color : "#64748b",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: l0.color, flexShrink: 0 }} />
              {l0.name}
            </button>
          ))}
        </div>

        {/* L1 chips */}
        {selL0 && l1s.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
            {l1s.map((l1) => (
              <button
                key={l1.id}
                onClick={() => { setSelL1(l1.id === selL1 ? null : l1.id); setSelTeam(null); }}
                style={{
                  padding: "3px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  border: "1px solid",
                  borderColor: selL1 === l1.id ? "#475569" : "#e2e8f0",
                  background: selL1 === l1.id ? "#1e293b" : "#f8fafc",
                  color: selL1 === l1.id ? "#fff" : "#64748b",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  transition: "all 0.15s",
                }}
              >
                {l1.name}
              </button>
            ))}
          </div>
        )}

        {/* Team chips */}
        {teams.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {teams.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelTeam(t.id === selTeam ? null : t.id)}
                style={{
                  padding: "2px 9px",
                  borderRadius: 5,
                  fontSize: 11,
                  fontWeight: 500,
                  border: "1px solid",
                  borderColor: selTeam === t.id ? "#6366f1" : "#e2e8f0",
                  background: selTeam === t.id ? "#eef2ff" : "transparent",
                  color: selTeam === t.id ? "#4338ca" : "#94a3b8",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  transition: "all 0.15s",
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ATL list */}
      {loading ? (
        <LoadingSkeleton />
      ) : sortedAtl.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sortedAtl.map((item) => (
            <ItemRow key={item.id} item={item} onClick={() => router.push(`/plan/${item.id}`)} />
          ))}
        </div>
      )}

      {/* BTL section */}
      {!loading && btl.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => setBtlOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 0",
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
              fontFamily: "var(--font-sans)",
              letterSpacing: 0.5,
            }}
          >
            <span style={{ fontSize: 10, transition: "transform 0.15s", display: "inline-block", transform: btlOpen ? "rotate(90deg)" : "none" }}>▶</span>
            BELOW THE LINE ({btl.length})
          </button>
          {btlOpen && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6, opacity: 0.75 }}>
              {btl.map((item) => (
                <ItemRow key={item.id} item={item} onClick={() => router.push(`/plan/${item.id}`)} dimmed />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, onClick, dimmed }: { item: Item; onClick: () => void; dimmed?: boolean }) {
  const pm = PRIORITY_META[item.priority] ?? PRIORITY_META.P3;
  const isNeedsReview = item.status === "Needs_Review";

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        background: "#fff",
        border: `1px solid ${isNeedsReview ? "#e9d5ff" : "#e2e8f0"}`,
        borderLeft: `3px solid ${isNeedsReview ? "#a855f7" : pm.accent}`,
        borderRadius: 9,
        cursor: "pointer",
        transition: "box-shadow 0.15s, border-color 0.15s",
        opacity: dimmed ? 0.65 : 1,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      <ScoreRing score={item.score} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#0f172a",
            fontFamily: "var(--font-sans)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {item.title}
          </span>
          {isNeedsReview && (
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              background: "#faf5ff",
              color: "#7c3aed",
              border: "1px solid #e9d5ff",
              borderRadius: 4,
              padding: "1px 5px",
              letterSpacing: 0.5,
              flexShrink: 0,
            }}>REVIEW</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <L0Tag l0Id={item.l0Id} l1Id={item.l1Id ?? undefined} teamId={item.teamId ?? undefined} />
          <StatusPill status={item.status} />
          {item.needByDate && (
            <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "var(--font-sans)" }}>
              Due {fmt(item.needByDate)}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {/* Priority badge */}
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: pm.color,
          background: pm.subtle,
          padding: "2px 7px",
          borderRadius: 5,
          fontFamily: "var(--font-mono)",
        }}>
          {item.priority}
        </span>
        {/* Effort badge */}
        <span style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#64748b",
          background: "#f1f5f9",
          padding: "2px 7px",
          borderRadius: 5,
          fontFamily: "var(--font-mono)",
        }}>
          {EFFORT_SHORT[item.effort] ?? "?"}
        </span>
        <span style={{ fontSize: 16, color: "#cbd5e1" }}>›</span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ height: 72, background: "#f1f5f9", borderRadius: 9, animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 24px", color: "#94a3b8", fontFamily: "var(--font-sans)" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 4 }}>No items found</div>
      <div style={{ fontSize: 12 }}>Try adjusting the filters above</div>
    </div>
  );
}
