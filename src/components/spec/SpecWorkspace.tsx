"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { computeCycleTime, formatDuration } from "@/lib/cycleTime";

type Ac = { id?: string; given: string; when: string; then: string };
type Task = { id: string; title: string; description: string; acId: string | null };
type Turn = { id: string; role: string; content: string };
type Check = { id: string; label: string; passed: boolean; detail: string };
type EventRow = {
  id: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  createdAt: string;
};

type Spec = {
  id: string;
  status: string;
  problem: string;
  outcome: string;
  successMetric: string;
  scope: string;
  nonGoals: string;
  constraints: string;
  risks: string[];
  openQuestions: string[];
  acceptanceCriteria: Ac[];
  tasks: Task[];
  interviewTurns: Turn[];
  dor: { ready: boolean; checks: Check[]; missing: Check[] };
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e2e8f0",
  borderRadius: 7,
  padding: "8px 10px",
  fontSize: 13,
  fontFamily: "var(--font-sans)",
  color: "#334155",
  boxSizing: "border-box",
};

export function SpecWorkspace({
  itemId,
  events = [],
}: {
  itemId: number;
  events?: EventRow[];
}) {
  const [spec, setSpec] = useState<Spec | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/specs/${itemId}`);
    if (res.ok) setSpec(await res.json());
  }, [itemId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch spec for this item
    void load();
  }, [load]);

  async function save(patch: Partial<Spec>) {
    setBusy("save");
    const res = await fetch(`/api/specs/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) setSpec(await res.json());
    setBusy(null);
  }

  async function interview() {
    if (!message.trim()) return;
    setBusy("interview");
    setError(null);
    const res = await fetch(`/api/specs/${itemId}/interview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Interview failed");
    else {
      setSpec(data.spec);
      setMessage("");
    }
    setBusy(null);
  }

  async function decompose() {
    setBusy("decompose");
    setError(null);
    const res = await fetch(`/api/specs/${itemId}/decompose`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Decompose blocked");
    else setSpec(data);
    setBusy(null);
  }

  function download(format: string) {
    window.open(`/api/specs/${itemId}/export?format=${format}`, "_blank");
  }

  if (!spec) {
    return (
      <div style={{ marginTop: 12, color: "#94a3b8", fontSize: 13, fontFamily: "var(--font-sans)" }}>
        Loading spec…
      </div>
    );
  }

  const dor = spec.dor;

  return (
    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Definition of Ready */}
      <div
        style={{
          background: dor.ready ? "#ecfdf5" : "#fffbeb",
          border: `1px solid ${dor.ready ? "#a7f3d0" : "#fde68a"}`,
          borderRadius: 12,
          padding: "16px 18px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: dor.ready ? "#047857" : "#b45309",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontFamily: "var(--font-sans)",
            marginBottom: 10,
          }}
        >
          Definition of Ready {dor.ready ? "— passed" : "— blocked"}
        </div>
        {dor.checks.map((c) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              gap: 8,
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              color: c.passed ? "#047857" : "#92400e",
              marginBottom: 4,
            }}
          >
            <span>{c.passed ? "✓" : "○"}</span>
            <span>
              <strong>{c.label}</strong>
              <span style={{ color: "#64748b", fontWeight: 400 }}> — {c.detail}</span>
            </span>
          </div>
        ))}
        <button
          onClick={() => void decompose()}
          disabled={!dor.ready || busy === "decompose"}
          style={{
            marginTop: 12,
            padding: "7px 14px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            border: "none",
            background: !dor.ready ? "#e2e8f0" : "#1d4ed8",
            color: !dor.ready ? "#94a3b8" : "#fff",
            cursor: !dor.ready ? "default" : "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          {busy === "decompose" ? "Decomposing…" : "Decompose into tasks"}
        </button>
      </div>

      {/* Interview */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "16px 18px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#94a3b8",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontFamily: "var(--font-sans)",
            marginBottom: 10,
          }}
        >
          Spec interview
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
          {spec.interviewTurns.map((t) => (
            <div
              key={t.id}
              style={{
                alignSelf: t.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "90%",
                background: t.role === "user" ? "#1d4ed8" : "#f8fafc",
                color: t.role === "user" ? "#fff" : "#334155",
                border: t.role === "user" ? "none" : "1px solid #e2e8f0",
                borderRadius: 9,
                padding: "8px 12px",
                fontSize: 13,
                fontFamily: "var(--font-sans)",
                whiteSpace: "pre-wrap",
              }}
            >
              {t.content}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void interview();
            }}
            placeholder="Answer the next clarifying question…"
            style={{ ...fieldStyle, flex: 1 }}
          />
          <button
            onClick={() => void interview()}
            disabled={busy === "interview"}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              background: "#1d4ed8",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            {busy === "interview" ? "…" : "Send"}
          </button>
        </div>
      </div>

      {/* Spec fields */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "16px 18px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#94a3b8",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontFamily: "var(--font-sans)",
            marginBottom: 12,
          }}
        >
          Spec
        </div>
        {(
          [
            ["problem", "Problem"],
            ["outcome", "Outcome"],
            ["successMetric", "Success metric"],
            ["scope", "In-scope"],
            ["nonGoals", "Non-goals"],
            ["constraints", "Constraints"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} style={{ display: "block", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
              {label}
            </div>
            <textarea
              rows={2}
              value={spec[key]}
              onChange={(e) => setSpec({ ...spec, [key]: e.target.value })}
              onBlur={() => void save({ [key]: spec[key] })}
              style={fieldStyle}
            />
          </label>
        ))}
        <label style={{ display: "block", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
            Risks (one per line)
          </div>
          <textarea
            rows={2}
            value={spec.risks.join("\n")}
            onChange={(e) =>
              setSpec({ ...spec, risks: e.target.value.split("\n") })
            }
            onBlur={() =>
              void save({
                risks: spec.risks.map((r) => r.trim()).filter(Boolean),
              } as Partial<Spec>)
            }
            style={fieldStyle}
          />
        </label>
        <label style={{ display: "block" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
            Open questions (leave empty when resolved)
          </div>
          <textarea
            rows={2}
            value={spec.openQuestions.join("\n")}
            onChange={(e) =>
              setSpec({ ...spec, openQuestions: e.target.value.split("\n") })
            }
            onBlur={() =>
              void save({
                openQuestions: spec.openQuestions.map((r) => r.trim()).filter(Boolean),
              } as Partial<Spec>)
            }
            style={fieldStyle}
          />
        </label>
      </div>

      {/* ACs */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "16px 18px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#94a3b8",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontFamily: "var(--font-sans)",
            marginBottom: 10,
          }}
        >
          Acceptance criteria
        </div>
        {spec.acceptanceCriteria.map((ac, i) => (
          <div
            key={ac.id ?? i}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              color: "#334155",
            }}
          >
            <div><strong>Given</strong> {ac.given}</div>
            <div><strong>When</strong> {ac.when}</div>
            <div><strong>Then</strong> {ac.then}</div>
          </div>
        ))}
        <AddAc
          onAdd={(ac) =>
            void save({
              acceptanceCriteria: [...spec.acceptanceCriteria, ac],
            } as Partial<Spec>)
          }
        />
      </div>

      {/* Tasks */}
      {spec.tasks.length > 0 && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              fontFamily: "var(--font-sans)",
              marginBottom: 10,
            }}
          >
            Agent tasks
          </div>
          {spec.tasks.map((t, i) => (
            <div
              key={t.id}
              style={{
                fontSize: 13,
                fontFamily: "var(--font-sans)",
                color: "#334155",
                padding: "8px 0",
                borderTop: i ? "1px solid #f1f5f9" : "none",
              }}
            >
              <div style={{ fontWeight: 600 }}>{t.title}</div>
              {t.description && (
                <div style={{ fontSize: 12, color: "#64748b", whiteSpace: "pre-wrap" }}>
                  {t.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Export */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "16px 18px",
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#94a3b8",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontFamily: "var(--font-sans)",
            width: "100%",
            marginBottom: 4,
          }}
        >
          Export
        </span>
        {[
          ["openspec", "OpenSpec .md"],
          ["jira-csv", "Jira CSV"],
          ["jira-json", "Jira JSON"],
          ["gherkin", "Gherkin .feature"],
        ].map(([fmt, label]) => (
          <button
            key={fmt}
            onClick={() => download(fmt)}
            style={{
              padding: "6px 12px",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
              background: "#fff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Cycle time */}
      <CycleTimeModule events={events} />

      {error && (
        <div style={{ fontSize: 12, color: "#b91c1c", fontFamily: "var(--font-sans)" }}>{error}</div>
      )}
    </div>
  );
}

function CycleTimeModule({ events }: { events: EventRow[] }) {
  const cycle = useMemo(
    () =>
      computeCycleTime(
        events.filter((e) => e.type === "status_change" && e.toStatus)
      ),
    [events]
  );

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#94a3b8",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontFamily: "var(--font-sans)",
          }}
        >
          Cycle time
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#1d4ed8",
            fontFamily: "var(--font-mono)",
          }}
        >
          {formatDuration(cycle.totalMs)}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: events.length ? 10 : 0 }}>
        {cycle.segments.map((s, i) => (
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
            {s.status.replaceAll("_", " ")} {formatDuration(s.durationMs)}
          </span>
        ))}
        {cycle.segments.length === 0 && (
          <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "var(--font-sans)" }}>
            No status transitions yet
          </span>
        )}
      </div>
      {events.map((e) => (
        <div
          key={e.id}
          style={{
            fontSize: 12,
            fontFamily: "var(--font-sans)",
            color: "#475569",
            marginBottom: 4,
          }}
        >
          {new Date(e.createdAt).toLocaleString()} — {e.fromStatus ?? "new"} → {e.toStatus ?? e.type}
        </div>
      ))}
    </div>
  );
}

function AddAc({ onAdd }: { onAdd: (ac: Ac) => void }) {
  const [given, setGiven] = useState("");
  const [when, setWhen] = useState("");
  const [then, setThen] = useState("");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 6 }}>
      <input placeholder="Given" value={given} onChange={(e) => setGiven(e.target.value)} style={fieldStyle} />
      <input placeholder="When" value={when} onChange={(e) => setWhen(e.target.value)} style={fieldStyle} />
      <input placeholder="Then" value={then} onChange={(e) => setThen(e.target.value)} style={fieldStyle} />
      <button
        onClick={() => {
          if (!given || !when || !then) return;
          onAdd({ given, when, then });
          setGiven("");
          setWhen("");
          setThen("");
        }}
        style={{
          padding: "8px 10px",
          borderRadius: 7,
          fontSize: 12,
          fontWeight: 600,
          background: "#f1f5f9",
          border: "1px solid #e2e8f0",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
        }}
      >
        Add
      </button>
    </div>
  );
}
