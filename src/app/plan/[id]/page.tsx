"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { StatusPill } from "@/components/ui/StatusPill";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { L0Tag } from "@/components/ui/L0Tag";
import { useHierarchy } from "@/hooks/useHierarchy";
import { EFFORT_WEEKS, STATUS_LABEL, PRIORITY_META, REPROMPT_FIELDS } from "@/lib/constants";
import { fmt } from "@/lib/utils";

type Item = {
  id: number; title: string; description: string; businessOutcome: string;
  successMetric: string; needByDate: string | null; effort: number; status: string;
  priority: string; score: number; btl: boolean; l0Id: string; l1Id: string | null;
  teamId: string | null; buSource: string | null; requester: string; requesterBU: string;
  inScope: boolean | null; scopeReason: string | null; aiRationale: string | null;
  risks: string[]; openQuestions: string[]; clarifyingAsk: string | null;
  effortRationale: string; effortConfirmed: boolean;
  startDate: string | null; endDate: string | null; jiraId: string | null;
  submittedAt: string | null;
};

const STATUS_ORDER = ["Needs_Review", "Accepted", "In_Progress", "Planned", "Backlog", "Out_of_Scope", "Blocked"];
const PRIORITY_ORDER = ["P0", "P1", "P2", "P3"];
const EFFORT_SIZES: [number, string][] = [[1, "XS"], [2, "S"], [3, "M"], [4, "L"], [5, "XL"]];

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { l0s } = useHierarchy();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const repromptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/items/${id}`)
      .then((r) => r.json())
      .then((data) => { setItem(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const patch = useCallback(async (fields: Partial<Item>) => {
    setSaving(true);
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const updated = await res.json();
    setItem(updated);
    setSaving(false);
  }, [id]);

  const runEval = useCallback(async () => {
    setEvaluating(true);
    const res = await fetch(`/api/items/${id}/evaluate`, { method: "POST" });
    const updated = await res.json();
    setItem(updated);
    setEvaluating(false);
  }, [id]);

  function onChange(field: string, value: unknown) {
    setItem((prev) => prev ? { ...prev, [field]: value } as Item : prev);
    if (repromptTimer.current) clearTimeout(repromptTimer.current);
    if (REPROMPT_FIELDS.includes(field as typeof REPROMPT_FIELDS[number])) {
      repromptTimer.current = setTimeout(() => {
        patch({ [field]: value }).then(() => runEval());
      }, 1500);
    } else {
      repromptTimer.current = setTimeout(() => patch({ [field]: value }), 800);
    }
  }

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", fontFamily: "var(--font-sans)" }}>Loading…</div>;
  if (!item) return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <div style={{ fontSize: 14, color: "#475569", fontFamily: "var(--font-sans)", marginBottom: 12 }}>Item not found</div>
      <button onClick={() => router.push("/plan")} style={{ fontSize: 13, color: "#1d4ed8", background: "none", border: "none", cursor: "pointer" }}>← Back to Plan</button>
    </div>
  );

  const pm = PRIORITY_META[item.priority] ?? PRIORITY_META.P3;
  // L1 options were computed in the original page (picker not rendered).
  void (item.l0Id ? (l0s.find((l) => l.id === item.l0Id)?.l1s ?? []) : []);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 24px 120px" }}>
      {/* Back nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        <button onClick={() => router.push("/plan")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#64748b", fontFamily: "var(--font-sans)", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
          ← Back to plan
        </button>
        {saving && <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "var(--font-sans)", marginLeft: "auto" }}>Saving…</span>}
      </div>

      {/* ── Header card ───────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderLeft: `4px solid ${pm.accent}`,
        borderRadius: 12,
        padding: "18px 20px",
        marginBottom: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <StatusPill status={item.status} />
          <span style={{ fontSize: 12, fontWeight: 600, color: pm.color, background: pm.subtle, padding: "3px 9px", borderRadius: 20, fontFamily: "var(--font-sans)" }}>
            {item.priority} {pm.text}
          </span>
          <L0Tag l0Id={item.l0Id} l1Id={item.l1Id ?? undefined} teamId={item.teamId ?? undefined} />
          <div style={{ marginLeft: "auto" }}>
            <ScoreRing score={item.score} />
          </div>
        </div>
        <input
          value={item.title}
          onChange={(e) => onChange("title", e.target.value)}
          style={{ width: "100%", border: "none", outline: "none", fontSize: 24, fontWeight: 800, color: "#0f172a", fontFamily: "var(--font-sans)", background: "transparent", padding: 0, boxSizing: "border-box", letterSpacing: -0.3 }}
        />
        <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "var(--font-sans)", marginTop: 6 }}>
          {item.requester || "—"}
          {item.requesterBU ? ` · ${item.requesterBU}` : ""}
          {item.submittedAt ? ` · submitted ${fmt(item.submittedAt)}` : ""}
        </div>
      </div>

      {/* ── Description card ──────────────────────────────────────────────── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
        <textarea
          value={item.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          placeholder="Description…"
          style={{ width: "100%", border: "none", outline: "none", fontSize: 14, color: "#475569", fontFamily: "var(--font-sans)", background: "transparent", resize: "vertical", lineHeight: 1.6, padding: 0, boxSizing: "border-box" }}
        />
      </div>

      {/* ── Business Outcome + Success Metric ─────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <InfoCard label="BUSINESS OUTCOME">
          <textarea
            value={item.businessOutcome}
            onChange={(e) => onChange("businessOutcome", e.target.value)}
            rows={2}
            placeholder="Business outcome…"
            style={inlineTextarea}
          />
        </InfoCard>
        <InfoCard label="SUCCESS METRIC">
          <textarea
            value={item.successMetric}
            onChange={(e) => onChange("successMetric", e.target.value)}
            rows={2}
            placeholder="Success metric…"
            style={inlineTextarea}
          />
        </InfoCard>
      </div>

      {/* ── Need-by + Effort ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {/* Need-by */}
        <InfoCard label="NEED-BY">
          {item.needByDate ? (
            <div style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", fontFamily: "var(--font-sans)" }}>
              {fmt(item.needByDate)}
            </div>
          ) : (
            <div style={{ fontSize: 14, color: "#94a3b8", fontFamily: "var(--font-sans)" }}>Not set</div>
          )}
          <input
            type="date"
            value={item.needByDate ?? ""}
            onChange={(e) => onChange("needByDate", e.target.value || null)}
            style={{ marginTop: 6, fontSize: 11, color: "#94a3b8", fontFamily: "var(--font-mono)", border: "none", outline: "none", background: "transparent", cursor: "pointer" }}
          />
        </InfoCard>

        {/* Effort — special amber card */}
        <div style={{
          background: item.effortConfirmed ? "#fff" : "#fffbeb",
          border: `1px solid ${item.effortConfirmed ? "#e2e8f0" : "#fde68a"}`,
          borderRadius: 10,
          padding: "14px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.8, textTransform: "uppercase", fontFamily: "var(--font-sans)" }}>EFFORT</div>
            {!item.effortConfirmed && (
              <span style={{ fontSize: 9, fontWeight: 700, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", borderRadius: 4, padding: "1px 6px", fontFamily: "var(--font-sans)" }}>
                AI estimate
              </span>
            )}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#92400e", fontFamily: "var(--font-sans)", marginBottom: 2 }}>
            {EFFORT_SIZES.find(([k]) => k === item.effort)?.[1] ?? "M"} · ~{EFFORT_WEEKS[item.effort] ?? 4}wks
          </div>
          {item.effortRationale && (
            <div style={{ fontSize: 11, color: "#b45309", fontFamily: "var(--font-sans)", marginBottom: 8, lineHeight: 1.4 }}>
              {item.effortRationale}
            </div>
          )}
          <div style={{ display: "flex", gap: 4 }}>
            {EFFORT_SIZES.map(([k, label]) => (
              <button
                key={k}
                onClick={() => { onChange("effort", k); onChange("effortConfirmed", true); }}
                style={{
                  flex: 1, padding: "4px 0", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  border: `1px solid ${item.effort === k ? "#92400e" : "#fde68a"}`,
                  background: item.effort === k ? "#92400e" : "transparent",
                  color: item.effort === k ? "#fff" : "#92400e",
                  cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.1s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Schedule ──────────────────────────────────────────────────────── */}
      <InfoCard label="SCHEDULE" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontFamily: "var(--font-mono)", color: "#1d4ed8", fontWeight: 600 }}>
          {item.startDate && item.endDate
            ? `${item.startDate} → ${item.endDate}`
            : "Not scheduled → —"}
        </div>
      </InfoCard>

      {/* ── AI Evaluation ─────────────────────────────────────────────────── */}
      <div style={{
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: 12,
        padding: "16px 18px",
        marginBottom: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", letterSpacing: 0.8, textTransform: "uppercase", fontFamily: "var(--font-sans)" }}>
            AI EVALUATION
          </div>
          <button
            onClick={runEval}
            disabled={evaluating}
            style={{ padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, background: evaluating ? "#e2e8f0" : "#1d4ed8", color: evaluating ? "#94a3b8" : "#fff", border: "none", cursor: evaluating ? "default" : "pointer", fontFamily: "var(--font-sans)" }}
          >
            {evaluating ? "Evaluating…" : "Re-evaluate"}
          </button>
        </div>

        {item.scopeReason && (
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "#475569", fontFamily: "var(--font-sans)" }}>Scope: </span>
            <span style={{ fontSize: 13, color: item.inScope ? "#059669" : "#dc2626", fontFamily: "var(--font-sans)", fontWeight: 500 }}>
              {item.scopeReason}
            </span>
          </div>
        )}
        {item.aiRationale && (
          <div style={{ fontSize: 13, color: "#475569", fontFamily: "var(--font-sans)", lineHeight: 1.5, marginBottom: 10 }}>
            {item.aiRationale}
          </div>
        )}

        {/* Risks + Open Questions 2-col */}
        {(item.risks.length > 0 || item.openQuestions.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 4 }}>
            {item.risks.length > 0 && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", letterSpacing: 1, textTransform: "uppercase", fontFamily: "var(--font-sans)", marginBottom: 6 }}>RISKS</div>
                {item.risks.map((r, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#dc2626", fontFamily: "var(--font-sans)", marginBottom: 4, display: "flex", gap: 5 }}>
                    <span>⚠</span><span>{r}</span>
                  </div>
                ))}
              </div>
            )}
            {item.openQuestions.length > 0 && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#d97706", letterSpacing: 1, textTransform: "uppercase", fontFamily: "var(--font-sans)", marginBottom: 6 }}>OPEN QUESTIONS</div>
                {item.openQuestions.map((q, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#d97706", fontFamily: "var(--font-sans)", marginBottom: 4, display: "flex", gap: 5 }}>
                    <span>?</span><span>{q}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {evaluating && (
          <div style={{ marginTop: 8, fontSize: 11, color: "#6366f1", fontFamily: "var(--font-sans)", display: "flex", gap: 5 }}>
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
            AI is re-evaluating…
          </div>
        )}
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.8, textTransform: "uppercase", fontFamily: "var(--font-sans)", marginBottom: 14 }}>
          ACTIONS
        </div>

        {/* Effort confirmation prompt (if not confirmed) */}
        {!item.effortConfirmed && (
          <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", fontFamily: "var(--font-sans)", marginBottom: 4, display: "flex", gap: 6 }}>
              <span>⊘</span> Confirm effort before accepting
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "var(--font-sans)", marginBottom: 10 }}>
              AI estimated <strong style={{ color: "#f59e0b" }}>{EFFORT_SIZES.find(([k]) => k === item.effort)?.[1]} · ~{EFFORT_WEEKS[item.effort] ?? 4}wks</strong>
              {item.effortRationale ? `. "${item.effortRationale}"` : ""}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {EFFORT_SIZES.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => { onChange("effort", k); onChange("effortConfirmed", true); }}
                  style={{
                    flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${item.effort === k ? "#f59e0b" : "#334155"}`,
                    background: item.effort === k ? "transparent" : "transparent",
                    color: item.effort === k ? "#f59e0b" : "#64748b",
                    cursor: "pointer", fontFamily: "var(--font-sans)",
                    outline: item.effort === k ? "1px solid #f59e0b" : "none",
                    transition: "all 0.1s",
                  }}
                >
                  {`${label} ~${EFFORT_WEEKS[k as number] ?? "?"}w`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#64748b", fontFamily: "var(--font-sans)", marginBottom: 8 }}>Status</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STATUS_ORDER.map((s) => {
              const active = item.status === s;
              return (
                <button
                  key={s}
                  onClick={() => onChange("status", s)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    border: `1px solid ${active ? "#6366f1" : "#e2e8f0"}`,
                    background: active ? "#eef2ff" : "transparent",
                    color: active ? "#4338ca" : "#475569",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "all 0.1s",
                  }}
                >
                  {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4338ca", flexShrink: 0 }} />}
                  {STATUS_LABEL[s] ?? s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority */}
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontFamily: "var(--font-sans)", marginBottom: 8 }}>Priority</div>
          <div style={{ display: "flex", gap: 6 }}>
            {PRIORITY_ORDER.map((p) => {
              const active = item.priority === p;
              const pm2 = PRIORITY_META[p];
              return (
                <button
                  key={p}
                  onClick={() => onChange("priority", p)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    border: `1px solid ${active ? pm2.accent : "#e2e8f0"}`,
                    background: active ? pm2.subtle : "transparent",
                    color: active ? pm2.color : "#94a3b8",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    transition: "all 0.1s",
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom action buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              // Focus the CLBar input
              const el = document.querySelector<HTMLTextAreaElement>(".cl-bar-input");
              if (el) { el.focus(); el.value = `Tell me about item #${item.id}: ${item.title}`; el.dispatchEvent(new Event("input", { bubbles: true })); }
            }}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", cursor: "pointer", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <span style={{ color: "#6366f1" }}>ℹ</span> Ask Planning Advisor about this item
          </button>
          <button
            onClick={() => {
              if (item.jiraId) window.open(`#jira/${item.jiraId}`, "_blank");
            }}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#1d4ed8", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <span>◆</span> Push to Jira →
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", ...style }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.8, textTransform: "uppercase", fontFamily: "var(--font-sans)", marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const inlineTextarea: React.CSSProperties = {
  width: "100%", border: "none", outline: "none", fontSize: 13, color: "#475569",
  fontFamily: "var(--font-sans)", background: "transparent", resize: "vertical",
  lineHeight: 1.5, padding: 0, boxSizing: "border-box",
};
