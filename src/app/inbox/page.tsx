"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { fmt } from "@/lib/utils";

type FRDraft = {
  id: number;
  title: string;
  rawRequest: string;
  summary: string;
  status: string;
  submittedAt: string;
  approvedAt: string | null;
  submittedBy: {
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
};

export default function InboxPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [drafts, setDrafts] = useState<FRDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [acting, setActing] = useState<number | null>(null);

  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "super_admin";

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) {
      router.replace("/plan");
      return;
    }
    fetch("/api/drafts")
      .then((r) => r.json())
      .then((data) => { setDrafts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status, isAdmin, router]);

  async function decide(id: number, status: "approved" | "rejected") {
    setActing(id);
    const res = await fetch(`/api/drafts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setDrafts((prev) => prev.map((d) => (d.id === id ? updated : d)));
    setActing(null);
  }

  const filtered = drafts.filter((d) => d.status === filter);

  const counts = {
    pending: drafts.filter((d) => d.status === "pending").length,
    approved: drafts.filter((d) => d.status === "approved").length,
    rejected: drafts.filter((d) => d.status === "rejected").length,
  };

  if (status === "loading" || !isAdmin) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", fontFamily: "var(--font-sans)" }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", fontFamily: "var(--font-sans)", margin: 0 }}>
            Inbox
          </h1>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0", fontFamily: "var(--font-sans)" }}>
            Feature requests for the planner — approve to create a plan item
          </p>
        </div>
        <Link
          href="/admin/users"
          style={{
            padding: "7px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            color: "#1d4ed8",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            textDecoration: "none",
            fontFamily: "var(--font-sans)",
            whiteSpace: "nowrap",
          }}
        >
          Manage users
        </Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f1f5f9", padding: 4, borderRadius: 8, width: "fit-content" }}>
        {(["pending", "approved", "rejected"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: "5px 14px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: filter === tab ? "#fff" : "transparent",
              color: filter === tab ? "#0f172a" : "#64748b",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              boxShadow: filter === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {counts[tab] > 0 && (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                background: tab === "pending" ? "#a855f7" : tab === "approved" ? "#10b981" : "#ef4444",
                color: "#fff",
                borderRadius: 10,
                padding: "0 5px",
                lineHeight: "16px",
                display: "inline-block",
              }}>
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Draft list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 100, background: "#f1f5f9", borderRadius: 9, animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", color: "#94a3b8", fontFamily: "var(--font-sans)" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
            No {filter} items
          </div>
          <div style={{ fontSize: 12 }}>
            {filter === "pending" ? "All caught up!" : `Nothing ${filter} yet.`}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              isAdmin={isAdmin}
              acting={acting === draft.id}
              onApprove={() => decide(draft.id, "approved")}
              onReject={() => decide(draft.id, "rejected")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DraftCard({
  draft,
  isAdmin,
  acting,
  onApprove,
  onReject,
}: {
  draft: FRDraft;
  isAdmin: boolean;
  acting: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = {
    pending: "#a855f7",
    approved: "#10b981",
    rejected: "#ef4444",
  }[draft.status] ?? "#94a3b8";

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderLeft: `3px solid ${statusColor}`,
      borderRadius: 9,
      padding: "14px 16px",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "var(--font-sans)" }}>
              {draft.title}
            </span>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: statusColor,
              background: statusColor + "18",
              border: `1px solid ${statusColor}40`,
              borderRadius: 4,
              padding: "1px 6px",
              letterSpacing: 0.5,
              flexShrink: 0,
              textTransform: "uppercase",
              fontFamily: "var(--font-sans)",
            }}>
              {draft.status}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {draft.submittedBy && (
              <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "var(--font-sans)" }}>
                By {draft.submittedBy.name ?? draft.submittedBy.email}
              </span>
            )}
            <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "var(--font-sans)" }}>
              {fmt(draft.submittedAt)}
            </span>
            {draft.approvedAt && (
              <span style={{ fontSize: 11, color: "#10b981", fontFamily: "var(--font-sans)" }}>
                · Approved {fmt(draft.approvedAt)}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded((o) => !o)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            color: "#94a3b8",
            padding: "2px 6px",
            borderRadius: 5,
            fontFamily: "var(--font-sans)",
            flexShrink: 0,
          }}
        >
          {expanded ? "▲ Less" : "▼ More"}
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ marginTop: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 7 }}>
          {draft.summary && (
            <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", fontFamily: "var(--font-sans)", marginBottom: 6 }}>
              {draft.summary}
            </div>
          )}
          {draft.rawRequest && (
            <div style={{ fontSize: 11, color: "#64748b", fontFamily: "var(--font-sans)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {draft.rawRequest}
            </div>
          )}
        </div>
      )}

      {/* Admin action buttons */}
      {isAdmin && draft.status === "pending" && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={onApprove}
            disabled={acting}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: acting ? "#e2e8f0" : "#ecfdf5",
              color: acting ? "#94a3b8" : "#065f46",
              border: "1px solid",
              borderColor: acting ? "#e2e8f0" : "#a7f3d0",
              cursor: acting ? "default" : "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s",
            }}
          >
            ✓ Approve
          </button>
          <button
            onClick={onReject}
            disabled={acting}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: acting ? "#e2e8f0" : "#fef2f2",
              color: acting ? "#94a3b8" : "#991b1b",
              border: "1px solid",
              borderColor: acting ? "#e2e8f0" : "#fecaca",
              cursor: acting ? "default" : "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s",
            }}
          >
            ✕ Reject
          </button>
        </div>
      )}
    </div>
  );
}
