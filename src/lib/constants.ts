export const CLAUDE_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929";

export const EFFORT_SHORT: Record<number, string> = {
  1: "XS",
  2: "S",
  3: "M",
  4: "L",
  5: "XL",
};

export const EFFORT_MAP: Record<number, string> = {
  1: "XS · ~1 wk",
  2: "S · ~2 wks",
  3: "M · ~4 wks",
  4: "L · ~6 wks",
  5: "XL · ~10 wks",
};

export const EFFORT_WEEKS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 6,
  5: 10,
};

export const STATUS_LABEL: Record<string, string> = {
  Needs_Review: "Needs Review",
  Accepted: "Accepted",
  In_Progress: "In Progress",
  Planned: "Planned",
  Backlog: "Backlog",
  Out_of_Scope: "Out of Scope",
  Blocked: "Blocked",
};

export const PRIORITY_META: Record<
  string,
  { text: string; color: string; accent: string; subtle: string }
> = {
  P0: { text: "Critical", color: "#b91c1c", accent: "#dc2626", subtle: "#fef2f2" },
  P1: { text: "High", color: "#c2410c", accent: "#ea580c", subtle: "#fff7ed" },
  P2: { text: "Medium", color: "#1d4ed8", accent: "#2563eb", subtle: "#eff6ff" },
  P3: { text: "Low", color: "#475569", accent: "#64748b", subtle: "#f8fafc" },
};

export const BU_OPTIONS = [
  "Platform",
  "Growth",
  "Data",
  "Trust",
  "Internal",
];

export const REPROMPT_FIELDS = [
  "title",
  "description",
  "businessOutcome",
  "successMetric",
] as const;

export const STATUS_PILL: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  Needs_Review: { color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" },
  Accepted: { color: "#047857", bg: "#ecfdf5", border: "#a7f3d0" },
  In_Progress: { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  Planned: { color: "#4338ca", bg: "#eef2ff", border: "#c7d2fe" },
  Backlog: { color: "#475569", bg: "#f8fafc", border: "#e2e8f0" },
  Out_of_Scope: { color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
  Blocked: { color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
};
