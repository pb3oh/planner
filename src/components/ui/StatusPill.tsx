"use client";

import { STATUS_LABEL, STATUS_PILL } from "@/lib/constants";

export function StatusPill({ status }: { status: string }) {
  const meta = STATUS_PILL[status] ?? STATUS_PILL.Backlog;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: meta.color,
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        borderRadius: 20,
        padding: "2px 8px",
        fontFamily: "var(--font-sans)",
        whiteSpace: "nowrap",
      }}
    >
      {STATUS_LABEL[status] ?? status.replaceAll("_", " ")}
    </span>
  );
}
